"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  MapPin,
  Shield,
  Clock,
  FileText,
  Ban,
  ChevronLeft,
  Upload,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner"
import Link from "next/link";

type KycStatus = "not_uploaded" | "pending" | "verified" | "approved" | "rejected";
type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    isClosed: boolean;
  };
}

interface VendorFormData {
  // Store Information
  store_name: string;
  store_description: string;
  store_image: File | null;
  store_banner: File | null;
  
  // Address Information
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  
  // Business Status
  is_open: boolean;
  is_verified: boolean;
  
  // Business Hours
  business_hours: BusinessHours;
  
  // KYC Status
  kyc_status: KycStatus;
  kyc_verified_at: string;
  kyc_rejection_reason: string;
  
  // Admin Controls
  admin_notes: string;
  is_suspended: boolean;
  suspended_until: string;
  suspension_reason: string;
}

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const initialBusinessHours: BusinessHours = DAYS_OF_WEEK.reduce((acc, day) => {
  acc[day.key] = { open: "09:00", close: "21:00", isClosed: false };
  return acc;
}, {} as BusinessHours);

export default function AddVendorPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storeImagePreview, setStoreImagePreview] = useState<string | null>(null);
  const [storeBannerPreview, setStoreBannerPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<VendorFormData>({
    store_name: "",
    store_description: "",
    store_image: null,
    store_banner: null,
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    is_open: true,
    is_verified: false,
    business_hours: initialBusinessHours,
    kyc_status: "not_uploaded",
    kyc_verified_at: "",
    kyc_rejection_reason: "",
    admin_notes: "",
    is_suspended: false,
    suspended_until: "",
    suspension_reason: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof VendorFormData, string>>>({});

  const handleInputChange = (field: keyof VendorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (field: "store_image" | "store_banner", file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === "store_image") {
          setStoreImagePreview(reader.result as string);
        } else {
          setStoreBannerPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      if (field === "store_image") {
        setStoreImagePreview(null);
      } else {
        setStoreBannerPreview(null);
      }
    }
    handleInputChange(field, file);
  };

  const handleBusinessHourChange = (
    day: string,
    field: "open" | "close" | "isClosed",
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          [field]: value,
        },
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof VendorFormData, string>> = {};

    // Required fields
    if (!formData.store_name.trim()) {
      newErrors.store_name = "Store name is required";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    }

    // KYC rejection reason required if status is rejected
    if (formData.kyc_status === "rejected" && !formData.kyc_rejection_reason.trim()) {
      newErrors.kyc_rejection_reason = "Rejection reason is required when KYC is rejected";
    }

    // Suspension reason required if suspended
    if (formData.is_suspended && !formData.suspension_reason.trim()) {
      newErrors.suspension_reason = "Suspension reason is required";
    }

    // Validate business hours
    Object.entries(formData.business_hours).forEach(([day, hours]) => {
      if (!hours.isClosed && hours.open >= hours.close) {
        newErrors.business_hours = "Invalid business hours: Close time must be after open time";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      toast("Validation Error", {
        description: "Please fix all errors before submitting",
        
        position:"top-center"
      })

      toast("Event has been created", {
        description: "Sunday, December 03, 2023 at 9:00 AM",})
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload
      const payload = {
        store_name: formData.store_name,
        store_description: formData.store_description,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        is_open: formData.is_open,
        is_verified: formData.is_verified,
        business_hours: formData.business_hours,
        kyc_status: formData.kyc_status,
        kyc_verified_at: formData.kyc_status === "approved" ? new Date().toISOString() : null,
        kyc_rejection_reason: formData.kyc_status === "rejected" ? formData.kyc_rejection_reason : null,
        admin_notes: formData.admin_notes,
        suspended_until: formData.is_suspended ? formData.suspended_until : null,
        suspension_reason: formData.is_suspended ? formData.suspension_reason : null,
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log("Vendor payload:", payload);

      toast("Success",{
        description: "Vendor added successfully",
      });

      router.push("/admin/vendors");
    } catch (error) {
      toast("Error",{
        description: "Failed to add vendor. Please try again.",
        style: {
          background: 'red',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = 
    formData.store_name.trim() &&
    formData.address.trim() &&
    formData.city.trim() &&
    formData.state.trim() &&
    formData.pincode.trim() &&
    (formData.kyc_status !== "rejected" || formData.kyc_rejection_reason.trim()) &&
    (!formData.is_suspended || formData.suspension_reason.trim());

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link href="/admin/vendors">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Vendors
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Add New Vendor</h1>
            <p className="text-muted-foreground">Create a new vendor account manually</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Store Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="store_name">
                    Store Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="store_name"
                    value={formData.store_name}
                    onChange={(e) => handleInputChange("store_name", e.target.value)}
                    placeholder="e.g., Fresh Mart"
                  />
                  {errors.store_name && (
                    <p className="text-xs text-red-500">{errors.store_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="e.g., Bangalore"
                  />
                  {errors.city && (
                    <p className="text-xs text-red-500">{errors.city}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="store_description">Store Description</Label>
                <Textarea
                  id="store_description"
                  value={formData.store_description}
                  onChange={(e) => handleInputChange("store_description", e.target.value)}
                  placeholder="Brief description of the store..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Store Image Upload */}
                <div className="space-y-2">
                  <Label>Store Image</Label>
                  <div className="flex flex-col gap-2">
                    {storeImagePreview ? (
                      <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
                        <img
                          src={storeImagePreview}
                          alt="Store preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => handleImageUpload("store_image", null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Upload Image</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload("store_image", e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Store Banner Upload */}
                <div className="space-y-2">
                  <Label>Store Banner</Label>
                  <div className="flex flex-col gap-2">
                    {storeBannerPreview ? (
                      <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
                        <img
                          src={storeBannerPreview}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => handleImageUpload("store_banner", null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Upload Banner</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload("store_banner", e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Full address..."
                  rows={2}
                />
                {errors.address && (
                  <p className="text-xs text-red-500">{errors.address}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="state">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="e.g., Karnataka"
                  />
                  {errors.state && (
                    <p className="text-xs text-red-500">{errors.state}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">
                    Pincode <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange("pincode", e.target.value)}
                    placeholder="e.g., 560001"
                    type="number"
                  />
                  {errors.pincode && (
                    <p className="text-xs text-red-500">{errors.pincode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude (Optional)</Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange("latitude", e.target.value)}
                    placeholder="e.g., 12.9716"
                    type="number"
                    step="any"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (Optional)</Label>
                <Input
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange("longitude", e.target.value)}
                  placeholder="e.g., 77.5946"
                  type="number"
                  step="any"
                />
              </div>
            </CardContent>
          </Card>

          {/* 3. Business Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Business Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_open">Is Store Open</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this to make the store visible to customers
                  </p>
                </div>
                <Switch
                  id="is_open"
                  checked={formData.is_open}
                  onCheckedChange={(checked) => handleInputChange("is_open", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_verified">Is Vendor Verified</Label>
                  <p className="text-sm text-muted-foreground">
                    Admin-controlled verification status
                  </p>
                </div>
                <Switch
                  id="is_verified"
                  checked={formData.is_verified}
                  onCheckedChange={(checked) => handleInputChange("is_verified", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 4. Business Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.key} className="flex items-center gap-4">
                  <div className="w-28">
                    <Label className="font-medium">{day.label}</Label>
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={formData.business_hours[day.key].open}
                      onChange={(e) =>
                        handleBusinessHourChange(day.key, "open", e.target.value)
                      }
                      disabled={formData.business_hours[day.key].isClosed}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={formData.business_hours[day.key].close}
                      onChange={(e) =>
                        handleBusinessHourChange(day.key, "close", e.target.value)
                      }
                      disabled={formData.business_hours[day.key].isClosed}
                      className="w-32"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.business_hours[day.key].isClosed}
                      onCheckedChange={(checked) =>
                        handleBusinessHourChange(day.key, "isClosed", checked)
                      }
                    />
                    <Label className="text-sm text-muted-foreground">Closed</Label>
                  </div>
                </div>
              ))}
              {errors.business_hours && (
                <p className="text-xs text-red-500">{errors.business_hours}</p>
              )}
            </CardContent>
          </Card>

          {/* 5. KYC Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                KYC Status (Admin Controlled)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kyc_status">KYC Status</Label>
                <Select
                  value={formData.kyc_status}
                  onValueChange={(value: KycStatus) => handleInputChange("kyc_status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_uploaded">Not Uploaded</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.kyc_status === "approved" && "KYC verified date will be auto-filled"}
                  {formData.kyc_status === "rejected" && "Rejection reason is required"}
                </p>
              </div>

              {formData.kyc_status === "rejected" && (
                <div className="space-y-2">
                  <Label htmlFor="kyc_rejection_reason">
                    KYC Rejection Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="kyc_rejection_reason"
                    value={formData.kyc_rejection_reason}
                    onChange={(e) => handleInputChange("kyc_rejection_reason", e.target.value)}
                    placeholder="Provide reason for KYC rejection..."
                    rows={3}
                  />
                  {errors.kyc_rejection_reason && (
                    <p className="text-xs text-red-500">{errors.kyc_rejection_reason}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 6. Admin Controls & Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Admin Controls & Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea
                  id="admin_notes"
                  value={formData.admin_notes}
                  onChange={(e) => handleInputChange("admin_notes", e.target.value)}
                  placeholder="Internal notes about this vendor..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_suspended">Suspend Vendor</Label>
                  <p className="text-sm text-muted-foreground">
                    Temporarily suspend vendor account
                  </p>
                </div>
                <Switch
                  id="is_suspended"
                  checked={formData.is_suspended}
                  onCheckedChange={(checked) => handleInputChange("is_suspended", checked)}
                />
              </div>

              {formData.is_suspended && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="suspended_until">Suspended Until</Label>
                    <Input
                      id="suspended_until"
                      type="date"
                      value={formData.suspended_until}
                      onChange={(e) => handleInputChange("suspended_until", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="suspension_reason">
                      Suspension Reason <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="suspension_reason"
                      value={formData.suspension_reason}
                      onChange={(e) => handleInputChange("suspension_reason", e.target.value)}
                      placeholder="Provide reason for suspension..."
                      rows={3}
                    />
                    {errors.suspension_reason && (
                      <p className="text-xs text-red-500">{errors.suspension_reason}</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t py-4 px-6">
        <div className="mx-auto max-w-5xl flex items-center justify-end gap-3">
          <Link href="/admin/vendors">
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">Saving...</span>
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Vendor
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}