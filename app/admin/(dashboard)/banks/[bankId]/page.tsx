"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  User,
  MapPin,
  Phone,
  Mail,
  Landmark,
  Hash,
  Wallet,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  useVendorBankDetailsById,
  useDeliveryBoyBankDetailsById,
  useApproveVendorBank,
  useRejectVendorBank,
  useApproveDeliveryBank,
  useRejectDeliveryBank,
} from "@/hooks/banks/useBankdetails";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";

// ─── Shared ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function StatusBanner({
  status,
  rejectionReason,
}: {
  status: string;
  rejectionReason?: string | null;
}) {
  const configs = {
    pending: {
      bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
      icon: Clock,
      iconClass: "text-amber-500",
      text: "Awaiting Review",
      textClass: "text-amber-700 dark:text-amber-400",
    },
    approved: {
      bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800",
      icon: CheckCircle2,
      iconClass: "text-emerald-500",
      text: "Approved",
      textClass: "text-emerald-700 dark:text-emerald-400",
    },
    rejected: {
      bg: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
      icon: XCircle,
      iconClass: "text-red-500",
      text: "Rejected",
      textClass: "text-red-700 dark:text-red-400",
    },
  };
  const config =
    configs[status as keyof typeof configs] ?? configs.pending;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        config.bg
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconClass)} />
      <div>
        <p className={cn("text-sm font-semibold", config.textClass)}>
          {config.text}
        </p>
        {rejectionReason && status === "rejected" && (
          <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
            {rejectionReason}
          </p>
        )}
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Action Buttons (shared) ─────────────────────────────────────────────────

function ActionButtons({
  status,
  onApprove,
  onReject,
  isApproving,
}: {
  status: string;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
}) {
  // Show approve + reject for pending; show only approve for rejected
  if (status === "approved") return null;

  return (
    <>
      <Separator />
      <div className="flex items-center gap-3">
        <Button
          onClick={onApprove}
          disabled={isApproving}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isApproving ? "Approving..." : "Approve"}
        </Button>
        {status === "pending" && (
          <Button
            variant="outline"
            onClick={onReject}
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        )}
      </div>
    </>
  );
}

// ─── Vendor Detail ───────────────────────────────────────────────────────────

