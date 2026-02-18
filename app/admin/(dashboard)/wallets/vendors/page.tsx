"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Eye, CheckCircle2, AlertCircle, Clock, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAdminVendorWallets, useAdminVendorWalletsSummary } from "@/hooks/wallet/useWallet";

export default function VendorWalletListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bankStatusFilter, setBankStatusFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");

  const { data: vendors, isLoading, error } = useAdminVendorWallets();
  const { data: summary } = useAdminVendorWalletsSummary();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount);

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000 / 60);
    if (diff < 60) return `${diff} mins ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  const getBankStatusBadge = (status: string) => {
    switch (status) {
      case "Verified":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>;
      case "Pending":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "Rejected":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Added</Badge>;
    }
  };

  const filtered = (vendors ?? []).filter((v) => {
    const matchSearch =
      !searchTerm ||
      v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.walletId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchBank = bankStatusFilter === "all" || v.bankStatus === bankStatusFilter;

    const matchBalance =
      balanceFilter === "all" ||
      (balanceFilter === "high-pending" && v.pendingBalance > 10000) ||
      (balanceFilter === "recently-updated" &&
        v.lastUpdated &&
        new Date(v.lastUpdated) > new Date(Date.now() - 60 * 60 * 1000));

    return matchSearch && matchBank && matchBalance;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/wallets">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Vendor Wallets
            </h1>
            <p className="text-slate-600 mt-2">Manage vendor earnings and payouts</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Vendors", value: summary?.totalVendors ?? "—", gradient: "from-blue-500 to-blue-600", textColor: "text-blue-50" },
            { label: "Verified Banks", value: summary?.verifiedBanks ?? "—", gradient: "from-emerald-500 to-emerald-600", textColor: "text-emerald-50" },
            { label: "Pending Verification", value: summary?.pendingVerification ?? "—", gradient: "from-amber-500 to-amber-600", textColor: "text-amber-50" },
            { label: "High Pending Balance", value: summary?.highPendingBalance ?? "—", gradient: "from-purple-500 to-purple-600", textColor: "text-purple-50" },
          ].map(({ label, value, gradient, textColor }) => (
            <Card key={label} className={`bg-gradient-to-br ${gradient} text-white border-0`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-sm font-medium ${textColor}`}>{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
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
                  <SelectItem value="Not Added">Not Added</SelectItem>
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

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">Failed to load vendor wallets.</div>
            ) : (
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
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-slate-500 py-8">No vendors found</TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((vendor) => (
                        <TableRow key={vendor.walletId}>
                          <TableCell className="font-medium">
                            {vendor.vendorName}
                            <div className="text-xs text-slate-500">{vendor.email}</div>
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-600">
                            {formatCurrency(vendor.availableBalance)}
                          </TableCell>
                          <TableCell className="text-amber-600">
                            {formatCurrency(vendor.pendingBalance)}
                            {vendor.pendingBalance > 10000 && (
                              <Badge variant="outline" className="ml-2 text-xs">High</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(vendor.lifetimeEarnings)}</TableCell>
                          <TableCell className="text-slate-600">{formatCurrency(vendor.totalWithdrawn)}</TableCell>
                          <TableCell>{getBankStatusBadge(vendor.bankStatus)}</TableCell>
                          <TableCell className="text-slate-500 text-sm">{formatRelativeTime(vendor.lastUpdated)}</TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/wallets/vendors/${vendor.vendorUserId}`}>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Eye className="w-4 h-4" /> View Wallet
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}