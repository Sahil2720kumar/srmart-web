"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, ArrowLeft, Eye, TrendingUp, DollarSign,
  Wallet, AlertCircle, ShoppingBag, Receipt,
} from "lucide-react";
import Link from "next/link";
import { useVendorEarningsList } from "@/hooks";

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

// ─── types ────────────────────────────────────────────────────────────────────

/**
 * Shape returned by useVendorEarningsList — mirrors the SQL totals query:
 *
 *   SELECT
 *     vendor_id,
 *     SUM(subtotal)            AS gross_sales,
 *     SUM(total_commission)    AS commission_amount,
 *     SUM(vendor_payout)       AS vendor_payout,
 *     SUM(platform_net_revenue)AS platform_net_revenue,
 *     SUM(delivery_fee_paid_by_customer) AS total_delivery_collected,
 *     SUM(item_count)          AS total_items,
 *     COUNT(*)                 AS total_orders,
 *     COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_orders,
 *     COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders
 *   FROM orders
 *   GROUP BY vendor_id
 */
interface VendorEarning {
  vendorId: string;
  vendorName: string;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalItems: number;
  grossSales: number;
  commissionRate: number;
  commissionAmount: number;
  vendorPayout: number;
  platformNetRevenue: number;
  totalDeliveryCollected: number;
  walletBalance: number;
}

// ─── summary card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  gradient: string;
  textMuted: string;
  isLoading: boolean;
}

