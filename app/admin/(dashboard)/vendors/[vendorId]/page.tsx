"use client";

import { useState } from "react";
import {
  ChevronLeft,
  FileText,
  Ban,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  TrendingUp,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

// Mock vendor data
const mockVendor = {
  id: "VEN-001",
  name: "Rajesh Kumar",
  email: "rajesh@freshmart.com",
  phone: "+91 98765 43210",
  business_name: "Fresh Mart",
  status: "active",
  kyc_status: "approved",
  created_at: "2024-01-15T10:30:00Z",
  address: "123 Market Street, MG Road",
  city: "Bangalore",
  state: "Karnataka",
  pincode: "560001",
  gst_number: "29ABCDE1234F1Z5",
  pan_number: "ABCDE1234F",
  bank_account: "****1234",
  rating: 4.5,
  total_orders: 1250,
};

// Mock orders
const mockOrders = [
  {
    id: "ORD-001",
    order_number: "ORD-2024-001",
    customer: "John Doe",
    status: "delivered",
    total_amount: 450.50,
    created_at: "2024-02-10T10:30:00Z",
  },
  {
    id: "ORD-002",
    order_number: "ORD-2024-002",
    customer: "Jane Smith",
    status: "processing",
    total_amount: 320.00,
    created_at: "2024-02-11T09:15:00Z",
  },
  {
    id: "ORD-003",
    order_number: "ORD-2024-003",
    customer: "Bob Johnson",
    status: "delivered",
    total_amount: 680.75,
    created_at: "2024-02-09T14:20:00Z",
  },
];

// Mock payouts
const mockPayouts = [
  {
    id: "PAY-001",
    amount: 15420.50,
    date: "2024-02-01",
    status: "completed",
    orders_count: 45,
  },
  {
    id: "PAY-002",
    amount: 12350.00,
    date: "2024-01-01",
    status: "completed",
    orders_count: 38,
  },
  {
    id: "PAY-003",
    amount: 18920.75,
    date: "2023-12-01",
    status: "completed",
    orders_count: 52,
  },
];

// Mock KYC documents
const mockKycDocuments = [
  { name: "PAN Card", status: "approved", required: true },
  { name: "Aadhaar", status: "approved", required: true },
  { name: "GST Certificate", status: "approved", required: true },
  { name: "Bank Passbook", status: "approved", required: true },
  { name: "Business License", status: "pending", required: false },
];

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function VendorProfilePage({ params }: { params: { vendorId: string } }) {
  const [vendor, setVendor] = useState(mockVendor);
  const [orders, setOrders] = useState(mockOrders);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");

  const toggleVendorStatus = () => {
    if (vendor.status === "active") {
      setShowSuspendDialog(true);
    } else {
      setVendor({ ...vendor, status: "active" });
    }
  };

  const confirmSuspension = () => {
    setVendor({ ...vendor, status: "suspended" });
    setShowSuspendDialog(false);
    setSuspensionReason("");
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
    const matchesSearch = order.order_number.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customer.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background ">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Back button */}
        <Link href="/admin/vendors">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </Link>

        {/* Header Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col  sm:flex-row items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-2xl">{getInitials(vendor.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">{vendor.name}</h1>
                  <p className="text-lg text-muted-foreground">{vendor.business_name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={statusColors[vendor.status]}>{vendor.status}</Badge>
                    <Badge className={statusColors[vendor.kyc_status]}>{vendor.kyc_status}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-10 sm:mt-0">
                <Link href={`/admin/vendors/${vendor.id}/kyc`}>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Review KYC
                  </Button>
                </Link>
                <Button
                  variant={vendor.status === "active" ? "destructive" : "default"}
                  onClick={toggleVendorStatus}
                >
                  {vendor.status === "active" ? (
                    <>
                      <Ban className="mr-2 h-4 w-4" />
                      Suspend Vendor
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Activate Vendor
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6 flex-col ">
          <TabsList variant="default" className="grid w-full grid-cols-4">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Overview
            </TabsTrigger>

            <TabsTrigger
              value="orders"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Orders
            </TabsTrigger>

            <TabsTrigger
              value="earnings"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Earnings
            </TabsTrigger>

            <TabsTrigger
              value="kyc"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              KYC Summary
            </TabsTrigger>

          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{vendor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{vendor.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{vendor.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.city}, {vendor.state} - {vendor.pincode}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">GST Number</p>
                    <p className="font-mono font-medium">{vendor.gst_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PAN Number</p>
                    <p className="font-mono font-medium">{vendor.pan_number}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Account</p>
                      <p className="font-mono font-medium">{vendor.bank_account}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Date</p>
                      <p className="font-medium">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-3xl font-bold">{vendor.total_orders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="text-3xl font-bold">{vendor.rating} ⭐</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={`mt-2 ${statusColors[vendor.status]}`}>
                      {vendor.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Search</label>
                    <Input
                      placeholder="Order ID or Customer"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status]}>{order.status}</Badge>
                        </TableCell>
                        <TableCell>₹{order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Total Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">₹46,691.25</p>
                  <p className="text-sm text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">₹15,420.50</p>
                  <p className="text-sm text-green-600">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Orders This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">45</p>
                  <p className="text-sm text-muted-foreground">Completed orders</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Payouts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payout ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">{payout.id}</TableCell>
                        <TableCell className="font-semibold">₹{payout.amount.toFixed(2)}</TableCell>
                        <TableCell>{payout.orders_count}</TableCell>
                        <TableCell>{new Date(payout.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[payout.status]}>{payout.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Summary Tab */}
          <TabsContent value="kyc" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>KYC Documents Status</CardTitle>
                  <Link href={`/admin/vendors/${vendor.id}/kyc`}>
                    <Button>
                      <FileText className="mr-2 h-4 w-4" />
                      Full KYC Review
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockKycDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          {doc.required && (
                            <Badge variant="outline" className="mt-1">Required</Badge>
                          )}
                        </div>
                      </div>
                      <Badge className={statusColors[doc.status]}>{doc.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Suspend Dialog */}
        <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend Vendor</DialogTitle>
              <DialogDescription>
                Please provide a reason for suspending this vendor.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Enter suspension reason..."
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
                disabled={!suspensionReason.trim()}
              >
                Suspend Vendor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}