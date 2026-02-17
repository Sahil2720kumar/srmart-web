"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useOffer,
  useOfferStats,
  useOfferProducts,
  useDeleteOffer,
  useToggleOfferStatus,
  useRemoveProductFromOffer,
} from "@/hooks/products/useOffers";

// ─── Types ────────────────────────────────────────────────────────────────────

type DateStatus = "upcoming" | "active" | "expired" | "inactive";

// ─── Badge styles ─────────────────────────────────────────────────────────────

const dateStatusColors: Record<DateStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  expired: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  inactive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const offerTypeColors: Record<string, string> = {
  discount: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  bogo: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  bundle: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  free_delivery: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  clearance: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  combo: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  flash_sale: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  banner: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  seasonal: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No expiry";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.offerId as string;
  const [showDelete, setShowDelete] = useState(false);

  // Query hooks
  const { data: offer, isLoading: offerLoading } = useOffer(offerId);
  const { data: stats, isLoading: statsLoading } = useOfferStats(offerId);
  const { data: offerProducts, isLoading: productsLoading } = useOfferProducts(offerId);

  // Mutation hooks
  const toggleStatus = useToggleOfferStatus();
  const deleteOffer = useDeleteOffer();
  const removeProduct = useRemoveProductFromOffer();

  const handleToggleStatus = async () => {
    if (!offer) return;
    try {
      await toggleStatus.mutateAsync(offerId);
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    try {
      await removeProduct.mutateAsync({ offerId, productId });
    } catch (error: any) {
      console.error("Failed to remove product:", error);
      alert(error.message || "Failed to remove product");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOffer.mutateAsync(offerId);
      router.push("/admin/offers");
    } catch (error) {
      console.error("Failed to delete offer:", error);
    }
  };

  const formatDiscountValue = () => {
    if (!offer?.discount_value) return offer?.discount || "—";

    if (offer.discount_type === "percentage") {
      return `${offer.discount_value}%`;
    } else if (offer.discount_type === "fixed") {
      return `₹${offer.discount_value}`;
    }
    return offer.discount;
  };

  // Determine if products can be removed individually
  const canRemoveProducts = offer?.applicable_to === 'product';

  if (offerLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading offer details...</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Offer Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The offer you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/admin/offers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Offers
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = stats?.status || "inactive";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/offers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{offer.title}</h1>
              {offer.description && (
                <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge className={dateStatusColors[status]}>{status}</Badge>
                <Badge className={offerTypeColors[offer.offer_type] || offerTypeColors.discount}>
                  {offer.offer_type.replace("_", " ")}
                </Badge>
                {offer.tag && (
                  <span className="text-xs text-muted-foreground">{offer.tag}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              disabled={toggleStatus.isPending}
            >
              {toggleStatus.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : offer.is_active ? (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
            <Button asChild>
              <Link href={`/admin/offers/upsert?edit=${offer.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Offer
              </Link>
            </Button>
          </div>
        </div>

        {/* Banner Image */}
        {offer.banner_image && (
          <Card>
            <CardContent className="p-0">
              <img
                src={offer.banner_image}
                alt={offer.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Info cards grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Card 1: Offer details */}
          <Card>
            <CardHeader className="">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Offer Details
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className=" space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Offer Type</p>
                <p className="font-medium capitalize mt-0.5">
                  {offer.offer_type.replace("_", " ")}
                </p>
              </div>
              {offer.discount_type && (
                <div>
                  <p className="text-xs text-muted-foreground">Discount Type</p>
                  <p className="font-medium capitalize mt-0.5">
                    {offer.discount_type}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Discount</p>
                <p className="font-bold text-lg mt-0.5">{offer.discount}</p>
              </div>
              {offer.discount_value && (
                <div>
                  <p className="text-xs text-muted-foreground">Discount Value</p>
                  <p className="font-bold font-mono text-lg mt-0.5">
                    {formatDiscountValue()}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">DisplayOrder</p>
                <p className="font-medium mt-0.5">#{offer.display_order}</p>
              </div>

            </CardContent>
          </Card>

          {/* Card 2: Scope */}
          <Card>
            <CardHeader className="">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Scope & Stats
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className=" space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Applicable To</p>
                <p className="font-medium capitalize mt-0.5">
                  {offer.applicable_to || "All"}
                </p>
              </div>
              {offer.applicable_id && (
                <div>
                  <p className="text-xs text-muted-foreground">Scope ID</p>
                  <p className="font-mono text-xs mt-0.5 text-muted-foreground break-all">
                    {offer.applicable_id}
                  </p>
                </div>
              )}
              {stats && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Products</p>
                    <p className="font-medium mt-0.5">{stats.products_count}</p>
                  </div>
                  {stats.days_remaining !== null && (
                    <div>
                      <p className="text-xs text-muted-foreground">Days Remaining</p>
                      <p className="font-medium mt-0.5">
                        {stats.days_remaining > 0
                          ? `${stats.days_remaining} days`
                          : "Expired"}
                      </p>
                    </div>
                  )}
                </>
              )}
              {/* {offer.item_count && offer.item_count > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Item Count</p>
                  <p className="font-medium mt-0.5">{offer.item_count}</p>
                </div>
              )} */}

              <div>
                <p className="text-xs text-muted-foreground">Min. Purchase</p>
                <p className="font-medium font-mono mt-0.5">
                  ₹{offer.min_purchase_amount}
                </p>
              </div>

            </CardContent>
          </Card>

          {/* Card 3: Schedule */}
          <Card>
            <CardHeader className="">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Schedule
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className=" space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium mt-0.5">{formatDate(offer.start_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="font-medium mt-0.5">
                  {formatDate(offer.end_date)}
                </p>
              </div>
              {offer.created_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="font-medium mt-0.5">{formatDate(offer.created_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Products section */}
        {offerProducts && offerProducts.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Products in this Offer</CardTitle>
                  {!canRemoveProducts && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Products are determined by {offer.applicable_to}
                      {offer.applicable_to === 'all' ? ' items' : ''}
                    </p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {offerProducts.length} products
                </span>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {productsLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      {canRemoveProducts && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offerProducts.map(({ id, product }: any) => (
                      <TableRow key={id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {product.sku ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.category?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.vendor?.store_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{product.price}
                          {product.discount_price && (
                            <span className="text-xs text-muted-foreground line-through ml-1">
                              ₹{product.discount_price}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                            {product.stock_quantity ?? 0}
                          </Badge>
                        </TableCell>
                        {canRemoveProducts && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProduct(product.id)}
                              disabled={removeProduct.isPending}
                              className="text-destructive hover:text-destructive"
                            >
                              {removeProduct.isPending ? "..." : "Remove"}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Danger zone */}
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete this offer</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Once deleted, this offer cannot be recovered.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Offer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{offer.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. The offer will be
              immediately removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteOffer.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOffer.isPending ? "Deleting..." : "Delete Offer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}