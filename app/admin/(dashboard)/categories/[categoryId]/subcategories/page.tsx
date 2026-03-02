"use client";

import { useState } from "react";
import { Search, Plus, MoreVertical, Edit, Trash2, Power, ChevronRight } from "lucide-react";
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
import { useParams } from "next/navigation";
import { useCategory, useAllSubCategoriesByCategory, useDeleteSubCategory, useToggleSubCategoryStatus } from "@/hooks/products/useCategories";
import { SubCategory } from "@/types/supabase";
import { toast } from "sonner";

export default function SubcategoriesPage() {
  const { categoryId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubCategory | null>(null);

  // Fetch category data
  const { data: category, isLoading: categoryLoading } = useCategory(categoryId as string);
  
  // Fetch subcategories
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useAllSubCategoriesByCategory(categoryId as string);

  // Mutations
  const deleteSubCategoryMutation = useDeleteSubCategory();
  const toggleStatusMutation = useToggleSubCategoryStatus();

  const handleToggleActive = async (id: string) => {
    try {
      await toggleStatusMutation.mutateAsync(id);
      toast("Success", {
        description: "Subcategory status updated successfully",
      });
    } catch (error) {
      toast("Error", {
        description: "Failed to update subcategory status",
      });
    }
  };

  const handleDeleteClick = (subcategory: SubCategory) => {
    setSelectedSubcategory(subcategory);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedSubcategory) {
      try {
        await deleteSubCategoryMutation.mutateAsync(selectedSubcategory.id);
        toast("Success", {
          description: "Subcategory deleted successfully",
        });
        setDeleteDialogOpen(false);
        setSelectedSubcategory(null);
      } catch (error) {
        toast("Error", {
          description: "Failed to delete subcategory",
        });
      }
    }
  };

  const filteredSubcategories = subcategories.filter(sub => {
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && sub.is_active) ||
      (statusFilter === "inactive" && !sub.is_active);

    return matchesSearch && matchesStatus;
  });

  const isLoading = categoryLoading || subcategoriesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">Category not found</p>
            <Link href="/admin/categories">
              <Button className="mt-4">Back to Categories</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/categories" className="hover:text-foreground">
            Categories
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/admin/categories/${categoryId}`} className="hover:text-foreground">
            {category.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Subcategories</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subcategories</h1>
            <p className="text-muted-foreground mt-1">
              Manage subcategories for {category.name}
            </p>
          </div>
          <Link className="mt-4 sm:mt-0" href={`/admin/categories/${categoryId}/subcategories/upsert`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Subcategory
            </Button>
          </Link>
        </div>

        {/* Filters Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
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

              {/* Results count */}
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredSubcategories.length} of {subcategories.length} subcategories
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {filteredSubcategories.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Subcategory Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Commission Override</TableHead>
                      <TableHead>Display Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubcategories.map((subcategory) => (
                      <TableRow key={subcategory.id}>
                        <TableCell>
                          <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted">
                            {subcategory.image ? (
                              <Image
                                src={subcategory.image}
                                alt={subcategory.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                No img
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {subcategory.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {subcategory.slug}
                        </TableCell>
                        <TableCell>
                          {subcategory.commission_rate !== null && subcategory.commission_rate !== undefined ? (
                            <span className="font-semibold">{subcategory.commission_rate}%</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {category.commission_rate}% (default)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{subcategory.display_order}</Badge>
                        </TableCell>
                        <TableCell>
                          {subcategory.is_active ? (
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
                          {new Date(subcategory?.created_at).toLocaleDateString()}
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
                                <Link href={`/admin/categories/${categoryId}/subcategories/upsert?subcategoryId=${subcategory.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleActive(subcategory.id)}
                                disabled={toggleStatusMutation.isPending}
                              >
                                <Power className="mr-2 h-4 w-4" />
                                {subcategory.is_active ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteClick(subcategory)}
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
                <h3 className="text-lg font-semibold mb-2">No subcategories found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating your first subcategory"
                  }
                </p>
                <Button onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}>
                  {searchQuery || statusFilter !== "all" ? "Clear Filters" : "Add Subcategory"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{selectedSubcategory?.name}</strong>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete} 
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteSubCategoryMutation.isPending}
              >
                {deleteSubCategoryMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}