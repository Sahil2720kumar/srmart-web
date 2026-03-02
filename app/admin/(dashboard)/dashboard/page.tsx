"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  Users, Truck, AlertCircle, ArrowUpRight, Package,
  Store, FileCheck, Wallet,
} from "lucide-react";
import Link from "next/link";

// ── hooks ──────────────────────────────────────────────────────────────────────
import {
  useAdminEarningsOverview,
  useDailyEarningsTrend,
} from "@/hooks/earnings/useEarnings";
import { useOrders }       from "@/hooks/orders/useOrders";
import { useVendors }      from "@/hooks/vendors/useVendors";
import { useDeliveryBoys } from "@/hooks/deliverys/useDeliveryBoys";
import { useCustomers }    from "@/hooks/customers/useCustomers";
import { useAdminWalletKPIs } from "@/hooks/wallet/useWallet";

// ── helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);

const todayStr = () => new Date().toISOString().split("T")[0];
const daysAgo  = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};
const monthStart = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-01`;
};

// ── status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string; dot: string }
> = {
  pending:           { variant: "secondary",   label: "Pending",     dot: "bg-yellow-400" },
  confirmed:         { variant: "default",      label: "Confirmed",   dot: "bg-blue-400"   },
  "in-progress":     { variant: "default",      label: "In Progress", dot: "bg-blue-500"   },
  preparing:         { variant: "default",      label: "Preparing",   dot: "bg-blue-400"   },
  out_for_delivery:  { variant: "default",      label: "On the Way",  dot: "bg-purple-400" },
  delivered:         { variant: "outline",      label: "Delivered",   dot: "bg-emerald-500"},
  cancelled:         { variant: "destructive",  label: "Cancelled",   dot: "bg-red-500"    },
  refunded:          { variant: "destructive",  label: "Refunded",    dot: "bg-orange-400" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <Badge variant={cfg.variant} className="gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </Badge>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  title, value, change, trend, icon: Icon, isLoading, href,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
  isLoading?: boolean;
  href?: string;
}) {
  const inner = isLoading ? (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24 mb-1" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  ) : (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {trend !== "neutral" && change && (
            <div className={`flex items-center text-xs font-medium ${trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
              {trend === "up"
                ? <TrendingUp  className="mr-1 h-3 w-3" />
                : <TrendingDown className="mr-1 h-3 w-3" />}
              {change}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">vs last period</p>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today      = todayStr();
  const sevenAgo   = daysAgo(7);
  const thisMonth  = monthStart();

  // ── earnings hooks ───────────────────────────────────────────────────────────
  const { data: overview,     isLoading: overviewLoading  } =
    useAdminEarningsOverview({ from: thisMonth, to: today });

  const { data: dailyTrend,   isLoading: trendLoading     } =
    useDailyEarningsTrend(sevenAgo, today);



  // ── entity hooks — no filters so we get full lists ───────────────────────────
  // useVendors returns (Vendor & { users: {...} })[] directly
  const { data: vendors,    isLoading: vendorsLoading   } = useVendors();

  // useDeliveryBoys returns (DeliveryBoy & { users: {...} })[] directly
  const { data: deliveries, isLoading: deliveryLoading  } = useDeliveryBoys();

  // useOrders, useCustomers — adapt to actual return shape
  const { data: allOrders,  isLoading: ordersLoading    } = useOrders?.() ?? {};
  const { data: customers,  isLoading: customersLoading } = useCustomers?.() ?? {};
  const { data: kpis,       isLoading: kpisLoading       } = useAdminWalletKPIs();

  // ── derived: vendors ─────────────────────────────────────────────────────────
  // useVendors returns vendors with joined users(is_active).
  // A vendor is "active" when their linked user account is active (users.is_active = true).
  // Vendors pending KYC = is_verified = false.
  // New applications = no is_verified field set (status = 'pending') — adapt as needed.
  const vendorStats = useMemo(() => {
    const arr = (vendors ?? []) as any[];
    return {
      // Active = linked user account is active (users.is_active = true)
      active:          arr.filter((v) => v.users?.is_active === true).length,
      // Pending KYC = kyc_status === "pending" — matches vendor page filter logic exactly
      pendingKyc:      arr.filter((v) => v.kyc_status === "pending").length,
      // New applications = kyc not yet uploaded (no submission at all)
      newApplications: arr.filter((v) => !v.kyc_status || v.kyc_status === "not_uploaded").length,
      total:           arr.length,
    };
  }, [vendors]);

  // ── derived: delivery boys ────────────────────────────────────────────────────
  // useDeliveryBoys returns delivery_boys with joined users(is_active).
  // Online = is_online = true on the delivery_boys row.
  // Pending KYC = is_verified = false.
  const deliveryStats = useMemo(() => {
    const arr = (deliveries ?? []) as any[];
    return {
      online:     arr.filter((d) => d.is_online === true).length,
      pendingKyc: arr.filter((d) => d.is_verified === false).length,
      total:      arr.length,
    };
  }, [deliveries]);

  // ── derived: orders ───────────────────────────────────────────────────────────
  const orderStats = useMemo(() => {
    const arr = (Array.isArray(allOrders) ? allOrders : []) as any[];
    const active = ["pending", "confirmed", "preparing", "out_for_delivery"];
    const todayOrders = arr.filter((o) => o.created_at?.startsWith(today));
    return {
      todayTotal: todayOrders.length,
      active:     arr.filter((o) => active.includes(o.status)).length,
    };
  }, [allOrders, today]);

  // ── derived: payouts — from useAdminWalletKPIs (same source as AdminWalletsPage) ──
  const payoutStats = useMemo(() => ({
    // totalPending = sum of pending_balance across all wallets (vendor T+3 + delivery)
    pendingAmount: kpis?.totalPending    ?? 0,
    // pendingCashouts = withdrawal requests awaiting admin approval
    pendingCount:  kpis?.pendingCashouts ?? 0,
  }), [kpis]);

  // ── derived: recent orders ────────────────────────────────────────────────────
  const recentOrders = useMemo(() => {
    const arr = (Array.isArray(allOrders) ? allOrders : []) as any[];
    return [...arr]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [allOrders]);

  // ── derived: chart data ───────────────────────────────────────────────────────
  // Use earnings for bar height if totalOrders is unavailable/zero, fallback chain
  const maxOrders = Math.max(...(dailyTrend ?? []).map((d) => d.totalOrders ?? 0), 1);
  const maxEarnings = Math.max(...(dailyTrend ?? []).map((d) => d.earnings ?? 0), 1);
  // Revenue breakdown — derived from overview (same data as KPI cards)
  // Uses platformCommission + deliveryFeesCollected from useAdminEarningsOverview
  // so the numbers exactly match what's shown in the KPI cards above.
  const breakdownTotals = useMemo(() => {
    const totCommission = overview?.platformCommission    ?? 0;
    const totDelivery   = overview?.deliveryFeesCollected ?? 0;
    const totVendor     = overview?.grossOrderValue
                          ? (overview.grossOrderValue - totCommission)
                          : 0; // vendor share = gross - platform commission (context only)
    const platformGrand = totCommission + totDelivery || 1;
    return {
      segments: [
        { label: "Platform Commission",     value: totCommission, pct: Math.round(totCommission / platformGrand * 100), color: "bg-emerald-500" },
        { label: "Delivery Fees Collected", value: totDelivery,   pct: Math.round(totDelivery   / platformGrand * 100), color: "bg-blue-500"   },
      ],
      vendorPayout: totVendor,
      grossOrderValue: overview?.grossOrderValue ?? 0,
      netPlatformEarnings: overview?.netPlatformEarnings ?? 0,
      platformGrand,
    };
  }, [overview]);

  const customerCount = (Array.isArray(customers) ? customers : []).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">Monitor your platform's key metrics and performance</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total Orders Today"
          value={orderStats.todayTotal.toLocaleString("en-IN")}
          change=""
          trend="neutral"
          icon={ShoppingCart}
          isLoading={ordersLoading}
          href="/admin/orders"
        />
        <KpiCard
          title="Active Orders"
          value={orderStats.active.toLocaleString("en-IN")}
          change=""
          trend="neutral"
          icon={Package}
          isLoading={ordersLoading}
          href="/admin/orders"
        />
        <KpiCard
          title="Monthly Revenue"
          value={formatCurrency(overview?.grossOrderValue ?? 0)}
          change={`${overview?.totalOrders ?? 0} orders`}
          trend="up"
          icon={DollarSign}
          isLoading={overviewLoading}
          href="/admin/earnings"
        />
        <KpiCard
          title="Pending Payouts"
          value={formatCurrency(payoutStats.pendingAmount)}
          change={`${payoutStats.pendingCount} requests`}
          trend={payoutStats.pendingAmount > 0 ? "down" : "neutral"}
          icon={Wallet}
          isLoading={kpisLoading}
          href="/admin/wallets"
        />
        <KpiCard
          // Online = is_online = true on delivery_boys row
          title="Online Delivery Partners"
          value={deliveryStats.online.toLocaleString("en-IN")}
          change={`of ${deliveryStats.total} total`}
          trend="neutral"
          icon={Truck}
          isLoading={deliveryLoading}
          href="/admin/delivery"
        />
        <KpiCard
          // Active = linked users.is_active = true (from the joined users table)
          title="Active Vendors"
          value={vendorStats.active.toLocaleString("en-IN")}
          change={`of ${vendorStats.total} total`}
          trend="neutral"
          icon={Store}
          isLoading={vendorsLoading}
          href="/admin/vendors"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Orders Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Over Time</CardTitle>
            <CardDescription>Orders &amp; earnings — last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {trendLoading ? (
              <div className="flex h-full items-end gap-2 pb-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${50 + i * 5}%` }} />
                ))}
              </div>
            ) : (dailyTrend ?? []).length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No data for this range
              </div>
            ) : (
              <div className="flex h-full items-end justify-between gap-2 pb-6">
                {(dailyTrend ?? []).map((item) => {
                  // Use earnings-based height if order count is 0 for some days
                  const orderPct    = item.totalOrders > 0 ? (item.totalOrders / maxOrders) * 100 : 0;
                  const earningsPct = item.earnings    > 0 ? (item.earnings    / maxEarnings) * 100 : 0;
                  const pct         = Math.max(orderPct > 0 ? orderPct : earningsPct, item.earnings > 0 ? 4 : 2);
                  const label = new Date(item.date).toLocaleDateString("en-IN", { weekday: "short" });
                  return (
                    <div key={item.date} className="flex flex-1 flex-col items-center gap-1.5 group relative">
                      {/* hover tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                        <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                          {item.totalOrders} orders · {formatCurrency(item.earnings)}
                        </div>
                        <div className="w-2 h-2 bg-slate-800 rotate-45 -mt-1" />
                      </div>
                      <div
                        className="w-full rounded-t-lg bg-blue-500 hover:bg-blue-600 transition-colors"
                        style={{ height: `${pct}%`, minHeight: "6px" }}
                      />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Breakdown — same numbers as Earnings page KPI cards */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Vendor payouts vs commission vs delivery — last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {overviewLoading ? (
              <div className="flex flex-col justify-center gap-4 h-full">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col justify-center gap-3 h-full">

                {/* Gross Order Value — context header */}
                <div className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-1.5 text-blue-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                    Gross Order Value
                  </div>
                  <span className="font-bold text-blue-800">{formatCurrency(breakdownTotals.grossOrderValue)}</span>
                </div>

                {/* Platform Commission + Delivery Fees — progress bars */}
                {breakdownTotals.segments.map((s) => (
                  <div key={s.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                        <span className="font-medium text-foreground">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{formatCurrency(s.value)}</span>
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                          {s.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${s.color} rounded-full transition-all duration-700`}
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                  </div>
                ))}

                {/* Net Platform Earnings — bottom line */}
                <div className="border-t pt-2 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Net Platform Earnings</span>
                    <div className="flex h-1.5 w-32 rounded-full overflow-hidden">
                      {breakdownTotals.segments.map((s) => (
                        <div
                          key={s.label}
                          className={`h-full ${s.color} transition-all duration-700`}
                          style={{ width: `${s.pct}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="font-bold text-base text-purple-600">
                    {formatCurrency(breakdownTotals.netPlatformEarnings)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification Alerts */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title:       "Pending Vendor KYC",
            // is_verified = false means they haven't been verified yet
            count:       vendorStats.pendingKyc,
            description: "Vendors awaiting document verification",
            icon:        Store,
            color:       "text-emerald-500",
            href:        "/admin/vendors?filter=pending_kyc",
            isLoading:   vendorsLoading,
          },
          {
            title:       "Delivery Partner KYC",
            // is_verified = false on delivery_boys row
            count:       deliveryStats.pendingKyc,
            description: "Partners pending background verification",
            icon:        Truck,
            color:       "text-blue-500",
            href:        "/admin/delivery?filter=pending_kyc",
            isLoading:   deliveryLoading,
          },
          {
            title:       "Withdrawal Requests",
            count:       payoutStats.pendingCount,
            description: "Payout requests awaiting approval",
            icon:        DollarSign,
            color:       "text-purple-500",
            href:        "/admin/wallets?filter=pending",
            isLoading:   kpisLoading,
          },
        ].map((alert) => (
          <Card key={alert.title} className="relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-12 -mt-12" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{alert.title}</CardTitle>
              <alert.icon className={`h-5 w-5 ${alert.color}`} />
            </CardHeader>
            <CardContent>
              {alert.isLoading ? (
                <>
                  <Skeleton className="h-9 w-16 mb-2" />
                  <Skeleton className="h-3 w-48 mb-4" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-foreground">{alert.count}</div>
                    <span className="text-xs text-muted-foreground">pending</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 mb-4">{alert.description}</p>
                  <Link href={alert.href}>
                    <Button size="sm" className="w-full" variant="outline">
                      <FileCheck className="mr-2 h-4 w-4" />
                      Review Now
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders across all vendors</CardDescription>
            </div>
            <Link href="/admin/orders">
              <Button variant="outline" size="sm">
                View All <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  {Array.from({ length: 6 }).map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Delivery Partner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No orders yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order: any) => {
                    // Relations may be joined as nested objects — handle both
                    const customer  = order.customers  ?? order.customer;
                    const vendor    = order.vendors    ?? order.vendor;
                    const delivery  = order.delivery_boys ?? order.delivery_boy;
                    const custName  = customer
                      ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "—"
                      : "—";
                    const vendName  = vendor?.store_name ?? "—";
                    const delName   = delivery
                      ? `${delivery.first_name ?? ""} ${delivery.last_name ?? ""}`.trim() || "Unassigned"
                      : "Unassigned";
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium font-mono text-xs">
                          <Link href={`/admin/orders/${order.id}`} className="hover:underline text-primary">
                            {order.order_number ?? order.id?.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell>{custName}</TableCell>
                        <TableCell className="text-sm">{vendName}</TableCell>
                        <TableCell className="text-muted-foreground">{delName}</TableCell>
                        <TableCell><StatusBadge status={order.status} /></TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(order.total_amount ?? 0))}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon:      Users,
            label:     "Customers",
            value:     customersLoading ? null : `${customerCount.toLocaleString("en-IN")} Total`,
            href:      "/admin/customers",
            isLoading: customersLoading,
          },
          {
            icon:      AlertCircle,
            label:     "KYC Pending",
            value:     (vendorsLoading || deliveryLoading) ? null
              : `${vendorStats.pendingKyc + deliveryStats.pendingKyc} Awaiting Review`,
            href:      "/admin/vendors",
            isLoading: vendorsLoading || deliveryLoading,
          },
          {
            icon:      Package,
            label:     "Products",
            value:     "Manage Inventory",
            href:      "/admin/products",
            isLoading: false,
          },
          {
            icon:      Store,
            label:     "Vendor Applications",
            value:     vendorsLoading ? null : `${vendorStats.newApplications} Pending`,
            href:      "/admin/vendors?filter=applications",
            isLoading: vendorsLoading,
          },
        ].map((action) => (
          <Link key={action.label} href={action.href}>
            <Button
              variant="outline"
              className="h-auto w-full flex-col items-start p-4 gap-2 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <action.icon className="h-4 w-4" />
                <span className="text-xs font-medium">{action.label}</span>
              </div>
              {action.isLoading
                ? <Skeleton className="h-4 w-28" />
                : <span className="text-sm font-semibold text-foreground">{action.value}</span>}
            </Button>
          </Link>
        ))}
      </div>

    </div>
  );
}