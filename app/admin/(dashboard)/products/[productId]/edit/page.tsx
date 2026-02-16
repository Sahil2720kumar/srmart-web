// app/admin/products/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, X, AlertCircle, RotateCcw, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useProduct,
  useUpdateProduct,
  useCategories,
  useSubCategoriesByCategory,
} from "@/hooks";
import { useVendors } from "@/hooks";
import { toast } from "sonner";
import type { ProductUpdate } from "@/types/supabase";

export default function EditProductPage() {

  const router = useRouter();
  const { productId } = useParams();
  console.log("id", productId);

  const { data: product, isLoading: isLoadingProduct } = useProduct(productId);
  const updateProduct = useUpdateProduct();
  const { data: categories } = useCategories();
  const { data: vendors } = useVendors({ is_verified: true });

  const [formData, setFormData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [changedFields, setChangedFields] = useState(new Set<string>());

  // Get subcategories based on selected category
  const { data: subCategories } = useSubCategoriesByCategory(
    formData?.category_id || ""
  );

  // Initialize form data when product loads
  useEffect(() => {
    if (product && !formData) {
      setFormData({
        name: product.name || "",
        slug: product.slug || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        short_description: product.short_description || "",
        description: product.description || "",
        category_id: product.category_id || "",
        sub_category_id: product.sub_category_id || "",
        vendor_id: product.vendor_id || "",
        price: product.price?.toString() || "",
        discount_price: product.discount_price?.toString() || "",
        discount_percentage: product.discount_percentage?.toString() || "0",
        unit: product.unit || "kg",
        stock_quantity: product.stock_quantity?.toString() || "",
        low_stock_threshold: product.low_stock_threshold?.toString() || "10",
        commission_type: product.commission_type || "default",
        commission_rate: product.commission_rate?.toString() || "",
        is_available: product.is_available ?? true,
        is_featured: product.is_featured ?? false,
        is_best_seller: product.is_best_seller ?? false,
        is_trending: product.is_trending ?? false,
        is_organic: product.is_organic ?? false,
        is_veg: product.is_veg ?? true,
        expiry_date: product.expiry_date || "",
      });
    }
  }, [product, formData]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
    setChangedFields((prev) => new Set([...prev, field]));
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData({ ...formData, name, slug });
    setHasChanges(true);
    setChangedFields((prev) => new Set([...prev, "name", "slug"]));
  };

  const handlePriceChange = (field: "price" | "discount_price", value: string) => {
    const updated = { ...formData, [field]: value };

    if (field === "price" || field === "discount_price") {
      const price = parseFloat(updated.price) || 0;
      const discountPrice = parseFloat(updated.discount_price) || 0;

      if (price > 0 && discountPrice > 0 && discountPrice < price) {
        updated.discount_percentage = String(
          Math.round(((price - discountPrice) / price) * 100)
        );
      } else {
        updated.discount_percentage = "0";
      }
    }

    setFormData(updated);
    setHasChanges(true);
    setChangedFields((prev) => new Set([...prev, field]));
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData({ ...formData, category_id: categoryId, sub_category_id: "" });
    setHasChanges(true);
    setChangedFields((prev) => new Set([...prev, "category_id", "sub_category_id"]));
  };

  const handleResetDiscount = () => {
    if (confirm("Are you sure you want to reset the discount?")) {
      setFormData({ ...formData, discount_price: "", discount_percentage: "0" });
      setHasChanges(true);
      setChangedFields((prev) => new Set([...prev, "discount_price"]));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build updates object with only changed fields
    const updates: ProductUpdate = {};
    changedFields.forEach((field) => {
      const value = formData[field];

      // Handle numeric fields
      if (["price", "discount_price", "discount_percentage", "commission_rate"].includes(field)) {
        updates[field] = value ? parseFloat(value) : null;
      }
      // Handle integer fields
      else if (["stock_quantity", "low_stock_threshold"].includes(field)) {
        updates[field] = value ? parseInt(value) : null;
      }
      // Handle string fields that can be null
      else if (["barcode", "short_description", "description", "sub_category_id", "expiry_date"].includes(field)) {
        updates[field] = value || null;
      }
      // Handle other fields
      else {
        updates[field] = value;
      }
    });

    updateProduct.mutate(
      { productId:productId, updates },
      {
        onSuccess: () => {
          toast.success("Product updated successfully!");
          setHasChanges(false);
          setChangedFields(new Set());
          router.push(`/admin/products/${productId}`);
        },
        onError: (error: any) => {
          toast.error(`Failed to update product: ${error.message}`);
        },
      }
    );
  };

  const handleDiscard = () => {
    if (hasChanges) {
      if (
        confirm(
          "You have unsaved changes. Are you sure you want to discard them?"
        )
      ) {
        router.push(`/admin/products/${id}`);
      }
    } else {
      router.push(`/admin/products/${id}`);
    }
  };

  if (isLoadingProduct || !formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/admin/products/${productId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
              Edit Product
            </h1>
            <p className="text-slate-600 mt-2">{product?.name}</p>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900">
                    You have unsaved changes
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">
                    {changedFields.size} field(s) modified. Don't forget to save
                    before leaving.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Product Name *
                    {changedFields.has("name") && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Modified
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Organic Basmati Rice"
                    required
                    className={
                      changedFields.has("name") ? "border-amber-300 bg-amber-50" : ""
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug
                    {changedFields.has("slug") && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Modified
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleFieldChange("slug", e.target.value)}
                    placeholder="organic-basmati-rice"
                    className={
                      changedFields.has("slug") ? "border-amber-300 bg-amber-50" : ""
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleFieldChange("sku", e.target.value)}
                    placeholder="SKU001"
                    required
                    disabled
                    className="bg-slate-100"
                  />
                  <p className="text-xs text-slate-500">SKU cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">
                    Barcode
                    {changedFields.has("barcode") && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Modified
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleFieldChange("barcode", e.target.value)}
                    placeholder="8901234567890"
                    className={
                      changedFields.has("barcode")
                        ? "border-amber-300 bg-amber-50"
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">
                  Short Description
                  {changedFields.has("short_description") && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Modified
                    </Badge>
                  )}
                </Label>
                <Input
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) =>
                    handleFieldChange("short_description", e.target.value)
                  }
                  placeholder="Brief product description"
                  className={
                    changedFields.has("short_description")
                      ? "border-amber-300 bg-amber-50"
                      : ""
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Full Description
                  {changedFields.has("description") && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Modified
                    </Badge>
                  )}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                  placeholder="Detailed product description"
                  rows={4}
                  className={
                    changedFields.has("description")
                      ? "border-amber-300 bg-amber-50"
                      : ""
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Mapping */}
          <Card>
            <CardHeader>
              <CardTitle>Category & Vendor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category *
                    {changedFields.has("category_id") && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Modified
                      </Badge>
                    )}
                  </Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger
                      id="category"
                      className={
                        changedFields.has("category_id")
                          ? "border-amber-300 bg-amber-50"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">
                    Subcategory
                    {changedFields.has("sub_category_id") && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Modified
                      </Badge>
                    )}
                  </Label>
                  <Select
                    value={formData.sub_category_id}
                    onValueChange={(value) =>
                      handleFieldChange("sub_category_id", value)
                    }
                    disabled={!formData.category_id}
                  >
                    <SelectTrigger
                      id="subcategory"
                      className={
                        changedFields.has("sub_category_id")
                          ? "border-amber-300 bg-amber-50"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories?.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorId">Vendor *</Label>
                  <Input
                    value={
                      vendors?.find((v) => v.user_id === formData.vendor_id)
                        ?.store_name || ""
                    }
                    disabled
                    className="bg-slate-100"
                  />
                  <p className="text-xs text-slate-500">
                    Vendor cannot be changed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pricing</CardTitle>
              {formData.discount_price && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetDiscount}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Discount
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Price (₹) *
                    {changedFields.has("price") && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Modified
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handlePriceChange("price", e.target.value)}
                    placeholder="299.00"
                    required
                    className={
                      changedFields.has("price")
                        ? "border-amber-300 bg-amber-50"
                        : ""
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_price">
                    Discount Price (₹)
                    {changedFields.has("discount_price") && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Modified
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="discount_price"
                    type="number"
                    step="0.01"
                    value={formData.discount_price}
                    onChange={(e) =>
                      handlePriceChange("discount_price", e.target.value)
                    }
                    placeholder="249.00"
                    className={
                      changedFields.has("discount_price")
                        ? "border-amber-300 bg-amber-50"
                        : ""
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <div className="h-10 px-3 py-2 border border-slate-200 rounded-md bg-slate-50 flex items-center">
                    <span className="font-semibold text-emerald-600">
                      {formData.discount_percentage || 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">
                  Unit *
                  {changedFields.has("unit") && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Modified
                    </Badge>
                  )}
                </Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleFieldChange("unit", e.target.value)}
                  placeholder="e.g., 1kg, 500g, 1ltr, 5pcs"
                  required
                  className={
                    changedFields.has("unit")
                      ? "border-amber-300 bg-amber-50"
                      : ""
                  }
                />
                <p className="text-xs text-slate-500">
                  Enter unit with value (e.g., 1kg, 500g, 2ltr, 10pcs)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">
                    Stock Quantity *
                    {changedFields.has("stock_quantity") && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Modified
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      handleFieldChange("stock_quantity", e.target.value)
                    }
                    placeholder="100"
                    required
                    className={
                      changedFields.has("stock_quantity")
                        ? "border-amber-300 bg-amber-50"
                        : ""
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="low_stock_threshold">
                    Low Stock Threshold
                    {changedFields.has("low_stock_threshold") && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Modified
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) =>
                      handleFieldChange("low_stock_threshold", e.target.value)
                    }
                    placeholder="10"
                    className={
                      changedFields.has("low_stock_threshold")
                        ? "border-amber-300 bg-amber-50"
                        : ""
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission */}
          <Card>
            <CardHeader>
              <CardTitle>Commission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commission_type">
                    Commission Type *
                    {changedFields.has("commission_type") && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Modified
                      </Badge>
                    )}
                  </Label>
                  <Select
                    value={formData.commission_type}
                    onValueChange={(value) =>
                      handleFieldChange("commission_type", value)
                    }
                  >
                    <SelectTrigger
                      id="commission_type"
                      className={
                        changedFields.has("commission_type")
                          ? "border-amber-300 bg-amber-50"
                          : ""
                      }
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (10%)</SelectItem>
                      <SelectItem value="category">Category Based</SelectItem>
                      <SelectItem value="subcategory">
                        Subcategory Based
                      </SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.commission_type === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="commission_rate">
                      Commission Rate (%)
                      {changedFields.has("commission_rate") && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Modified
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      step="0.01"
                      value={formData.commission_rate}
                      onChange={(e) =>
                        handleFieldChange("commission_rate", e.target.value)
                      }
                      placeholder="15"
                      className={
                        changedFields.has("commission_rate")
                          ? "border-amber-300 bg-amber-50"
                          : ""
                      }
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Flags */}
          <Card>
            <CardHeader>
              <CardTitle>Product Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="is_available" className="font-medium">
                      Available
                    </Label>
                    <p className="text-sm text-slate-500">
                      Product is available for sale
                    </p>
                  </div>
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) =>
                      handleFieldChange("is_available", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="is_featured" className="font-medium">
                      Featured
                    </Label>
                    <p className="text-sm text-slate-500">Show in featured section</p>
                  </div>
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) =>
                      handleFieldChange("is_featured", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="is_best_seller" className="font-medium">
                      Best Seller
                    </Label>
                    <p className="text-sm text-slate-500">Mark as best seller</p>
                  </div>
                  <Switch
                    id="is_best_seller"
                    checked={formData.is_best_seller}
                    onCheckedChange={(checked) =>
                      handleFieldChange("is_best_seller", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="is_trending" className="font-medium">
                      Trending
                    </Label>
                    <p className="text-sm text-slate-500">Show in trending items</p>
                  </div>
                  <Switch
                    id="is_trending"
                    checked={formData.is_trending}
                    onCheckedChange={(checked) =>
                      handleFieldChange("is_trending", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="is_organic" className="font-medium">
                      Organic
                    </Label>
                    <p className="text-sm text-slate-500">Certified organic product</p>
                  </div>
                  <Switch
                    id="is_organic"
                    checked={formData.is_organic}
                    onCheckedChange={(checked) =>
                      handleFieldChange("is_organic", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="is_veg" className="font-medium">
                      Vegetarian
                    </Label>
                    <p className="text-sm text-slate-500">Vegetarian product</p>
                  </div>
                  <Switch
                    id="is_veg"
                    checked={formData.is_veg}
                    onCheckedChange={(checked) =>
                      handleFieldChange("is_veg", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expiry_date">
                  Expiry/Shelf Life (Optional)
                  {changedFields.has("expiry_date") && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Modified
                    </Badge>
                  )}
                </Label>
                <Input
                  id="expiry_date"
                  value={formData.expiry_date}
                  onChange={(e) => handleFieldChange("expiry_date", e.target.value)}
                  placeholder="e.g., 5 days, 2 weeks, 6 months, 1 year"
                  className={`w-full md:w-[300px] ${changedFields.has("expiry_date")
                      ? "border-amber-300 bg-amber-50"
                      : ""
                    }`}
                />
                <p className="text-xs text-slate-500">
                  Enter shelf life duration (e.g., 5 days, 30 days, 6 months)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDiscard}
                  className="gap-2"
                  disabled={updateProduct.isPending}
                >
                  <X className="w-4 h-4" />
                  Discard
                </Button>
                <Button
                  type="submit"
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  disabled={!hasChanges || updateProduct.isPending}
                >
                  {updateProduct.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes ({changedFields.size})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}