"use client";

import { useMemo, useState } from "react";
import {
  Search, CheckCircle, XCircle, FileText,
  Loader2, Clock, Users, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import Link from "next/link";
import {
  useDeliveryBoys,
  useUpdateDeliveryBoyKycStatus,
} from "@/hooks";

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function KycApprovalQueuePage() {
  // fetch ALL delivery boys, filter to pending client-side
  // (avoids a separate endpoint; the list is already cached from the main page)
  const { data: allPartners = [], isLoading } = useDeliveryBoys({ kyc_status: "pending" });
  const updateKyc = useUpdateDeliveryBoyKycStatus();

  const [search,          setSearch]          = useState("");
  const [vehicleFilter,   setVehicleFilter]   = useState("all");
  const [selected,        setSelected]        = useState<string[]>([]);
  const [showApprove,     setShowApprove]     = useState(false);
  const [showReject,      setShowReject]      = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing,      setProcessing]      = useState(false);

  // ── filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allPartners.filter((p) => {
      const matchSearch =
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q) ||
        (p.vehicle_number ?? "").toLowerCase().includes(q);
      const matchVehicle =
        vehicleFilter === "all" || p.vehicle_type === vehicleFilter;
      return matchSearch && matchVehicle;
    });
  }, [allPartners, search, vehicleFilter]);

  // ── selection helpers ─────────────────────────────────────────────────────
  const allSelected = filtered.length > 0 && selected.length === filtered.length;

  const toggleOne = (userId: string) =>
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );

  const toggleAll = () =>
    setSelected(allSelected ? [] : filtered.map((p) => p.user_id));

  // ── bulk approve ──────────────────────────────────────────────────────────
  const confirmApprove = async () => {
    setProcessing(true);
    let successCount = 0;

    // fire mutations sequentially to avoid hammering the DB
    for (const userId of selected) {
      await new Promise<void>((resolve) => {
        updateKyc.mutate(
          { userId, status: "approved" },
          {
            onSuccess: () => { successCount++; resolve(); },
            onError:   () => resolve(),
          }
        );
      });
    }

    setProcessing(false);
    setSelected([]);
    setShowApprove(false);
    toast.success(`${successCount} partner(s) approved successfully`);
  };

  // ── bulk reject ───────────────────────────────────────────────────────────
  const confirmReject = async () => {
    if (!rejectionReason.trim()) return;
    setProcessing(true);
    let successCount = 0;

    for (const userId of selected) {
      await new Promise<void>((resolve) => {
        updateKyc.mutate(
          { userId, status: "rejected", rejectedReason: rejectionReason },
          {
            onSuccess: () => { successCount++; resolve(); },
            onError:   () => resolve(),
          }
        );
      });
    }

    setProcessing(false);
    setSelected([]);
    setShowReject(false);
    setRejectionReason("");
    toast.error(`${successCount} partner(s) rejected`);
  };

  // ── single quick-approve ──────────────────────────────────────────────────
  const quickApprove = (userId: string, name: string) => {
    updateKyc.mutate(
      { userId, status: "approved" },
      {
        onSuccess: () => toast.success(`KYC approved for ${name}`),
        onError:   () => toast.error("Failed to approve"),
      }
    );
  };

  // ── loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">KYC Approval Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review and approve pending KYC documents
          </p>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowApprove(true)}
              disabled={processing}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve Selected ({selected.length})
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowReject(true)}
              disabled={processing}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject Selected ({selected.length})
            </Button>
          </div>
        )}
      </div>

      {/* ── stats ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Clock}
          label="Total Pending"
          value={allPartners.length}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30"
        />
        <StatCard
          icon={Users}
          label="Showing"
          value={filtered.length}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30"
        />
        <StatCard
          icon={ShieldCheck}
          label="Selected"
          value={selected.length}
          color="bg-violet-100 text-violet-600 dark:bg-violet-900/30"
        />
      </div>

      {/* ── filters ────────────────────────────────────────────────────── */}
      <Card className="border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Name or vehicle number…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <div className="w-full sm:w-48 space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Vehicle Type
              </label>
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  <SelectItem value="Bike">Bike</SelectItem>
                  <SelectItem value="Scooter">Scooter</SelectItem>
                  <SelectItem value="Bicycle">Bicycle</SelectItem>
                  <SelectItem value="Car">Car</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground pb-2 whitespace-nowrap">
              {filtered.length} pending partner(s)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── table ──────────────────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="w-12 pl-5">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="pr-5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((partner) => {
                    const isSelected  = selected.includes(partner.user_id);
                    const name        = `${partner.first_name} ${partner.last_name}`;

                    return (
                      <TableRow
                        key={partner.id}
                        className={`border-border/40 transition-colors ${
                          isSelected ? "bg-muted/50" : ""
                        }`}
                      >
                        <TableCell className="pl-5">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleOne(partner.user_id)}
                            aria-label={`Select ${name}`}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={partner.profile_photo ?? ""} />
                              <AvatarFallback className="text-xs bg-muted">
                                {initials(partner.first_name, partner.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-none">{name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                {partner.user_id.slice(0, 14)}…
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="text-sm font-medium">{partner.vehicle_type ?? "—"}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {partner.vehicle_number ?? "—"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-xs border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                          >
                            Pending
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {partner.created_at
                            ? new Date(partner.created_at).toLocaleDateString()
                            : "—"}
                        </TableCell>

                        <TableCell className="pr-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/delivery/${partner.user_id}/kyc`}>
                              <Button variant="outline" size="sm">
                                <FileText className="mr-1.5 h-3.5 w-3.5" />
                                Review
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              onClick={() => quickApprove(partner.user_id, name)}
                              disabled={updateKyc.isPending}
                            >
                              {updateKyc.isPending && selected.includes(partner.user_id) ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Approve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-5 inline-block">
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">No pending KYC approvals</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search || vehicleFilter !== "all"
                ? "Try adjusting your filters"
                : "All partners have been reviewed"}
            </p>
            <div className="flex gap-2 mt-4">
              {(search || vehicleFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearch(""); setVehicleFilter("all"); }}
                >
                  Clear filters
                </Button>
              )}
              <Link href="/admin/delivery">
                <Button size="sm">View All Partners</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── approve dialog ────────────────────────────────────────────── */}
      <AlertDialog open={showApprove} onOpenChange={setShowApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Selected Partners</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve KYC for{" "}
              <strong>{selected.length} partner(s)</strong>? They will be able
              to start accepting deliveries immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setSelected([])}
              disabled={processing}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmApprove} disabled={processing}>
              {processing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Approving…</>
              ) : (
                `Approve ${selected.length} Partner(s)`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── reject dialog ─────────────────────────────────────────────── */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Selected Partners</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting{" "}
              <strong>{selected.length} partner(s)</strong>. They will be
              notified and need to resubmit their documents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-3">
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
              disabled={processing}
              onClick={() => {
                setShowReject(false);
                setRejectionReason("");
                setSelected([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason.trim() || processing}
            >
              {processing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rejecting…</>
              ) : (
                `Reject ${selected.length} Partner(s)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}