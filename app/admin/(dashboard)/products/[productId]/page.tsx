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
} from "lucide-react";
import Link from "next/link";

// Mock Product Data
const mockProduct = {
  id: "PROD001",
  name: "Organic Basmati Rice",
  slug: "organic-basmati-rice",
  sku: "SKU001",
  barcode: "8901234567890",
  category: "Grains & Rice",
  subcategory: "Rice",
  price: 299.00,
  discountPrice: 249.00,
  discountPercentage: 17,
  unit: "kg",
  stockQuantity: 150,
  lowStockThreshold: 20,
  stockStatus: "in_stock",
  commissionType: "category",
  commissionRate: 12,
  isAvailable: true,
  isFeatured: true,
  isBestSeller: true,
  isTrending: false,
  isOrganic: true,
  isVeg: true,
  rating: 4.5,
  reviewCount: 234,
  vendorId: "V001",
  vendorName: "Organic Farms Ltd",
  shortDescription: "Premium quality aged basmati rice from organic farms",
  fullDescription:
    "Our Organic Basmati Rice is sourced from certified organic farms in the foothills of the Himalayas. Each grain is aged for a minimum of 2 years to enhance flavor and aroma. Perfect for biryanis, pulaos, and everyday meals.",
  expiryDate: "2025-12-31",
  createdAt: "2024-01-15T10:30:00",
  updatedAt: "2024-02-10T14:20:00",
  images: [
    "/products/rice-1.jpg",
    "/products/rice-2.jpg",
    "/products/rice-3.jpg",
  ],
  attributes: {
    "Grain Type": "Long Grain",
    "Cooking Time": "15-20 minutes",
    Origin: "India",
    Certification: "USDA Organic",
    "Shelf Life": "12 months",
  },
};

export default function ProductDetailPage({ params }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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
                  {mockProduct.name}
                </h1>
                <Badge
                  className={
                    mockProduct.isAvailable
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {mockProduct.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <p className="text-slate-600 mt-2">Product ID: {mockProduct.id}</p>
            </div>
          </div>
          <Link href={`/admin/products/${mockProduct.id}/edit`}>
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
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {mockProduct.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-slate-300"
                    >
                      <Package className="w-12 h-12 text-slate-400" />
                    </div>
                  ))}
                </div>
                <Link
                  href={`/admin/products/${mockProduct.id}/images`}
                  className="mt-4 inline-block"
                >
                  <Button variant="outline" size="sm">
                    Manage Images
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-slate-600 mb-2">
                    Short Description
                  </h4>
                  <p className="text-slate-700">{mockProduct.shortDescription}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-600 mb-2">
                    Full Description
                  </h4>
                  <p className="text-slate-700">{mockProduct.fullDescription}</p>
                </div>
              </CardContent>
            </Card>

            {/* Attributes */}
            <Card>
              <CardHeader>
                <CardTitle>Product Attributes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(mockProduct.attributes).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between py-2 border-b last:border-b-0"
                    >
                      <span className="font-medium text-slate-600">{key}</span>
                      <span className="text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                    {formatCurrency(mockProduct.discountPrice || mockProduct.price)}
                  </div>
                </div>
                {mockProduct.discountPrice && (
                  <>
                    <div>
                      <div className="text-sm text-slate-600">Original Price</div>
                      <div className="text-xl text-slate-500 line-through mt-1">
                        {formatCurrency(mockProduct.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-700">
                        {mockProduct.discountPercentage}% OFF
                      </Badge>
                      <span className="text-sm text-slate-600">
                        Save {formatCurrency(mockProduct.price - mockProduct.discountPrice)}
                      </span>
                    </div>
                  </>
                )}
                <div className="pt-2 border-t">
                  <div className="text-sm text-slate-600">Unit</div>
                  <div className="text-lg font-medium mt-1">
                    {mockProduct.unit.toUpperCase()}
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
                    {mockProduct.stockQuantity}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Stock Status</div>
                  <div className="mt-2">
                    <Badge
                      className={
                        mockProduct.stockStatus === "in_stock"
                          ? "bg-emerald-100 text-emerald-700"
                          : mockProduct.stockStatus === "low_stock"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {mockProduct.stockStatus === "in_stock"
                        ? "In Stock"
                        : mockProduct.stockStatus === "low_stock"
                        ? "Low Stock"
                        : "Out of Stock"}
                    </Badge>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-slate-600">Low Stock Threshold</div>
                  <div className="text-lg font-medium mt-1">
                    {mockProduct.lowStockThreshold}
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
                  <div className="font-medium mt-1">{mockProduct.category}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Subcategory</div>
                  <div className="font-medium mt-1">{mockProduct.subcategory}</div>
                </div>
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
                    {mockProduct.commissionType}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Commission Rate</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {mockProduct.commissionRate}%
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
                  <span className="text-3xl font-bold">{mockProduct.rating}</span>
                  <span className="text-slate-600">/ 5.0</span>
                </div>
                <div className="text-sm text-slate-600">
                  Based on {mockProduct.reviewCount} reviews
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
                  {mockProduct.isOrganic && (
                    <Badge className="bg-green-100 text-green-700">Organic</Badge>
                  )}
                  {mockProduct.isVeg && (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      Vegetarian
                    </Badge>
                  )}
                  {mockProduct.isFeatured && (
                    <Badge className="bg-blue-100 text-blue-700">Featured</Badge>
                  )}
                  {mockProduct.isBestSeller && (
                    <Badge className="bg-purple-100 text-purple-700">
                      Best Seller
                    </Badge>
                  )}
                  {mockProduct.isTrending && (
                    <Badge className="bg-pink-100 text-pink-700">Trending</Badge>
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
                  <div className="font-mono mt-1">{mockProduct.sku}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Barcode</div>
                  <div className="font-mono mt-1">{mockProduct.barcode}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Vendor</div>
                  <div className="font-medium mt-1">
                    {mockProduct.vendorName}
                    <span className="text-xs text-slate-500 ml-2">
                      ({mockProduct.vendorId})
                    </span>
                  </div>
                </div>
                {mockProduct.expiryDate && (
                  <div>
                    <div className="text-sm text-slate-600">Expiry Date</div>
                    <div className="font-medium mt-1">
                      {formatDate(mockProduct.expiryDate)}
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t space-y-2">
                  <div className="text-xs text-slate-500">
                    Created: {formatDate(mockProduct.createdAt)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Updated: {formatDate(mockProduct.updatedAt)}
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