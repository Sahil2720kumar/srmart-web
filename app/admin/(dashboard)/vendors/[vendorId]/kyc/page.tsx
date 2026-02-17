"use client";

import { useState } from "react";
import {
  ChevronLeft,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  Calendar,
  ShieldCheck,
  AlertCircle,
  ZoomIn,
  User,
  Loader2,
  ImageOff,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { KycDocument } from "@/types/supabase";
import {
  useVendorKycDocuments,
  useApproveKycDocument,
  useRejectKycDocument,
  useApproveAllKycDocuments,
  useVendor
} from "@/hooks";
import { useAuth } from "@/providers/AuthProvider";

// ─── Constants ────────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  not_uploaded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  pending:      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  verified:     "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  approved:     "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected:     "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const documentTypeLabels: Record<string, string> = {
  aadhaar:         "Aadhaar Card",
  pan:             "PAN Card",
  driving_license: "Driving License",
  bank_passbook:   "Bank Passbook",
  profile_photo:   "Profile Photo",
};

// ─── Image with fallback ──────────────────────────────────────────────────────
function KycDocumentImage({
  url,
  docType,
  onClick,
}: {
  url: string | null | undefined;
  docType: string;
  onClick?: () => void;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");

  const isPhoto = docType === "profile_photo";

  if (!url) {
    return (
      <div className="flex items-center justify-center aspect-[4/3] bg-muted/40 border-2 border-dashed">
        <div className="text-center p-4">
          <ImageOff className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No file uploaded</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[4/3] bg-muted overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2">
          <ImageOff className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">Failed to load</p>
        </div>
      )}

      {/* Actual image */}
      <img
        src={url}
        alt={documentTypeLabels[docType] ?? docType}
        className={`absolute inset-0 w-full h-full ${
          isPhoto ? "object-contain p-2" : "object-cover"
        } transition-opacity duration-300 ${
          state === "loaded" ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
      />

      {/* Hover overlay */}
      {state === "loaded" && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
            <ZoomIn className="h-7 w-7 text-white" />
            <span className="text-white text-xs font-medium">View Full</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Document Card ────────────────────────────────────────────────────────────
function KycDocumentCard({
  doc,
  onApprove,
  onReject,
  onPreview,
}: {
  doc: KycDocument & { resolved_url?: string | null };
  onApprove: (doc: KycDocument) => void;
  onReject: (doc: KycDocument) => void;
  onPreview: (doc: KycDocument & { resolved_url?: string | null }) => void;
}) {
  const isUploaded = doc.status !== "not_uploaded";
  const canAction  = doc.status === "pending" || doc.status === "verified";

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {documentTypeLabels[doc.document_type] ?? doc.document_name}
              </span>
            </CardTitle>
            {doc.document_description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {doc.document_description}
              </p>
            )}
          </div>
          <Badge className={`${statusColors[doc.status ?? "not_uploaded"]} flex-shrink-0 capitalize`}>
            {(doc.status ?? "not_uploaded").replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Image / placeholder */}
        {isUploaded ? (
          <KycDocumentImage
            url={doc.resolved_url}
            docType={doc.document_type}
            onClick={() => onPreview(doc)}
          />
        ) : (
          <div className="aspect-[4/3] bg-muted border-2 border-dashed border-border flex items-center justify-center">
            <div className="text-center p-6">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Not Uploaded</p>
              <p className="text-xs text-muted-foreground mt-1">
                {doc.is_required ? "Required Document" : "Optional Document"}
              </p>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="p-4 space-y-3 border-t bg-card flex-1 flex flex-col">
          {doc.document_number && (
            <div>
              <p className="text-xs text-muted-foreground">Document Number</p>
              <p className="text-sm font-mono font-medium mt-0.5">{doc.document_number}</p>
            </div>
          )}
          <div className="space-y-2 flex-1">
            {doc.uploaded_date && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Uploaded: {new Date(doc.uploaded_date).toLocaleDateString()}</span>
              </div>
            )}
            {doc.verified_date && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Verified: {new Date(doc.verified_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          {doc.is_required && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:border-orange-900 w-fit text-xs">
              Required
            </Badge>
          )}
          {doc.rejection_reason && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-red-900 dark:text-red-400">Rejection Reason</p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">{doc.rejection_reason}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Actions */}
      {isUploaded && (
        <CardFooter className="p-4 gap-2 flex-wrap bg-white dark:bg-card">
          {canAction && (
            <>
              <Button className="flex-1 min-w-[110px]" onClick={() => onApprove(doc)}>
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button variant="destructive" className="flex-1 min-w-[110px]" onClick={() => onReject(doc)}>
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
            </>
          )}
          {doc.status === "rejected" && (
            <Button className="flex-1" onClick={() => onApprove(doc)}>
              <CheckCircle className="mr-2 h-4 w-4" /> Approve Anyway
            </Button>
          )}
          {doc.status === "approved" && (
            <Button variant="outline" className="flex-1" onClick={() => onReject(doc)}>
              <XCircle className="mr-2 h-4 w-4" /> Revoke Approval
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function DocumentSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Skeleton className="w-full aspect-[4/3]" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VendorVerificationPage() {
  const {user}=useAuth()
  const { vendorId } = useParams() as { vendorId: string };
  
  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: vendor, isLoading: vendorLoading } = useVendor(vendorId);
  const {
    data: documents = [],
    isLoading: docsLoading,
    refetch: refetchDocs,
  } = useVendorKycDocuments(vendor?.user_id ?? "");

  // ── Mutations ──────────────────────────────────────────────────────────────
  const approveDoc        = useApproveKycDocument();
  const rejectDoc         = useRejectKycDocument();
  const approveAllDocs    = useApproveAllKycDocuments();

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [selectedDoc, setSelectedDoc]                   = useState<(KycDocument & { resolved_url?: string | null }) | null>(null);
  const [showApproveDialog, setShowApproveDialog]       = useState(false);
  const [showRejectDialog, setShowRejectDialog]         = useState(false);
  const [showPreviewDialog, setShowPreviewDialog]       = useState(false);
  const [showVerifyAllDialog, setShowVerifyAllDialog]   = useState(false);
  const [rejectionReason, setRejectionReason]           = useState("");
  const [previewImgState, setPreviewImgState]           = useState<"loading" | "loaded" | "error">("loading");

  // ── Derived stats ──────────────────────────────────────────────────────────
  const requiredDocs         = documents.filter((d) => d.is_required);
  const approvedRequiredDocs = requiredDocs.filter((d) => d.status === "approved");
  const pendingDocs          = documents.filter((d) => d.status === "pending" || d.status === "verified");
  const rejectedDocs         = documents.filter((d) => d.status === "rejected");
  const uploadedDocs         = documents.filter((d) => d.status !== "not_uploaded");
  const allRequiredApproved  = requiredDocs.length > 0 && requiredDocs.length === approvedRequiredDocs.length;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleApprove = (doc: KycDocument) => {
    setSelectedDoc(doc as KycDocument & { resolved_url?: string | null });
    setShowApproveDialog(true);
  };

  const confirmApprove = async () => {
    if (!selectedDoc) return;
    try {
      await approveDoc.mutateAsync({ docId: selectedDoc.id, verifiedBy: user?.id! });
      toast.success("Document approved successfully");
    } catch(error) {
      console.log("Error was",error);
      
      toast.error("Failed to approve document");
    } finally {
      setShowApproveDialog(false);
      setSelectedDoc(null);
    }
  };

  const handleReject = (doc: KycDocument) => {
    setSelectedDoc(doc as KycDocument & { resolved_url?: string | null });
    setRejectionReason(doc.rejection_reason ?? "");
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (!selectedDoc || !rejectionReason.trim()) return;
    try {
      await rejectDoc.mutateAsync({
        docId: selectedDoc.id,
        rejectionReason,
        verifiedBy: user?.id!,
      });
      toast.success("Document rejected");
    } catch {
      toast.error("Failed to reject document");
    } finally {
      setShowRejectDialog(false);
      setSelectedDoc(null);
      setRejectionReason("");
    }
  };

  const handlePreview = (doc: KycDocument & { resolved_url?: string | null }) => {
    setSelectedDoc(doc);
    setPreviewImgState("loading");
    setShowPreviewDialog(true);
  };

  const confirmVerifyAll = async () => {
    if (!vendor) return;
    try {
      await approveAllDocs.mutateAsync({ userId: vendor.user_id, verifiedBy:user?.id! });
      toast.success("All pending documents approved");
    } catch {
      toast.error("Failed to approve all documents");
    } finally {
      setShowVerifyAllDialog(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (vendorLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <Skeleton className="h-8 w-40" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => <DocumentSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-lg font-medium">Vendor not found</p>
          <Link href="/admin/vendors">
            <Button variant="outline">Back to Vendors</Button>
          </Link>
        </div>
      </div>
    );
  }

  const vendorName = vendor.store_name;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Back button */}
        <Link href="/admin/vendors">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" />
              <AvatarFallback className="text-xl">{getInitials(vendorName)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{vendorName}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {vendor.users?.email} • {vendor.city}, {vendor.state}
              </p>
              <p className="text-xs text-muted-foreground">Vendor ID: {vendorId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchDocs()}
              disabled={docsLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${docsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {pendingDocs.length > 0 && (
              <Button onClick={() => setShowVerifyAllDialog(true)} disabled={approveAllDocs.isPending}>
                {approveAllDocs.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Approve All Pending
              </Button>
            )}
          </div>
        </div>

        {/* Status Banners */}
        {allRequiredApproved && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">All Required Documents Verified</AlertTitle>
            <AlertDescription className="text-green-600">
              All required KYC documents have been approved. This vendor is fully verified.
            </AlertDescription>
          </Alert>
        )}
        {rejectedDocs.length > 0 && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-600">Documents Rejected</AlertTitle>
            <AlertDescription className="text-red-600">
              {rejectedDocs.length} document(s) rejected. The vendor needs to reupload them.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Documents", value: `${uploadedDocs.length} / ${documents.length}`, sub: "Uploaded", color: "" },
            { label: "Pending Review", value: pendingDocs.length, sub: "Awaiting approval", color: "text-yellow-600" },
            { label: "Approved", value: `${approvedRequiredDocs.length}`, sub: `Of ${requiredDocs.length} required`, color: "text-green-600" },
            { label: "Rejected", value: rejectedDocs.length, sub: "Need reupload", color: "text-red-600" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Documents Grid */}
        {docsLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => <DocumentSkeleton key={i} />)}
          </div>
        ) : documents.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center space-y-3">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground">No KYC documents found for this vendor.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <KycDocumentCard
                key={doc.id}
                doc={doc}
                onApprove={handleApprove}
                onReject={handleReject}
                onPreview={handlePreview}
              />
            ))}
          </div>
        )}

        {/* ── Approve Confirm Dialog ─────────────────────────────────────────── */}
        <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve{" "}
                <strong>{selectedDoc?.document_name}</strong>? This marks the document as verified.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={approveDoc.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmApprove} disabled={approveDoc.isPending}>
                {approveDoc.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Approve Document
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Reject Dialog ──────────────────────────────────────────────────── */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Document</DialogTitle>
              <DialogDescription>
                Provide a clear reason for rejecting{" "}
                <strong>{selectedDoc?.document_name}</strong>. The vendor will see this and must reupload.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rejection Reason *</label>
                <Textarea
                  placeholder="e.g., Document is blurry, information not clearly visible, document expired..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setShowRejectDialog(false); setRejectionReason(""); }}
                disabled={rejectDoc.isPending}
              >
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

        {/* ── Preview Dialog ─────────────────────────────────────────────────── */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col overflow-hidden p-0">
            {/* Header */}
            <div className="p-6 border-b shrink-0">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 min-w-0">
                  <FileText className="h-5 w-5 shrink-0" />
                  <span className="truncate">{selectedDoc?.document_name}</span>
                </DialogTitle>
                <div className="mt-2 flex items-center gap-3 flex-wrap text-sm">
                  <span className="text-muted-foreground break-all">{selectedDoc?.id}</span>
                  {selectedDoc?.status && (
                    <Badge className={statusColors[selectedDoc.status]}>
                      {selectedDoc.status.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
                {selectedDoc?.uploaded_date && (
                  <DialogDescription className="text-xs mt-1">
                    Uploaded: {new Date(selectedDoc.uploaded_date).toLocaleString()}
                  </DialogDescription>
                )}
              </DialogHeader>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Document image */}
              <div className="relative w-full bg-muted rounded-lg overflow-hidden border min-h-[300px] flex items-center justify-center">
                {selectedDoc?.resolved_url ? (
                  <>
                    {previewImgState === "loading" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {previewImgState === "error" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-3">
                        <ImageOff className="h-12 w-12 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Failed to load image</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewImgState("loading")}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" /> Retry
                        </Button>
                      </div>
                    )}
                    <img
                      src={selectedDoc.resolved_url}
                      alt={selectedDoc.document_name}
                      className={`max-w-full max-h-[60vh] object-contain transition-opacity duration-300 ${
                        previewImgState === "loaded" ? "opacity-100" : "opacity-0"
                      }`}
                      onLoad={() => setPreviewImgState("loaded")}
                      onError={() => setPreviewImgState("error")}
                    />
                  </>
                ) : (
                  <div className="text-center p-12">
                    <FileText className="h-20 w-20 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground">No image available</p>
                    {selectedDoc?.document_number && (
                      <div className="mt-4 p-3 bg-background rounded-lg inline-block shadow-sm">
                        <p className="text-xs text-muted-foreground mb-1">Document Number</p>
                        <p className="text-lg font-mono font-bold">{selectedDoc.document_number}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedDoc?.document_description && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{selectedDoc.document_description}</p>
                </div>
              )}

              {/* Rejection reason */}
              {selectedDoc?.rejection_reason && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-600">Previously Rejected</AlertTitle>
                  <AlertDescription className="text-red-600">
                    {selectedDoc.rejection_reason}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t shrink-0">
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2 flex-1">
                  <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                    Close
                  </Button>
                  {selectedDoc?.resolved_url && (
                    <Button variant="outline" asChild>
                      <a href={selectedDoc.resolved_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="mr-2 h-4 w-4" /> Download
                      </a>
                    </Button>
                  )}
                </div>
                {selectedDoc &&
                  (selectedDoc.status === "pending" ||
                    selectedDoc.status === "verified" ||
                    selectedDoc.status === "rejected") && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => { setShowPreviewDialog(false); handleApprove(selectedDoc); }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => { setShowPreviewDialog(false); handleReject(selectedDoc); }}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Approve All Dialog ─────────────────────────────────────────────── */}
        <AlertDialog open={showVerifyAllDialog} onOpenChange={setShowVerifyAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve All Pending Documents</AlertDialogTitle>
              <AlertDialogDescription>
                This will approve all {pendingDocs.length} pending documents for this vendor.
                Once approved, the vendor will be fully verified and can start accepting orders.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={approveAllDocs.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmVerifyAll} disabled={approveAllDocs.isPending}>
                {approveAllDocs.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Approve All Pending
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}