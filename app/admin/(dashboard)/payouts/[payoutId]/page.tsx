"use client";

import React, { useState } from 'react';
import {
  ArrowLeft, CheckCircle2, Clock, CreditCard, History,
  Info, Receipt, ShieldCheck, ShieldX, User, Wallet,
  XCircle, Activity, Send, Building2, Banknote, Loader2,
  AlertCircle, Check, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  usePayoutDetail,
  useApprovePayout, useMarkProcessingPayout, useMarkTransferredPayout,
  useCompletePayout, useRejectPayout, useAddPayoutAdminNotes,
  PayoutStatus, PayoutDetail,
} from '@/hooks/wallet/usePayouts';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Utilities ────────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

const formatDateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

const STATUS_CONFIG: Record<PayoutStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',     className: 'border-amber-200 bg-amber-50 text-amber-700',     icon: <Clock className="w-3 h-3" /> },
  approved:   { label: 'Approved',    className: 'border-blue-200 bg-blue-50 text-blue-700',        icon: <CheckCircle2 className="w-3 h-3" /> },
  processing: { label: 'Processing',  className: 'border-violet-200 bg-violet-50 text-violet-700',  icon: <Activity className="w-3 h-3" /> },
  transferred:{ label: 'Transferred', className: 'border-cyan-200 bg-cyan-50 text-cyan-700',        icon: <Send className="w-3 h-3" /> },
  completed:  { label: 'Completed',   className: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected:   { label: 'Rejected',    className: 'border-red-200 bg-red-50 text-red-700',           icon: <XCircle className="w-3 h-3" /> },
  cancelled:  { label: 'Cancelled',   className: 'border-slate-200 bg-slate-50 text-slate-500',     icon: <XCircle className="w-3 h-3" /> },
};

const StatusBadge = ({ status }: { status: PayoutStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`gap-1.5 font-medium text-xs px-2.5 py-1 ${cfg.className}`}>
      {cfg.icon}{cfg.label}
    </Badge>
  );
};

