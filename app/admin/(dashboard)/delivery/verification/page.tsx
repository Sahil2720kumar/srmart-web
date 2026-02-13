"use client";

import { useState } from "react";
import { Search, CheckCircle, XCircle, FileText } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface PendingPartner {
  id: string;
  first_name: string;
  last_name: string;
  vehicle_type: string;
  vehicle_number: string;
  kyc_status: "pending";
  created_at: string;
}

// Mock data - only pending KYC partners
const mockPendingPartners: PendingPartner[] = [
  {
    id: "DB-004",
    first_name: "Arun",
    last_name: "Patel",
    vehicle_type: "Bike",
    vehicle_number: "KA-04-GH-3456",
    kyc_status: "pending",
    created_at: "2024-02-05T10:20:00Z",
  },
  {
    id: "DB-006",
    first_name: "Prakash",
    last_name: "Sharma",
    vehicle_type: "Bike",
    vehicle_number: "KA-06-KL-2468",
    kyc_status: "pending",
    created_at: "2024-02-03T11:00:00Z",
  },
  {
    id: "DB-007",
    first_name: "Dinesh",
    last_name: "Gupta",
    vehicle_type: "Scooter",
    vehicle_number: "KA-07-MN-1357",
    kyc_status: "pending",
    created_at: "2024-02-08T09:30:00Z",
  },
  {
    id: "DB-008",
    first_name: "Kiran",
    last_name: "Joshi",
    vehicle_type: "Bike",
    vehicle_number: "KA-08-OP-9876",
    kyc_status: "pending",
    created_at: "2024-02-10T14:15:00Z",
  },
  {
    id: "DB-009",
    first_name: "Sanjay",
    last_name: "Nair",
    vehicle_type: "Scooter",
    vehicle_number: "KA-09-QR-5432",
    kyc_status: "pending",
    created_at: "2024-02-09T16:45:00Z",
  },
];

export default function KycApprovalQueuePage() {
  const [partners, setPartners] = useState(mockPendingPartners);
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = 
      partner.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesVehicle = vehicleFilter === "all" || partner.vehicle_type === vehicleFilter;

    return matchesSearch && matchesVehicle;
  });

  const togglePartnerSelection = (partnerId: string) => {
    setSelectedPartners(prev =>
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPartners.length === filteredPartners.length) {
      setSelectedPartners([]);
    } else {
      setSelectedPartners(filteredPartners.map(p => p.id));
    }
  };

  const handleApproveSelected = () => {
    setPartners(partners.filter(p => !selectedPartners.includes(p.id)));
    setSelectedPartners([]);
    setShowApproveDialog(false);
    // toast({
    //   title: "KYC Approved",
    //   description: `${selectedPartners.length} partner(s) approved successfully`,
    // });
  };

  const handleRejectSelected = () => {
    if (!rejectionReason.trim()) {
      // toast({
      //   title: "Error",
      //   description: "Please provide a rejection reason",
      //   variant: "destructive",
      // });
      return;
    }
    setPartners(partners.filter(p => !selectedPartners.includes(p.id)));
    setSelectedPartners([]);
    setShowRejectDialog(false);
    setRejectionReason("");
    // toast({
    //   title: "KYC Rejected",
    //   description: `${selectedPartners.length} partner(s) rejected`,
    //   variant: "destructive",
    // });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">KYC Approval Queue</h1>
            <p className="text-muted-foreground mt-1">
              Review and approve pending KYC documents
            </p>
          </div>
          {selectedPartners.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={() => setShowApproveDialog(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Selected ({selectedPartners.length})
              </Button>
              <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Selected
              </Button>
            </div>
          )}
        </div>

        {/* Filters Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
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

              {/* Vehicle Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Vehicle Type
                </label>
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
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

              {/* Results count */}
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredPartners.length} pending partner(s)
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
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            filteredPartners.length > 0 &&
                            selectedPartners.length === filteredPartners.length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Quick Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPartners.map((partner) => (
                      <TableRow key={partner.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPartners.includes(partner.id)}
                            onCheckedChange={() => togglePartnerSelection(partner.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src="" />
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
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(partner.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/admin/delivery/${partner.id}/kyc`}>
                              <Button variant="outline" size="sm">
                                <FileText className="mr-2 h-4 w-4" />
                                Review
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPartners([partner.id]);
                                setShowApproveDialog(true);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                          </div>
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
                  <CheckCircle className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No pending KYC approvals</h3>
                <p className="text-muted-foreground mb-4">
                  All partners have been reviewed
                </p>
                <Link href="/admin/delivery">
                  <Button>View All Partners</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approve Dialog */}
        <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Selected Partners</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve KYC for {selectedPartners.length} partner(s)?
                They will be able to start taking deliveries immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedPartners([])}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApproveSelected}>
                Approve {selectedPartners.length} Partner(s)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Selected Partners</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting {selectedPartners.length} partner(s).
                They will be notified and will need to resubmit their documents.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  placeholder="e.g., Documents are not clear, license has expired..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason("");
                  setSelectedPartners([]);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectSelected}
                disabled={!rejectionReason.trim()}
              >
                Reject {selectedPartners.length} Partner(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}