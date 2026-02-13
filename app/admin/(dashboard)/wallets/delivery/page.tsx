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
import { Search, Eye, CheckCircle2, AlertCircle, Clock, ArrowLeft, Star, Bike } from "lucide-react";
import Link from "next/link";

// Mock Data
const mockDeliveryWallets = [
  {
    id: "D001",
    partnerName: "Rajesh Kumar",
    availableBalance: 8920.00,
    pendingBalance: 1250.00,
    lifetimeEarnings: 89234.50,
    totalDeliveries: 1234,
    rating: 4.8,
    bankStatus: "Verified",
    isOnline: true,
    lastUpdated: "2024-02-13T12:30:00",
  },
  {
    id: "D002",
    partnerName: "Priya Sharma",
    availableBalance: 12450.00,
    pendingBalance: 890.50,
    lifetimeEarnings: 67890.30,
    totalDeliveries: 892,
    rating: 4.9,
    bankStatus: "Verified",
    isOnline: true,
    lastUpdated: "2024-02-13T12:15:00",
  },
  {
    id: "D003",
    partnerName: "Amit Patel",
    availableBalance: 5670.50,
    pendingBalance: 650.00,
    lifetimeEarnings: 45670.80,
    totalDeliveries: 567,
    rating: 4.6,
    bankStatus: "Pending",
    isOnline: false,
    lastUpdated: "2024-02-13T11:45:00",
  },
  {
    id: "D004",
    partnerName: "Sneha Reddy",
    availableBalance: 15230.75,
    pendingBalance: 2340.00,
    lifetimeEarnings: 123456.90,
    totalDeliveries: 1567,
    rating: 4.9,
    bankStatus: "Verified",
    isOnline: true,
    lastUpdated: "2024-02-13T12:28:00",
  },
  {
    id: "D005",
    partnerName: "Vikram Singh",
    availableBalance: 6780.25,
    pendingBalance: 450.75,
    lifetimeEarnings: 78901.40,
    totalDeliveries: 923,
    rating: 4.7,
    bankStatus: "Verified",
    isOnline: false,
    lastUpdated: "2024-02-13T10:20:00",
  },
  {
    id: "D006",
    partnerName: "Anjali Gupta",
    availableBalance: 9340.00,
    pendingBalance: 1120.00,
    lifetimeEarnings: 56789.20,
    totalDeliveries: 678,
    rating: 4.8,
    bankStatus: "Rejected",
    isOnline: false,
    lastUpdated: "2024-02-12T18:00:00",
  },
];

export default function DeliveryWalletListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bankStatusFilter, setBankStatusFilter] = useState("all");

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

  const filterPartners = (partners) => {
    let filtered = partners;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Online/Offline filter
    if (statusFilter === "online") {
      filtered = filtered.filter((p) => p.isOnline);
    } else if (statusFilter === "offline") {
      filtered = filtered.filter((p) => !p.isOnline);
    }

    // Bank status filter
    if (bankStatusFilter !== "all") {
      filtered = filtered.filter((p) => p.bankStatus === bankStatusFilter);
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

  const filteredPartners = filterPartners(mockDeliveryWallets);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/wallets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
              Delivery Partner Wallets
            </h1>
            <p className="text-slate-600 mt-2">
              Manage delivery partner earnings - No pending period
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-50 flex items-center gap-2">
                <Bike className="w-4 h-4" />
                Total Partners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockDeliveryWallets.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-50">
                Online Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {mockDeliveryWallets.filter((p) => p.isOnline).length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-50">
                Verified Banks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {mockDeliveryWallets.filter((p) => p.bankStatus === "Verified").length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-50">
                Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                {(
                  mockDeliveryWallets.reduce((sum, p) => sum + p.rating, 0) /
                  mockDeliveryWallets.length
                ).toFixed(1)}
                <Star className="w-6 h-6 fill-yellow-300 text-yellow-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Delivery Partner Payout Flow</h3>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Step 1:</strong> Earnings move to Available Balance after delivery completion →
                  <strong>Step 2:</strong> Partner requests cashout (moves to Pending) →
                  <strong>Step 3:</strong> Admin confirms the request →
                  <strong>Step 4:</strong> Amount transferred to verified bank account
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by partner name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
              <Select value={bankStatusFilter} onValueChange={setBankStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Bank Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Banks</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Partners Table */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Available Balance</TableHead>
                    <TableHead>Pending Cashout</TableHead>
                    <TableHead>Lifetime Earnings</TableHead>
                    <TableHead>Total Deliveries</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Bank Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-slate-500 py-8">
                        No delivery partners found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPartners.map((partner) => (
                      <TableRow key={partner.id}>
                        <TableCell className="font-medium">
                          {partner.partnerName}
                          <div className="text-xs text-slate-500">{partner.id}</div>
                        </TableCell>
                        <TableCell>
                          {partner.isOnline ? (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Offline</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-600">
                          {formatCurrency(partner.availableBalance)}
                        </TableCell>
                        <TableCell className="text-amber-600">
                          {formatCurrency(partner.pendingBalance)}
                          {partner.pendingBalance > 1000 && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Awaiting Admin
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(partner.lifetimeEarnings)}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {partner.totalDeliveries.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{partner.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getBankStatusBadge(partner.bankStatus)}</TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {formatDate(partner.lastUpdated)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/wallets/delivery/${partner.id}`}>
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