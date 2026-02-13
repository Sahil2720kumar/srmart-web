"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ChevronLeft, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

interface FormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  image: File | null;
  color: string;
  commission_rate: string;
  display_order: string;
  is_active: boolean;
}

interface FormErrors {
  name?: string;
  slug?: string;
  commission_rate?: string;
  display_order?: string;
}

// Mock data for edit mode
const mockCategory = {
  id: "cat_001",
  name: "Vegetables & Fruits",
  slug: "vegetables-fruits",
  description: "Fresh vegetables and fruits delivered to your doorstep",
  icon: "🥬",
  color: "#10b981",
  commission_rate: "8.00",
  display_order: "1",
  is_active: true,
};

export default function AddEditCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");
  const isEditMode = !!categoryId;

  console.log("isEditMode",isEditMode);
  
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    slug: "",
    description: "",
    icon: "📦",
    image: null,
    color: "#3b82f6",
    commission_rate: "",
    display_order: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isEditMode) {
      // Prefill form with mock data in edit mode
      setFormData({
        name: mockCategory.name,
        slug: mockCategory.slug,
        description: mockCategory.description,
        icon: mockCategory.icon,
        image: null,
        color: mockCategory.color,
        commission_rate: mockCategory.commission_rate,
        display_order: mockCategory.display_order,
        is_active: mockCategory.is_active,
      });
    }
  }, [isEditMode]);

  const generateSlug = (name: string) => {
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
      
      return updated;
    });
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
    handleInputChange("image", file);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    }
    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    }
    if (!formData.commission_rate || parseFloat(formData.commission_rate) < 0) {
      newErrors.commission_rate = "Valid commission rate is required";
    }
    if (!formData.display_order || parseInt(formData.display_order) < 0) {
      newErrors.display_order = "Valid display order is required";
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

      console.log("Category data:", formData);

      // Redirect to list
      router.push("/admin/categories");
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = 
    formData.name.trim() &&
    formData.slug.trim() &&
    formData.commission_rate &&
    formData.display_order;

  return (
    <div className="min-h-screen bg-background ">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <Link href="/admin/categories">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Categories
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditMode ? "Edit Category" : "Add New Category"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? "Update category details" : "Create a new product category"}
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
              {/* Category Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Vegetables & Fruits"
                />
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
                  placeholder="vegetables-fruits"
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly version (auto-generated from name)
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
                  placeholder="Brief description of the category..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Visual Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Visual Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Icon */}
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => handleInputChange("icon", e.target.value)}
                  placeholder="🥬"
                  maxLength={2}
                  className="text-2xl w-20"
                />
                <p className="text-xs text-muted-foreground">
                  Single emoji character
                </p>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Category Image</Label>
                <div className="flex flex-col gap-2">
                  {imagePreview ? (
                    <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => handleImageUpload(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Upload Image</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <Label htmlFor="color">Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission & Display */}
          <Card>
            <CardHeader>
              <CardTitle>Commission & Display Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Commission Rate */}
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
                    placeholder="8.00"
                  />
                  {errors.commission_rate && (
                    <p className="text-xs text-red-500">{errors.commission_rate}</p>
                  )}
                </div>

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
                    placeholder="1"
                  />
                  {errors.display_order && (
                    <p className="text-xs text-red-500">{errors.display_order}</p>
                  )}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this category visible to customers
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
            <Link href="/admin/categories">
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
                  {isEditMode ? "Update Category" : "Save Category"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}