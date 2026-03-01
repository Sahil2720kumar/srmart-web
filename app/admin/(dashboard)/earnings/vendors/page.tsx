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
import { Search, ArrowLeft, Eye, TrendingUp, DollarSign, Wallet, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useVendorEarningsList } from "@/hooks";

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

// ─── main page ───────────────────────────────────────────────────────────────

export default function VendorEarningsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vendors, isLoading, error } = useVendorEarningsList();

  // Client-side search — covers name and ID
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

  // Aggregate totals from ALL vendors (not filtered) for the summary cards
  const totals = useMemo(
    () =>
      (vendors ?? []).reduce(
        (acc, v) => ({
          totalOrders:      acc.totalOrders      + v.totalOrders,
          grossSales:       acc.grossSales       + v.grossSales,
          commissionAmount: acc.commissionAmount + v.commissionAmount,
          walletBalance:    acc.walletBalance    + v.walletBalance,
        }),
        { totalOrders: 0, grossSales: 0, commissionAmount: 0, walletBalance: 0 }
      ),
    [vendors]
  );

  // Average commission % shown in the card subtitle
  const avgCommission =
    vendors && vendors.length > 0
      ? (
          vendors.reduce((acc, v) => acc + v.commissionRate, 0) / vendors.length
        ).toFixed(1)
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Vendor Revenue */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-sm text-blue-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Vendor Revenue
              </div>
              {isLoading ? (
                <>
                  <Skeleton className="h-9 w-36 bg-white/20 mt-2" />
                  <Skeleton className="h-3 w-28 bg-white/20 mt-2" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold mt-2">{formatCurrency(totals.grossSales)}</div>
                  <div className="text-xs text-blue-100 mt-2">
                    From {totals.totalOrders.toLocaleString()} orders
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Platform Commission */}
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-sm text-emerald-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Platform Commission Earned
              </div>
              {isLoading ? (
                <>
                  <Skeleton className="h-9 w-36 bg-white/20 mt-2" />
                  <Skeleton className="h-3 w-40 bg-white/20 mt-2" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold mt-2">{formatCurrency(totals.commissionAmount)}</div>
                  <div className="text-xs text-emerald-100 mt-2">
                    Average {avgCommission}% commission
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pending Payouts */}
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-sm text-amber-100 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Pending Vendor Payouts
              </div>
              {isLoading ? (
                <>
                  <Skeleton className="h-9 w-36 bg-white/20 mt-2" />
                  <Skeleton className="h-3 w-28 bg-white/20 mt-2" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold mt-2">{formatCurrency(totals.walletBalance)}</div>
                  <div className="text-xs text-amber-100 mt-2">In vendor wallets</div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

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
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead className="text-right">Total Orders</TableHead>
                    <TableHead className="text-right">Gross Sales</TableHead>
                    <TableHead className="text-center">Commission Rate</TableHead>
                    <TableHead className="text-right">Commission Amount</TableHead>
                    <TableHead className="text-right">Vendor Payout</TableHead>
                    <TableHead className="text-right">Wallet Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                        No vendors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <TableRow key={vendor.vendorId}>
                        <TableCell>
                          <div className="font-medium">{vendor.vendorName}</div>
                          <div className="text-xs text-slate-500">{vendor.vendorId}</div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {vendor.totalOrders.toLocaleString()}
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
                        <TableCell className="text-right font-semibold text-blue-600">
                          {formatCurrency(vendor.vendorPayout)}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          {formatCurrency(vendor.walletBalance)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Link href={`/admin/vendors/${vendor.vendorId}`}>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Eye className="w-4 h-4" />
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
                    ))
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
                  const totalCommission = filteredVendors.reduce(
                    (s, v) => s + v.commissionAmount, 0
                  );
                  const pct =
                    totalCommission > 0
                      ? (vendor.commissionAmount / totalCommission) * 100
                      : 0;
                  return (
                    <div key={vendor.vendorId}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{vendor.vendorName}</span>
                        <span className="text-emerald-600 font-semibold">
                          {formatCurrency(vendor.commissionAmount)}
                        </span>
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