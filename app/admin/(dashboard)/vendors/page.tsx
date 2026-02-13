"use client";

import { useState } from "react";
import { Search, Plus, MoreVertical, Eye, FileText, Ban, CheckCircle } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";

type VendorStatus = "active" | "suspended";
type KycStatus = "not_uploaded" | "pending" | "verified" | "approved" | "rejected";

interface MockVendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  business_name: string;
  avatar?: string;
  status: VendorStatus;
  kyc_status: KycStatus;
  created_at: string;
}

// Mock data
const mockVendors: MockVendor[] = [
  {
    id: "VEN-001",
    name: "Rajesh Kumar",
    email: "rajesh@freshmart.com",
    phone: "+91 98765 43210",
    business_name: "Fresh Mart",
    status: "active",
    kyc_status: "approved",
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "VEN-002",
    name: "Priya Sharma",
    email: "priya@veggieworld.com",
    phone: "+91 98765 43211",
    business_name: "Veggie World",
    status: "active",
    kyc_status: "approved",
    created_at: "2024-01-20T09:15:00Z",
  },
  {
    id: "VEN-003",
    name: "Amit Patel",
    email: "amit@dairyplus.com",
    phone: "+91 98765 43212",
    business_name: "Dairy Plus",
    status: "active",
    kyc_status: "pending",
    created_at: "2024-02-01T11:45:00Z",
  },
  {
    id: "VEN-004",
    name: "Sneha Reddy",
    email: "sneha@organicstore.com",
    phone: "+91 98765 43213",
    business_name: "Organic Store",
    status: "suspended",
    kyc_status: "rejected",
    created_at: "2024-01-25T14:20:00Z",
  },
  {
    id: "VEN-005",
    name: "Vikram Singh",
    email: "vikram@spicemart.com",
    phone: "+91 98765 43214",
    business_name: "Spice Mart",
    status: "active",
    kyc_status: "approved",
    created_at: "2024-02-05T08:00:00Z",
  },
  {
    id: "VEN-006",
    name: "Anita Desai",
    email: "anita@bakerybliss.com",
    phone: "+91 98765 43215",
    business_name: "Bakery Bliss",
    status: "active",
    kyc_status: "not_uploaded",
    created_at: "2024-02-10T16:30:00Z",
  },
  {
    id: "VEN-007",
    name: "Rahul Verma",
    email: "rahul@meatshop.com",
    phone: "+91 98765 43216",
    business_name: "Premium Meats",
    status: "active",
    kyc_status: "pending",
    created_at: "2024-01-18T12:00:00Z",
  },
  {
    id: "VEN-008",
    name: "Deepa Nair",
    email: "deepa@fruitbazaar.com",
    phone: "+91 98765 43217",
    business_name: "Fruit Bazaar",
    status: "active",
    kyc_status: "approved",
    created_at: "2024-01-22T10:15:00Z",
  },
  {
    id: "VEN-009",
    name: "Sanjay Gupta",
    email: "sanjay@seafoodmart.com",
    phone: "+91 98765 43218",
    business_name: "Seafood Mart",
    status: "suspended",
    kyc_status: "approved",
    created_at: "2024-02-03T15:45:00Z",
  },
  {
    id: "VEN-010",
    name: "Meera Iyer",
    email: "meera@grainstore.com",
    phone: "+91 98765 43219",
    business_name: "Grain Store",
    status: "active",
    kyc_status: "verified",
    created_at: "2024-01-28T09:30:00Z",
  },
  {
    id: "VEN-011",
    name: "Karan Malhotra",
    email: "karan@beverageshub.com",
    phone: "+91 98765 43220",
    business_name: "Beverages Hub",
    status: "active",
    kyc_status: "pending",
    created_at: "2024-02-07T13:20:00Z",
  },
  {
    id: "VEN-012",
    name: "Pooja Joshi",
    email: "pooja@snackscorner.com",
    phone: "+91 98765 43221",
    business_name: "Snacks Corner",
    status: "active",
    kyc_status: "not_uploaded",
    created_at: "2024-02-09T11:00:00Z",
  },
];

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const kycStatusColors = {
  not_uploaded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  verified: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState(mockVendors);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const router= useRouter()

  const toggleVendorStatus = (vendorId: string) => {
    setVendors(vendors.map(vendor =>
      vendor.id === vendorId
        ? { ...vendor, status: vendor.status === "active" ? "suspended" : "active" }
        : vendor
    ));
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;
    const matchesKyc = kycFilter === "all" || vendor.kyc_status === kycFilter;

    return matchesSearch && matchesStatus && matchesKyc;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background ">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Vendor Management</h1>
          <Button onClick={()=>router.push("./vendors/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
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
                    placeholder="Name, Email, Business..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* KYC Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  KYC Status
                </label>
                <Select value={kycFilter} onValueChange={setKycFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
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
                    <TableHead>Vendor</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={vendor.avatar} />
                            <AvatarFallback>{getInitials(vendor.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{vendor.name}</p>
                            <p className="text-xs text-muted-foreground">{vendor.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{vendor.business_name}</TableCell>
                      <TableCell>{vendor.email}</TableCell>
                      <TableCell>{vendor.phone}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[vendor.status]}>
                          {vendor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={kycStatusColors[vendor.kyc_status]}>
                          {vendor.kyc_status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(vendor.created_at).toLocaleDateString()}
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
                              <Link href={`/admin/vendors/${vendor.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/vendors/${vendor.id}/kyc`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Review KYC
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleVendorStatus(vendor.id)}>
                              {vendor.status === "active" ? (
                                <>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
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

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page 1 of 1
          </p>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button variant="outline" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}