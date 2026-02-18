'use client';

import React, { useState } from 'react';
import {
  DollarSign, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle,
  Eye, Check, X, Send, ArrowUpRight, Filter, Search, Download,
  MoreVertical, User, Building2, CreditCard, Banknote, Activity,
  Wallet, RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  usePayoutRequests, usePayoutMetrics,
  useApprovePayout, useMarkProcessingPayout, useMarkTransferredPayout,
  useCompletePayout, useRejectPayout,
  PayoutCashoutRequest, PayoutStatus,
} from '@/hooks';

// ─── Utilities ────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatDateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

const STATUS_CONFIG: Record<PayoutStatus, {
  label: string;
  className: string;
  icon: React.ReactNode;
}> = {
  pending:    { label: 'Pending',    className: 'border-amber-200 bg-amber-50 text-amber-700',   icon: <Clock className="w-3 h-3" /> },
  approved:   { label: 'Approved',   className: 'border-blue-200 bg-blue-50 text-blue-700',      icon: <CheckCircle2 className="w-3 h-3" /> },
  processing: { label: 'Processing', className: 'border-violet-200 bg-violet-50 text-violet-700', icon: <Activity className="w-3 h-3" /> },
  transferred:{ label: 'Transferred',className: 'border-cyan-200 bg-cyan-50 text-cyan-700',      icon: <Send className="w-3 h-3" /> },
  completed:  { label: 'Completed',  className: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected:   { label: 'Rejected',   className: 'border-red-200 bg-red-50 text-red-700',         icon: <XCircle className="w-3 h-3" /> },
  cancelled:  { label: 'Cancelled',  className: 'border-slate-200 bg-slate-50 text-slate-500',   icon: <XCircle className="w-3 h-3" /> },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: PayoutStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`gap-1.5 font-medium text-xs px-2.5 py-1 ${cfg.className}`}>
      {cfg.icon}{cfg.label}
    </Badge>
  );
};

const MetricCard = ({
  title, value, subtitle, icon: Icon, iconBg, delta,
}: {
  title: string; value: string; subtitle?: string;
  icon: React.ElementType; iconBg: string; delta?: string;
}) => (
  <Card className="border-slate-200/80 shadow-none hover:shadow-md transition-all bg-white">
    <CardContent className="pt-5 pb-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        {delta && (
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight className="w-3 h-3" />{delta}
          </span>
        )}
      </div>
      <p className="text-[13px] font-medium text-slate-500 mb-0.5">{title}</p>
      <p className="text-xl font-bold text-slate-900 tracking-tight">{value}</p>
      {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
    </CardContent>
  </Card>
);

const MetricSkeleton = () => (
  <Card className="border-slate-200/80 shadow-none bg-white">
    <CardContent className="pt-5 pb-5 space-y-3">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-6 w-20" />
    </CardContent>
  </Card>
);

