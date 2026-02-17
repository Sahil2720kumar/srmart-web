'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  Loader2,
  Info,
  Calendar,
  TrendingUp,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  useCoupon,
  useCouponStats,
  useCouponUsage,
  useCouponApplicableProducts,
  useToggleCouponStatus,
  useDeleteCoupon,
} from '@/hooks';

// ─── Types ────────────────────────────────────────────────────────────────────

type CouponStatus = 'upcoming' | 'active' | 'expired' | 'inactive';

// ─── Badge styles (mirrors offer detail page) ─────────────────────────────────

const statusColors: Record<CouponStatus, string> = {
  active:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  expired:  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  inactive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const discountTypeColors: Record<string, string> = {
  percentage: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  flat:       'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const applicableToColors: Record<string, string> = {
  all:      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  category: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  vendor:   'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  subcategory: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  product:  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return 'No expiry';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CouponDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const couponId = params.couponId as string;

  const [showDelete, setShowDelete] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: coupon,   isLoading: couponLoading  } = useCoupon(couponId);
  const { data: stats,    isLoading: statsLoading   } = useCouponStats(couponId);
  const { data: products, isLoading: productsLoading } = useCouponApplicableProducts(couponId);
  const { data: usageHistory = [] }                    = useCouponUsage(couponId);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const toggleStatus = useToggleCouponStatus();
  const deleteCoupon = useDeleteCoupon();

  const handleToggleStatus = () => {
    if (!coupon) return;
    toggleStatus.mutate(
      { id: coupon.id, is_active: !coupon.is_active },
      {
        onSuccess: () => toast.success(`Coupon ${coupon.is_active ? 'deactivated' : 'activated'}`),
        onError:   () => toast.error('Failed to update status'),
      },
    );
  };

  const handleDelete = () => {
    if (!coupon) return;
    deleteCoupon.mutate(coupon.id, {
      onSuccess: () => { toast.success('Coupon deleted'); router.push('/admin/coupons'); },
      onError:   () => toast.error('Failed to delete coupon'),
    });
  };

  const getDiscountDisplay = () => {
    if (!coupon) return '—';
    return coupon.discount_type === 'percentage'
      ? `${coupon.discount_value}%`
      : `₹${coupon.discount_value}`;
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (couponLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading coupon details…</p>
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Coupon Not Found</h2>
          <p className="text-muted-foreground mb-4">The coupon you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/admin/coupons"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Coupons</Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = (stats?.status ?? 'inactive') as CouponStatus;

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/coupons"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold font-mono tracking-tight">{coupon.code}</h1>
              {coupon.description && (
                <p className="text-sm text-muted-foreground mt-1">{coupon.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge className={statusColors[status]}>{status}</Badge>
                <Badge className={discountTypeColors[coupon.discount_type] ?? ''}>
                  {coupon.discount_type}
                </Badge>
                <Badge className={applicableToColors[coupon.applicable_to ?? 'all']}>
                  {coupon.applicable_to ?? 'all'}
                </Badge>
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
              ) : coupon.is_active ? (
                <><Ban className="mr-2 h-4 w-4" /> Deactivate</>
              ) : (
                <><CheckCircle className="mr-2 h-4 w-4" /> Activate</>
              )}
            </Button>
            <Button asChild>
              <Link href={`/admin/coupons/add?edit=${coupon.id}`}>
                <Pencil className="mr-2 h-4 w-4" /> Edit Coupon
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Info cards ── */}
        <div className="grid gap-4 md:grid-cols-3">

          {/* Card 1: Discount details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Package className="h-4 w-4" /> Discount Details
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium capitalize mt-0.5">{coupon.discount_type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Value</p>
                <p className="font-bold text-2xl text-primary mt-0.5">{getDiscountDisplay()}</p>
              </div>
              {coupon.max_discount_amount && (
                <div>
                  <p className="text-xs text-muted-foreground">Max Discount</p>
                  <p className="font-semibold mt-0.5">₹{coupon.max_discount_amount}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Min Order Amount</p>
                <p className="font-semibold font-mono mt-0.5">₹{coupon.min_order_amount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Free Delivery</p>
                <Badge variant={coupon.includes_free_delivery ? 'default' : 'secondary'}>
                  {coupon.includes_free_delivery ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Scope & Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Scope & Usage
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Applicable To</p>
                <p className="font-medium capitalize mt-0.5">{coupon.applicable_to ?? 'All'}</p>
              </div>
              {coupon.applicable_id && (
                <div>
                  <p className="text-xs text-muted-foreground">Scope ID</p>
                  <p className="font-mono text-xs text-muted-foreground break-all mt-0.5">
                    {coupon.applicable_id}
                  </p>
                </div>
              )}
              {stats && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Applicable Products</p>
                    <p className="font-medium mt-0.5">{stats.products_count}</p>
                  </div>
                  {stats.days_remaining !== null && (
                    <div>
                      <p className="text-xs text-muted-foreground">Days Remaining</p>
                      <p className="font-medium mt-0.5">
                        {stats.days_remaining > 0 ? `${stats.days_remaining} days` : 'Expired'}
                      </p>
                    </div>
                  )}
                </>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Usage</p>
                <p className="font-medium mt-0.5">
                  {coupon.usage_count ?? 0}
                  {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' (unlimited)'}
                </p>
                {coupon.usage_limit && (
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all"
                      style={{
                        width: `${Math.min(
                          ((coupon.usage_count ?? 0) / coupon.usage_limit) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Per User Limit</p>
                <p className="font-medium mt-0.5">{coupon.usage_limit_per_user}x</p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Schedule
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium mt-0.5">{formatDate(coupon.start_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="font-medium mt-0.5">{formatDate(coupon.end_date)}</p>
              </div>
              {coupon.created_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="font-medium mt-0.5">{formatDate(coupon.created_at)}</p>
                </div>
              )}
              {coupon.updated_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="font-medium mt-0.5">{formatDate(coupon.updated_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Applicable Products Table ── */}
        {((products && products.length > 0) || productsLoading) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Products this Coupon Applies To
                  </CardTitle>
                  {coupon.applicable_to !== 'product' && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Products are determined by{' '}
                      <span className="capitalize font-medium">{coupon.applicable_to}</span>
                      {coupon.applicable_to === 'all' ? ' — showing first 100' : ''}
                    </p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {productsLoading ? '…' : `${products?.length ?? 0} products`}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(products ?? []).map((product) => (
                      <TableRow key={product.id}>
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
                          {product.sku ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.category?.name ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.vendor?.store_name ?? '—'}
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
                          <Badge
                            variant={(product.stock_quantity ?? 0) > 0 ? 'default' : 'destructive'}
                          >
                            {product.stock_quantity ?? 0}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Usage History Table ── */}
        {usageHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usage History</CardTitle>
              <p className="text-sm text-muted-foreground">Recent transactions using this coupon</p>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Used At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(usageHistory as any[]).map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell className="font-medium">
                        {usage.customers?.first_name} {usage.customers?.last_name}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {usage.orders?.order_number ?? '—'}
                        </code>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        ₹{Number(usage.discount_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {formatDate(usage.used_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ── Danger Zone ── */}
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete this coupon</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Once deleted, this coupon and all usage records cannot be recovered.
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Coupon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{coupon.code}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. The coupon will be immediately removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCoupon.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCoupon.isPending ? 'Deleting…' : 'Delete Coupon'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}