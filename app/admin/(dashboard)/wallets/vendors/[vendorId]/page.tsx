"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Wallet, TrendingUp, DollarSign, Clock, CheckCircle2,
  Eye, Download, Building2, CreditCard, Loader2, XCircle, ArrowDownToLine,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminVendorWalletDetail,
  useVendorWalletTransactions,
  useVendorCashoutRequests,
  useApproveCashout,
  useCompleteCashout,
  useRejectCashout,
  useReleaseVendorPendingBalance,
} from "@/hooks/wallet/useWallet";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

// ─── Release Pending Balance Confirm Dialog ───────────────────────────────────
function ReleasePendingDialog({
  vendorUserId,
  pendingAmount,
  open,
  onClose,
}: {
  vendorUserId: string;
  pendingAmount: number;
  open: boolean;
  onClose: () => void;
}) {
  const { mutate: release, isPending } = useReleaseVendorPendingBalance();

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(v);

  const handleConfirm = () => {
    release(vendorUserId, {
      onSuccess: ({ releasedAmount }) => {
        toast.success(`${formatCurrency(releasedAmount)} moved to available balance`);
        onClose();
      },
      onError: (e: any) => toast.error(e.message ?? "Failed to release balance"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Release Pending Balance</DialogTitle>
          <DialogDescription>
            This will immediately move the full pending balance of{" "}
            <span className="font-semibold text-slate-900">{formatCurrency(pendingAmount)}</span> to
            the available balance. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4 mt-2">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Pending Balance</p>
            <p className="text-xl font-bold text-amber-900">{formatCurrency(pendingAmount)}</p>
          </div>
          <ArrowDownToLine className="w-5 h-5 text-slate-400 mx-2" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Will become Available</p>
            <p className="text-xl font-bold text-emerald-900">{formatCurrency(pendingAmount)}</p>
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm Release
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Complete Cashout Dialog ──────────────────────────────────────────────────
function CompleteCashoutDialog({
  cashoutId,
  amount,
  open,
  onClose,
}: { cashoutId: string; amount: number; open: boolean; onClose: () => void }) {
  const [utr, setUtr] = useState("");
  const { mutate: complete, isPending } = useCompleteCashout();

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(v);

  const handleSubmit = () => {
    if (!utr.trim()) return toast.error("Please enter UTR number");
    complete(
      { p_cashout_id: cashoutId, p_transaction_reference: utr },
      {
        onSuccess: () => { toast.success("Cashout marked as completed"); onClose(); },
        onError: (e: any) => toast.error(e.message ?? "Failed to complete cashout"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Cashout — {formatCurrency(amount)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>UTR / Transaction Reference</Label>
            <Input className="mt-1" placeholder="Enter UTR number" value={utr} onChange={(e) => setUtr(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Mark Completed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reject Cashout Dialog ────────────────────────────────────────────────────
function RejectCashoutDialog({
  cashoutId,
  open,
  onClose,
}: { cashoutId: string; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const { mutate: reject, isPending } = useRejectCashout();

  const handleSubmit = () => {
    if (!reason.trim()) return toast.error("Please enter rejection reason");
    reject(
      { cashoutId, rejectionReason: reason },
      {
        onSuccess: () => { toast.success("Cashout rejected"); onClose(); },
        onError: (e: any) => toast.error(e.message ?? "Failed to reject cashout"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Cashout Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Rejection Reason</Label>
            <Input className="mt-1" placeholder="Enter reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VendorWalletDetailPage() {
  const { user } = useAuth();
  const { vendorId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [completingCashout, setCompletingCashout] = useState<{ id: string; amount: number } | null>(null);
  const [rejectingCashout, setRejectingCashout] = useState<string | null>(null);
  const [releasePendingOpen, setReleasePendingOpen] = useState(false);

  const vendorUserId = vendorId as string;

  const { data: detail, isLoading: detailLoading, error: detailError } = useAdminVendorWalletDetail(vendorUserId);
  const { data: transactions, isLoading: txLoading } = useVendorWalletTransactions(vendorUserId);
  const { data: cashouts, isLoading: cashoutLoading } = useVendorCashoutRequests(vendorUserId);
  const { mutate: approve, isPending: approving } = useApproveCashout();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed": case "transferred":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case "approved": case "processing":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "rejected": case "cancelled":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status ?? "Unknown"}</Badge>;
    }
  };

  const handleApprove = (cashoutId: string) => {
    approve(
      { p_cashout_id: cashoutId, p_approved_by: user?.id! },
      {
        onSuccess: () => toast.success("Cashout approved"),
        onError: (e: any) => toast.error(e.message ?? "Failed to approve"),
      }
    );
  };

  if (detailLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (detailError || !detail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load vendor wallet details.</p>
          <Link href="/admin/wallets/vendors">
            <Button variant="outline">Go Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/wallets/vendors">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                {detail.vendorName}
              </h1>
              <p className="text-slate-600 mt-1">{detail.email} • {detail.phone}</p>
            </div>
          </div>
          <Badge className={detail.bankStatus === "Verified" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
            <CheckCircle2 className="w-3 h-3 mr-1" />Bank {detail.bankStatus}
          </Badge>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Available Balance */}
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-50 flex items-center gap-2">
                <Wallet className="w-4 h-4" />Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(detail.availableBalance)}</div>
              <p className="text-emerald-100 text-xs mt-2">Ready for payout</p>
            </CardContent>
          </Card>

          {/* Pending Balance — with Release button */}
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-50 flex items-center gap-2">
                <Clock className="w-4 h-4" />Pending Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(detail.pendingBalance)}</div>
              <p className="text-amber-100 text-xs mt-2">Processing (T+3)</p>
              {detail.pendingBalance > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3 w-full bg-white/20 hover:bg-white/30 text-white border-0 text-xs font-medium gap-1.5"
                  onClick={() => setReleasePendingOpen(true)}
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  Release to Available
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Lifetime Earnings */}
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />Lifetime Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(detail.lifetimeEarnings)}</div>
              <p className="text-blue-100 text-xs mt-2">All-time total</p>
            </CardContent>
          </Card>

          {/* Total Withdrawn */}
          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-50 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />Total Withdrawn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(detail.totalWithdrawn)}</div>
              <p className="text-purple-100 text-xs mt-2">Successful payouts</p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Timeline */}
        <Card>
          <CardHeader><CardTitle>Earnings Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-sm text-blue-600 font-medium">Today</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(detail.earningsTimeline.today)}</div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="text-sm text-indigo-600 font-medium">This Week</div>
                <div className="text-2xl font-bold text-indigo-900 mt-1">{formatCurrency(detail.earningsTimeline.week)}</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="text-sm text-purple-600 font-medium">This Month</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">{formatCurrency(detail.earningsTimeline.month)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        {detail.bankDetails && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />Bank Account Details
              </CardTitle>
              {detail.bankDetails.verifiedDate && (
                <Badge className="bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verified on {new Date(detail.bankDetails.verifiedDate).toLocaleDateString()}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-600">Account Name</label>
                    <div className="font-medium mt-1 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400" />{detail.bankDetails.accountName}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Account Number</label>
                    <div className="font-medium mt-1">{detail.bankDetails.accountNumber}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">IFSC Code</label>
                    <div className="font-medium mt-1">{detail.bankDetails.ifscCode}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-600">Bank Name</label>
                    <div className="font-medium mt-1">{detail.bankDetails.bankName}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Branch</label>
                    <div className="font-medium mt-1">{detail.bankDetails.branch}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-col">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Transactions</TabsTrigger>
            <TabsTrigger value="cashouts" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Cashout Requests</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />Export
                </Button>
              </CardHeader>
              <CardContent>
                {txLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
                ) : (
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
                        {(transactions ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-slate-500 py-8">No transactions found</TableCell>
                          </TableRow>
                        ) : (
                          (transactions ?? []).map((txn) => (
                            <TableRow key={txn.id}>
                              <TableCell className="text-sm">{formatDate(txn.created_at)}</TableCell>
                              <TableCell>
                                <Badge className={txn.transaction_type === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                                  {txn.transaction_type === "credit" ? "Credit" : "Debit"}
                                </Badge>
                              </TableCell>
                              <TableCell className={`font-semibold ${txn.transaction_type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                                {txn.transaction_type === "credit" ? "+" : "-"}{formatCurrency(txn.amount)}
                              </TableCell>
                              <TableCell>
                                {txn.order_id ? (
                                  <Link href={`/admin/orders/${txn.order_id}`} className="text-blue-600 hover:underline text-sm">
                                    {txn.order_id.slice(0, 8)}...
                                  </Link>
                                ) : <span className="text-slate-400">—</span>}
                              </TableCell>
                              <TableCell className="text-slate-600">{txn.description}</TableCell>
                              <TableCell className="font-medium">{formatCurrency(txn.balance_after)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cashouts Tab */}
          <TabsContent value="cashouts" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Cashout Requests</CardTitle></CardHeader>
              <CardContent>
                {cashoutLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
                ) : (
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
                        {(cashouts ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-slate-500 py-8">No cashout requests</TableCell>
                          </TableRow>
                        ) : (
                          (cashouts ?? []).map((req) => (
                            <TableRow key={req.id}>
                              <TableCell className="font-medium">{req.request_number}</TableCell>
                              <TableCell className="font-semibold">{formatCurrency(req.amount)}</TableCell>
                              <TableCell>{getStatusBadge(req.status)}</TableCell>
                              <TableCell className="text-sm">{formatDate(req.request_date ?? req.created_at)}</TableCell>
                              <TableCell className="text-sm">{formatDate(req.completed_at)}</TableCell>
                              <TableCell className="font-mono text-sm">{req.transaction_reference ?? "—"}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {req.status === "pending" && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                        disabled={approving}
                                        onClick={() => handleApprove(req.id)}
                                      >
                                        {approving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                        Approve
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => setRejectingCashout(req.id)}
                                      >
                                        <XCircle className="w-3 h-3" /> Reject
                                      </Button>
                                    </>
                                  )}
                                  {(req.status === "approved" || req.status === "processing") && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                      onClick={() => setCompletingCashout({ id: req.id, amount: req.amount })}
                                    >
                                      <CheckCircle2 className="w-3 h-3" /> Mark Complete
                                    </Button>
                                  )}
                                  {(req.status === "completed" || req.status === "transferred") && (
                                    <Button variant="ghost" size="sm" className="gap-2">
                                      <Eye className="w-4 h-4" /> View
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ReleasePendingDialog
        vendorUserId={vendorUserId}
        pendingAmount={detail.pendingBalance}
        open={releasePendingOpen}
        onClose={() => setReleasePendingOpen(false)}
      />
      {completingCashout && (
        <CompleteCashoutDialog
          cashoutId={completingCashout.id}
          amount={completingCashout.amount}
          open={!!completingCashout}
          onClose={() => setCompletingCashout(null)}
        />
      )}
      {rejectingCashout && (
        <RejectCashoutDialog
          cashoutId={rejectingCashout}
          open={!!rejectingCashout}
          onClose={() => setRejectingCashout(null)}
        />
      )}
    </div>
  );
}