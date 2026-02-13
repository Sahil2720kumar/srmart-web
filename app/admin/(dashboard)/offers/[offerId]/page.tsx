"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Zap,
  Trash2,
  Ban,
  CheckCircle,
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
  MOCK_OFFERS,
  MOCK_CATEGORIES,
  MOCK_VENDORS,
  OfferWithProducts,
  OfferProduct,
  getDateStatus,
  formatDate,
  DateStatus,
  OfferType,
} from "@/lib/mock-data";

// ─── Badge styles ─────────────────────────────────────────────────────────────

const dateStatusColors: Record<DateStatus, string> = {
  running: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  expired: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  inactive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const offerTypeColors: Record<OfferType, string> = {
  discount: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  bogo: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  bundle: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  free_delivery: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  clearance: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  combo: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  flash_sale: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [offers, setOffers] = useState<OfferWithProducts[]>(MOCK_OFFERS);
  const [showDelete, setShowDelete] = useState(false);

  const offer = offers.find((o) => o.id === params.offerId) ?? MOCK_OFFERS[0];
  const ds = getDateStatus(offer);

  const toggleActive = () => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offer.id ? { ...o, is_active: !o.is_active } : o
      )
    );
  };

  const removeProduct = (pid: string) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offer.id
          ? { ...o, products: o.products.filter((p) => p.id !== pid) }
          : o
      )
    );
  };

  const handleDelete = () => {
    setOffers((prev) => prev.filter((o) => o.id !== offer.id));
    router.push("/admin/offers");
  };

  const resolveApplicableName = () => {
    if (offer.applicable_to === "all") return "All Items";
    if (offer.applicable_to === "category")
      return MOCK_CATEGORIES.find((c) => c.id === offer.applicable_id)?.name ?? "—";
    if (offer.applicable_to === "vendor")
      return MOCK_VENDORS.find((v) => v.id === offer.applicable_id)?.name ?? "—";
    return "Selected Products";
  };

  const formatDiscountValue = () => {
    if (!offer.discount_value) return offer.discount;
    
    if (offer.discount_type === "percentage") {
      return `${offer.discount_value}%`;
    } else if (offer.discount_type === "flat") {
      return `₹${offer.discount_value}`;
    }
    return offer.discount;
  };

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
                <Badge className={dateStatusColors[ds]}>{ds}</Badge>
                <Badge className={offerTypeColors[offer.offer_type]}>
                  {offer.offer_type.replace("_", " ")}
                </Badge>
                {offer.tag && (
                  <span className="text-xs text-muted-foreground">{offer.tag}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={toggleActive}>
              {offer.is_active ? (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
            <Button asChild>
              <Link href={`/admin/offers/add?edit=${offer.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Offer
              </Link>
            </Button>
          </div>
        </div>

        {/* Info cards grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Card 1: Offer details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Offer Details
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Offer Type</p>
                <p className="font-medium capitalize mt-0.5">
                  {offer.offer_type.replace("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Discount Type</p>
                <p className="font-medium capitalize mt-0.5">
                  {offer.discount_type ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Discount</p>
                <p className="font-bold text-lg mt-0.5">{offer.discount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Discount Value</p>
                <p className="font-bold font-mono text-lg mt-0.5">
                  {formatDiscountValue()}
                </p>
              </div>
              {offer.display_order && (
                <div>
                  <p className="text-xs text-muted-foreground">Display Order</p>
                  <p className="font-medium mt-0.5">#{offer.display_order}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Scope */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Scope
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Applicable To</p>
                <p className="font-medium capitalize mt-0.5">
                  {offer.applicable_to}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="font-medium mt-0.5">{resolveApplicableName()}</p>
              </div>
              {offer.applicable_id && (
                <div>
                  <p className="text-xs text-muted-foreground">Reference ID</p>
                  <p className="font-mono text-xs mt-0.5 text-muted-foreground break-all">
                    {offer.applicable_id}
                  </p>
                </div>
              )}
              {offer.item_count && offer.item_count > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Item Count</p>
                  <p className="font-medium mt-0.5">{offer.item_count}</p>
                </div>
              )}
              {offer.min_purchase && (
                <div>
                  <p className="text-xs text-muted-foreground">Min. Purchase</p>
                  <p className="font-medium font-mono mt-0.5">
                    {offer.min_purchase > 0 ? `₹${offer.min_purchase}` : "No minimum"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Schedule
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium mt-0.5">{formatDate(offer.start_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="font-medium mt-0.5">
                  {offer.end_date ? formatDate(offer.end_date) : "No expiry"}
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
        {offer.products && offer.products.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Products in this Offer</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {offer.products.length} products
                </span>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offer.products.map((p: OfferProduct) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{p.image}</span>
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {p.sku ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{p.price}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(p.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Activity */}
        {(offer.created_at || offer.updated_at) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <div className="grid gap-3 md:grid-cols-2">
                {offer.created_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">Created At</p>
                    <p className="font-medium mt-0.5">{formatDate(offer.created_at)}</p>
                  </div>
                )}
                {offer.updated_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="font-medium mt-0.5">{formatDate(offer.updated_at)}</p>
                  </div>
                )}
              </div>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Offer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}