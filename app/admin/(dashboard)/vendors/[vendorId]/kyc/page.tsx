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
  Image as ImageIcon,
  ZoomIn,
  User
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
  DialogTrigger,
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
import Link from "next/link";
import { useParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type KycDocumentStatus = "not_uploaded" | "pending" | "verified" | "approved" | "rejected";
type KycDocumentType = "aadhaar" | "pan" | "driving_license" | "bank_passbook" | "profile_photo";

interface KycDocument {
  id: string;
  user_id: string;
  user_type: "vendor" | "delivery_boy";
  document_type: KycDocumentType;
  document_name: string;
  document_description?: string | null;
  document_url?: string | null;
  document_number?: string | null;
  status: KycDocumentStatus;
  uploaded_date?: string | null;
  verified_date?: string | null;
  verified_by?: string | null;
  rejection_reason?: string | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

// Mock vendor data
const mockVendor = {
  id: "VEN-001",
  user_id: "usr_123456",
  name: "Rajesh Kumar",
  email: "rajesh@freshmart.com",
  phone: "+91 98765 43210",
  business_name: "Fresh Mart",
  created_at: "2024-01-15T10:30:00Z",
};

// Mock KYC documents
const initialDocuments: KycDocument[] = [
  {
    id: "kyc_001",
    user_id: "usr_123456",
    user_type: "vendor",
    document_type: "pan",
    document_name: "PAN Card",
    document_description: "Permanent Account Number Card",
    document_url: "/documents/pan.jpg",
    document_number: "ABCDE1234F",
    status: "pending",
    uploaded_date: "2024-02-10T10:30:00Z",
    verified_date: null,
    verified_by: null,
    rejection_reason: null,
    is_required: true,
    created_at: "2024-02-10T10:30:00Z",
    updated_at: "2024-02-10T10:30:00Z",
  },
  {
    id: "kyc_002",
    user_id: "usr_123456",
    user_type: "vendor",
    document_type: "aadhaar",
    document_name: "Aadhaar Card",
    document_description: "Aadhaar Card - Front Side",
    document_url: "/documents/aadhaar.jpg",
    document_number: "XXXX XXXX 7890",
    status: "approved",
    uploaded_date: "2024-02-10T10:35:00Z",
    verified_date: "2024-02-10T14:20:00Z",
    verified_by: "admin_001",
    rejection_reason: null,
    is_required: true,
    created_at: "2024-02-10T10:35:00Z",
    updated_at: "2024-02-10T14:20:00Z",
  },
  {
    id: "kyc_003",
    user_id: "usr_123456",
    user_type: "vendor",
    document_type: "bank_passbook",
    document_name: "Bank Passbook",
    document_description: "Bank account verification document",
    document_url: "/documents/bank.jpg",
    document_number: "HDFC0001234",
    status: "pending",
    uploaded_date: "2024-02-10T11:00:00Z",
    verified_date: null,
    verified_by: null,
    rejection_reason: null,
    is_required: true,
    created_at: "2024-02-10T11:00:00Z",
    updated_at: "2024-02-10T11:00:00Z",
  },
  {
    id: "kyc_004",
    user_id: "usr_123456",
    user_type: "vendor",
    document_type: "profile_photo",
    document_name: "Profile Photo",
    document_description: "Vendor profile photograph",
    document_url: "/documents/profile.jpg",
    document_number: null,
    status: "rejected",
    uploaded_date: "2024-02-09T15:30:00Z",
    verified_date: null,
    verified_by: "admin_001",
    rejection_reason: "Photo is blurry and face is not clearly visible. Please upload a clear, well-lit photo with a plain background.",
    is_required: true,
    created_at: "2024-02-09T15:30:00Z",
    updated_at: "2024-02-10T09:15:00Z",
  },
  {
    id: "kyc_005",
    user_id: "usr_123456",
    user_type: "vendor",
    document_type: "driving_license",
    document_name: "Driving License",
    document_description: "Valid driving license (Optional)",
    document_url: null,
    document_number: null,
    status: "not_uploaded",
    uploaded_date: null,
    verified_date: null,
    verified_by: null,
    rejection_reason: null,
    is_required: false,
    created_at: "2024-02-10T10:30:00Z",
    updated_at: "2024-02-10T10:30:00Z",
  },
];

const statusColors = {
  not_uploaded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  verified: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const documentTypeLabels = {
  aadhaar: "Aadhaar Card",
  pan: "PAN Card",
  driving_license: "Driving License",
  bank_passbook: "Bank Passbook",
  profile_photo: "Profile Photo",
};

export default function VendorVerificationPage() {
  const { vendorId } = useParams()
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedDoc, setSelectedDoc] = useState<KycDocument | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showVerifyAllDialog, setShowVerifyAllDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = (doc: KycDocument) => {
    setSelectedDoc(doc);
    setShowApproveDialog(true);
  };

  const confirmApprove = () => {
    if (selectedDoc) {
      setDocuments(documents.map(doc =>
        doc.id === selectedDoc.id
          ? {
            ...doc,
            status: "approved",
            verified_date: new Date().toISOString(),
            verified_by: "admin_current",
            rejection_reason: null,
          }
          : doc
      ));
      setShowApproveDialog(false);
      setSelectedDoc(null);
    }
  };

  const handleReject = (doc: KycDocument) => {
    setSelectedDoc(doc);
    setRejectionReason(doc.rejection_reason || "");
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (selectedDoc && rejectionReason.trim()) {
      setDocuments(documents.map(doc =>
        doc.id === selectedDoc.id
          ? {
            ...doc,
            status: "rejected",
            rejection_reason: rejectionReason,
            verified_by: "admin_current",
          }
          : doc
      ));
      setShowRejectDialog(false);
      setSelectedDoc(null);
      setRejectionReason("");
    }
  };

  const handlePreview = (doc: KycDocument) => {
    setSelectedDoc(doc);
    setShowPreviewDialog(true);
  };

  const handleVerifyAll = () => {
    setShowVerifyAllDialog(true);
  };

  const confirmVerifyAll = () => {
    setDocuments(documents.map(doc =>
      doc.is_required && (doc.status === "pending" || doc.status === "verified")
        ? {
          ...doc,
          status: "approved",
          verified_date: new Date().toISOString(),
          verified_by: "admin_current",
        }
        : doc
    ));
    setShowVerifyAllDialog(false);
  };

  const uploadedDocuments = documents.filter(doc => doc.status !== "not_uploaded");
  const requiredDocs = documents.filter(doc => doc.is_required);
  const approvedRequiredDocs = requiredDocs.filter(doc => doc.status === "approved");
  const pendingDocs = documents.filter(doc => doc.status === "pending" || doc.status === "verified");
  const rejectedDocs = documents.filter(doc => doc.status === "rejected");
  const allRequiredApproved = requiredDocs.length === approvedRequiredDocs.length;

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

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
              <AvatarFallback className="text-xl">{getInitials(mockVendor.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {mockVendor.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mockVendor.business_name} • {mockVendor.email}
              </p>
              <p className="text-xs text-muted-foreground">Vendor ID: {vendorId}</p>
            </div>
          </div>
          {pendingDocs.length > 0 && (
            <Button onClick={handleVerifyAll} className="w-full sm:w-auto">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Approve All Pending
            </Button>
          )}
        </div>

        {/* Status Banner */}
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
              {rejectedDocs.length} document(s) have been rejected. The vendor needs to reupload them.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold">{uploadedDocuments.length} / {documents.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Uploaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-yellow-600">{pendingDocs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-green-600">{approvedRequiredDocs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Of {requiredDocs.length} required</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-red-600">{rejectedDocs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Need reupload</p>
            </CardContent>
          </Card>
        </div>

        {/* Documents Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="overflow-hidden flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      {doc.document_type === "profile_photo" ? (
                        <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="truncate">{documentTypeLabels[doc.document_type]}</span>
                    </CardTitle>
                    {doc.document_description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {doc.document_description}
                      </p>
                    )}
                  </div>
                  <Badge className={`${statusColors[doc.status]} flex-shrink-0`}>
                    {doc.status === "not_uploaded" ? "Not Uploaded" : doc.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Document Image/Placeholder */}
                {doc.status !== "not_uploaded" ? (
                  <div
                    className="relative aspect-[4/3] bg-gradient-to-br from-muted via-muted to-muted/80 group cursor-pointer overflow-hidden"
                    onClick={() => handlePreview(doc)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {doc.document_type === "profile_photo" ? (
                        <div className="text-center p-4">
                          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center mb-3">
                            <User className="h-12 w-12 text-blue-500" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">Profile Photo</p>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <FileText className="h-20 w-20 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-sm font-medium text-muted-foreground">{documentTypeLabels[doc.document_type]}</p>
                        </div>
                      )}
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex flex-col items-center gap-2">
                          <ZoomIn className="h-8 w-8 text-white" />
                          <span className="text-white text-sm font-medium">Click to View</span>
                        </div>
                      </div>
                    </div>


                    {/* Status Badge Overlay */}
                    {doc.status === "approved" && (
                      <div className="absolute top-3 left-3">
                        <div className="bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium shadow-lg">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approved
                        </div>
                      </div>
                    )}
                    {doc.status === "rejected" && (
                      <div className="absolute top-3 left-3">
                        <div className="bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium shadow-lg">
                          <XCircle className="h-3.5 w-3.5" />
                          Rejected
                        </div>
                      </div>
                    )}
                    {doc.status === "pending" && (
                      <div className="absolute top-3 left-3">
                        <div className="bg-yellow-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium shadow-lg">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Pending
                        </div>
                      </div>
                    )}
                  </div>
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

                {/* Document Details */}
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
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:border-orange-900 w-fit">
                      Required
                    </Badge>
                  )}

                  {/* Rejection Reason */}
                  {doc.rejection_reason && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-900">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-red-900 dark:text-red-400">Rejection Reason</p>
                          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                            {doc.rejection_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Action Buttons */}
              {doc.status !== "not_uploaded" && (
                <CardFooter className="p-4  gap-2 flex-wrap bg-white">
                  {(doc.status === "pending" || doc.status === "verified") && (
                    <>
                      <Button
                        className="flex-1 min-w-[120px]"
                        onClick={() => handleApprove(doc)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 min-w-[120px]"
                        onClick={() => handleReject(doc)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {doc.status === "rejected" && (
                    <Button
                      className="flex-1"
                      onClick={() => handleApprove(doc)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Anyway
                    </Button>
                  )}
                  {doc.status === "approved" && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleReject(doc)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Revoke Approval
                    </Button>
                  )}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>

        {/* Approve Dialog */}
        <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve <strong>{selectedDoc?.document_name}</strong>?
                This will mark the document as verified and approved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmApprove}>
                Approve Document
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Document</DialogTitle>
              <DialogDescription>
                Please provide a clear reason for rejecting <strong>{selectedDoc?.document_name}</strong>.
                The vendor will see this message and will need to reupload a corrected document.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rejection Reason *</label>
                <Textarea
                  placeholder="e.g., Document is blurry, information is not clearly visible, document has expired..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmReject}
                disabled={!rejectionReason.trim()}
              >
                Reject Document
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="sm:max-w-md h-[90vh] flex flex-col overflow-hidden p-0">

            {/* ---------------- HEADER ---------------- */}
            <div className="p-6 border-b shrink-0">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 min-w-0">
                  {selectedDoc?.document_type === "profile_photo" ? (
                    <User className="h-5 w-5 shrink-0" />
                  ) : (
                    <FileText className="h-5 w-5 shrink-0" />
                  )}
                  <span className="truncate">{selectedDoc?.document_name}</span>
                </DialogTitle>

                {/* NOT inside DialogDescription */}
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-4 text-sm flex-wrap min-w-0">
                    <span className="break-all">
                      Document ID: {selectedDoc?.id}
                    </span>

                    {selectedDoc?.status && (
                      <Badge
                        className={`max-w-full truncate ${statusColors[selectedDoc.status || "pending"]
                          }`}
                      >
                        {selectedDoc.status.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>

                  {selectedDoc?.uploaded_date && (
                    <DialogDescription className="text-xs break-words">
                      Uploaded:{" "}
                      {new Date(selectedDoc.uploaded_date).toLocaleString()}
                    </DialogDescription>
                  )}
                </div>
              </DialogHeader>

            </div>

            {/* ---------------- SCROLLABLE CONTENT ---------------- */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">

              {/* Preview */}
              <div className="relative w-full max-h-[60vh] bg-gradient-to-br 
        from-slate-50 to-slate-100 
        dark:from-slate-900 dark:to-slate-800 
        rounded-lg overflow-hidden border">

                <div className="flex items-center justify-center p-8 min-h-[300px]">

                  {selectedDoc?.document_type === "profile_photo" ? (
                    <div className="text-center w-full min-w-0">
                      <div className="relative w-64 h-64 mx-auto mb-6 rounded-full 
                bg-gradient-to-br from-blue-100 to-blue-200 
                dark:from-blue-900/30 dark:to-blue-800/30 
                flex items-center justify-center shadow-xl">
                        <User className="h-32 w-32 text-blue-400" />
                      </div>

                      <p className="text-xl font-semibold">
                        Profile Photo
                      </p>

                      <p className="text-sm text-muted-foreground mt-2">
                        Full resolution image would be displayed here
                      </p>
                    </div>
                  ) : (
                    <div className="text-center w-full min-w-0">
                      <FileText className="h-32 w-32 mx-auto text-muted-foreground/30 mb-6" />

                      <p className="text-xl font-semibold break-words">
                        {selectedDoc?.document_name}
                      </p>

                      <p className="text-sm text-muted-foreground mt-2">
                        Document preview would be displayed here
                      </p>

                      {selectedDoc?.document_number && (
                        <div className="mt-6 p-4 bg-background rounded-lg inline-block shadow-md max-w-full">
                          <p className="text-xs text-muted-foreground mb-1">
                            Document Number
                          </p>
                          <p className="text-lg font-mono font-bold break-all">
                            {selectedDoc.document_number}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* Description */}
              {selectedDoc?.document_description && (
                <div className="p-4 bg-muted/50 rounded-lg break-words">
                  <p className="text-sm text-muted-foreground break-words">
                    {selectedDoc.document_description}
                  </p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedDoc?.rejection_reason && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <AlertTitle className="text-red-600">
                    Previously Rejected
                  </AlertTitle>
                  <AlertDescription className="text-red-600 break-words">
                    {selectedDoc.rejection_reason}
                  </AlertDescription>
                </Alert>
              )}

            </div>

            {/* ---------------- FOOTER ---------------- */}
            <div className="p-6 border-t shrink-0 flex flex-col">
              <DialogFooter className="flex flex-col sm:flex-col gap-2">

                <div className="flex gap-2 flex-1 min-w-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreviewDialog(false)}
                    className="flex-1 sm:flex-initial"
                  >
                    Close
                  </Button>

                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-initial"
                  >
                    <Download className="mr-2 h-4 w-4 shrink-0" />
                    Download
                  </Button>
                </div>

                {selectedDoc &&
                  (selectedDoc.status === "pending" ||
                    selectedDoc.status === "verified" ||
                    selectedDoc.status === "rejected") && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setShowPreviewDialog(false);
                          handleApprove(selectedDoc);
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4 shrink-0" />
                        Approve
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => {
                          setShowPreviewDialog(false);
                          handleReject(selectedDoc);
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4 shrink-0" />
                        Reject
                      </Button>
                    </div>
                  )}
              </DialogFooter>
            </div>

          </DialogContent>
        </Dialog>


        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Share</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share link</DialogTitle>
              <DialogDescription>
                Anyone who has this link will be able to view this.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">
                  Link
                </Label>
                <Input
                  id="link"
                  defaultValue="https://ui.shadcn.com/docs/installation"
                  readOnly
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <Button type="button">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>



        {/* Verify All Dialog */}
        <AlertDialog open={showVerifyAllDialog} onOpenChange={setShowVerifyAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve All Pending Documents</AlertDialogTitle>
              <AlertDialogDescription>
                This will approve all pending and verified documents ({pendingDocs.length} documents)
                for this vendor. Once approved, the vendor will be fully verified and can start accepting orders.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmVerifyAll}>
                Approve All Pending
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}