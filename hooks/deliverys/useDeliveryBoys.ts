// hooks/delivery/useDeliveryBoys.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from "@/lib/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

// ============================================================================
// TYPES
// ============================================================================

type DeliveryBoy = Tables<'delivery_boys'>;
type DeliveryBoyInsert = TablesInsert<'delivery_boys'>;
type DeliveryBoyUpdate = TablesUpdate<'delivery_boys'>;

type DeliveryBoyBankDetails = Tables<'delivery_boy_bank_details'>;
type DeliveryBoyBankDetailsInsert = TablesInsert<'delivery_boy_bank_details'>;
type DeliveryBoyBankDetailsUpdate = TablesUpdate<'delivery_boy_bank_details'>;

type DeliveryVehicle = Tables<'delivery_vehicles'>;
type DeliveryVehicleInsert = TablesInsert<'delivery_vehicles'>;
type DeliveryVehicleUpdate = TablesUpdate<'delivery_vehicles'>;

type KycDocument = Tables<'kyc_documents'>;
type KycDocumentInsert = TablesInsert<'kyc_documents'>;
type KycDocumentUpdate = TablesUpdate<'kyc_documents'>;

type DeliveryEarning = Tables<'delivery_earnings'>;

export interface DeliveryBoyFilters {
  is_verified?: boolean;
  is_available?: boolean;
  is_online?: boolean;
  city?: string;
  state?: string;
  kyc_status?: string;
  vehicle_type?: string;
  min_rating?: number;
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabase = createClient();

// ============================================================================
// STORAGE CONSTANTS
// ============================================================================

const STORAGE_BUCKET = 'delivery_boys';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const deliveryQueryKeys = {
  all: ['delivery_boys'] as const,
  list: (filters?: DeliveryBoyFilters) => ['delivery_boys', 'list', filters] as const,
  detail: (userId: string) => ['delivery_boys', 'detail', userId] as const,
  byUser: (userId: string) => ['delivery_boys', 'user', userId] as const,
  bankDetails: (userId: string) => ['delivery_boys', 'bank_details', userId] as const,
  vehicle: (userId: string) => ['delivery_boys', 'vehicle', userId] as const,
  kyc: {
    all: ['delivery_kyc_documents'] as const,
    byUser: (userId: string) => ['delivery_kyc_documents', 'user', userId] as const,
    detail: (docId: string) => ['delivery_kyc_documents', 'detail', docId] as const,
    storageFiles: (userId: string) => ['delivery_kyc_storage_files', userId] as const,
  },
  earnings: (userId: string) => ['delivery_boys', 'earnings', userId] as const,
  wallet: (userId: string) => ['delivery_boys', 'wallet', userId] as const,
};

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Get public URL for a delivery boy's profile photo
 * Storage path: delivery_boys/{userId}/profile.{ext}
 */
export function getDeliveryBoyProfileUrl(userId: string, ext = 'jpeg'): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(`${userId}/profile.${ext}`);
  return data.publicUrl;
}

/**
 * Get public URL for a KYC document from Supabase storage
 * Storage path: delivery_boys/{userId}/kycDocuments/{documentId}.jpeg
 */
export function getDeliveryKycDocumentPublicUrl(
  userId: string,
  documentId: string,
  ext = 'jpeg'
): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(`${userId}/kycDocuments/${documentId}.${ext}`);
  return data.publicUrl;
}

/**
 * List all KYC document files for a delivery boy from storage
 */
export async function listDeliveryKycStorageFiles(userId: string) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(`${userId}/kycDocuments`, {
      limit: 50,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) throw error;
  return data ?? [];
}

/**
 * Upload a KYC document to Supabase storage
 * Returns the public URL of the uploaded file
 */
export async function uploadDeliveryKycDocument(
  userId: string,
  documentId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpeg';
  const storagePath = `${userId}/kycDocuments/${documentId}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Upload a delivery boy profile image or vehicle RC image.
 * Returns the public URL.
 */
export async function uploadDeliveryBoyImage(
  file: File,
  userId: string,
  slot: 'profile_photo' | 'rc_image' | 'bank_proof'
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpeg';
  const fileName = `${slot}-${crypto.randomUUID()}.${ext}`;
  const path = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete an old image from storage by public URL
 */
export async function deleteDeliveryBoyImage(publicUrl: string) {
  try {
    const marker = `/public/${STORAGE_BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const path = publicUrl.slice(idx + marker.length);
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  } catch {
    // Non-critical — ignore deletion errors
  }
}

