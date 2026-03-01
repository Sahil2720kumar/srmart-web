import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export const bankDetailsQueryKeys = {
  all: ["bank_details"] as const,
  vendorList: (filters?: { status?: string }) =>
    ["bank_details", "vendor", "list", filters] as const,
  deliveryList: (filters?: { status?: string }) =>
    ["bank_details", "delivery", "list", filters] as const,
  vendorById: (id: string) => ["bank_details", "vendor", id] as const,
  deliveryById: (id: string) => ["bank_details", "delivery", id] as const,
};

// ─── Vendor Bank Details ───────────────────────────────────────────────────

export function useVendorBankDetails(filters?: { status?: string }) {
  return useQuery({
    queryKey: bankDetailsQueryKeys.vendorList(filters),
    queryFn: async () => {
      let query = supabase
        .from("vendor_bank_details")
        .select(
          `
          *,
          vendors!vendor_bank_details_vendor_id_fkey(store_name, city, state, rating, is_verified,
            users!vendors_user_id_fkey(email, phone)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useVendorBankDetailsById(id: string) {
  return useQuery({
    queryKey: bankDetailsQueryKeys.vendorById(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_bank_details")
        .select(
          `
          *,
          vendors!vendor_bank_details_vendor_id_fkey(store_name, city, state, address, pincode, rating, is_verified, kyc_status,
            users!vendors_user_id_fkey(email, phone)
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useApproveVendorBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      verifiedBy,
    }: {
      id: string;
      verifiedBy: string;
    }) => {
      const { data, error } = await supabase
        .from("vendor_bank_details")
        .update({
          status: "approved",
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: verifiedBy,
          rejection_reason: null,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: bankDetailsQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: bankDetailsQueryKeys.vendorById(data.id),
      });
    },
  });
}

export function useRejectVendorBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      rejectionReason,
    }: {
      id: string;
      rejectionReason: string;
    }) => {
      const { data, error } = await supabase
        .from("vendor_bank_details")
        .update({
          status: "rejected",
          is_verified: false,
          rejection_reason: rejectionReason,
          verified_at: null,
          verified_by: null,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: bankDetailsQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: bankDetailsQueryKeys.vendorById(data.id),
      });
    },
  });
}

// ─── Delivery Boy Bank Details ─────────────────────────────────────────────

export function useDeliveryBoyBankDetails(filters?: { status?: string }) {
  return useQuery({
    queryKey: bankDetailsQueryKeys.deliveryList(filters),
    queryFn: async () => {
      let query = supabase
        .from("delivery_boy_bank_details")
        .select(
          `
          *,
          delivery_boys!delivery_boy_bank_details_delivery_boy_id_fkey(first_name, last_name, city, state, rating, is_verified,
            users!delivery_boys_user_id_fkey(email, phone)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useDeliveryBoyBankDetailsById(id: string) {
  return useQuery({
    queryKey: bankDetailsQueryKeys.deliveryById(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_boy_bank_details")
        .select(
          `
          *,
          delivery_boys!delivery_boy_bank_details_delivery_boy_id_fkey(first_name, last_name, city, state, address_line1, pincode, rating, is_verified, kyc_status,
            users!delivery_boys_user_id_fkey(email, phone)
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useApproveDeliveryBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      verifiedBy,
    }: {
      id: string;
      verifiedBy: string;
    }) => {
      const { data, error } = await supabase
        .from("delivery_boy_bank_details")
        .update({
          status: "approved",
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: verifiedBy,
          rejection_reason: null,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: bankDetailsQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: bankDetailsQueryKeys.deliveryById(data.id),
      });
    },
  });
}

export function useRejectDeliveryBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      rejectionReason,
    }: {
      id: string;
      rejectionReason: string;
    }) => {
      const { data, error } = await supabase
        .from("delivery_boy_bank_details")
        .update({
          status: "rejected",
          is_verified: false,
          rejection_reason: rejectionReason,
          verified_at: null,
          verified_by: null,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: bankDetailsQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: bankDetailsQueryKeys.deliveryById(data.id),
      });
    },
  });
}