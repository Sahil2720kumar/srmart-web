"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Image as ImageIcon,
  XCircle,
  Star,
  Package,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Mock Data
const mockProducts = [
  {
    id: "PROD001",
    name: "Organic Basmati Rice",
    slug: "organic-basmati-rice",
    sku: "SKU001",
    barcode: "8901234567890",
    category: "Grains & Rice",
    subcategory: "Rice",
    price: 299.00,
    discountPrice: 249.00,
    stockQuantity: 150,
    stockStatus: "in_stock",
    commissionType: "category",
    commissionRate: 12,
    isAvailable: true,
    rating: 4.5,
    reviewCount: 234,
    image: "/products/rice.jpg",
    isOrganic: true,
    isVeg: true,
    vendorId: "V001",
    vendorName: "Organic Farms Ltd",
  },
  {
    id: "PROD002",
    name: "Fresh Milk 1L",
    slug: "fresh-milk-1l",
    sku: "SKU002",
    barcode: "8901234567891",
    category: "Dairy",
    subcategory: "Milk",
    price: 65.00,
    discountPrice: null,
    stockQuantity: 8,
    stockStatus: "low_stock",
    commissionType: "custom",
    commissionRate: 8,
    isAvailable: true,
    rating: 4.8,
    reviewCount: 456,
    image: "/products/milk.jpg",
    isOrganic: false,
    isVeg: true,
    vendorId: "V002",
    vendorName: "Dairy Fresh",
  },
  {
    id: "PROD003",
    name: "Premium Green Tea",
    slug: "premium-green-tea",
    sku: "SKU003",
    barcode: "8901234567892",
    category: "Beverages",
    subcategory: "Tea",
    price: 450.00,
    discountPrice: 399.00,
    stockQuantity: 0,
    stockStatus: "out_of_stock",
    commissionType: "subcategory",
    commissionRate: 15,
    isAvailable: false,
    rating: 4.6,
    reviewCount: 189,
    image: "/products/tea.jpg",
    isOrganic: true,
    isVeg: true,
    vendorId: "V001",
    vendorName: "Organic Farms Ltd",
  },
  {
    id: "PROD004",
    name: "Whole Wheat Bread",
    slug: "whole-wheat-bread",
    sku: "SKU004",
    barcode: "8901234567893",
    category: "Bakery",
    subcategory: "Bread",
    price: 45.00,
    discountPrice: null,
    stockQuantity: 75,
    stockStatus: "in_stock",
    commissionType: "default",
    commissionRate: 10,
    isAvailable: true,
    rating: 4.3,
    reviewCount: 312,
    image: "/products/bread.jpg",
    isOrganic: false,
    isVeg: true,
    vendorId: "V003",
    vendorName: "Baker's Delight",
  },
  {
    id: "PROD005",
    name: "Organic Honey 500g",
    slug: "organic-honey-500g",
    sku: "SKU005",
    barcode: "8901234567894",
    category: "Pantry",
    subcategory: "Sweeteners",
    price: 650.00,
    discountPrice: 599.00,
    stockQuantity: 45,
    stockStatus: "in_stock",
    commissionType: "custom",
    commissionRate: 18,
    isAvailable: true,
    rating: 4.9,
    reviewCount: 567,
    image: "/products/honey.jpg",
    isOrganic: true,
    isVeg: true,
    vendorId: "V001",
    vendorName: "Organic Farms Ltd",
  },
];

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [products, setProducts] = useState(mockProducts);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStockBadge = (status) => {
    switch (status) {
      case "in_stock":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            In Stock
          </Badge>
        );
      case "low_stock":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            Low Stock
          </Badge>
        );
      case "out_of_stock":
        return (
          <Badge variant="destructive">Out of Stock</Badge>
        );
      default:
        return null;
    }
  };

  const handleToggleAvailability = (productId) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p
      )
    );
  };

  const filterProducts = (prods) => {
    let filtered = prods;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.barcode.includes(searchTerm)
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (vendorFilter !== "all") {
      filtered = filtered.filter((p) => p.vendorId === vendorFilter);
    }

    if (stockFilter !== "all") {
      filtered = filtered.filter((p) => p.stockStatus === stockFilter);
    }

    if (availabilityFilter !== "all") {
      const isAvailable = availabilityFilter === "available";
      filtered = filtered.filter((p) => p.isAvailable === isAvailable);
    }

    return filtered;
  };

  const filteredProducts = filterProducts(products);
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const categories = [...new Set(mockProducts.map((p) => p.category))];
  const vendors = [...new Set(mockProducts.map((p) => ({ id: p.vendorId, name: p.vendorName })))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
              Products
            </h1>
            <p className="text-slate-600 mt-2">
              Manage products across all vendors
            </p>
          </div>
          <Link href="/admin/products/add">
            <Button className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Total Products</p>
                  <p className="text-3xl font-bold mt-1">{mockProducts.length}</p>
                </div>
                <Package className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-100">In Stock</p>
                  <p className="text-3xl font-bold mt-1">
                    {mockProducts.filter((p) => p.stockStatus === "in_stock").length}
                  </p>
                </div>
                <Package className="w-10 h-10 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-100">Low Stock</p>
                  <p className="text-3xl font-bold mt-1">
                    {mockProducts.filter((p) => p.stockStatus === "low_stock").length}
                  </p>
                </div>
                <Package className="w-10 h-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-100">Out of Stock</p>
                  <p className="text-3xl font-bold mt-1">
                    {mockProducts.filter((p) => p.stockStatus === "out_of_stock").length}
                  </p>
                </div>
                <Package className="w-10 h-10 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search products, SKU, barcode..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={vendorFilter}
                onValueChange={(value) => {
                  setVendorFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={stockFilter}
                onValueChange={(value) => {
                  setStockFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={availabilityFilter}
                onValueChange={(value) => {
                  setAvailabilityFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="pt-6">
            {paginatedProducts.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No products found
                </h3>
                <p className="text-slate-600 mb-6">
                  Get started by adding your first product
                </p>
                <Link href="/admin/products/add">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Product
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Product Details</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Pricing</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProducts.map((product) => (
                        <TableRow
                          key={product.id}
                          className={
                            product.stockStatus === "low_stock"
                              ? "bg-amber-50"
                              : product.stockStatus === "out_of_stock"
                              ? "bg-red-50"
                              : ""
                          }
                        >
                          <TableCell>
                            <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center overflow-hidden">
                              <Package className="w-6 h-6 text-slate-400" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-slate-500">
                              SKU: {product.sku}
                            </div>
                            <div className="flex gap-1 mt-1">
                              {product.isOrganic && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-700 border-green-200"
                                >
                                  Organic
                                </Badge>
                              )}
                              {product.isVeg && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                                >
                                  Veg
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {product.category}
                            </div>
                            <div className="text-xs text-slate-500">
                              {product.subcategory}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {product.vendorName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {product.vendorId}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-emerald-600">
                              {formatCurrency(
                                product.discountPrice || product.price
                              )}
                            </div>
                            {product.discountPrice && (
                              <div className="text-sm text-slate-500 line-through">
                                {formatCurrency(product.price)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {product.stockQuantity}
                            </div>
                            {getStockBadge(product.stockStatus)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <Badge variant="outline" className="text-xs">
                                {product.commissionType}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                              {product.commissionRate}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={product.isAvailable}
                              onCheckedChange={() =>
                                handleToggleAvailability(product.id)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">
                                {product.rating}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {product.reviewCount} reviews
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/admin/products/${product.id}`}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/admin/products/${product.id}/edit`}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/admin/products/${product.id}/images`}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <ImageIcon className="w-4 h-4" />
                                    Manage Images
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Show</span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(value) => {
                          setPageSize(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-slate-600">entries</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}