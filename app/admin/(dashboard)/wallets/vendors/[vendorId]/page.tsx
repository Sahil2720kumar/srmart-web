"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Building2,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock Data
const mockVendorDetail = {
  id: "V001",
  vendorName: "Spice Garden Restaurant",
  email: "contact@spicegarden.com",
  phone: "+91 98765 43210",
  availableBalance: 45820.50,
  pendingBalance: 12340.00,
  lifetimeEarnings: 234567.80,
  totalWithdrawn: 176407.30,
  bankStatus: "Verified",
  bankDetails: {
    accountName: "Spice Garden Restaurant Pvt Ltd",
    accountNumber: "****1234",
    ifscCode: "HDFC0001234",
    bankName: "HDFC Bank",
    branch: "MG Road, Bangalore",
    verifiedDate: "2024-01-15",
  },
  earningsTimeline: {
    today: 2340.50,
    week: 12567.80,
    month: 45820.50,
  },
};

const mockTransactions = [
  {
    id: "TXN001",
    type: "Credit",
    amount: 1250.00,
    orderId: "ORD12345",
    balanceAfter: 45820.50,
    date: "2024-02-13T10:30:00",
    description: "Order commission",
  },
  {
    id: "TXN002",
    type: "Credit",
    amount: 890.50,
    orderId: "ORD12346",
    balanceAfter: 44570.50,
    date: "2024-02-13T09:15:00",
    description: "Order commission",
  },
  {
    id: "TXN003",
    type: "Debit",
    amount: 25000.00,
    orderId: null,
    balanceAfter: 43680.00,
    date: "2024-02-12T18:30:00",
    description: "Cashout to bank",
  },
  {
    id: "TXN004",
    type: "Credit",
    amount: 1450.75,
    orderId: "ORD12347",
    balanceAfter: 68680.00,
    date: "2024-02-12T16:20:00",
    description: "Order commission",
  },
  {
    id: "TXN005",
    type: "Credit",
    amount: 2100.00,
    orderId: "ORD12348",
    balanceAfter: 67229.25,
    date: "2024-02-12T14:10:00",
    description: "Order commission",
  },
];

const mockCashoutRequests = [
  {
    id: "CASH001",
    amount: 25000.00,
    status: "Completed",
    requestDate: "2024-02-10T10:00:00",
    completedDate: "2024-02-12T15:30:00",
    utrNumber: "UTR123456789",
  },
  {
    id: "CASH002",
    amount: 30000.00,
    status: "Processing",
    requestDate: "2024-02-13T09:00:00",
    completedDate: null,
    utrNumber: null,
  },
  {
    id: "CASH003",
    amount: 20000.00,
    status: "Completed",
    requestDate: "2024-02-05T11:00:00",
    completedDate: "2024-02-07T16:45:00",
    utrNumber: "UTR987654321",
  },
];

export default function VendorWalletDetailPage({ params }) {
  const [activeTab, setActiveTab] = useState("overview");

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

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "Processing":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      case "Failed":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/wallets/vendors">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                {mockVendorDetail.vendorName}
              </h1>
              <p className="text-slate-600 mt-1">
                {mockVendorDetail.email} • {mockVendorDetail.phone}
              </p>
            </div>
          </div>
          <Badge
            className={
              mockVendorDetail.bankStatus === "Verified"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Bank {mockVendorDetail.bankStatus}
          </Badge>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-50 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(mockVendorDetail.availableBalance)}
              </div>
              <p className="text-emerald-100 text-xs mt-2">Ready for payout</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-50 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(mockVendorDetail.pendingBalance)}
              </div>
              <p className="text-amber-100 text-xs mt-2">Processing (T+3)</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Lifetime Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(mockVendorDetail.lifetimeEarnings)}
              </div>
              <p className="text-blue-100 text-xs mt-2">All-time total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-50 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Withdrawn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(mockVendorDetail.totalWithdrawn)}
              </div>
              <p className="text-purple-100 text-xs mt-2">Successful payouts</p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-sm text-blue-600 font-medium">Today</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  {formatCurrency(mockVendorDetail.earningsTimeline.today)}
                </div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="text-sm text-indigo-600 font-medium">This Week</div>
                <div className="text-2xl font-bold text-indigo-900 mt-1">
                  {formatCurrency(mockVendorDetail.earningsTimeline.week)}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="text-sm text-purple-600 font-medium">This Month</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">
                  {formatCurrency(mockVendorDetail.earningsTimeline.month)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Bank Account Details
            </CardTitle>
            <Badge className="bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified on {new Date(mockVendorDetail.bankDetails.verifiedDate).toLocaleDateString()}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-600">Account Name</label>
                  <div className="font-medium mt-1 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    {mockVendorDetail.bankDetails.accountName}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Account Number</label>
                  <div className="font-medium mt-1">
                    {mockVendorDetail.bankDetails.accountNumber}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600">IFSC Code</label>
                  <div className="font-medium mt-1">
                    {mockVendorDetail.bankDetails.ifscCode}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-600">Bank Name</label>
                  <div className="font-medium mt-1">
                    {mockVendorDetail.bankDetails.bankName}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Branch</label>
                  <div className="font-medium mt-1">
                    {mockVendorDetail.bankDetails.branch}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-col">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="overview">Transactions</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="cashouts">Cashout Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Balance After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockTransactions.map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell className="text-sm">
                            {formatDate(txn.date)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={txn.type === "Credit" ? "default" : "secondary"}
                              className={
                                txn.type === "Credit"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }
                            >
                              {txn.type}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`font-semibold ${
                              txn.type === "Credit"
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {txn.type === "Credit" ? "+" : "-"}
                            {formatCurrency(txn.amount)}
                          </TableCell>
                          <TableCell>
                            {txn.orderId ? (
                              <Link
                                href={`/admin/orders/${txn.orderId}`}
                                className="text-blue-600 hover:underline"
                              >
                                {txn.orderId}
                              </Link>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {txn.description}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(txn.balanceAfter)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashouts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Cashout Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Completed Date</TableHead>
                        <TableHead>UTR Number</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockCashoutRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.id}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(request.amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(request.requestDate)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {request.completedDate
                              ? formatDate(request.completedDate)
                              : "-"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {request.utrNumber || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}