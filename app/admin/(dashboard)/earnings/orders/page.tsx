"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowLeft, Eye, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  useOrderEarnings,
  useOrderEarningsVendors,
  type OrderEarningsFilters,
} from "@/hooks/earnings/useEarnings";

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    delivered:  "bg-emerald-100 text-emerald-700",
    processing: "bg-blue-100 text-blue-700",
    cancelled:  "bg-red-100 text-red-700",
    refunded:   "bg-purple-100 text-purple-700",
  };
  return (
    <Badge className={map[status?.toLowerCase()] ?? "bg-slate-100 text-slate-700"}>
      {status}
    </Badge>
  );
}

function PaymentBadge({ status }: { status: string }) {
  return status?.toLowerCase() === "paid" ? (
    <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>
  ) : (
    <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
  );
}

function TableRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 11 }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
      ))}
    </TableRow>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

export default function OrderEarningsPage() {
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [vendorFilter,  setVendorFilter]  = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [currentPage,   setCurrentPage]   = useState(1);

  // Build server-side filters (status, vendor, payment method)
  // Search is done client-side to support customer name matching
  const serverFilters: OrderEarningsFilters = useMemo(() => ({
    ...(statusFilter  !== "all" && { orderStatus:   statusFilter  }),
    ...(vendorFilter  !== "all" && { vendorId:       vendorFilter  }),
    ...(paymentFilter !== "all" && { paymentMethod:  paymentFilter }),
  }), [statusFilter, vendorFilter, paymentFilter]);

  const { data: rawOrders, isLoading, error } = useOrderEarnings(serverFilters);
  const { data: vendors }                     = useOrderEarningsVendors();

  // Client-side search (order ID + customer name)
  const filteredOrders = useMemo(() => {
    if (!rawOrders) return [];
    if (!search.trim()) return rawOrders;
    const q = search.toLowerCase();
    return rawOrders.filter(
      (o) =>
        o.orderId.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q)
    );
  }, [rawOrders, search]);

  // Totals across ALL filtered rows
  const totals = useMemo(
    () =>
      filteredOrders.reduce(
        (acc, o) => ({
          orderTotal:       acc.orderTotal       + o.orderTotal,
          vendorCommission: acc.vendorCommission + o.vendorCommission,
          deliveryFee:      acc.deliveryFee      + o.deliveryFee,
          platformFee:      acc.platformFee      + o.platformFee,
          netEarning:       acc.netEarning       + o.netEarning,
        }),
        { orderTotal: 0, vendorCommission: 0, deliveryFee: 0, platformFee: 0, netEarning: 0 }
      ),
    [filteredOrders]
  );

  const totalPages     = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/earnings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Order-wise Earnings
            </h1>
            <p className="text-slate-600 mt-2">Detailed financial breakdown per order</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Failed to load order earnings data.
          </div>
        )}

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Orders",       value: isLoading ? null : String(filteredOrders.length),         gradient: "from-blue-500 to-blue-600",    text: "text-blue-100"   },
            { label: "Order Value",        value: isLoading ? null : formatCurrency(totals.orderTotal),     gradient: "from-emerald-500 to-emerald-600", text: "text-emerald-100" },
            { label: "Commission Earned",  value: isLoading ? null : formatCurrency(totals.vendorCommission), gradient: "from-amber-500 to-amber-600",  text: "text-amber-100"  },
            { label: "Net Earnings",       value: isLoading ? null : formatCurrency(totals.netEarning),     gradient: "from-purple-500 to-purple-600", text: "text-purple-100" },
          ].map(({ label, value, gradient, text }) => (
            <Card key={label} className={`bg-gradient-to-br ${gradient} text-white border-0`}>
              <CardContent className="pt-6">
                <div className={`text-sm ${text}`}>{label}</div>
                {value == null ? (
                  <Skeleton className="h-9 w-24 mt-1 bg-white/20" />
                ) : (
                  <div className="text-3xl font-bold mt-1">{value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search order or customer…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>

              {/* Order status */}
              <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
                <SelectTrigger><SelectValue placeholder="Order Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              {/* Vendor */}
              <Select value={vendorFilter} onValueChange={handleFilterChange(setVendorFilter)}>
                <SelectTrigger><SelectValue placeholder="Vendor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {(vendors ?? []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Payment method */}
              <Select value={paymentFilter} onValueChange={handleFilterChange(setPaymentFilter)}>
                <SelectTrigger><SelectValue placeholder="Payment Method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cod">COD</SelectItem>
                  <SelectItem value="netbanking">Net Banking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Order Earnings Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Order Total</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Delivery Fee</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead className="text-right">Net Earning</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} />)
                  ) : paginatedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-slate-500 py-8">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedOrders.map((order) => (
                      <TableRow key={order.rawId}>
                        <TableCell className="font-medium">{order.orderId}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>
                          <div className="font-medium">{order.vendor}</div>
                          <div className="text-xs text-slate-500">{order.vendorId}</div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(order.orderTotal)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 font-semibold">
                          {formatCurrency(order.vendorCommission)}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          {formatCurrency(order.deliveryFee)}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          {formatCurrency(order.platformFee)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-purple-600">
                          {formatCurrency(order.netEarning)}
                        </TableCell>
                        <TableCell>
                          <PaymentBadge status={order.paymentStatus} />
                          <div className="text-xs text-slate-500 mt-1 uppercase">
                            {order.paymentMethod}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.orderStatus} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/orders/${order.rawId}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>

                {!isLoading && filteredOrders.length > 0 && (
                  <TableFooter>
                    <TableRow className="bg-slate-50 font-bold">
                      <TableCell colSpan={3}>TOTALS</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.orderTotal)}</TableCell>
                      <TableCell className="text-right text-emerald-600">{formatCurrency(totals.vendorCommission)}</TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(totals.deliveryFee)}</TableCell>
                      <TableCell className="text-right text-amber-600">{formatCurrency(totals.platformFee)}</TableCell>
                      <TableCell className="text-right text-purple-600">{formatCurrency(totals.netEarning)}</TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-600">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of{" "}
                  {filteredOrders.length} orders
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}