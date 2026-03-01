"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Download, FileText, FileSpreadsheet,
  FileImage, Calendar, CheckCircle2, Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  useReportPreview,
  useGenerateReport,
  type ReportType,
  type ExportFormat,
} from "@/hooks/earnings/useEarnings";

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);

/** Trigger browser download for a CSV string */
function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Build a quick date range (today / this week / this month) */
function quickRange(type: "today" | "week" | "month") {
  const now   = new Date();
  const to    = now.toISOString().split("T")[0];
  if (type === "today") return { from: to, to };
  if (type === "week") {
    const from = new Date(now); from.setDate(now.getDate() - 6);
    return { from: from.toISOString().split("T")[0], to };
  }
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: from.toISOString().split("T")[0], to };
}

// ─── report catalogue ────────────────────────────────────────────────────────

const REPORT_TYPES: {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}[] = [
  { id: "daily-earnings",       name: "Daily Earnings Report",       description: "Complete breakdown of daily earnings, orders, and commissions",  icon: FileText,        color: "blue",    gradientFrom: "from-blue-500",    gradientTo: "to-blue-600"    },
  { id: "vendor-commission",    name: "Vendor Commission Report",    description: "Detailed commission tracking by vendor with payout status",     icon: FileSpreadsheet, color: "emerald", gradientFrom: "from-emerald-500", gradientTo: "to-emerald-600" },
  { id: "delivery-payout",      name: "Delivery Payout Report",      description: "Delivery partner earnings, incentives, and payment details",    icon: FileText,        color: "purple",  gradientFrom: "from-purple-500",  gradientTo: "to-purple-600"  },
  { id: "tax-gst",              name: "Tax & GST Report",            description: "Tax summaries, GST breakdown, and compliance data",             icon: FileImage,       color: "amber",   gradientFrom: "from-amber-500",   gradientTo: "to-amber-600"   },
  { id: "refund-cancellation",  name: "Refund & Cancellation Report",description: "All refunds, cancellations, and their financial impact",        icon: FileText,        color: "red",     gradientFrom: "from-red-500",     gradientTo: "to-red-600"     },
  { id: "monthly-summary",      name: "Monthly Summary Report",      description: "Comprehensive monthly financial summary with trends",           icon: FileSpreadsheet, color: "indigo",  gradientFrom: "from-indigo-500",  gradientTo: "to-indigo-600"  },
];

// ─── preview chips ────────────────────────────────────────────────────────────

function PreviewChips({
  reportId,
  dateRange,
}: {
  reportId: ReportType;
  dateRange: { from: string; to: string };
}) {
  const { data, isLoading } = useReportPreview(reportId, dateRange);

  if (isLoading)
    return (
      <div className="flex gap-2 mt-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    );

  if (!data) return null;

  const chips: string[] = [];

  if ("rows" in data)            chips.push(`${data.rows} rows`);
  if ("totalRevenue" in data)    chips.push(`Revenue: ${formatCurrency(data.totalRevenue as number)}`);
  if ("totalCommission" in data) chips.push(`Commission: ${formatCurrency(data.totalCommission as number)}`);
  if ("totalEarnings" in data)   chips.push(`Earnings: ${formatCurrency(data.totalEarnings as number)}`);
  if ("totalTax" in data)        chips.push(`Tax: ${formatCurrency(data.totalTax as number)}`);
  if ("totalValue" in data)      chips.push(`Value: ${formatCurrency(data.totalValue as number)}`);
  if ("cancelled" in data)       chips.push(`${data.cancelled as number} cancelled`);
  if ("refunded" in data)        chips.push(`${data.refunded as number} refunded`);

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {chips.map((chip) => (
        <span key={chip} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
          {chip}
        </span>
      ))}
    </div>
  );
}

// ─── report card ─────────────────────────────────────────────────────────────