// Timeline Item
const TimelineItem = ({
  title, date, active, completed, isLast,
}: {
  title: string; date?: string | null;
  active?: boolean; completed?: boolean; isLast?: boolean;
}) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors mt-0.5 ${
        completed
          ? 'bg-emerald-500 border-emerald-500 text-white'
          : active
          ? 'bg-white border-blue-400'
          : 'bg-white border-slate-200'
      }`}>
        {completed
          ? <Check className="w-3.5 h-3.5" />
          : active
          ? <div className="w-2 h-2 rounded-full bg-blue-400" />
          : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
      </div>
      {!isLast && (
        <div className={`w-0.5 flex-1 my-1 min-h-[28px] ${
          completed ? 'bg-emerald-400' : 'bg-slate-200'
        }`} />
      )}
    </div>
    <div className={`pb-5 pt-1 ${isLast ? 'pb-1' : ''}`}>
      <p className={`text-sm font-medium ${
        completed ? 'text-slate-900' : active ? 'text-blue-700' : 'text-slate-400'
      }`}>{title}</p>
      {date
        ? <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(date)}</p>
        : <p className="text-xs text-slate-400 mt-0.5">Awaiting</p>}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PayoutDetailPage() {
  const router = useRouter();
  const { payoutId:cashoutId } = useParams<{payoutId:string}>();
 

  const { data: payout, isLoading, error, refetch } = usePayoutDetail(cashoutId);

  // Mutations
  const approveMutation = useApprovePayout();
  const processingMutation = useMarkProcessingPayout();
  const transferMutation = useMarkTransferredPayout();
  const completeMutation = useCompletePayout();
  const rejectMutation = useRejectPayout();
  const notesMutation = useAddPayoutAdminNotes();

  // Dialog state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);
  const [txnRef, setTxnRef] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-20">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !payout) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-slate-600">Failed to load payout details.</p>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const canApprove = payout.status === 'pending' && payout.bank_verified;
  const canTransfer = payout.status === 'approved' || payout.status === 'processing';
  const canComplete = payout.status === 'transferred';
  const isTerminal = ['completed', 'rejected', 'cancelled'].includes(payout.status);

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({ cashoutId: payout.id, approvedBy: 'admin' });
      toast.success('Request approved successfully');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to approve');
    }
  };

  const handleMarkProcessing = async () => {
    try {
      await processingMutation.mutateAsync(payout.id);
      toast.success('Marked as processing');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update');
    }
  };

  const handleTransfer = async () => {
    if (!txnRef.trim()) return;
    try {
      await transferMutation.mutateAsync({ cashoutId: payout.id, transactionReference: txnRef });
      toast.success('Marked as transferred');
      setTransferOpen(false);
      setTxnRef('');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update');
    }
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync({
        cashoutId: payout.id,
        transactionReference: payout.transaction_reference ?? '',
      });
      toast.success('Payout completed successfully');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to complete');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ cashoutId: payout.id, rejectionReason });
      toast.success('Request rejected');
      setRejectOpen(false);
      setRejectionReason('');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to reject');
    }
  };

  const handleSaveNotes = async () => {
    try {
      await notesMutation.mutateAsync({ cashoutId: payout.id, notes: adminNotes });
      toast.success('Notes saved');
      setNotesOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save notes');
    }
  };

  const anyMutating =
    approveMutation.isPending || processingMutation.isPending ||
    transferMutation.isPending || completeMutation.isPending || rejectMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Sticky Header */}
        <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur-md px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight font-mono">{payout.request_number}</h1>
                  <Badge variant="outline" className="bg-slate-100 capitalize">
                    {payout.user_type === 'vendor' ? 'Vendor' : 'Delivery Partner'}
                  </Badge>
                  <StatusBadge status={payout.status} />
                </div>
                <p className="text-sm text-slate-500 mt-1">Request by {payout.user_name}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {!isTerminal && (
                <Button variant="outline" size="sm" onClick={() => refetch()}
                  className="gap-1.5 text-xs border-slate-200 text-slate-600" disabled={anyMutating}>
                  <RefreshCw className="w-3.5 h-3.5" />Refresh
                </Button>
              )}

              {payout.status === 'pending' && (
                <>
                  <Button variant="destructive" size="sm"
                    onClick={() => setRejectOpen(true)}
                    disabled={anyMutating}
                    className="gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />Reject
                  </Button>
                  <Button size="sm"
                    className="bg-blue-600 hover:bg-blue-700 gap-1.5"
                    disabled={!canApprove || anyMutating}
                    onClick={handleApprove}>
                    {approveMutation.isPending
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Check className="w-3.5 h-3.5" />}
                    Approve Request
                  </Button>
                </>
              )}

              {payout.status === 'approved' && (
                <Button variant="secondary" size="sm"
                  onClick={handleMarkProcessing}
                  disabled={anyMutating}
                  className="gap-1.5">
                  {processingMutation.isPending
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Activity className="w-3.5 h-3.5" />}
                  Mark Processing
                </Button>
              )}

              {canTransfer && (
                <Button size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  onClick={() => setTransferOpen(true)}
                  disabled={anyMutating}>
                  <Send className="w-3.5 h-3.5" />Initiate Transfer
                </Button>
              )}

              {canComplete && (
                <Button size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5"
                  onClick={handleComplete}
                  disabled={anyMutating}>
                  {completeMutation.isPending
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Complete Payout
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Payout Summary */}
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-500" />Payout Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Requested Amount</p>
                    <p className="text-3xl font-bold mt-1 text-slate-900">{formatCurrency(payout.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Transaction Ref</p>
                    {payout.transaction_reference
                      ? <p className="font-mono text-sm font-semibold text-slate-800 mt-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          {payout.transaction_reference}
                        </p>
                      : <p className="text-sm font-medium mt-1 text-slate-400">—</p>}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Request Date</p>
                    <p className="text-sm font-medium mt-1">{formatDateTime(payout.requested_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">User Type</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {payout.user_type === 'vendor'
                        ? <Building2 className="w-4 h-4 text-blue-500" />
                        : <User className="w-4 h-4 text-emerald-500" />}
                      <span className="text-sm font-medium capitalize">{payout.user_type}</span>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                {payout.admin_notes && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-xs text-amber-700 font-medium mb-1">Admin Notes</p>
                    <p className="text-sm text-amber-800">{payout.admin_notes}</p>
                  </div>
                )}
                {!isTerminal && (
                  <Button variant="ghost" size="sm" className="mt-3 text-xs text-slate-500 gap-1.5 h-7"
                    onClick={() => { setAdminNotes(payout.admin_notes ?? ''); setNotesOpen(true); }}>
                    <Info className="w-3.5 h-3.5" />
                    {payout.admin_notes ? 'Edit Notes' : 'Add Admin Notes'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Wallet + Bank side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wallet Snapshot */}
              <Card className="border-slate-200 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-slate-500" />Wallet Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Available Balance', value: payout.wallet.available_balance, cls: 'font-bold text-slate-900' },
                    { label: 'Pending Settlements', value: payout.wallet.pending_balance, cls: 'font-semibold text-amber-600' },
                    { label: 'Lifetime Earnings', value: payout.wallet.lifetime_earnings, cls: 'font-semibold text-slate-700' },
                    { label: 'Total Withdrawn', value: payout.wallet.total_withdrawn, cls: 'font-semibold text-slate-500' },
                  ].map((item, i) => (
                    <div key={i} className={`flex justify-between items-center ${i < 3 ? 'pb-3 border-b border-slate-100' : ''}`}>
                      <span className="text-sm text-slate-500">{item.label}</span>
                      <span className={`text-sm ${item.cls}`}>{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card className={`border-slate-200 shadow-none ${!payout.bank?.is_verified ? 'border-red-200' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-500" />Bank Information
                    </CardTitle>
                    {payout.bank ? (
                      payout.bank.is_verified
                        ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs">
                            <ShieldCheck className="w-3 h-3" />Verified
                          </Badge>
                        : <Badge variant="destructive" className="gap-1 text-xs">
                            <ShieldX className="w-3 h-3" />Unverified
                          </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500 text-xs">Not Added</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2.5">
                  {payout.bank ? (
                    <>
                      {[
                        { label: 'Holder', value: payout.bank.account_holder_name },
                        { label: 'Bank', value: payout.bank.bank_name },
                        { label: 'Account', value: payout.bank.account_number },
                        { label: 'IFSC', value: payout.bank.ifsc_code },
                        ...(payout.bank.branch ? [{ label: 'Branch', value: payout.bank.branch }] : []),
                        ...(payout.bank.upi_id ? [{ label: 'UPI ID', value: payout.bank.upi_id }] : []),
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-slate-500">{label}:</span>
                          <span className="font-medium font-mono text-xs">{value}</span>
                        </div>
                      ))}

                      {!payout.bank.is_verified && (
                        <Alert className="mt-3 py-2 px-3 border-red-200 bg-red-50">
                          <Info className="h-3.5 w-3.5 text-red-500" />
                          <AlertDescription className="text-xs text-red-700">
                            Bank must be verified before approval.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-400 text-sm py-4 text-center">No bank details found</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Ledger */}
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-slate-500" />Recent Ledger
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                      <TableHead className="pl-6 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Type</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Description</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Order</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</TableHead>
                      <TableHead className="pr-6 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Balance After</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payout.recent_transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-400 py-8 text-sm">
                          No recent transactions
                        </TableCell>
                      </TableRow>
                    ) : (
                      payout.recent_transactions.map((txn) => (
                        <TableRow key={txn.id} className="border-b border-slate-100 last:border-0">
                          <TableCell className="pl-6 py-3">
                            <Badge variant="outline" className={`text-xs ${
                              txn.transaction_type === 'credit'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-red-200 bg-red-50 text-red-700'
                            }`}>
                              {txn.transaction_type === 'credit' ? 'Credit' : 'Debit'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-xs text-slate-600 max-w-[160px] truncate">
                            {txn.description}
                          </TableCell>
                          <TableCell className="py-3 text-xs font-mono text-slate-500">
                            {txn.order_id ? txn.order_id.slice(0, 8) + '…' : '—'}
                          </TableCell>
                          <TableCell className={`py-3 text-right text-sm font-semibold ${
                            txn.transaction_type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {txn.transaction_type === 'credit' ? '+' : '-'}
                            {formatCurrency(txn.amount)}
                          </TableCell>
                          <TableCell className="pr-6 py-3 text-right text-sm font-medium text-slate-700">
                            {formatCurrency(txn.balance_after)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* ── Right Column: Lifecycle ── */}
          <div>
            <Card className="border-slate-200 shadow-none sticky top-28">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />Lifecycle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-1">
                  <TimelineItem
                    title="Payout Requested"
                    date={payout.requested_at}
                    completed
                  />

                  {payout.status === 'rejected' ? (
                    <TimelineItem
                      title="Rejected"
                      date={payout.rejected_at}
                      active isLast
                    />
                  ) : (
                    <>
                      <TimelineItem
                        title="Approved by Admin"
                        date={payout.approved_at}
                        completed={!!payout.approved_at}
                        active={payout.status === 'approved'}
                      />
                      <TimelineItem
                        title="Payment Processing"
                        completed={['transferred', 'completed'].includes(payout.status)}
                        active={payout.status === 'processing'}
                      />
                      <TimelineItem
                        title="Funds Transferred"
                        date={payout.transferred_at}
                        completed={['transferred', 'completed'].includes(payout.status)}
                        active={payout.status === 'transferred'}
                      />
                      <TimelineItem
                        title="Payment Confirmed"
                        date={payout.completed_at}
                        completed={payout.status === 'completed'}
                        active={payout.status === 'completed'}
                        isLast
                      />
                    </>
                  )}
                </div>

                {payout.status === 'rejected' && payout.rejection_reason && (
                  <div className="mt-4 p-3.5 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-tight mb-1.5">
                      Rejection Reason
                    </p>
                    <p className="text-sm text-red-800">{payout.rejection_reason}</p>
                  </div>
                )}

                {payout.transaction_reference && (
                  <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-tight mb-1.5">
                      Transaction Reference
                    </p>
                    <p className="font-mono text-sm font-bold text-slate-800">
                      {payout.transaction_reference}
                    </p>
                  </div>
                )}

                {/* Quick action buttons in sidebar */}
                {!isTerminal && (
                  <div className="mt-6 space-y-2">
                    {payout.status === 'pending' && canApprove && (
                      <Button
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-sm h-9"
                        onClick={handleApprove}
                        disabled={anyMutating}>
                        {approveMutation.isPending
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Check className="w-4 h-4" />}
                        Approve Request
                      </Button>
                    )}
                    {payout.status === 'approved' && (
                      <Button
                        className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-sm h-9"
                        onClick={handleMarkProcessing}
                        disabled={anyMutating}>
                        {processingMutation.isPending
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Activity className="w-4 h-4" />}
                        Mark as Processing
                      </Button>
                    )}
                    {canTransfer && (
                      <Button
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-sm h-9"
                        onClick={() => setTransferOpen(true)}
                        disabled={anyMutating}>
                        <Send className="w-4 h-4" />Initiate Transfer
                      </Button>
                    )}
                    {canComplete && (
                      <Button
                        className="w-full gap-2 bg-slate-900 hover:bg-slate-800 text-sm h-9"
                        onClick={handleComplete}
                        disabled={anyMutating}>
                        {completeMutation.isPending
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <CheckCircle2 className="w-4 h-4" />}
                        Complete Payout
                      </Button>
                    )}
                    {payout.status === 'pending' && (
                      <Button
                        variant="outline" className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 text-sm h-9"
                        onClick={() => setRejectOpen(true)}
                        disabled={anyMutating}>
                        <XCircle className="w-4 h-4" />Reject Request
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />Reject Payout Request
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              This cannot be undone. Provide a clear reason for the record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-1">
            <Label className="text-xs font-medium text-slate-700">
              Rejection Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Account details mismatch, bank verification pending…"
              className="resize-none text-sm min-h-[100px]"
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              className="gap-1.5">
              {rejectMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-cyan-600" />Bank Transfer Confirmation
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Enter the UTR / transaction reference from your banking portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-1">
            <Label className="text-xs font-medium text-slate-700">
              Transaction Reference <span className="text-red-500">*</span>
            </Label>
            <Input value={txnRef} onChange={(e) => setTxnRef(e.target.value)}
              placeholder="UTR Number / Ref Number" className="text-sm" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setTransferOpen(false); setTxnRef(''); }}>Cancel</Button>
            <Button onClick={handleTransfer}
              disabled={!txnRef.trim() || transferMutation.isPending}
              className="gap-1.5 bg-cyan-600 hover:bg-cyan-700">
              {transferMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Mark as Transferred
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Notes Dialog */}
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-slate-500" />Admin Notes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-1">
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about this payout…"
              className="resize-none text-sm min-h-[100px]"
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNotesOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNotes}
              disabled={notesMutation.isPending} className="gap-1.5">
              {notesMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}