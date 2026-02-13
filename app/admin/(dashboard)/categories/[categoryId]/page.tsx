"use client";

import { useState } from "react";
import { ChevronLeft, Edit, Plus, TrendingUp, Layers, Package, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useParams } from "next/navigation";

// Mock data
const mockCategory = {
  id: "cat_001",
  name: "Vegetables & Fruits",
  slug: "vegetables-fruits",
  icon: "🥬",
  description: "Fresh vegetables and fruits delivered to your doorstep",
  commission_rate: 8.00,
  display_order: 1,
  is_active: true,
  subcategory_count: 6,
  active_products: 245,
  created_at: "2024-01-15T10:30:00Z",
};

const mockSubcategories = [
  { name: "Fresh Vegetables", product_count: 42, is_active: true },
  { name: "Fresh Fruits", product_count: 38, is_active: true },
  { name: "Seasonal", product_count: 25, is_active: true },
  { name: "Exotics", product_count: 18, is_active: true },
  { name: "Sprouts", product_count: 12, is_active: false },
  { name: "Leafies & Herbs", product_count: 15, is_active: true },
];

export default function CategoryDetailPage() {
  const params=useParams()
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background ">
      <div className="mx-auto max-w-7xl  space-y-6">
        {/* Back button */}
        <Link href="/admin/categories">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-4xl">
              {mockCategory.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                {mockCategory.name}
                {mockCategory.is_active ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                    Inactive
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">
                {mockCategory.description}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Slug: <span className="font-mono">{mockCategory.slug}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-8 sm:mt-0">
            <Link href={`/admin/categories/${params.categoryId}/subcategories/upsert`}>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Subcategory
              </Button>
            </Link>
            <Link href={`/admin/categories/upsert?categoryId=${params.categoryId}`}>
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
              <div className="text-2xl font-bold">{mockCategory.commission_rate}%</div>
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
              <div className="text-2xl font-bold">{mockCategory.subcategory_count}</div>
              <p className="text-xs text-muted-foreground mt-1">Total subcategories</p>
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
              <div className="text-2xl font-bold">{mockCategory.active_products}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently listed</p>
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
                {new Date(mockCategory.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(mockCategory.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs className="flex-col" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="overview">Overview</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="subcategories">
              Subcategories ({mockCategory.subcategory_count})
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
                    <p className="text-sm font-mono font-medium mt-1">{mockCategory.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Display Order</p>
                    <p className="text-sm font-medium mt-1">{mockCategory.display_order}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm mt-1">{mockCategory.description}</p>
                  </div>
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
                    <span className="text-sm font-medium">{mockCategory.subcategory_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Products</span>
                    <span className="text-sm font-medium">{mockCategory.active_products}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Commission Rate</span>
                    <span className="text-sm font-medium">{mockCategory.commission_rate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {mockCategory.is_active ? (
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
                <Link href={`/admin/categories/${params.categoryId}/subcategories`}>
                  <Button>View All Subcategories</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSubcategories.map((sub, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">{sub.product_count} products</p>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}