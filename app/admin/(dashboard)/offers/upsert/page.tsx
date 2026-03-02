"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { ArrowLeft, Check, Loader2, Upload, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useOffer,
  useOfferProducts,
  useCreateOffer,
  useUpdateOffer,
  useUpdateOfferProducts,
} from "@/hooks/products/useOffers";
import { useCategories, useSubCategories } from "@/hooks/products/useCategories";
import { useProducts } from "@/hooks/products/useProducts";
import { useVendors } from "@/hooks/vendors/useVendors";
import { DiscountType, OfferApplicableTo, OfferInsert, OfferType, OfferUpdate } from "@/types/supabase";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfferFormState {
  title: string;
  description: string;
  offer_type: OfferType;
  discount_type: DiscountType | "";
  discount_value: number | "";
  applicable_to: OfferApplicableTo;
  applicable_id: string;
  selected_product_ids: string[];
  min_purchase_amount: number | "";
  start_date: string;
  end_date: string;
  tag: string;
  bg_color: string;
  display_order: number | "";
  is_active: boolean;
}

type FormErrors = Partial<Record<keyof OfferFormState, string>>;

// ─── Error Display Component ──────────────────────────────────────────────────

const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
      <AlertCircle className="h-3 w-3" />
      <span>{message}</span>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDT(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function buildDiscount(type: DiscountType | "", value: number | ""): string {
  if (!type || value === "") return "";
  if (type === "percentage") return `${value}% OFF`;
  if (type === "flat") return `₹${value} OFF`;
  if (type === "bogo") return "Buy X Get Y";
  return "";
}

// ─── Inner Content (calls useSearchParams — safe inside Suspense) ─────────────

function OfferUpsertContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEdit = !!editId;

  // Query hooks
  const { data: existingOffer, isLoading: loadingOffer } = useOffer(editId || "");
  const { data: existingProducts } = useOfferProducts(editId || "");
  const { data: categories = [] } = useCategories({ is_active: true });
  const { data: vendors = [] } = useVendors({ is_verified: true });
  const { data: products = [] } = useProducts({ is_available: true });

  // Mutation hooks
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const updateProducts = useUpdateOfferProducts();

  const defaultStart = toLocalDT(new Date().toISOString());

  const [form, setForm] = useState<OfferFormState>({
    title: "",
    description: "",
    offer_type: "discount",
    discount_type: "percentage",
    discount_value: "",
    applicable_to: "all",
    applicable_id: "",
    selected_product_ids: [],
    min_purchase_amount: "",
    start_date: defaultStart,
    end_date: "",
    tag: "",
    bg_color: "#6366f1",
    display_order: "",
    is_active: true,
  });

  const [bannerFile, setBannerFile] = useState<File | undefined>();
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof OfferFormState, boolean>>>({});
  const [saving, setSaving] = useState(false);

  // Get subcategories for selected category
  const { data: subcategories = [] } = useSubCategories({});

  // Load existing offer data
  useEffect(() => {
    if (existingOffer && isEdit) {
      setForm({
        title: existingOffer.title,
        description: existingOffer.description || "",
        offer_type: existingOffer.offer_type as OfferType,
        discount_type: (existingOffer.discount_type as DiscountType) || "",
        discount_value: existingOffer.discount_value || "",
        applicable_to: (existingOffer.applicable_to as OfferApplicableTo) || "all",
        applicable_id: existingOffer.applicable_id || "",
        selected_product_ids: existingProducts?.map((p: any) => p.product.id) || [],
        min_purchase_amount: existingOffer.min_purchase_amount || "",
        start_date: toLocalDT(existingOffer.start_date),
        end_date: toLocalDT(existingOffer.end_date),
        tag: existingOffer.tag || "",
        bg_color: existingOffer.bg_color || "#6366f1",
        display_order: existingOffer.display_order || "",
        is_active: existingOffer.is_active ?? true,
      });

      if (existingOffer.banner_image) {
        setBannerPreview(existingOffer.banner_image);
      }
    }
  }, [existingOffer, existingProducts, isEdit]);

  const set = <K extends keyof OfferFormState>(key: K, value: OfferFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field when user starts typing
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleBlur = <K extends keyof OfferFormState>(key: K) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    validateField(key);
  };

  const validateField = <K extends keyof OfferFormState>(key: K): boolean => {
    const newErrors: FormErrors = { ...errors };

    switch (key) {
      case "title":
        if (!form.title.trim()) {
          newErrors.title = "Title is required";
        } else {
          delete newErrors.title;
        }
        break;

      case "start_date":
        if (!form.start_date) {
          newErrors.start_date = "Start date is required";
        } else {
          delete newErrors.start_date;
        }
        break;

      case "end_date":
        if (form.end_date && form.end_date <= form.start_date) {
          newErrors.end_date = "End date must be after start date";
        } else {
          delete newErrors.end_date;
        }
        break;

      case "discount_value":
        const showDiscountFields = [
          "banner",
          "discount",
          "flash_sale",
          "combo",
          "bundle",
          "clearance",
          "bogo",
          "seasonal",
        ].includes(form.offer_type);
        const showDiscountValue = showDiscountFields && form.discount_type && form.discount_type !== "bogo";

        if (showDiscountValue && form.discount_value === "") {
          newErrors.discount_value = "Discount value is required";
        } else if (form.discount_type === "percentage" && typeof form.discount_value === "number") {
          if (form.discount_value < 0 || form.discount_value > 100) {
            newErrors.discount_value = "Percentage must be between 0 and 100";
          } else {
            delete newErrors.discount_value;
          }
        } else if (form.discount_type === "flat" && typeof form.discount_value === "number") {
          if (form.discount_value < 0) {
            newErrors.discount_value = "Amount must be positive";
          } else {
            delete newErrors.discount_value;
          }
        } else {
          delete newErrors.discount_value;
        }
        break;

      case "applicable_id":
        if ((form.applicable_to === "category" ||
          form.applicable_to === "subcategory" ||
          form.applicable_to === "vendor") && !form.applicable_id) {
          newErrors.applicable_id = `Please select a ${form.applicable_to}`;
        } else {
          delete newErrors.applicable_id;
        }
        break;

      case "selected_product_ids":
        if (form.applicable_to === "product" && form.selected_product_ids.length === 0) {
          newErrors.applicable_id = "Please select at least one product";
        } else if (form.applicable_to === "product") {
          delete newErrors.applicable_id;
        }
        break;

      case "min_purchase_amount":
        if (form.min_purchase_amount !== "" && Number(form.min_purchase_amount) < 0) {
          newErrors.min_purchase_amount = "Amount must be positive";
        } else {
          delete newErrors.min_purchase_amount;
        }
        break;

      case "display_order":
        if (form.display_order !== "" && Number(form.display_order) < 0) {
          newErrors.display_order = "Order must be positive";
        } else {
          delete newErrors.display_order;
        }
        break;
    }

    setErrors(newErrors);
    return !newErrors[key];
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    setBannerFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const removeBanner = () => {
    setBannerFile(undefined);
    setBannerPreview(null);
  };

  const showDiscountFields = [
    "banner",
    "discount",
    "flash_sale",
    "combo",
    "bundle",
    "clearance",
    "bogo",
    "seasonal",
  ].includes(form.offer_type);

  const showDiscountValue = showDiscountFields && form.discount_type && form.discount_type !== "bogo";

  const discountPreview = useMemo(
    () => buildDiscount(form.discount_type, form.discount_value),
    [form.discount_type, form.discount_value]
  );

  const scopeOptions = useMemo(() => {
    if (form.applicable_to === "category") return categories;
    if (form.applicable_to === "subcategory") return subcategories;
    if (form.applicable_to === "vendor") return vendors;
    return [];
  }, [form.applicable_to, categories, subcategories, vendors]);

  const validate = (): boolean => {
    const e: FormErrors = {};

    // Title validation
    if (!form.title.trim()) {
      e.title = "Title is required";
    }

    // Date validations
    if (!form.start_date) {
      e.start_date = "Start date is required";
    }
    if (form.end_date && form.end_date <= form.start_date) {
      e.end_date = "End date must be after start date";
    }

    // Discount validation
    if (showDiscountValue && form.discount_value === "") {
      e.discount_value = "Discount value is required";
    } else if (form.discount_type === "percentage" && typeof form.discount_value === "number") {
      if (form.discount_value < 0 || form.discount_value > 100) {
        e.discount_value = "Percentage must be between 0 and 100";
      }
    } else if (form.discount_type === "flat" && typeof form.discount_value === "number") {
      if (form.discount_value < 0) {
        e.discount_value = "Amount must be positive";
      }
    }

    // Applicable to validation
    if ((form.applicable_to === "category" ||
      form.applicable_to === "subcategory" ||
      form.applicable_to === "vendor") && !form.applicable_id) {
      e.applicable_id = `Please select a ${form.applicable_to}`;
    }
    if (form.applicable_to === "product" && form.selected_product_ids.length === 0) {
      e.applicable_id = "Please select at least one product";
    }

    // Numeric validations
    if (form.min_purchase_amount !== "" && Number(form.min_purchase_amount) < 0) {
      e.min_purchase_amount = "Amount must be positive";
    }
    if (form.display_order !== "" && Number(form.display_order) < 0) {
      e.display_order = "Order must be positive";
    }

    setErrors(e);

    // Mark all fields as touched to show errors
    const allTouched: Partial<Record<keyof OfferFormState, boolean>> = {};
    Object.keys(e).forEach((key) => {
      allTouched[key as keyof OfferFormState] = true;
    });
    setTouched((prev) => ({ ...prev, ...allTouched }));

    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    setSaving(true);

    try {
      const offerData: OfferInsert | OfferUpdate = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        discount: discountPreview || form.title,
        offer_type: form.offer_type,
        discount_type: form.discount_type || null,
        discount_value: form.discount_value !== "" ? Number(form.discount_value) : null,
        applicable_to: form.applicable_to,
        applicable_id: form.applicable_id || null,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : new Date().toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        min_purchase_amount: form.min_purchase_amount !== "" ? Number(form.min_purchase_amount) : null,
        tag: form.tag || null,
        bg_color: form.bg_color || null,
        display_order: form.display_order !== "" ? Number(form.display_order) : null,
        is_active: form.is_active,
      };

      console.log("offerData", offerData);

      if (isEdit && editId) {
        // Update existing offer
        await updateOffer.mutateAsync({
          offerId: editId,
          updates: offerData,
          bannerFile,
          removeBanner: !bannerPreview && !bannerFile,
        });

        // Update products if applicable_to is "product"
        if (form.applicable_to === "product") {
          await updateProducts.mutateAsync({
            offerId: editId,
            productIds: form.selected_product_ids,
          });
        }
        toast.success("Offer updated successfully");
      } else {
        // Create new offer
        await createOffer.mutateAsync({
          offer: offerData as OfferInsert,
          bannerFile,
          productIds: form.applicable_to === "product" ? form.selected_product_ids : undefined,
        });
        toast.success("Offer created successfully");
      }

      router.push("/admin/offers");
    } catch (error: any) {
      console.error("Failed to save offer:", error);
      const errorMessage = error?.message || "Failed to save offer. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loadingOffer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading offer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/offers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEdit ? "Edit Offer" : "Create Offer"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEdit
                ? `Editing: ${existingOffer?.title}`
                : "Set up a new promotional campaign"}
            </p>
          </div>
        </div>

        {/* Banner Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Banner Image</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-4">
            {bannerPreview ? (
              <div className="relative">
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeBanner}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload banner image (Max 5MB)
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="max-w-xs mx-auto"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Basic Information</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Title */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  onBlur={() => handleBlur("title")}
                  placeholder="e.g. Summer Sale 2024"
                  className={errors.title && touched.title ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {touched.title && <ErrorMessage message={errors.title} />}
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe the offer..."
                  className="resize-none h-20"
                />
              </div>

              {/* Tag */}
              <div className="space-y-2">
                <Label htmlFor="tag">Tag</Label>
                <Input
                  id="tag"
                  value={form.tag}
                  onChange={(e) => set("tag", e.target.value)}
                  placeholder="e.g. HOT DEAL"
                />
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <Label htmlFor="bg_color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="bg_color"
                    type="color"
                    value={form.bg_color}
                    onChange={(e) => set("bg_color", e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={form.bg_color}
                    onChange={(e) => set("bg_color", e.target.value)}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offer Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Offer Configuration</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Offer Type */}
              <div className="space-y-2">
                <Label>
                  Offer Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.offer_type}
                  onValueChange={(v) => set("offer_type", v as OfferType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="bogo">BOGO</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                    <SelectItem value="free_delivery">Free Delivery</SelectItem>
                    <SelectItem value="clearance">Clearance</SelectItem>
                    <SelectItem value="combo">Combo</SelectItem>
                    <SelectItem value="flash_sale">Flash Sale</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Discount Type */}
              {showDiscountFields && (
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={form.discount_type || ""}
                    onValueChange={(v) => set("discount_type", v as DiscountType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Fixed Amount (₹)</SelectItem>
                      <SelectItem value="bogo">Buy X Get Y</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Discount Value */}
              {showDiscountValue && (
                <div className="space-y-2 md:col-span-2">
                  <Label>
                    Discount Value{" "}
                    <span className="text-muted-foreground font-normal">
                      ({form.discount_type === "percentage" ? "%" : "₹"})
                    </span>{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={0}
                      max={form.discount_type === "percentage" ? 100 : undefined}
                      step={form.discount_type === "percentage" ? 1 : 0.01}
                      value={form.discount_value}
                      onChange={(e) =>
                        set(
                          "discount_value",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      onBlur={() => handleBlur("discount_value")}
                      className={`font-mono ${errors.discount_value && touched.discount_value ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {discountPreview && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-mono whitespace-nowrap">
                        {discountPreview}
                      </Badge>
                    )}
                  </div>
                  {touched.discount_value && <ErrorMessage message={errors.discount_value} />}
                </div>
              )}

              {/* Display Order */}
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(e) =>
                    set("display_order", e.target.value === "" ? "" : Number(e.target.value))
                  }
                  onBlur={() => handleBlur("display_order")}
                  placeholder="0"
                  className={errors.display_order && touched.display_order ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {touched.display_order && <ErrorMessage message={errors.display_order} />}
              </div>

              {/* Active Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => set("is_active", e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applicable To */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Applicable To</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>
                Scope <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.applicable_to}
                onValueChange={(v) => {
                  set("applicable_to", v as OfferApplicableTo);
                  set("applicable_id", "");
                  set("selected_product_ids", []);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="subcategory">Subcategory</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(form.applicable_to === "category" || form.applicable_to === "subcategory" || form.applicable_to === "vendor") && (
              <div className="space-y-2">
                <Label>
                  Select {form.applicable_to === "category" ? "Category" : form.applicable_to === "subcategory" ? "Subcategory" : "Vendor"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.applicable_id}
                  onValueChange={(v) => {
                    set("applicable_id", v);
                    handleBlur("applicable_id");
                  }}
                >
                  <SelectTrigger className={errors.applicable_id && touched.applicable_id ? "border-destructive focus-visible:ring-destructive" : ""}>
                    <SelectValue
                      placeholder={`Choose a ${form.applicable_to}…`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No options available</div>
                    ) : (
                      scopeOptions.map((opt: any) => (
                        <SelectItem key={opt.id} value={form.applicable_to === "vendor" ? opt.user_id : opt.id}>
                          {opt.name || opt.store_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {touched.applicable_id && <ErrorMessage message={errors.applicable_id} />}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Conditions</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Min Purchase */}
              <div className="space-y-2">
                <Label htmlFor="min_purchase">Minimum Purchase Amount</Label>
                <Input
                  id="min_purchase"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.min_purchase_amount}
                  onChange={(e) =>
                    set(
                      "min_purchase_amount",
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  onBlur={() => handleBlur("min_purchase_amount")}
                  placeholder="0"
                  className={`font-mono ${errors.min_purchase_amount && touched.min_purchase_amount ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {touched.min_purchase_amount && <ErrorMessage message={errors.min_purchase_amount} />}
              </div>

              <div />

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start_date">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                  onBlur={() => handleBlur("start_date")}
                  className={errors.start_date && touched.start_date ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {touched.start_date && <ErrorMessage message={errors.start_date} />}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => set("end_date", e.target.value)}
                  onBlur={() => handleBlur("end_date")}
                  className={errors.end_date && touched.end_date ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {touched.end_date && <ErrorMessage message={errors.end_date} />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Selection */}
        {form.applicable_to === "product" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Select Products</CardTitle>
                {form.selected_product_ids.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {form.selected_product_ids.length} selected
                  </span>
                )}
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {products.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No products available</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-10 pl-6" />
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right pr-6">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p: any) => {
                        const sel = form.selected_product_ids.includes(p.id);
                        return (
                          <TableRow
                            key={p.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              const newSelection = sel
                                ? form.selected_product_ids.filter((x) => x !== p.id)
                                : [...form.selected_product_ids, p.id];
                              set("selected_product_ids", newSelection);
                              setTouched((prev) => ({ ...prev, selected_product_ids: true }));
                            }}
                          >
                            <TableCell className="pl-6">
                              <input
                                type="checkbox"
                                checked={sel}
                                onChange={() => {}}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 accent-primary"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {p.image && (
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="h-8 w-8 rounded object-cover"
                                  />
                                )}
                                <span className="font-medium">{p.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-sm">
                              {p.sku || "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {p.category?.name || "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono pr-6">
                              ₹{p.price}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {errors.applicable_id && form.applicable_to === "product" && touched.selected_product_ids && (
                <div className="p-4 border-t">
                  <ErrorMessage message={errors.applicable_id} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between pb-10">
          <Button variant="outline" asChild disabled={saving}>
            <Link href="/admin/offers">Cancel</Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="min-w-[130px]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {isEdit ? "Save Changes" : "Create Offer"}
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}

// ─── Default Export — Suspense MUST wrap the component that calls useSearchParams ─

export default function OfferUpsertPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OfferUpsertContent />
    </Suspense>
  );
}