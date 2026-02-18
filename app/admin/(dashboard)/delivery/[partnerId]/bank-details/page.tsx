'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CreditCard, ShieldCheck, ShieldX, ShieldAlert,
  Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Loader2,
  Fingerprint, Hash, Landmark, MapPin, Wallet, CalendarDays, User,
  ToggleLeft, ToggleRight, Info, Phone, Mail, Star, Bike,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  useDeliveryBankDetail,
  useDeliveryBoyInfo,
  useUpdateDeliveryBankStatus,
  useToggleDeliveryBankVerified,
  BankVerificationStatus,
} from '@/hooks';
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

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<BankVerificationStatus, {
  label: string; icon: React.ReactNode;
  badgeCls: string; ringCls: string;
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

// ─── Reject Dialog ────────────────────────────────────────────────────────────

const RejectDialog = ({
  open, onClose, onConfirm, isPending,
}: {
  open: boolean; onClose: () => void;
  onConfirm: (reason: string) => void; isPending: boolean;
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
            Provide a clear reason. The delivery partner will see this when reviewing their bank details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-1">
          <Label className="text-xs font-medium text-slate-700">
            Rejection Reason <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Account number doesn't match proof, IFSC code is invalid…"
            className="resize-none text-sm min-h-[100px]"
            rows={4}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={!reason.trim() || isPending}
            onClick={() => { onConfirm(reason); setReason(''); }} className="gap-1.5">
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Reject Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DeliveryBankDetailsPage() {
  const {user}=useAuth()
  const router = useRouter();
  const { partnerId:deliveryBoyId } = useParams<{ partnerId: string }>();

  const { data: bank, isLoading: bankLoading, error: bankError, refetch } = useDeliveryBankDetail(deliveryBoyId);
  const { data: partner, isLoading: partnerLoading } = useDeliveryBoyInfo(deliveryBoyId);

  
  const updateStatus = useUpdateDeliveryBankStatus();
  const toggleVerified = useToggleDeliveryBankVerified();

  const [rejectOpen, setRejectOpen] = useState(false);

  const anyMutating = updateStatus.isPending || toggleVerified.isPending;

  // ── Handlers ──────────────────────────────

  const handleApprove = async () => {
    if (!bank) return;
    try {
      await updateStatus.mutateAsync({ bankDetailId: bank.id, deliveryBoyId: bank.delivery_boy_id, status: 'approved',verifiedBy:user?.id });
      toast.success('Bank details approved and verified');
    } catch (e: any) { toast.error(e.message ?? 'Failed to approve'); }
  };

  const handleReject = async (reason: string) => {
    if (!bank) return;
    try {
      await updateStatus.mutateAsync({ bankDetailId: bank.id, deliveryBoyId: bank.delivery_boy_id, status: 'rejected', rejectionReason: reason,verifiedBy:user?.id });
      toast.success('Bank details rejected');
      setRejectOpen(false);
    } catch (e: any) { toast.error(e.message ?? 'Failed to reject'); }
  };

  const handleStatusChange = async (status: BankVerificationStatus) => {
    if (status === 'rejected') { setRejectOpen(true); return; }
    if (!bank) return;
    try {
      await updateStatus.mutateAsync({ bankDetailId: bank.id, deliveryBoyId: bank.delivery_boy_id, status ,verifiedBy:user?.id});
      toast.success(`Status updated to ${status}`);
    } catch (e: any) { toast.error(e.message ?? 'Failed to update'); }
  };

  const handleToggleVerified = async () => {
    if (!bank) return;
    const newVal = !bank.is_verified;
    try {
      await toggleVerified.mutateAsync({ bankDetailId: bank.id, deliveryBoyId: bank.delivery_boy_id, isVerified: newVal,verifiedBy:user?.id });
      toast.success(newVal ? 'Marked as verified' : 'Verification removed');
    } catch (e: any) { toast.error(e.message ?? 'Failed to update'); }
  };

  // ── Loading ────────────────────────────────

  if (bankLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-24 rounded-xl" />
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

  if (bankError || !bank) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-slate-600">No bank details found for this delivery partner.</p>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CFG[bank.status];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">

      {/* Sticky Header */}
      <div className="">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="p-1.5 bg-indigo-600 rounded-lg">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900">Bank Details</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Delivery Partner</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={anyMutating}
              className="gap-1.5 text-xs h-8 border-slate-200 text-slate-600">
              <RefreshCw className="w-3.5 h-3.5" />Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* Partner identity card */}
        <Card className="border-slate-200 shadow-none bg-white">
          <CardContent className="pt-5 pb-5 px-5">
            {partnerLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ) : partner ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-slate-100">
                    <AvatarImage src={partner.profile_image ?? ''} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold text-base">
                      {getInitials(partner.first_name, partner.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-slate-900">
                        {partner.first_name} {partner.last_name}
                      </h2>
                      <Badge variant="outline" className={cn(
                        'text-xs gap-1',
                        partner.is_online
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      )}>
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          partner.is_online ? 'bg-emerald-500' : 'bg-slate-400'
                        )} />
                        {partner.is_online ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {partner.phone && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{partner.phone}
                        </span>
                      )}
                      {partner.email && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />{partner.email}
                        </span>
                      )}
                      {partner.rating !== null && (
                        <span className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {partner.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bike className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500 font-mono">
                    ID: {deliveryBoyId.slice(0, 8)}…
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Partner info unavailable</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left: Details ── */}
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {bank.status === 'approved'
                    ? 'Bank details verified and approved'
                    : bank.status === 'rejected'
                    ? 'Bank details were rejected'
                    : 'Awaiting admin review'}
                </p>
                {bank.status === 'rejected' && bank.rejection_reason && (
                  <p className="text-xs text-red-600 mt-0.5 truncate">{bank.rejection_reason}</p>
                )}
                {bank.status === 'approved' && bank.verified_at && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Verified {fmt(bank.verified_at)}{bank.verified_by ? ` by ${bank.verified_by}` : ''}
                  </p>
                )}
              </div>
              <StatusBadge status={bank.status} />
            </div>

            {/* Bank info */}
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
                <InfoRow
                  icon={Hash} label="Account Number"
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
                {bank.branch && <InfoRow icon={MapPin} label="Branch" value={bank.branch} />}
                {bank.upi_id && <InfoRow icon={Wallet} label="UPI ID" value={bank.upi_id} mono />}
              </CardContent>
            </Card>

            {/* Record details + proof */}
            <Card className="border-slate-200 shadow-none bg-white">
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-slate-500" />
                  <CardTitle className="text-sm font-semibold text-slate-900">Record Details</CardTitle>
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

            {/* Quick status snapshot */}
            <Card className="border-slate-200 shadow-none bg-white">
              <CardContent className="pt-5 pb-5 px-5 space-y-4">
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

            {/* Admin controls */}
            <Card className="border-orange-200 shadow-none bg-white">
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  <CardTitle className="text-sm font-semibold text-slate-900">Admin Controls</CardTitle>
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
                          <Clock className="w-3.5 h-3.5 text-amber-500" />Pending Review
                        </span>
                      </SelectItem>
                      <SelectItem value="approved">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Approved
                        </span>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <span className="flex items-center gap-2">
                          <XCircle className="w-3.5 h-3.5 text-red-500" />Rejected
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-slate-400">
                    Approving sets <span className="font-medium text-emerald-600">is_verified = true</span>
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
                    Toggle independently of review status
                  </p>
                </div>

                {/* Quick actions */}
                {bank.status !== 'approved' && (
                  <div className="pt-2 space-y-2 border-t border-slate-100">
                    <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 h-9 text-sm"
                      onClick={handleApprove} disabled={anyMutating}>
                      {updateStatus.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ShieldCheck className="w-4 h-4" />}
                      Approve Bank Details
                    </Button>
                    {bank.status !== 'rejected' && (
                      <Button variant="outline"
                        className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 h-9 text-sm"
                        onClick={() => setRejectOpen(true)} disabled={anyMutating}>
                        <ShieldX className="w-4 h-4" />Reject Bank Details
                      </Button>
                    )}
                  </div>
                )}

                {bank.status === 'approved' && (
                  <Alert className="border-emerald-200 bg-emerald-50">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-xs text-emerald-700">
                      Approved. This partner can receive payouts.
                    </AlertDescription>
                  </Alert>
                )}

                {bank.status === 'rejected' && (
                  <div className="pt-2 border-t border-slate-100">
                    <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 h-9 text-sm"
                      onClick={handleApprove} disabled={anyMutating}>
                      {updateStatus.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ShieldCheck className="w-4 h-4" />}
                      Approve Anyway
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rejection reason card */}
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

      <RejectDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        isPending={updateStatus.isPending}
      />
    </div>
  );
}