// Timeline modal
const TimelineModal = ({
  request,
  open,
  onClose,
}: {
  request: PayoutCashoutRequest | null
  open: boolean
  onClose: () => void
}) => {
  if (!request) return null

  const isRejected = request.status === "rejected"
  const isCancelled = request.status === "cancelled"

  const steps = [
    {
      key: "requested",
      label: "Request Submitted",
      ts: request.requested_at,
      done: true,
    },
    {
      key: "approved",
      label: "Admin Approved",
      ts: request.approved_at,
      done: !!request.approved_at,
    },
    {
      key: "processing",
      label: "Payment Processing",
      ts: request.approved_at,
      done: ["processing", "transferred", "completed"].includes(
        request.status
      ),
    },
    {
      key: "transferred",
      label: "Funds Transferred",
      ts: request.transferred_at,
      done: !!request.transferred_at,
    },
    {
      key: "completed",
      label: "Payment Confirmed",
      ts: request.completed_at,
      done: !!request.completed_at,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-100 rounded-lg mt-0.5">
              <Activity className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">
                Payment Timeline
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                {request.request_number}
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-5">
            {/* Amount Card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-6">
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <Banknote className="w-4 h-4 text-slate-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Cashout Amount</p>
                <p className="text-base font-bold text-slate-900">
                  {formatCurrency(request.amount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">
                  {request.user_name}
                </p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {request.user_type === "vendor" ? (
                    <Building2 className="w-3 h-3 text-slate-400" />
                  ) : (
                    <User className="w-3 h-3 text-slate-400" />
                  )}
                  <span className="text-xs font-medium text-slate-600 capitalize">
                    {request.user_type}
                  </span>
                </div>
              </div>
            </div>

            {/* Rejected */}
            {isRejected ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Request Rejected
                    </p>
                    {request.rejected_at && (
                      <p className="text-xs text-red-600">
                        {formatDateTime(request.rejected_at)}
                      </p>
                    )}
                  </div>
                </div>
                {request.rejection_reason && (
                  <p className="text-sm text-red-700 pl-8">
                    {request.rejection_reason}
                  </p>
                )}
              </div>
            ) : isCancelled ? (
              /* Cancelled */
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <XCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Request Cancelled
                    </p>
                    {request.cancelled_at && (
                      <p className="text-xs text-amber-600">
                        {formatDateTime(request.cancelled_at)}
                      </p>
                    )}
                  </div>
                </div>
                {request.cancellation_reason && (
                  <p className="text-sm text-amber-700 pl-8">
                    {request.cancellation_reason}
                  </p>
                )}
              </div>
            ) : (
              /* Normal Timeline */
              <div className="space-y-0">
                {steps.map((step, i) => (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                          step.done
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-white border-slate-200 text-slate-300"
                        }`}
                      >
                        {step.done ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        )}
                      </div>

                      {i < steps.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 my-1 min-h-[24px] ${
                            step.done
                              ? "bg-emerald-400"
                              : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>

                    <div
                      className={`pb-5 pt-1 ${
                        i === steps.length - 1 ? "pb-1" : ""
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          step.done
                            ? "text-slate-900"
                            : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </p>

                      {step.done && step.ts ? (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDateTime(step.ts)}
                        </p>
                      ) : (
                        !step.done && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Awaiting
                          </p>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Extra Details */}
            {(request.transaction_reference ||
              request.admin_notes) && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                {request.transaction_reference && (
                  <div>
                    <Label className="text-xs text-slate-500">
                      Transaction Reference
                    </Label>
                    <p className="font-mono text-xs font-semibold text-slate-800 mt-1 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">
                      {request.transaction_reference}
                    </p>
                  </div>
                )}

                {request.admin_notes && (
                  <div>
                    <Label className="text-xs text-slate-500">
                      Admin Notes
                    </Label>
                    <p className="text-sm text-slate-700 mt-1">
                      {request.admin_notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}


// Transfer Reference Dialog
const TransferDialog = ({
  open, onClose, onConfirm, isPending,
}: {
  open: boolean; onClose: () => void;
  onConfirm: (ref: string) => void; isPending: boolean;
}) => {
  const [ref, setRef] = useState('');
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-cyan-600" />
            Mark as Transferred
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Enter the UTR / transaction reference number for this transfer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-1">
          <Label className="text-xs font-medium text-slate-700">
            Transaction Reference <span className="text-red-500">*</span>
          </Label>
          <Input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="e.g. UTR123456789012"
            className="text-sm focus:ring-1 focus:ring-slate-900"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="text-sm">Cancel</Button>
          <Button
            onClick={() => { onConfirm(ref); setRef(''); }}
            disabled={!ref.trim() || isPending}
            className="text-sm gap-1.5 bg-cyan-600 hover:bg-cyan-700"
          >
            <Send className="w-3.5 h-3.5" />
            {isPending ? 'Saving…' : 'Mark Transferred'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Reject Dialog
const RejectDialog = ({
  open, reason, onReasonChange, onConfirm, onCancel, isPending,
}: {
  open: boolean; reason: string; onReasonChange: (v: string) => void;
  onConfirm: () => void; onCancel: () => void; isPending: boolean;
}) => (
  <Dialog open={open} onOpenChange={onCancel}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          Reject Cashout Request
        </DialogTitle>
        <DialogDescription className="text-slate-500 text-sm">
          This action cannot be undone. Please provide a clear reason.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5 py-1">
        <Label className="text-xs font-medium text-slate-700">
          Rejection Reason <span className="text-red-500">*</span>
        </Label>
        <Textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="e.g. Bank verification pending, insufficient documentation…"
          className="resize-none text-sm min-h-[100px] focus:ring-1 focus:ring-slate-900"
          rows={4}
        />
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel} className="text-sm">Cancel</Button>
        <Button
          onClick={onConfirm}
          disabled={!reason.trim() || isPending}
          variant="destructive"
          className="text-sm gap-1.5"
        >
          <XCircle className="w-3.5 h-3.5" />
          {isPending ? 'Rejecting…' : 'Reject Request'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// Row Actions
const RequestActions = ({
  request, onApprove, onMarkProcessing, onMarkTransferred,
  onComplete, onReject, onViewTimeline, onViewDetail, isApproving,
}: {
  request: PayoutCashoutRequest;
  onApprove: () => void; onMarkProcessing: () => void;
  onMarkTransferred: () => void; onComplete: () => void;
  onReject: () => void; onViewTimeline: () => void;
  onViewDetail: () => void; isApproving: boolean;
}) => {
  const isTerminal = ['completed', 'rejected', 'cancelled'].includes(request.status);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100">
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 text-sm">
        <DropdownMenuLabel className="text-xs text-slate-500 font-normal">View</DropdownMenuLabel>
        <DropdownMenuItem onClick={onViewDetail} className="gap-2 cursor-pointer">
          <Eye className="w-3.5 h-3.5 text-slate-500" />View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onViewTimeline} className="gap-2 cursor-pointer">
          <Activity className="w-3.5 h-3.5 text-slate-500" />View Timeline
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer"
          onClick={() => window.location.href = `/admin/${request.user_type}s/${request.user_id}/bank-details`}>
          <CreditCard className="w-3.5 h-3.5 text-slate-500" />Bank Details
        </DropdownMenuItem>

        {!isTerminal && <DropdownMenuSeparator />}

        {request.status === 'pending' && (
          request.bank_verified ? (
            <>
              <DropdownMenuItem onClick={onApprove}
                className="gap-2 cursor-pointer text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50"
                disabled={isApproving}>
                <Check className="w-3.5 h-3.5" />
                {isApproving ? 'Approving…' : 'Approve Request'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onReject}
                className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                <X className="w-3.5 h-3.5" />Reject Request
              </DropdownMenuItem>
            </>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-amber-700 bg-amber-50 rounded mx-1 my-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Bank verification required</span>
            </div>
          )
        )}

        {request.status === 'approved' && (
          <DropdownMenuItem onClick={onMarkProcessing}
            className="gap-2 cursor-pointer text-violet-700 focus:text-violet-700 focus:bg-violet-50">
            <Activity className="w-3.5 h-3.5" />Mark as Processing
          </DropdownMenuItem>
        )}
        {request.status === 'processing' && (
          <DropdownMenuItem onClick={onMarkTransferred}
            className="gap-2 cursor-pointer text-cyan-700 focus:text-cyan-700 focus:bg-cyan-50">
            <Send className="w-3.5 h-3.5" />Mark as Transferred
          </DropdownMenuItem>
        )}
        {request.status === 'transferred' && (
          <DropdownMenuItem onClick={onComplete}
            className="gap-2 cursor-pointer text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50">
            <CheckCircle2 className="w-3.5 h-3.5" />Mark as Completed
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PayoutsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [timelineRequest, setTimelineRequest] = useState<PayoutCashoutRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PayoutCashoutRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [transferTarget, setTransferTarget] = useState<PayoutCashoutRequest | null>(null);

  // Queries
  const { data: requests = [], isLoading, refetch } = usePayoutRequests();
  const { data: metrics, isLoading: metricsLoading } = usePayoutMetrics();

  // Mutations
  const approveMutation = useApprovePayout();
  const processingMutation = useMarkProcessingPayout();
  const transferMutation = useMarkTransferredPayout();
  const completeMutation = useCompletePayout();
  const rejectMutation = useRejectPayout();

  // Filtered list
  const filteredRequests = requests.filter((r) => {
    const matchTab =
      activeTab === 'all'        ? true :
      activeTab === 'vendors'    ? r.user_type === 'vendor' :
      activeTab === 'delivery'   ? r.user_type === 'delivery' :
      r.status === activeTab;
    const matchSearch = !search ||
      r.request_number.toLowerCase().includes(search.toLowerCase()) ||
      r.user_name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const TABS = [
    { id: 'all',        label: 'All',        count: requests.length },
    { id: 'vendors',    label: 'Vendors',    count: requests.filter(r => r.user_type === 'vendor').length },
    { id: 'delivery',   label: 'Delivery',   count: requests.filter(r => r.user_type === 'delivery').length },
    { id: 'pending',    label: 'Pending',    count: requests.filter(r => r.status === 'pending').length },
    { id: 'processing', label: 'Processing', count: requests.filter(r => r.status === 'processing').length },
    { id: 'completed',  label: 'Completed',  count: requests.filter(r => r.status === 'completed').length },
  ];

  // Handlers
  const handleApprove = async (req: PayoutCashoutRequest) => {
    try {
      await approveMutation.mutateAsync({ cashoutId: req.id, approvedBy: 'admin' });
      toast.success(`Approved ₹${req.amount.toLocaleString('en-IN')} for ${req.user_name}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to approve');
    }
  };

  const handleMarkProcessing = async (req: PayoutCashoutRequest) => {
    try {
      await processingMutation.mutateAsync(req.id);
      toast.success('Marked as processing');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update');
    }
  };

  const handleTransfer = async (ref: string) => {
    if (!transferTarget) return;
    try {
      await transferMutation.mutateAsync({ cashoutId: transferTarget.id, transactionReference: ref });
      toast.success('Marked as transferred');
      setTransferTarget(null);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update');
    }
  };

  const handleComplete = async (req: PayoutCashoutRequest) => {
    try {
      await completeMutation.mutateAsync({
        cashoutId: req.id,
        transactionReference: req.transaction_reference ?? '',
      });
      toast.success('Payout completed');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to complete');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectionReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ cashoutId: rejectTarget.id, rejectionReason });
      toast.success('Request rejected');
      setRejectTarget(null);
      setRejectionReason('');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to reject');
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f8f9fb]">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-900 rounded-lg">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Payout Control Center</h1>
                  <p className="text-xs text-slate-500 hidden sm:block">Vendors &amp; delivery partner payouts</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}
                  className="gap-1.5 text-xs h-8 border-slate-200 text-slate-600">
                  <RefreshCw className="w-3.5 h-3.5" />Refresh
                </Button>
                <Button size="sm" className="gap-1.5 text-xs h-8 bg-slate-900 hover:bg-slate-800">
                  <Download className="w-3.5 h-3.5" />Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {metricsLoading ? (
              Array.from({ length: 5 }).map((_, i) => <MetricSkeleton key={i} />)
            ) : (
              <>
                <MetricCard
                  title="Vendor Locked (T+3)"
                  value={formatCurrency(metrics?.vendorPendingBalance ?? 0)}
                  subtitle="Pending settlement"
                  icon={Clock} iconBg="bg-amber-100 text-amber-700"
                />
                <MetricCard
                  title="Vendor Available"
                  value={formatCurrency(metrics?.vendorAvailableBalance ?? 0)}
                  subtitle="Ready to withdraw"
                  icon={DollarSign} iconBg="bg-emerald-100 text-emerald-700"
                />
                <MetricCard
                  title="Delivery Available"
                  value={formatCurrency(metrics?.deliveryAvailableBalance ?? 0)}
                  subtitle="Instant access"
                  icon={Banknote} iconBg="bg-blue-100 text-blue-700"
                />
                <MetricCard
                  title="Pending Payouts"
                  value={formatCurrency(metrics?.pendingAmount ?? 0)}
                  subtitle={`${metrics?.pendingCount ?? 0} awaiting review`}
                  icon={AlertCircle} iconBg="bg-violet-100 text-violet-700"
                />
                <MetricCard
                  title="Settled This Week"
                  value={formatCurrency(metrics?.completedThisWeek ?? 0)}
                  subtitle={`${metrics?.completedCountThisWeek ?? 0} transfers done`}
                  icon={TrendingUp} iconBg="bg-emerald-100 text-emerald-700"
                  delta="+12%"
                />
              </>
            )}
          </div>

          {/* Table Card */}
          <Card className="border-slate-200/80 shadow-none bg-white overflow-hidden">
            <CardHeader className="pb-0 pt-5 px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-[15px] font-semibold text-slate-900">
                  Cashout Requests
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    ({filteredRequests.length} of {requests.length})
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <Input
                      placeholder="Search by name or ID…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 h-8 w-56 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400 rounded-md"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-transparent border-b border-slate-200 rounded-none w-full justify-start h-auto gap-0 p-0 overflow-x-auto flex-nowrap">
                    {TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-0 text-xs font-medium text-slate-500
                          data-[state=active]:border-b-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent
                          data-[state=active]:shadow-none hover:text-slate-700 transition-colors whitespace-nowrap"
                      >
                        {tab.label}
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {tab.count}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                      <TableHead className="pl-6 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-36">Request #</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">User</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Requested</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bank</TableHead>
                      <TableHead className="pr-6 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i} className="border-b border-slate-100">
                          {Array.from({ length: 7 }).map((__, j) => (
                            <TableCell key={j} className="py-4">
                              <Skeleton className="h-4 w-full max-w-[120px]" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16 text-slate-400 text-sm">
                          No requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((req) => (
                        <TableRow key={req.id}
                          className="hover:bg-slate-50/60 transition-colors border-b border-slate-100 last:border-0">
                          <TableCell className="pl-6 py-3.5">
                            <span className="font-mono text-xs font-semibold text-slate-800">{req.request_number}</span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                req.user_type === 'vendor' ? 'bg-blue-100' : 'bg-emerald-100'
                              }`}>
                                {req.user_type === 'vendor'
                                  ? <Building2 className="w-3 h-3 text-blue-600" />
                                  : <User className="w-3 h-3 text-emerald-600" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 leading-none">{req.user_name}</p>
                                <p className="text-[11px] text-slate-400 capitalize mt-0.5">{req.user_type}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5 text-right">
                            <span className="text-sm font-bold text-slate-900">{formatCurrency(req.amount)}</span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <StatusBadge status={req.status} />
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="text-xs text-slate-500">{formatDate(req.requested_at)}</span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <Tooltip>
                              <TooltipTrigger>
                                {req.bank_verified ? (
                                  <div className="flex items-center gap-1.5 text-emerald-600">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">Verified</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-amber-600">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">Pending</span>
                                  </div>
                                )}
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {req.bank_verified ? 'Bank account verified' : 'Bank verification required'}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="pr-6 py-3.5 text-right">
                            <RequestActions
                              request={req}
                              onApprove={() => handleApprove(req)}
                              onMarkProcessing={() => handleMarkProcessing(req)}
                              onMarkTransferred={() => setTransferTarget(req)}
                              onComplete={() => handleComplete(req)}
                              onReject={() => setRejectTarget(req)}
                              onViewTimeline={() => setTimelineRequest(req)}
                              onViewDetail={() => router.push(`/admin/payouts/${req.id}`)}
                              isApproving={approveMutation.isPending && approveMutation.variables?.cashoutId === req.id}
                            />
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

        {/* Modals */}
        <TimelineModal
          request={timelineRequest}
          open={!!timelineRequest}
          onClose={() => setTimelineRequest(null)}
        />
        <TransferDialog
          open={!!transferTarget}
          onClose={() => setTransferTarget(null)}
          onConfirm={handleTransfer}
          isPending={transferMutation.isPending}
        />
        <RejectDialog
          open={!!rejectTarget}
          reason={rejectionReason}
          onReasonChange={setRejectionReason}
          onConfirm={handleReject}
          onCancel={() => { setRejectTarget(null); setRejectionReason(''); }}
          isPending={rejectMutation.isPending}
        />
      </div>
    </TooltipProvider>
  );
}