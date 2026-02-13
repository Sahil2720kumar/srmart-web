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
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ArrowLeft, Eye, TrendingUp, DollarSign, Wallet } from "lucide-react";
import Link from "next/link";

// Mock Data
const mockVendorEarnings = [
  {
    vendorId: "V001",
    vendorName: "Organic Farms Ltd",
    totalOrders: 456,
    grossSales: 567890.00,
    commissionRate: 12,
    commissionAmount: 68146.80,
    vendorPayout: 499743.20,
    walletBalance: 45820.50,
  },
  {
    vendorId: "V002",
    vendorName: "Dairy Fresh",
    totalOrders: 389,
    grossSales: 345678.00,
    commissionRate: 8,
    commissionAmount: 27654.24,
    vendorPayout: 318023.76,
    walletBalance: 32100.75,
  },
  {
    vendorId: "V003",
    vendorName: "Baker's Delight",
    totalOrders: 567,
    grossSales: 234567.00,
    commissionRate: 10,
    commissionAmount: 23456.70,
    vendorPayout: 211110.30,
    walletBalance: 18450.25,
  },
  {
    vendorId: "V004",
    vendorName: "Green Grocers",
    totalOrders: 234,
    grossSales: 456789.00,
    commissionRate: 15,
    commissionAmount: 68518.35,
    vendorPayout: 388270.65,
    walletBalance: 28900.00,
  },
  {
    vendorId: "V005",
    vendorName: "Fresh Harvest Co",
    totalOrders: 678,
    grossSales: 789012.00,
    commissionRate: 12,
    commissionAmount: 94681.44,
    vendorPayout: 694330.56,
    walletBalance: 52300.00,
  },
];

export default function VendorEarningsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const filterVendors = (vendors) => {
    if (!searchTerm) return vendors;
    return vendors.filter((v) =>
      v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vendorId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredVendors = filterVendors(mockVendorEarnings);

  // Calculate totals
  const totals = mockVendorEarnings.reduce(
    (acc, vendor) => ({
      totalOrders: acc.totalOrders + vendor.totalOrders,
      grossSales: acc.grossSales + vendor.grossSales,
      commissionAmount: acc.commissionAmount + vendor.commissionAmount,
      vendorPayout: acc.vendorPayout + vendor.vendorPayout,
      walletBalance: acc.walletBalance + vendor.walletBalance,
    }),
    {
      totalOrders: 0,
      grossSales: 0,
      commissionAmount: 0,
      vendorPayout: 0,
      walletBalance: 0,
    }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/earnings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
              Vendor Earnings & Commission
            </h1>
            <p className="text-slate-600 mt-2">
              Track vendor payouts and commission revenue
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Total Vendor Revenue
                  </div>
                  <div className="text-3xl font-bold mt-2">
                    {formatCurrency(totals.grossSales)}
                  </div>
                  <div className="text-xs text-blue-100 mt-2">
                    From {totals.totalOrders.toLocaleString()} orders
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-emerald-100 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Platform Commission Earned
                  </div>
                  <div className="text-3xl font-bold mt-2">
                    {formatCurrency(totals.commissionAmount)}
                  </div>
                  <div className="text-xs text-emerald-100 mt-2">
                    Average 11.2% commission
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-amber-100 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Pending Vendor Payouts
                  </div>
                  <div className="text-3xl font-bold mt-2">
                    {formatCurrency(totals.walletBalance)}
                  </div>
                  <div className="text-xs text-amber-100 mt-2">
                    In vendor wallets
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search vendor by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vendor Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead className="text-right">Total Orders</TableHead>
                    <TableHead className="text-right">Gross Sales</TableHead>
                    <TableHead className="text-center">Commission Rate</TableHead>
                    <TableHead className="text-right">Commission Amount</TableHead>
                    <TableHead className="text-right">Vendor Payout</TableHead>
                    <TableHead className="text-right">Wallet Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                        No vendors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <TableRow key={vendor.vendorId}>
                        <TableCell>
                          <div className="font-medium">{vendor.vendorName}</div>
                          <div className="text-xs text-slate-500">{vendor.vendorId}</div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {vendor.totalOrders.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(vendor.grossSales)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-semibold">
                            {vendor.commissionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          {formatCurrency(vendor.commissionAmount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          {formatCurrency(vendor.vendorPayout)}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          {formatCurrency(vendor.walletBalance)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Link href={`/admin/vendors/${vendor.vendorId}`}>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/admin/wallets/vendors/${vendor.vendorId}`}>
                              <Button variant="outline" size="sm">
                                Payouts
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Commission Breakdown */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4">Commission Breakdown</h3>
            <div className="space-y-3">
              {filteredVendors.map((vendor) => {
                const percentage = (vendor.commissionAmount / totals.commissionAmount) * 100;
                return (
                  <div key={vendor.vendorId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{vendor.vendorName}</span>
                      <span className="text-emerald-600 font-semibold">
                        {formatCurrency(vendor.commissionAmount)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}