// ============================================================================
// DELIVERY BOY QUERIES
// ============================================================================

/**
 * Get all delivery boys with optional filters
 */
export function useDeliveryBoys(filters?: DeliveryBoyFilters) {
  return useQuery({
    queryKey: deliveryQueryKeys.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('delivery_boys')
        .select('*, users(email, phone, is_active)');

      if (filters?.is_verified !== undefined) {
        query = query.eq('is_verified', filters.is_verified);
      }
      if (filters?.is_available !== undefined) {
        query = query.eq('is_available', filters.is_available);
      }
      if (filters?.is_online !== undefined) {
        query = query.eq('is_online', filters.is_online);
      }
      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.state) {
        query = query.eq('state', filters.state);
      }
      if (filters?.kyc_status) {
        query = query.eq('kyc_status', filters.kyc_status);
      }
      if (filters?.vehicle_type) {
        query = query.eq('vehicle_type', filters.vehicle_type);
      }
      if (filters?.min_rating) {
        query = query.gte('rating', filters.min_rating);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as (DeliveryBoy & {
        users: { email: string; phone: string; is_active: boolean };
      })[];
    },
  });
}

/**
 * Get a single delivery boy by their user_id
 */
export function useDeliveryBoy(userId: string) {
  return useQuery({
    queryKey: deliveryQueryKeys.detail(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('*, users(email, phone, is_active)')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as DeliveryBoy & {
        users: { email: string; phone: string; is_active: boolean };
      };
    },
    enabled: !!userId,
  });
}

/**
 * Alias — get delivery boy by auth user ID
 */
export function useDeliveryBoyByUser(userId: string) {
  return useQuery({
    queryKey: deliveryQueryKeys.byUser(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('*, users(email, phone, is_active)')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as DeliveryBoy & {
        users: { email: string; phone: string; is_active: boolean };
      };
    },
    enabled: !!userId,
  });
}

/**
 * Get delivery boy bank details
 */
export function useDeliveryBoyBankDetails(userId: string) {
  return useQuery({
    queryKey: deliveryQueryKeys.bankDetails(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_boy_bank_details')
        .select('*')
        .eq('delivery_boy_id', userId)
        .single();

      if (error) throw error;
      return data as DeliveryBoyBankDetails;
    },
    enabled: !!userId,
  });
}

/**
 * Get delivery boy vehicle details
 */
export function useDeliveryBoyVehicle(userId: string) {
  return useQuery({
    queryKey: deliveryQueryKeys.vehicle(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_vehicles')
        .select('*')
        .eq('delivery_boy_id', userId)
        .single();

      if (error) throw error;
      return data as DeliveryVehicle;
    },
    enabled: !!userId,
  });
}

/**
 * Get delivery boy earnings
 */
export function useDeliveryBoyEarnings(userId: string) {
  return useQuery({
    queryKey: deliveryQueryKeys.earnings(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_earnings')
        .select('*, orders(order_number, created_at, total_amount)')
        .eq('delivery_boy_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as (DeliveryEarning & {
        orders: { order_number: string; created_at: string; total_amount: number } | null;
      })[];
    },
    enabled: !!userId,
  });
}

/**
 * Get delivery boy wallet details
 */
export function useDeliveryBoyWallet(userId: string) {
  return useQuery({
    queryKey: deliveryQueryKeys.wallet(userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_wallet_details', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!userId,
  });
}

// ============================================================================
// DELIVERY BOY MUTATIONS
// ============================================================================

/**
 * Create a new delivery boy profile
 */
export function useCreateDeliveryBoy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deliveryBoy: DeliveryBoyInsert) => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .insert(deliveryBoy)
        .select('*, users(email, phone)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.all });
      queryClient.setQueryData(deliveryQueryKeys.byUser(data.user_id), data);
    },
  });
}

