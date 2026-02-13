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
import { Search, Download, ArrowLeft, Filter, Calendar } from "lucide-react";
import Link from "next/link";

// Mock Data
const mockTransactions = [
  {
    id: "TXN001",
    date: "2024-02-13T12:30:00",
    userId: "V001",
    userName: "Spice Garden Restaurant",
    userType: "Vendor",
    transactionType: "Credit",
    amount: 1250.00,
    orderId: "ORD12345",
    balanceAfter: 45820.50,
  },
  {
    id: "TXN002",
    date: "2024-02-13T12:25:00",
    userId: "D001",
    userName: "Rajesh Kumar",
    userType: "Delivery",
    transactionType: "Credit",
    amount: 85.00,
    orderId: "ORD12345",
    balanceAfter: 8920.00,
  },
  {
    id: "TXN003",
    date: "2024-02-13T11:45:00",
    userId: "V002",
    userName: "Cafe Aroma",
    userType: "Vendor",
    transactionType: "Credit",
    amount: 890.50,
    orderId: "ORD12346",
    balanceAfter: 32100.75,
  },
  {
    id: "TXN004",
    date: "2024-02-13T11:40:00",
    userId: "D002",
    userName: "Priya Sharma",
    userType: "Delivery",
    transactionType: "Credit",
    amount: 95.50,
    orderId: "ORD12346",
    balanceAfter: 12450.00,
  },
  {
    id: "TXN005",
    date: "2024-02-13T10:00:00",
    userId: "V001",
    userName: "Spice Garden Restaurant",
    userType: "Vendor",
    transactionType: "Debit",
    amount: 25000.00,
    orderId: null,
    balanceAfter: 44570.50,
  },
  {
    id: "TXN006",
    date: "2024-02-13T09:15:00",
    userId: "V003",
    userName: "Pizza Paradise",
    userType: "Vendor",
    transactionType: "Credit",
    amount: 1450.75,
    orderId: "ORD12347",
    balanceAfter: 28900.00,
  },
  {
    id: "TXN007",
    date: "2024-02-13T09:10:00",
    userId: "D003",
    userName: "Amit Patel",
    userType: "Delivery",
    transactionType: "Credit",
    amount: 75.00,
    orderId: "ORD12347",
    balanceAfter: 5670.50,
  },
  {
    id: "TXN008",
    date: "2024-02-13T08:30:00",
    userId: "D001",
    userName: "Rajesh Kumar",
    userType: "Delivery",
    transactionType: "Debit",
    amount: 5000.00,
    orderId: null,
    balanceAfter: 8835.00,
  },
  {
    id: "TXN009",
    date: "2024-02-12T18:30:00",
    userId: "V002",
    userName: "Cafe Aroma",
    userType: "Vendor",
    transactionType: "Credit",
    amount: 2100.00,
    orderId: "ORD12348",
    balanceAfter: 31210.25,
  },
  {
    id: "TXN010",
    date: "2024-02-12T18:25:00",
    userId: "D004",
    userName: "Sneha Reddy",
    userType: "Delivery",
    transactionType: "Credit",
    amount: 110.00,
    orderId: "ORD12348",
    balanceAfter: 15230.75,
  },
  {
    id: "TXN011",
    date: "2024-02-12T16:20:00",
    userId: "V004",
    userName: "Burger Hub",
    userType: "Vendor",
    transactionType: "Credit",
    amount: 1180.25,
    orderId: "ORD12349",
    balanceAfter: 18450.25,
  },
  {
    id: "TXN012",
    date: "2024-02-12T15:45:00",
    userId: "V005",
    userName: "Sushi Central",
    userType: "Vendor",
    transactionType: "Debit",
    amount: 30000.00,
    orderId: null,
    balanceAfter: 52300.00,
  },
];

export default function GlobalTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filterTransactions = (transactions) => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.orderId && t.orderId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // User type filter
    if (userTypeFilter !== "all") {
      filtered = filtered.filter((t) => t.userType === userTypeFilter);
    }

    // Transaction type filter
    if (transactionTypeFilter !== "all") {
      filtered = filtered.filter((t) => t.transactionType === transactionTypeFilter);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date(now);
      
      switch (dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter((t) => new Date(t.date) >= filterDate);
    }

    return filtered;
  };

  const filteredTransactions = filterTransactions(mockTransactions);
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
              <div className="text-3xl font-bold">
                {filteredTransactions.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-50">
                Total Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(totalCredits)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-50">
                Total Debits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(totalDebits)}
              </div>
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
                onValueChange={(value) => {
                  setUserTypeFilter(value);
                  setCurrentPage(1);
                }}
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
                onValueChange={(value) => {
                  setTransactionTypeFilter(value);
                  setCurrentPage(1);
                }}
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
                onValueChange={(value) => {
                  setDateRange(value);
                  setCurrentPage(1);
                }}
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
                    <TableHead>Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="text-sm">
                          {formatDate(txn.date)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{txn.userName}</div>
                          <div className="text-xs text-slate-500">{txn.userId}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              txn.userType === "Vendor" ? "default" : "secondary"
                            }
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
                              {txn.orderId}
                            </Link>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
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
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}