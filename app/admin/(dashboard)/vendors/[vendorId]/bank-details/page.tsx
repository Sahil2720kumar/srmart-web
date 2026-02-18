'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, CreditCard, ShieldCheck, ShieldX, ShieldAlert,
  Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Loader2,
  Fingerprint, Hash, Landmark, MapPin, Wallet, CalendarDays, User,
  ToggleLeft, ToggleRight, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useVendorBankDetail,
  useUpdateBankVerificationStatus,
  useToggleBankVerified,
  BankVerificationStatus,
} from '@/hooks/'
import { useAuth } from '@/providers/AuthProvider';

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmt = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

const maskAccount = (n: string) =>
  n.length > 4 ? '•'.repeat(n.length - 4) + n.slice(-4) : n;

// ─── Status config ─────────────────────────────────────────────────────────

const STATUS_CFG: Record<BankVerificationStatus, {
  label: string;
  icon: React.ReactNode;
  badgeCls: string;
  ringCls: string;
}> = {
  pending: {
    label: 'Pending Review',
    icon: <Clock className="w-4 h-4" />,
    badgeCls: 'border-amber-200 bg-amber-50 text-amber-700',
    ringCls: 'ring-amber-200 bg-amber-50',
  },
  approved: {
    label: 'Approved',
    icon: <CheckCircle2 className="w-4 h-4" />,
    badgeCls: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    ringCls: 'ring-emerald-200 bg-emerald-50',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle className="w-4 h-4" />,
    badgeCls: 'border-red-200 bg-red-50 text-red-700',
    ringCls: 'ring-red-200 bg-red-50',
  },
};

const StatusBadge = ({ status }: { status: BankVerificationStatus }) => {
  const cfg = STATUS_CFG[status];
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium text-xs px-2.5 py-1', cfg.badgeCls)}>
      {cfg.icon}{cfg.label}
    </Badge>
  );
};

// ─── Info row ─────────────────────────────────────────────────────────────────

const InfoRow = ({
  icon: Icon, label, value, mono,
}: {
  icon: React.ElementType; label: string; value: React.ReactNode; mono?: boolean;
}) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
    <div className="p-1.5 bg-slate-100 rounded-md mt-0.5 flex-shrink-0">
      <Icon className="w-3.5 h-3.5 text-slate-600" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={cn('text-sm font-medium text-slate-900 break-all', mono && 'font-mono tracking-wide')}>
        {value ?? '—'}
      </p>
    </div>
  </div>
);

// ─── Reject Dialog ─────────────────────────────────────────────────────────────

