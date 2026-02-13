import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Users,
  Truck,
  AlertCircle,
  ArrowUpRight,
  Package,
  Store,
  FileCheck,
} from "lucide-react";

// Mock data for demonstration
const kpiData = [
  {
    title: "Total Orders Today",
    value: "1,247",
    change: "+12.5%",
    trend: "up",
    icon: ShoppingCart,
  },
  {
    title: "Active Orders",
    value: "89",
    change: "+8.2%",
    trend: "up",
    icon: Package,
  },
  {
    title: "Total Revenue",
    value: "₹2,45,890",
    change: "+18.7%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Pending Payouts",
    value: "₹45,200",
    change: "-5.3%",
    trend: "down",
    icon: DollarSign,
  },
  {
    title: "Online Delivery Partners",
    value: "156",
    change: "+3.1%",
    trend: "up",
    icon: Truck,
  },
  {
    title: "Active Vendors",
    value: "342",
    change: "+6.8%",
    trend: "up",
    icon: Store,
  },
];

const recentOrders = [
  {
    id: "ORD-2024-1247",
    customer: "Amit Sharma",
    vendorCount: 2,
    deliveryPartner: "Rajesh Kumar",
    status: "in-progress",
    amount: "₹1,245",
  },
  {
    id: "ORD-2024-1246",
    customer: "Priya Patel",
    vendorCount: 1,
    deliveryPartner: "Suresh Singh",
    status: "pending",
    amount: "₹890",
  },
  {
    id: "ORD-2024-1245",
    customer: "Vikram Reddy",
    vendorCount: 3,
    deliveryPartner: "Mohammed Ali",
    status: "delivered",
    amount: "₹2,340",
  },
  {
    id: "ORD-2024-1244",
    customer: "Sneha Gupta",
    vendorCount: 1,
    deliveryPartner: "Anil Kumar",
    status: "in-progress",
    amount: "₹675",
  },
  {
    id: "ORD-2024-1243",
    customer: "Ravi Mehta",
    vendorCount: 2,
    deliveryPartner: "Deepak Yadav",
    status: "cancelled",
    amount: "₹1,120",
  },
];

const verificationAlerts = [
  {
    title: "Pending Vendor KYC",
    count: 8,
    description: "New vendors awaiting document verification",
    icon: Store,
    color: "text-chart-1",
  },
  {
    title: "Delivery Partner KYC",
    count: 12,
    description: "Partners pending background verification",
    icon: Truck,
    color: "text-chart-2",
  },
  {
    title: "Withdrawal Requests",
    count: 5,
    description: "Payout requests awaiting approval",
    icon: DollarSign,
    color: "text-chart-3",
  },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    pending: { variant: "secondary", label: "Pending" },
    "in-progress": { variant: "default", label: "In Progress" },
    delivered: { variant: "outline", label: "Delivered" },
    cancelled: { variant: "destructive", label: "Cancelled" },
  };

  const config = variants[status] || variants.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground mt-1">
          Monitor your platform's key metrics and performance
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-foreground">
                  {kpi.value}
                </div>
                <div
                  className={`flex items-center text-xs font-medium ${
                    kpi.trend === "up" ? "text-chart-1" : "text-destructive"
                  }`}
                >
                  {kpi.trend === "up" ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {kpi.change}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                vs last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Orders Over Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Over Time</CardTitle>
            <CardDescription>Daily order volume for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <div className="flex h-full items-end justify-between gap-2 pb-4">
              {[
                { day: "Mon", value: 85 },
                { day: "Tue", value: 92 },
                { day: "Wed", value: 78 },
                { day: "Thu", value: 95 },
                { day: "Fri", value: 88 },
                { day: "Sat", value: 120 },
                { day: "Sun", value: 110 },
              ].map((item, index) => (
                <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-primary transition-all hover:opacity-80"
                    style={{ height: `${item.value}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{item.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Distribution across segments</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <div className="flex h-full flex-col justify-center gap-6">
              {[
                { label: "Vendor Revenue", value: 65, color: "bg-chart-1" },
                { label: "Delivery Fees", value: 25, color: "bg-chart-2" },
                { label: "Platform Fees", value: 10, color: "bg-chart-3" },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">{item.value}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Alerts */}
      <div className="grid gap-4 md:grid-cols-3">
        {verificationAlerts.map((alert) => (
          <Card key={alert.title} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-12 -mt-12" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{alert.title}</CardTitle>
              <alert.icon className={`h-5 w-5 ${alert.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-foreground">
                  {alert.count}
                </div>
                <span className="text-xs text-muted-foreground">pending</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 mb-4">
                {alert.description}
              </p>
              <Button size="sm" className="w-full" variant="outline">
                <FileCheck className="mr-2 h-4 w-4" />
                Review Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders across all vendors</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vendors</TableHead>
                <TableHead>Delivery Partner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{order.vendorCount} vendors</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.deliveryPartner}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {order.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions Footer */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto flex-col items-start p-4 gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Customer Support</span>
          </div>
          <span className="text-sm font-semibold text-foreground">24 Open Tickets</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col items-start p-4 gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">System Alerts</span>
          </div>
          <span className="text-sm font-semibold text-foreground">2 Critical Issues</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col items-start p-4 gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span className="text-xs font-medium">Inventory Alerts</span>
          </div>
          <span className="text-sm font-semibold text-foreground">15 Low Stock Items</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col items-start p-4 gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Store className="h-4 w-4" />
            <span className="text-xs font-medium">Vendor Requests</span>
          </div>
          <span className="text-sm font-semibold text-foreground">6 New Applications</span>
        </Button>
      </div>
    </div>
  );
}