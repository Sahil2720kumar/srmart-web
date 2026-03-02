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
import Image from "next/image";
import { useCategories, useDeleteCategory, useToggleCategoryStatus } from "@/hooks/products/useCategories";
import { toast } from "sonner";
import { Category } from "@/types/supabase";

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("display_order");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Fetch categories based on status filter
  const { data: categories = [], isLoading } = useCategories(
    statusFilter !== "all" ? { is_active: statusFilter === "active" } : undefined
  );

  // Mutations
  const deleteCategory = useDeleteCategory();
  const toggleStatus = useToggleCategoryStatus();

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleStatus.mutateAsync(id);
      toast("Status updated", {
        description: `Category ${currentStatus ? "deactivated" : "activated"} successfully`,
      });
    } catch (error) {
      toast("Error", {
        description: "Failed to update category status",
      });
    }
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;

    try {
      await deleteCategory.mutateAsync(selectedCategory.id);
      toast("Category deleted", {
        description: `${selectedCategory.name} has been deleted successfully`,
      });
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      toast("Error", {
        description: "Failed to delete category. It may have associated products.",
      });
    }
  };

  const filteredCategories = categories
    .filter(cat => {
      const matchesSearch =
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "display_order") {
        return(a.display_order ?? 0) - (b.display_order ?? 0)
      } else if (sortBy === "commission") {
        return Number(b.commission_rate) - Number(a.commission_rate);
      } else if (sortBy === "created") {
        return new Date(b.created_at ??0).getTime() - new Date(a.created_at??0).getTime();
      }
      return 0;
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
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
                      <TableHead>Image</TableHead>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Commission Rate</TableHead>
                      <TableHead>Display Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted">
                            {category.image ? (
                              <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                className="object-cover"
                              />
                            ) : category.icon ? (
                              <div className="flex h-full w-full items-center justify-center text-2xl">
                                {category.icon}
                              </div>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                No img
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {category.name}
                          </div>
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
                          <p className="text-xs text-muted-foreground mt-1">
                            {category.created_at
                              ? new Date(category.created_at).toLocaleDateString()
                              : "—"}
                          </p>
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
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(category.id, category.is_active ?? false)}
                              >
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
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating your first category"}
                </p>
                <Button onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}>
                  {searchQuery || statusFilter !== "all" ? "Clear Filters" : "Add Category"}
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
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteCategory.isPending}
              >
                {deleteCategory.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}