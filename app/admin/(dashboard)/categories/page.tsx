"use client";

import { useState } from "react";
import { Search, Plus, MoreVertical, Eye, Edit, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  commission_rate: number;
  display_order: number;
  is_active: boolean;
  subcategory_count: number;
  created_at: string;
}

// Mock data based on provided test data
const initialCategories: Category[] = [
  {
    id: "cat_001",
    name: "Vegetables & Fruits",
    slug: "vegetables-fruits",
    commission_rate: 8.00,
    display_order: 1,
    is_active: true,
    subcategory_count: 6,
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "cat_002",
    name: "Dairy & Breakfast",
    slug: "dairy-breakfast",
    commission_rate: 10.00,
    display_order: 2,
    is_active: true,
    subcategory_count: 4,
    created_at: "2024-01-16T09:15:00Z",
  },
  {
    id: "cat_003",
    name: "Meat & Seafood",
    slug: "meat-seafood",
    commission_rate: 12.00,
    display_order: 3,
    is_active: true,
    subcategory_count: 7,
    created_at: "2024-01-17T11:20:00Z",
  },
  {
    id: "cat_004",
    name: "Snacks & Beverages",
    slug: "snacks-beverages",
    commission_rate: 12.00,
    display_order: 4,
    is_active: true,
    subcategory_count: 10,
    created_at: "2024-01-18T14:45:00Z",
  },
  {
    id: "cat_005",
    name: "Packaged Foods",
    slug: "packaged-foods",
    commission_rate: 10.00,
    display_order: 5,
    is_active: false,
    subcategory_count: 12,
    created_at: "2024-01-19T08:30:00Z",
  },
  {
    id: "cat_006",
    name: "Personal Care",
    slug: "personal-care",
    commission_rate: 15.00,
    display_order: 6,
    is_active: true,
    subcategory_count: 10,
    created_at: "2024-01-20T16:00:00Z",
  },
  {
    id: "cat_007",
    name: "Household Items",
    slug: "household-items",
    commission_rate: 12.00,
    display_order: 7,
    is_active: true,
    subcategory_count: 10,
    created_at: "2024-01-21T10:15:00Z",
  },
  {
    id: "cat_008",
    name: "Organic Products",
    slug: "organic-products",
    commission_rate: 10.00,
    display_order: 8,
    is_active: true,
    subcategory_count: 10,
    created_at: "2024-01-22T13:30:00Z",
  },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("display_order");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleToggleActive = (id: string) => {
    setCategories(categories.map(cat =>
      cat.id === id ? { ...cat, is_active: !cat.is_active } : cat
    ));
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCategory) {
      setCategories(categories.filter(cat => cat.id !== selectedCategory.id));
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    }
  };

  const filteredCategories = categories
    .filter(cat => {
      const matchesSearch = 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && cat.is_active) ||
        (statusFilter === "inactive" && !cat.is_active);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "display_order") {
        return a.display_order - b.display_order;
      } else if (sortBy === "commission") {
        return b.commission_rate - a.commission_rate;
      } else if (sortBy === "created") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-background ">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground mt-1">
              Manage product categories, commissions, and visibility
            </p>
          </div>
          <Link href="/admin/categories/upsert">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </Link>
        </div>

        {/* Filters Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Name or slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="display_order">Display Order</SelectItem>
                    <SelectItem value="commission">Commission Rate</SelectItem>
                    <SelectItem value="created">Created Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results count */}
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredCategories.length} of {categories.length} categories
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {filteredCategories.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Commission Rate</TableHead>
                      <TableHead>Display Order</TableHead>
                      <TableHead>Subcategories</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {category.slug}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{category.commission_rate}%</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{category.display_order}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {category.subcategory_count}
                          </span>
                        </TableCell>
                        <TableCell>
                          {category.is_active ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(category.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/categories/${category.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/categories/upsert?categoryId=${category.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(category.id)}>
                                <Power className="mr-2 h-4 w-4" />
                                {category.is_active ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteClick(category)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <div className="mb-4 rounded-full bg-muted p-6 inline-block">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{selectedCategory?.name}</strong>?
                This action cannot be undone and will also delete all subcategories.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}