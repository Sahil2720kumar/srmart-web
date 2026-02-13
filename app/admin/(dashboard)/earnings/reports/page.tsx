"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  Calendar,
} from "lucide-react";
import Link from "next/link";

const reportTypes = [
  {
    id: "daily-earnings",
    name: "Daily Earnings Report",
    description: "Complete breakdown of daily earnings, orders, and commissions",
    icon: FileText,
    color: "blue",
  },
  {
    id: "vendor-commission",
    name: "Vendor Commission Report",
    description: "Detailed commission tracking by vendor with payout status",
    icon: FileSpreadsheet,
    color: "emerald",
  },
  {
    id: "delivery-payout",
    name: "Delivery Payout Report",
    description: "Delivery partner earnings, incentives, and payment details",
    icon: FileText,
    color: "purple",
  },
  {
    id: "tax-gst",
    name: "Tax & GST Report",
    description: "Tax summaries, GST breakdown, and compliance data",
    icon: FileImage,
    color: "amber",
  },
  {
    id: "refund-cancellation",
    name: "Refund & Cancellation Report",
    description: "All refunds, cancellations, and their financial impact",
    icon: FileText,
    color: "red",
  },
  {
    id: "monthly-summary",
    name: "Monthly Summary Report",
    description: "Comprehensive monthly financial summary with trends",
    icon: FileSpreadsheet,
    color: "indigo",
  },
];

export default function FinancialReportsPage() {
  const [selectedReport, setSelectedReport] = useState("daily-earnings");
  const [dateFrom, setDateFrom] = useState("2024-02-01");
  const [dateTo, setDateTo] = useState("2024-02-13");
  const [format, setFormat] = useState("csv");

  const handleDownload = (reportId, exportFormat) => {
    console.log(`Downloading ${reportId} in ${exportFormat} format`);
    console.log(`Date range: ${dateFrom} to ${dateTo}`);
    // Download logic here
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
      emerald: "from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
      purple: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
      amber: "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
      red: "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
      indigo: "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
    };
    return colors[color] || colors.blue;
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

        {/* Date Range & Format Selector */}
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
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Selected Range:</strong> {dateFrom} to {dateTo} ({Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24))} days)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Report Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className={`hover:shadow-lg transition-all cursor-pointer ${
                  selectedReport === report.id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setSelectedReport(report.id)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getColorClasses(report.color)} flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{report.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    {report.description}
                  </p>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <Button
                      className="w-full gap-2 bg-gradient-to-r text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(report.id, "csv");
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Download CSV
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(report.id, "xlsx");
                        }}
                        className="gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(report.id, "pdf");
                        }}
                        className="gap-2"
                      >
                        <FileImage className="w-4 h-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Export Section */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium">Today's Earnings</div>
                  <div className="text-sm text-slate-600">All earnings data for today</div>
                </div>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium">This Week's Summary</div>
                  <div className="text-sm text-slate-600">Weekly financial summary</div>
                </div>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium">This Month's Complete Report</div>
                  <div className="text-sm text-slate-600">All financial data for current month</div>
                </div>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
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

        {/* Scheduled Reports */}
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