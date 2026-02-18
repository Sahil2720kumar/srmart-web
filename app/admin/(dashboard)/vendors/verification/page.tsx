"use client";

import { useState, useMemo } from "react";
import { Search, FileText, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useApproveAllKycDocuments, useUpdateVendorKycStatus } from "@/hooks";

// ─── Types ────────────────────────────────────────────────────────────────────

type KycStatus = "pending" | "partially_approved" | "approved" | "verified" | "rejected";

interface VendorInQueue {
  /** vendors.user_id */
  id: string;
  store_name: string;
  email: string;
  kyc_status: KycStatus;
  is_verified: boolean;
  created_at: string | null;
  // aggregated from kyc_documents
  total_documents: number;
  submitted_documents: number;
  pending_documents: number;
  approved_documents: number;
  rejected_documents: number;
}

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabase = createClient();

// ─── Data hook ────────────────────────────────────────────────────────────────

/**
 * Fetches all vendors joined with their kyc_documents aggregate counts.
 * We pull vendors + kyc_documents in two queries then merge client-side
 * to avoid a complex RPC.
 */
function useKycQueue() {
  return useQuery<VendorInQueue[]>({
    queryKey: ["kyc_queue"],
    queryFn: async () => {
      // 1. All vendors (with user email)
      const { data: vendors, error: vendorsError } = await supabase
        .from("vendors")
        .select("user_id, store_name, kyc_status, is_verified, created_at, users(email)")
        .order("created_at", { ascending: false });

      if (vendorsError) throw vendorsError;

      // 2. All kyc_documents grouped by user_id + status
      const { data: docs, error: docsError } = await supabase
        .from("kyc_documents")
        .select("user_id, status")
        .eq("user_type", "vendor");

      if (docsError) throw docsError;

      // 3. Build a map: user_id → { total, pending, approved, rejected }
      type DocCounts = {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
      };

      const docMap = new Map<string, DocCounts>();

      for (const doc of docs ?? []) {
        const uid = doc.user_id;
        if (!docMap.has(uid)) {
          docMap.set(uid, { total: 0, pending: 0, approved: 0, rejected: 0 });
        }
        const counts = docMap.get(uid)!;
        counts.total += 1;
        const s = doc.status ?? "pending";
        if (s === "pending")           counts.pending  += 1;
        else if (s === "approved")     counts.approved += 1;
        else if (s === "rejected")     counts.rejected += 1;
      }

      // 4. Merge
      return (vendors ?? []).map((v) => {
        const counts = docMap.get(v.user_id) ?? {
          total: 0, pending: 0, approved: 0, rejected: 0,
        };
        return {
          id:                   v.user_id,
          store_name:           v.store_name,
          email:                (v.users as any)?.email ?? "—",
          kyc_status:           (v.kyc_status ?? "pending") as KycStatus,
          is_verified:          v.is_verified ?? false,
          created_at:           v.created_at,
          total_documents:      counts.total,
          submitted_documents:  counts.total,   // every row in kyc_documents is "submitted"
          pending_documents:    counts.pending,
          approved_documents:   counts.approved,
          rejected_documents:   counts.rejected,
        } satisfies VendorInQueue;
      });
    },
    staleTime: 30_000,
  });
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const kycStatusColors: Record<string, string> = {
  pending:            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  partially_approved: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
  approved:           "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  verified:           "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  rejected:           "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",
};

function kycLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Derived status helper ────────────────────────────────────────────────────

/**
 * Derive a display status from live document counts so the badge
 * reflects reality even if the DB kyc_status lags behind.
 */
function deriveStatus(v: VendorInQueue): KycStatus {
  if (v.rejected_documents > 0)                                           return "rejected";
  if (v.pending_documents === 0 && v.approved_documents === v.total_documents && v.total_documents > 0)
                                                                          return "approved";
  if (v.approved_documents > 0 && v.pending_documents > 0)               return "partially_approved";
  return v.kyc_status;
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 9 }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-5 w-full" /></TableCell>
      ))}
    </TableRow>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VendorVerificationPage() {
  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading, error } = useKycQueue();

  // Mutations
  const approveAllDocs  = useApproveAllKycDocuments();
  const updateKycStatus = useUpdateVendorKycStatus();

  // UI state
  const [searchQuery, setSearchQuery]               = useState("");
  const [statusFilter, setStatusFilter]             = useState<string>("all");
  const [sortBy, setSortBy]                         = useState<string>("newest");
  const [selectedVendors, setSelectedVendors]       = useState<string[]>([]);
  const [showApproveDialog, setShowApproveDialog]   = useState(false);
  const [showBulkDialog, setShowBulkDialog]         = useState(false);
  const [approveVendorId, setApproveVendorId]       = useState<string | null>(null);
  const [approvingId, setApprovingId]               = useState<string | null>(null);
  const [bulkApproving, setBulkApproving]           = useState(false);

  // ── Filtering + sorting ────────────────────────────────────────────────────
  const filteredVendors = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return vendors
      .filter((v) => {
        const matchSearch =
          v.store_name.toLowerCase().includes(q) ||
          v.email.toLowerCase().includes(q);

        const derived = deriveStatus(v);
        const matchStatus =
          statusFilter === "all" ||
          (statusFilter === "pending_review"    && derived === "pending") ||
          (statusFilter === "partially_approved" && derived === "partially_approved") ||
          (statusFilter === "rejected"           && derived === "rejected") ||
          (statusFilter === "approved"           && (derived === "approved" || derived === "verified"));

        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const da = new Date(a.created_at ?? 0).getTime();
        const db = new Date(b.created_at ?? 0).getTime();
        return sortBy === "newest" ? db - da : da - db;
      });
  }, [vendors, searchQuery, statusFilter, sortBy]);

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleVendorSelection = (id: string) =>
    setSelectedVendors((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () => {
    setSelectedVendors(
      selectedVendors.length === filteredVendors.length
        ? []
        : filteredVendors.map((v) => v.id)
    );
  };

  const canApproveAll = (v: VendorInQueue) =>
    v.pending_documents > 0 && v.rejected_documents === 0;

  // ── Single approve-all ─────────────────────────────────────────────────────
  const handleApproveAll = (id: string) => {
    setApproveVendorId(id);
    setShowApproveDialog(true);
  };

  const confirmApproveAll = async () => {
    if (!approveVendorId) return;
    setApprovingId(approveVendorId);
    try {
      // 1. Approve all kyc_documents for this vendor
      await approveAllDocs.mutateAsync({
        userId:     approveVendorId,
        verifiedBy: "admin", // replace with authed admin user id if available
      });
      // 2. Update vendor kyc_status → verified
      await updateKycStatus.mutateAsync({
        vendorId: approveVendorId,
        status:   "verified",
      });
      queryClient.invalidateQueries({ queryKey: ["kyc_queue"] });
    } finally {
      setApprovingId(null);
      setShowApproveDialog(false);
      setApproveVendorId(null);
    }
  };

  // ── Bulk approve ───────────────────────────────────────────────────────────
  const confirmBulkApprove = async () => {
    setBulkApproving(true);
    try {
      await Promise.all(
        selectedVendors.map(async (id) => {
          await approveAllDocs.mutateAsync({ userId: id, verifiedBy: "admin" });
          await updateKycStatus.mutateAsync({ vendorId: id, status: "verified" });
        })
      );
      queryClient.invalidateQueries({ queryKey: ["kyc_queue"] });
      setSelectedVendors([]);
    } finally {
      setBulkApproving(false);
      setShowBulkDialog(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vendor Verification Queue</h1>
            <p className="text-muted-foreground mt-1">
              Review and approve pending vendor KYC documents
            </p>
          </div>
          {selectedVendors.length > 0 && (
            <Button onClick={() => setShowBulkDialog(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve Selected ({selectedVendors.length})
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load vendors. Please refresh the page.
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Store name or email…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter by Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="partially_approved">Partially Approved</SelectItem>
                    <SelectItem value="approved">Approved / Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Count */}
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredVendors.length} of {vendors.length} vendors
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          filteredVendors.length > 0 &&
                          selectedVendors.length === filteredVendors.length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Docs (submitted/total)</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Rejected</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                    : filteredVendors.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                          No vendors match your filters.
                        </TableCell>
                      </TableRow>
                    )
                    : filteredVendors.map((vendor) => {
                        const derived    = deriveStatus(vendor);
                        const isApproving = approvingId === vendor.id;

                        return (
                          <TableRow key={vendor.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedVendors.includes(vendor.id)}
                                onCheckedChange={() => toggleVendorSelection(vendor.id)}
                              />
                            </TableCell>

                            {/* Store */}
                            <TableCell>
                              <div>
                                <p className="font-medium">{vendor.store_name}</p>
                                {vendor.is_verified && (
                                  <p className="text-xs text-green-600 dark:text-green-400">
                                    ✓ Identity verified
                                  </p>
                                )}
                              </div>
                            </TableCell>

                            {/* Email */}
                            <TableCell className="text-sm text-muted-foreground">
                              {vendor.email}
                            </TableCell>

                            {/* Doc counts */}
                            <TableCell>
                              <span className="font-semibold">
                                {vendor.submitted_documents}/{vendor.total_documents || "—"}
                              </span>
                            </TableCell>

                            {/* Pending */}
                            <TableCell>
                              {vendor.pending_documents > 0 ? (
                                <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20">
                                  {vendor.pending_documents}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>

                            {/* Rejected */}
                            <TableCell>
                              {vendor.rejected_documents > 0 ? (
                                <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20">
                                  {vendor.rejected_documents}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <Badge className={kycStatusColors[derived] ?? kycStatusColors.pending}>
                                {kycLabel(derived)}
                              </Badge>
                            </TableCell>

                            {/* Date */}
                            <TableCell className="text-sm">
                              {vendor.created_at
                                ? new Date(vendor.created_at).toLocaleDateString()
                                : "—"}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Link href={`/admin/vendors/${vendor.id}/kyc`}>
                                  <Button variant="outline" size="sm">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Review KYC
                                  </Button>
                                </Link>

                                {canApproveAll(vendor) && (
                                  <Button
                                    size="sm"
                                    disabled={isApproving}
                                    onClick={() => handleApproveAll(vendor.id)}
                                  >
                                    {isApproving
                                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      : <CheckCircle className="mr-2 h-4 w-4" />
                                    }
                                    Approve All
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  }
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Single Approve Dialog */}
        <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve All Documents</AlertDialogTitle>
              <AlertDialogDescription>
                This will approve all pending KYC documents for this vendor and set their
                KYC status to <strong>Verified</strong>. They will be able to start
                accepting orders immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!approvingId}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmApproveAll}
                disabled={!!approvingId}
              >
                {approvingId
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Approving…</>
                  : "Approve All"
                }
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Approve Dialog */}
        <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bulk Approve Selected Vendors</AlertDialogTitle>
              <AlertDialogDescription>
                This will approve all pending KYC documents for{" "}
                <strong>{selectedVendors.length}</strong> selected vendor(s) and mark
                them as <strong>Verified</strong>. They will be able to start accepting
                orders immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkApproving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkApprove}
                disabled={bulkApproving}
              >
                {bulkApproving
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Approving…</>
                  : `Approve ${selectedVendors.length} Vendor(s)`
                }
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}