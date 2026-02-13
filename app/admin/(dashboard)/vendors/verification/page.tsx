"use client";

import { useState } from "react";
import { Search, FileText, CheckCircle, ChevronDown } from "lucide-react";
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

type KycStatus = "pending" | "partially_approved" | "approved" | "rejected";

interface VendorInQueue {
  id: string;
  name: string;
  business_name: string;
  email: string;
  total_documents: number;
  submitted_documents: number;
  pending_documents: number;
  rejected_documents: number;
  kyc_status: KycStatus;
  submitted_date: string;
}

// Mock data
const mockVendors: VendorInQueue[] = [
  {
    id: "VEN-003",
    name: "Amit Patel",
    business_name: "Dairy Plus",
    email: "amit@dairyplus.com",
    total_documents: 5,
    submitted_documents: 5,
    pending_documents: 3,
    rejected_documents: 0,
    kyc_status: "pending",
    submitted_date: "2024-02-01T11:45:00Z",
  },
  {
    id: "VEN-007",
    name: "Rahul Verma",
    business_name: "Premium Meats",
    email: "rahul@meatshop.com",
    total_documents: 5,
    submitted_documents: 5,
    pending_documents: 2,
    rejected_documents: 0,
    kyc_status: "partially_approved",
    submitted_date: "2024-01-18T12:00:00Z",
  },
  {
    id: "VEN-011",
    name: "Karan Malhotra",
    business_name: "Beverages Hub",
    email: "karan@beverageshub.com",
    total_documents: 5,
    submitted_documents: 4,
    pending_documents: 4,
    rejected_documents: 0,
    kyc_status: "pending",
    submitted_date: "2024-02-07T13:20:00Z",
  },
  {
    id: "VEN-013",
    name: "Neha Kapoor",
    business_name: "Healthy Bites",
    email: "neha@healthybites.com",
    total_documents: 5,
    submitted_documents: 5,
    pending_documents: 0,
    rejected_documents: 0,
    kyc_status: "approved",
    submitted_date: "2024-01-25T09:30:00Z",
  },
  {
    id: "VEN-014",
    name: "Arjun Shah",
    business_name: "Tea & Coffee Co",
    email: "arjun@teacoffee.com",
    total_documents: 5,
    submitted_documents: 5,
    pending_documents: 1,
    rejected_documents: 2,
    kyc_status: "rejected",
    submitted_date: "2024-02-05T14:15:00Z",
  },
  {
    id: "VEN-015",
    name: "Divya Menon",
    business_name: "Sweet Delights",
    email: "divya@sweetdelights.com",
    total_documents: 5,
    submitted_documents: 5,
    pending_documents: 5,
    rejected_documents: 0,
    kyc_status: "pending",
    submitted_date: "2024-02-10T10:00:00Z",
  },
  {
    id: "VEN-016",
    name: "Suresh Kumar",
    business_name: "Spice Garden",
    email: "suresh@spicegarden.com",
    total_documents: 5,
    submitted_documents: 5,
    pending_documents: 1,
    rejected_documents: 0,
    kyc_status: "partially_approved",
    submitted_date: "2024-02-08T11:30:00Z",
  },
  {
    id: "VEN-017",
    name: "Lakshmi Iyer",
    business_name: "Fresh Catch",
    email: "lakshmi@freshcatch.com",
    total_documents: 5,
    submitted_documents: 3,
    pending_documents: 3,
    rejected_documents: 0,
    kyc_status: "pending",
    submitted_date: "2024-02-09T15:45:00Z",
  },
  {
    id: "VEN-018",
    name: "Ravi Shankar",
    business_name: "Organic Farm",
    email: "ravi@organicfarm.com",
    total_documents: 5,
    submitted_documents: 5,
    pending_documents: 0,
    rejected_documents: 1,
    kyc_status: "rejected",
    submitted_date: "2024-02-02T08:20:00Z",
  },
  {
    id: "VEN-019",
    name: "Kavita Singh",
    business_name: "Nuts & Dry Fruits",
    email: "kavita@nutsdryfuits.com",
    total_documents: 5,
    submitted_documents: 5,
    pending_documents: 2,
    rejected_documents: 0,
    kyc_status: "partially_approved",
    submitted_date: "2024-02-06T12:10:00Z",
  },
];

const kycStatusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  partially_approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function VendorVerificationPage() {
  const [vendors, setVendors] = useState(mockVendors);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showBulkApproveDialog, setShowBulkApproveDialog] = useState(false);
  const [approveVendorId, setApproveVendorId] = useState<string | null>(null);

  const toggleVendorSelection = (vendorId: string) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedVendors.length === filteredVendors.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(filteredVendors.map(v => v.id));
    }
  };

  const handleApproveAll = (vendorId: string) => {
    setApproveVendorId(vendorId);
    setShowApproveDialog(true);
  };

  const confirmApproveAll = () => {
    if (approveVendorId) {
      setVendors(vendors.map(vendor =>
        vendor.id === approveVendorId
          ? {
              ...vendor,
              kyc_status: "approved",
              pending_documents: 0,
              rejected_documents: 0,
            }
          : vendor
      ));
      setShowApproveDialog(false);
      setApproveVendorId(null);
    }
  };

  const handleBulkApprove = () => {
    setShowBulkApproveDialog(true);
  };

  const confirmBulkApprove = () => {
    setVendors(vendors.map(vendor =>
      selectedVendors.includes(vendor.id)
        ? {
            ...vendor,
            kyc_status: "approved",
            pending_documents: 0,
            rejected_documents: 0,
          }
        : vendor
    ));
    setSelectedVendors([]);
    setShowBulkApproveDialog(false);
  };

  const filteredVendors = vendors
    .filter(vendor => {
      const matchesSearch =
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending_review" && vendor.kyc_status === "pending") ||
        (statusFilter === "partially_approved" && vendor.kyc_status === "partially_approved") ||
        (statusFilter === "rejected" && vendor.kyc_status === "rejected");

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.submitted_date).getTime() - new Date(a.submitted_date).getTime();
      } else {
        return new Date(a.submitted_date).getTime() - new Date(b.submitted_date).getTime();
      }
    });

  const canApproveAll = (vendor: VendorInQueue) => {
    return vendor.pending_documents > 0 && vendor.rejected_documents === 0;
  };

  return (
    <div className="min-h-screen bg-background ">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vendor Verification Queue</h1>
            <p className="text-muted-foreground mt-1">
              Review and approve pending vendor KYC documents
            </p>
          </div>
          {selectedVendors.length > 0 && (
            <Button onClick={handleBulkApprove}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve Selected ({selectedVendors.length})
            </Button>
          )}
        </div>

        {/* Filters Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Vendor name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Filter by Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="partially_approved">Partially Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Sort by
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results count */}
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
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Rejected</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedVendors.includes(vendor.id)}
                          onCheckedChange={() => toggleVendorSelection(vendor.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <p className="text-xs text-muted-foreground">{vendor.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{vendor.business_name}</TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {vendor.submitted_documents}/{vendor.total_documents}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20">
                          {vendor.pending_documents}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {vendor.rejected_documents > 0 ? (
                          <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20">
                            {vendor.rejected_documents}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={kycStatusColors[vendor.kyc_status]}>
                          {vendor.kyc_status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(vendor.submitted_date).toLocaleDateString()}
                      </TableCell>
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
                              onClick={() => handleApproveAll(vendor.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve All
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Approve All Dialog */}
        <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve All Documents</AlertDialogTitle>
              <AlertDialogDescription>
                This will approve all pending documents for this vendor and mark their KYC as complete.
                The vendor will be able to start accepting orders immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmApproveAll}>
                Approve All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Approve Dialog */}
        <AlertDialog open={showBulkApproveDialog} onOpenChange={setShowBulkApproveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bulk Approve Selected Vendors</AlertDialogTitle>
              <AlertDialogDescription>
                This will approve all pending documents for {selectedVendors.length} selected vendor(s)
                and mark their KYC as complete. They will be able to start accepting orders immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmBulkApprove}>
                Approve {selectedVendors.length} Vendor(s)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}