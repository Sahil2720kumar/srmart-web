"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

// Mock Data
const mockOrderEarnings = [
  {
    orderId: "ORD12345",
    customer: "John Doe",
    vendor: "Organic Farms Ltd",
    vendorId: "V001",
    orderTotal: 1250.00,
    vendorCommission: 150.00,
    deliveryFee: 40.00,
    platformFee: 190.00,
    netEarning: 190.00,
    paymentStatus: "Paid",
    orderStatus: "Delivered",
    paymentMethod: "UPI",
    date: "2024-02-13",
  },
  {
    orderId: "ORD12346",
    customer: "Jane Smith",
    vendor: "Dairy Fresh",
    vendorId: "V002",
    orderTotal: 890.00,
    vendorCommission: 71.20,
    deliveryFee: 35.00,
    platformFee: 106.20,
    netEarning: 106.20,
    paymentStatus: "Paid",
    orderStatus: "Delivered",
    paymentMethod: "Card",
    date: "2024-02-13",
  },
  {
    orderId: "ORD12347",
    customer: "Mike Johnson",
    vendor: "Baker's Delight",
    vendorId: "V003",
    orderTotal: 450.00,
    vendorCommission: 45.00,
    deliveryFee: 30.00,
    platformFee: 75.00,
    netEarning: 75.00,
    paymentStatus: "Paid",
    orderStatus: "Delivered",
    paymentMethod: "COD",
    date: "2024-02-13",
  },
  {
    orderId: "ORD12348",
    customer: "Sarah Wilson",
    vendor: "Organic Farms Ltd",
    vendorId: "V001",
    orderTotal: 2100.00,
    vendorCommission: 252.00,
    deliveryFee: 50.00,
    platformFee: 302.00,
    netEarning: 302.00,
    paymentStatus: "Paid",
    orderStatus: "Delivered",
    paymentMethod: "UPI",
    date: "2024-02-12",
  },
  {
    orderId: "ORD12349",
    customer: "Robert Brown",
    vendor: "Green Grocers",
    vendorId: "V004",
    orderTotal: 680.00,
    vendorCommission: 68.00,
    deliveryFee: 35.00,
    platformFee: 103.00,
    netEarning: 103.00,
    paymentStatus: "Pending",
    orderStatus: "Processing",
    paymentMethod: "Card",
    date: "2024-02-12",
  },
  {
    orderId: "ORD12350",
    customer: "Emily Davis",
    vendor: "Fresh Harvest Co",
    vendorId: "V005",
    orderTotal: 1450.00,
    vendorCommission: 174.00,
    deliveryFee: 45.00,
    platformFee: 219.00,
    netEarning: 219.00,
    paymentStatus: "Paid",
    orderStatus: "Delivered",
    paymentMethod: "UPI",
    date: "2024-02-12",
  },
];

export default function OrderEarningsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const variants = {
      Delivered: "bg-emerald-100 text-emerald-700",
      Processing: "bg-blue-100 text-blue-700",
      Cancelled: "bg-red-100 text-red-700",
    };
    return (
      <Badge className={variants[status] || "bg-slate-100 text-slate-700"}>
        {status}
      </Badge>
    );
  };

  const getPaymentBadge = (status) => {
    return status === "Paid" ? (
      <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>
    ) : (
      <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
    );
  };

  const filterOrders = (orders) => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (o) =>
          o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.customer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.orderStatus === statusFilter);
    }

    if (vendorFilter !== "all") {
      filtered = filtered.filter((o) => o.vendorId === vendorFilter);
    }

    if (paymentFilter !== "all") {
      filtered = filtered.filter((o) => o.paymentMethod === paymentFilter);
    }

    return filtered;
  };

  const filteredOrders = filterOrders(mockOrderEarnings);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate totals
  const totals = filteredOrders.reduce(
    (acc, order) => ({
      orderTotal: acc.orderTotal + order.orderTotal,
      vendorCommission: acc.vendorCommission + order.vendorCommission,
      deliveryFee: acc.deliveryFee + order.deliveryFee,
      platformFee: acc.platformFee + order.platformFee,
      netEarning: acc.netEarning + order.netEarning,
    }),
    {
      orderTotal: 0,
      vendorCommission: 0,
      deliveryFee: 0,
      platformFee: 0,
      netEarning: 0,
    }
  );

  const vendors = [...new Set(mockOrderEarnings.map((o) => ({ id: o.vendorId, name: o.vendor })))];

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
            <p className="text-slate-600 mt-2">
              Detailed financial breakdown per order
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="text-sm text-blue-100">Total Orders</div>
              <div className="text-3xl font-bold mt-1">{filteredOrders.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="text-sm text-emerald-100">Order Value</div>
              <div className="text-3xl font-bold mt-1">
                {formatCurrency(totals.orderTotal)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="text-sm text-amber-100">Commission Earned</div>
              <div className="text-3xl font-bold mt-1">
                {formatCurrency(totals.vendorCommission)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="text-sm text-purple-100">Net Earnings</div>
              <div className="text-3xl font-bold mt-1">
                {formatCurrency(totals.netEarning)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search order or customer..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Order Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={vendorFilter}
                onValueChange={(value) => {
                  setVendorFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={paymentFilter}
                onValueChange={(value) => {
                  setPaymentFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="COD">COD</SelectItem>
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
                  {paginatedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-slate-500 py-8">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedOrders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell className="font-medium">
                          {order.orderId}
                        </TableCell>
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
                          {getPaymentBadge(order.paymentStatus)}
                          <div className="text-xs text-slate-500 mt-1">
                            {order.paymentMethod}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/orders/${order.orderId}`}>
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
                <TableFooter>
                  <TableRow className="bg-slate-50 font-bold">
                    <TableCell colSpan={3}>TOTALS</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totals.orderTotal)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {formatCurrency(totals.vendorCommission)}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(totals.deliveryFee)}
                    </TableCell>
                    <TableCell className="text-right text-amber-600">
                      {formatCurrency(totals.platformFee)}
                    </TableCell>
                    <TableCell className="text-right text-purple-600">
                      {formatCurrency(totals.netEarning)}
                    </TableCell>
                    <TableCell colSpan={3}></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{" "}
                  {filteredOrders.length} orders
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
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