"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Truck,
  Package,
  Tag,
} from "lucide-react";
import Link from "next/link";

// Mock Data
const mockEarningsData = {
  grossOrderValue: 2456789.50,
  platformCommission: 294815.40,
  deliveryFeesCollected: 45230.00,
  netPlatformEarnings: 298125.40,
  totalOrders: 3456,
  cancelledOrders: 145,
  refundedOrders: 67,
  couponsApplied: 789,
  totalDiscounts: 123456.00,
  netProfit: 256890.40,
};

const dailyEarningsData = [
  { date: "Feb 7", earnings: 35600 },
  { date: "Feb 8", earnings: 42300 },
  { date: "Feb 9", earnings: 38900 },
  { date: "Feb 10", earnings: 45200 },
  { date: "Feb 11", earnings: 41800 },
  { date: "Feb 12", earnings: 48600 },
  { date: "Feb 13", earnings: 46700 },
];

const stackedBreakdownData = [
  { label: "Mon", vendorPayout: 85000, commission: 12000, deliveryFee: 3500 },
  { label: "Tue", vendorPayout: 92000, commission: 13500, deliveryFee: 4200 },
  { label: "Wed", vendorPayout: 78000, commission: 11200, deliveryFee: 3100 },
  { label: "Thu", vendorPayout: 95000, commission: 14800, deliveryFee: 4800 },
  { label: "Fri", vendorPayout: 88000, commission: 12800, deliveryFee: 3900 },
  { label: "Sat", vendorPayout: 102000, commission: 16500, deliveryFee: 5600 },
  { label: "Sun", vendorPayout: 98000, commission: 15200, deliveryFee: 5100 },
];

export default function AdminEarningsPage() {
  const [dateRange, setDateRange] = useState("week");

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const handleExport = () => {
    console.log("Exporting CSV for date range:", dateRange);
    // Export logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Earnings & Revenue
            </h1>
            <p className="text-slate-600 mt-2">
              Platform financial overview and insights
            </p>
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
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-50 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Gross Order Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(mockEarningsData.grossOrderValue)}
              </div>
              <p className="text-blue-100 text-xs mt-2">
                Before deductions
              </p>
              <div className="flex items-center gap-1 mt-3">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs">+12.5% from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-50 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Platform Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(mockEarningsData.platformCommission)}
              </div>
              <p className="text-emerald-100 text-xs mt-2">
                Vendor commission earned
              </p>
              <div className="flex items-center gap-1 mt-3">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs">+8.3% from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-50 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Delivery Fees Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(mockEarningsData.deliveryFeesCollected)}
              </div>
              <p className="text-amber-100 text-xs mt-2">
                Customer + platform covered
              </p>
              <div className="flex items-center gap-1 mt-3">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs">+5.7% from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Net Platform Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(mockEarningsData.netPlatformEarnings)}
              </div>
              <p className="text-purple-100 text-xs mt-2">
                After all deductions
              </p>
              <div className="flex items-center gap-1 mt-3">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs">+14.2% from last period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/admin/earnings/orders">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Order Earnings</div>
                    <div className="text-sm text-slate-600">View breakdown</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/earnings/vendors">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-emerald-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Vendor Commission</div>
                    <div className="text-sm text-slate-600">Track payouts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/earnings/delivery">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-amber-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Truck className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Delivery Earnings</div>
                    <div className="text-sm text-slate-600">Partner payouts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/earnings/reports">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Download className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Financial Reports</div>
                    <div className="text-sm text-slate-600">Download data</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Earnings Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Earnings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {dailyEarningsData.map((day, index) => {
                  const maxEarnings = Math.max(...dailyEarningsData.map(d => d.earnings));
                  const height = (day.earnings / maxEarnings) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-colors relative group"
                           style={{ height: `${height}%` }}>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatCurrency(day.earnings)}
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 font-medium">{day.date}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stacked Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-400 rounded"></div>
                    <span>Vendor Payout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                    <span>Commission</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Delivery Fee</span>
                  </div>
                </div>
                <div className="h-52 flex items-end justify-between gap-2">
                  {stackedBreakdownData.map((day, index) => {
                    const total = day.vendorPayout + day.commission + day.deliveryFee;
                    const vendorHeight = (day.vendorPayout / total) * 100;
                    const commissionHeight = (day.commission / total) * 100;
                    const deliveryHeight = (day.deliveryFee / total) * 100;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col">
                          <div className="w-full bg-blue-500 rounded-t-lg" style={{ height: `${deliveryHeight * 2}px` }}></div>
                          <div className="w-full bg-emerald-500" style={{ height: `${commissionHeight * 2}px` }}></div>
                          <div className="w-full bg-slate-400" style={{ height: `${vendorHeight * 2}px` }}></div>
                        </div>
                        <div className="text-xs text-slate-600 font-medium">{day.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Orders</span>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {formatNumber(mockEarningsData.totalOrders)}
                </div>
                <div className="text-xs text-slate-500">
                  Successfully completed
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-medium">Cancelled/Refunded</span>
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {formatNumber(mockEarningsData.cancelledOrders + mockEarningsData.refundedOrders)}
                </div>
                <div className="text-xs text-slate-500">
                  {mockEarningsData.cancelledOrders} cancelled, {mockEarningsData.refundedOrders} refunded
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium">Coupons Applied</span>
                </div>
                <div className="text-3xl font-bold text-amber-600">
                  {formatNumber(mockEarningsData.couponsApplied)}
                </div>
                <div className="text-xs text-slate-500">
                  {formatCurrency(mockEarningsData.totalDiscounts)} discounts
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Net Profit</span>
                </div>
                <div className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(mockEarningsData.netProfit)}
                </div>
                <div className="text-xs text-slate-500">
                  After all expenses
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Earning Formula Breakdown */}
            <div className="bg-slate-50 rounded-lg p-6 space-y-3">
              <h4 className="font-semibold text-slate-900 mb-4">Earnings Calculation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Gross Order Value</span>
                  <span className="font-semibold">{formatCurrency(mockEarningsData.grossOrderValue)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>+ Platform Commission</span>
                  <span className="font-semibold">+{formatCurrency(mockEarningsData.platformCommission)}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>+ Delivery Fees Collected</span>
                  <span className="font-semibold">+{formatCurrency(mockEarningsData.deliveryFeesCollected)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>− Discounts & Coupons</span>
                  <span className="font-semibold">−{formatCurrency(mockEarningsData.totalDiscounts)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold text-purple-600">
                  <span>Net Platform Earnings</span>
                  <span>= {formatCurrency(mockEarningsData.netPlatformEarnings)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}