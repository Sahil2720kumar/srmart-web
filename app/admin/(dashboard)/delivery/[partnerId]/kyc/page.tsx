"use client";

import { useState } from "react";
import {
  ChevronLeft, FileText, CheckCircle, XCircle,
  Download, Calendar, ShieldCheck, AlertCircle,
  ZoomIn, User, Loader2, RefreshCw, ShieldOff, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useDeliveryBoyByUser,
  useDeliveryBoyKycDocuments,
  useApproveDeliveryKycDocument,
  useRejectDeliveryKycDocument,
  useApproveAllDeliveryKycDocuments,
  useUpdateDeliveryBoyKycStatus,
} from "@/hooks";
import { KycDocument } from "@/types/supabase";
import { useAuth } from "@/providers/AuthProvider";



// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const statusStyle: Record<string, string> = {
  not_uploaded: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-400",
  pending:      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  verified:     "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  approved:     "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected:     "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400",
};

// Friendly label from document_type
function docTypeLabel(type: string): string {
  const map: Record<string, string> = {
    aadhaar:        "Aadhaar Card",
    pan:            "PAN Card",
    driving_license:"Driving License",
    bank_passbook:  "Bank Passbook / Cheque",
    profile_photo:  "Profile Photo",
  };
  return map[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({
  value, label, sub, accent,
}: {
  value: number | string;
  label: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <p className={`text-2xl font-bold ${accent ?? ""}`}>{value}</p>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── document card ────────────────────────────────────────────────────────────

function DocCard({
  doc,
  onApprove,
  onReject,
  onPreview,
}: {
  doc: KycDocument;
  onApprove: (doc: KycDocument) => void;
  onReject:  (doc: KycDocument) => void;
  onPreview: (doc: KycDocument) => void;
}) {
  const isPhoto    = doc.document_type === "profile_photo";
  const notUploaded = doc.status === "not_uploaded";
  const canAct      = doc.status === "pending" || doc.status === "verified" || doc.status === "rejected";
  const isApproved  = doc.status === "approved";

  return (
    <Card className="flex flex-col overflow-hidden border-border/50">
      {/* header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {isPhoto
              ? <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              : <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            }
            <CardTitle className="truncate text-sm font-semibold">
              {doc.document_name || docTypeLabel(doc.document_type)}
            </CardTitle>
          </div>
          <Badge variant="outline" className={`flex-shrink-0 text-xs capitalize ${statusStyle[doc.status] ?? statusStyle.pending}`}>
            {doc.status === "not_uploaded" ? "Not Uploaded" : doc.status}
          </Badge>
        </div>
        {doc.document_description && (
          <p className="text-xs text-muted-foreground line-clamp-2 pl-6">{doc.document_description}</p>
        )}
      </CardHeader>

      {/* image area */}
      {notUploaded ? (
        <div className="aspect-[4/3] border-y border-dashed border-border flex flex-col items-center justify-center gap-2 bg-muted/30">
          <FileText className="h-12 w-12 text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground">
            {doc.is_required ? "Required — not yet uploaded" : "Optional — not uploaded"}
          </p>
        </div>
      ) : (
        <div
          className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-gradient-to-br from-muted to-muted/70 group"
          onClick={() => onPreview(doc)}
        >
          {/* actual image if URL exists */}
          {doc.document_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.document_url}
              alt={doc.document_name}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {isPhoto
                ? <div className="flex flex-col items-center gap-2"><div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><User className="h-10 w-10 text-blue-400" /></div><p className="text-xs text-muted-foreground">Profile Photo</p></div>
                : <div className="flex flex-col items-center gap-2"><FileText className="h-16 w-16 text-muted-foreground/20" /><p className="text-xs text-muted-foreground">{docTypeLabel(doc.document_type)}</p></div>
              }
            </div>
          )}

          {/* hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/50">
            <div className="flex flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-7 w-7 text-white" />
              <span className="text-xs font-medium text-white">Preview</span>
            </div>
          </div>

          {/* status pill overlay */}
          <div className="absolute left-3 top-3">
            {doc.status === "approved" && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-semibold text-white shadow">
                <CheckCircle className="h-3 w-3" />Approved
              </span>
            )}
            {doc.status === "rejected" && (
              <span className="flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-semibold text-white shadow">
                <XCircle className="h-3 w-3" />Rejected
              </span>
            )}
            {doc.status === "pending" && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-semibold text-white shadow">
                <AlertCircle className="h-3 w-3" />Pending
              </span>
            )}
          </div>
        </div>
      )}

      {/* body */}
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {doc.document_number && (
          <div>
            <p className="text-[10px] text-muted-foreground">Document Number</p>
            <p className="text-sm font-mono font-medium">{doc.document_number}</p>
          </div>
        )}

        <div className="space-y-1.5 flex-1">
          {doc.uploaded_date && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Uploaded: {new Date(doc.uploaded_date).toLocaleDateString()}
            </div>
          )}
          {doc.verified_date && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle className="h-3 w-3" />
              Verified: {new Date(doc.verified_date).toLocaleDateString()}
            </div>
          )}
        </div>

        {doc.is_required && (
          <Badge variant="outline" className="w-fit bg-orange-50 text-orange-700 border-orange-200 text-xs dark:bg-orange-900/20 dark:border-orange-900">
            Required
          </Badge>
        )}

        {doc.rejection_reason && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-900/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-rose-600" />
              <div>
                <p className="text-[10px] font-semibold text-rose-800 dark:text-rose-400">Rejection Reason</p>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{doc.rejection_reason}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* footer actions */}
      {!notUploaded && (
        <CardFooter className="gap-2 p-4  bg-white pt-3">
          {canAct && (
            <>
              <Button size="sm" className="flex-1" onClick={() => onApprove(doc)}>
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                {doc.status === "rejected" ? "Approve Anyway" : "Approve"}
              </Button>
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => onReject(doc)}>
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Reject
              </Button>
            </>
          )}
          {isApproved && (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onReject(doc)}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Revoke Approval
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function PartnerVerificationPage() {
  const { partnerId } = useParams<{ partnerId: string }>();

  const { data: partner,   isLoading: loadingPartner }  = useDeliveryBoyByUser(partnerId);
  const { data: documents, isLoading: loadingDocs }     = useDeliveryBoyKycDocuments(partnerId);

  const approveDoc    = useApproveDeliveryKycDocument();
  const rejectDoc     = useRejectDeliveryKycDocument();
  const approveAll    = useApproveAllDeliveryKycDocuments();
  const updateKyc     = useUpdateDeliveryBoyKycStatus();
  const {user}=useAuth()
  const ADMIN_ID = user?.id!; // replace with real auth user id

  const [selectedDoc,      setSelectedDoc]      = useState<KycDocument | null>(null);
  const [showApprove,      setShowApprove]       = useState(false);
  const [showReject,       setShowReject]        = useState(false);
  const [showPreview,      setShowPreview]       = useState(false);
  const [showApproveAll,   setShowApproveAll]    = useState(false);
  const [rejectionReason,  setRejectionReason]  = useState("");

  const docs = (documents ?? []) as KycDocument[];

  // ── computed counts ───────────────────────────────────────────────────────
  const uploaded      = docs.filter((d) => d.status !== "not_uploaded");
  const required      = docs.filter((d) => d.is_required);
  const approvedReq   = required.filter((d) => d.status === "approved");
  const pending       = docs.filter((d) => d.status === "pending" || d.status === "verified");
  const rejected      = docs.filter((d) => d.status === "rejected");
  const allApproved   = required.length > 0 && required.length === approvedReq.length;

  // ── handlers ─────────────────────────────────────────────────────────────
  const openApprove = (doc: KycDocument) => { setSelectedDoc(doc); setShowApprove(true); };
  const openReject  = (doc: KycDocument) => {
    setSelectedDoc(doc);
    setRejectionReason(doc.rejection_reason ?? "");
    setShowReject(true);
  };
  const openPreview = (doc: KycDocument) => { setSelectedDoc(doc); setShowPreview(true); };

  const confirmApprove = () => {
    if (!selectedDoc) return;
    approveDoc.mutate(
      { docId: selectedDoc.id, verifiedBy: ADMIN_ID },
      { 
        onSuccess: () => { toast.success("Document approved"); setShowApprove(false); setSelectedDoc(null); },
        onError:   () => toast.error("Failed to approve document"),
      }
    );
  };

  const confirmReject = () => {
    if (!selectedDoc || !rejectionReason.trim()) return;
    rejectDoc.mutate(
      { docId: selectedDoc.id, rejectionReason, verifiedBy: ADMIN_ID },
      {
        onSuccess: () => {
          toast.success("Document rejected");
          setShowReject(false);
          setSelectedDoc(null);
          setRejectionReason("");
        },
        onError: () => toast.error("Failed to reject document"),
      }
    );
  };

  const confirmApproveAll = () => {
    approveAll.mutate(
      { userId: partnerId, verifiedBy: ADMIN_ID },
      {
        onSuccess: (data) => {
          // Also mark the overall delivery boy KYC as approved
          updateKyc.mutate({ userId: partnerId, status: "approved" });
          toast.success(`${data.length} document(s) approved`);
          setShowApproveAll(false);
        },
        onError: () => toast.error("Failed to approve all documents"),
      }
    );
  };

  // ── loading ───────────────────────────────────────────────────────────────
  if (loadingPartner || loadingDocs) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const partnerName = partner ? `${partner.first_name} ${partner.last_name}` : "Partner";

  return (
    <div className="space-y-6">
      {/* back */}
      <Link href={`/admin/delivery/${partnerId}`}>
        <Button variant="ghost" size="sm" className="-ml-2">
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Back to Profile
        </Button>
      </Link>

      {/* ── header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 ring-4 ring-background shadow">
            <AvatarImage src={partner?.profile_photo ?? ""} />
            <AvatarFallback className="font-semibold bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900 dark:to-violet-900 text-blue-700 dark:text-blue-300">
              {initials(partnerName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{partnerName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">KYC Document Review</p>
            <p className="text-xs text-muted-foreground font-mono">{partnerId}</p>
          </div>
        </div>

        {pending.length > 0 && (
          <Button onClick={() => setShowApproveAll(true)} disabled={approveAll.isPending}>
            {approveAll.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <ShieldCheck className="mr-2 h-4 w-4" />
            }
            Approve All Pending ({pending.length})
          </Button>
        )}
      </div>

      {/* ── status banners ─────────────────────────────────────────────── */}
      {allApproved && (
        <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-900/10">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-700 dark:text-emerald-400">All Required Documents Verified</AlertTitle>
          <AlertDescription className="text-emerald-600 dark:text-emerald-500 text-sm">
            All required KYC documents have been approved. This partner is fully verified.
          </AlertDescription>
        </Alert>
      )}
      {rejected.length > 0 && (
        <Alert className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-900/10">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          <AlertTitle className="text-rose-700 dark:text-rose-400">Documents Rejected</AlertTitle>
          <AlertDescription className="text-rose-600 dark:text-rose-500 text-sm">
            {rejected.length} document(s) rejected. The partner needs to reupload them.
          </AlertDescription>
        </Alert>
      )}

      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={`${uploaded.length}/${docs.length}`} label="Documents Uploaded" />
        <StatCard value={pending.length}      label="Pending Review"    sub="Awaiting approval"   accent="text-amber-600" />
        <StatCard value={approvedReq.length}  label="Approved"          sub={`of ${required.length} required`} accent="text-emerald-600" />
        <StatCard value={rejected.length}     label="Rejected"          sub="Need reupload"        accent="text-rose-600" />
      </div>

      {/* ── document grid ──────────────────────────────────────────────── */}
      {docs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">No KYC documents found</p>
            <p className="text-xs text-muted-foreground mt-1">This partner hasn't submitted any documents yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              onApprove={openApprove}
              onReject={openReject}
              onPreview={openPreview}
            />
          ))}
        </div>
      )}

      {/* ── approve single dialog ──────────────────────────────────────── */}
      <AlertDialog open={showApprove} onOpenChange={setShowApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Document</AlertDialogTitle>
            <AlertDialogDescription>
              Approve <strong>{selectedDoc?.document_name}</strong>? It will be marked as verified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApprove} disabled={approveDoc.isPending}>
              {approveDoc.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── reject single dialog ───────────────────────────────────────── */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Provide a clear reason for rejecting <strong>{selectedDoc?.document_name}</strong>.
              The partner will see this message and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-3">
            <label className="text-sm font-medium">Rejection Reason *</label>
            <Textarea
              placeholder="e.g., Document is blurry, information not clearly visible, document expired…"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowReject(false); setRejectionReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason.trim() || rejectDoc.isPending}
            >
              {rejectDoc.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── preview dialog ─────────────────────────────────────────────── */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDoc?.document_type === "profile_photo"
                ? <User className="h-5 w-5" />
                : <FileText className="h-5 w-5" />
              }
              {selectedDoc?.document_name}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs">{selectedDoc?.id}</span>
              <Badge variant="outline" className={`text-xs capitalize ${statusStyle[selectedDoc?.status ?? "pending"]}`}>
                {selectedDoc?.status?.replace(/_/g, " ")}
              </Badge>
              {selectedDoc?.uploaded_date && (
                <span className="text-xs">Uploaded {new Date(selectedDoc.uploaded_date).toLocaleString()}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              {selectedDoc?.document_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedDoc.document_url}
                  alt={selectedDoc.document_name}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-8">
                  {selectedDoc?.document_type === "profile_photo"
                    ? <><div className="h-32 w-32 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><User className="h-16 w-16 text-blue-400" /></div><p className="text-sm text-muted-foreground">Profile photo preview</p></>
                    : <><FileText className="h-24 w-24 text-muted-foreground/20" /><p className="text-sm text-muted-foreground">Document preview</p>{selectedDoc?.document_number && <div className="mt-2 px-4 py-2 bg-background rounded-lg shadow"><p className="text-xs text-muted-foreground">Document Number</p><p className="font-mono font-bold">{selectedDoc.document_number}</p></div>}</>
                  }
                </div>
              )}
            </div>

            {selectedDoc?.document_description && (
              <p className="text-sm text-muted-foreground">{selectedDoc.document_description}</p>
            )}

            {selectedDoc?.rejection_reason && (
              <Alert className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-900/10">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <AlertTitle className="text-rose-700 dark:text-rose-400">Previously Rejected</AlertTitle>
                <AlertDescription className="text-rose-600 text-sm">{selectedDoc.rejection_reason}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="flex-wrap gap-2">
            <div className="flex gap-2 flex-1">
              <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
              {selectedDoc?.document_url && (
                <Button variant="outline" asChild>
                  <a href={selectedDoc.document_url} download target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
              )}
            </div>
            {selectedDoc && selectedDoc.status !== "approved" && selectedDoc.status !== "not_uploaded" && (
              <div className="flex gap-2">
                <Button onClick={() => { setShowPreview(false); openApprove(selectedDoc); }}>
                  <CheckCircle className="mr-2 h-4 w-4" />Approve
                </Button>
                <Button variant="destructive" onClick={() => { setShowPreview(false); openReject(selectedDoc); }}>
                  <XCircle className="mr-2 h-4 w-4" />Reject
                </Button>
              </div>
            )}
            {selectedDoc?.status === "approved" && (
              <Button variant="outline" onClick={() => { setShowPreview(false); openReject(selectedDoc); }}>
                <XCircle className="mr-2 h-4 w-4" />Revoke
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── approve all dialog ─────────────────────────────────────────── */}
      <AlertDialog open={showApproveAll} onOpenChange={setShowApproveAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve All Pending Documents</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve {pending.length} pending document(s) for <strong>{partnerName}</strong> and
              mark their overall KYC status as approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApproveAll} disabled={approveAll.isPending}>
              {approveAll.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Approve All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}