/**
 * Update delivery boy profile
 */
export function useUpdateDeliveryBoy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: DeliveryBoyUpdate;
    }) => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .update(updates)
        .eq('user_id', userId)
        .select('*, users(email, phone)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.byUser(data.user_id), data);
      queryClient.setQueryData(deliveryQueryKeys.detail(data.user_id), data);
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.all });
    },
  });
}

/**
 * Update delivery boy profile for current user (self-update)
 */
export function useUpdateDeliveryBoyProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: DeliveryBoyUpdate) => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .update(updates)
        .eq('user_id', userId)
        .select('*, users(email, phone)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.byUser(userId), data);
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.all });
    },
  });
}

/**
 * Delete a delivery boy
 */
export function useDeleteDeliveryBoy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('delivery_boys')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.all });
      queryClient.removeQueries({ queryKey: deliveryQueryKeys.detail(userId) });
      queryClient.removeQueries({ queryKey: deliveryQueryKeys.byUser(userId) });
    },
  });
}

/**
 * Toggle delivery boy online/offline status
 */
export function useToggleDeliveryBoyOnlineStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      isOnline,
    }: {
      userId: string;
      isOnline: boolean;
    }) => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .update({ is_online: isOnline })
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.byUser(data.user_id), data);
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.all });
    },
  });
}

/**
 * Toggle delivery boy availability
 */
export function useToggleDeliveryBoyAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      isAvailable,
    }: {
      userId: string;
      isAvailable: boolean;
    }) => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .update({ is_available: isAvailable })
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.byUser(data.user_id), data);
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.all });
    },
  });
}

/**
 * Update delivery boy's current GPS location
 */
export function useUpdateDeliveryBoyLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      latitude,
      longitude,
    }: {
      userId: string;
      latitude: number;
      longitude: number;
    }) => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .update({ current_latitude: latitude, current_longitude: longitude })
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.byUser(data.user_id), data);
    },
  });
}

/**
 * Update delivery boy KYC status (admin)
 */
export function useUpdateDeliveryBoyKycStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      status,
      rejectedReason,
    }: {
      userId: string;
      status: 'pending' | 'approved' | 'rejected';
      rejectedReason?: string;
    }) => {
      const updates: DeliveryBoyUpdate = {
        kyc_status: status,
        kyc_verified_at: status === 'approved' ? new Date().toISOString() : null,
        kyc_rejected_reason: status === 'rejected' ? (rejectedReason ?? null) : null,
        is_verified: status === 'approved',
      };

      const { data, error } = await supabase
        .from('delivery_boys')
        .update(updates)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.byUser(data.user_id), data);
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.all });
    },
  });
}

/**
 * Suspend a delivery boy
 */
export function useSuspendDeliveryBoy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      reason,
      suspendedUntil,
    }: {
      userId: string;
      reason: string;
      suspendedUntil?: string;
    }) => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .update({
          suspension_reason: reason,
          suspended_until: suspendedUntil ?? null,
        })
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.byUser(data.user_id), data);
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.all });
    },
  });
}

/**
 * Unsuspend a delivery boy
 */
export function useUnsuspendDeliveryBoy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .update({ suspension_reason: null, suspended_until: null })
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.byUser(data.user_id), data);
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.all });
    },
  });
}

// ============================================================================
// BANK DETAILS MUTATIONS
// ============================================================================

/**
 * Add or update delivery boy bank details
 */
export function useUpsertDeliveryBoyBankDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      bankDetails,
    }: {
      userId: string;
      bankDetails: DeliveryBoyBankDetailsInsert | DeliveryBoyBankDetailsUpdate;
    }) => {
      const { data, error } = await supabase
        .from('delivery_boy_bank_details')
        .upsert({ ...bankDetails, delivery_boy_id: userId } as DeliveryBoyBankDetailsInsert)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.bankDetails(data.delivery_boy_id), data);
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.detail(data.delivery_boy_id) });
    },
  });
}

/**
 * Verify delivery boy bank details (admin)
 */
export function useVerifyDeliveryBoyBankDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      verifiedBy,
    }: {
      userId: string;
      verifiedBy: string;
    }) => {
      const { data, error } = await supabase
        .from('delivery_boy_bank_details')
        .update({
          is_verified: true,
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: verifiedBy,
          rejection_reason: null,
        } satisfies Partial<DeliveryBoyBankDetailsUpdate>)
        .eq('delivery_boy_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.bankDetails(data.delivery_boy_id), data);
    },
  });
}

/**
 * Reject delivery boy bank details (admin)
 */
export function useRejectDeliveryBoyBankDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      rejectionReason,
      verifiedBy,
    }: {
      userId: string;
      rejectionReason: string;
      verifiedBy: string;
    }) => {
      const { data, error } = await supabase
        .from('delivery_boy_bank_details')
        .update({
          is_verified: false,
          status: 'rejected',
          rejection_reason: rejectionReason,
          verified_by: verifiedBy,
          verified_at: null,
        } satisfies Partial<DeliveryBoyBankDetailsUpdate>)
        .eq('delivery_boy_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.bankDetails(data.delivery_boy_id), data);
    },
  });
}

// ============================================================================
// VEHICLE MUTATIONS
// ============================================================================

/**
 * Add or update delivery boy vehicle
 */
export function useUpsertDeliveryVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      vehicle,
    }: {
      userId: string;
      vehicle: DeliveryVehicleInsert | DeliveryVehicleUpdate;
    }) => {
      const { data, error } = await supabase
        .from('delivery_vehicles')
        .upsert({ ...vehicle, delivery_boy_id: userId } as DeliveryVehicleInsert)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.vehicle(data.delivery_boy_id), data);
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.detail(data.delivery_boy_id) });
    },
  });
}

/**
 * Verify delivery vehicle (admin)
 */
export function useVerifyDeliveryVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      verifiedBy,
    }: {
      userId: string;
      verifiedBy: string;
    }) => {
      const { data, error } = await supabase
        .from('delivery_vehicles')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: verifiedBy,
          rejection_reason: null,
        } satisfies Partial<DeliveryVehicleUpdate>)
        .eq('delivery_boy_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.vehicle(data.delivery_boy_id), data);
    },
  });
}

/**
 * Reject delivery vehicle (admin)
 */
export function useRejectDeliveryVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      rejectionReason,
      verifiedBy,
    }: {
      userId: string;
      rejectionReason: string;
      verifiedBy: string;
    }) => {
      const { data, error } = await supabase
        .from('delivery_vehicles')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          verified_by: verifiedBy,
          verified_at: null,
        } satisfies Partial<DeliveryVehicleUpdate>)
        .eq('delivery_boy_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliveryQueryKeys.vehicle(data.delivery_boy_id), data);
    },
  });
}

// ============================================================================
// KYC DOCUMENT QUERIES
// ============================================================================

/**
 * Fetch all KYC documents for a delivery boy, with resolved storage URLs
 */
export function useDeliveryBoyKycDocuments(userId: string) {
  return useQuery({
    queryKey: deliveryQueryKeys.kyc.byUser(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', 'delivery_boy')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const documents = (data ?? []).map((doc) => {
        let resolvedUrl = doc.document_url;

        // Resolve storage path to full URL if needed
        if (doc.document_url && !doc.document_url.startsWith('http')) {
          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(doc.document_url);
          resolvedUrl = urlData.publicUrl;
        }

        // Fallback: build URL from standard id-based path
        if (!resolvedUrl && doc.id) {
          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(`${userId}/kycDocuments/${doc.id}.jpeg`);
          resolvedUrl = urlData.publicUrl;
        }

        return {
          ...doc,
          resolved_url: resolvedUrl,
        } as KycDocument & { resolved_url: string | null };
      });

      return documents;
    },
    enabled: !!userId,
  });
}

/**
 * Fetch raw KYC storage files for a delivery boy (bucket listing)
 */
