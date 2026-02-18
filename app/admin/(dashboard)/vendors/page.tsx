"use client";

import { useState } from "react";
import { Search, Plus, MoreVertical, Eye, FileText, Ban, CheckCircle, Loader2, Edit2, EyeIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useVendors, useUpdateVendor } from "@/hooks";
import type { Vendor } from "@/types/supabase";

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  active:    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const kycStatusColors: Record<string, string> = {
  not_uploaded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  pending:      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  verified:     "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  approved:     "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected:     "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

// Determine vendor "active/suspended" from suspension_reason field
function getVendorStatus(vendor: Vendor): "active" | "suspended" {
  return vendor.suspension_reason ? "suspended" : "active";
}

// ─── Row Skeleton ─────────────────────────────────────────────────────────────
function TableRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VendorsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery]     = useState("");
  const [statusFilter, setStatusFilter]   = useState<string>("all");
  const [kycFilter, setKycFilter]         = useState<string>("all");
  const [page, setPage]                   = useState(1);
  const PAGE_SIZE = 15;

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: vendors = [], isLoading, isError, refetch } = useVendors();
  const updateVendor = useUpdateVendor();

  // ── Toggle suspend/activate ───────────────────────────────────────────────
  const toggleVendorStatus = async (vendor: Vendor) => {
    const isCurrentlyActive = !vendor.suspension_reason;
    try {
      await updateVendor.mutateAsync({
        vendorId: vendor.user_id,
        updates: {
          suspension_reason:  isCurrentlyActive ? "Suspended by admin" : null,
          suspended_until:    isCurrentlyActive ? null : null,
        },
      });
      toast.success(isCurrentlyActive ? "Vendor suspended" : "Vendor activated");
    } catch {
      toast.error("Failed to update vendor status");
    }
  };

  // ── Filtering & pagination ────────────────────────────────────────────────
  const filteredVendors = vendors.filter((v) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      v.store_name.toLowerCase().includes(query) ||
      v.users?.email?.toLowerCase().includes(query) ||
      v.city?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active"    && !v.suspension_reason) ||
      (statusFilter === "suspended" &&  v.suspension_reason);

    const matchesKyc = kycFilter === "all" || v.kyc_status === kycFilter;

    return matchesSearch && matchesStatus && matchesKyc;
  });

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / PAGE_SIZE));
  const paginatedVendors = filteredVendors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Vendor Management</h1>
          <Button className="bg-amber-400" onClick={() => router.push("./vendors/verification")}>
            <AlertTriangle   className="mr-2 h-4 w-4" />
            View All Pending Kyc Verification
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Name, Email, Store..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">KYC Status</label>
                <Select value={kycFilter} onValueChange={(v) => { setKycFilter(v); setPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="not_uploaded">Not Submitted</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredVendors.length} of {vendors.length} vendors
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {isError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-sm text-red-600">Failed to load vendors.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor / Store</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} />)
                  ) : paginatedVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No vendors found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedVendors.map((vendor) => {
                      const status = getVendorStatus(vendor);
                      return (
                        <TableRow key={vendor.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={vendor.store_image ?? undefined} />
                                <AvatarFallback>{getInitials(vendor.store_name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{vendor.store_name}</p>
                                <p className="text-xs text-muted-foreground">{vendor.user_id.slice(0, 8)}…</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{vendor.users?.email ?? "—"}</TableCell>
                          <TableCell className="text-sm">{vendor.users?.phone ?? "—"}</TableCell>
                          <TableCell className="text-sm">{vendor.city ?? "—"}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[status]}>{status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={kycStatusColors[vendor.kyc_status ?? "not_uploaded"]}>
                              {(vendor.kyc_status ?? "not_uploaded").replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {vendor.created_at
                              ? new Date(vendor.created_at).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/vendors/upsert?edit=${vendor.user_id}`}>
                                    <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/vendors/${vendor.user_id}`}>
                                    <Eye className="mr-2 h-4 w-4" /> View Profile
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/vendors/${vendor.user_id}/kyc`}>
                                    <FileText className="mr-2 h-4 w-4" /> Review KYC
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => toggleVendorStatus(vendor)}
                                  disabled={updateVendor.isPending}
                                >
                                  {status === "active" ? (
                                    <>
                                      <Ban className="mr-2 h-4 w-4" /> Suspend
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" /> Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}