// app/admin/products/add/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { ArrowLeft, Save, X, Upload, Loader2, Star, ImagePlus, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateProduct, useCategories, useSubCategoriesByCategory } from "@/hooks";
import { useVendors } from "@/hooks";
import { toast } from "sonner";
import { uploadProductImage } from "@/lib/upload";
import type { CommissionType, ProductInsert } from "@/types/supabase";

// ─── Multi-image types ────────────────────────────────────────────────────────

interface ImageFile {
  id: string;
  previewUrl: string;
  file: File;
  altText: string;
  isPrimary: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddProductPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  // ── Multi-image state (replaces single imageFile / imagePreview) ────────────
  const [images, setImages] = useState<ImageFile[]>([]);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) return;

    setImages((prev) => {
      const remaining = 10 - prev.length;
      if (remaining <= 0) {
        toast.warning("Maximum 10 images allowed.");
        return prev;
      }
      const toAdd = imageFiles.slice(0, remaining);
      const newImgs: ImageFile[] = toAdd.map((file, i) => ({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
        previewUrl: URL.createObjectURL(file),
        file,
        altText: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        isPrimary: prev.length === 0 && i === 0,
      }));
      return [...prev, ...newImgs];
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  }, []);

  const setPrimary = useCallback((id: string) => {
    setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === id })));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );


  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    barcode: "",
    short_description: "",
    description: "",
    category_id: "",
    sub_category_id: "",
    vendor_id: "",
    price: "",
    discount_price: "",
    discount_percentage: "0",
    unit: "",
    stock_quantity: "",
    low_stock_threshold: "10",
    commission_type: "default" as CommissionType,
    commission_rate: "",
    is_available: true,
    is_featured: false,
    is_best_seller: false,
    is_trending: false,
    is_organic: false,
    is_veg: true,
    expiry_date: "",
    attributes: {} as Record<string, string>,
  });

  // Fetch data
  const { data: categories } = useCategories();
  const { data: subCategories } = useSubCategoriesByCategory(formData.category_id);
  const { data: vendors } = useVendors({ is_verified: true });
  const createProduct = useCreateProduct();

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const selectedCategory = categories?.find(
      (cat) => cat.id === formData.category_id
    );

    const categoryPrefix = selectedCategory?.name
      ?.substring(0, 3)
      .toUpperCase() || "GEN";

    const productPrefix = name.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const sku = `${categoryPrefix}-${productPrefix}-${randomNum}`;

    setFormData({ ...formData, name, slug, sku });
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
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData({ ...formData, category_id: categoryId, sub_category_id: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendor_id) {
      toast.error("Please select a vendor");
      return;
    }

    if (!formData.category_id) {
      toast.error("Please select a category");
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }

    setIsUploading(true);

    try {
      const productData: ProductInsert = {
        name: formData.name,
        slug: formData.slug,
        sku: formData.sku,
        barcode: formData.barcode || null,
        short_description: formData.short_description || null,
        description: formData.description || null,
        category_id: formData.category_id,
        sub_category_id: formData.sub_category_id || null,
        vendor_id: formData.vendor_id,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        unit: formData.unit,
        stock_quantity: parseInt(formData.stock_quantity),
        low_stock_threshold: parseInt(formData.low_stock_threshold),
        commission_type: formData.commission_type,
        commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) : null,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        is_best_seller: formData.is_best_seller,
        is_trending: formData.is_trending,
        is_organic: formData.is_organic,
        is_veg: formData.is_veg,
        image: null,
        expiry_date: formData.expiry_date || null,
        attributes: Object.keys(formData.attributes).length > 0 ? formData.attributes : null,
      };


      createProduct.mutate({ product: productData, productImages: images }, {
        onSuccess: (data) => {
          toast.success("Product created successfully!");
          router.push(`/admin/products/${data.id}`);
        },
        onError: (error: any) => {
          toast.error(`Failed to create product: ${error.message}`);
          setIsUploading(false);
        },
      });
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? All changes will be lost.")) {
      router.push("/admin/products");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
              Add New Product
            </h1>
            <p className="text-slate-600 mt-2">
              Create a new product with detailed information
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Organic Basmati Rice"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="organic-basmati-rice"
                  />
                  <p className="text-xs text-slate-500">Auto-generated, editable</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sku"
                      value={formData.sku}
                      readOnly
                      className="bg-slate-100"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const date = new Date();
                        const year = date.getFullYear().toString().slice(-2);
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        const seconds = String(date.getSeconds()).padStart(2, '0');
                        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                        const newSKU = `SKU-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
                        setFormData({ ...formData, sku: newSKU });
                      }}
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Auto-generated based on current date & time</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    placeholder="8901234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Input
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) =>
                    setFormData({ ...formData, short_description: e.target.value })
                  }
                  placeholder="Brief product description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detailed product description"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Product Images (multi-upload) ─────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Product Images</span>
                {images.length > 0 && (
                  <span className="text-sm font-normal text-slate-500">
                    {images.length} / 10 uploaded
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop zone */}
              {images.length < 10 && (
                <div
                  ref={dropRef}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => {
                    const inp = document.createElement("input");
                    inp.type = "file";
                    inp.multiple = true;
                    inp.accept = "image/*";
                    inp.onchange = (e) =>
                      addFiles(Array.from((e.target as HTMLInputElement).files || []));
                    inp.click();
                  }}
                  className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${isDragging
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50"
                    }`}
                >
                  <Upload className={`w-8 h-8 ${isDragging ? "text-emerald-500" : "text-slate-400"}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {isDragging ? "Drop images here" : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      PNG, JPG, WEBP · up to 10 images · max 5MB each
                    </p>
                  </div>
                </div>
              )}

              {/* Image grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {images.map((img, i) => (
                    <div
                      key={img.id}
                      className={`group relative rounded-lg border-2 bg-white overflow-hidden transition-all ${img.isPrimary
                          ? "border-emerald-500 ring-2 ring-emerald-200"
                          : "border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      {/* Primary badge */}
                      {img.isPrimary && (
                        <div className="absolute top-1.5 left-1.5 z-10">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Primary
                          </span>
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1.5 right-1.5 z-10 rounded-full bg-red-500 p-0.5 text-white opacity-0 shadow transition-opacity group-hover:opacity-100 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      {/* Preview */}
                      <div className="aspect-square w-full bg-slate-100">
                        <img
                          src={img.previewUrl}
                          alt={img.altText}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Set primary button */}
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimary(img.id)}
                          className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors border-t border-slate-100"
                        >
                          <Star className="h-3 w-3" />
                          Set primary
                        </button>
                      )}
                      {img.isPrimary && (
                        <div className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 border-t border-emerald-100">
                          <Star className="h-3 w-3 fill-emerald-500" />
                          Primary image
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add more tile */}
                  {images.length < 10 && (
                    <button
                      type="button"
                      onClick={() => {
                        const inp = document.createElement("input");
                        inp.type = "file";
                        inp.multiple = true;
                        inp.accept = "image/*";
                        inp.onchange = (e) =>
                          addFiles(Array.from((e.target as HTMLInputElement).files || []));
                        inp.click();
                      }}
                      className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-xs font-medium">Add more</span>
                    </button>
                  )}
                </div>
              )}

              {images.length === 0 && (
                <p className="text-center text-xs text-slate-400">
                  At least 1 image required · First image is set as primary automatically
                </p>
              )}
            </CardContent>
          </Card>
          {/* ── End Product Images ────────────────────────────────────────────── */}

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
                    value={formData.category_id}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger id="category">
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
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select
                    value={formData.sub_category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sub_category_id: value })
                    }
                    disabled={!formData.category_id}
                  >
                    <SelectTrigger id="subcategory">
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
                  <Select
                    value={formData.vendor_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, vendor_id: value })
                    }
                  >
                    <SelectTrigger id="vendorId">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors?.map((vendor) => (
                        <SelectItem key={vendor.user_id} value={vendor.user_id}>
                          {vendor.store_name}
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
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
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
                  <Label htmlFor="discount_price">Discount Price (₹)</Label>
                  <Input
                    id="discount_price"
                    type="number"
                    step="0.01"
                    value={formData.discount_price}
                    onChange={(e) =>
                      handlePriceChange("discount_price", e.target.value)
                    }
                    placeholder="249.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <div className="h-10 px-3 py-2 border border-slate-200 rounded-md bg-slate-50 flex items-center">
                    <span className="font-semibold text-emerald-600">
                      {formData.discount_percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Auto-calculated</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  placeholder="e.g., 1kg, 500g, 1ltr, 5pcs"
                  required
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
                  <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stock_quantity: e.target.value })
                    }
                    placeholder="100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        low_stock_threshold: e.target.value,
                      })
                    }
                    placeholder="10"
                  />
                  <p className="text-xs text-slate-500">
                    Alert when stock falls below this number
                  </p>
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
                  <Label htmlFor="commission_type">Commission Type *</Label>
                  <Select
                    value={formData.commission_type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, commission_type: value })
                    }
                  >
                    <SelectTrigger id="commission_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (10%)</SelectItem>
                      <SelectItem value="category">Category Based</SelectItem>
                      <SelectItem value="subcategory">Subcategory Based</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.commission_type === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      step="0.01"
                      value={formData.commission_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commission_rate: e.target.value,
                        })
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
                      setFormData({ ...formData, is_available: checked })
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
                      setFormData({ ...formData, is_featured: checked })
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
                      setFormData({ ...formData, is_best_seller: checked })
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
                      setFormData({ ...formData, is_trending: checked })
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
                      setFormData({ ...formData, is_organic: checked })
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
                      setFormData({ ...formData, is_veg: checked })
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
                <Label htmlFor="expiry_date">Expiry/Shelf Life (Optional)</Label>
                <Input
                  id="expiry_date"
                  value={formData.expiry_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry_date: e.target.value })
                  }
                  placeholder="e.g., 5 days, 2 weeks, 6 months, 1 year"
                  className="w-full md:w-[300px]"
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
                  onClick={handleCancel}
                  className="gap-2"
                  disabled={isUploading || createProduct.isPending}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  disabled={isUploading || createProduct.isPending}
                >
                  {isUploading || createProduct.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Product
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