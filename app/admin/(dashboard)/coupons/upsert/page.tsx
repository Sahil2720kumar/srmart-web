'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  useCoupon,
  useCreateCoupon,
  useUpdateCoupon,
  useCategories,
  useSubCategories,
  useVendors,
  useProducts,
  type CouponInsert,
  type ApplicableTo,
  useSubCategoriesByCategory,
} from '@/hooks';

const supabase = createClient();



// ─────────────────────────────────────────────
// Form state
// ─────────────────────────────────────────────

const blankForm = {
  code:                   '',
  description:            '',
  is_active:              true,
  includes_free_delivery: false,
  discount_type:          'percentage' as 'percentage' | 'flat',
  discount_value:         0,
  max_discount_amount:    undefined as number | undefined,
  min_order_amount:       0,
  applicable_to:          'all' as ApplicableTo,
  // For subcategory we need to pick a parent category first (UI only, not saved)
  _parent_category_id:    '',
  applicable_id:          undefined as string | undefined,
  usage_limit:            undefined as number | undefined,
  usage_limit_per_user:   1,
  start_date:             '',
  end_date:               '',
};

type FormState = typeof blankForm;

function couponToForm(c: any): FormState {
  const toLocal = (iso: string) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : '';
  return {
    code:                   c.code,
    description:            c.description ?? '',
    is_active:              c.is_active ?? true,
    includes_free_delivery: c.includes_free_delivery ?? false,
    discount_type:          c.discount_type,
    discount_value:         Number(c.discount_value),
    max_discount_amount:    c.max_discount_amount ? Number(c.max_discount_amount) : undefined,
    min_order_amount:       Number(c.min_order_amount),
    applicable_to:          (c.applicable_to ?? 'all') as ApplicableTo,
    _parent_category_id:    '',  // resolved lazily from applicable_id when editing subcategory
    applicable_id:          c.applicable_id ?? undefined,
    usage_limit:            c.usage_limit ?? undefined,
    usage_limit_per_user:   c.usage_limit_per_user ?? 1,
    start_date:             toLocal(c.start_date),
    end_date:               toLocal(c.end_date),
  };
}

function formToPayload(f: FormState) {
  return {
    code:                   f.code.toUpperCase().trim(),
    description:            f.description,
    is_active:              f.is_active,
    includes_free_delivery: f.includes_free_delivery,
    discount_type:          f.discount_type,
    discount_value:         f.discount_value,
    max_discount_amount:    f.max_discount_amount ?? null,
    min_order_amount:       f.min_order_amount,
    applicable_to:          f.applicable_to,
    applicable_id:          f.applicable_id ?? null,
    usage_limit:            f.usage_limit ?? null,
    usage_limit_per_user:   f.usage_limit_per_user,
    start_date:             f.start_date ? new Date(f.start_date).toISOString() : '',
    end_date:               f.end_date   ? new Date(f.end_date).toISOString()   : '',
  };
}

// ─────────────────────────────────────────────
// Labels for applicable_to options
// ─────────────────────────────────────────────

