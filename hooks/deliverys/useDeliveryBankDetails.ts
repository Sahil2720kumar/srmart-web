// hooks/delivery/useDeliveryBankDetails.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// ─── Types ────────────────────────────────────────────────────────────────────

type BankVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface DeliveryBankDetail {
  id: string;
  delivery_boy_id: string;
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

export interface DeliveryBoyInfo {
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  profile_image: string | null;
  is_online: boolean;
  rating: number | null;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const deliveryBankKeys = {
  all: ['delivery_bank_details'] as const,
  byDeliveryBoy: (deliveryBoyId: string) =>
    ['delivery_bank_details', 'delivery_boy', deliveryBoyId] as const,
  detail: (id: string) => ['delivery_bank_details', 'detail', id] as const,
  deliveryBoyInfo: (deliveryBoyId: string) =>
    ['delivery_boy_info', deliveryBoyId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch bank details for a delivery boy
 */
export function useDeliveryBankDetail(deliveryBoyId: string) {
  return useQuery({
    queryKey: deliveryBankKeys.byDeliveryBoy(deliveryBoyId),
    queryFn: async (): Promise<DeliveryBankDetail | null> => {
      const { data, error } = await supabase
        .from('delivery_boy_bank_details')
        .select('*')
        .eq('delivery_boy_id', deliveryBoyId)
        .maybeSingle();

      if (error) throw error;
      return data as DeliveryBankDetail | null;
    },
    enabled: !!deliveryBoyId,
  });
}

/**
 * Fetch basic delivery boy info for the page header
 */
export function useDeliveryBoyInfo(deliveryBoyId: string) {
  return useQuery({
    queryKey: deliveryBankKeys.deliveryBoyInfo(deliveryBoyId),
    queryFn: async (): Promise<DeliveryBoyInfo | null> => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('first_name, last_name, profile_photo, is_online, rating, users(email,phone)')
        .eq('user_id', deliveryBoyId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: (data.users as any)?.phone ?? null,
        email: (data.users as any)?.email ?? null,
        profile_image: data.profile_photo ?? null,
        is_online: data.is_online ?? false,
        rating: data.rating ?? null,
      };
    },
    enabled: !!deliveryBoyId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Update verification status — approve sets is_verified=true; reject stores reason
 */
export function useUpdateDeliveryBankStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bankDetailId,
      deliveryBoyId,
      status,
      rejectionReason,
      verifiedBy = 'admin',
    }: {
      bankDetailId: string;
      deliveryBoyId: string;
      status: BankVerificationStatus;
      rejectionReason?: string;
      verifiedBy?: string;
    }) => {
      const updates: Partial<DeliveryBankDetail> = {
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
        updates.is_verified = false;
        updates.rejection_reason = null;
        updates.verified_at = null;
        updates.verified_by = null;
      }

      const { data, error } = await supabase
        .from('delivery_boy_bank_details')
        .update(updates)
        .eq('id', bankDetailId)
        .select('*')
        .single();

      if (error) throw error;
      return data as DeliveryBankDetail;
    },
    onSuccess: (data, { deliveryBoyId }) => {
      qc.setQueryData(deliveryBankKeys.byDeliveryBoy(deliveryBoyId), data);
      qc.invalidateQueries({ queryKey: deliveryBankKeys.all });
    },
  });
}

/**
 * Toggle is_verified independently of status
 */
export function useToggleDeliveryBankVerified() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bankDetailId,
      deliveryBoyId,
      isVerified,
      verifiedBy = 'admin',
    }: {
      bankDetailId: string;
      deliveryBoyId: string;
      isVerified: boolean;
      verifiedBy?: string;
    }) => {
      const { data, error } = await supabase
        .from('delivery_boy_bank_details')
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
      return data as DeliveryBankDetail;
    },
    onSuccess: (data, { deliveryBoyId }) => {
      qc.setQueryData(deliveryBankKeys.byDeliveryBoy(deliveryBoyId), data);
      qc.invalidateQueries({ queryKey: deliveryBankKeys.all });
    },
  });
}