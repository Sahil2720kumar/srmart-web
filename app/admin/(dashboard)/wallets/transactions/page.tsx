"use client";

import { useState, useMemo } from "react";
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
import { Search, Download, ArrowLeft, Filter, Loader2 } from "lucide-react";
import Link from "next/link";
import { useGlobalWalletTransactions } from "@/hooks/wallet/useDeliveryWallet";

export default function GlobalTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "Vendor" | "Delivery">("all");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<"all" | "Credit" | "Debit">("all");
  const [dateRange, setDateRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Compute dateFrom for the API query based on dateRange
  const dateFrom = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case "today": {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      }
      case "week": {
        const d = new Date(now);
        d.setDate(now.getDate() - 7);
        return d.toISOString();
      }
      case "month": {
        const d = new Date(now);
        d.setMonth(now.getMonth() - 1);
        return d.toISOString();
      }
      default:
        return undefined;
    }
  }, [dateRange]);

  const { data: allTransactions = [], isLoading, error } = useGlobalWalletTransactions({
    userType: userTypeFilter === "all" ? undefined : userTypeFilter,
    transactionType: transactionTypeFilter === "all" ? undefined : transactionTypeFilter,
    dateFrom,
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Client-side search filter
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return allTransactions;
    const q = searchTerm.toLowerCase();
    return allTransactions.filter(
      (t) =>
        t.userName.toLowerCase().includes(q) ||
        t.userId.toLowerCase().includes(q) ||
        (t.orderId && t.orderId.toLowerCase().includes(q))
    );
  }, [allTransactions, searchTerm]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalCredits = filteredTransactions
    .filter((t) => t.transactionType === "Credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = filteredTransactions
    .filter((t) => t.transactionType === "Debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const handleFilterChange = (setter: (v: any) => void) => (value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/wallets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Global Wallet Transactions
              </h1>
              <p className="text-slate-600 mt-2">
                View all wallet transactions across vendors and delivery partners
              </p>
            </div>
          </div>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export All
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-50">
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{filteredTransactions.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-50">
                Total Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalCredits)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-50">
                Total Debits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalDebits)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-50">
                Net Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(totalCredits - totalDebits)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-600" />
              <CardTitle>Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by user or order..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Select
                value={userTypeFilter}
                onValueChange={handleFilterChange(setUserTypeFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="Vendor">Vendors</SelectItem>
                  <SelectItem value="Delivery">Delivery Partners</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={transactionTypeFilter}
                onValueChange={handleFilterChange(setTransactionTypeFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Credit">Credits</SelectItem>
                  <SelectItem value="Debit">Debits</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={dateRange}
                onValueChange={handleFilterChange(setDateRange)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8 text-red-500">
                Failed to load transactions. Please try again.
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>User Type</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Balance After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                          </TableCell>
                        </TableRow>
                      ) : paginatedTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedTransactions.map((txn) => (
                          <TableRow key={txn.id}>
                            <TableCell className="text-sm whitespace-nowrap">
                              {formatDate(txn.date)}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{txn.userName}</div>
                              <div className="text-xs text-slate-500">
                                {txn.userId.slice(0, 8)}...
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={txn.userType === "Vendor" ? "default" : "secondary"}
                              >
                                {txn.userType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  txn.transactionType === "Credit"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }
                              >
                                {txn.transactionType}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className={`font-semibold ${
                                txn.transactionType === "Credit"
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {txn.transactionType === "Credit" ? "+" : "-"}
                              {formatCurrency(txn.amount)}
                            </TableCell>
                            <TableCell>
                              {txn.orderId ? (
                                <Link
                                  href={`/admin/orders/${txn.orderId}`}
                                  className="text-blue-600 hover:underline font-medium"
                                >
                                  {txn.orderId.slice(0, 8)}...
                                </Link>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-600 max-w-[180px] truncate">
                              {txn.description}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(txn.balanceAfter)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-slate-600">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{" "}
                      {filteredTransactions.length} transactions
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
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(
                            (page) =>
                              page === 1 ||
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 1
                          )
                          .map((page, index, arr) => (
                            <>
                              {index > 0 && arr[index - 1] !== page - 1 && (
                                <span key={`ellipsis-${page}`} className="px-2">
                                  ...
                                </span>
                              )}
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </>
                          ))}
                      </div>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}