const APPLICABLE_TO_LABELS: Record<ApplicableTo, string> = {
  all:         'All Products',
  category:    'Specific Category',
  subcategory: 'Specific Sub-Category',
  vendor:      'Specific Vendor',
  product:     'Specific Product',
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function AddEditCouponPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get('edit');
  const isEdit       = !!editId;

  const [formData, setFormData] = useState<FormState>(blankForm);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  // ── Load existing coupon ───────────────────────────────────────────────────
  const { data: existingCoupon, isLoading: loadingCoupon } = useCoupon(editId ?? '');

  useEffect(() => {
    if (isEdit && existingCoupon) {
      setFormData(couponToForm(existingCoupon));
    }
  }, [isEdit, existingCoupon]);

  // ── Scope data loaders ─────────────────────────────────────────────────────
  const { data: categories   = [] } = useCategories();
  const { data: subCategories = [] } = useSubCategoriesByCategory(formData._parent_category_id);
  const { data: vendors       = [] } = useVendors();
  const { data: products      = [] } = useProducts();

  // When editing a subcategory coupon, resolve the parent category from the applicable_id
  useEffect(() => {
    if (
      isEdit &&
      existingCoupon?.applicable_to === 'subcategory' &&
      existingCoupon.applicable_id &&
      !formData._parent_category_id
    ) {
      supabase
        .from('sub_categories')
        .select('category_id')
        .eq('id', existingCoupon.applicable_id)
        .single()
        .then(({ data }) => {
          if (data?.category_id)
            setFormData((prev) => ({ ...prev, _parent_category_id: data.category_id }));
        });
    }
  }, [isEdit, existingCoupon, formData._parent_category_id]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const isSaving     = createCoupon.isPending || updateCoupon.isPending;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const set = (field: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleApplicableToChange = (value: ApplicableTo) => {
    setFormData((prev) => ({
      ...prev,
      applicable_to:       value,
      applicable_id:       undefined,
      _parent_category_id: '',
    }));
    setErrors((prev) => ({ ...prev, applicable_id: '', _parent_category_id: '' }));
  };

  const handleParentCategoryChange = (catId: string) => {
    setFormData((prev) => ({
      ...prev,
      _parent_category_id: catId,
      applicable_id:       undefined,  // reset sub-category selection
    }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.code.trim())                errs.code             = 'Coupon code is required';
    if (!formData.description.trim())         errs.description      = 'Description is required';
    if (formData.discount_value <= 0)         errs.discount_value   = 'Discount value must be > 0';
    if (formData.discount_type === 'percentage' && formData.discount_value > 100)
      errs.discount_value = 'Percentage cannot exceed 100';
    if (formData.min_order_amount < 0)        errs.min_order_amount = 'Cannot be negative';
    if (formData.usage_limit_per_user < 1)    errs.usage_limit_per_user = 'Must be at least 1';
    if (!formData.start_date)                 errs.start_date       = 'Start date is required';
    if (!formData.end_date)                   errs.end_date         = 'End date is required';
    if (formData.start_date && formData.end_date &&
        new Date(formData.end_date) <= new Date(formData.start_date))
      errs.end_date = 'End date must be after start date';

    // Scope validation
    if (formData.applicable_to !== 'all') {
      if (formData.applicable_to === 'subcategory' && !formData._parent_category_id)
        errs._parent_category_id = 'Please select a parent category first';
      if (!formData.applicable_id)
        errs.applicable_id = `Please select a ${formData.applicable_to}`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (addAnother = false) => {
    if (!validate()) return;
    const payload = formToPayload(formData);

    if (isEdit && editId) {
      updateCoupon.mutate({ id: editId, ...payload }, {
        onSuccess: () => { toast.success('Coupon updated'); router.push('/admin/coupons'); },
        onError:   (err: any) => toast.error(err.message ?? 'Failed to update coupon'),
      });
    } else {
      createCoupon.mutate(payload as CouponInsert, {
        onSuccess: () => {
          toast.success('Coupon created');
          if (addAnother) setFormData(blankForm);
          else            router.push('/admin/coupons');
        },
        onError: (err: any) => toast.error(err.message ?? 'Failed to create coupon'),
      });
    }
  };

  if (isEdit && loadingCoupon) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1200px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/coupons')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {isEdit ? 'Edit Coupon' : 'Create Coupon'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEdit ? 'Update coupon details' : 'Set up a new discount code for your customers'}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* ── Main Form ── */}
          <div className="md:col-span-2 space-y-6">

            {/* Basics */}
            <Card>
              <CardHeader><CardTitle>Coupon Basics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code <span className="text-destructive">*</span></Label>
                  <Input
                    id="code"
                    placeholder="WELCOME20"
                    value={formData.code}
                    onChange={(e) => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    className={`font-mono font-bold ${errors.code ? 'border-destructive' : ''}`}
                    disabled={isEdit}
                  />
                  {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="description"
                    placeholder="Get 20% off on your first order"
                    value={formData.description}
                    onChange={(e) => set('description', e.target.value)}
                    className={errors.description ? 'border-destructive' : ''}
                    rows={3}
                  />
                  {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label htmlFor="is_active">Active Status</Label>
                    <p className="text-sm text-muted-foreground">Enable this coupon immediately</p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(v) => set('is_active', v)}
                  />
                </div>

                <div className="flex items-center space-x-2 p-4 rounded-lg border">
                  <Checkbox
                    id="freeDelivery"
                    checked={formData.includes_free_delivery}
                    onCheckedChange={(v) => set('includes_free_delivery', v)}
                  />
                  <div>
                    <Label htmlFor="freeDelivery" className="cursor-pointer">Include Free Delivery</Label>
                    <p className="text-sm text-muted-foreground">Waive delivery charges with this coupon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discount */}
            <Card>
              <CardHeader><CardTitle>Discount Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Discount Type <span className="text-destructive">*</span></Label>
                    <Select value={formData.discount_type} onValueChange={(v) => set('discount_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount_value">Value <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Input
                        id="discount_value"
                        type="number"
                        min="0"
                        max={formData.discount_type === 'percentage' ? 100 : undefined}
                        value={formData.discount_value || ''}
                        onChange={(e) => set('discount_value', parseFloat(e.target.value) || 0)}
                        className={`pr-12 ${errors.discount_value ? 'border-destructive' : ''}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                        {formData.discount_type === 'percentage' ? '%' : '₹'}
                      </span>
                    </div>
                    {errors.discount_value && <p className="text-sm text-destructive">{errors.discount_value}</p>}
                  </div>
                </div>

                {formData.discount_type === 'percentage' && (
                  <div className="space-y-2">
                    <Label htmlFor="max_discount">Max Discount Amount (optional)</Label>
                    <div className="relative">
                      <Input
                        id="max_discount"
                        type="number"
                        min="0"
                        placeholder="500"
                        value={formData.max_discount_amount ?? ''}
                        onChange={(e) => set('max_discount_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="min_order">Min Order Amount <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="min_order"
                      type="number"
                      min="0"
                      value={formData.min_order_amount || ''}
                      onChange={(e) => set('min_order_amount', parseFloat(e.target.value) || 0)}
                      className={`pr-12 ${errors.min_order_amount ? 'border-destructive' : ''}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                  </div>
                  {errors.min_order_amount && <p className="text-sm text-destructive">{errors.min_order_amount}</p>}
                </div>
              </CardContent>
            </Card>

            {/* ── Applicability ── */}
            <Card>
              <CardHeader><CardTitle>Applicability</CardTitle></CardHeader>
              <CardContent className="space-y-4">

                {/* Step 1 — applicable_to type */}
                <div className="space-y-2">
                  <Label>Apply To <span className="text-destructive">*</span></Label>
                  <Select value={formData.applicable_to} onValueChange={handleApplicableToChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(APPLICABLE_TO_LABELS) as ApplicableTo[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {APPLICABLE_TO_LABELS[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 2a — for subcategory: pick parent category first */}
                {formData.applicable_to === 'subcategory' && (
                  <div className="space-y-2">
                    <Label>
                      Parent Category <span className="text-destructive">*</span>
                      <span className="text-xs text-muted-foreground ml-2">required to filter sub-categories</span>
                    </Label>
                    <Select
                      value={formData._parent_category_id}
                      onValueChange={handleParentCategoryChange}
                    >
                      <SelectTrigger className={errors._parent_category_id ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select a category…" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors._parent_category_id && (
                      <p className="text-sm text-destructive">{errors._parent_category_id}</p>
                    )}
                  </div>
                )}

                {/* Step 2b — specific item selector (all types except 'all') */}
                {formData.applicable_to !== 'all' && (
                  <div className="space-y-2">
                    <Label>
                      Select {APPLICABLE_TO_LABELS[formData.applicable_to].replace('Specific ', '')}
                      <span className="text-destructive ml-1">*</span>
                    </Label>

                    {/* Subcategory — only show after parent category is chosen */}
                    {formData.applicable_to === 'subcategory' && (
                      <>
                        {!formData._parent_category_id ? (
                          <p className="text-sm text-muted-foreground italic">
                            ↑ Choose a parent category above to see sub-categories
                          </p>
                        ) : (
                          <Select
                            value={formData.applicable_id ?? ''}
                            onValueChange={(v) => set('applicable_id', v)}
                            disabled={subCategories.length === 0}
                          >
                            <SelectTrigger className={errors.applicable_id ? 'border-destructive' : ''}>
                              <SelectValue
                                placeholder={
                                  subCategories.length === 0
                                    ? 'No sub-categories found'
                                    : 'Select a sub-category…'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {subCategories.map((sc) => (
                                <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </>
                    )}

                    {/* Category */}
                    {formData.applicable_to === 'category' && (
                      <Select
                        value={formData.applicable_id ?? ''}
                        onValueChange={(v) => set('applicable_id', v)}
                      >
                        <SelectTrigger className={errors.applicable_id ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select a category…" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Vendor */}
                    {formData.applicable_to === 'vendor' && (
                      <Select
                        value={formData.applicable_id ?? ''}
                        onValueChange={(v) => set('applicable_id', v)}
                      >
                        <SelectTrigger className={errors.applicable_id ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select a vendor…" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((v) => (
                            // vendor FK → vendors.user_id (matches products.vendor_id)
                            <SelectItem key={v.user_id} value={v.user_id}>{v.store_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Product */}
                    {formData.applicable_to === 'product' && (
                      <Select
                        value={formData.applicable_id ?? ''}
                        onValueChange={(v) => set('applicable_id', v)}
                      >
                        <SelectTrigger className={errors.applicable_id ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select a product…" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {errors.applicable_id && (
                      <p className="text-sm text-destructive">{errors.applicable_id}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Rules */}
            <Card>
              <CardHeader><CardTitle>Usage Rules</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Total Usage Limit (optional)</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={formData.usage_limit ?? ''}
                    onChange={(e) => set('usage_limit', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                  <p className="text-sm text-muted-foreground">Leave empty for unlimited</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="per_user">Per User Limit <span className="text-destructive">*</span></Label>
                  <Input
                    id="per_user"
                    type="number"
                    min="1"
                    value={formData.usage_limit_per_user || ''}
                    onChange={(e) => set('usage_limit_per_user', parseInt(e.target.value) || 1)}
                    className={errors.usage_limit_per_user ? 'border-destructive' : ''}
                  />
                  {errors.usage_limit_per_user && (
                    <p className="text-sm text-destructive">{errors.usage_limit_per_user}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Validity */}
            <Card>
              <CardHeader><CardTitle>Validity Period</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date <span className="text-destructive">*</span></Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => set('start_date', e.target.value)}
                      className={errors.start_date ? 'border-destructive' : ''}
                    />
                    {errors.start_date && <p className="text-sm text-destructive">{errors.start_date}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date <span className="text-destructive">*</span></Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => set('end_date', e.target.value)}
                      className={errors.end_date ? 'border-destructive' : ''}
                    />
                    {errors.end_date && <p className="text-sm text-destructive">{errors.end_date}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar Preview ── */}
          <div className="md:col-span-1">
            <div className="sticky top-8 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Preview</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5 text-center space-y-2">
                    <p className="font-mono font-bold text-2xl text-primary">
                      {formData.code || 'COUPON CODE'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formData.description || 'Description will appear here'}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-semibold">
                        {formData.discount_type === 'percentage'
                          ? `${formData.discount_value}%`
                          : `₹${formData.discount_value}`}
                      </span>
                    </div>
                    {formData.max_discount_amount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max</span>
                        <span className="font-semibold">₹{formData.max_discount_amount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Order</span>
                      <span className="font-semibold">₹{formData.min_order_amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Applies To</span>
                      <span className="font-semibold capitalize">{formData.applicable_to}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Free Delivery</span>
                      <span className="font-semibold">{formData.includes_free_delivery ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                        {formData.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button onClick={() => handleSubmit(false)} className="w-full" size="lg" disabled={isSaving}>
                  <Check className="h-5 w-5 mr-2" />
                  {isSaving ? 'Saving…' : isEdit ? 'Update Coupon' : 'Create Coupon'}
                </Button>
                {!isEdit && (
                  <Button onClick={() => handleSubmit(true)} variant="outline" className="w-full" size="lg" disabled={isSaving}>
                    <Plus className="h-5 w-5 mr-2" />
                    Create & Add Another
                  </Button>
                )}
                <Button onClick={() => router.push('/admin/coupons')} variant="ghost" className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}