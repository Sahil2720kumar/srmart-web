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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ArrowUpDown, Eye, Wallet, TrendingUp, DollarSign, Clock } from "lucide-react";
import Link from "next/link";

// Mock Data
const mockWallets = [
  {
    id: "V001",
    userName: "Spice Garden Restaurant",
    userType: "Vendor",
    availableBalance: 45820.50,
    pendingBalance: 12340.00,
    lifetimeEarnings: 234567.80,
    totalWithdrawn: 176407.30,
    lastUpdated: "2 hours ago",
  },
  {
    id: "D001",
    userName: "Rajesh Kumar",
    userType: "Delivery",
    availableBalance: 8920.00,
    pendingBalance: 1250.00,
    lifetimeEarnings: 89234.50,
    totalWithdrawn: 80314.50,
    lastUpdated: "30 mins ago",
  },
  {
    id: "V002",
    userName: "Cafe Aroma",
    userType: "Vendor",
    availableBalance: 32100.75,
    pendingBalance: 8900.25,
    lifetimeEarnings: 156789.00,
    totalWithdrawn: 115788.00,
    lastUpdated: "1 hour ago",
  },
  {
    id: "D002",
    userName: "Priya Sharma",
    userType: "Delivery",
    availableBalance: 12450.00,
    pendingBalance: 890.50,
    lifetimeEarnings: 67890.30,
    totalWithdrawn: 55440.30,
    lastUpdated: "15 mins ago",
  },
  {
    id: "V003",
    userName: "Pizza Paradise",
    userType: "Vendor",
    availableBalance: 28900.00,
    pendingBalance: 15670.00,
    lifetimeEarnings: 345678.90,
    totalWithdrawn: 301108.90,
    lastUpdated: "3 hours ago",
  },
  {
    id: "D003",
    userName: "Amit Patel",
    userType: "Delivery",
    availableBalance: 5670.50,
    pendingBalance: 650.00,
    lifetimeEarnings: 45670.80,
    totalWithdrawn: 40000.30,
    lastUpdated: "45 mins ago",
  },
];

const kpiData = {
  totalAvailable: 133861.75,
  totalPending: 39700.75,
  totalLifetime: 939831.30,
  totalWithdrawn: 769059.30,
  pendingCashouts: 8,
};

export default function AdminWalletsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [sortField, setSortField] = useState("availableBalance");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activeTab, setActiveTab] = useState("all");

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const filterWallets = (wallets) => {
    let filtered = wallets;

    // Tab filter
    if (activeTab === "vendors") {
      filtered = filtered.filter((w) => w.userType === "Vendor");
    } else if (activeTab === "delivery") {
      filtered = filtered.filter((w) => w.userType === "Delivery");
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (w) =>
          w.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // User type filter
    if (userTypeFilter !== "all") {
      filtered = filtered.filter((w) => w.userType === userTypeFilter);
    }

    return filtered;
  };

  const sortWallets = (wallets) => {
    return [...wallets].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
      
      return sortOrder === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const filteredAndSortedWallets = sortWallets(filterWallets(mockWallets));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Wallet Management
            </h1>
            <p className="text-slate-600 mt-2">
              Manage and monitor all wallet transactions
            </p>
          </div>
          <Link href="/admin/wallets/transactions">
            <Button variant="outline" className="gap-2">
              <DollarSign className="w-4 h-4" />
              View All Transactions
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-50 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(kpiData.totalAvailable)}
              </div>
              <p className="text-emerald-100 text-xs mt-2">Ready for payout</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-50 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(kpiData.totalPending)}
              </div>
              <p className="text-amber-100 text-xs mt-2">Vendor T+3 + Delivery Cashouts</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Lifetime Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(kpiData.totalLifetime)}
              </div>
              <p className="text-blue-100 text-xs mt-2">All-time total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-50 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Withdrawn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(kpiData.totalWithdrawn)}
              </div>
              <p className="text-purple-100 text-xs mt-2">Successful payouts</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-rose-50 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Cashouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpiData.pendingCashouts}</div>
              <p className="text-rose-100 text-xs mt-2">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Vendor">Vendors</SelectItem>
                  <SelectItem value="Delivery">Delivery Partners</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs and Table */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-col">
            <CardHeader>
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="all">All Wallets</TabsTrigger>
                <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="vendors">Vendor Wallets</TabsTrigger>
                <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="delivery">Delivery Wallets</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value={activeTab} className="mt-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Name</TableHead>
                        <TableHead>User Type</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => handleSort("availableBalance")}
                        >
                          <div className="flex items-center gap-1">
                            Available Balance
                            <ArrowUpDown className="w-4 h-4" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => handleSort("pendingBalance")}
                        >
                          <div className="flex items-center gap-1">
                            Pending Balance
                            <ArrowUpDown className="w-4 h-4" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => handleSort("lifetimeEarnings")}
                        >
                          <div className="flex items-center gap-1">
                            Lifetime Earnings
                            <ArrowUpDown className="w-4 h-4" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => handleSort("totalWithdrawn")}
                        >
                          <div className="flex items-center gap-1">
                            Total Withdrawn
                            <ArrowUpDown className="w-4 h-4" />
                          </div>
                        </TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedWallets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                            No wallets found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedWallets.map((wallet) => (
                          <TableRow key={wallet.id}>
                            <TableCell className="font-medium">
                              {wallet.userName}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  wallet.userType === "Vendor"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {wallet.userType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-emerald-600">
                              {formatCurrency(wallet.availableBalance)}
                            </TableCell>
                            <TableCell className="text-amber-600">
                              {formatCurrency(wallet.pendingBalance)}
                              {wallet.userType === "Vendor" && wallet.pendingBalance > 0 && (
                                <div className="text-xs text-amber-500 mt-1">T+3 Processing</div>
                              )}
                              {wallet.userType === "Delivery" && wallet.pendingBalance > 0 && (
                                <div className="text-xs text-amber-500 mt-1">Awaiting Admin</div>
                              )}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(wallet.lifetimeEarnings)}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {formatCurrency(wallet.totalWithdrawn)}
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">
                              {wallet.lastUpdated}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link
                                href={`/admin/wallets/${
                                  wallet.userType === "Vendor"
                                    ? "vendors"
                                    : "delivery"
                                }/${wallet.id}`}
                              >
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
                  </Table>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}