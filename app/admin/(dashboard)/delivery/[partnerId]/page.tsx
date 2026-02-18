"use client";

import { useState } from "react";
import {
  ChevronLeft, FileText, CheckCircle, XCircle,
  Bike, Loader2, Wifi, WifiOff, ShieldCheck,
  ShieldAlert, ShieldOff, Calendar, Hash,
  AlertTriangle, MapPin, Pencil, BadgeCheck, BadgeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useDeliveryBoyByUser,
  useDeliveryBoyBankDetails,
  useDeliveryBoyVehicle,
  useDeliveryBoyEarnings,
  useUpdateDeliveryBoyKycStatus,
  useUpdateDeliveryBoy,
  useSuspendDeliveryBoy,
  useUnsuspendDeliveryBoy,
} from "@/hooks/";

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

const kycConfig = {
  pending:  { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",              icon: ShieldAlert, label: "Pending"  },
  approved: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",      icon: ShieldCheck, label: "Approved" },
  rejected: { color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",                  icon: ShieldOff,   label: "Rejected" },
} as const;

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-muted/50 p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function PartnerProfilePage() {
  const { partnerId } = useParams<{ partnerId: string }>();

  const { data: partner, isLoading, error } = useDeliveryBoyByUser(partnerId);
  const { data: bankDetails } = useDeliveryBoyBankDetails(partnerId);
  const { data: vehicle }     = useDeliveryBoyVehicle(partnerId);
  const { data: earnings }    = useDeliveryBoyEarnings(partnerId);

  const updateKyc     = useUpdateDeliveryBoyKycStatus();
  const updatePartner = useUpdateDeliveryBoy();
  const suspend       = useSuspendDeliveryBoy();
  const unsuspend     = useUnsuspendDeliveryBoy();

  const [showApprove,      setShowApprove]     = useState(false);
  const [showReject,       setShowReject]      = useState(false);
  const [showSuspend,      setShowSuspend]     = useState(false);
  const [showVerifyToggle, setShowVerifyToggle] = useState(false);
  const [rejectionReason,  setRejectionReason] = useState("");
  const [suspendReason,    setSuspendReason]   = useState("");

  // ── handlers ─────────────────────────────────────────────────────────────

  const handleApprove = () => {
    updateKyc.mutate(
      { userId: partnerId, status: "approved" },
      {
        onSuccess: () => { toast.success("KYC approved successfully"); setShowApprove(false); },
        onError:   () => toast.error("Failed to approve KYC"),
      }
    );
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    updateKyc.mutate(
      { userId: partnerId, status: "rejected", rejectedReason: rejectionReason },
      {
        onSuccess: () => {
          toast.success("KYC rejected");
          setShowReject(false);
          setRejectionReason("");
        },
        onError: () => toast.error("Failed to reject KYC"),
      }
    );
  };

  const handleSuspend = () => {
    if (!suspendReason.trim()) return;
    suspend.mutate(
      { userId: partnerId, reason: suspendReason },
      {
        onSuccess: () => {
          toast.success("Partner suspended");
          setShowSuspend(false);
          setSuspendReason("");
        },
        onError: () => toast.error("Failed to suspend partner"),
      }
    );
  };

  const handleUnsuspend = () => {
    unsuspend.mutate(partnerId, {
      onSuccess: () => toast.success("Partner unsuspended"),
      onError:   () => toast.error("Failed to unsuspend"),
    });
  };

  const handleConfirmVerifyToggle = () => {
    if (!partner) return;
    updatePartner.mutate(
      { userId: partnerId, updates: { is_verified: !partner.is_verified } },
      {
        onSuccess: () => {
          toast.success(
            partner.is_verified
              ? "Partner marked as unverified"
              : "Partner marked as verified"
          );
          setShowVerifyToggle(false);
        },
        onError: () => {
          toast.error("Failed to update verification status");
          setShowVerifyToggle(false);
        },
      }
    );
  };

  // ── loading / error ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !partner) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <XCircle className="h-10 w-10 text-rose-500" />
        <p className="text-sm">Partner not found.</p>
        <Link href="/admin/delivery">
          <Button variant="outline" size="sm">Back to list</Button>
        </Link>
      </div>
    );
  }

  const kycStatus   = (partner.kyc_status ?? "pending") as keyof typeof kycConfig;
  const KycIcon     = kycConfig[kycStatus]?.icon ?? ShieldAlert;
  const isSuspended = !!partner.suspension_reason;
  const isVerified  = partner.is_verified ?? false;
  const totalEarned = earnings?.reduce((s, e) => s + (e.total_earnings ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* back */}
      <Link href="/admin/delivery">
        <Button variant="ghost" size="sm" className="-ml-2">
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Back to Partners
        </Button>
      </Link>

      {/* ── hero card ──────────────────────────────────────────────────── */}
      <Card className="border-border/50 overflow-hidden pt-0">
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-violet-500 to-rose-500" />
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

            {/* avatar + name + badges */}
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-4 ring-background shadow-md">
                  <AvatarImage src={partner.profile_photo ?? ""} />
                  <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900 dark:to-violet-900 text-blue-700 dark:text-blue-300">
                    {initials(partner.first_name, partner.last_name)}
                  </AvatarFallback>
                </Avatar>
                <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background shadow ${
                  partner.is_online ? "bg-emerald-500" : "bg-zinc-400"
                }`} />
              </div>

              <div>
                <h1 className="text-xl font-bold">
                  {partner.first_name} {partner.last_name}
                </h1>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">
                  {partner.user_id}
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  {/* online */}
                  <Badge variant="outline" className={`text-xs ${
                    partner.is_online
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20"
                      : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:bg-zinc-900/20"
                  }`}>
                    {partner.is_online
                      ? <><Wifi className="mr-1 h-3 w-3" />Online</>
                      : <><WifiOff className="mr-1 h-3 w-3" />Offline</>}
                  </Badge>

                  {/* availability */}
                  {partner.is_available != null && (
                    <Badge variant="outline" className={`text-xs ${
                      partner.is_available
                        ? "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20"
                        : "border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/20"
                    }`}>
                      {partner.is_available ? "Available" : "Busy"}
                    </Badge>
                  )}

                  {/* kyc */}
                  <Badge variant="outline" className={`text-xs ${kycConfig[kycStatus]?.color}`}>
                    <KycIcon className="mr-1 h-3 w-3" />
                    KYC {kycConfig[kycStatus]?.label}
                  </Badge>

                  {/* is_verified */}
                  <Badge variant="outline" className={`text-xs ${
                    isVerified
                      ? "border-teal-200 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400"
                      : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:bg-zinc-900/20"
                  }`}>
                    {isVerified
                      ? <><BadgeCheck className="mr-1 h-3 w-3" />Verified</>
                      : <><BadgeX className="mr-1 h-3 w-3" />Unverified</>}
                  </Badge>

                  {/* suspended */}
                  {isSuspended && (
                    <Badge variant="outline" className="text-xs border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-900/20">
                      <AlertTriangle className="mr-1 h-3 w-3" />Suspended
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* action buttons */}
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/delivery/${partnerId}/kyc`}>
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  View KYC
                </Button>
              </Link>
              <Link href={`/admin/delivery/upsert?edit=${partnerId}`}>
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={() => setShowApprove(true)}
                disabled={kycStatus === "approved" || updateKyc.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve KYC
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowReject(true)}
                disabled={updateKyc.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject KYC
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── suspension warning ─────────────────────────────────────────── */}
      {isSuspended && (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/10">
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-600" />
              <div>
                <p className="text-sm font-semibold text-rose-800 dark:text-rose-400">
                  Account Suspended
                </p>
                <p className="text-xs text-rose-600 mt-0.5">{partner.suspension_reason}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-rose-200 text-rose-700 hover:bg-rose-100 flex-shrink-0"
              onClick={handleUnsuspend}
              disabled={unsuspend.isPending}
            >
              {unsuspend.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : "Unsuspend"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Rating"
          value={partner.rating ?? "—"}
          sub={`${partner.review_count ?? 0} reviews`}
        />
        <StatCard label="Total Deliveries" value={partner.total_deliveries ?? 0} />
        <StatCard label="Total Earned"     value={`₹${totalEarned.toLocaleString()}`} />
        <StatCard label="KYC Status"       value={kycConfig[kycStatus]?.label ?? "—"} />
      </div>

      {/* ── detail grid ────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* vehicle */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bike className="h-4 w-4 text-muted-foreground" />
              Vehicle Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <InfoRow label="Vehicle Type"   value={vehicle?.vehicle_type   ?? partner.vehicle_type} />
            <InfoRow label="Vehicle Number" value={vehicle?.vehicle_number ?? partner.vehicle_number} />
            <InfoRow label="Brand / Model"  value={vehicle ? `${vehicle.vehicle_brand ?? ""} ${vehicle.vehicle_model ?? ""}`.trim() || null : null} />
            <InfoRow label="Fuel Type"      value={vehicle?.fuel_type} />
            <InfoRow label="RC Number"      value={vehicle?.rc_number} />
            <InfoRow label="Insurance No."  value={vehicle?.insurance_number} />
            <InfoRow label="Vehicle Status" value={vehicle?.status} />
            <InfoRow label="License No."    value={partner.license_number} />
          </CardContent>
        </Card>

        {/* bank details */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {bankDetails ? (
              <>
                <InfoRow label="Account Holder" value={bankDetails.account_holder_name} />
                <InfoRow label="Bank Name"       value={bankDetails.bank_name} />
                <InfoRow label="Account Number"  value={bankDetails.account_number} />
                <InfoRow label="IFSC Code"       value={bankDetails.ifsc_code} />
                <InfoRow label="Account Type"    value={bankDetails.account_type} />
                <InfoRow label="UPI ID"          value={bankDetails.upi_id} />
                <InfoRow label="Branch"          value={bankDetails.branch} />
                <InfoRow label="Verified"        value={bankDetails.is_verified ? "Yes" : "No"} />
              </>
            ) : (
              <p className="col-span-2 text-sm text-muted-foreground">
                No bank details on file.
              </p>
            )}
          </CardContent>
        </Card>

        {/* contact & address — includes emergency fields */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Contact &amp; Address
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <InfoRow label="City"            value={partner.city} />
            <InfoRow label="State"           value={partner.state} />
            <InfoRow label="Pincode"         value={partner.pincode} />
            <InfoRow label="Address Line 1"  value={partner.address_line1} />
            <InfoRow label="Address Line 2"  value={partner.address_line2} />
            <InfoRow label="Emergency Contact" value={partner.emergency_contact_name} />
            <InfoRow label="Emergency Phone"   value={partner.emergency_contact_phone} />
          </CardContent>
        </Card>

        {/* account info + is_verified toggle + danger zone */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Account Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                label="Joined"
                value={new Date(partner.created_at ?? "").toLocaleDateString()}
              />
              <InfoRow
                label="Last Updated"
                value={new Date(partner.updated_at ?? "").toLocaleString()}
              />
              <InfoRow
                label="KYC Verified At"
                value={
                  partner.kyc_verified_at
                    ? new Date(partner.kyc_verified_at).toLocaleDateString()
                    : null
                }
              />
              <InfoRow label="Admin Notes" value={partner.admin_notes} />
            </div>

            {/* ── is_verified toggle ─────────────────────────────────── */}
            <Separator />
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="verified-toggle" className="text-sm font-medium cursor-pointer">
                  Account Verified
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isVerified
                    ? "Partner is marked as verified"
                    : "Partner is not yet verified"}
                </p>
              </div>
              <Switch
                id="verified-toggle"
                checked={isVerified}
                onCheckedChange={() => setShowVerifyToggle(true)}
                disabled={updatePartner.isPending}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            {/* danger zone */}
            {!isSuspended && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-rose-600 mb-2">Danger Zone</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
                    onClick={() => setShowSuspend(true)}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Suspend Partner
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── approve KYC dialog ────────────────────────────────────────── */}
      <AlertDialog open={showApprove} onOpenChange={setShowApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve KYC</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark{" "}
              <strong>{partner.first_name} {partner.last_name}</strong> as KYC
              verified and allow them to start accepting deliveries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={updateKyc.isPending}>
              {updateKyc.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve KYC
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── reject KYC dialog ─────────────────────────────────────────── */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>
              Provide a reason. The partner will be notified so they can resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <label className="text-sm font-medium">Rejection Reason *</label>
            <Textarea
              placeholder="e.g., Documents are not clear, license has expired…"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowReject(false); setRejectionReason(""); }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || updateKyc.isPending}
            >
              {updateKyc.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── suspend dialog ────────────────────────────────────────────── */}
      <Dialog open={showSuspend} onOpenChange={setShowSuspend}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Partner</DialogTitle>
            <DialogDescription>
              The partner will not be able to accept deliveries while suspended.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <label className="text-sm font-medium">Suspension Reason *</label>
            <Textarea
              placeholder="Reason for suspension…"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowSuspend(false); setSuspendReason(""); }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={!suspendReason.trim() || suspend.isPending}
            >
              {suspend.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── is_verified toggle confirmation ───────────────────────────── */}
      <AlertDialog open={showVerifyToggle} onOpenChange={setShowVerifyToggle}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isVerified ? "Remove Verification?" : "Mark as Verified?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isVerified ? (
                <>
                  This will mark{" "}
                  <strong>{partner.first_name} {partner.last_name}</strong> as{" "}
                  <strong>unverified</strong>. They may lose access to certain
                  features until re-verified.
                </>
              ) : (
                <>
                  This will mark{" "}
                  <strong>{partner.first_name} {partner.last_name}</strong> as{" "}
                  <strong>verified</strong>, granting them full access to
                  delivery features.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmVerifyToggle}
              disabled={updatePartner.isPending}
              className={isVerified ? "bg-rose-600 hover:bg-rose-700 text-white" : ""}
            >
              {updatePartner.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isVerified ? (
                <><BadgeX className="mr-2 h-4 w-4" />Remove Verification</>
              ) : (
                <><BadgeCheck className="mr-2 h-4 w-4" />Mark as Verified</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}