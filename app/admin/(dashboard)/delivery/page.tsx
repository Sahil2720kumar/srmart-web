"use client";

import { useState, useMemo } from "react";
import {
  Search, Plus, MoreVertical, Eye, FileText,
  CheckCircle, XCircle, Wifi, WifiOff, Loader2,
  Bike, TrendingUp, Users, Clock,
  Edit2,
  AlertTriangle
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import Link from "next/link";
import {
  useDeliveryBoys,
  useUpdateDeliveryBoyKycStatus,
} from "@/hooks";

// ─── helpers ──────────────────────────────────────────────────────────────────

const kycBadge: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200",
};

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DeliveryPartnersPage() {
  const [search, setSearch]         = useState("");
  const [kycFilter, setKycFilter]   = useState("all");
  const [onlineFilter, setOnline]   = useState("all");

  const { data: partners = [], isLoading, error } = useDeliveryBoys();
  const approveKyc = useUpdateDeliveryBoyKycStatus();

  // ── client-side filtering ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return partners.filter((p) => {
      const matchSearch =
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q) ||
        (p.vehicle_number ?? "").toLowerCase().includes(q);
      const matchKyc    = kycFilter === "all" || p.kyc_status === kycFilter;
      const matchOnline =
        onlineFilter === "all" ||
        (onlineFilter === "online"  &&  p.is_online) ||
        (onlineFilter === "offline" && !p.is_online);
      return matchSearch && matchKyc && matchOnline;
    });
  }, [partners, search, kycFilter, onlineFilter]);

  // ── stats ────────────────────────────────────────────────────────────────
  const totalOnline   = partners.filter((p) => p.is_online).length;
  const totalPending  = partners.filter((p) => p.kyc_status === "pending").length;
  const totalApproved = partners.filter((p) => p.kyc_status === "approved").length;

  const handleApproveKyc = (userId: string, name: string) => {
    approveKyc.mutate(
      { userId, status: "approved" },
      {
        onSuccess: () => toast.success(`KYC approved for ${name}`),
        onError:   () => toast.error("Failed to approve KYC"),
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
  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <XCircle className="h-10 w-10 text-rose-500" />
        <p className="text-sm">Failed to load delivery partners.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Delivery Partners</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and verify your delivery fleet
          </p>
        </div>
        <Link href="/admin/delivery/verification">
          <Button className="bg-amber-400" >
            <AlertTriangle  className="mr-2 h-4 w-4" />
            View All Pending Kyc Verification
          </Button>
        </Link>
      </div>

      {/* ── stats ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users}       label="Total Partners" value={partners.length}  sub="All registered"       color="bg-blue-100 text-blue-600 dark:bg-blue-900/30" />
        <StatCard icon={Wifi}        label="Online Now"     value={totalOnline}       sub="Currently active"     color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" />
        <StatCard icon={Clock}       label="Pending KYC"   value={totalPending}      sub="Awaiting review"      color="bg-amber-100 text-amber-600 dark:bg-amber-900/30" />
        <StatCard icon={TrendingUp}  label="Verified"      value={totalApproved}     sub="Approved partners"    color="bg-violet-100 text-violet-600 dark:bg-violet-900/30" />
      </div>

      {/* ── filters ────────────────────────────────────────────────────── */}
      <Card className="border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Search</label>
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

            <div className="w-full sm:w-44 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">KYC Status</label>
              <Select value={kycFilter} onValueChange={setKycFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-44 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Online Status</label>
              <Select value={onlineFilter} onValueChange={setOnline}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground pb-2 whitespace-nowrap">
              {filtered.length} of {partners.length} partners
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
                    <TableHead className="pl-5">Partner</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Deliveries</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead className="pr-5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} className="border-border/40">
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={p.profile_photo ?? ""} />
                              <AvatarFallback className="text-xs bg-muted">
                                {initials(p.first_name, p.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                                p.is_online ? "bg-emerald-500" : "bg-zinc-400"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {p.first_name} {p.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {p.user_id.slice(0, 12)}…
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bike className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{p.vehicle_type ?? "—"}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {p.vehicle_number ?? "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold">{p.rating ?? "—"}</span>
                          {p.rating && <span className="text-yellow-400 text-xs">★</span>}
                          {p.review_count != null && (
                            <span className="text-xs text-muted-foreground">({p.review_count})</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm font-semibold tabular-nums">
                          {p.total_deliveries ?? 0}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className={`w-fit text-xs ${
                              p.is_online
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                                : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:bg-zinc-900/20 dark:text-zinc-400"
                            }`}
                          >
                            {p.is_online ? (
                              <><Wifi className="mr-1 h-3 w-3" />Online</>
                            ) : (
                              <><WifiOff className="mr-1 h-3 w-3" />Offline</>
                            )}
                          </Badge>
                          {p.is_available != null && (
                            <Badge
                              variant="outline"
                              className={`w-fit text-xs ${
                                p.is_available
                                  ? "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                  : "border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                              }`}
                            >
                              {p.is_available ? "Available" : "Busy"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${kycBadge[p.kyc_status ?? "pending"] ?? kycBadge.pending}`}
                        >
                          {p.kyc_status ?? "pending"}
                        </Badge>
                      </TableCell>

                      <TableCell className="pr-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/delivery/upsert?edit${p.user_id}`}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/delivery/${p.user_id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/delivery/${p.user_id}/kyc`}>
                                <FileText className="mr-2 h-4 w-4" />
                                View KYC
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={p.kyc_status === "approved" || approveKyc.isPending}
                              onClick={() =>
                                handleApproveKyc(p.user_id, `${p.first_name} ${p.last_name}`)
                              }
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                              Approve KYC
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-5">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">No partners found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => { setSearch(""); setKycFilter("all"); setOnline("all"); }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}