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
  Loader2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminDeliveryWalletDetail,
  useDeliveryWalletTransactions,
  useDeliveryCashoutRequests,
  useApproveDeliveryCashout,
  useCompleteDeliveryCashout,
  useRejectDeliveryCashout,
} from "@/hooks/wallet/useDeliveryWallet";
import { CashoutRequest } from "@/types/supabase";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export default function DeliveryWalletDetailPage() {
  const {partnerId} = useParams<{partnerId:string}>();
  const [activeTab, setActiveTab] = useState("overview");
  const {user}=useAuth()
  // Dialog states
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; cashout: CashoutRequest | null }>({ open: false, cashout: null });
  const [completeDialog, setCompleteDialog] = useState<{ open: boolean; cashout: CashoutRequest | null }>({ open: false, cashout: null });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; cashout: CashoutRequest | null }>({ open: false, cashout: null });
  const [utrNumber, setUtrNumber] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: partner, isLoading: detailLoading, error: detailError } =
    useAdminDeliveryWalletDetail(partnerId!);
  const { data: transactions = [], isLoading: txLoading } =
    useDeliveryWalletTransactions(partnerId!);
  const { data: cashouts = [], isLoading: cashoutLoading } =
    useDeliveryCashoutRequests(partnerId!);

  const approveMutation = useApproveDeliveryCashout();
  const completeMutation = useCompleteDeliveryCashout();
  const rejectMutation = useRejectDeliveryCashout();

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

  const handleApprove = async () => {
    if (!approveDialog.cashout) return;
    try {
      await approveMutation.mutateAsync({
        cashoutId: approveDialog.cashout.id,
        approvedBy: user?.id!, // replace with actual admin userId from auth
      });
      toast.success("Cashout request approved");
      setApproveDialog({ open: false, cashout: null });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to approve");
    }
  };

  const handleComplete = async () => {
    if (!completeDialog.cashout || !utrNumber.trim()) return;
    try {
      await completeMutation.mutateAsync({
        cashoutId: completeDialog.cashout.id,
        transactionReference: utrNumber.trim(),
      });
      toast.success("Cashout marked as completed");
      setCompleteDialog({ open: false, cashout: null });
      setUtrNumber("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to complete");
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.cashout || !rejectionReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({
        cashoutId: rejectDialog.cashout.id,
        rejectionReason: rejectionReason.trim(),
      });
      toast.success("Cashout request rejected");
      setRejectDialog({ open: false, cashout: null });
      setRejectionReason("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to reject");
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status ?? "—"}</Badge>;
    }
  };

  if (detailLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (detailError || !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-slate-600">Failed to load wallet details.</p>
          <Link href="/admin/wallets/delivery">
            <Button variant="outline">Go Back</Button>
          </Link>
        </div>
      </div>
    );
  }

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
                  {partner.partnerName}
                </h1>
                {partner.isOnline && (
                  <Badge className="bg-emerald-100 text-emerald-700">Online</Badge>
                )}
              </div>
              <p className="text-slate-600 mt-1">
                {partner.email} • {partner.phone}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {partner.rating ? partner.rating.toFixed(1) : "—"}
                  </span>
                  <span className="text-slate-500">rating</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <Package className="w-4 h-4" />
                  <span className="font-medium">{partner.totalDeliveries.toLocaleString()}</span>
                  <span className="text-slate-500">deliveries</span>
                </div>
              </div>
            </div>
          </div>
          <Badge
            className={
              partner.bankStatus === "Verified"
                ? "bg-emerald-100 text-emerald-700"
                : partner.bankStatus === "Pending"
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
            }
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Bank {partner.bankStatus}
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
                  <strong>Step 1:</strong> Earnings move to Available Balance after delivery completion →{" "}
                  <strong>Step 2:</strong> Partner requests cashout (moves to Pending Balance) →{" "}
                  <strong>Step 3:</strong> Admin confirms the cashout request →{" "}
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
                {formatCurrency(partner.availableBalance)}
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
                {formatCurrency(partner.pendingBalance)}
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
                {formatCurrency(partner.lifetimeEarnings)}
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
                {formatCurrency(partner.totalWithdrawn)}
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
                  {formatCurrency(partner.earningsTimeline.today)}
                </div>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                <div className="text-sm text-pink-600 font-medium">This Week</div>
                <div className="text-2xl font-bold text-pink-900 mt-1">
                  {formatCurrency(partner.earningsTimeline.week)}
                </div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="text-sm text-indigo-600 font-medium">This Month</div>
                <div className="text-2xl font-bold text-indigo-900 mt-1">
                  {formatCurrency(partner.earningsTimeline.month)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        {partner.bankDetails ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Bank Account Details
              </CardTitle>
              <Badge className="bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {partner.bankDetails.verifiedDate
                  ? `Verified on ${new Date(partner.bankDetails.verifiedDate).toLocaleDateString()}`
                  : "Verified"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-600">Account Name</label>
                    <div className="font-medium mt-1 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      {partner.bankDetails.accountName}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Account Number</label>
                    <div className="font-medium mt-1">{partner.bankDetails.accountNumber}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">IFSC Code</label>
                    <div className="font-medium mt-1">{partner.bankDetails.ifscCode}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-600">Bank Name</label>
                    <div className="font-medium mt-1">{partner.bankDetails.bankName}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Branch</label>
                    <div className="font-medium mt-1">{partner.bankDetails.branch || "—"}</div>
                  </div>
                  {partner.bankDetails.upiId && (
                    <div>
                      <label className="text-sm text-slate-600">UPI ID</label>
                      <div className="font-medium mt-1">{partner.bankDetails.upiId}</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center text-slate-500">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No bank account details added yet
            </CardContent>
          </Card>
        )}

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-col">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              value="overview"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              value="cashouts"
            >
              Cashout Requests
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
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
                      {txLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                          </TableCell>
                        </TableRow>
                      ) : transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((txn) => (
                          <TableRow key={txn.id}>
                            <TableCell className="text-sm">
                              {formatDate(txn.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  txn.transaction_type === "credit"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }
                              >
                                {txn.transaction_type === "credit" ? "Credit" : "Debit"}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className={`font-semibold ${
                                txn.transaction_type === "credit"
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {txn.transaction_type === "credit" ? "+" : "-"}
                              {formatCurrency(txn.amount)}
                            </TableCell>
                            <TableCell>
                              {txn.order_id ? (
                                <Link
                                  href={`/admin/orders/${txn.order_id}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {txn.order_id.slice(0, 8)}...
                                </Link>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {txn.description}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(txn.balance_after)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cashout Requests Tab */}
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
                        <TableHead>Request #</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Completed Date</TableHead>
                        <TableHead>UTR Number</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashoutLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                          </TableCell>
                        </TableRow>
                      ) : cashouts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                            No cashout requests found
                          </TableCell>
                        </TableRow>
                      ) : (
                        cashouts.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium font-mono text-sm">
                              {req.request_number}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(req.amount)}
                            </TableCell>
                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                            <TableCell className="text-sm">
                              {formatDate(req.request_date ?? req.created_at)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {req.completed_at ? formatDate(req.completed_at) : "—"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {req.transaction_reference ?? "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {req.status === "pending" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                      onClick={() =>
                                        setApproveDialog({ open: true, cashout: req })
                                      }
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() =>
                                        setRejectDialog({ open: true, cashout: req })
                                      }
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {req.status === "approved" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() =>
                                      setCompleteDialog({ open: true, cashout: req })
                                    }
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Mark Complete
                                  </Button>
                                )}
                                {(req.status === "completed" || req.status === "rejected") && (
                                  <Button variant="ghost" size="sm" className="gap-1">
                                    <Eye className="w-4 h-4" />
                                    View
                                  </Button>
                                )}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve Dialog */}
      <Dialog
        open={approveDialog.open}
        onOpenChange={(open) => setApproveDialog({ open, cashout: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Cashout Request</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Are you sure you want to approve{" "}
            <span className="font-semibold">
              {approveDialog.cashout && formatCurrency(approveDialog.cashout.amount)}
            </span>{" "}
            cashout for <span className="font-semibold">{partner.partnerName}</span>?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialog({ open: false, cashout: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {approveMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog
        open={completeDialog.open}
        onOpenChange={(open) => {
          setCompleteDialog({ open, cashout: null });
          setUtrNumber("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Cashout as Completed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600">
              Enter the UTR / Transaction reference number for the{" "}
              <span className="font-semibold">
                {completeDialog.cashout && formatCurrency(completeDialog.cashout.amount)}
              </span>{" "}
              transfer.
            </p>
            <div className="space-y-2">
              <Label htmlFor="utr">UTR / Reference Number</Label>
              <Input
                id="utr"
                placeholder="e.g. UTR123456789"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCompleteDialog({ open: false, cashout: null });
                setUtrNumber("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={completeMutation.isPending || !utrNumber.trim()}
            >
              {completeMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          setRejectDialog({ open, cashout: null });
          setRejectionReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Cashout Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600">
              Provide a reason for rejecting this cashout request of{" "}
              <span className="font-semibold">
                {rejectDialog.cashout && formatCurrency(rejectDialog.cashout.amount)}
              </span>
              .
            </p>
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, cashout: null });
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {rejectMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}