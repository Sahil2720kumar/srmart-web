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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ArrowUpDown, Eye, Wallet, TrendingUp, DollarSign, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAdminWallets, useAdminWalletKPIs } from "@/hooks/wallet/useWallet";

export default function AdminWalletsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<
    "availableBalance" | "pendingBalance" | "lifetimeEarnings" | "totalWithdrawn"
  >("availableBalance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useState<"all" | "vendors" | "delivery">("all");

  const userTypeFilter =
    activeTab === "vendors" ? "vendor" : activeTab === "delivery" ? "delivery_boy" : undefined;

  const { data: wallets, isLoading: walletsLoading, error: walletsError } = useAdminWallets(userTypeFilter);
  const { data: kpis, isLoading: kpisLoading } = useAdminWalletKPIs();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount);

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000 / 60);
    if (diff < 60) return `${diff} mins ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  const filtered = (wallets ?? []).filter((w) => {
    if (!searchTerm) return true;
    return (
      w.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.walletId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Wallet Management
            </h1>
            <p className="text-slate-600 mt-2">Manage and monitor all wallet transactions</p>
          </div>
          <Link href="/admin/wallets/transactions">
            <Button variant="outline" className="gap-2">
              <DollarSign className="w-4 h-4" />
              View All Transactions
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        {kpisLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { label: "Available Balance", value: formatCurrency(kpis?.totalAvailable ?? 0), sub: "Ready for payout", icon: Wallet, gradient: "from-emerald-500 to-teal-600", textColor: "text-emerald-50", subColor: "text-emerald-100" },
              { label: "Pending Balance", value: formatCurrency(kpis?.totalPending ?? 0), sub: "Vendor T+3 + Delivery", icon: Clock, gradient: "from-amber-500 to-orange-600", textColor: "text-amber-50", subColor: "text-amber-100" },
              { label: "Lifetime Earnings", value: formatCurrency(kpis?.totalLifetime ?? 0), sub: "All-time total", icon: TrendingUp, gradient: "from-blue-500 to-indigo-600", textColor: "text-blue-50", subColor: "text-blue-100" },
              { label: "Total Withdrawn", value: formatCurrency(kpis?.totalWithdrawn ?? 0), sub: "Successful payouts", icon: DollarSign, gradient: "from-purple-500 to-pink-600", textColor: "text-purple-50", subColor: "text-purple-100" },
              { label: "Pending Cashouts", value: kpis?.pendingCashouts ?? 0, sub: "Awaiting approval", icon: Clock, gradient: "from-rose-500 to-red-600", textColor: "text-rose-50", subColor: "text-rose-100" },
            ].map(({ label, value, sub, icon: Icon, gradient, textColor, subColor }) => (
              <Card key={label} className={`bg-gradient-to-br ${gradient} text-white border-0 shadow-lg hover:shadow-xl transition-shadow`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm font-medium ${textColor} flex items-center gap-2`}>
                    <Icon className="w-4 h-4" />{label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{value}</div>
                  <p className={`${subColor} text-xs mt-2`}>{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email or wallet ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs + Table */}
        <Card>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-col">
            <CardHeader>
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">All Wallets</TabsTrigger>
                <TabsTrigger value="vendors" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Vendor Wallets</TabsTrigger>
                <TabsTrigger value="delivery" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Delivery Wallets</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value={activeTab} className="mt-0">
                {walletsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : walletsError ? (
                  <div className="text-center py-12 text-red-500">Failed to load wallets. Please try again.</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User Name</TableHead>
                          <TableHead>User Type</TableHead>
                          <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort("availableBalance")}>
                            <div className="flex items-center gap-1">Available Balance <ArrowUpDown className="w-4 h-4" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort("pendingBalance")}>
                            <div className="flex items-center gap-1">Pending Balance <ArrowUpDown className="w-4 h-4" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort("lifetimeEarnings")}>
                            <div className="flex items-center gap-1">Lifetime Earnings <ArrowUpDown className="w-4 h-4" /></div>
                          </TableHead>
                          <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort("totalWithdrawn")}>
                            <div className="flex items-center gap-1">Total Withdrawn <ArrowUpDown className="w-4 h-4" /></div>
                          </TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sorted.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-slate-500 py-8">No wallets found</TableCell>
                          </TableRow>
                        ) : (
                          sorted.map((wallet) => (
                            <TableRow key={wallet.walletId}>
                              <TableCell className="font-medium">
                                {wallet.userName}
                                <div className="text-xs text-slate-500">{wallet.email}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={wallet.userType === "vendor" ? "default" : "secondary"}>
                                  {wallet.userType === "vendor" ? "Vendor" : "Delivery"}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold text-emerald-600">
                                {formatCurrency(wallet.availableBalance)}
                              </TableCell>
                              <TableCell className="text-amber-600">
                                {formatCurrency(wallet.pendingBalance)}
                                {wallet.pendingBalance > 0 && (
                                  <div className="text-xs text-amber-500 mt-1">
                                    {wallet.userType === "vendor" ? "T+3 Processing" : "Awaiting Admin"}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-semibold">{formatCurrency(wallet.lifetimeEarnings)}</TableCell>
                              <TableCell className="text-slate-600">{formatCurrency(wallet.totalWithdrawn)}</TableCell>
                              <TableCell className="text-slate-500 text-sm">{formatRelativeTime(wallet.lastUpdated)}</TableCell>
                              <TableCell className="text-right">
                                <Link href={`/admin/wallets/${wallet.userType === "vendor" ? "vendors" : "delivery"}/${wallet.userId}`}>
                                  <Button variant="ghost" size="sm" className="gap-2">
                                    <Eye className="w-4 h-4" /> View
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
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}