"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save } from "lucide-react";
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

interface FormData {
  first_name: string;
  last_name: string;
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  license_number?: string;
}

export default function AddDeliveryPartnerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    vehicle_type: "",
    vehicle_number: "",
    license_number: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    if (!formData.vehicle_type) {
      newErrors.vehicle_type = "Vehicle type is required";
    }
    if (!formData.vehicle_number.trim()) {
      newErrors.vehicle_number = "Vehicle number is required";
    }
    if (!formData.license_number.trim()) {
      newErrors.license_number = "License number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast('Validation Error',{
       
        description: "Please fill in all required fields",
       
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log("New delivery partner:", formData);

      // toast({
      //   title: "Success",
      //   description: "Delivery partner created successfully",
      // });

      router.push("/admin/delivery");
    } catch (error) {
      // toast({
      //   title: "Error",
      //   description: "Failed to create delivery partner. Please try again.",
      //   variant: "destructive",
      // });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = 
    formData.first_name.trim() &&
    formData.last_name.trim() &&
    formData.vehicle_type &&
    formData.vehicle_number.trim() &&
    formData.license_number.trim();

  return (
    <div className="min-h-screen bg-background ">
      <div className=" space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <Link href="/admin/delivery">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Partners
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Add Delivery Partner</h1>
          <p className="text-muted-foreground">Create a new delivery partner account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Partner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="e.g., Ramesh"
                />
                {errors.first_name && (
                  <p className="text-xs text-red-500">{errors.first_name}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="e.g., Kumar"
                />
                {errors.last_name && (
                  <p className="text-xs text-red-500">{errors.last_name}</p>
                )}
              </div>

              {/* Vehicle Type */}
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">
                  Vehicle Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={(value) => handleInputChange("vehicle_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bike">Bike</SelectItem>
                    <SelectItem value="Scooter">Scooter</SelectItem>
                    <SelectItem value="Bicycle">Bicycle</SelectItem>
                    <SelectItem value="Car">Car</SelectItem>
                  </SelectContent>
                </Select>
                {errors.vehicle_type && (
                  <p className="text-xs text-red-500">{errors.vehicle_type}</p>
                )}
              </div>

              {/* Vehicle Number */}
              <div className="space-y-2">
                <Label htmlFor="vehicle_number">
                  Vehicle Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={(e) => handleInputChange("vehicle_number", e.target.value.toUpperCase())}
                  placeholder="e.g., KA-01-AB-1234"
                />
                {errors.vehicle_number && (
                  <p className="text-xs text-red-500">{errors.vehicle_number}</p>
                )}
              </div>

              {/* License Number */}
              <div className="space-y-2">
                <Label htmlFor="license_number">
                  License Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => handleInputChange("license_number", e.target.value.toUpperCase())}
                  placeholder="e.g., DL1234567890"
                />
                {errors.license_number && (
                  <p className="text-xs text-red-500">{errors.license_number}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Link href="/admin/delivery">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Partner
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}