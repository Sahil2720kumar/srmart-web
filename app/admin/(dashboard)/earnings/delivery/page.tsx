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
  Search, ArrowLeft, Eye, Truck, DollarSign, Award, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  useDeliveryEarningsList,
  useDeliveryEconomics,
} from "@/hooks/earnings/useEarnings";

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

// ─── main page ───────────────────────────────────────────────────────────────

export default function DeliveryEarningsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: partners,  isLoading: partnersLoading,  error: partnersError  } = useDeliveryEarningsList();
  const { data: economics, isLoading: economicsLoading                         } = useDeliveryEconomics();

  // Client-side search — name or partner ID
  const filteredPartners = useMemo(() => {
    if (!partners) return [];
    if (!searchTerm.trim()) return partners;
    const q = searchTerm.toLowerCase();
    return partners.filter(
      (p) =>
        p.partnerName.toLowerCase().includes(q) ||
        p.partnerId.toLowerCase().includes(q)
    );
  }, [partners, searchTerm]);

  // Totals for summary cards come from ALL partners (not filtered)
  const totals = useMemo(
    () =>
      (partners ?? []).reduce(
        (acc, p) => ({
          totalDeliveries:    acc.totalDeliveries    + p.totalDeliveries,
          deliveryFeesEarned: acc.deliveryFeesEarned + p.deliveryFeesEarned,
          incentives:         acc.incentives         + p.incentives,
          bonuses:            acc.bonuses            + p.bonuses,
          netPayout:          acc.netPayout          + p.netPayout,
        }),
        { totalDeliveries: 0, deliveryFeesEarned: 0, incentives: 0, bonuses: 0, netPayout: 0 }
      ),
    [partners]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/earnings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
              Delivery Fee & Partner Earnings
            </h1>
            <p className="text-slate-600 mt-2">Monitor delivery economics and partner payouts</p>
          </div>
        </div>

        {/* Error */}
        {partnersError && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Failed to load delivery earnings data.
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Delivery Fees Collected */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-sm text-blue-100 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Total Delivery Fees Collected
              </div>
              {economicsLoading ? (
                <>
                  <Skeleton className="h-9 w-36 bg-white/20 mt-2" />
                  <Skeleton className="h-3 w-36 bg-white/20 mt-2" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold mt-2">
                    {formatCurrency(economics?.totalFeesCollected ?? totals.deliveryFeesEarned)}
                  </div>
                  <div className="text-xs text-blue-100 mt-2">
                    From {totals.totalDeliveries.toLocaleString()} deliveries
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Delivery Payouts to Partners */}
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-sm text-emerald-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Delivery Payouts to Partners
              </div>
              {partnersLoading ? (
                <>
                  <Skeleton className="h-9 w-36 bg-white/20 mt-2" />
                  <Skeleton className="h-3 w-44 bg-white/20 mt-2" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold mt-2">
                    {formatCurrency(economics?.totalPartnerPayouts ?? totals.netPayout)}
                  </div>
                  <div className="text-xs text-emerald-100 mt-2">
                    Including incentives & bonuses
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Platform-Covered Cost */}
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-sm text-amber-100 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Platform-Covered Cost
              </div>
              {economicsLoading ? (
                <>
                  <Skeleton className="h-9 w-36 bg-white/20 mt-2" />
                  <Skeleton className="h-3 w-32 bg-white/20 mt-2" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold mt-2">
                    {formatCurrency(economics?.platformCoveredCost ?? 0)}
                  </div>
                  <div className="text-xs text-amber-100 mt-2">Free delivery subsidies</div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delivery Economics Breakdown */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4">Delivery Economics</h3>
            {economicsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Total Fees Collected from Customers</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(economics?.totalFeesCollected ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Base Delivery Fees to Partners</span>
                  <span className="font-semibold text-emerald-600">
                    −{formatCurrency(economics?.totalPartnerPayouts ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Incentives & Bonuses Paid</span>
                  <span className="font-semibold text-purple-600">
                    −{formatCurrency(economics?.totalIncentivesAndBonuses ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Platform-Covered Delivery Cost</span>
                  <span className="font-semibold text-red-600">
                    −{formatCurrency(economics?.platformCoveredCost ?? 0)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Net Delivery Impact</span>
                  <span className="font-bold text-lg text-red-600">
                    −{formatCurrency(economics?.netDeliveryImpact ?? 0)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  * Negative impact = Platform subsidising delivery to boost adoption
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search delivery partner by name or ID…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Partner Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner Name</TableHead>
                    <TableHead className="text-right">Total Deliveries</TableHead>
                    <TableHead className="text-right">Delivery Fees</TableHead>
                    <TableHead className="text-right">Incentives</TableHead>
                    <TableHead className="text-right">Bonuses</TableHead>
                    <TableHead className="text-right">Net Payout</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead>Wallet Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredPartners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-slate-500 py-8">
                        No delivery partners found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPartners.map((partner) => (
                      <TableRow key={partner.partnerId}>
                        <TableCell>
                          <div className="font-medium">{partner.partnerName}</div>
                          <div className="text-xs text-slate-500">{partner.partnerId}</div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {partner.totalDeliveries.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          {formatCurrency(partner.deliveryFeesEarned)}
                        </TableCell>
                        <TableCell className="text-right text-purple-600">
                          {formatCurrency(partner.incentives)}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          {formatCurrency(partner.bonuses)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          {formatCurrency(partner.netPayout)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-medium">{partner.rating.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              partner.walletStatus === "Active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }
                          >
                            {partner.walletStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Link href={`/admin/delivery/${partner.partnerId}`}>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/admin/wallets/delivery/${partner.partnerId}`}>
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

      </div>
    </div>
  );
}