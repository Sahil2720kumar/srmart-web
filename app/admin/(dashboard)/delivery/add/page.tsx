"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import {
  useDeliveryBoyByUser,
  useUpdateDeliveryBoy,
} from "@/hooks";

// ─── types ────────────────────────────────────────────────────────────────────

interface FormData {
  first_name: string;
  last_name: string;
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
  city: string;
  state: string;
  pincode: string;
  address_line1: string;
  address_line2: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const EMPTY_FORM: FormData = {
  first_name: "",
  last_name: "",
  vehicle_type: "",
  vehicle_number: "",
  license_number: "",
  city: "",
  state: "",
  pincode: "",
  address_line1: "",
  address_line2: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-rose-500 mt-1">{msg}</p>;
}

function FormField({
  id,
  label,
  required,
  children,
  error,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </Label>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

// ─── inner content (calls useSearchParams — safe inside Suspense) ─────────────

function EditDeliveryPartnerContent() {
  const router              = useRouter();
  const searchParams        = useSearchParams();
  const partnerId           = searchParams.get("edit")!;

  const { data: partner, isLoading: loadingPartner } = useDeliveryBoyByUser(partnerId);
  const updateDeliveryBoy   = useUpdateDeliveryBoy();

  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [errors,   setErrors]   = useState<FormErrors>({});

  // Pre-fill form once partner data arrives
  useEffect(() => {
    if (!partner) return;
    setFormData({
      first_name:             partner.first_name            ?? "",
      last_name:              partner.last_name             ?? "",
      vehicle_type:           partner.vehicle_type          ?? "",
      vehicle_number:         partner.vehicle_number        ?? "",
      license_number:         partner.license_number        ?? "",
      city:                   partner.city                  ?? "",
      state:                  partner.state                 ?? "",
      pincode:                partner.pincode               ?? "",
      address_line1:          partner.address_line1         ?? "",
      address_line2:          partner.address_line2         ?? "",
      emergency_contact_name: partner.emergency_contact_name  ?? "",
      emergency_contact_phone:partner.emergency_contact_phone ?? "",
    });
  }, [partner]);

  // ── field helpers ────────────────────────────────────────────────────────
  const set = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── validation ───────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!formData.first_name.trim())    e.first_name    = "First name is required";
    if (!formData.last_name.trim())     e.last_name     = "Last name is required";
    if (!formData.vehicle_type)         e.vehicle_type  = "Vehicle type is required";
    if (!formData.vehicle_number.trim()) e.vehicle_number = "Vehicle number is required";
    if (!formData.license_number.trim()) e.license_number = "License number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateDeliveryBoy.mutate(
      {
        userId: partnerId,
        updates: {
          first_name:              formData.first_name.trim(),
          last_name:               formData.last_name.trim(),
          vehicle_type:            formData.vehicle_type || null,
          vehicle_number:          formData.vehicle_number.trim() || null,
          license_number:          formData.license_number.trim() || null,
          city:                    formData.city.trim() || null,
          state:                   formData.state.trim() || null,
          pincode:                 formData.pincode.trim() || null,
          address_line1:           formData.address_line1.trim() || null,
          address_line2:           formData.address_line2.trim() || null,
          emergency_contact_name:  formData.emergency_contact_name.trim() || null,
          emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
          updated_at:              new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Partner updated successfully");
          router.push(`/admin/delivery/${partnerId}`);
        },
        onError: () => {
          toast.error("Failed to update partner. Please try again.");
        },
      }
    );
  };

  const isFormValid =
    formData.first_name.trim() &&
    formData.last_name.trim() &&
    formData.vehicle_type &&
    formData.vehicle_number.trim() &&
    formData.license_number.trim();

  // ── loading skeleton ─────────────────────────────────────────────────────
  if (loadingPartner) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="space-y-1">
        <Link href={`/admin/delivery/${partnerId}`}>
          <Button variant="ghost" size="sm" className="-ml-2">
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            Back to Profile
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Delivery Partner</h1>
        <p className="text-sm text-muted-foreground">
          Update information for{" "}
          <span className="font-medium text-foreground">
            {partner?.first_name} {partner?.last_name}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── personal info ──────────────────────────────────────────── */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField id="first_name" label="First Name" required error={errors.first_name}>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                placeholder="e.g. Ramesh"
              />
            </FormField>

            <FormField id="last_name" label="Last Name" required error={errors.last_name}>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                placeholder="e.g. Kumar"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* ── vehicle info ───────────────────────────────────────────── */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField id="vehicle_type" label="Vehicle Type" required error={errors.vehicle_type}>
              <Select
                value={formData.vehicle_type}
                onValueChange={(v) => set("vehicle_type", v)}
              >
                <SelectTrigger id="vehicle_type">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bike">Bike</SelectItem>
                  <SelectItem value="Scooter">Scooter</SelectItem>
                  <SelectItem value="Bicycle">Bicycle</SelectItem>
                  <SelectItem value="Car">Car</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField id="vehicle_number" label="Vehicle Number" required error={errors.vehicle_number}>
              <Input
                id="vehicle_number"
                value={formData.vehicle_number}
                onChange={(e) => set("vehicle_number", e.target.value.toUpperCase())}
                placeholder="e.g. KA-01-AB-1234"
                className="font-mono"
              />
            </FormField>

            <FormField id="license_number" label="License Number" required error={errors.license_number}>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => set("license_number", e.target.value.toUpperCase())}
                placeholder="e.g. DL1234567890"
                className="font-mono"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* ── address ────────────────────────────────────────────────── */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Address</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField id="address_line1" label="Address Line 1" error={errors.address_line1}>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => set("address_line1", e.target.value)}
                placeholder="Street / flat number"
              />
            </FormField>

            <FormField id="address_line2" label="Address Line 2" error={errors.address_line2}>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => set("address_line2", e.target.value)}
                placeholder="Area / landmark"
              />
            </FormField>

            <FormField id="city" label="City" error={errors.city}>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="e.g. Bengaluru"
              />
            </FormField>

            <FormField id="state" label="State" error={errors.state}>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="e.g. Karnataka"
              />
            </FormField>

            <FormField id="pincode" label="Pincode" error={errors.pincode}>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="e.g. 560001"
                inputMode="numeric"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* ── emergency contact ──────────────────────────────────────── */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField id="emergency_contact_name" label="Contact Name" error={errors.emergency_contact_name}>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => set("emergency_contact_name", e.target.value)}
                placeholder="Full name"
              />
            </FormField>

            <FormField id="emergency_contact_phone" label="Contact Phone" error={errors.emergency_contact_phone}>
              <Input
                id="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => set("emergency_contact_phone", e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                inputMode="tel"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* ── actions ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3">
          <Link href={`/admin/delivery/${partnerId}`}>
            <Button type="button" variant="outline" disabled={updateDeliveryBoy.isPending}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!isFormValid || updateDeliveryBoy.isPending}
          >
            {updateDeliveryBoy.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── default export — Suspense MUST wrap the component that calls useSearchParams ─

export default function EditDeliveryPartnerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <EditDeliveryPartnerContent />
    </Suspense>
  );
}