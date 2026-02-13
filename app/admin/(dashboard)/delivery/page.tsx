"use client";

import { useState } from "react";
import { Search, Plus, MoreVertical, Eye, FileText, CheckCircle, XCircle } from "lucide-react";
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

type KycStatus = "pending" | "approved" | "rejected";

interface DeliveryBoy {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  profile_photo?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  license_number?: string;
  is_available: boolean;
  is_online: boolean;
  current_latitude?: number;
  current_longitude?: number;
  rating: number;
  review_count: number;
  total_deliveries: number;
  kyc_status: KycStatus;
  created_at: string;
  updated_at: string;
}

// Mock data
const mockDeliveryPartners: DeliveryBoy[] = [
  {
    id: "DB-001",
    user_id: "usr_db_001",
    first_name: "Ramesh",
    last_name: "Kumar",
    profile_photo: "",
    vehicle_type: "Bike",
    vehicle_number: "KA-01-AB-1234",
    license_number: "DL1234567890",
    is_available: true,
    is_online: true,
    rating: 4.8,
    review_count: 245,
    total_deliveries: 1250,
    kyc_status: "approved",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-02-10T14:20:00Z",
  },
  {
    id: "DB-002",
    user_id: "usr_db_002",
    first_name: "Suresh",
    last_name: "Reddy",
    profile_photo: "",
    vehicle_type: "Scooter",
    vehicle_number: "KA-02-CD-5678",
    license_number: "DL9876543210",
    is_available: false,
    is_online: true,
    rating: 4.6,
    review_count: 189,
    total_deliveries: 980,
    kyc_status: "approved",
    created_at: "2024-01-20T09:15:00Z",
    updated_at: "2024-02-11T11:30:00Z",
  },
  {
    id: "DB-003",
    user_id: "usr_db_003",
    first_name: "Vijay",
    last_name: "Singh",
    profile_photo: "",
    vehicle_type: "Bike",
    vehicle_number: "KA-03-EF-9012",
    license_number: "DL5551234567",
    is_available: true,
    is_online: false,
    rating: 4.9,
    review_count: 312,
    total_deliveries: 1680,
    kyc_status: "approved",
    created_at: "2024-01-10T08:00:00Z",
    updated_at: "2024-02-09T18:45:00Z",
  },
  {
    id: "DB-004",
    user_id: "usr_db_004",
    first_name: "Arun",
    last_name: "Patel",
    profile_photo: "",
    vehicle_type: "Bike",
    vehicle_number: "KA-04-GH-3456",
    license_number: "DL7778889999",
    is_available: true,
    is_online: true,
    rating: 4.5,
    review_count: 156,
    total_deliveries: 720,
    kyc_status: "pending",
    created_at: "2024-02-05T10:20:00Z",
    updated_at: "2024-02-10T09:15:00Z",
  },
  {
    id: "DB-005",
    user_id: "usr_db_005",
    first_name: "Manoj",
    last_name: "Verma",
    profile_photo: "",
    vehicle_type: "Scooter",
    vehicle_number: "KA-05-IJ-7890",
    license_number: "DL1112223333",
    is_available: false,
    is_online: false,
    rating: 4.2,
    review_count: 98,
    total_deliveries: 450,
    kyc_status: "rejected",
    created_at: "2024-02-01T14:30:00Z",
    updated_at: "2024-02-08T16:20:00Z",
  },
  {
    id: "DB-006",
    user_id: "usr_db_006",
    first_name: "Prakash",
    last_name: "Sharma",
    profile_photo: "",
    vehicle_type: "Bike",
    vehicle_number: "KA-06-KL-2468",
    license_number: "DL4445556666",
    is_available: true,
    is_online: true,
    rating: 4.7,
    review_count: 203,
    total_deliveries: 1100,
    kyc_status: "pending",
    created_at: "2024-02-03T11:00:00Z",
    updated_at: "2024-02-11T10:30:00Z",
  },
];

const kycStatusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function DeliveryPartnersPage() {
  const [partners, setPartners] = useState(mockDeliveryPartners);
  const [searchQuery, setSearchQuery] = useState("");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [onlineFilter, setOnlineFilter] = useState<string>("all");

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = 
      partner.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesKyc = kycFilter === "all" || partner.kyc_status === kycFilter;
    const matchesOnline = 
      onlineFilter === "all" ||
      (onlineFilter === "online" && partner.is_online) ||
      (onlineFilter === "offline" && !partner.is_online);

    return matchesSearch && matchesKyc && matchesOnline;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background ">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Delivery Partners</h1>
          <Link href="/admin/delivery/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Partner
            </Button>
          </Link>
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
                    placeholder="Name, Vehicle number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Online Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Online Status
                </label>
                <Select value={onlineFilter} onValueChange={setOnlineFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results count */}
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredPartners.length} of {partners.length} partners
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {filteredPartners.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Deliveries</TableHead>
                      <TableHead>Online</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPartners.map((partner) => (
                      <TableRow key={partner.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={partner.profile_photo} />
                              <AvatarFallback>
                                {getInitials(partner.first_name, partner.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {partner.first_name} {partner.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">{partner.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{partner.vehicle_type}</p>
                            <p className="text-xs text-muted-foreground">{partner.vehicle_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{partner.rating}</span>
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-xs text-muted-foreground">
                              ({partner.review_count})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{partner.total_deliveries}</TableCell>
                        <TableCell>
                          {partner.is_online ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Online
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Offline
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {partner.is_available ? (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              Available
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                              Busy
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={kycStatusColors[partner.kyc_status]}>
                            {partner.kyc_status}
                          </Badge>
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
                                <Link href={`/admin/delivery/${partner.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/delivery/${partner.id}/kyc`}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  View KYC
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={partner.kyc_status === "approved"}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve KYC
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject KYC
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <div className="mb-4 rounded-full bg-muted p-6 inline-block">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No delivery partners found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button onClick={() => {
                  setSearchQuery("");
                  setKycFilter("all");
                  setOnlineFilter("all");
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}