"use client";

import { useState } from "react";
import { ChevronLeft, FileText, CheckCircle, XCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";

// Mock data
const mockPartner = {
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
  kyc_status: "pending" as const,
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-02-10T14:20:00Z",
};

export default function PartnerProfilePage() {
  const {partnerId}=useParams()
  const [partner, setPartner] = useState(mockPartner);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = () => {
    setPartner({ ...partner, kyc_status: "approved" });
    setShowApproveDialog(false);
    // toast("KYC Approved",{
    //   description: "Partner KYC has been approved successfully",
    //   position:"top-center"
    // });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      // toast("Error",{
      //   description: "Please provide a rejection reason",
      // });
      return;
    }
    setPartner({ ...partner, kyc_status: "rejected" });
    setShowRejectDialog(false);
    setRejectionReason("");
    toast("KYC Rejected",{
      description: "Partner KYC has been rejected",
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const kycStatusColors = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="min-h-screen bg-background ">
      <div className=" space-y-6">
        {/* Back button */}
        <Link href="/admin/delivery">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Partners
          </Button>
        </Link>

        {/* Two Column Layout */}
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {/* Left Column - Profile */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={partner.profile_photo} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(partner.first_name, partner.last_name)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h2 className="text-2xl font-bold">
                    {partner.first_name} {partner.last_name}
                  </h2>
                  <p className="text-sm text-muted-foreground">{partner.id}</p>
                </div>

                <div className="flex gap-2">
                  {partner.is_online ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Online
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      Offline
                    </Badge>
                  )}
                  {partner.is_available ? (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      Available
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                      Busy
                    </Badge>
                  )}
                </div>

                <div className="w-full pt-4 border-t space-y-3">
                  <Link href={`/admin/delivery/${partner.id}/kyc`} className="w-full ">
                    <Button variant="outline" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      View KYC
                    </Button>
                  </Link>
                  <Button
                    className="w-full mt-3"
                    onClick={() => setShowApproveDialog(true)}
                    disabled={partner.kyc_status === "approved"}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve KYC
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject KYC
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Vehicle Details */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Vehicle Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle Type</p>
                    <p className="text-lg font-medium">{partner.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle Number</p>
                    <p className="text-lg font-mono font-medium">{partner.vehicle_number}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">License Number</p>
                    <p className="text-lg font-mono font-medium">{partner.license_number}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Performance</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold">{partner.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold mb-1">{partner.review_count}</div>
                    <p className="text-sm text-muted-foreground">Reviews</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold mb-1">{partner.total_deliveries}</div>
                    <p className="text-sm text-muted-foreground">Total Deliveries</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KYC Status */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">KYC Status</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                    <Badge className={kycStatusColors[partner.kyc_status]}>
                      {partner.kyc_status.toUpperCase()}
                    </Badge>
                  </div>
                  <Link href={`/admin/delivery/${partner.id}/kyc`}>
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Review Documents
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="text-sm font-mono">{partner.user_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="text-sm">{new Date(partner.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-sm">{new Date(partner.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Approve Dialog */}
        <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve KYC</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve the KYC for <strong>{partner.first_name} {partner.last_name}</strong>?
                This will allow them to start taking deliveries.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApprove}>
                Approve KYC
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject KYC</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting the KYC. The partner will be notified.
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
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Reject KYC
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}