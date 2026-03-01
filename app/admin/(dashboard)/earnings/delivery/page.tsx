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
  Search, ArrowLeft, Eye, Truck, DollarSign, Award,
  AlertCircle, Star, Receipt, Zap, TrendingUp,
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
            <Skeleton className="h-3 w-36 bg-white/20 mt-2" />
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
      <span className="font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function DeliveryEarningsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: partners,  isLoading: partnersLoading,  error: partnersError  } = useDeliveryEarningsList();
  const { data: economics, isLoading: economicsLoading                         } = useDeliveryEconomics();

  const isLoading = partnersLoading || economicsLoading;

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

  // Totals from ALL partners for summary cards
  const totals = useMemo(
    () =>
      (partners ?? []).reduce(
        (acc, p) => ({
          totalDeliveries:    acc.totalDeliveries    + p.totalDeliveries,
          lifetimeEarnings:   acc.lifetimeEarnings   + p.lifetimeEarnings,
          incentives:         acc.incentives         + p.incentives,
          bonuses:            acc.bonuses            + p.bonuses,
          netPayout:          acc.netPayout          + p.netPayout,
          totalWithdrawn:     acc.totalWithdrawn     + p.totalWithdrawn,
          activePartners:     acc.activePartners     + (p.walletStatus === "Active" ? 1 : 0),
        }),
        { totalDeliveries: 0, lifetimeEarnings: 0, incentives: 0, bonuses: 0, netPayout: 0, totalWithdrawn: 0, activePartners: 0 }
      ),
    [partners]
  );

  // Filtered totals for table totals row
  const filteredTotals = useMemo(
    () =>
      filteredPartners.reduce(
        (acc, p) => ({
          totalDeliveries:  acc.totalDeliveries  + p.totalDeliveries,
          lifetimeEarnings: acc.lifetimeEarnings + p.lifetimeEarnings,
          incentives:       acc.incentives       + p.incentives,
          bonuses:          acc.bonuses          + p.bonuses,
          netPayout:        acc.netPayout        + p.netPayout,
          totalWithdrawn:   acc.totalWithdrawn   + p.totalWithdrawn,
        }),
        { totalDeliveries: 0, lifetimeEarnings: 0, incentives: 0, bonuses: 0, netPayout: 0, totalWithdrawn: 0 }
      ),
    [filteredPartners]
  );

  const avgRating =
    partners && partners.length > 0
      ? (partners.reduce((acc, p) => acc + p.rating, 0) / partners.length).toFixed(1)
      : "0.0";

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            icon={<Truck className="w-4 h-4" />}
            label="Total Fees Collected"
            value={formatCurrency(economics?.totalFeesCollected ?? 0)}
            sub={`From ${totals.totalDeliveries.toLocaleString()} deliveries`}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            textMuted="text-blue-100"
            isLoading={isLoading}
          />
          <SummaryCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Total Lifetime Earnings"
            value={formatCurrency(totals.lifetimeEarnings)}
            sub={`Withdrawn: ${formatCurrency(totals.totalWithdrawn)}`}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            textMuted="text-emerald-100"
            isLoading={isLoading}
          />
          <SummaryCard
            icon={<Zap className="w-4 h-4" />}
            label="Incentives & Bonuses Paid"
            value={formatCurrency(economics?.totalIncentivesAndBonuses ?? (totals.incentives + totals.bonuses))}
            sub={`Across ${totals.activePartners} active partners`}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            textMuted="text-violet-100"
            isLoading={isLoading}
          />
          <SummaryCard
            icon={<Award className="w-4 h-4" />}
            label="Platform-Covered Cost"
            value={formatCurrency(economics?.platformCoveredCost ?? 0)}
            sub={`Net delivery impact: −${formatCurrency(economics?.netDeliveryImpact ?? 0)}`}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            textMuted="text-amber-100"
            isLoading={isLoading}
          />
        </div>

        {/* Secondary stats strip */}
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Partners",     value: (partners?.length ?? 0).toLocaleString() },
              { label: "Active Partners",    value: totals.activePartners.toLocaleString() },
              { label: "Total Deliveries",   value: totals.totalDeliveries.toLocaleString() },
              { label: "Avg Partner Rating", value: `★ ${avgRating}` },
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

        {/* Delivery Economics Breakdown */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4">Delivery Economics Breakdown</h3>
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
              <div className="space-y-1">
                {/* Revenue side */}
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Revenue</p>
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <span className="text-slate-700">Delivery Fees Collected from Customers</span>
                  <span className="font-bold text-blue-600">
                    +{formatCurrency(economics?.totalFeesCollected ?? 0)}
                  </span>
                </div>

                {/* Cost side */}
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-3 mb-2">Platform Costs</p>
                <div className="flex justify-between items-center py-2">
                  <div>
                    <span className="text-slate-700">Free Delivery Subsidy</span>
                    <p className="text-xs text-slate-400">Orders where platform covered the delivery fee</p>
                  </div>
                  <span className="font-semibold text-red-500">
                    −{formatCurrency(economics?.platformCoveredCost ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div>
                    <span className="text-slate-700">Incentives & Bonuses</span>
                    <p className="text-xs text-slate-400">Extra payouts on top of delivery fees</p>
                  </div>
                  <span className="font-semibold text-purple-600">
                    −{formatCurrency(economics?.totalIncentivesAndBonuses ?? 0)}
                  </span>
                </div>

                {/* Net */}
                <div className="border-t-2 border-slate-300 pt-3 mt-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900">Net Delivery Impact</span>
                    <p className="text-xs text-slate-500">
                      What the platform spent beyond what customers paid
                    </p>
                  </div>
                  <span className={`font-bold text-lg ${(economics?.netDeliveryImpact ?? 0) > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    −{formatCurrency(economics?.netDeliveryImpact ?? 0)}
                  </span>
                </div>

                {/* Info note */}
                <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-blue-100">
                  * Partner delivery fees (₹{formatCurrency(economics?.totalPartnerPayouts ?? 0)}) are funded by customer-paid fees + platform subsidy combined — they are not an additional platform cost.
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
                  <TableRow className="bg-slate-50">
                    <TableHead>Partner Name</TableHead>
                    <TableHead className="text-right">Deliveries</TableHead>
                    <TableHead className="text-right">Lifetime Earnings</TableHead>
                    <TableHead className="text-right">Withdrawn</TableHead>
                    <TableHead className="text-right">Incentives</TableHead>
                    <TableHead className="text-right">Bonuses</TableHead>
                    <TableHead className="text-right">Net Payout</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">Wallet</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 10 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredPartners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-slate-500 py-8">
                        No delivery partners found
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredPartners.map((partner) => (
                        <TableRow key={partner.partnerId} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="font-medium">{partner.partnerName}</div>
                            <div className="text-xs text-slate-400 font-mono">
                              {partner.partnerId.slice(0, 8)}…
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {partner.totalDeliveries.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">
                            {formatCurrency(partner.lifetimeEarnings)}
                          </TableCell>
                          <TableCell className="text-right text-slate-500">
                            {formatCurrency(partner.totalWithdrawn)}
                          </TableCell>
                          <TableCell className="text-right text-purple-600">
                            {formatCurrency(partner.incentives)}
                          </TableCell>
                          <TableCell className="text-right text-amber-600">
                            {formatCurrency(partner.bonuses)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-blue-600">
                            {formatCurrency(partner.netPayout)}
                          </TableCell>
                          <TableCell className="text-center">
                            <StarRating rating={partner.rating} />
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                partner.walletStatus === "Active"
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                              }
                            >
                              {partner.walletStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Link href={`/admin/delivery/${partner.partnerId}`}>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <Eye className="w-3.5 h-3.5" />
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
                      ))}

                      {/* Totals row */}
                      <TableRow className="bg-slate-100 font-bold border-t-2 border-slate-300">
                        <TableCell className="text-slate-700">
                          <div className="flex items-center gap-1">
                            <Receipt className="w-4 h-4" />
                            Totals ({filteredPartners.length} partners)
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {filteredTotals.totalDeliveries.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-emerald-700">
                          {formatCurrency(filteredTotals.lifetimeEarnings)}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {formatCurrency(filteredTotals.totalWithdrawn)}
                        </TableCell>
                        <TableCell className="text-right text-purple-700">
                          {formatCurrency(filteredTotals.incentives)}
                        </TableCell>
                        <TableCell className="text-right text-amber-700">
                          {formatCurrency(filteredTotals.bonuses)}
                        </TableCell>
                        <TableCell className="text-right text-blue-700">
                          {formatCurrency(filteredTotals.netPayout)}
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell />
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Per-partner earnings breakdown */}
        {!partnersLoading && filteredPartners.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Partner Lifetime Earnings Breakdown</h3>
              <div className="space-y-3">
                {filteredPartners
                  .slice()
                  .sort((a, b) => b.lifetimeEarnings - a.lifetimeEarnings)
                  .map((partner) => {
                    const maxEarnings = Math.max(...filteredPartners.map((p) => p.lifetimeEarnings), 1);
                    const pct = (partner.lifetimeEarnings / maxEarnings) * 100;
                    const withdrawnPct = partner.lifetimeEarnings > 0
                      ? (partner.totalWithdrawn / partner.lifetimeEarnings) * 100
                      : 0;
                    return (
                      <div key={partner.partnerId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{partner.partnerName}</span>
                          <div className="flex gap-4 text-right">
                            <span className="text-slate-400 text-xs">
                              {partner.totalDeliveries} deliveries
                            </span>
                            <span className="text-slate-400 text-xs">
                              Withdrawn: {formatCurrency(partner.totalWithdrawn)}
                            </span>
                            <span className="text-purple-600 text-xs">
                              ★ {partner.rating.toFixed(1)}
                            </span>
                            <span className="text-emerald-600 font-semibold">
                              {formatCurrency(partner.lifetimeEarnings)}
                            </span>
                          </div>
                        </div>
                        {/* Stacked bar: withdrawn (gray) + remaining (gradient) */}
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="h-2 flex rounded-full overflow-hidden" style={{ width: `${pct}%` }}>
                            <div
                              className="bg-slate-400 h-2"
                              style={{ width: `${withdrawnPct}%` }}
                            />
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                <div className="flex gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-slate-400 inline-block" /> Withdrawn</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-purple-500 inline-block" /> Remaining balance</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}