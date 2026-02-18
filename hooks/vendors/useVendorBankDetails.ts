// hooks/vendors/useVendorBankDetails.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// ─── Types ────────────────────────────────────────────────────────────────────

export type BankVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface VendorBankDetail {
  id: string;
  vendor_id: string;
  account_holder_name: string;
  account_number: string;
  bank_name: string;
  ifsc_code: string;
  branch: string | null;
  account_type: string | null;
  upi_id: string | null;
  proof_image: string | null;
  status: BankVerificationStatus;
  rejection_reason: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const bankDetailKeys = {
  all: ['vendor_bank_details'] as const,
  byVendor: (vendorId: string) => ['vendor_bank_details', 'vendor', vendorId] as const,
  detail: (id: string) => ['vendor_bank_details', 'detail', id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch bank details for a specific vendor by their vendor_id
 */
export function useVendorBankDetail(vendorId: string) {
  return useQuery({
    queryKey: bankDetailKeys.byVendor(vendorId),
    queryFn: async (): Promise<VendorBankDetail | null> => {
      const { data, error } = await supabase
        .from('vendor_bank_details')
        .select('*')
        .eq('vendor_id', vendorId)
        .maybeSingle();

      if (error) throw error;
      return data as VendorBankDetail | null;
    },
    enabled: !!vendorId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Update bank verification status (pending | approved | rejected)
 * When approved, also sets is_verified = true and verified_at
 * When rejected, stores rejection_reason and clears verification
 */
export function useUpdateBankVerificationStatus() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      bankDetailId,
      vendorId,
      status,
      rejectionReason,
      verifiedBy = 'admin',
    }: {
      bankDetailId: string;
      vendorId: string;
      status: BankVerificationStatus;
      rejectionReason?: string;
      verifiedBy?: string;
    }) => {
      const updates: Partial<VendorBankDetail> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'approved') {
        updates.is_verified = true;
        updates.verified_at = new Date().toISOString();
        updates.verified_by = verifiedBy;
        updates.rejection_reason = null;
      } else if (status === 'rejected') {
        updates.is_verified = false;
        updates.rejection_reason = rejectionReason ?? null;
        updates.verified_at = null;
        updates.verified_by = verifiedBy;
      } else {
        // pending
        updates.is_verified = false;
        updates.rejection_reason = null;
        updates.verified_at = null;
        updates.verified_by = null;
      }

      const { data, error } = await supabase
        .from('vendor_bank_details')
        .update(updates)
        .eq('id', bankDetailId)
        .select('*')
        .single();

      if (error) throw error;
      return data as VendorBankDetail;
    },
    onSuccess: (data, { vendorId }) => {
      qc.setQueryData(bankDetailKeys.byVendor(vendorId), data);
      qc.invalidateQueries({ queryKey: bankDetailKeys.all });
    },
  });
}

/**
 * Toggle is_verified boolean directly (without changing status)
 */
export function useToggleBankVerified() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bankDetailId,
      vendorId,
      isVerified,
      verifiedBy = 'admin',
    }: {
      bankDetailId: string;
      vendorId: string;
      isVerified: boolean;
      verifiedBy?: string;
    }) => {
      const { data, error } = await supabase
        .from('vendor_bank_details')
        .update({
          is_verified: isVerified,
          verified_at: isVerified ? new Date().toISOString() : null,
          verified_by: isVerified ? verifiedBy : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bankDetailId)
        .select('*')
        .single();

      if (error) throw error;
      return data as VendorBankDetail;
    },
    onSuccess: (data, { vendorId }) => {
      qc.setQueryData(bankDetailKeys.byVendor(vendorId), data);
      qc.invalidateQueries({ queryKey: bankDetailKeys.all });
    },
  });
}

/**
 * Update rejection reason only
 */
export function useUpdateBankRejectionReason() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bankDetailId,
      vendorId,
      rejectionReason,
    }: {
      bankDetailId: string;
      vendorId: string;
      rejectionReason: string;
    }) => {
      const { data, error } = await supabase
        .from('vendor_bank_details')
        .update({
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bankDetailId)
        .select('*')
        .single();

      if (error) throw error;
      return data as VendorBankDetail;
    },
    onSuccess: (data, { vendorId }) => {
      qc.setQueryData(bankDetailKeys.byVendor(vendorId), data);
    },
  });
}