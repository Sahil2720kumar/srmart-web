"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ChevronLeft, Save, ChevronRight, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import Image from "next/image";
import { useCategory, useSubCategory, useCreateSubCategory, useUpdateSubCategory } from "@/hooks/products/useCategories";
import { toast } from "sonner";

interface FormData {
  name: string;
  slug: string;
  description: string;
  image: string;
  commission_rate: string;
  use_custom_commission: boolean;
  display_order: string;
  is_active: boolean;
}

interface FormErrors {
  name?: string;
  slug?: string;
  image?: string;
  commission_rate?: string;
  display_order?: string;
}

// ─── Inner Content (calls useSearchParams — safe inside Suspense) ─────────────

function AddEditSubcategoryContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const categoryId = params.categoryId as string;
  const subcategoryId = searchParams.get("subcategoryId");
  const isEditMode = !!subcategoryId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    slug: "",
    description: "",
    image: "",
    commission_rate: "",
    use_custom_commission: false,
    display_order: "0",
    is_active: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch category data
  const { data: category, isLoading: categoryLoading } = useCategory(categoryId);

  // Fetch subcategory data (only in edit mode)
  const { data: subcategoryData, isLoading: subcategoryLoading } = useSubCategory(subcategoryId || "");

  // Mutations
  const createSubCategoryMutation = useCreateSubCategory();
  const updateSubCategoryMutation = useUpdateSubCategory();

  // Prefill form in edit mode
  useEffect(() => {
    if (isEditMode && subcategoryData) {
      setFormData({
        name: subcategoryData.name,
        slug: subcategoryData.slug,
        description: subcategoryData.description || "",
        image: subcategoryData.image || "",
        commission_rate: subcategoryData.commission_rate?.toString() || "",
        use_custom_commission: subcategoryData.commission_rate !== null && subcategoryData.commission_rate !== undefined,
        display_order: subcategoryData.display_order?.toString() || "",
        is_active: subcategoryData.is_active || false,
      });
      if (subcategoryData.image) {
        setImagePreview(subcategoryData.image);
      }
    }
  }, [isEditMode, subcategoryData]);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      if (field === "name" && !isEditMode) {
        updated.slug = generateSlug(value);
      }

      if (field === "use_custom_commission" && !value) {
        updated.commission_rate = "";
      }

      return updated;
    });

    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors(prev => ({ ...prev, image: "Please upload a valid image file" }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: "Image size should not exceed 5MB" }));
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setImageFile(file);
      setRemoveImage(false);
      setErrors(prev => ({ ...prev, image: "" }));
    } catch (error) {
      console.error("Error processing image:", error);
      setErrors(prev => ({ ...prev, image: "Failed to process image" }));
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setImageFile(null);
    setRemoveImage(true);
    handleInputChange("image", "");
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Subcategory name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must not exceed 100 characters";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (formData.slug.length > 120) {
      newErrors.slug = "Slug must not exceed 120 characters";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    }

    if (formData.use_custom_commission) {
      const rate = parseFloat(formData.commission_rate);
      if (!formData.commission_rate || isNaN(rate)) {
        newErrors.commission_rate = "Valid commission rate is required";
      } else if (rate < 0 || rate > 100) {
        newErrors.commission_rate = "Commission rate must be between 0 and 100";
      }
    }

    const displayOrder = parseInt(formData.display_order);
    if (!formData.display_order || isNaN(displayOrder)) {
      newErrors.display_order = "Valid display order is required";
    } else if (displayOrder < 0) {
      newErrors.display_order = "Display order must be 0 or greater";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!category) {
      toast("Error", { description: "Category not found" });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        category_id: categoryId,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        commission_rate: formData.use_custom_commission
          ? parseFloat(formData.commission_rate)
          : null,
        display_order: parseInt(formData.display_order),
        is_active: formData.is_active,
      };

      if (isEditMode && subcategoryId) {
        await updateSubCategoryMutation.mutateAsync({
          subCategoryId: subcategoryId,
          updates: payload,
          imageFile: imageFile || undefined,
          removeImage: removeImage,
          categorySlug: category.slug,
        });
        toast("Success", { description: "Subcategory updated successfully" });
      } else {
        await createSubCategoryMutation.mutateAsync({
          subCategory: payload,
          imageFile: imageFile || undefined,
          categorySlug: category.slug,
        });
        toast("Success", { description: "Subcategory created successfully" });
      }

      router.push(`/admin/categories/${categoryId}/subcategories`);
    } catch (error) {
      console.error("Error saving subcategory:", error);
      toast("Error", {
        description: `Failed to ${isEditMode ? 'update' : 'create'} subcategory`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.name.trim() &&
    formData.slug.trim() &&
    formData.display_order &&
    parseInt(formData.display_order) >= 0 &&
    (!formData.use_custom_commission || (formData.commission_rate && parseFloat(formData.commission_rate) >= 0));

  const isLoading = categoryLoading || (isEditMode && subcategoryLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">Category not found</p>
            <Link href="/admin/categories">
              <Button className="mt-4">Back to Categories</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/categories" className="hover:text-foreground">Categories</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/admin/categories/${categoryId}`} className="hover:text-foreground">{category.name}</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/admin/categories/${categoryId}/subcategories`} className="hover:text-foreground">Subcategories</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{isEditMode ? "Edit" : "Add"}</span>
        </nav>

        {/* Header */}
        <div className="space-y-1">
          <Link href={`/admin/categories/${categoryId}/subcategories`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Subcategories
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditMode ? "Edit Subcategory" : "Add New Subcategory"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? "Update subcategory details" : `Create a new subcategory under ${category.name}`}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Subcategory Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Fresh Vegetables"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">{formData.name.length}/100 characters</p>
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="fresh-vegetables"
                  maxLength={120}
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly version (auto-generated from name). {formData.slug.length}/120 characters
                </p>
                {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brief description of the subcategory..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Optional description for customers</p>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Subcategory Image</Label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <div className="relative h-48 w-48 overflow-hidden rounded-lg border">
                      <Image src={imagePreview} alt="Subcategory preview" fill className="object-cover" />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-8 w-8 rounded-full"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Input id="image" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <Label
                      htmlFor="image"
                      className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload Image</span>
                    </Label>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Recommended: 500x500px, max 5MB (JPG, PNG, WebP)</p>
                {errors.image && <p className="text-xs text-red-500">{errors.image}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Commission & Display Settings */}
          <Card>
            <CardHeader><CardTitle>Commission & Display Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Checkbox
                  id="use_custom_commission"
                  checked={formData.use_custom_commission}
                  onCheckedChange={(checked) => handleInputChange("use_custom_commission", checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="use_custom_commission" className="cursor-pointer">Override commission rate</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Default: {category.commission_rate}% (from parent category)
                  </p>
                </div>
              </div>

              {formData.use_custom_commission && (
                <div className="space-y-2">
                  <Label htmlFor="commission_rate">
                    Commission Rate (%) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.commission_rate}
                    onChange={(e) => handleInputChange("commission_rate", e.target.value)}
                    placeholder={category.commission_rate?.toString() ?? ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be between 0 and 100. Uses 2 decimal places (e.g., 8.50)
                  </p>
                  {errors.commission_rate && <p className="text-xs text-red-500">{errors.commission_rate}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="display_order">
                  Display Order <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange("display_order", e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first (0, 1, 2, ...)</p>
                {errors.display_order && <p className="text-xs text-red-500">{errors.display_order}</p>}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Active Status</Label>
                  <p className="text-sm text-muted-foreground">Make this subcategory visible to customers</p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Link href={`/admin/categories/${categoryId}/subcategories`}>
              <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
            </Link>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? "Update Subcategory" : "Save Subcategory"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Default Export — Suspense MUST wrap the component that calls useSearchParams ─

export default function AddEditSubcategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AddEditSubcategoryContent />
    </Suspense>
  );
}