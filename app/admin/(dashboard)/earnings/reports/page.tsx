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
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Download, FileText, FileSpreadsheet,
  FileImage, Calendar, CheckCircle2, Loader2, AlertCircle,
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

/** Trigger browser download for any blob */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** CSV download */
function downloadCsv(csv: string, filename: string) {
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

/**
 * Real XLSX download using SheetJS (bundled in Next.js via xlsx package).
 * Falls back to CSV if SheetJS is unavailable.
 */
async function downloadXlsx(rows: Record<string, unknown>[], filename: string) {
  try {
    const XLSX = await import("xlsx");
    const ws   = XLSX.utils.json_to_sheet(rows);
    const wb   = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    // Auto-fit column widths
    const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String(r[key] ?? "").length), 10),
    }));
    ws["!cols"] = colWidths;
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    triggerDownload(
      new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      filename
    );
  } catch {
    // SheetJS not installed — fall back to CSV
    const headers = Object.keys(rows[0] ?? {});
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    downloadCsv(csv, filename.replace(".xlsx", ".csv"));
  }
}

/**
 * Simple PDF download using jsPDF + autoTable.
 * Falls back to CSV if jsPDF is unavailable.
 */
async function downloadPdf(
  rows: Record<string, unknown>[],
  filename: string,
  title: string
) {
  try {
    const { default: jsPDF }   = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc     = new jsPDF({ orientation: "landscape" });
    const headers = Object.keys(rows[0] ?? {});

    doc.setFontSize(14);
    doc.text(title, 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 22);

    autoTable(doc, {
      head:       [headers],
      body:       rows.map((r) => headers.map((h) => String(r[h] ?? ""))),
      startY:     28,
      styles:     { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(filename);
  } catch {
    // jsPDF not installed — fall back to CSV
    const headers = Object.keys(rows[0] ?? {});
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    downloadCsv(csv, filename.replace(".pdf", ".csv"));
  }
}

/** Build a quick date range */
function quickRange(type: "today" | "week" | "month") {
  const now = new Date();
  const to  = now.toISOString().split("T")[0];
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
  gradientFrom: string;
  gradientTo: string;
  badgeColor: string;
}[] = [
  {
    id: "daily-earnings",
    name: "Daily Earnings",
    description: "Day-by-day revenue, completed orders, and delivery earnings",
    icon: FileText,
    gradientFrom: "from-blue-500",    gradientTo: "to-blue-600",    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "vendor-commission",
    name: "Vendor Commission",
    description: "Commission tracking by vendor with payout status and rates",
    icon: FileSpreadsheet,
    gradientFrom: "from-emerald-500", gradientTo: "to-emerald-600", badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "delivery-payout",
    name: "Delivery Payout",
    description: "Partner earnings, incentives, bonuses, and payment details",
    icon: FileText,
    gradientFrom: "from-purple-500",  gradientTo: "to-purple-600",  badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    id: "tax-gst",
    name: "Tax & GST",
    description: "Tax summaries, GST breakdown, and compliance data",
    icon: FileImage,
    gradientFrom: "from-amber-500",   gradientTo: "to-amber-600",   badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    id: "refund-cancellation",
    name: "Refunds & Cancellations",
    description: "All refunds, cancellations, and their financial impact",
    icon: FileText,
    gradientFrom: "from-red-500",     gradientTo: "to-red-600",     badgeColor: "bg-red-100 text-red-700",
  },
  {
    id: "monthly-summary",
    name: "Monthly Summary",
    description: "Comprehensive monthly financial summary with all categories",
    icon: FileSpreadsheet,
    gradientFrom: "from-indigo-500",  gradientTo: "to-indigo-600",  badgeColor: "bg-indigo-100 text-indigo-700",
  },
];

// ─── preview chips ────────────────────────────────────────────────────────────

function PreviewChips({
  reportId,
  dateRange,
}: {
  reportId: ReportType;
  dateRange: { from: string; to: string };
}) {
  const { data, isLoading, error } = useReportPreview(reportId, dateRange);

  if (isLoading)
    return (
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    );

  if (error)
    return (
      <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
        <AlertCircle className="w-3 h-3" /> Preview unavailable
      </div>
    );

  if (!data) return null;

  const chips: { label: string; value: string }[] = [];

  if ("rows"            in data) chips.push({ label: "Rows",       value: String(data.rows) });
  if ("totalOrders"     in data) chips.push({ label: "Orders",     value: String((data as any).totalOrders) });
  if ("totalRevenue"    in data) chips.push({ label: "Revenue",    value: formatCurrency((data as any).totalRevenue) });
  if ("totalCommission" in data) chips.push({ label: "Commission", value: formatCurrency((data as any).totalCommission) });
  if ("totalPayout"     in data) chips.push({ label: "Payout",     value: formatCurrency((data as any).totalPayout) });
  if ("totalEarnings"   in data) chips.push({ label: "Earnings",   value: formatCurrency((data as any).totalEarnings) });
  if ("totalTax"        in data) chips.push({ label: "Tax",        value: formatCurrency((data as any).totalTax) });
  if ("totalValue"      in data) chips.push({ label: "Value",      value: formatCurrency((data as any).totalValue) });
  if ("netEarnings"     in data) chips.push({ label: "Net",        value: formatCurrency((data as any).netEarnings) });
  if ("cancelled"       in data) chips.push({ label: "Cancelled",  value: String((data as any).cancelled) });
  if ("refunded"        in data) chips.push({ label: "Refunded",   value: String((data as any).refunded) });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-medium"
        >
          <span className="text-slate-400">{chip.label}:</span>
          <span className="text-slate-800">{chip.value}</span>
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
      className={`hover:shadow-lg transition-all cursor-pointer border-2 ${
        isSelected ? "border-blue-500 shadow-md" : "border-transparent"
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div
            className={`w-11 h-11 rounded-lg bg-gradient-to-br ${report.gradientFrom} ${report.gradientTo} flex items-center justify-center mb-2 shadow-sm`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          {isSelected && (
            <Badge className="bg-blue-100 text-blue-700 text-xs">Selected</Badge>
          )}
        </div>
        <CardTitle className="text-base leading-snug">{report.name}</CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-slate-500 mb-1">{report.description}</p>

        {/* Live preview — only when selected */}
        {isSelected && <PreviewChips reportId={report.id} dateRange={dateRange} />}

        <Separator className="my-4" />

        <div className="space-y-2">
          {/* CSV — primary */}
          <Button
            className={`w-full gap-2 bg-gradient-to-r ${report.gradientFrom} ${report.gradientTo} hover:opacity-90 text-white border-0`}
            disabled={isPending}
            onClick={(e) => { e.stopPropagation(); onDownload("csv"); }}
          >
            {isPending && pendingFormat === "csv"
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
            {isPending && pendingFormat === "csv" ? "Generating…" : "Download CSV"}
          </Button>

          {/* XLSX + PDF */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline" size="sm"
              disabled={isPending}
              onClick={(e) => { e.stopPropagation(); onDownload("xlsx"); }}
              className="gap-1.5 text-xs"
            >
              {isPending && pendingFormat === "xlsx"
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
              Excel
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={isPending}
              onClick={(e) => { e.stopPropagation(); onDownload("pdf"); }}
              className="gap-1.5 text-xs"
            >
              {isPending && pendingFormat === "pdf"
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <FileImage className="w-3.5 h-3.5 text-red-500" />}
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
  const [pendingKey,     setPendingKey]     = useState<string | null>(null);  // `${reportId}_${format}`
  const [lastDownloaded, setLastDownloaded] = useState<string | null>(null);
  const [downloadError,  setDownloadError]  = useState<string | null>(null);

  const generateReport = useGenerateReport();
  const dateRange      = { from: dateFrom, to: dateTo };

  const dayCount = Math.max(
    0,
    Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86_400_000)
  );

  const handleDownload = async (reportId: ReportType, format: ExportFormat) => {
    const key = `${reportId}_${format}`;
    setPendingKey(key);
    setDownloadError(null);
    try {
      const result = await generateReport.mutateAsync({ reportId, dateRange, format });

      if (result.rows.length === 0) {
        setDownloadError("No data found for the selected date range.");
        return;
      }

      if (format === "csv" && result.csv) {
        downloadCsv(result.csv, result.filename);
      } else if (format === "xlsx") {
        await downloadXlsx(result.rows, result.filename);
      } else if (format === "pdf") {
        const reportName = REPORT_TYPES.find((r) => r.id === reportId)?.name ?? reportId;
        await downloadPdf(result.rows, result.filename, reportName);
      }

      setLastDownloaded(key);
      setTimeout(() => setLastDownloaded(null), 3000);
    } catch (err) {
      setDownloadError("Failed to generate report. Please try again.");
    } finally {
      setPendingKey(null);
    }
  };

  const handleQuickExport = async (reportId: ReportType, type: "today" | "week" | "month") => {
    const range = quickRange(type);
    const key   = `quick_${reportId}_${type}`;
    setPendingKey(key);
    setDownloadError(null);
    try {
      const result = await generateReport.mutateAsync({
        reportId,
        dateRange: range,
        format: "csv",
      });
      if (result.rows.length === 0) {
        setDownloadError("No data found for the selected date range.");
        return;
      }
      if (result.csv) downloadCsv(result.csv, result.filename);
      setLastDownloaded(key);
      setTimeout(() => setLastDownloaded(null), 3000);
    } catch {
      setDownloadError("Failed to generate report. Please try again.");
    } finally {
      setPendingKey(null);
    }
  };

  const isAnyPending = pendingKey !== null;

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
              Download and export financial data in CSV, Excel, and PDF formats
            </p>
          </div>
        </div>

        {/* Toast: success */}
        {lastDownloaded && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Report downloaded successfully!
          </div>
        )}

        {/* Toast: error */}
        {downloadError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {downloadError}
            <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => setDownloadError(null)}>✕</button>
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

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
              <p className="text-sm text-blue-800">
                <strong>Selected Range:</strong> {dateFrom} → {dateTo}{" "}
                <span className="text-blue-600">({dayCount} day{dayCount !== 1 ? "s" : ""})</span>
              </p>
              <div className="flex gap-2">
                {(["today", "week", "month"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { const r = quickRange(t); setDateFrom(r.from); setDateTo(r.to); }}
                    className="text-xs px-2.5 py-1 rounded-full bg-white border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    {t === "today" ? "Today" : t === "week" ? "7 days" : "Month"}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REPORT_TYPES.map((report) => {
            const reportPending = isAnyPending && pendingKey?.startsWith(report.id) ? true : false;
            const fmt = reportPending && pendingKey
              ? (pendingKey.replace(`${report.id}_`, "") as ExportFormat)
              : null;
            return (
              <ReportCard
                key={report.id}
                report={report}
                isSelected={selectedReport === report.id}
                dateRange={dateRange}
                onSelect={() => setSelectedReport(report.id)}
                onDownload={(f) => handleDownload(report.id, f)}
                isPending={reportPending}
                pendingFormat={fmt}
              />
            );
          })}
        </div>

        {/* Quick Exports — all report types, all quick ranges */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Exports (CSV)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-slate-600">Report</th>
                    {(["today", "week", "month"] as const).map((t) => (
                      <th key={t} className="text-center py-2 px-3 font-medium text-slate-600">
                        {t === "today" ? "Today" : t === "week" ? "Last 7 Days" : "This Month"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REPORT_TYPES.map((report) => (
                    <tr key={report.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${report.gradientFrom}`} />
                          <span className="font-medium">{report.name}</span>
                        </div>
                      </td>
                      {(["today", "week", "month"] as const).map((t) => {
                        const key = `quick_${report.id}_${t}`;
                        const loading = pendingKey === key;
                        return (
                          <td key={t} className="py-3 px-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isAnyPending}
                              onClick={() => handleQuickExport(report.id, t)}
                              className="gap-1.5 text-xs h-8"
                            >
                              {loading
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Download className="w-3 h-3" />}
                              Export
                            </Button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Report Format Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4">Export Format Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: <Download className="w-5 h-5 text-slate-600" />,
                  title: "CSV",
                  desc: "Best for Excel, Google Sheets, and data analysis. Universal compatibility.",
                  badge: "Recommended",
                  badgeClass: "bg-blue-100 text-blue-700",
                },
                {
                  icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />,
                  title: "Excel (.xlsx)",
                  desc: "Pre-formatted with auto-sized columns. Requires the xlsx package installed.",
                  badge: "SheetJS",
                  badgeClass: "bg-emerald-100 text-emerald-700",
                },
                {
                  icon: <FileImage className="w-5 h-5 text-red-500" />,
                  title: "PDF",
                  desc: "Print-ready table layout. Requires jspdf + jspdf-autotable installed.",
                  badge: "jsPDF",
                  badgeClass: "bg-red-100 text-red-700",
                },
              ].map((f) => (
                <div key={f.title} className="flex gap-3 p-3 bg-white rounded-lg border border-slate-100">
                  <div className="mt-0.5">{f.icon}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{f.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${f.badgeClass}`}>{f.badge}</span>
                    </div>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <strong>Note:</strong> Excel and PDF require optional packages. Install with:
              <code className="ml-1 bg-amber-100 px-1.5 py-0.5 rounded font-mono">npm install xlsx jspdf jspdf-autotable</code>
              — if not installed, both will fall back to CSV automatically.
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Reports — Coming Soon */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports <span className="text-sm font-normal text-slate-400 ml-2">Coming Soon</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Automatic Report Delivery</p>
              <p className="text-sm mt-1">Set up daily, weekly, or monthly reports sent to your email</p>
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