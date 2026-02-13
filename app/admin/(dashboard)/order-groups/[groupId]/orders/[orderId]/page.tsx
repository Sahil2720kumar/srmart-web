"use client";

import { useState } from "react";
import { ChevronRight, Package, User, DollarSign, Clock, XCircle, AlertCircle } from "lucide-react";
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
import Image from "next/image";
import { useParams } from "next/navigation";

// Mock data
const mockOrder = {
  id: "ORD-001",
  order_number: "ORD-2024-001",
  status: "out_for_delivery",
  payment_status: "paid",
  payment_method: "upi",
  created_at: "2024-02-10T10:30:00Z",
  confirmed_at: "2024-02-10T10:35:00Z",
  picked_up_at: "2024-02-10T11:00:00Z",
  delivered_at: null,
  customer_id: "CUST-123",
  delivery_address_id: "ADDR-456",
  delivery_boy_id: "DB-001",
  special_instructions: "Please ring the doorbell twice",
  delivery_otp: "1234",
  subtotal: 400.00,
  tax: 36.00,
  delivery_fee: 20.00,
  discount: 5.50,
  coupon_discount: 0,
  total_amount: 450.50,
  commission_rate: 10,
  total_commission: 45.05,
  platform_net_revenue: 25.05,
  vendor_payout: 405.45,
  cancelled_by: null,
  cancellation_reason: null,
  cancelled_at: null,
};

