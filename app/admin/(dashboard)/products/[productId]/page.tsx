// app/admin/products/[id]/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Edit,
  Package,
  Star,
  Calendar,
  BarChart3,
  Tag,
  Leaf,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useProduct, useProductImages } from "@/hooks";
import { useParams } from "next/navigation";

export default function ProductDetailPage( ) {
  const { productId:id } = useParams<{productId:string}>();
  const { data: product, isLoading } = useProduct(id);
  const { data: images } = useProductImages(id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-slate-600">Product not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/products">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
                  {product.name}
                </h1>
                <Badge
                  className={
                    product.is_available
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {product.is_available ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <p className="text-slate-600 mt-2">Product ID: {product.id}</p>
            </div>
          </div>
          <Link href={`/admin/products/${id}/edit`}>
            <Button className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Edit className="w-4 h-4" />
              Edit Product
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Images */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Product Images</CardTitle>
                  <Link href={`/admin/products/${id}/images`}>
                    <Button variant="outline" size="sm">
                      Manage Images
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {images && images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {images.slice(0, 6).map((img) => (
                      <div
                        key={img.id}
                        className="relative aspect-square rounded-lg bg-slate-200 overflow-hidden border-2 border-slate-300"
                      >
                        <Image
                          src={img.image_url}
                          alt={img.alt_text || product.name}
                          fill
                          className="object-cover"
                        />
                        {img.is_primary && (
                          <Badge className="absolute top-2 right-2 bg-yellow-400 text-yellow-900">
                            Primary
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No images uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.short_description && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-600 mb-2">
                      Short Description
                    </h4>
                    <p className="text-slate-700">{product.short_description}</p>
                  </div>
                )}
                {product.description && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-600 mb-2">
                      Full Description
                    </h4>
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                )}
                {!product.short_description && !product.description && (
                  <p className="text-slate-500 italic">No description available</p>
                )}
              </CardContent>
            </Card>

            {/* Attributes */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Attributes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(product.attributes as Record<string, any>).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between py-2 border-b last:border-b-0"
                        >
                          <span className="font-medium text-slate-600">{key}</span>
                          <span className="text-slate-900">{String(value)}</span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-slate-600">Current Price</div>
                  <div className="text-3xl font-bold text-emerald-600 mt-1">
                    {formatCurrency(
                      parseFloat(product.discount_price?.toString() || "0") ||
                        parseFloat(product.price?.toString() || "0")
                    )}
                  </div>
                </div>
                {product.discount_price && parseFloat(product.discount_price.toString()) > 0 && (
                  <>
                    <div>
                      <div className="text-sm text-slate-600">Original Price</div>
                      <div className="text-xl text-slate-500 line-through mt-1">
                        {formatCurrency(parseFloat(product.price?.toString() || "0"))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-700">
                        {product.discount_percentage}% OFF
                      </Badge>
                      <span className="text-sm text-slate-600">
                        Save{" "}
                        {formatCurrency(
                          parseFloat(product.price?.toString() || "0") -
                            parseFloat(product.discount_price.toString())
                        )}
                      </span>
                    </div>
                  </>
                )}
                <div className="pt-2 border-t">
                  <div className="text-sm text-slate-600">Unit</div>
                  <div className="text-lg font-medium mt-1">
                    {product.unit || "N/A"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-slate-600">Stock Quantity</div>
                  <div className="text-2xl font-bold mt-1">
                    {product.stock_quantity}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Stock Status</div>
                  <div className="mt-2">
                    <Badge
                      className={
                        product.stock_status === "in_stock"
                          ? "bg-emerald-100 text-emerald-700"
                          : product.stock_status === "low_stock"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {product.stock_status === "in_stock"
                        ? "In Stock"
                        : product.stock_status === "low_stock"
                        ? "Low Stock"
                        : "Out of Stock"}
                    </Badge>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-slate-600">Low Stock Threshold</div>
                  <div className="text-lg font-medium mt-1">
                    {product.low_stock_threshold}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-slate-600">Category</div>
                  <div className="font-medium mt-1">
                    {product.category?.name || "N/A"}
                  </div>
                </div>
                {product.sub_category && (
                  <div>
                    <div className="text-sm text-slate-600">Subcategory</div>
                    <div className="font-medium mt-1">{product.sub_category.name}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commission */}
            <Card>
              <CardHeader>
                <CardTitle>Commission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-slate-600">Commission Type</div>
                  <Badge variant="outline" className="mt-1">
                    {product.commission_type}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Commission Rate</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {product.commission_rate}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Ratings & Reviews
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <span className="text-3xl font-bold">
                    {parseFloat(product.rating?.toString() || "0").toFixed(1)}
                  </span>
                  <span className="text-slate-600">/ 5.0</span>
                </div>
                <div className="text-sm text-slate-600">
                  Based on {product.review_count} reviews
                </div>
              </CardContent>
            </Card>

            {/* Product Flags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5" />
                  Product Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.is_organic && (
                    <Badge className="bg-green-100 text-green-700">Organic</Badge>
                  )}
                  {product.is_veg && (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      Vegetarian
                    </Badge>
                  )}
                  {product.is_featured && (
                    <Badge className="bg-blue-100 text-blue-700">Featured</Badge>
                  )}
                  {product.is_best_seller && (
                    <Badge className="bg-purple-100 text-purple-700">
                      Best Seller
                    </Badge>
                  )}
                  {product.is_trending && (
                    <Badge className="bg-pink-100 text-pink-700">Trending</Badge>
                  )}
                  {!product.is_organic &&
                    !product.is_veg &&
                    !product.is_featured &&
                    !product.is_best_seller &&
                    !product.is_trending && (
                      <span className="text-sm text-slate-500">No tags</span>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Meta Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Additional Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-slate-600">SKU</div>
                  <div className="font-mono mt-1">{product.sku}</div>
                </div>
                {product.barcode && (
                  <div>
                    <div className="text-sm text-slate-600">Barcode</div>
                    <div className="font-mono mt-1">{product.barcode}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-slate-600">Vendor</div>
                  <div className="font-medium mt-1">
                    {product.vendor?.store_name || "N/A"}
                  </div>
                </div>
                {product.expiry_date && (
                  <div>
                    <div className="text-sm text-slate-600">Shelf Life</div>
                    <div className="font-medium mt-1">
                      {product.expiry_date}
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t space-y-2">
                  <div className="text-xs text-slate-500">
                    Created: {formatDate(product.created_at || "")}
                  </div>
                  <div className="text-xs text-slate-500">
                    Updated: {formatDate(product.updated_at || "")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}