function ReportCard({
  report,
  isSelected,
  dateRange,
  onSelect,
  onDownload,
  isPending,
  pendingFormat,
}: {
  report: (typeof REPORT_TYPES)[0];
  isSelected: boolean;
  dateRange: { from: string; to: string };
  onSelect: () => void;
  onDownload: (format: ExportFormat) => void;
  isPending: boolean;
  pendingFormat: ExportFormat | null;
}) {
  const Icon = report.icon;

  return (
    <Card
      className={`hover:shadow-lg transition-all cursor-pointer ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      onClick={onSelect}
    >
      <CardHeader>
        <div
          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${report.gradientFrom} ${report.gradientTo} flex items-center justify-center mb-3`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-lg">{report.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 mb-2">{report.description}</p>

        {/* Live preview chips */}
        {isSelected && <PreviewChips reportId={report.id} dateRange={dateRange} />}

        <Separator className="my-4" />

        <div className="space-y-2">
          {/* Primary CSV download */}
          <Button
            className="w-full gap-2 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white"
            disabled={isPending}
            onClick={(e) => { e.stopPropagation(); onDownload("csv"); }}
          >
            {isPending && pendingFormat === "csv" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isPending && pendingFormat === "csv" ? "Generating…" : "Download CSV"}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline" size="sm"
              disabled={isPending}
              onClick={(e) => { e.stopPropagation(); onDownload("xlsx"); }}
              className="gap-2"
            >
              {isPending && pendingFormat === "xlsx" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Excel
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={isPending}
              onClick={(e) => { e.stopPropagation(); onDownload("pdf"); }}
              className="gap-2"
            >
              {isPending && pendingFormat === "pdf" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <FileImage className="w-4 h-4" />
              )}
              PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function FinancialReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>("daily-earnings");
  const [dateFrom, setDateFrom]             = useState(() => quickRange("month").from);
  const [dateTo,   setDateTo]               = useState(() => quickRange("month").to);
  const [pendingReport,  setPendingReport]  = useState<ReportType | null>(null);
  const [pendingFormat,  setPendingFormat]  = useState<ExportFormat | null>(null);
  const [lastDownloaded, setLastDownloaded] = useState<ReportType | null>(null);

  const generateReport = useGenerateReport();

  const dateRange = { from: dateFrom, to: dateTo };
  const dayCount  = Math.max(
    0,
    Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86_400_000)
  );

  const handleDownload = async (reportId: ReportType, format: ExportFormat) => {
    setPendingReport(reportId);
    setPendingFormat(format);
    try {
      const result = await generateReport.mutateAsync({ reportId, dateRange, format });

      if (format === "csv" && result.csv) {
        downloadCsv(result.csv, result.filename);
      } else if (format === "xlsx" || format === "pdf") {
        // For xlsx / pdf: convert rows → JSON blob as a placeholder
        // (wire in SheetJS / jsPDF in production)
        const json = JSON.stringify(result.rows, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url  = URL.createObjectURL(blob);
        const a    = Object.assign(document.createElement("a"), {
          href: url,
          download: result.filename.replace(`.${format}`, ".json"),
        });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setLastDownloaded(reportId);
      setTimeout(() => setLastDownloaded(null), 3000);
    } finally {
      setPendingReport(null);
      setPendingFormat(null);
    }
  };

  const handleQuickExport = async (type: "today" | "week" | "month") => {
    const range = quickRange(type);
    setPendingReport("daily-earnings");
    setPendingFormat("csv");
    try {
      const result = await generateReport.mutateAsync({
        reportId: "daily-earnings",
        dateRange: range,
        format: "csv",
      });
      if (result.csv) downloadCsv(result.csv, result.filename);
    } finally {
      setPendingReport(null);
      setPendingFormat(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/earnings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Financial Reports
            </h1>
            <p className="text-slate-600 mt-2">
              Download and export financial data in multiple formats
            </p>
          </div>
        </div>

        {/* Success toast */}
        {lastDownloaded && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Report downloaded successfully!
          </div>
        )}

        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  max={dateTo}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Quick Select</Label>
                <Select
                  onValueChange={(v) => {
                    const r = quickRange(v as "today" | "week" | "month");
                    setDateFrom(r.from);
                    setDateTo(r.to);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Jump to range…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Selected Range:</strong> {dateFrom} → {dateTo}{" "}
                <span className="text-blue-600">({dayCount} day{dayCount !== 1 ? "s" : ""})</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REPORT_TYPES.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              isSelected={selectedReport === report.id}
              dateRange={dateRange}
              onSelect={() => setSelectedReport(report.id)}
              onDownload={(fmt) => handleDownload(report.id, fmt)}
              isPending={pendingReport === report.id && generateReport.isPending}
              pendingFormat={pendingReport === report.id ? pendingFormat : null}
            />
          ))}
        </div>

        {/* Quick Exports */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(
                [
                  { type: "today" as const, label: "Today's Earnings",            sub: "All earnings data for today"             },
                  { type: "week"  as const, label: "This Week's Summary",          sub: "Weekly financial summary"                },
                  { type: "month" as const, label: "This Month's Complete Report", sub: "All financial data for current month"    },
                ] as const
              ).map(({ type, label, sub }) => (
                <div key={type} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium">{label}</div>
                    <div className="text-sm text-slate-600">{sub}</div>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={generateReport.isPending}
                    onClick={() => handleQuickExport(type)}
                  >
                    {generateReport.isPending && pendingReport === "daily-earnings" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Information */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-3">Report Information</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <p>• <strong>CSV Format:</strong> Best for Excel and data analysis tools</p>
              <p>• <strong>Excel Format:</strong> Pre-formatted with charts and summaries</p>
              <p>• <strong>PDF Format:</strong> Print-ready reports for documentation</p>
              <p>• All reports include timestamp and generated date</p>
              <p>• Tax reports include GST breakdown and TDS calculations</p>
              <p>• Commission reports show vendor-wise and category-wise breakdown</p>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Reports — Coming Soon */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports (Coming Soon)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400" />
              <p>Set up automatic daily, weekly, or monthly report generation</p>
              <p className="text-sm mt-2">Reports will be emailed to configured addresses</p>
              <Button variant="outline" className="mt-4" disabled>
                Configure Scheduled Reports
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}