function SummaryCard({ icon, label, value, sub, gradient, textMuted, isLoading }: SummaryCardProps) {
  return (
    <Card className={`${gradient} text-white border-0 shadow-lg`}>
      <CardContent className="pt-6">
        <div className={`text-sm ${textMuted} flex items-center gap-2`}>
          {icon}
          {label}
        </div>
        {isLoading ? (
          <>
            <Skeleton className="h-9 w-36 bg-white/20 mt-2" />
            <Skeleton className="h-3 w-28 bg-white/20 mt-2" />
          </>
        ) : (
          <>
            <div className="text-3xl font-bold mt-2">{value}</div>
            <div className={`text-xs ${textMuted} mt-2`}>{sub}</div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function VendorEarningsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vendors, isLoading, error } = useVendorEarningsList();

  // Client-side search
  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    if (!searchTerm.trim()) return vendors;
    const q = searchTerm.toLowerCase();
    return vendors.filter(
      (v) =>
        v.vendorName.toLowerCase().includes(q) ||
        v.vendorId.toLowerCase().includes(q)
    );
  }, [vendors, searchTerm]);

  // Aggregate totals from ALL vendors for summary cards
  const totals = useMemo(
    () =>
      (vendors ?? []).reduce(
        (acc, v) => ({
          totalOrders:            acc.totalOrders            + v.totalOrders,
          deliveredOrders:        acc.deliveredOrders        + v.deliveredOrders,
          cancelledOrders:        acc.cancelledOrders        + v.cancelledOrders,
          totalItems:             acc.totalItems             + v.totalItems,
          grossSales:             acc.grossSales             + v.grossSales,
          commissionAmount:       acc.commissionAmount       + v.commissionAmount,
          vendorPayout:           acc.vendorPayout           + v.vendorPayout,
          platformNetRevenue:     acc.platformNetRevenue     + v.platformNetRevenue,
          totalDeliveryCollected: acc.totalDeliveryCollected + v.totalDeliveryCollected,
          walletBalance:          acc.walletBalance          + v.walletBalance,
        }),
        {
          totalOrders: 0, deliveredOrders: 0, cancelledOrders: 0,
          totalItems: 0, grossSales: 0, commissionAmount: 0,
          vendorPayout: 0, platformNetRevenue: 0,
          totalDeliveryCollected: 0, walletBalance: 0,
        }
      ),
    [vendors]
  );

  const avgCommission =
    vendors && vendors.length > 0
      ? (vendors.reduce((acc, v) => acc + v.commissionRate, 0) / vendors.length).toFixed(1)
      : "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/earnings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
              Vendor Earnings & Commission
            </h1>
            <p className="text-slate-600 mt-2">Track vendor payouts and commission revenue</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Failed to load vendor earnings data.
          </div>
        )}

        {/* Summary Cards — Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Total Vendor Revenue"
            value={formatCurrency(totals.grossSales)}
            sub={`From ${totals.totalOrders.toLocaleString()} orders · ${totals.totalItems.toLocaleString()} items`}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            textMuted="text-blue-100"
            isLoading={isLoading}
          />
          <SummaryCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Platform Commission Earned"
            value={formatCurrency(totals.commissionAmount)}
            sub={`Avg ${avgCommission}% · Net ${formatCurrency(totals.platformNetRevenue)}`}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            textMuted="text-emerald-100"
            isLoading={isLoading}
          />
          <SummaryCard
            icon={<ShoppingBag className="w-4 h-4" />}
            label="Total Vendor Payouts"
            value={formatCurrency(totals.vendorPayout)}
            sub={`${totals.deliveredOrders} delivered · ${totals.cancelledOrders} cancelled`}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            textMuted="text-violet-100"
            isLoading={isLoading}
          />
          <SummaryCard
            icon={<Wallet className="w-4 h-4" />}
            label="Pending Vendor Payouts"
            value={formatCurrency(totals.walletBalance)}
            sub={`Delivery collected: ${formatCurrency(totals.totalDeliveryCollected)}`}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            textMuted="text-amber-100"
            isLoading={isLoading}
          />
        </div>

        {/* Secondary totals strip */}
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Orders",     value: totals.totalOrders.toLocaleString() },
              { label: "Delivered Orders", value: totals.deliveredOrders.toLocaleString() },
              { label: "Cancelled Orders", value: totals.cancelledOrders.toLocaleString() },
              { label: "Delivery Collected", value: formatCurrency(totals.totalDeliveryCollected) },
            ].map((stat) => (
              <Card key={stat.label} className="bg-white/70 backdrop-blur border-slate-100">
                <CardContent className="pt-4 pb-4">
                  <div className="text-xs text-slate-500">{stat.label}</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search vendor by name or ID…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vendor Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Vendor Name</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Gross Sales</TableHead>
                    <TableHead className="text-center">Comm. Rate</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Net Revenue</TableHead>
                    <TableHead className="text-right">Vendor Payout</TableHead>
                    <TableHead className="text-right">Delivery Collected</TableHead>
                    <TableHead className="text-right">Wallet Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 12 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-slate-500 py-8">
                        No vendors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredVendors.map((vendor) => (
                        <TableRow key={vendor.vendorId} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="font-medium">{vendor.vendorName}</div>
                            <div className="text-xs text-slate-400 font-mono">{vendor.vendorId.slice(0, 8)}…</div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {vendor.totalOrders.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-emerald-600 font-medium">{vendor.deliveredOrders}</span>
                            {vendor.cancelledOrders > 0 && (
                              <span className="text-red-400 text-xs ml-1">({vendor.cancelledOrders} cancelled)</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {vendor.totalItems?.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(vendor.grossSales)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-semibold">
                              {vendor.commissionRate}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">
                            {formatCurrency(vendor.commissionAmount)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-teal-600">
                            {formatCurrency(vendor.platformNetRevenue)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-blue-600">
                            {formatCurrency(vendor.vendorPayout)}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {formatCurrency(vendor.totalDeliveryCollected)}
                          </TableCell>
                          <TableCell className="text-right text-amber-600 font-medium">
                            {formatCurrency(vendor.walletBalance)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Link href={`/admin/vendors/${vendor.vendorId}`}>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </Button>
                              </Link>
                              <Link href={`/admin/wallets/vendors/${vendor.vendorId}`}>
                                <Button variant="outline" size="sm">
                                  Payouts
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Totals row */}
                      <TableRow className="bg-slate-100 font-bold border-t-2 border-slate-300">
                        <TableCell className="text-slate-700">
                          <div className="flex items-center gap-1">
                            <Receipt className="w-4 h-4" />
                            Totals ({filteredVendors.length} vendors)
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {filteredVendors.reduce((s, v) => s + v.totalOrders, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-emerald-700">
                          {filteredVendors.reduce((s, v) => s + v.deliveredOrders, 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {filteredVendors.reduce((s, v) => s + v.totalItems, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(filteredVendors.reduce((s, v) => s + v.grossSales, 0))}
                        </TableCell>
                        <TableCell />
                        <TableCell className="text-right text-emerald-700">
                          {formatCurrency(filteredVendors.reduce((s, v) => s + v.commissionAmount, 0))}
                        </TableCell>
                        <TableCell className="text-right text-teal-700">
                          {formatCurrency(filteredVendors.reduce((s, v) => s + v.platformNetRevenue, 0))}
                        </TableCell>
                        <TableCell className="text-right text-blue-700">
                          {formatCurrency(filteredVendors.reduce((s, v) => s + v.vendorPayout, 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(filteredVendors.reduce((s, v) => s + v.totalDeliveryCollected, 0))}
                        </TableCell>
                        <TableCell className="text-right text-amber-700">
                          {formatCurrency(filteredVendors.reduce((s, v) => s + v.walletBalance, 0))}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Commission Breakdown */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4">Commission Breakdown</h3>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVendors.map((vendor) => {
                  const totalCommission = filteredVendors.reduce((s, v) => s + v.commissionAmount, 0);
                  const pct = totalCommission > 0 ? (vendor.commissionAmount / totalCommission) * 100 : 0;
                  return (
                    <div key={vendor.vendorId}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{vendor.vendorName}</span>
                        <div className="flex gap-4 text-right">
                          <span className="text-slate-400 text-xs">{pct.toFixed(1)}%</span>
                          <span className="text-blue-600 text-xs">
                            Payout: {formatCurrency(vendor.vendorPayout)}
                          </span>
                          <span className="text-emerald-600 font-semibold">
                            {formatCurrency(vendor.commissionAmount)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}