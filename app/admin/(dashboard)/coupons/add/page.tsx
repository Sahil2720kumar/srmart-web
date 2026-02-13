'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Check } from 'lucide-react';
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


export default function AddCouponPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    isActive: true,
    freeDelivery: false,
    discountType: 'percentage' ,
    discountValue: 0,
    maxDiscountAmount: undefined as number | undefined,
    minOrderAmount: 0,
    applicableTo: 'all' ,
    selectedItems: [] as string[],
    usageLimit: undefined as number | undefined,
    usageLimitPerUser: 1,
    startDate: '',
    endDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock items for selection
  const categoryItems = ['Vegetables', 'Fruits', 'Dairy', 'Beverages', 'Snacks', 'Bakery'];
  const vendorItems = ['Fresh Market', 'Organic Farm', 'SuperMart', 'Daily Essentials'];
  const productItems = ['Milk 1L', 'Bread', 'Eggs', 'Rice 1kg', 'Sugar 1kg', 'Oil 1L'];

  const getAvailableItems = () => {
    switch (formData.applicableTo) {
      case 'category':
        return categoryItems;
      case 'vendor':
        return vendorItems;
      case 'product':
        return productItems;
      default:
        return [];
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleCodeChange = (value: string) => {
    handleInputChange('code', value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
  };

  const toggleItem = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(item)
        ? prev.selectedItems.filter((i) => i !== item)
        : [...prev.selectedItems, item],
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    }
    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = 'Percentage cannot exceed 100';
    }
    if (formData.minOrderAmount < 0) {
      newErrors.minOrderAmount = 'Minimum order amount cannot be negative';
    }
    if (formData.usageLimitPerUser <= 0) {
      newErrors.usageLimitPerUser = 'Per user limit must be at least 1';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.applicableTo !== 'all' && formData.selectedItems.length === 0) {
      newErrors.selectedItems = 'Please select at least one item';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (redirect: boolean = true) => {
    if (!validateForm()) {
      return;
    }

    // Simulate saving coupon
    console.log('Creating coupon:', formData);

    if (redirect) {
      router.push('/admin/coupons');
    } else {
      // Reset form for "Create & Add Another"
      setFormData({
        code: '',
        description: '',
        isActive: true,
        freeDelivery: false,
        discountType: 'percentage',
        discountValue: 0,
        maxDiscountAmount: undefined,
        minOrderAmount: 0,
        applicableTo: 'all',
        selectedItems: [],
        usageLimit: undefined,
        usageLimitPerUser: 1,
        startDate: '',
        endDate: '',
      });
    }
  };

  const getRemainingUses = () => {
    if (!formData.usageLimit) return 'Unlimited';
    return formData.usageLimit;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/coupons')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Create Coupon</h1>
            <p className="text-muted-foreground mt-2 text-base">
              Set up a new discount code for your customers
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Section 1: Coupon Basics */}
            <Card>
              <CardHeader>
                <CardTitle>Coupon Basics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Coupon Code <span className="text-[hsl(var(--destructive))]">*</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder="WELCOME20"
                    value={formData.code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className={`font-mono font-bold ${errors.code ? 'border-[hsl(var(--destructive))]' : ''}`}
                  />
                  {errors.code && (
                    <p className="text-sm text-[hsl(var(--destructive))]">{errors.code}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-[hsl(var(--destructive))]">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Get 20% off on your first order"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={errors.description ? 'border-[hsl(var(--destructive))]' : ''}
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-[hsl(var(--destructive))]">{errors.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="active">Active Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable this coupon immediately
                    </p>
                  </div>
                  <Switch
                    id="active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>

                <div className="flex items-center space-x-2 p-4 rounded-lg border">
                  <Checkbox
                    id="freeDelivery"
                    checked={formData.freeDelivery}
                    onCheckedChange={(checked) => handleInputChange('freeDelivery', checked)}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="freeDelivery" className="cursor-pointer">
                      Include Free Delivery
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Waive delivery charges with this coupon
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Discount Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Discount Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">
                      Discount Type <span className="text-[hsl(var(--destructive))]">*</span>
                    </Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value) =>
                        handleInputChange('discountType', value)
                      }
                    >
                      <SelectTrigger id="discountType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                        <SelectItem value="bogo">Buy One Get One</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountValue">
                      Discount Value <span className="text-[hsl(var(--destructive))]">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="discountValue"
                        type="number"
                        min="0"
                        max={formData.discountType === 'percentage' ? 100 : undefined}
                        value={formData.discountValue || ''}
                        onChange={(e) =>
                          handleInputChange('discountValue', parseFloat(e.target.value) || 0)
                        }
                        className={`pr-12 ${errors.discountValue ? 'border-[hsl(var(--destructive))]' : ''}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                        {formData.discountType === 'percentage' ? '%' : '₹'}
                      </span>
                    </div>
                    {errors.discountValue && (
                      <p className="text-sm text-[hsl(var(--destructive))]">{errors.discountValue}</p>
                    )}
                  </div>
                </div>

                {formData.discountType === 'percentage' && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">Max Discount Amount (Optional)</Label>
                    <div className="relative">
                      <Input
                        id="maxDiscount"
                        type="number"
                        min="0"
                        placeholder="500"
                        value={formData.maxDiscountAmount || ''}
                        onChange={(e) =>
                          handleInputChange(
                            'maxDiscountAmount',
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                        ₹
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cap the maximum discount amount
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="minOrder">
                    Minimum Order Amount <span className="text-[hsl(var(--destructive))]">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="minOrder"
                      type="number"
                      min="0"
                      value={formData.minOrderAmount || ''}
                      onChange={(e) =>
                        handleInputChange('minOrderAmount', parseFloat(e.target.value) || 0)
                      }
                      className={`pr-12 ${errors.minOrderAmount ? 'border-[hsl(var(--destructive))]' : ''}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                      ₹
                    </span>
                  </div>
                  {errors.minOrderAmount && (
                    <p className="text-sm text-[hsl(var(--destructive))]">{errors.minOrderAmount}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Applicability */}
            <Card>
              <CardHeader>
                <CardTitle>Applicability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="applicableTo">
                    Apply To <span className="text-[hsl(var(--destructive))]">*</span>
                  </Label>
                  <Select
                    value={formData.applicableTo}
                    onValueChange={(value) => {
                      handleInputChange('applicableTo', value);
                      handleInputChange('selectedItems', []);
                    }}
                  >
                    <SelectTrigger id="applicableTo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="category">Specific Categories</SelectItem>
                      <SelectItem value="vendor">Specific Vendors</SelectItem>
                      <SelectItem value="product">Specific Products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.applicableTo !== 'all' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Select Items</Label>
                      {formData.selectedItems.length > 0 && (
                        <Badge variant="secondary">
                          {formData.selectedItems.length} selected
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg max-h-60 overflow-y-auto">
                      {getAvailableItems().map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                          <Checkbox
                            id={item}
                            checked={formData.selectedItems.includes(item)}
                            onCheckedChange={() => toggleItem(item)}
                          />
                          <Label htmlFor={item} className="cursor-pointer text-sm font-normal">
                            {item}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {errors.selectedItems && (
                      <p className="text-sm text-[hsl(var(--destructive))]">{errors.selectedItems}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 4: Usage Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Total Usage Limit (Optional)</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={formData.usageLimit || ''}
                    onChange={(e) =>
                      handleInputChange(
                        'usageLimit',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty for unlimited usage
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perUserLimit">
                    Per User Usage Limit <span className="text-[hsl(var(--destructive))]">*</span>
                  </Label>
                  <Input
                    id="perUserLimit"
                    type="number"
                    min="1"
                    value={formData.usageLimitPerUser || ''}
                    onChange={(e) =>
                      handleInputChange('usageLimitPerUser', parseInt(e.target.value) || 1)
                    }
                    className={errors.usageLimitPerUser ? 'border-[hsl(var(--destructive))]' : ''}
                  />
                  {errors.usageLimitPerUser && (
                    <p className="text-sm text-[hsl(var(--destructive))]">{errors.usageLimitPerUser}</p>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Remaining Uses</span>
                    <span className="text-lg font-bold text-[hsl(var(--primary))]">
                      {getRemainingUses()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Validity */}
            <Card>
              <CardHeader>
                <CardTitle>Validity Period</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      Start Date <span className="text-[hsl(var(--destructive))]">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className={errors.startDate ? 'border-[hsl(var(--destructive))]' : ''}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-[hsl(var(--destructive))]">{errors.startDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      End Date <span className="text-[hsl(var(--destructive))]">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className={errors.endDate ? 'border-[hsl(var(--destructive))]' : ''}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-[hsl(var(--destructive))]">{errors.endDate}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Preview */}
          <div className="md:col-span-1">
            <div className="sticky top-8 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Coupon Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border-2 border-dashed border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--primary))]/5">
                    <div className="text-center space-y-2">
                      <div className="font-mono font-bold text-2xl text-[hsl(var(--primary))]">
                        {formData.code || 'COUPON CODE'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formData.description || 'Coupon description will appear here'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-semibold">
                        {formData.discountType === 'percentage' && `${formData.discountValue}%`}
                        {formData.discountType === 'flat' && `₹${formData.discountValue}`}
                        {formData.discountType === 'bogo' && 'BOGO'}
                      </span>
                    </div>
                    {formData.maxDiscountAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Discount</span>
                        <span className="font-semibold">₹{formData.maxDiscountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Order</span>
                      <span className="font-semibold">₹{formData.minOrderAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Free Delivery</span>
                      <span className="font-semibold">
                        {formData.freeDelivery ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge
                        className={
                          formData.isActive
                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                            : ''
                        }
                        variant={formData.isActive ? 'default' : 'secondary'}
                      >
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleSubmit(true)}
                  className="w-full"
                  size="lg"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Create Coupon
                </Button>
                <Button
                  onClick={() => handleSubmit(false)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create & Add Another
                </Button>
                <Button
                  onClick={() => router.push('/admin/coupons')}
                  variant="ghost"
                  className="w-full"
                >
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