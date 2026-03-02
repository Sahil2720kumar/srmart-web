"use client";

import { ChevronLeft, Edit, Plus, TrendingUp, Layers, Package, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  useCategory, 
  useCategoryStats, 
  useAllSubCategoriesByCategory 
} from "@/hooks/products/useCategories";

export default function CategoryDetailPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;

  // Fetch category data
  const { data: category, isLoading: isLoadingCategory } = useCategory(categoryId);
  const { data: stats, isLoading: isLoadingStats } = useCategoryStats(categoryId);


  
  const { data: subcategories = [], isLoading: isLoadingSubcategories } = 
    useAllSubCategoriesByCategory(categoryId);

  if (isLoadingCategory) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Category not found</h2>
          <p className="text-muted-foreground mb-4">The category you're looking for doesn't exist.</p>
          <Link href="/admin/categories">
            <Button>Back to Categories</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Back button */}
        <Link href="/admin/categories">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {category.image ? (
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : category.icon ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-4xl">
                {category.icon}
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                {category.name}
                {category.is_active ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                    Inactive
                  </Badge>
                )}
              </h1>
              {category.description && (
                <p className="text-muted-foreground mt-1">
                  {category.description}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Slug: <span className="font-mono">{category.slug}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/categories/${categoryId}/subcategories/upsert`}>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Subcategory
              </Button>
            </Link>
            <Link href={`/admin/categories/upsert?categoryId=${categoryId}`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Category
              </Button>
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Commission Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{category.commission_rate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Platform commission</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Subcategories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.subcategory_count || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total subcategories</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Active Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.active_products || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Currently listed</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(category?.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(category?.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs className="flex-col" defaultValue="overview">
          <TabsList>
            <TabsTrigger 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" 
              value="overview"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" 
              value="subcategories"
            >
              Subcategories ({stats?.subcategory_count || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Category ID</p>
                    <p className="text-sm font-mono font-medium mt-1">{category.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Display Order</p>
                    <p className="text-sm font-medium mt-1">{category.display_order}</p>
                  </div>
                  {category.color && (
                    <div>
                      <p className="text-sm text-muted-foreground">Brand Color</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="h-6 w-6 rounded border"
                          style={{ backgroundColor: category.color }}
                        />
                        <p className="text-sm font-mono">{category.color}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Icon</p>
                    <p className="text-2xl mt-1">{category.icon || "—"}</p>
                  </div>
                  {category.description && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm mt-1">{category.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Subcategories</span>
                    <span className="text-sm font-medium">
                      {isLoadingStats ? "..." : stats?.subcategory_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Products</span>
                    <span className="text-sm font-medium">
                      {isLoadingStats ? "..." : stats?.active_products || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Commission Rate</span>
                    <span className="text-sm font-medium">{category.commission_rate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {category.is_active ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subcategories" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Subcategories</CardTitle>
                <Link href={`/admin/categories/${categoryId}/subcategories`}>
                  <Button>View All Subcategories</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {isLoadingSubcategories ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading subcategories...</p>
                  </div>
                ) : subcategories.length > 0 ? (
                  <div className="space-y-3">
                    {subcategories.slice(0, 6).map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {sub.image ? (
                            <div className="h-10 w-10 rounded overflow-hidden bg-muted">
                              <img 
                                src={sub.image} 
                                alt={sub.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : sub.icon ? (
                            <span className="text-xl">{sub.icon}</span>
                          ) : null}
                          <div>
                            <p className="font-medium">{sub.name}</p>
                            <p className="text-xs text-muted-foreground">{sub.slug}</p>
                          </div>
                        </div>
                        {sub.is_active ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    ))}
                    {subcategories.length > 6 && (
                      <div className="text-center pt-2">
                        <Link href={`/admin/categories/${categoryId}/subcategories`}>
                          <Button variant="outline" size="sm">
                            View all {subcategories.length} subcategories
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-3">No subcategories yet</p>
                    <Link href={`/admin/categories/${categoryId}/subcategories/upsert`}>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Subcategory
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}