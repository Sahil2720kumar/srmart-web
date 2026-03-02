"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Store, MapPin, Shield, Clock, FileText, Ban,
  ChevronLeft, Upload, X, Save, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { deleteVendorImage, uploadVendorImage, useUpdateVendor, useVendor } from "@/hooks";

// ─── Types ────────────────────────────────────────────────────────────────────

type KycStatus = "pending" | "approved" | "rejected";
type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

interface DaySchedule {
  open: string;
  close: string;
  isClosed: boolean;
}

interface BusinessHours {
  [key: string]: DaySchedule;
}

interface VendorFormData {
  store_name: string;
  store_description: string;
  store_image: File | null;
  store_banner: File | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  is_open: boolean;
  is_verified: boolean;
  business_hours: BusinessHours;
  kyc_status: KycStatus;
  kyc_rejection_reason: string;
  admin_notes: string;
  is_suspended: boolean;
  suspended_until: string;
  suspension_reason: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: "monday",    label: "Monday"    },
  { key: "tuesday",   label: "Tuesday"   },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday",  label: "Thursday"  },
  { key: "friday",    label: "Friday"    },
  { key: "saturday",  label: "Saturday"  },
  { key: "sunday",    label: "Sunday"    },
];

const DEFAULT_DAY: DaySchedule = { open: "09:00", close: "21:00", isClosed: false };

const getDefaultHours = (): BusinessHours =>
  DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day.key] = { ...DEFAULT_DAY };
    return acc;
  }, {} as BusinessHours);

const toKycStatus = (raw: string | null | undefined): KycStatus => {
  if (raw === "approved" || raw === "rejected") return raw;
  return "pending";
};

const getEmptyForm = (): VendorFormData => ({
  store_name: "", store_description: "",
  store_image: null, store_banner: null,
  address: "", city: "", state: "", pincode: "",
  latitude: "", longitude: "",
  is_open: true, is_verified: false,
  business_hours: getDefaultHours(),
  kyc_status: "pending", kyc_rejection_reason: "",
  admin_notes: "",
  is_suspended: false, suspended_until: "", suspension_reason: "",
});

// ─── Inner Content (calls useSearchParams — safe inside Suspense) ─────────────

function EditVendorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const updateVendor = useUpdateVendor();
  const { data: existingVendor, isLoading: loadingVendor } = useVendor(editId ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storeImagePreview, setStoreImagePreview]   = useState<string | null>(null);
  const [storeBannerPreview, setStoreBannerPreview] = useState<string | null>(null);
  const [existingStoreImageUrl,  setExistingStoreImageUrl]  = useState<string | null>(null);
  const [existingStoreBannerUrl, setExistingStoreBannerUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<VendorFormData>(getEmptyForm);
  const [errors,   setErrors  ] = useState<Partial<Record<keyof VendorFormData | string, string>>>({});

  // ── Populate form ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!existingVendor) return;
    const v = existingVendor;

    let parsedHours: BusinessHours = getDefaultHours();
    try {
      let raw: any = v.business_hours;
      if (typeof raw === "string") raw = JSON.parse(raw);

      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        parsedHours = DAYS_OF_WEEK.reduce((acc, { key }) => {
          const stored = raw[key];
          if (stored && typeof stored === "object") {
            acc[key] = {
              open:     stored.open  ?? DEFAULT_DAY.open,
              close:    stored.close ?? DEFAULT_DAY.close,
              isClosed: false,
            };
          } else {
            acc[key] = { ...DEFAULT_DAY, isClosed: true };
          }
          return acc;
        }, {} as BusinessHours);
      }
    } catch (err) {
      console.error("[EditVendorPage] Failed to parse business_hours:", err);
      parsedHours = getDefaultHours();
    }

    setFormData({
      store_name:           v.store_name          ?? "",
      store_description:    v.store_description   ?? "",
      store_image:          null,
      store_banner:         null,
      address:              v.address             ?? "",
      city:                 v.city                ?? "",
      state:                v.state               ?? "",
      pincode:              v.pincode             ?? "",
      latitude:             v.latitude?.toString()  ?? "",
      longitude:            v.longitude?.toString() ?? "",
      is_open:              v.is_open             ?? true,
      is_verified:          v.is_verified         ?? false,
      business_hours:       parsedHours,
      kyc_status:           toKycStatus(v.kyc_status),
      kyc_rejection_reason: v.kyc_rejected_reason ?? "",
      admin_notes:          v.admin_notes         ?? "",
      is_suspended:         !!v.suspension_reason,
      suspended_until:      v.suspended_until     ?? "",
      suspension_reason:    v.suspension_reason   ?? "",
    });

    if (v.store_image)  { setExistingStoreImageUrl(v.store_image);   setStoreImagePreview(v.store_image);   }
    if (v.store_banner) { setExistingStoreBannerUrl(v.store_banner); setStoreBannerPreview(v.store_banner); }
  }, [existingVendor]);

  // ── Field helpers ──────────────────────────────────────────────────────────
  const handleInputChange = (field: keyof VendorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleImageUpload = (slot: "store_image" | "store_banner", file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        slot === "store_image" ? setStoreImagePreview(dataUrl) : setStoreBannerPreview(dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      slot === "store_image"
        ? setStoreImagePreview(existingStoreImageUrl)
        : setStoreBannerPreview(existingStoreBannerUrl);
    }
    handleInputChange(slot, file);
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
        [day]: { ...prev.business_hours[day], [field]: value },
      },
    }));
    if (errors[`${day}_hours`]) setErrors(prev => ({ ...prev, [`${day}_hours`]: "" }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    if (!formData.store_name.trim()) newErrors.store_name = "Store name is required";
    if (!formData.address.trim())    newErrors.address    = "Address is required";
    if (!formData.city.trim())       newErrors.city       = "City is required";
    if (!formData.state.trim())      newErrors.state      = "State is required";
    if (!formData.pincode.trim())    newErrors.pincode    = "Pincode is required";

    if (formData.kyc_status === "rejected" && !formData.kyc_rejection_reason.trim()) {
      newErrors.kyc_rejection_reason = "Rejection reason is required when KYC is rejected";
    }
    if (formData.is_suspended && !formData.suspension_reason.trim()) {
      newErrors.suspension_reason = "Suspension reason is required";
    }

    DAYS_OF_WEEK.forEach(({ key }) => {
      const schedule = formData.business_hours[key];
      if (!schedule.isClosed) {
        if (!schedule.open || !schedule.close) {
          newErrors[`${key}_hours`] = "Operating hours are required for open days";
        } else if (schedule.open >= schedule.close) {
          newErrors[`${key}_hours`] = "Closing time must be after opening time";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) {
      toast.error("Validation Error", {
        description: "Please fix all errors before submitting",
        position: "top-center",
      });
      return;
    }

    if (!editId) {
      toast.error("No vendor ID found");
      return;
    }

    setIsSubmitting(true);
    try {
      let storeImageUrl:  string | null = existingStoreImageUrl  ?? null;
      let storeBannerUrl: string | null = existingStoreBannerUrl ?? null;

      if (formData.store_image) {
        if (existingStoreImageUrl) await deleteVendorImage(existingStoreImageUrl);
        storeImageUrl = await uploadVendorImage(formData.store_image, editId, "store_image");
      }
      if (formData.store_banner) {
        if (existingStoreBannerUrl) await deleteVendorImage(existingStoreBannerUrl);
        storeBannerUrl = await uploadVendorImage(formData.store_banner, editId, "store_banner");
      }

      const formattedBusinessHours: Record<string, { open: string; close: string }> = {};
      DAYS_OF_WEEK.forEach(({ key }) => {
        if (!formData.business_hours[key].isClosed) {
          formattedBusinessHours[key] = {
            open:  formData.business_hours[key].open,
            close: formData.business_hours[key].close,
          };
        }
      });

      const payload = {
        store_name:          formData.store_name,
        store_description:   formData.store_description,
        store_image:         storeImageUrl,
        store_banner:        storeBannerUrl,
        address:             formData.address,
        city:                formData.city,
        state:               formData.state,
        pincode:             formData.pincode,
        latitude:            formData.latitude  ? parseFloat(formData.latitude)  : null,
        longitude:           formData.longitude ? parseFloat(formData.longitude) : null,
        is_open:             formData.is_open,
        is_verified:         formData.is_verified,
        business_hours:      formattedBusinessHours,
        kyc_status:          formData.kyc_status,
        kyc_verified_at:     formData.kyc_status === "approved" ? new Date().toISOString() : null,
        kyc_rejected_reason: formData.kyc_status === "rejected" ? formData.kyc_rejection_reason : null,
        admin_notes:         formData.admin_notes,
        suspended_until:     formData.is_suspended ? formData.suspended_until   : null,
        suspension_reason:   formData.is_suspended ? formData.suspension_reason : null,
        updated_at:          new Date().toISOString(),
      };

      await updateVendor.mutateAsync({ vendorId: editId, updates: payload });
      toast.success("Vendor updated successfully");
      router.push("/admin/vendors");
    } catch (error: any) {
      console.error("Vendor update error:", error);
      toast.error("Failed to update vendor", {
        description: error?.message ?? "Please try again.",
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

  // ── Loading / not-found states ─────────────────────────────────────────────
  if (loadingVendor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!editId || !existingVendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground text-lg">Vendor not found.</p>
        <Link href="/admin/vendors">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />Back to Vendors
          </Button>
        </Link>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <Link href="/admin/vendors">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Vendors
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Edit Vendor</h1>
          <p className="text-muted-foreground">Update vendor account details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 1. Store Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />Store Information
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
                    onChange={e => handleInputChange("store_name", e.target.value)}
                    placeholder="e.g., Fresh Mart"
                  />
                  {errors.store_name && <p className="text-xs text-red-500">{errors.store_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={e => handleInputChange("city", e.target.value)}
                    placeholder="e.g., Bangalore"
                  />
                  {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="store_description">Store Description</Label>
                <Textarea
                  id="store_description"
                  value={formData.store_description}
                  onChange={e => handleInputChange("store_description", e.target.value)}
                  placeholder="Brief description of the store..."
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-4">
                <ImageUploadSlot
                  isBanner={false}
                  label="Store Image"
                  preview={storeImagePreview}
                  onFile={file => handleImageUpload("store_image", file)}
                  hasExisting={!!existingStoreImageUrl}
                />
                <ImageUploadSlot
                  isBanner
                  label="Store Banner"
                  preview={storeBannerPreview}
                  onFile={file => handleImageUpload("store_banner", file)}
                  hasExisting={!!existingStoreBannerUrl}
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />Address Information
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
                  onChange={e => handleInputChange("address", e.target.value)}
                  placeholder="Full address..."
                  rows={2}
                />
                {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="state">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={e => handleInputChange("state", e.target.value)}
                    placeholder="e.g., Karnataka"
                  />
                  {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">
                    Pincode <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={e => handleInputChange("pincode", e.target.value)}
                    placeholder="e.g., 560001"
                  />
                  {errors.pincode && <p className="text-xs text-red-500">{errors.pincode}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude (Optional)</Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    onChange={e => handleInputChange("latitude", e.target.value)}
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
                  onChange={e => handleInputChange("longitude", e.target.value)}
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
                <Shield className="h-5 w-5" />Business Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Is Store Open</Label>
                  <p className="text-sm text-muted-foreground">Enable to make the store visible to customers</p>
                </div>
                <Switch
                  checked={formData.is_open}
                  onCheckedChange={v => handleInputChange("is_open", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Is Vendor Verified</Label>
                  <p className="text-sm text-muted-foreground">Admin-controlled verification status</p>
                </div>
                <Switch
                  checked={formData.is_verified}
                  onCheckedChange={v => handleInputChange("is_verified", v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 4. Business Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS_OF_WEEK.map(({ key, label }) => {
                const schedule = formData.business_hours[key];
                return (
                  <div key={key}>
                    <div className="flex items-center gap-4">
                      <div className="w-28 shrink-0">
                        <Label className="font-medium">{label}</Label>
                      </div>

                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={schedule.open}
                          onChange={e => handleBusinessHourChange(key, "open", e.target.value)}
                          disabled={schedule.isClosed}
                          className="w-32"
                        />
                        <span className="text-muted-foreground text-sm">to</span>
                        <Input
                          type="time"
                          value={schedule.close}
                          onChange={e => handleBusinessHourChange(key, "close", e.target.value)}
                          disabled={schedule.isClosed}
                          className="w-32"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={schedule.isClosed}
                          onCheckedChange={v => handleBusinessHourChange(key, "isClosed", v)}
                        />
                        <Label className="text-sm text-muted-foreground">Closed</Label>
                      </div>
                    </div>

                    {errors[`${key}_hours`] && (
                      <p className="text-xs text-red-500 mt-1 ml-28 pl-1">
                        {errors[`${key}_hours`]}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* 5. KYC Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />KYC Status (Admin Controlled)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>KYC Status: {formData.kyc_status}</Label>
                <Select
                  value={formData.kyc_status}
                  onValueChange={v => {
                    if (!v) return;
                    handleInputChange("kyc_status", v as KycStatus);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                {formData.kyc_status === "approved" && (
                  <p className="text-xs text-muted-foreground">
                    KYC verified date will be auto-filled on save
                  </p>
                )}
              </div>

              {formData.kyc_status === "rejected" && (
                <div className="space-y-2">
                  <Label>
                    KYC Rejection Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={formData.kyc_rejection_reason}
                    onChange={e => handleInputChange("kyc_rejection_reason", e.target.value)}
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

          {/* 6. Admin Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />Admin Controls & Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={formData.admin_notes}
                  onChange={e => handleInputChange("admin_notes", e.target.value)}
                  placeholder="Internal notes about this vendor..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Suspend Vendor</Label>
                  <p className="text-sm text-muted-foreground">Temporarily suspend vendor account</p>
                </div>
                <Switch
                  checked={formData.is_suspended}
                  onCheckedChange={v => handleInputChange("is_suspended", v)}
                />
              </div>

              {formData.is_suspended && (
                <>
                  <div className="space-y-2">
                    <Label>Suspended Until</Label>
                    <Input
                      type="date"
                      value={formData.suspended_until}
                      onChange={e => handleInputChange("suspended_until", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Suspension Reason <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={formData.suspension_reason}
                      onChange={e => handleInputChange("suspension_reason", e.target.value)}
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

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t py-4 px-6">
        <div className="mx-auto max-w-5xl flex items-center justify-end gap-3">
          <Link href="/admin/vendors">
            <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
          </Link>
          <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
            {isSubmitting
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              : <><Save className="mr-2 h-4 w-4" />Update Vendor</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Default Export — Suspense MUST wrap the component that calls useSearchParams ─

export default function EditVendorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <EditVendorContent />
    </Suspense>
  );
}

// ─── ImageUploadSlot ──────────────────────────────────────────────────────────

interface ImageUploadSlotProps {
  label: string;
  preview: string | null;
  hasExisting: boolean;
  onFile: (file: File | null) => void;
  isBanner: boolean;
}

function ImageUploadSlot({ label, preview, hasExisting, onFile, isBanner }: ImageUploadSlotProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {preview ? (
        <div className={`relative ${isBanner ? "w-full" : "w-32"} h-32 bg-muted rounded-md overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => onFile(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          {hasExisting && (
            <label className="absolute inset-0 flex items-end justify-center pb-2 cursor-pointer opacity-0 hover:opacity-100 bg-black/30 transition-opacity">
              <span className="text-xs text-white font-medium">Click to replace</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={e => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center ${
            isBanner ? "w-full" : "w-32"
          } h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors text-center`}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Upload {label}</span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={e => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  );
}