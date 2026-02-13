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
import { useParams } from "next/navigation";

interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  commission_rate?: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// Mock parent category
const mockCategory = {
  id: "cat_001",
  name: "Vegetables & Fruits",
  commission_rate: 8.00,
};

// Mock subcategories
const initialSubcategories: SubCategory[] = [
  {
    id: "sub_001",
    category_id: "cat_001",
    name: "Fresh Vegetables",
    slug: "fresh-vegetables",
    commission_rate: undefined,
    display_order: 1,
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "sub_002",
    category_id: "cat_001",
    name: "Fresh Fruits",
    slug: "fresh-fruits",
    commission_rate: 10.00,
    display_order: 2,
    is_active: true,
    created_at: "2024-01-15T11:00:00Z",
  },
  {
    id: "sub_003",
    category_id: "cat_001",
    name: "Seasonal",
    slug: "seasonal",
    commission_rate: undefined,
    display_order: 3,
    is_active: true,
    created_at: "2024-01-15T11:30:00Z",
  },
  {
    id: "sub_004",
    category_id: "cat_001",
    name: "Exotics",
    slug: "exotics",
    commission_rate: 12.00,
    display_order: 4,
    is_active: true,
    created_at: "2024-01-15T12:00:00Z",
  },
  {
    id: "sub_005",
    category_id: "cat_001",
    name: "Sprouts",
    slug: "sprouts",
    commission_rate: undefined,
    display_order: 5,
    is_active: false,
    created_at: "2024-01-15T12:30:00Z",
  },
  {
    id: "sub_006",
    category_id: "cat_001",
    name: "Leafies & Herbs",
    slug: "leafies-herbs",
    commission_rate: undefined,
    display_order: 6,
    is_active: true,
    created_at: "2024-01-15T13:00:00Z",
  },
];

export default function SubcategoriesPage() {
  const params=useParams()
  const [subcategories, setSubcategories] = useState(initialSubcategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubCategory | null>(null);

  const handleToggleActive = (id: string) => {
    setSubcategories(subcategories.map(sub =>
      sub.id === id ? { ...sub, is_active: !sub.is_active } : sub
    ));
  };

  const handleDeleteClick = (subcategory: SubCategory) => {
    setSelectedSubcategory(subcategory);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSubcategory) {
      setSubcategories(subcategories.filter(sub => sub.id !== selectedSubcategory.id));
      setDeleteDialogOpen(false);
      setSelectedSubcategory(null);
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

  return (
    <div className="min-h-screen bg-background ">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/categories" className="hover:text-foreground">
            Categories
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/admin/categories/${params.categoryId}`} className="hover:text-foreground">
            {mockCategory.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Subcategories</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subcategories</h1>
            <p className="text-muted-foreground mt-1">
              Manage subcategories for {mockCategory.name}
            </p>
          </div>
          <Link className="mt-8 sm:mt-0" href={`/admin/categories/${params.categoryId}/subcategories/upsert`}>
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
                        <TableCell className="font-medium">
                          {subcategory.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {subcategory.slug}
                        </TableCell>
                        <TableCell>
                          {subcategory.commission_rate !== undefined ? (
                            <span className="font-semibold">{subcategory.commission_rate}%</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {mockCategory.commission_rate}% (default)
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
                          {new Date(subcategory.created_at).toLocaleDateString()}
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
                                <Link href={`/admin/categories/${params.categoryId}/subcategories/upsert?subcategoryId=${subcategory.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(subcategory.id)}>
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
              <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{selectedSubcategory?.name}</strong>?
                This action cannot be undone.
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