function VendorBankDetail() {
  const params = useParams();
  const id = params.bankId as string;
  const router = useRouter();
  const { data, isLoading, error } = useVendorBankDetailsById(id);
  const approve = useApproveVendorBank();
  const reject = useRejectVendorBank();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { user: adminUser } = useAuth();

  if (isLoading) return <PageSkeleton />;
  if (error || !data) return (
    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 px-5 py-8 text-center text-sm text-red-600">
      Failed to load bank details.
    </div>
  );

  const vendor = data.vendors as any;
  const user = vendor?.users;

  const handleApprove = async () => {
    try {
      await approve.mutateAsync({ id, verifiedBy: adminUser?.id! });
      toast.success("Bank details approved successfully");
    } catch {
      toast.error("Failed to approve bank details");
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    try {
      await reject.mutateAsync({ id, rejectionReason: reason });
      toast.success("Bank details rejected");
      setRejectOpen(false);
      setReason("");
    } catch {
      toast.error("Failed to reject bank details");
    }
  };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-white text-sm font-semibold">
            {vendor?.store_name?.charAt(0)?.toUpperCase() ?? "V"}
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none text-foreground">
              {vendor?.store_name ?? "Unknown Store"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vendor Bank Details
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <StatusBanner
        status={data.status ?? "pending"}
        rejectionReason={data.rejection_reason}
      />

      {/* Bank Info */}
      <Section title="Bank Account">
        <InfoRow icon={Landmark} label="Bank Name" value={data.bank_name} />
        <InfoRow icon={Hash} label="Account Number" value={data.account_number} />
        <InfoRow icon={CreditCard} label="IFSC Code" value={data.ifsc_code} />
        <InfoRow icon={Building2} label="Branch" value={data.branch} />
        <InfoRow icon={User} label="Account Holder" value={data.account_holder_name} />
        <InfoRow
          icon={Wallet}
          label="Account Type"
          value={
            data.account_type
              ? data.account_type.charAt(0).toUpperCase() +
                data.account_type.slice(1)
              : null
          }
        />
        {data.upi_id && (
          <InfoRow icon={CreditCard} label="UPI ID" value={data.upi_id} />
        )}
      </Section>

      <Separator />

      {/* Vendor Info */}
      <Section title="Vendor Details">
        <InfoRow icon={Building2} label="Store Name" value={vendor?.store_name} />
        <InfoRow icon={Mail} label="Email" value={user?.email} />
        <InfoRow icon={Phone} label="Phone" value={user?.phone} />
        <InfoRow
          icon={MapPin}
          label="City"
          value={
            vendor?.city && vendor?.state
              ? `${vendor.city}, ${vendor.state}`
              : vendor?.city
          }
        />
      </Section>

      {/* Proof Image */}
      {data.proof_image && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Bank Proof Document
            </p>
            <div className="group relative overflow-hidden rounded-xl border border-border/60">
              <img
                src={data.proof_image}
                alt="Bank proof"
                className="w-full max-h-80 object-contain bg-muted"
              />
              <a
                href={data.proof_image}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/80 backdrop-blur-sm px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="h-3 w-3" />
                View Full
              </a>
            </div>
          </div>
        </>
      )}

      {/* Verification Info */}
      {data.verified_at && (
        <>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow
              icon={CheckCircle2}
              label="Verified At"
              value={new Date(data.verified_at).toLocaleString()}
            />
          </div>
        </>
      )}

      {/* Actions */}
      <ActionButtons
        status={data.status ?? "pending"}
        onApprove={handleApprove}
        onReject={() => setRejectOpen(true)}
        isApproving={approve.isPending}
      />

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Reject Bank Details
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be shown to the
              vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="e.g. IFSC code does not match the bank branch..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!reason.trim() || reject.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {reject.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Delivery Detail ─────────────────────────────────────────────────────────

function DeliveryBankDetail() {
  const params = useParams();
  const id = params.bankId as string;
  const router = useRouter();
  const { data, isLoading, error } = useDeliveryBoyBankDetailsById(id);
  const approve = useApproveDeliveryBank();
  const reject = useRejectDeliveryBank();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { user: adminUser } = useAuth();

  if (isLoading) return <PageSkeleton />;
  if (error || !data) return (
    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 px-5 py-8 text-center text-sm text-red-600">
      Failed to load bank details.
    </div>
  );

  const boy = data.delivery_boys as any;
  const user = boy?.users;
  const fullName =
    `${boy?.first_name ?? ""} ${boy?.last_name ?? ""}`.trim() || "Unknown";

  const handleApprove = async () => {
    try {
      await approve.mutateAsync({ id, verifiedBy: adminUser?.id! });
      toast.success("Bank details approved successfully");
    } catch {
      toast.error("Failed to approve bank details");
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    try {
      await reject.mutateAsync({ id, rejectionReason: reason });
      toast.success("Bank details rejected");
      setRejectOpen(false);
      setReason("");
    } catch {
      toast.error("Failed to reject bank details");
    }
  };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white text-sm font-semibold">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none text-foreground">
              {fullName}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Delivery Boy Bank Details
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <StatusBanner
        status={data.status ?? "pending"}
        rejectionReason={data.rejection_reason}
      />

      {/* Bank Info */}
      <Section title="Bank Account">
        <InfoRow icon={Landmark} label="Bank Name" value={data.bank_name} />
        <InfoRow icon={Hash} label="Account Number" value={data.account_number} />
        <InfoRow icon={CreditCard} label="IFSC Code" value={data.ifsc_code} />
        <InfoRow icon={Building2} label="Branch" value={data.branch} />
        <InfoRow icon={User} label="Account Holder" value={data.account_holder_name} />
        <InfoRow
          icon={Wallet}
          label="Account Type"
          value={
            data.account_type
              ? data.account_type.charAt(0).toUpperCase() +
                data.account_type.slice(1)
              : null
          }
        />
        {data.upi_id && (
          <InfoRow icon={CreditCard} label="UPI ID" value={data.upi_id} />
        )}
      </Section>

      <Separator />

      {/* Delivery Boy Info */}
      <Section title="Delivery Boy Details">
        <InfoRow icon={Truck} label="Full Name" value={fullName} />
        <InfoRow icon={Mail} label="Email" value={user?.email} />
        <InfoRow icon={Phone} label="Phone" value={user?.phone} />
        <InfoRow
          icon={MapPin}
          label="City"
          value={
            boy?.city && boy?.state
              ? `${boy.city}, ${boy.state}`
              : boy?.city
          }
        />
      </Section>

      {/* Proof Image */}
      {data.proof_image && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Bank Proof Document
            </p>
            <div className="group relative overflow-hidden rounded-xl border border-border/60">
              <img
                src={data.proof_image}
                alt="Bank proof"
                className="w-full max-h-80 object-contain bg-muted"
              />
              <a
                href={data.proof_image}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/80 backdrop-blur-sm px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="h-3 w-3" />
                View Full
              </a>
            </div>
          </div>
        </>
      )}

      {/* Verification Info */}
      {data.verified_at && (
        <>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow
              icon={CheckCircle2}
              label="Verified At"
              value={new Date(data.verified_at).toLocaleString()}
            />
          </div>
        </>
      )}

      {/* Actions */}
      <ActionButtons
        status={data.status ?? "pending"}
        onApprove={handleApprove}
        onReject={() => setRejectOpen(true)}
        isApproving={approve.isPending}
      />

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Reject Bank Details
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be shown to the
              delivery boy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="e.g. Account number is invalid..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!reason.trim() || reject.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {reject.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page Entry Point ────────────────────────────────────────────────────────

export default function BankDetailPage() {
  const params = useSearchParams();
  const type = params.get("type") as "vendor" | "delivery";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl">
        {type === "vendor" && <VendorBankDetail />}
        {type === "delivery" && <DeliveryBankDetail />}
      </div>
    </div>
  );
}