"use client";

import { useState } from "react";
import { ChevronRight, Check, X } from "lucide-react";
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
import Link from "next/link";
import { useParams } from "next/navigation";
import { useOrderGroup } from "@/hooks/orders/useOrders";
import { useUpdateOrderStatus } from "@/hooks/orders/useOrders";
import { toast } from "sonner";

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

export default function OrdersPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: orderGroup, isLoading, error } = useOrderGroup(groupId);
  const updateStatus = useUpdateOrderStatus();

  const orders = orderGroup?.orders ?? [];

  const handleStatusChange = (orderId: string, currentStatus: string) => {
    setEditingOrderId(orderId);
    setNewStatus(currentStatus);
  };

  const handleSaveStatus = () => {
    setShowConfirmDialog(true);
  };

  const confirmStatusUpdate = async () => {
    if (!editingOrderId || !newStatus) return;
    try {
      await updateStatus.mutateAsync({
        orderId: editingOrderId,
        status: newStatus,
        description: `Status updated to ${newStatus.replace(/_/g, " ")} by admin`,
      });
      toast.success("Order status updated successfully");
    } catch (err) {
      toast.error("Failed to update order status");
      console.error(err);
    } finally {
      setEditingOrderId(null);
      setNewStatus("");
      setShowConfirmDialog(false);
    }
  };

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
          <span className="text-foreground">Orders</span>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-foreground">
          Order Group: {groupId}
        </h1>

        {/* Group Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Group Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <p className="text-destructive">
                Failed to load order group details.
              </p>
            ) : orderGroup ? (
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Group Status</p>
                  <Badge
                    className={
                      statusColors[orderGroup.status] ?? statusColors.pending
                    }
                  >
                    {orderGroup.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{Number(orderGroup.total_amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Payment Status
                  </p>
                  <Badge
                    className={
                      paymentStatusColors[orderGroup.payment_status ?? ""] ??
                      paymentStatusColors.pending
                    }
                  >
                    {orderGroup.payment_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Delivery Boy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Vendor Payout</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 10 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center text-destructive py-8"
                      >
                        Failed to load orders. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : !orders.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center text-muted-foreground py-8"
                      >
                        No orders found in this group.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {order.vendors?.store_name ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.vendor_id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.delivery_boys ? (
                            <div>
                              <p className="font-medium">
                                {order.delivery_boys.first_name}{" "}
                                {order.delivery_boys.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.delivery_boy_id}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Not Assigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingOrderId === order.id ? (
                            <div className="flex items-center gap-2">
                              <Select
                                value={newStatus}
                                onValueChange={setNewStatus}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">
                                    Pending
                                  </SelectItem>
                                  <SelectItem value="confirmed">
                                    Confirmed
                                  </SelectItem>
                                  <SelectItem value="processing">
                                    Processing
                                  </SelectItem>
                                  <SelectItem value="ready_for_pickup">
                                    Ready for Pickup
                                  </SelectItem>
                                  <SelectItem value="picked_up">
                                    Picked Up
                                  </SelectItem>
                                  <SelectItem value="out_for_delivery">
                                    Out for Delivery
                                  </SelectItem>
                                  <SelectItem value="delivered">
                                    Delivered
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    Cancelled
                                  </SelectItem>
                                  <SelectItem value="refunded">
                                    Refunded
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleSaveStatus}
                                disabled={updateStatus.isPending}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingOrderId(null);
                                  setNewStatus("");
                                }}
                                disabled={updateStatus.isPending}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="cursor-pointer"
                              onClick={() =>
                                handleStatusChange(order.id, order.status)
                              }
                            >
                              <Badge
                                className={
                                  statusColors[order.status] ??
                                  statusColors.pending
                                }
                              >
                                {order.status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              paymentStatusColors[order.payment_status ?? ""] ??
                              paymentStatusColors.pending
                            }
                          >
                            {order.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{Number(order.total_amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ₹{Number(order.total_commission ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ₹{Number(order.vendor_payout ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/order-groups/${groupId}/orders/${order.id}`}
                          >
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Status Update</DialogTitle>
              <DialogDescription>
                Are you sure you want to update the order status to{" "}
                <span className="font-semibold">
                  {newStatus?.replace(/_/g, " ")}
                </span>
                ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={updateStatus.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmStatusUpdate}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? "Updating…" : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}