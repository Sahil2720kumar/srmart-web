// app/admin/products/page.tsx
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
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useProducts, useToggleProductAvailability, useCategories } from "@/hooks";
import { useVendors } from "@/hooks";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Build filters for the query
  const productFilters = {
    ...(categoryFilter !== "all" && { category_id: categoryFilter }),
    ...(vendorFilter !== "all" && { vendor_id: vendorFilter }),
    ...(availabilityFilter !== "all" && {
      is_available: availabilityFilter === "available",
    }),
    ...(searchTerm && { search: searchTerm }),
  };

  // Fetch data
  const { data: products, isLoading: isLoadingProducts } = useProducts(productFilters);
  const { data: categories } = useCategories();
  const { data: vendors } = useVendors();
  const toggleAvailability = useToggleProductAvailability();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStockBadge = (status: string) => {
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
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return null;
    }
  };

  const handleToggleAvailability = (productId: string, currentStatus: boolean) => {
    toggleAvailability.mutate(
      {
        productId,
        isAvailable: !currentStatus,
      },
      {
        onSuccess: () => {
          toast.success(
            currentStatus ? "Product disabled successfully" : "Product enabled successfully"
          );
        },
        onError: (error) => {
          toast.error(`Failed to update product: ${error.message}`);
        },
      }
    );
  };

  // Filter products by stock status
  const filterProductsByStock = (prods: any[]) => {
    if (stockFilter === "all") return prods;
    return prods.filter((p) => p.stock_status === stockFilter);
  };

  const filteredProducts = products ? filterProductsByStock(products) : [];
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Calculate stats
  const inStockCount = products?.filter((p) => p.stock_status === "in_stock").length || 0;
  const lowStockCount = products?.filter((p) => p.stock_status === "low_stock").length || 0;
  const outOfStockCount =
    products?.filter((p) => p.stock_status === "out_of_stock").length || 0;

  if (isLoadingProducts) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
              Products
            </h1>
            <p className="text-slate-600 mt-2">Manage products across all vendors</p>
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
                  <p className="text-3xl font-bold mt-1">{products?.length || 0}</p>
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
                  <p className="text-3xl font-bold mt-1">{inStockCount}</p>
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
                  <p className="text-3xl font-bold mt-1">{lowStockCount}</p>
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
                  <p className="text-3xl font-bold mt-1">{outOfStockCount}</p>
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
                  placeholder="Search products, SKU..."
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
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
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
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor.user_id} value={vendor.user_id}>
                      {vendor.store_name}
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
                      {paginatedProducts.map((product: any) => (
                        <TableRow
                          key={product.id}
                          className={
                            product.stock_status === "low_stock"
                              ? "bg-amber-50"
                              : product.stock_status === "out_of_stock"
                              ? "bg-red-50"
                              : ""
                          }
                        >
                          <TableCell>
                            <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center overflow-hidden">
                              {product.image ? (
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-slate-500">SKU: {product.sku}</div>
                            <div className="flex gap-1 mt-1">
                              {product.is_organic && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-700 border-green-200"
                                >
                                  Organic
                                </Badge>
                              )}
                              {product.is_veg && (
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
                              {product.category?.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {product.sub_category?.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {product.vendor?.store_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-emerald-600">
                              {formatCurrency(
                                parseFloat(product.discount_price) ||
                                  parseFloat(product.price)
                              )}
                            </div>
                            {product.discount_price && (
                              <div className="text-sm text-slate-500 line-through">
                                {formatCurrency(parseFloat(product.price))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{product.stock_quantity}</div>
                            {getStockBadge(product.stock_status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <Badge variant="outline" className="text-xs">
                                {product.commission_type}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                              {product.commission_rate}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={product.is_available}
                              onCheckedChange={() =>
                                handleToggleAvailability(product.id, product.is_available)
                              }
                              disabled={toggleAvailability.isPending}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">
                                {parseFloat(product.rating || "0").toFixed(1)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {product.review_count} reviews
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
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() =>
                                    handleToggleAvailability(product.id, product.is_available)
                                  }
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {product.is_available ? "Deactivate" : "Activate"}
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