const RejectDialog = ({
  open, onClose, onConfirm, isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) => {
  const [reason, setReason] = useState('');
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />Reject Bank Details
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Provide a clear reason. The vendor will see this when reviewing their bank details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-1">
          <Label className="text-xs font-medium text-slate-700">
            Rejection Reason <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Account number doesn't match provided proof, IFSC code invalid…"
            className="resize-none text-sm min-h-[100px]"
            rows={4}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={!reason.trim() || isPending}
            onClick={() => onConfirm(reason)} className="gap-1.5">
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Reject Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VendorBankDetailsPage() {
  const router = useRouter();
  const {user}=useAuth()
  const { vendorId } = useParams<{ vendorId: string }>();

  const { data: bank, isLoading, error, refetch } = useVendorBankDetail(vendorId);

  const updateStatus = useUpdateBankVerificationStatus();
  const toggleVerified = useToggleBankVerified();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BankVerificationStatus | null>(null);

  // ── Handlers ──────────────────────────────

  const handleApprove = async () => {
    if (!bank) return;
    try {
      await updateStatus.mutateAsync({
        bankDetailId: bank.id,
        vendorId: bank.vendor_id,
        status: 'approved',
        verifiedBy:user?.id
      });
      toast.success('Bank details approved and verified');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to approve');
    }
  };

  const handleReject = async (reason: string) => {
    if (!bank) return;
    try {
      await updateStatus.mutateAsync({
        bankDetailId: bank.id,
        vendorId: bank.vendor_id,
        status: 'rejected',
        rejectionReason: reason,
        verifiedBy:user?.id
      });
      toast.success('Bank details rejected');
      setRejectOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to reject');
    }
  };

  const handleStatusChange = async (status: BankVerificationStatus) => {
    if (status === 'rejected') {
      setPendingStatus(null);
      setRejectOpen(true);
      return;
    }
    if (!bank) return;
    try {
      await updateStatus.mutateAsync({
        bankDetailId: bank.id,
        vendorId: bank.vendor_id,
        status,
        verifiedBy:user?.id
      });
      toast.success(`Status updated to ${status}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update status');
    }
  };

  const handleToggleVerified = async () => {
    if (!bank) return;
    const newValue = !bank.is_verified;
    try {
      await toggleVerified.mutateAsync({
        bankDetailId: bank.id,
        vendorId: bank.vendor_id,
        isVerified: newValue,
        verifiedBy:user?.id
      });
      toast.success(newValue ? 'Marked as verified' : 'Verification removed');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update');
    }
  };

  const anyMutating = updateStatus.isPending || toggleVerified.isPending;

  // ── Loading / Error ────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-9 w-40" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-72 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !bank) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-slate-600">No bank details found for this vendor.</p>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CFG[bank.status];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Header */}
      <div className=" ">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full -ml-2"
                onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="p-1.5 bg-slate-900 rounded-lg">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900">Bank Details</h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Vendor ID: <span className="font-mono">{bank.vendor_id.slice(0, 8)}…</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}
                disabled={anyMutating}
                className="gap-1.5 text-xs h-8 border-slate-200 text-slate-600">
                <RefreshCw className="w-3.5 h-3.5" />Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Bank Info + Proof ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Status banner */}
            <div className={cn(
              'flex items-center gap-3 p-4 rounded-xl border ring-1',
              statusCfg.ringCls
            )}>
              <div className={cn('p-2.5 rounded-xl', statusCfg.badgeCls)}>
                {bank.status === 'approved'
                  ? <ShieldCheck className="w-5 h-5" />
                  : bank.status === 'rejected'
                  ? <ShieldX className="w-5 h-5" />
                  : <ShieldAlert className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {bank.status === 'approved'
                    ? 'Bank details verified and approved'
                    : bank.status === 'rejected'
                    ? 'Bank details were rejected'
                    : 'Awaiting admin review'}
                </p>
                {bank.status === 'rejected' && bank.rejection_reason && (
                  <p className="text-xs text-red-600 mt-0.5">{bank.rejection_reason}</p>
                )}
                {bank.status === 'approved' && bank.verified_at && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Verified {fmt(bank.verified_at)}
                    {bank.verified_by ? ` by ${bank.verified_by}` : ''}
                  </p>
                )}
              </div>
              <StatusBadge status={bank.status} />
            </div>

            {/* Bank info card */}
            <Card className="border-slate-200 shadow-none bg-white">
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-slate-500" />
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Bank Account Information
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <InfoRow icon={User} label="Account Holder" value={bank.account_holder_name} />
                <InfoRow icon={Landmark} label="Bank Name" value={bank.bank_name} />
                <InfoRow icon={Hash} label="Account Number"
                  value={
                    <span className="flex items-center gap-2">
                      <span className="tracking-widest text-slate-400 text-xs">
                        {maskAccount(bank.account_number)}
                      </span>
                      <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 capitalize">
                        {bank.account_type ?? 'savings'}
                      </span>
                    </span>
                  }
                  mono
                />
                <InfoRow icon={Fingerprint} label="IFSC Code" value={bank.ifsc_code} mono />
                {bank.branch && (
                  <InfoRow icon={MapPin} label="Branch" value={bank.branch} />
                )}
                {bank.upi_id && (
                  <InfoRow icon={Wallet} label="UPI ID" value={bank.upi_id} mono />
                )}
              </CardContent>
            </Card>

            {/* Proof image / timestamps */}
            <Card className="border-slate-200 shadow-none bg-white">
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-slate-500" />
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Record Details
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <InfoRow icon={CalendarDays} label="Submitted At" value={fmt(bank.created_at)} />
                <InfoRow icon={CalendarDays} label="Last Updated" value={fmt(bank.updated_at)} />
                {bank.verified_at && (
                  <InfoRow icon={ShieldCheck} label="Verified At" value={fmt(bank.verified_at)} />
                )}
                {bank.verified_by && (
                  <InfoRow icon={User} label="Verified By" value={bank.verified_by} />
                )}

                {/* Proof image */}
                {bank.proof_image ? (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-2">Bank Proof Document</p>
                    <a href={bank.proof_image} target="_blank" rel="noreferrer"
                      className="block rounded-xl overflow-hidden border border-slate-200 hover:border-slate-400 transition-colors">
                      <img src={bank.proof_image} alt="Bank proof"
                        className="w-full max-h-56 object-contain bg-slate-50" />
                    </a>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-dashed border-slate-300">
                    <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <p className="text-xs text-slate-500">No proof document uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right: Admin Controls ── */}
          <div className="space-y-5">

            {/* Quick stats */}
            <Card className="border-slate-200 shadow-none bg-white">
              <CardContent className="pt-5 pb-4 px-5 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Verification Status</p>
                  <div className="flex items-center gap-2">
                    {bank.is_verified
                      ? <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      : <ShieldX className="w-5 h-5 text-slate-400" />}
                    <span className={cn(
                      'text-sm font-semibold',
                      bank.is_verified ? 'text-emerald-700' : 'text-slate-500'
                    )}>
                      {bank.is_verified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1.5">Review Status</p>
                  <StatusBadge status={bank.status} />
                </div>
              </CardContent>
            </Card>

            {/* Admin Controls Card */}
            <Card className="border-orange-200 shadow-none bg-white">
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Admin Controls
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Update review status and verification for this bank account.
                </p>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">

                {/* Status select */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700">Review Status</Label>
                  <Select
                    value={bank.status}
                    onValueChange={(v) => handleStatusChange(v as BankVerificationStatus)}
                    disabled={anyMutating}
                  >
                    <SelectTrigger className="h-9 text-sm border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <span className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Pending Review
                        </span>
                      </SelectItem>
                      <SelectItem value="approved">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Approved
                        </span>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <span className="flex items-center gap-2">
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                          Rejected
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-slate-400">
                    Approving will also set <span className="font-medium text-emerald-600">is_verified = true</span>
                  </p>
                </div>

                {/* is_verified toggle */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <Label className="text-xs font-medium text-slate-700">Bank Verified</Label>
                  <button
                    onClick={handleToggleVerified}
                    disabled={anyMutating}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-all text-sm',
                      bank.is_verified
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100',
                      anyMutating && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="font-medium">
                      {bank.is_verified ? 'Verified ✓' : 'Not Verified'}
                    </span>
                    {toggleVerified.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : bank.is_verified
                      ? <ToggleRight className="w-5 h-5 text-emerald-600" />
                      : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
                  <p className="text-[11px] text-slate-400">
                    Toggle independently of review status if needed
                  </p>
                </div>

                {/* Quick action buttons */}
                {bank.status !== 'approved' && (
                  <div className="pt-2 space-y-2 border-t border-slate-100">
                    <Button
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 h-9 text-sm"
                      onClick={handleApprove}
                      disabled={anyMutating}>
                      {updateStatus.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ShieldCheck className="w-4 h-4" />}
                      Approve Bank Details
                    </Button>

                    {bank.status !== 'rejected' && (
                      <Button
                        variant="outline"
                        className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 h-9 text-sm"
                        onClick={() => setRejectOpen(true)}
                        disabled={anyMutating}>
                        <ShieldX className="w-4 h-4" />
                        Reject Bank Details
                      </Button>
                    )}
                  </div>
                )}

                {bank.status === 'approved' && (
                  <Alert className="border-emerald-200 bg-emerald-50">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-xs text-emerald-700">
                      These bank details are approved. Vendor can receive payouts.
                    </AlertDescription>
                  </Alert>
                )}

                {bank.status === 'rejected' && (
                  <div className="pt-2 border-t border-slate-100">
                    <Button
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 h-9 text-sm"
                      onClick={handleApprove}
                      disabled={anyMutating}>
                      {updateStatus.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ShieldCheck className="w-4 h-4" />}
                      Approve Anyway
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rejection reason display */}
            {bank.rejection_reason && (
              <Card className="border-red-200 shadow-none bg-red-50">
                <CardContent className="pt-4 pb-4 px-5">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason</p>
                      <p className="text-xs text-red-600 leading-relaxed">{bank.rejection_reason}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Reject dialog */}
      <RejectDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        isPending={updateStatus.isPending}
      />
    </div>
  );
}