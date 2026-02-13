"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ChevronLeft, Save, ChevronRight, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import Image from "next/image";

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

// Mock parent category
const mockCategory = {
  id: "cat_001",
  name: "Vegetables & Fruits",
  commission_rate: 8.00,
};

// Mock subcategory for edit mode
const mockSubcategory = {
  id: "sub_001",
  category_id: "cat_001",
  name: "Fresh Vegetables",
  slug: "fresh-vegetables",
  description: "Farm-fresh vegetables delivered daily",
  image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500",
  commission_rate: null as number | null,
  display_order: 1,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function AddEditSubcategoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("subcategoryId");
  const categoryId = params.categoryId as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
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

  useEffect(() => {
    if (isEditMode) {
      // Prefill form with mock data in edit mode
      setFormData({
        name: mockSubcategory.name,
        slug: mockSubcategory.slug,
        description: mockSubcategory.description || "",
        image: mockSubcategory.image || "",
        commission_rate: mockSubcategory.commission_rate?.toString() || "",
        use_custom_commission: mockSubcategory.commission_rate !== null,
        display_order: mockSubcategory.display_order.toString(),
        is_active: mockSubcategory.is_active,
      });
      if (mockSubcategory.image) {
        setImagePreview(mockSubcategory.image);
      }
    }
  }, [isEditMode]);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug from name
      if (field === "name" && !isEditMode) {
        updated.slug = generateSlug(value);
      }
      
      // Clear commission rate if custom commission is disabled
      if (field === "use_custom_commission" && !value) {
        updated.commission_rate = "";
      }
      
      return updated;
    });
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors(prev => ({ ...prev, image: "Please upload a valid image file" }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: "Image size should not exceed 5MB" }));
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // In a real app, upload to storage and get URL
      // For now, we'll simulate an upload
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock uploaded URL
      const uploadedUrl = `https://storage.example.com/subcategories/${file.name}`;
      handleInputChange("image", uploadedUrl);
      
      // Clear error
      setErrors(prev => ({ ...prev, image: "" }));
    } catch (error) {
      console.error("Error uploading image:", error);
      setErrors(prev => ({ ...prev, image: "Failed to upload image" }));
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    handleInputChange("image", "");
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation (required, max 100 chars)
    if (!formData.name.trim()) {
      newErrors.name = "Subcategory name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must not exceed 100 characters";
    }

    // Slug validation (required, max 120 chars)
    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (formData.slug.length > 120) {
      newErrors.slug = "Slug must not exceed 120 characters";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    }

    // Image validation (optional, max 500 chars)
    if (formData.image && formData.image.length > 500) {
      newErrors.image = "Image URL must not exceed 500 characters";
    }

    // Commission rate validation (optional, 0-100)
    if (formData.use_custom_commission) {
      const rate = parseFloat(formData.commission_rate);
      if (!formData.commission_rate || isNaN(rate)) {
        newErrors.commission_rate = "Valid commission rate is required";
      } else if (rate < 0 || rate > 100) {
        newErrors.commission_rate = "Commission rate must be between 0 and 100";
      }
    }

    // Display order validation (required, integer >= 0)
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

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const payload = {
        category_id: categoryId,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        image: formData.image || null,
        commission_rate: formData.use_custom_commission 
          ? parseFloat(formData.commission_rate)
          : null,
        display_order: parseInt(formData.display_order),
        is_active: formData.is_active,
      };

      console.log("Subcategory data:", payload);

      // Redirect to subcategories list
      router.push(`/admin/categories/${categoryId}/subcategories`);
    } catch (error) {
      console.error("Error saving subcategory:", error);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 ">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/categories" className="hover:text-foreground">
            Categories
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/admin/categories/${categoryId}`} className="hover:text-foreground">
            {mockCategory.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/admin/categories/${categoryId}/subcategories`} className="hover:text-foreground">
            Subcategories
          </Link>
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
            {isEditMode ? "Update subcategory details" : `Create a new subcategory under ${mockCategory.name}`}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subcategory Name */}
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
                <p className="text-xs text-muted-foreground">
                  {formData.name.length}/100 characters
                </p>
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Slug */}
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
                {errors.slug && (
                  <p className="text-xs text-red-500">{errors.slug}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brief description of the subcategory..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Optional description for customers
                </p>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Subcategory Image</Label>
                
                {imagePreview ? (
                  <div className="relative inline-block">
                    <div className="relative h-48 w-48 overflow-hidden rounded-lg border">
                      <Image
                        src={imagePreview}
                        alt="Subcategory preview"
                        fill
                        className="object-cover"
                      />
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
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Label
                      htmlFor="image"
                      className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload Image</span>
                    </Label>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Recommended: 500x500px, max 5MB (JPG, PNG, WebP)
                </p>
                {errors.image && (
                  <p className="text-xs text-red-500">{errors.image}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Commission & Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Commission & Display Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Custom Commission Toggle */}
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Checkbox
                  id="use_custom_commission"
                  checked={formData.use_custom_commission}
                  onCheckedChange={(checked) => handleInputChange("use_custom_commission", checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="use_custom_commission" className="cursor-pointer">
                    Override commission rate
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Default: {mockCategory.commission_rate}% (from parent category)
                  </p>
                </div>
              </div>

              {/* Commission Rate (conditional) */}
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
                    placeholder={mockCategory.commission_rate.toString()}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be between 0 and 100. Uses 2 decimal places (e.g., 8.50)
                  </p>
                  {errors.commission_rate && (
                    <p className="text-xs text-red-500">{errors.commission_rate}</p>
                  )}
                </div>
              )}

              {/* Display Order */}
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
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first (0, 1, 2, ...)
                </p>
                {errors.display_order && (
                  <p className="text-xs text-red-500">{errors.display_order}</p>
                )}
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this subcategory visible to customers
                  </p>
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
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
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