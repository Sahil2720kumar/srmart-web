"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft, FileText, Ban, CheckCircle,
  Phone, Mail, MapPin, Calendar, TrendingUp, Package, Loader2,
  Wallet, ArrowDownToLine, Clock, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import Link from "next/link";

import {
  useVendor,
  useVendorPayouts,
  useVendorOrders,
  useSuspendVendor,
  useUnsuspendVendor,
  useUpdateVendor,
  useUpdateVendorKycStatus,
} from "@/hooks";
import { useVendorWallet } from "@/hooks"; // see companion hook file
import { useParams } from "next/navigation";

// ─────────────────────────────────────────────
// Status colour map
// ─────────────────────────────────────────────
const statusColors: Record<string, string> = {
  active:     "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  suspended:  "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",
  delivered:  "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  pending:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved:   "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  verified:   "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  rejected:   "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",
  completed:  "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  cancelled:  "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",
};

function getStatusColor(status?: string | null) {
  return statusColors[status ?? ""] ?? "bg-gray-100 text-gray-700";
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Stat card helper
// ─────────────────────────────────────────────
function StatCard({
  icon: Icon,
  title,
  value,
  sub,
  loading,
  iconClass = "text-muted-foreground",
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  sub?: string;
  loading?: boolean;
  iconClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className={`h-4 w-4 ${iconClass}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function VendorProfilePage() {
  const { vendorId } = useParams<{ vendorId: string }>();

  // ── Queries ──────────────────────────────
  const { data: vendor, isLoading: vendorLoading, error: vendorError } = useVendor(vendorId);
  const { data: payouts, isLoading: payoutsLoading } = useVendorPayouts(vendorId);
  const { data: allOrders, isLoading: ordersLoading } = useVendorOrders(vendorId);

  // Wallet — fetches from wallets table / get_wallet_details RPC
  const { data: wallet, isLoading: walletLoading } = useVendorWallet(vendorId);
 
  // ── Mutations ────────────────────────────
  const suspendVendor      = useSuspendVendor();
  const unsuspendVendor    = useUnsuspendVendor();
  const updateVendor       = useUpdateVendor();
  const updateKycStatus    = useUpdateVendorKycStatus();

  // ── Local UI state ───────────────────────
  const [showSuspendDialog, setShowSuspendDialog]   = useState(false);
  const [suspensionReason, setSuspensionReason]     = useState("");
  const [orderStatusFilter, setOrderStatusFilter]   = useState("all");
  const [orderSearch, setOrderSearch]               = useState("");

  // Admin control state
  const [kycStatusValue, setKycStatusValue]         = useState<string>("");
  const [isVerifiedValue, setIsVerifiedValue]       = useState<string>("");
  const [adminControlsSaving, setAdminControlsSaving] = useState(false);

  // Initialise admin controls once vendor loads
  const [controlsInitialised, setControlsInitialised] = useState(false);

  if (vendor && !controlsInitialised) {
    setKycStatusValue(vendor.kyc_status ?? "pending");
    setIsVerifiedValue(vendor.is_verified ? "true" : "false");
    setControlsInitialised(true);
  }

  // ── Derived values ───────────────────────
  const isSuspended  = !!(vendor?.suspension_reason);
  const vendorStatus = isSuspended ? "suspended" : "active";
  const kycStatus    = vendor?.kyc_status ?? "pending";

  const filteredOrders = useMemo(() => {
    if (!allOrders) return [];
    return allOrders.filter((order) => {
      const matchStatus =
        orderStatusFilter === "all" || order.status === orderStatusFilter;
      const search = orderSearch.toLowerCase();
      const customerName = order.customers
        ? `${order.customers.first_name} ${order.customers.last_name}`
        : "";
      const matchSearch =
        order.order_number.toLowerCase().includes(search) ||
        customerName.toLowerCase().includes(search);
      return matchStatus && matchSearch;
    });
  }, [allOrders, orderStatusFilter, orderSearch]);

  // ── Handlers ─────────────────────────────
  const handleToggleStatus = () => {
    if (!isSuspended) {
      setShowSuspendDialog(true);
    } else {
      unsuspendVendor.mutate(vendorId);
    }
  };

  const confirmSuspension = () => {
    suspendVendor.mutate(
      { vendorId, reason: suspensionReason },
      {
        onSuccess: () => {
          setShowSuspendDialog(false);
          setSuspensionReason("");
        },
      }
    );
  };

  /**
   * Save both is_verified and kyc_status in one go.
   * useUpdateVendorKycStatus handles kyc fields; we also patch is_verified
   * via useUpdateVendor if the value doesn't match.
   */
  const handleSaveAdminControls = async () => {
    if (!vendor) return;
    setAdminControlsSaving(true);
    try {
      const newIsVerified = isVerifiedValue === "true";
      const newKycStatus  = kycStatusValue as "pending" | "approved" | "rejected";

      // updateKycStatus already sets is_verified = true when status === 'verified'
      await updateKycStatus.mutateAsync({
        vendorId,
        status: newKycStatus,
        rejectedReason: newKycStatus === "rejected" ? undefined : undefined,
      });

      
      if (newIsVerified) {        
        await updateVendor.mutateAsync({
          vendorId,
          updates: { is_verified: newIsVerified },
        });
      }
    } finally {
      setAdminControlsSaving(false);
    }
  };

  // ── Loading / error states ───────────────
  if (vendorLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <Skeleton className="h-9 w-36" />
          <Card><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          <div className="grid gap-4 md:grid-cols-2">
            <CardSkeleton /><CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (vendorError || !vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-destructive">Failed to load vendor details.</p>
          <Link href="/admin/vendors">
            <Button variant="outline">Back to Vendors</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6">

        {/* Back */}
        <Link href="/admin/vendors">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </Link>

        {/* ── Header card ── */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={vendor.store_image ?? ""} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(vendor.store_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">{vendor.users?.email ?? "—"}</h1>
                  <p className="text-lg text-muted-foreground">{vendor.store_name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge className={getStatusColor(vendorStatus)}>{vendorStatus}</Badge>
                    <Badge className={getStatusColor(kycStatus)}>{kycStatus}</Badge>
                    {vendor.is_verified && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Identity Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-2 sm:mt-0">
                <Link href={`/admin/vendors/${vendorId}/kyc`}>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Review KYC
                  </Button>
                </Link>
                <Button
                  variant={isSuspended ? "default" : "destructive"}
                  onClick={handleToggleStatus}
                  disabled={suspendVendor.isPending || unsuspendVendor.isPending}
                >
                  {(suspendVendor.isPending || unsuspendVendor.isPending) ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isSuspended ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <Ban className="mr-2 h-4 w-4" />
                  )}
                  {isSuspended ? "Activate Vendor" : "Suspend Vendor"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Tabs ── */}
        <Tabs defaultValue="overview" className="space-y-6 flex-col">
          <TabsList className="grid w-full grid-cols-4">
            {["overview", "orders", "earnings", "kyc"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="capitalize data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                {tab === "kyc" ? "KYC & Admin" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ─── Overview ─── */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Contact */}
              <Card>
                <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{vendor.users?.email ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{vendor.users?.phone ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{vendor.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.city}, {vendor.state} — {vendor.pincode}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business */}
              <Card>
                <CardHeader><CardTitle>Business Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Date</p>
                      <p className="font-medium">
                        {vendor.created_at
                          ? new Date(vendor.created_at).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="font-medium">{vendor.total_orders ?? 0}</p>
                    </div>
                  </div>
                  {isSuspended && vendor.suspension_reason && (
                    <div>
                      <p className="text-sm text-muted-foreground">Suspension Reason</p>
                      <p className="font-medium text-destructive">{vendor.suspension_reason}</p>
                      {vendor.suspended_until && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Until: {new Date(vendor.suspended_until).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                  {vendor.admin_notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Admin Notes</p>
                      <p className="font-medium">{vendor.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick wallet snapshot */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Wallet}
                title="Available Balance"
                value={`₹${(wallet?.available_balance ?? 0).toLocaleString("en-IN")}`}
                sub="Ready to withdraw"
                loading={walletLoading}
                iconClass="text-green-500"
              />
              <StatCard
                icon={Clock}
                title="Pending Balance"
                value={`₹${(wallet?.pending_balance ?? 0).toLocaleString("en-IN")}`}
                sub="Awaiting release"
                loading={walletLoading}
                iconClass="text-yellow-500"
              />
              <StatCard
                icon={TrendingUp}
                title="Lifetime Earnings"
                value={`₹${(wallet?.lifetime_earnings ?? 0).toLocaleString("en-IN")}`}
                sub="All time"
                loading={walletLoading}
                iconClass="text-blue-500"
              />
              <StatCard
                icon={ArrowDownToLine}
                title="Total Withdrawn"
                value={`₹${(wallet?.total_withdrawn ?? 0).toLocaleString("en-IN")}`}
                sub="All time"
                loading={walletLoading}
                iconClass="text-purple-500"
              />
            </div>
          </TabsContent>

          {/* ─── Orders ─── */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Order Filters</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Status</Label>
                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Search</Label>
                    <Input
                      placeholder="Order number or customer name"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {ordersLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            No orders found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => {
                          const customerName = order.customers
                            ? `${order.customers.first_name} ${order.customers.last_name}`
                            : "—";
                          return (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">{order.order_number}</TableCell>
                              <TableCell>{customerName}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                              </TableCell>
                              <TableCell>₹{order.total_amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(order.payment_status ?? "")}>
                                  {order.payment_status ?? "—"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {order.created_at
                                  ? new Date(order.created_at).toLocaleDateString()
                                  : "—"}
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
          </TabsContent>

          {/* ─── Earnings (Wallet) ─── */}
          <TabsContent value="earnings" className="space-y-4">

            {/* Wallet summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Wallet}
                title="Available Balance"
                value={`₹${(wallet?.available_balance ?? 0).toLocaleString("en-IN")}`}
                sub="Ready to withdraw"
                loading={walletLoading}
                iconClass="text-green-500"
              />
              <StatCard
                icon={Clock}
                title="Pending Balance"
                value={`₹${(wallet?.pending_balance ?? 0).toLocaleString("en-IN")}`}
                sub="Awaiting release"
                loading={walletLoading}
                iconClass="text-yellow-500"
              />
              <StatCard
                icon={DollarSign}
                title="Earnings This Month"
                value={`₹${(wallet?.earnings_this_month ?? 0).toLocaleString("en-IN")}`}
                loading={walletLoading}
                iconClass="text-indigo-500"
              />
              <StatCard
                icon={TrendingUp}
                title="Lifetime Earnings"
                value={`₹${(wallet?.lifetime_earnings ?? 0).toLocaleString("en-IN")}`}
                loading={walletLoading}
                iconClass="text-blue-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                icon={DollarSign}
                title="Earnings Today"
                value={`₹${(wallet?.earnings_today ?? 0).toLocaleString("en-IN")}`}
                loading={walletLoading}
              />
              <StatCard
                icon={ArrowDownToLine}
                title="Total Withdrawn"
                value={`₹${(wallet?.total_withdrawn ?? 0).toLocaleString("en-IN")}`}
                sub="All time cashouts"
                loading={walletLoading}
                iconClass="text-purple-500"
              />
            </div>

            {/* Recent Payouts */}
            <Card>
              <CardHeader><CardTitle>Recent Payouts</CardTitle></CardHeader>
              <CardContent className="p-0">
                {payoutsLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payout ID</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Net</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!payouts || payouts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            No payouts found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        payouts.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell className="font-medium font-mono text-xs">
                              {payout.id.slice(0, 8)}…
                            </TableCell>
                            <TableCell>₹{payout.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-destructive">
                              -₹{payout.commission.toFixed(2)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              ₹{payout.net_amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {payout.payout_date
                                ? new Date(payout.payout_date).toLocaleDateString()
                                : payout.created_at
                                ? new Date(payout.created_at).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(payout.status ?? "")}>
                                {payout.status ?? "—"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── KYC & Admin Controls ─── */}
          <TabsContent value="kyc" className="space-y-4">

            {/* ── Admin Controls ── */}
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  Admin Controls
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Directly update KYC status and identity verification for this vendor.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* KYC Status dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="kyc-status-select">KYC Status</Label>
                    <Select
                      value={kycStatusValue}
                      onValueChange={setKycStatusValue}
                    >
                      <SelectTrigger id="kyc-status-select">
                        <SelectValue placeholder="Select KYC status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-yellow-400" />
                            Pending
                          </span>
                        </SelectItem>
                        <SelectItem value="approved">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-400" />
                            Approved
                          </span>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-400" />
                            Rejected
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Current: <Badge className={`${getStatusColor(kycStatus)} text-xs`}>{kycStatus}</Badge>
                    </p>
                  </div>

                  {/* Is Verified dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="is-verified-select">Identity Verified</Label>
                    <Select
                      value={isVerifiedValue}
                      onValueChange={setIsVerifiedValue}
                    >
                      <SelectTrigger id="is-verified-select">
                        <SelectValue placeholder="Select verification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            Verified (true)
                          </span>
                        </SelectItem>
                        <SelectItem value="false">
                          <span className="flex items-center gap-2">
                            <Ban className="h-3.5 w-3.5 text-red-500" />
                            Not Verified (false)
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Current:{" "}
                      <Badge className={getStatusColor(vendor.is_verified ? "verified" : "pending")}>
                        {vendor.is_verified ? "true" : "false"}
                      </Badge>
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSaveAdminControls}
                  disabled={adminControlsSaving || updateKycStatus.isPending || updateVendor.isPending}
                  className="w-full sm:w-auto"
                >
                  {(adminControlsSaving || updateKycStatus.isPending || updateVendor.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Admin Changes
                </Button>
              </CardContent>
            </Card>

            {/* ── KYC Documents Status ── */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>KYC Documents Status</CardTitle>
                  <Link href={`/admin/vendors/${vendorId}/kyc`}>
                    <Button>
                      <FileText className="mr-2 h-4 w-4" />
                      Full KYC Review
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Overall KYC status */}
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-semibold">Overall KYC Status</p>
                      {vendor.kyc_verified_at && (
                        <p className="text-sm text-muted-foreground">
                          Verified on {new Date(vendor.kyc_verified_at).toLocaleDateString()}
                        </p>
                      )}
                      {vendor.kyc_rejected_reason && (
                        <p className="text-sm text-destructive mt-1">
                          Reason: {vendor.kyc_rejected_reason}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(kycStatus)}>{kycStatus}</Badge>
                  </div>

                  {/* Verification flags */}
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <p className="font-medium">Identity Verified</p>
                    </div>
                    <Badge className={getStatusColor(vendor.is_verified ? "verified" : "pending")}>
                      {vendor.is_verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <p className="font-medium">Store Active</p>
                    </div>
                    <Badge className={getStatusColor(vendor.is_open ? "active" : "suspended")}>
                      {vendor.is_open ? "Open" : "Closed"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Suspend dialog ── */}
        <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend Vendor</DialogTitle>
              <DialogDescription>
                Please provide a reason for suspending <strong>{vendor.store_name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Enter suspension reason…"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmSuspension}
                disabled={!suspensionReason.trim() || suspendVendor.isPending}
              >
                {suspendVendor.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Suspend Vendor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}