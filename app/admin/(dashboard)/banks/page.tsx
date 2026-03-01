"use client";

import { useState } from "react";
import { Search, Building2, Truck, CheckCircle2, Clock, XCircle, ChevronRight, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useVendorBankDetails, useDeliveryBoyBankDetails } from "@/hooks/banks/useBankdetails";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
    icon: <XCircle className="h-3 w-3" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.pending;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", config.className)}>
      {config.icon}
      {config.label}
    </span>
  );
}

function BankCard({
  id,
  name,
  bankName,
  accountNumber,
  ifscCode,
  status,
  createdAt,
  type,
}: {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  status: string;
  createdAt: string;
  type: "vendor" | "delivery";
}) {
  return (
    <Link href={`/admin/banks/${id}?type=${type}`}>
      <div className="group relative flex items-center gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 transition-all duration-200 hover:border-border hover:shadow-sm hover:bg-accent/30 cursor-pointer">
        {/* Avatar */}
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold",
          type === "vendor" ? "bg-violet-500" : "bg-sky-500"
        )}>
          {name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-sm text-foreground truncate">{name}</p>
            <StatusBadge status={status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {bankName} &middot; ••••{accountNumber.slice(-4)} &middot; {ifscCode}
          </p>
        </div>

        {/* Date + arrow */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {new Date(createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
        </div>
      </div>
    </Link>
  );
}

function BankListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-border/60 bg-card px-5 py-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-3 w-20 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

function VendorBankList({ statusFilter, search }: { statusFilter: string; search: string }) {
  const { data, isLoading, error } = useVendorBankDetails({ status: statusFilter });

  const filtered = data?.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const storeName = (item.vendors as any)?.store_name ?? "";
    return (
      storeName.toLowerCase().includes(q) ||
      item.bank_name.toLowerCase().includes(q) ||
      item.account_number.includes(q) ||
      item.ifsc_code.toLowerCase().includes(q)
    );
  });

  if (isLoading) return <BankListSkeleton />;

  console.log("error", error);
  if (error) return (
    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-5 py-8 text-center text-sm text-red-600 dark:text-red-400">
      Failed to load vendor bank details.
    </div>
  );
  if (!filtered?.length) return (
    <div className="rounded-xl border border-dashed border-border/60 px-5 py-12 text-center text-sm text-muted-foreground">
      No vendor bank details found.
    </div>
  );

  return (
    <div className="space-y-2">
      {filtered.map((item) => (
        <BankCard
          key={item.id}
          id={item.id}
          name={(item.vendors as any)?.store_name ?? "Unknown Store"}
          bankName={item.bank_name}
          accountNumber={item.account_number}
          ifscCode={item.ifsc_code}
          status={item.status ?? "pending"}
          createdAt={item.created_at ?? ""}
          type="vendor"
        />
      ))}
    </div>
  );
}

function DeliveryBankList({ statusFilter, search }: { statusFilter: string; search: string }) {
  const { data, isLoading, error } = useDeliveryBoyBankDetails({ status: statusFilter });

  const filtered = data?.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const boy = item.delivery_boys as any;
    const fullName = `${boy?.first_name ?? ""} ${boy?.last_name ?? ""}`;
    return (
      fullName.toLowerCase().includes(q) ||
      item.bank_name.toLowerCase().includes(q) ||
      item.account_number.includes(q) ||
      item.ifsc_code.toLowerCase().includes(q)
    );
  });

  if (isLoading) return <BankListSkeleton />;

  console.log("error", error);
  if (error) return (
    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-5 py-8 text-center text-sm text-red-600 dark:text-red-400">
      Failed to load delivery bank details.
    </div>
  );
  if (!filtered?.length) return (
    <div className="rounded-xl border border-dashed border-border/60 px-5 py-12 text-center text-sm text-muted-foreground">
      No delivery boy bank details found.
    </div>
  );

  return (
    <div className="space-y-2">
      {filtered.map((item) => {
        const boy = item.delivery_boys as any;
        const fullName = `${boy?.first_name ?? ""} ${boy?.last_name ?? ""}`.trim() || "Unknown";
        return (
          <BankCard
            key={item.id}
            id={item.id}
            name={fullName}
            bankName={item.bank_name}
            accountNumber={item.account_number}
            ifscCode={item.ifsc_code}
            status={item.status ?? "pending"}
            createdAt={item.created_at ?? ""}
            type="delivery"
          />
        );
      })}
    </div>
  );
}

export default function BankDetailsListPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Bank Details</h1>
            <p className="text-sm text-muted-foreground">Review and approve bank accounts for payouts</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, bank, IFSC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="vendor" className="space-y-4 flex-col">
          <TabsList className="h-9 bg-muted/50">
            <TabsTrigger value="vendor" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Building2 className="h-3.5 w-3.5" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Truck className="h-3.5 w-3.5" />
              Delivery Boys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendor" className="mt-0">
            <VendorBankList statusFilter={statusFilter} search={search} />
          </TabsContent>

          <TabsContent value="delivery" className="mt-0">
            <DeliveryBankList statusFilter={statusFilter} search={search} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}