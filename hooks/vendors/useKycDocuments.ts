// hooks/vendors/useKycDocuments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from '../query-keys';
import { KycDocument, KycDocumentInsert, KycDocumentUpdate } from '@/types/supabase';

const supabase = createClient();

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Get public URL for a KYC document from Supabase storage
 * Storage path format: vendors/{userId}/kycDocuments/{documentId}.jpeg
 */
export function getKycDocumentPublicUrl(userId: string, documentId: string, ext = 'jpeg'): string {
  const { data } = supabase.storage
    .from('vendors')
    .getPublicUrl(`${userId}/kycDocuments/${documentId}.${ext}`);
  return data.publicUrl;
}

/**
 * List all KYC document files for a vendor from storage
 * Returns file names/paths inside vendors/{userId}/kycDocuments/
 */
export async function listKycStorageFiles(userId: string) {
  const { data, error } = await supabase.storage
    .from('vendors')
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
export async function uploadKycDocument(
  userId: string,
  documentId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpeg';
  const storagePath = `${userId}/kycDocuments/${documentId}.${ext}`;

  const { error } = await supabase.storage
    .from('vendors')
    .upload(storagePath, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('vendors').getPublicUrl(storagePath);
  return data.publicUrl;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const kycQueryKeys = {
  all: ['kyc_documents'] as const,
  byUser: (userId: string) => ['kyc_documents', 'user', userId] as const,
  detail: (docId: string) => ['kyc_documents', 'detail', docId] as const,
  storageFiles: (userId: string) => ['kyc_storage_files', userId] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all KYC documents for a vendor by their auth user ID.
 * Also resolves public storage URLs for each document that has a document_url.
 */
export function useVendorKycDocuments(userId: string) {
  return useQuery({
    queryKey: kycQueryKeys.byUser(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Resolve public URLs from storage for each document
      const documents = (data ?? []).map((doc) => {
        let resolvedUrl = doc.document_url;

        // If document_url looks like a storage path (not a full URL), resolve it
        if (doc.document_url && !doc.document_url.startsWith('http')) {
          const { data: urlData } = supabase.storage
            .from('vendors')
            .getPublicUrl(doc.document_url);
          resolvedUrl = urlData.publicUrl;
        }

        // If we have an id-based storage file, build the URL
        if (!resolvedUrl && doc.id) {
          // Try standard path: vendors/{userId}/kycDocuments/{docId}.jpeg
          const { data: urlData } = supabase.storage
            .from('vendors')
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
 * Fetch KYC storage files for a vendor (raw file listing from bucket)
 * Useful for showing which files exist even if DB rows aren't created yet
 */
export function useKycStorageFiles(userId: string) {
  return useQuery({
    queryKey: kycQueryKeys.storageFiles(userId),
    queryFn: async () => {
      const files = await listKycStorageFiles(userId);
      return files.map((file) => {
        const { data } = supabase.storage
          .from('vendors')
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
export function useKycDocument(docId: string) {
  return useQuery({
    queryKey: kycQueryKeys.detail(docId),
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
// MUTATIONS
// ============================================================================

/**
 * Approve a KYC document
 */
export function useApproveKycDocument() {
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
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.byUser(data.user_id) });
      queryClient.setQueryData(kycQueryKeys.detail(data.id), data);
    },
  });
}

/**
 * Reject a KYC document with a reason
 */
export function useRejectKycDocument() {
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
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.byUser(data.user_id) });
      queryClient.setQueryData(kycQueryKeys.detail(data.id), data);
    },
  });
}

/**
 * Approve all pending KYC documents for a vendor at once
 */
export function useApproveAllKycDocuments() {
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
        .in('status', ['pending', 'verified'])
        .select('*');

      if (error) throw error;
      return data as KycDocument[];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.byUser(variables.userId) });
    },
  });
}

/**
 * Upload a KYC document file + create/update its DB record
 */
export function useUploadKycDocument() {
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
      // 1. Insert a DB record first to get the id
      const { data: inserted, error: insertError } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: userId,
          user_type: 'vendor',
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

      // 2. Upload to storage using the new doc id as filename
      const publicUrl = await uploadKycDocument(userId, inserted.id, file);

      // 3. Update the DB record with the storage URL
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
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.byUser(data.user_id) });
    },
  });
}