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
import { ArrowLeft, Save, X, AlertCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const categories = [
  { value: "grains", label: "Grains & Rice", subcategories: ["Rice", "Wheat", "Pulses"] },
  { value: "dairy", label: "Dairy", subcategories: ["Milk", "Cheese", "Yogurt", "Butter"] },
  { value: "beverages", label: "Beverages", subcategories: ["Tea", "Coffee", "Juice", "Soda"] },
  { value: "bakery", label: "Bakery", subcategories: ["Bread", "Cakes", "Cookies", "Pastries"] },
  { value: "pantry", label: "Pantry", subcategories: ["Sweeteners", "Spices", "Oils", "Sauces"] },
];

const vendors = [
  { value: "V001", label: "Organic Farms Ltd" },
  { value: "V002", label: "Dairy Fresh" },
  { value: "V003", label: "Baker's Delight" },
  { value: "V004", label: "Green Grocers" },
  { value: "V005", label: "Fresh Harvest Co" },
];

// Mock existing product data
const existingProduct = {
  id: "PROD001",
  name: "Organic Basmati Rice",
  slug: "organic-basmati-rice",
  sku: "SKU001",
  barcode: "8901234567890",
  shortDescription: "Premium quality aged basmati rice from organic farms",
  fullDescription:
    "Our Organic Basmati Rice is sourced from certified organic farms in the foothills of the Himalayas. Each grain is aged for a minimum of 2 years to enhance flavor and aroma.",
  category: "grains",
  subcategory: "Rice",
  vendorId: "V001",
  price: "299.00",
  discountPrice: "249.00",
  unit: "kg",
  stockQuantity: "150",
  lowStockThreshold: "20",
  commissionType: "category",
  commissionRate: "12",
  isAvailable: true,
  isFeatured: true,
  isBestSeller: true,
  isTrending: false,
  isOrganic: true,
  isVeg: true,
  expiryDate: "2025-12-31",
};

export default function EditProductPage({ params }) {
  const router = useRouter();
  const [formData, setFormData] = useState(existingProduct);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [changedFields, setChangedFields] = useState(new Set());

  useEffect(() => {
    const category = categories.find((c) => c.value === existingProduct.category);
    setSelectedCategory(category);
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
    setChangedFields((prev) => new Set([...prev, field]));
  };

  const handleNameChange = (name) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData({ ...formData, name, slug });
    setHasChanges(true);
    setChangedFields((prev) => new Set([...prev, "name", "slug"]));
  };

  const handlePriceChange = (field, value) => {
    const updated = { ...formData, [field]: value };

    if (field === "price" || field === "discountPrice") {
      const price = parseFloat(updated.price) || 0;
      const discountPrice = parseFloat(updated.discountPrice) || 0;

      if (price > 0 && discountPrice > 0 && discountPrice < price) {
        updated.discountPercentage = Math.round(
          ((price - discountPrice) / price) * 100
        );
      } else {
        updated.discountPercentage = 0;
      }
    }

    setFormData(updated);
    setHasChanges(true);
    setChangedFields((prev) => new Set([...prev, field]));
  };

  const handleCategoryChange = (categoryValue) => {
    const category = categories.find((c) => c.value === categoryValue);
    setSelectedCategory(category);
    setFormData({ ...formData, category: categoryValue, subcategory: "" });
    setHasChanges(true);
    setChangedFields((prev) => new Set([...prev, "category", "subcategory"]));
  };

  const handleResetDiscount = () => {
    if (confirm("Are you sure you want to reset the discount?")) {
      setFormData({ ...formData, discountPrice: "", discountPercentage: 0 });
      setHasChanges(true);
      setChangedFields((prev) => new Set([...prev, "discountPrice"]));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Updated Product Data:", formData);
    console.log("Changed Fields:", Array.from(changedFields));
    // Here you would typically send the data to your backend
    router.push(`/admin/products/${formData.id}`);
  };

  const handleDiscard = () => {
    if (hasChanges) {
      if (
        confirm(
          "You have unsaved changes. Are you sure you want to discard them?"
        )
      ) {
        router.push(`/admin/products/${formData.id}`);
      }
    } else {
      router.push(`/admin/products/${formData.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/admin/products/${formData.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
              Edit Product
            </h1>
            <p className="text-slate-600 mt-2">{formData.name}</p>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleFieldChange("barcode", e.target.value)}
                    placeholder="8901234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">
                  Short Description
                  {changedFields.has("shortDescription") && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Modified
                    </Badge>
                  )}
                </Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) =>
                    handleFieldChange("shortDescription", e.target.value)
                  }
                  placeholder="Brief product description"
                  className={
                    changedFields.has("shortDescription")
                      ? "border-amber-300 bg-amber-50"
                      : ""
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullDescription">
                  Full Description
                  {changedFields.has("fullDescription") && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Modified
                    </Badge>
                  )}
                </Label>
                <Textarea
                  id="fullDescription"
                  value={formData.fullDescription}
                  onChange={(e) =>
                    handleFieldChange("fullDescription", e.target.value)
                  }
                  placeholder="Detailed product description"
                  rows={4}
                  className={
                    changedFields.has("fullDescription")
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
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory *</Label>
                  <Select
                    value={formData.subcategory}
                    onValueChange={(value) =>
                      handleFieldChange("subcategory", value)
                    }
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger id="subcategory">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategory?.subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorId">
                    Vendor *
                    {changedFields.has("vendorId") && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Modified
                      </Badge>
                    )}
                  </Label>
                  <Select
                    value={formData.vendorId}
                    onValueChange={(value) => handleFieldChange("vendorId", value)}
                  >
                    <SelectTrigger
                      id="vendorId"
                      className={
                        changedFields.has("vendorId")
                          ? "border-amber-300 bg-amber-50"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.value} value={vendor.value}>
                          {vendor.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pricing</CardTitle>
              {formData.discountPrice && (
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
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handlePriceChange("price", e.target.value)}
                    placeholder="299.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountPrice">Discount Price (₹)</Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    step="0.01"
                    value={formData.discountPrice}
                    onChange={(e) =>
                      handlePriceChange("discountPrice", e.target.value)
                    }
                    placeholder="249.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <div className="h-10 px-3 py-2 border border-slate-200 rounded-md bg-slate-50 flex items-center">
                    <span className="font-semibold text-emerald-600">
                      {formData.discountPercentage || 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => handleFieldChange("unit", value)}
                >
                  <SelectTrigger id="unit" className="w-full md:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="ltr">Liter (ltr)</SelectItem>
                    <SelectItem value="ml">Milliliter (ml)</SelectItem>
                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                  </SelectContent>
                </Select>
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
                  <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      handleFieldChange("stockQuantity", e.target.value)
                    }
                    placeholder="100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      handleFieldChange("lowStockThreshold", e.target.value)
                    }
                    placeholder="10"
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
                  <Label htmlFor="commissionType">Commission Type *</Label>
                  <Select
                    value={formData.commissionType}
                    onValueChange={(value) =>
                      handleFieldChange("commissionType", value)
                    }
                  >
                    <SelectTrigger id="commissionType">
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

                {formData.commissionType === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.01"
                      value={formData.commissionRate}
                      onChange={(e) =>
                        handleFieldChange("commissionRate", e.target.value)
                      }
                      placeholder="15"
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
                    <Label htmlFor="isAvailable" className="font-medium">
                      Available
                    </Label>
                    <p className="text-sm text-slate-500">
                      Product is available for sale
                    </p>
                  </div>
                  <Switch
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onCheckedChange={(checked) =>
                      handleFieldChange("isAvailable", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="isFeatured" className="font-medium">
                      Featured
                    </Label>
                    <p className="text-sm text-slate-500">Show in featured section</p>
                  </div>
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) =>
                      handleFieldChange("isFeatured", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="isBestSeller" className="font-medium">
                      Best Seller
                    </Label>
                    <p className="text-sm text-slate-500">Mark as best seller</p>
                  </div>
                  <Switch
                    id="isBestSeller"
                    checked={formData.isBestSeller}
                    onCheckedChange={(checked) =>
                      handleFieldChange("isBestSeller", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="isTrending" className="font-medium">
                      Trending
                    </Label>
                    <p className="text-sm text-slate-500">Show in trending items</p>
                  </div>
                  <Switch
                    id="isTrending"
                    checked={formData.isTrending}
                    onCheckedChange={(checked) =>
                      handleFieldChange("isTrending", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="isOrganic" className="font-medium">
                      Organic
                    </Label>
                    <p className="text-sm text-slate-500">Certified organic product</p>
                  </div>
                  <Switch
                    id="isOrganic"
                    checked={formData.isOrganic}
                    onCheckedChange={(checked) =>
                      handleFieldChange("isOrganic", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="isVeg" className="font-medium">
                      Vegetarian
                    </Label>
                    <p className="text-sm text-slate-500">Vegetarian product</p>
                  </div>
                  <Switch
                    id="isVeg"
                    checked={formData.isVeg}
                    onCheckedChange={(checked) =>
                      handleFieldChange("isVeg", checked)
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
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleFieldChange("expiryDate", e.target.value)}
                  className="w-full md:w-[300px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Status Control */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-red-900">Deactivate Product</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This will make the product unavailable for customers
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleFieldChange("isAvailable", false)}
                >
                  Deactivate
                </Button>
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
                >
                  <X className="w-4 h-4" />
                  Discard
                </Button>
                <Button
                  type="submit"
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  disabled={!hasChanges}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}