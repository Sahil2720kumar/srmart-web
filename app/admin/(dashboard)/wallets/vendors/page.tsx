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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Eye, CheckCircle2, AlertCircle, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Mock Data
const mockVendorWallets = [
  {
    id: "V001",
    vendorName: "Spice Garden Restaurant",
    availableBalance: 45820.50,
    pendingBalance: 12340.00,
    lifetimeEarnings: 234567.80,
    totalWithdrawn: 176407.30,
    bankStatus: "Verified",
    lastUpdated: "2024-02-13T10:30:00",
  },
  {
    id: "V002",
    vendorName: "Cafe Aroma",
    availableBalance: 32100.75,
    pendingBalance: 8900.25,
    lifetimeEarnings: 156789.00,
    totalWithdrawn: 115788.00,
    bankStatus: "Verified",
    lastUpdated: "2024-02-13T11:00:00",
  },
  {
    id: "V003",
    vendorName: "Pizza Paradise",
    availableBalance: 28900.00,
    pendingBalance: 15670.00,
    lifetimeEarnings: 345678.90,
    totalWithdrawn: 301108.90,
    bankStatus: "Pending",
    lastUpdated: "2024-02-13T09:15:00",
  },
  {
    id: "V004",
    vendorName: "Burger Hub",
    availableBalance: 18450.25,
    pendingBalance: 5670.50,
    lifetimeEarnings: 123456.75,
    totalWithdrawn: 99336.00,
    bankStatus: "Verified",
    lastUpdated: "2024-02-13T08:45:00",
  },
  {
    id: "V005",
    vendorName: "Sushi Central",
    availableBalance: 52300.00,
    pendingBalance: 18900.00,
    lifetimeEarnings: 456789.50,
    totalWithdrawn: 385589.50,
    bankStatus: "Verified",
    lastUpdated: "2024-02-13T12:00:00",
  },
  {
    id: "V006",
    vendorName: "Taco Fiesta",
    availableBalance: 12800.50,
    pendingBalance: 3450.75,
    lifetimeEarnings: 89234.25,
    totalWithdrawn: 72983.00,
    bankStatus: "Rejected",
    lastUpdated: "2024-02-12T18:30:00",
  },
];

export default function VendorWalletListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bankStatusFilter, setBankStatusFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);

    if (diff < 60) return `${diff} mins ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const filterVendors = (vendors) => {
    let filtered = vendors;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Bank status filter
    if (bankStatusFilter !== "all") {
      filtered = filtered.filter((v) => v.bankStatus === bankStatusFilter);
    }

    // Balance filter
    if (balanceFilter === "high-pending") {
      filtered = filtered.filter((v) => v.pendingBalance > 10000);
    } else if (balanceFilter === "recently-updated") {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      filtered = filtered.filter((v) => new Date(v.lastUpdated) > oneHourAgo);
    }

    return filtered;
  };

  const getBankStatusBadge = (status) => {
    switch (status) {
      case "Verified":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredVendors = filterVendors(mockVendorWallets);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/wallets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Vendor Wallets
            </h1>
            <p className="text-slate-600 mt-2">
              Manage vendor earnings and payouts
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-50">
                Total Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockVendorWallets.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-50">
                Verified Banks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {mockVendorWallets.filter((v) => v.bankStatus === "Verified").length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-50">
                Pending Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {mockVendorWallets.filter((v) => v.bankStatus === "Pending").length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-50">
                High Pending Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {mockVendorWallets.filter((v) => v.pendingBalance > 10000).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by vendor name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={bankStatusFilter} onValueChange={setBankStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Bank Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Balance Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Balances</SelectItem>
                  <SelectItem value="high-pending">High Pending (&gt;₹10K)</SelectItem>
                  <SelectItem value="recently-updated">Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vendors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Available Balance</TableHead>
                    <TableHead>Pending Balance</TableHead>
                    <TableHead>Lifetime Earnings</TableHead>
                    <TableHead>Total Withdrawn</TableHead>
                    <TableHead>Bank Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Action</TableHead>
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
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">
                          {vendor.vendorName}
                          <div className="text-xs text-slate-500">{vendor.id}</div>
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-600">
                          {formatCurrency(vendor.availableBalance)}
                        </TableCell>
                        <TableCell className="text-amber-600">
                          {formatCurrency(vendor.pendingBalance)}
                          {vendor.pendingBalance > 10000 && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              High
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(vendor.lifetimeEarnings)}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {formatCurrency(vendor.totalWithdrawn)}
                        </TableCell>
                        <TableCell>{getBankStatusBadge(vendor.bankStatus)}</TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {formatDate(vendor.lastUpdated)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/wallets/vendors/${vendor.id}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Eye className="w-4 h-4" />
                              View Wallet
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
      </div>
    </div>
  );
}