const mockOrderItems = [
  {
    id: "ITEM-001",
    product_id: "PROD-123",
    product_name: "Organic Tomatoes",
    product_image: "/placeholder-product.jpg",
    quantity: 2,
    unit_price: 50.00,
    discount_price: 45.00,
    total_price: 90.00,
    commission_amount: 9.00,
  },
  {
    id: "ITEM-002",
    product_id: "PROD-456",
    product_name: "Fresh Milk (1L)",
    product_image: "/placeholder-product.jpg",
    quantity: 3,
    unit_price: 60.00,
    discount_price: 55.00,
    total_price: 165.00,
    commission_amount: 16.50,
  },
  {
    id: "ITEM-003",
    product_id: "PROD-789",
    product_name: "Whole Wheat Bread",
    product_image: "/placeholder-product.jpg",
    quantity: 1,
    unit_price: 40.00,
    discount_price: null,
    total_price: 40.00,
    commission_amount: 4.00,
  },
  {
    id: "ITEM-004",
    product_id: "PROD-321",
    product_name: "Fresh Eggs (12 pcs)",
    product_image: "/placeholder-product.jpg",
    quantity: 1,
    unit_price: 105.00,
    discount_price: null,
    total_price: 105.00,
    commission_amount: 10.50,
  },
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  ready_for_pickup: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  picked_up: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  out_for_delivery: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const paymentStatusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
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

// {params 
// }: { 
//   params: { groupId: string; orderId: string } 
// }
export default function OrderDetailsPage() {
  const [order, setOrder] = useState(mockOrder);
  const [newStatus, setNewStatus] = useState(order.status);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const {orderId,groupId}=useParams()


  const handleUpdateStatus = () => {
    setOrder({ ...order, status: newStatus as any });
    setShowStatusDialog(false);
  };

  const handleCancelOrder = () => {
    setOrder({ 
      ...order, 
      status: "cancelled",
      cancelled_by: "admin",
      cancellation_reason: cancellationReason,
      cancelled_at: new Date().toISOString(),
    });
    setShowCancelDialog(false);
    setCancellationReason("");
  };

  const handleRefundOrder = () => {
    setOrder({ 
      ...order, 
      status: "refunded",
      payment_status: "refunded",
    });
    setShowRefundDialog(false);
  };

  const getStatusIndex = (status: string) => {
    return timelineSteps.findIndex(step => step.status === status);
  };

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="min-h-screen bg-background ">
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
          <Link href={`/admin/order-groups/${groupId}/orders`} className="hover:text-foreground">
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
                <p className="text-sm text-muted-foreground mb-2">Order Number</p>
                <p className="text-lg font-semibold">{order.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[order.status]}>
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowStatusDialog(true)}
                  >
                    Update
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Payment Status</p>
                <Badge className={paymentStatusColors[order.payment_status]}>
                  {order.payment_status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Payment Method</p>
                <p className="text-lg font-semibold uppercase">{order.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Created At</p>
                <p className="text-sm">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Confirmed At</p>
                <p className="text-sm">
                  {order.confirmed_at ? new Date(order.confirmed_at).toLocaleString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Picked Up At</p>
                <p className="text-sm">
                  {order.picked_up_at ? new Date(order.picked_up_at).toLocaleString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Delivered At</p>
                <p className="text-sm">
                  {order.delivered_at ? new Date(order.delivered_at).toLocaleString() : "N/A"}
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
                <p className="text-sm text-muted-foreground">Customer ID</p>
                <p className="text-lg font-semibold">{order.customer_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Address ID</p>
                <p className="text-lg font-semibold">{order.delivery_address_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Boy ID</p>
                <p className="text-lg font-semibold">
                  {order.delivery_boy_id || "Not Assigned"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Special Instructions</p>
                <p className="text-sm">{order.special_instructions || "None"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery OTP</p>
                <p className="text-lg font-mono font-semibold">
                  {order.delivery_otp ? `••••` : "N/A"}
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
                <span className="font-semibold">₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-semibold">₹{order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-semibold">₹{order.delivery_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-semibold text-green-600">-₹{order.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coupon Discount</span>
                <span className="font-semibold text-green-600">-₹{order.coupon_discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-bold text-lg">Total Amount</span>
                <span className="font-bold text-lg">₹{order.total_amount.toFixed(2)}</span>
              </div>
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission Rate</span>
                  <span className="font-semibold">{order.commission_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Commission</span>
                  <span className="font-semibold">₹{order.total_commission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Net Revenue</span>
                  <span className="font-semibold text-green-600">₹{order.platform_net_revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor Payout</span>
                  <span className="font-semibold">₹{order.vendor_payout.toFixed(2)}</span>
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
                  {mockOrderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">{item.product_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{item.quantity}</TableCell>
                      <TableCell>₹{item.unit_price.toFixed(2)}</TableCell>
                      <TableCell>
                        {item.discount_price ? (
                          <span className="text-green-600">₹{item.discount_price.toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">₹{item.total_price.toFixed(2)}</TableCell>
                      <TableCell>₹{item.commission_amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation / Refund Section */}
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
                <p className="text-lg font-semibold capitalize">{order.cancelled_by}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancellation Reason</p>
                <p className="text-sm">{order.cancellation_reason}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled At</p>
                <p className="text-sm">{new Date(order.cancelled_at).toLocaleString()}</p>
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
                  disabled={order.status === "delivered" || order.status === "cancelled"}
                >
                  Cancel Order
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRefundDialog(true)}
                  disabled={order.payment_status !== "paid"}
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
                
                return (
                  <div key={step.status} className="relative flex items-center gap-4 pb-8 last:pb-0">
                    {/* Vertical Line */}
                    {index < timelineSteps.length - 1 && (
                      <div 
                        className={`absolute left-3 top-7 w-0.5 h-full ${
                          isCompleted ? "bg-primary" : "bg-border"
                        }`}
                      />
                    )}
                    
                    {/* Circle */}
                    <div 
                      className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        isCompleted 
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
                      <p className={`font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-muted-foreground">Current Status</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

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
                  <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus}>Update Status</Button>
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
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelOrder}
                disabled={!cancellationReason.trim()}
              >
                Confirm Cancellation
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
                Are you sure you want to refund this order? This action will process a refund of ₹{order.total_amount.toFixed(2)}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRefundOrder}>
                Confirm Refund
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}