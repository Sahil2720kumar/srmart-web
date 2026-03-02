"use client";

import { useState } from "react";
import {
  ChevronRight,
  Package,
  User,
  DollarSign,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  useOrder,
  useOrderItems,
  useOrderTracking,
  useUpdateOrderStatus,
  useCustomerCancelOrder,
} from "@/hooks/orders/useOrders";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ── Refund mutation (direct DB update, no dedicated RPC in useOrders.ts) ──────
const supabase = createClient();

function useRefundOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: "refunded", payment_status: "refunded" })
        .eq("id", orderId)
        .select("*")
        .single();
      if (error) throw error;

      await supabase.from("order_tracking").insert({
        order_id: orderId,
        status: "refunded",
        description: "Order refunded by admin",
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", data.id] });
      queryClient.invalidateQueries({ queryKey: ["orders", "all"] });
    },
  });
}

// ── Constants ────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  ready_for_pickup:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  picked_up:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  out_for_delivery:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  delivered:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const paymentStatusColors: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const timelineSteps = [
  { status: "pending", label: "Pending" },
  { status: "confirmed", label: "Confirmed" },
  { status: "processing", label: "Processing" },
  { status: "ready_for_pickup", label: "Ready for Pickup" },
  { status: "picked_up", label: "Picked Up" },
  { status: "out_for_delivery", label: "Out for Delivery" },
  { status: "delivered", label: "Delivered" },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function OrderDetailsPage() {
  const { orderId, groupId } = useParams<{
    orderId: string;
    groupId: string;
  }>();

  const [newStatus, setNewStatus] = useState("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: order, isLoading: orderLoading, error: orderError } = useOrder(orderId);
  const { data: orderItems, isLoading: itemsLoading } = useOrderItems(orderId);
  const { data: tracking } = useOrderTracking(orderId);


  console.log(order);

  // ── Mutations ────────────────────────────────────────────────────────────
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCustomerCancelOrder();
  const refundOrder = useRefundOrder();

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleUpdateStatus = async () => {
    if (!newStatus || !order) return;
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        status: newStatus,
        description: `Status updated to ${newStatus.replace(/_/g, " ")} by admin`,
      });
      toast.success("Status updated successfully");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setShowStatusDialog(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      await cancelOrder.mutateAsync({
        p_order_id: order.id,
        p_customer_id: order.customer_id,
        p_cancellation_reason: cancellationReason,
      });
      toast.success("Order cancelled successfully");
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setShowCancelDialog(false);
      setCancellationReason("");
    }
  };

  const handleRefundOrder = async () => {
    if (!order) return;
    try {
      await refundOrder.mutateAsync(order.id);
      toast.success("Order refunded successfully");
    } catch {
      toast.error("Failed to process refund");
    } finally {
      setShowRefundDialog(false);
    }
  };

  const getStatusIndex = (status: string) =>
    timelineSteps.findIndex((step) => step.status === status);

  // ── Loading / Error states ────────────────────────────────────────────────
  if (orderLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive text-lg">
          Failed to load order. Please go back and try again.
        </p>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin" className="hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/admin/order-groups" className="hover:text-foreground">
            Order Groups
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href={`/admin/order-groups/${groupId}/orders`}
            className="hover:text-foreground"
          >
            Orders
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Order Details</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            Order: {order.order_number}
          </h1>
        </div>

        {/* Order Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Order Number
                </p>
                <p className="text-lg font-semibold">{order.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      statusColors[order.status] ?? statusColors.pending
                    }
                  >
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewStatus(order.status);
                      setShowStatusDialog(true);
                    }}
                  >
                    Update
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Payment Status
                </p>
                <Badge
                  className={
                    paymentStatusColors[order.payment_status ?? ""] ??
                    paymentStatusColors.pending
                  }
                >
                  {order.payment_status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Payment Method
                </p>
                <p className="text-lg font-semibold uppercase">
                  {order.payment_method}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Created At</p>
                <p className="text-sm">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Confirmed At
                </p>
                <p className="text-sm">
                  {order.confirmed_at
                    ? new Date(order.confirmed_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Picked Up At
                </p>
                <p className="text-sm">
                  {order.picked_up_at
                    ? new Date(order.picked_up_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Delivered At
                </p>
                <p className="text-sm">
                  {order.delivered_at
                    ? new Date(order.delivered_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer & Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer & Delivery Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="text-lg font-semibold">
                  {order.customers
                    ? `${order.customers.first_name} ${order.customers.last_name}`
                    : order.customer_id}
                </p>
                {order.customers?.users?.email && (
                  <p className="text-sm text-muted-foreground">
                    {order.customers.users.email}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Delivery Address
                </p>
                {order.delivery_address ? (
                  <p className="text-sm">
                    {[
                      order.delivery_address.address_line1,
                      order.delivery_address.address_line2,
                      order.delivery_address.city,
                      order.delivery_address.state,
                      order.delivery_address.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {order.delivery_address_id ?? "N/A"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Boy</p>
                <p className="text-lg font-semibold">
                  {order.delivery_boys
                    ? `${order.delivery_boys.first_name} ${order.delivery_boys.last_name}`
                    : order.delivery_boy_id ?? "Not Assigned"}
                </p>
                {order.delivery_boys?.users?.phone && (
                  <p className="text-sm text-muted-foreground">
                    {order.delivery_boys.users.phone}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Special Instructions
                </p>
                <p className="text-sm">
                  {order.special_instructions || "None"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery OTP</p>
                <p className="text-lg font-mono font-semibold">
                  {order.delivery_otp ? "••••" : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">
                  ₹{Number(order.subtotal ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-semibold">
                  ₹{Number(order.tax ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee{order.is_free_delivery ? " (absorbed)" : ""}</span>
                <span className="font-semibold">
                  ₹{Number(order.delivery_fee ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-semibold text-green-600">
                  -₹{Number(order.discount ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coupon Discount</span>
                <span className="font-semibold text-green-600">
                  -₹{Number(order.coupon_discount ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-bold text-lg">Total Amount</span>
                <span className="font-bold text-lg">
                  ₹{Number(order.total_amount).toFixed(2)}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t space-y-2">
                {/* <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Commission Rate
                  </span>
                  <span className="font-semibold">
                    {order.commission_rate ?? 0}%
                  </span>
                </div> */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Total Commission
                  </span>
                  <span className="font-semibold">
                    ₹{Number(order.total_commission ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Platform Net Revenue
                  </span>
                  <span className="font-semibold text-green-600">
                    ₹{Number(order.platform_net_revenue ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor Payout</span>
                  <span className="font-semibold">
                    ₹{Number(order.vendor_payout ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Discount Price</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !orderItems?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-6"
                      >
                        No items found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {item.products?.name ?? item.product_id}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.product_id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {item.quantity}
                        </TableCell>
                        <TableCell>
                          ₹{Number(item.unit_price).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {item.discount_price != null ? (
                            <span className="text-green-600">
                              ₹{Number(item.discount_price).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{Number(item.total_price).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ₹{Number(item.commission_amount ?? 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation info OR Order Actions */}
        {order.cancelled_at ? (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Cancellation Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Cancelled By</p>
                <p className="text-lg font-semibold capitalize">
                  {order.cancelled_by ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Cancellation Reason
                </p>
                <p className="text-sm">{order.cancellation_reason ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled At</p>
                <p className="text-sm">
                  {new Date(order.cancelled_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Order Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={
                    order.status === "delivered" ||
                    order.status === "cancelled" ||
                    cancelOrder.isPending
                  }
                >
                  Cancel Order
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRefundDialog(true)}
                  disabled={
                    order.payment_status !== "paid" || refundOrder.isPending
                  }
                >
                  Refund Order
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Order Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {timelineSteps.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                // Find matching tracking entry for timestamp
                const trackingEntry = tracking?.find(
                  (t) => t.status === step.status
                );

                return (
                  <div
                    key={step.status}
                    className="relative flex items-center gap-4 pb-8 last:pb-0"
                  >
                    {/* Vertical Line */}
                    {index < timelineSteps.length - 1 && (
                      <div
                        className={`absolute left-3 top-7 w-0.5 h-full ${isCompleted ? "bg-primary" : "bg-border"
                          }`}
                      />
                    )}

                    {/* Circle */}
                    <div
                      className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 ${isCompleted
                        ? "border-primary bg-primary"
                        : "border-border bg-background"
                        }`}
                    >
                      {isCompleted && (
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${isCurrent
                          ? "text-foreground"
                          : "text-muted-foreground"
                          }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-muted-foreground">
                          Current Status
                        </p>
                      )}
                      {trackingEntry && (
                        <p className="text-xs text-muted-foreground">
                          {trackingEntry.created_at
                            ? new Date(trackingEntry.created_at).toLocaleDateString()
                            : "—"}
                          {trackingEntry.description
                            ? ` — ${trackingEntry.description}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Dialogs ─────────────────────────────────────────────────────── */}

        {/* Status Update Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
              <DialogDescription>
                Select the new status for this order.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready_for_pickup">
                    Ready for Pickup
                  </SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="out_for_delivery">
                    Out for Delivery
                  </SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
                disabled={updateStatus.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? "Updating…" : "Update Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Order Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Order</DialogTitle>
              <DialogDescription>
                Please provide a reason for cancelling this order.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Enter cancellation reason..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelOrder.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelOrder}
                disabled={
                  !cancellationReason.trim() || cancelOrder.isPending
                }
              >
                {cancelOrder.isPending
                  ? "Cancelling…"
                  : "Confirm Cancellation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Refund Order Dialog */}
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refund Order</DialogTitle>
              <DialogDescription>
                Are you sure you want to refund this order? This action will
                process a refund of ₹{Number(order.total_amount).toFixed(2)}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRefundDialog(false)}
                disabled={refundOrder.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRefundOrder}
                disabled={refundOrder.isPending}
              >
                {refundOrder.isPending ? "Processing…" : "Confirm Refund"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}