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
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Building2,
  CreditCard,
  Clock,
  Star,
  Bike,
  Package,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock Data
const mockPartnerDetail = {
  id: "D001",
  partnerName: "Rajesh Kumar",
  email: "rajesh.kumar@delivery.com",
  phone: "+91 98765 43210",
  availableBalance: 8920.00,
  pendingBalance: 1250.00,
  lifetimeEarnings: 89234.50,
  totalWithdrawn: 80314.50,
  totalDeliveries: 1234,
  rating: 4.8,
  isOnline: true,
  bankStatus: "Verified",
  bankDetails: {
    accountName: "Rajesh Kumar",
    accountNumber: "****5678",
    ifscCode: "ICIC0001234",
    bankName: "ICICI Bank",
    branch: "Koramangala, Bangalore",
    verifiedDate: "2024-01-20",
  },
  earningsTimeline: {
    today: 1250.00,
    week: 5840.50,
    month: 23670.00,
  },
};

const mockTransactions = [
  {
    id: "TXN001",
    type: "Credit",
    amount: 85.00,
    deliveryId: "DEL12345",
    balanceAfter: 8920.00,
    date: "2024-02-13T12:30:00",
    description: "Delivery fee",
  },
  {
    id: "TXN002",
    type: "Credit",
    amount: 95.50,
    deliveryId: "DEL12346",
    balanceAfter: 8835.00,
    date: "2024-02-13T11:45:00",
    description: "Delivery fee + tip",
  },
  {
    id: "TXN003",
    type: "Debit",
    amount: 5000.00,
    deliveryId: null,
    balanceAfter: 8739.50,
    date: "2024-02-13T10:00:00",
    description: "Cashout to bank",
  },
  {
    id: "TXN004",
    type: "Credit",
    amount: 75.00,
    deliveryId: "DEL12347",
    balanceAfter: 13739.50,
    date: "2024-02-13T09:20:00",
    description: "Delivery fee",
  },
  {
    id: "TXN005",
    type: "Credit",
    amount: 110.00,
    deliveryId: "DEL12348",
    balanceAfter: 13664.50,
    date: "2024-02-13T08:15:00",
    description: "Delivery fee + bonus",
  },
];

const mockCashoutRequests = [
  {
    id: "CASH001",
    amount: 1250.00,
    status: "Pending",
    requestDate: "2024-02-13T09:30:00",
    completedDate: null,
    utrNumber: null,
  },
  {
    id: "CASH002",
    amount: 5000.00,
    status: "Completed",
    requestDate: "2024-02-10T10:00:00",
    completedDate: "2024-02-10T14:30:00",
    utrNumber: "UTR789456123",
  },
  {
    id: "CASH003",
    amount: 3000.00,
    status: "Completed",
    requestDate: "2024-02-08T15:30:00",
    completedDate: "2024-02-08T18:45:00",
    utrNumber: "UTR456789123",
  },
  {
    id: "CASH004",
    amount: 4500.00,
    status: "Completed",
    requestDate: "2024-02-05T12:00:00",
    completedDate: "2024-02-05T16:20:00",
    utrNumber: "UTR321654987",
  },
];

export default function DeliveryWalletDetailPage({ params }) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/wallets/delivery">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
                  {mockPartnerDetail.partnerName}
                </h1>
                {mockPartnerDetail.isOnline && (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    Online
                  </Badge>
                )}
              </div>
              <p className="text-slate-600 mt-1">
                {mockPartnerDetail.email} • {mockPartnerDetail.phone}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{mockPartnerDetail.rating}</span>
                  <span className="text-slate-500">rating</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <Package className="w-4 h-4" />
                  <span className="font-medium">{mockPartnerDetail.totalDeliveries}</span>
                  <span className="text-slate-500">deliveries</span>
                </div>
              </div>
            </div>
          </div>
          <Badge
            className={
              mockPartnerDetail.bankStatus === "Verified"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Bank {mockPartnerDetail.bankStatus}
          </Badge>
        </div>

        {/* Info Banner */}
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Delivery Partner Payout Flow</h3>
                <p className="text-blue-100 text-sm mt-1">
                  <strong>Step 1:</strong> Earnings move to Available Balance after delivery completion → 
                  <strong>Step 2:</strong> Partner requests cashout (moves to Pending Balance) → 
                  <strong>Step 3:</strong> Admin confirms the cashout request → 
                  <strong>Step 4:</strong> Amount transferred to verified bank account
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                {formatCurrency(mockPartnerDetail.availableBalance)}
              </div>
              <p className="text-emerald-100 text-xs mt-2">Ready for cashout request</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-50 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Cashout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(mockPartnerDetail.pendingBalance)}
              </div>
              <p className="text-amber-100 text-xs mt-2">Awaiting admin confirmation</p>
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
                {formatCurrency(mockPartnerDetail.lifetimeEarnings)}
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
                {formatCurrency(mockPartnerDetail.totalWithdrawn)}
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
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="text-sm text-purple-600 font-medium">Today</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">
                  {formatCurrency(mockPartnerDetail.earningsTimeline.today)}
                </div>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                <div className="text-sm text-pink-600 font-medium">This Week</div>
                <div className="text-2xl font-bold text-pink-900 mt-1">
                  {formatCurrency(mockPartnerDetail.earningsTimeline.week)}
                </div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="text-sm text-indigo-600 font-medium">This Month</div>
                <div className="text-2xl font-bold text-indigo-900 mt-1">
                  {formatCurrency(mockPartnerDetail.earningsTimeline.month)}
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
              Verified on {new Date(mockPartnerDetail.bankDetails.verifiedDate).toLocaleDateString()}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-600">Account Name</label>
                  <div className="font-medium mt-1 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    {mockPartnerDetail.bankDetails.accountName}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Account Number</label>
                  <div className="font-medium mt-1">
                    {mockPartnerDetail.bankDetails.accountNumber}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600">IFSC Code</label>
                  <div className="font-medium mt-1">
                    {mockPartnerDetail.bankDetails.ifscCode}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-600">Bank Name</label>
                  <div className="font-medium mt-1">
                    {mockPartnerDetail.bankDetails.bankName}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Branch</label>
                  <div className="font-medium mt-1">
                    {mockPartnerDetail.bankDetails.branch}
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
                        <TableHead>Delivery ID</TableHead>
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
                            {txn.deliveryId ? (
                              <Link
                                href={`/admin/deliveries/${txn.deliveryId}`}
                                className="text-blue-600 hover:underline"
                              >
                                {txn.deliveryId}
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