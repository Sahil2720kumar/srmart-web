"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Truck,
  Package,
  Tag,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  useDailyEarningsTrend,
  useRevenueBreakdown,
  useGenerateReport,
  type DateRangeFilter,
  useAdminEarningsOverview,
} from "@/hooks/earnings/useEarnings";

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

const formatNumber = (num: number) =>
  new Intl.NumberFormat("en-IN").format(num);

/** Convert a "week" / "month" / "today" selector into a DateRangeFilter */
function getDateRange(range: string): DateRangeFilter | undefined {
  const now   = new Date();
  const today = now.toISOString().split("T")[0];

  if (range === "today") return { from: today, to: today };

  if (range === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return { from: from.toISOString().split("T")[0], to: today };
  }

  if (range === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: from.toISOString().split("T")[0], to: today };
  }

  return undefined; // "all" / custom → no filter
}

// ─── sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  gradient,
  textColor,
  subColor,
  isLoading,
}: {
  title: string;
  value: string;
  subtitle: string;
  trend: string;
  icon: React.ElementType;
  gradient: string;
  textColor: string;
  subColor: string;
  isLoading: boolean;
}) {
  return (
    <Card className={`${gradient} text-white border-0 shadow-lg`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm font-medium ${textColor} flex items-center gap-2`}>
          <Icon className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-9 w-36 bg-white/20 mb-2" />
            <Skeleton className="h-3 w-24 bg-white/20 mb-3" />
            <Skeleton className="h-3 w-28 bg-white/20" />
          </>
        ) : (
          <>
            <div className="text-3xl font-bold">{value}</div>
            <p className={`${subColor} text-xs mt-2`}>{subtitle}</p>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">{trend}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BarChartSkeleton() {
  return (
    <div className="h-64 flex items-end justify-between gap-2 px-1">
      {[65, 80, 55, 90, 70, 95, 75].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <Skeleton className="w-full rounded-t-lg" style={{ height: `${h}%` }} />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function AdminEarningsPage() {
  const [dateRange, setDateRange] = useState("week");

  const dateFilter = useMemo(() => getDateRange(dateRange), [dateRange]);

  const { data: overview, isLoading: overviewLoading, error: overviewError } =
    useAdminEarningsOverview(dateFilter);

  const { data: dailyTrend, isLoading: trendLoading } =
    useDailyEarningsTrend(dateFilter?.from, dateFilter?.to);

  const { data: breakdown, isLoading: breakdownLoading } =
    useRevenueBreakdown(dateFilter?.from, dateFilter?.to);

  const generateReport = useGenerateReport();

  const handleExport = async () => {
    const result = await generateReport.mutateAsync({
      reportId: "daily-earnings",
      dateRange: dateFilter ?? { from: "2000-01-01", to: new Date().toISOString().split("T")[0] },
      format: "csv",
    });
    if (result.csv) {
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const maxEarnings = Math.max(...(dailyTrend ?? []).map((d) => d.earnings), 1);
  const maxBreakdown = Math.max(
    ...(breakdown ?? []).map((d) => d.vendorPayout + d.commission + d.deliveryFee),
    1
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Earnings & Revenue
            </h1>
            <p className="text-slate-600 mt-2">Platform financial overview and insights</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} disabled={generateReport.isPending} className="gap-2">
              <Download className="w-4 h-4" />
              {generateReport.isPending ? "Exporting…" : "Export CSV"}
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {overviewError && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Failed to load earnings data. Please try refreshing.
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Gross Order Value"
            value={formatCurrency(overview?.grossOrderValue ?? 0)}
            subtitle="Before deductions"
            trend="+12.5% from last period"
            icon={ShoppingCart}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            textColor="text-blue-50"
            subColor="text-blue-100"
            isLoading={overviewLoading}
          />
          <KpiCard
            title="Platform Commission"
            value={formatCurrency(overview?.platformCommission ?? 0)}
            subtitle="Vendor commission earned"
            trend="+8.3% from last period"
            icon={DollarSign}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            textColor="text-emerald-50"
            subColor="text-emerald-100"
            isLoading={overviewLoading}
          />
          <KpiCard
            title="Delivery Fees Collected"
            value={formatCurrency(overview?.deliveryFeesCollected ?? 0)}
            subtitle="Customer + platform covered"
            trend="+5.7% from last period"
            icon={Truck}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            textColor="text-amber-50"
            subColor="text-amber-100"
            isLoading={overviewLoading}
          />
          <KpiCard
            title="Net Platform Earnings"
            value={formatCurrency(overview?.netPlatformEarnings ?? 0)}
            subtitle="After all deductions"
            trend="+14.2% from last period"
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-purple-500 to-pink-600"
            textColor="text-purple-50"
            subColor="text-purple-100"
            isLoading={overviewLoading}
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { href: "/admin/earnings/orders",  label: "Order Earnings",     sub: "View breakdown",  Icon: Package,  bg: "bg-blue-100",    color: "text-blue-600",    border: "hover:border-blue-300" },
            { href: "/admin/earnings/vendors", label: "Vendor Commission",  sub: "Track payouts",   Icon: ShoppingCart, bg: "bg-emerald-100", color: "text-emerald-600", border: "hover:border-emerald-300" },
            { href: "/admin/earnings/delivery",label: "Delivery Earnings",  sub: "Partner payouts", Icon: Truck,    bg: "bg-amber-100",   color: "text-amber-600",   border: "hover:border-amber-300" },
            { href: "/admin/earnings/reports", label: "Financial Reports",  sub: "Download data",   Icon: Download, bg: "bg-purple-100",  color: "text-purple-600",  border: "hover:border-purple-300" },
          ].map(({ href, label, sub, Icon, bg, color, border }) => (
            <Link key={href} href={href}>
              <Card className={`hover:shadow-lg transition-shadow cursor-pointer border-2 ${border}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 ${bg} rounded-lg`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <div>
                      <div className="font-semibold">{label}</div>
                      <div className="text-sm text-slate-600">{sub}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Earnings Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Earnings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <BarChartSkeleton />
              ) : (
                <div className="h-64 flex items-end justify-between gap-2">
                  {(dailyTrend ?? []).map((day, index) => {
                    const height = (day.earnings / maxEarnings) * 100;
                    const label  = new Date(day.date).toLocaleDateString("en-IN", {
                      month: "short",
                      day:   "numeric",
                    });
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-colors relative group"
                          style={{ height: `${height}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {formatCurrency(day.earnings)}
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 font-medium">{label}</div>
                      </div>
                    );
                  })}
                  {!trendLoading && (dailyTrend ?? []).length === 0 && (
                    <div className="w-full flex items-center justify-center text-slate-400 text-sm">
                      No data for selected range
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Breakdown stacked bar */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 text-sm">
                  {[
                    { color: "bg-slate-400",   label: "Vendor Payout" },
                    { color: "bg-emerald-500", label: "Commission"    },
                    { color: "bg-blue-500",    label: "Delivery Fee"  },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${color} rounded`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                {breakdownLoading ? (
                  <BarChartSkeleton />
                ) : (
                  <div className="h-52 flex items-end justify-between gap-2">
                    {(breakdown ?? []).map((day, index) => {
                      const total          = day.vendorPayout + day.commission + day.deliveryFee;
                      const scale          = (total / maxBreakdown) * 180; // px scale
                      const vendorPx       = (day.vendorPayout / total) * scale;
                      const commissionPx   = (day.commission   / total) * scale;
                      const deliveryPx     = (day.deliveryFee  / total) * scale;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full flex flex-col">
                            <div className="w-full bg-blue-500 rounded-t-lg"    style={{ height: `${deliveryPx}px` }} />
                            <div className="w-full bg-emerald-500"              style={{ height: `${commissionPx}px` }} />
                            <div className="w-full bg-slate-400 rounded-b-sm"  style={{ height: `${vendorPx}px` }} />
                          </div>
                          <div className="text-xs text-slate-600 font-medium">{day.label}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                ))
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Package className="w-4 h-4" />
                      <span className="text-sm font-medium">Total Orders</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatNumber(overview?.totalOrders ?? 0)}
                    </div>
                    <div className="text-xs text-slate-500">Successfully completed</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Package className="w-4 h-4" />
                      <span className="text-sm font-medium">Cancelled/Refunded</span>
                    </div>
                    <div className="text-3xl font-bold text-red-600">
                      {formatNumber((overview?.cancelledOrders ?? 0) + (overview?.refundedOrders ?? 0))}
                    </div>
                    <div className="text-xs text-slate-500">
                      {overview?.cancelledOrders ?? 0} cancelled,{" "}
                      {overview?.refundedOrders ?? 0} refunded
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Tag className="w-4 h-4" />
                      <span className="text-sm font-medium">Coupons Applied</span>
                    </div>
                    <div className="text-3xl font-bold text-amber-600">
                      {formatNumber(overview?.couponsApplied ?? 0)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatCurrency(overview?.totalDiscounts ?? 0)} discounts
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Net Profit</span>
                    </div>
                    <div className="text-3xl font-bold text-emerald-600">
                      {formatCurrency(overview?.netProfit ?? 0)}
                    </div>
                    <div className="text-xs text-slate-500">After all expenses</div>
                  </div>
                </>
              )}
            </div>

            <Separator className="my-6" />

            {/* Earnings Formula */}
            <div className="bg-slate-50 rounded-lg p-6 space-y-3">
              <h4 className="font-semibold text-slate-900 mb-4">Earnings Calculation</h4>
              {overviewLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gross Order Value</span>
                    <span className="font-semibold">{formatCurrency(overview?.grossOrderValue ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>+ Platform Commission</span>
                    <span className="font-semibold">+{formatCurrency(overview?.platformCommission ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>+ Delivery Fees Collected</span>
                    <span className="font-semibold">+{formatCurrency(overview?.deliveryFeesCollected ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>− Discounts & Coupons</span>
                    <span className="font-semibold">−{formatCurrency(overview?.totalDiscounts ?? 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-purple-600">
                    <span>Net Platform Earnings</span>
                    <span>= {formatCurrency(overview?.netPlatformEarnings ?? 0)}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}