export function useDeliveryKycStorageFiles(userId: string) {
  return useQuery({
    queryKey: deliveryQueryKeys.kyc.storageFiles(userId),
    queryFn: async () => {
      const files = await listDeliveryKycStorageFiles(userId);
      return files.map((file) => {
        const { data } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(`${userId}/kycDocuments/${file.name}`);
        return {
          ...file,
          publicUrl: data.publicUrl,
          storagePath: `${userId}/kycDocuments/${file.name}`,
        };
      });
    },
    enabled: !!userId,
  });
}

/**
 * Get a single KYC document by its DB id
 */
export function useDeliveryKycDocument(docId: string) {
  return useQuery({
    queryKey: deliveryQueryKeys.kyc.detail(docId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('id', docId)
        .single();

      if (error) throw error;
      return data as KycDocument;
    },
    enabled: !!docId,
  });
}

// ============================================================================
// KYC DOCUMENT MUTATIONS
// ============================================================================

/**
 * Upload a KYC document file and create its DB record
 */
export function useUploadDeliveryKycDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      documentType,
      documentName,
      documentNumber,
      file,
      isRequired,
    }: {
      userId: string;
      documentType: string;
      documentName: string;
      documentNumber?: string;
      file: File;
      isRequired?: boolean;
    }) => {
      // 1. Insert DB record first to get the id
      const { data: inserted, error: insertError } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: userId,
          user_type: 'delivery_boy',
          document_type: documentType,
          document_name: documentName,
          document_number: documentNumber ?? null,
          status: 'pending',
          is_required: isRequired ?? true,
          uploaded_date: new Date().toISOString(),
        } satisfies KycDocumentInsert)
        .select('*')
        .single();

      if (insertError) throw insertError;

      // 2. Upload file to storage using the doc id as filename
      const publicUrl = await uploadDeliveryKycDocument(userId, inserted.id, file);

      // 3. Update DB record with the storage URL
      const { data: updated, error: updateError } = await supabase
        .from('kyc_documents')
        .update({
          document_url: publicUrl,
          updated_at: new Date().toISOString(),
        } satisfies Partial<KycDocumentUpdate>)
        .eq('id', inserted.id)
        .select('*')
        .single();

      if (updateError) throw updateError;
      return updated as KycDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.kyc.byUser(data.user_id) });
    },
  });
}

/**
 * Approve a KYC document (admin)
 */
export function useApproveDeliveryKycDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      docId,
      verifiedBy,
    }: {
      docId: string;
      verifiedBy: string;
    }) => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .update({
          status: 'approved',
          verified_date: new Date().toISOString(),
          verified_by: verifiedBy,
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        } satisfies Partial<KycDocumentUpdate>)
        .eq('id', docId)
        .select('*')
        .single();

      if (error) throw error;
      return data as KycDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.kyc.byUser(data.user_id) });
      queryClient.setQueryData(deliveryQueryKeys.kyc.detail(data.id), data);
    },
  });
}

/**
 * Reject a KYC document with a reason (admin)
 */
export function useRejectDeliveryKycDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      docId,
      rejectionReason,
      verifiedBy,
    }: {
      docId: string;
      rejectionReason: string;
      verifiedBy: string;
    }) => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          verified_by: verifiedBy,
          verified_date: null,
          updated_at: new Date().toISOString(),
        } satisfies Partial<KycDocumentUpdate>)
        .eq('id', docId)
        .select('*')
        .single();

      if (error) throw error;
      return data as KycDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.kyc.byUser(data.user_id) });
      queryClient.setQueryData(deliveryQueryKeys.kyc.detail(data.id), data);
    },
  });
}

/**
 * Approve all pending KYC documents for a delivery boy at once (admin)
 */
export function useApproveAllDeliveryKycDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      verifiedBy,
    }: {
      userId: string;
      verifiedBy: string;
    }) => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .update({
          status: 'approved',
          verified_date: new Date().toISOString(),
          verified_by: verifiedBy,
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        } satisfies Partial<KycDocumentUpdate>)
        .eq('user_id', userId)
        .eq('user_type', 'delivery_boy')
        .in('status', ['pending', 'verified'])
        .select('*');

      if (error) throw error;
      return data as KycDocument[];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: deliveryQueryKeys.kyc.byUser(variables.userId),
      });
    },
  });
}
