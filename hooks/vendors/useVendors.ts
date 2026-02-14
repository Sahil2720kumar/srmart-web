// hooks/vendors/useVendors.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from '../query-keys';
import {
  Vendor,
  VendorInsert,
  VendorUpdate,
  VendorBankDetails,
  VendorBankDetailsInsert,
  VendorBankDetailsUpdate,
  VendorWithStats,
  VendorPerformance,
  VendorInventory,
  VendorFilters,
} from '@/types/supabase';

// ============================================================================
// QUERIES
// ============================================================================
const supabase = createClient();
/**
 * Get all vendors with optional filters
 */
export function useVendors(filters?: VendorFilters) {
  return useQuery({
    queryKey: queryKeys.vendors.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('vendors')
        .select('*, users(email, phone, is_active)');

      // Apply filters
      if (filters?.is_verified !== undefined) {
        query = query.eq('is_verified', filters.is_verified);
      }
      if (filters?.is_open !== undefined) {
        query = query.eq('is_open', filters.is_open);
      }
      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.state) {
        query = query.eq('state', filters.state);
      }
      if (filters?.min_rating) {
        query = query.gte('rating', filters.min_rating);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Vendor & { users: { email: string; phone: string; is_active: boolean } })[];
    },
  });
}

/**
 * Get vendor by ID with user details
 */
export function useVendor(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.vendors.detail(vendorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*, users(email, phone, is_active)')
        .eq('user_id', vendorId)
        .single();

      if (error) throw error;
      return data as Vendor & { users: { email: string; phone: string; is_active: boolean } };
    },
    enabled: !!vendorId,
  });
}

/**
 * Get vendor by user ID
 */
export function useVendorByUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.vendors.byUser(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*, users(email, phone, is_active)')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as Vendor & { users: { email: string; phone: string; is_active: boolean } };
    },
    enabled: !!userId,
  });
}

/**
 * Get vendor bank details
 */
export function useVendorBankDetails(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.vendors.bankDetails(vendorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_bank_details')
        .select('*')
        .eq('vendor_id', vendorId)
        .single();

      if (error) throw error;
      return data as VendorBankDetails;
    },
    enabled: !!vendorId,
  });
}

/**
 * Get vendor performance metrics from view
 */
export function useVendorPerformance(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.vendors.performance(vendorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_vendor_performance')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) throw error;
      return data as VendorPerformance;
    },
    enabled: !!vendorId,
  });
}

/**
 * Get vendor inventory using database function
 */
export function useVendorInventory(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.vendors.inventory(vendorId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vendor_inventory', {
        p_vendor_id: vendorId,
      });

      if (error) throw error;
      return data as VendorInventory[];
    },
    enabled: !!vendorId,
  });
}

/**
 * Get vendor payouts
 */
export function useVendorPayouts(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.vendors.payouts(vendorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_payouts')
        .select('*, orders(order_number, created_at)')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new vendor
 */
export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendor: VendorInsert) => {
      const { data, error } = await supabase
        .from('vendors')
        .insert(vendor)
        .select('*, users(email, phone)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
      queryClient.setQueryData(queryKeys.vendors.byUser(data.user_id), data);
    },
  });
}

/**
 * Update vendor profile
 */
export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      updates,
    }: {
      vendorId: string;
      updates: VendorUpdate;
    }) => {
      const { data, error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('user_id', vendorId)
        .select('*, users(email, phone)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.vendors.byUser(data.user_id), data);
      queryClient.setQueryData(queryKeys.vendors.detail(data.user_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.performance(data.user_id) });
    },
  });
}

/**
 * Update vendor profile for current user
 */
export function useUpdateVendorProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: VendorUpdate) => {
      const { data, error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('user_id', userId)
        .select('*, users(email, phone)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.vendors.byUser(userId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
}

/**
 * Delete vendor
 */
export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendorId: string) => {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('user_id', vendorId);

      if (error) throw error;
    },
    onSuccess: (_, vendorId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
      queryClient.removeQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
      queryClient.removeQueries({ queryKey: queryKeys.vendors.byUser(vendorId) });
    },
  });
}

/**
 * Toggle vendor store open/close status
 */
export function useToggleVendorStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      isOpen,
    }: {
      vendorId: string;
      isOpen: boolean;
    }) => {
      const { data, error } = await supabase
        .from('vendors')
        .update({ is_open: isOpen })
        .eq('user_id', vendorId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.vendors.byUser(data.user_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
}

/**
 * Add or update vendor bank details
 */
export function useUpsertVendorBankDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      bankDetails,
    }: {
      vendorId: string;
      bankDetails: VendorBankDetailsInsert | VendorBankDetailsUpdate;
    }) => {
      const { data, error } = await supabase
        .from('vendor_bank_details')
        .upsert({ ...bankDetails, vendor_id: vendorId })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.vendors.bankDetails(data.vendor_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.detail(data.vendor_id) });
    },
  });
}

/**
 * Update vendor KYC status
 */
export function useUpdateVendorKycStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      status,
      rejectedReason,
    }: {
      vendorId: string;
      status: 'pending' | 'verified' | 'rejected';
      rejectedReason?: string;
    }) => {
      const updates: VendorUpdate = {
        kyc_status: status,
        kyc_verified_at: status === 'verified' ? new Date().toISOString() : null,
        kyc_rejected_reason: status === 'rejected' ? rejectedReason : null,
        is_verified: status === 'verified',
      };

      const { data, error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('user_id', vendorId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.vendors.byUser(data.user_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
}

/**
 * Suspend vendor account
 */
export function useSuspendVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      reason,
      suspendedUntil,
    }: {
      vendorId: string;
      reason: string;
      suspendedUntil?: string;
    }) => {
      const { data, error } = await supabase
        .from('vendors')
        .update({
          suspension_reason: reason,
          suspended_until: suspendedUntil || null,
        })
        .eq('user_id', vendorId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.vendors.byUser(data.user_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
}

/**
 * Unsuspend vendor account
 */
export function useUnsuspendVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendorId: string) => {
      const { data, error } = await supabase
        .from('vendors')
        .update({
          suspension_reason: null,
          suspended_until: null,
        })
        .eq('user_id', vendorId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.vendors.byUser(data.user_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
}

/**
 * Update vendor business hours
 */
export function useUpdateVendorBusinessHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      businessHours,
    }: {
      vendorId: string;
      businessHours: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('vendors')
        .update({ business_hours: businessHours })
        .eq('user_id', vendorId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.vendors.byUser(data.user_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.detail(data.user_id) });
    },
  });
}