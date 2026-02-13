"use client";

import { useState } from "react";
import { Search, Plus, MoreVertical, Eye, Pencil, Copy, Zap, Trash2 } from "lucide-react";
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
import { useRouter } from "next/navigation";
import {
  MOCK_OFFERS,
  OfferWithProducts,
  getDateStatus,
  formatDate,
  DateStatus,
  OfferType,
} from "@/lib/mock-data";

// ─── Badge styles ─────────────────────────────────────────────────────────────

const dateStatusColors: Record<DateStatus, string> = {
  running:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  upcoming:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  expired:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  inactive:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const offerTypeColors: Record<OfferType, string> = {
  discount:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  bogo:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  bundle:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  free_delivery:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  clearance:
    "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  combo:
    "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  flash_sale:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferWithProducts[]>(MOCK_OFFERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [applicableFilter, setApplicableFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<OfferWithProducts | null>(null);

  const toggleActive = (id: string) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, is_active: !o.is_active } : o))
    );
  };

  const duplicate = (offer: OfferWithProducts) => {
    const copy: OfferWithProducts = {
      ...offer,
      id: "o-" + Date.now(),
      title: offer.title + " (Copy)",
      display_order: offers.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setOffers((prev) => [copy, ...prev]);
  };

  const handleDelete = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
    setDeleteTarget(null);
  };

  const filtered = offers.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      o.title.toLowerCase().includes(q) ||
      o.discount.toLowerCase().includes(q);
    const matchType = typeFilter === "all" || o.offer_type === typeFilter;
    const matchApplicable =
      applicableFilter === "all" || o.applicable_to === applicableFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && o.is_active) ||
      (statusFilter === "inactive" && !o.is_active);
    const matchDate =
      dateFilter === "all" || getDateStatus(o) === dateFilter;
    return matchSearch && matchType && matchApplicable && matchStatus && matchDate;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Offers &amp; Discounts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage promotional campaigns, flash sales, and discount rules
            </p>
          </div>
          <Button onClick={() => router.push("/admin/offers/upsert")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Offer
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-5">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Title, discount..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Offer Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Offer Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="bogo">BOGO</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                    <SelectItem value="free_delivery">Free Delivery</SelectItem>
                    <SelectItem value="clearance">Clearance</SelectItem>
                    <SelectItem value="combo">Combo</SelectItem>
                    <SelectItem value="flash_sale">Flash Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Applicable To */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Applicable To
                </label>
                <Select value={applicableFilter} onValueChange={setApplicableFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Active
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Date Status
                </label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Showing {filtered.length} of {offers.length} offers
            </p>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Applicable To</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Min. Purchase</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="py-12 text-center text-muted-foreground"
                      >
                        No offers found. Try adjusting your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((offer) => {
                      const ds = getDateStatus(offer);
                      return (
                        <TableRow key={offer.id}>
                          {/* Title */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div
                                className="h-8 w-8 rounded-md flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                                style={{ background: offer.banner_color }}
                              >
                                {offer.title[0]}
                              </div>
                              <div>
                                <p className="font-medium">{offer.title}</p>
                                {offer.tag && (
                                  <p className="text-xs text-muted-foreground">
                                    {offer.tag}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Type */}
                          <TableCell>
                            <Badge className={offerTypeColors[offer.offer_type]}>
                              {offer.offer_type.replace("_", " ")}
                            </Badge>
                          </TableCell>

                          {/* Discount */}
                          <TableCell className="font-medium font-mono">
                            {offer.discount}
                          </TableCell>

                          {/* Applicable */}
                          <TableCell className="capitalize text-muted-foreground">
                            {offer.applicable_to}
                          </TableCell>

                          {/* Items */}
                          <TableCell className="text-muted-foreground">
                            {offer.item_count || "—"}
                          </TableCell>

                          {/* Min purchase */}
                          <TableCell className="text-muted-foreground font-mono">
                            {offer.min_purchase ? `₹${offer.min_purchase}` : "—"}
                          </TableCell>

                          {/* Dates */}
                          <TableCell className="text-muted-foreground">
                            {formatDate(offer.start_date)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(offer.end_date)}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge className={dateStatusColors[ds]}>
                              {ds}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/offers/${offer.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/offers/upsert?edit=${offer.id}`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleActive(offer.id)}>
                                  <Zap className="mr-2 h-4 w-4" />
                                  {offer.is_active ? "Deactivate" : "Activate"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => duplicate(offer)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget(offer)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination placeholder */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page 1 of 1</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button variant="outline" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.title}&quot; will be permanently deleted. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}