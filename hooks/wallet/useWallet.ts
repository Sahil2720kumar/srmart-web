// hooks/wallet/useWallet.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '../query-keys';
import {
  Wallet,
  WalletTransaction,
  CashoutRequest,
  WalletDetails,
  RequestCashoutArgs,
  ApproveCashoutArgs,
  CompleteCashoutArgs,
} from '@/types/supabase';

// ============================================================================
// QUERIES
// ============================================================================
const supabase = createClient();
/**
 * Get wallet for user
 */
export function useWallet(userId: string) {
  return useQuery({
    queryKey: queryKeys.wallets.byUser(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as Wallet;
    },
    enabled: !!userId,
  });
}

/**
 * Get wallet details using database function
 */
export function useWalletDetails(userId: string) {
  return useQuery({
    queryKey: queryKeys.wallets.details(userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_wallet_details', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data?.[0] as WalletDetails;
    },
    enabled: !!userId,
  });
}

/**
 * Get wallet transactions
 */
export function useWalletTransactions(walletId: string) {
  return useQuery({
    queryKey: queryKeys.wallets.transactions(walletId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!walletId,
  });
}

/**
 * Get cashout requests for wallet
 */
export function useCashoutRequests(walletId: string) {
  return useQuery({
    queryKey: queryKeys.cashoutRequests.byWallet(walletId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashout_requests')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CashoutRequest[];
    },
    enabled: !!walletId,
  });
}

/**
 * Get all cashout requests (admin)
 */
export function useAllCashoutRequests(filters?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.cashoutRequests.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('cashout_requests')
        .select(`
          *,
          wallet:wallets(
            user_id,
            user_type,
            users(email, phone)
          )
        `);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Get cashout request by ID
 */
export function useCashoutRequest(requestId: string) {
  return useQuery({
    queryKey: queryKeys.cashoutRequests.detail(requestId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashout_requests')
        .select(`
          *,
          wallet:wallets(
            user_id,
            user_type,
            users(email, phone)
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Request cashout using database function
 */
export function useRequestCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RequestCashoutArgs) => {
      const { data, error } = await supabase.rpc('request_cashout', {
        p_wallet_id: params.p_wallet_id,
        p_amount: params.p_amount,
      });

      if (error) throw error;
      return data as string; // Returns cashout request ID
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.wallets.byUser(variables.p_wallet_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.cashoutRequests.byWallet(variables.p_wallet_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.all });
    },
  });
}

/**
 * Approve cashout request (admin)
 */
export function useApproveCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ApproveCashoutArgs) => {
      const { data, error } = await supabase.rpc('approve_cashout', {
        p_cashout_id: params.p_cashout_id,
        p_approved_by: params.p_approved_by,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cashoutRequests.detail(variables.p_cashout_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.all });
    },
  });
}

/**
 * Complete cashout request (admin)
 */
export function useCompleteCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CompleteCashoutArgs) => {
      const { data, error } = await supabase.rpc('complete_cashout', {
        p_cashout_id: params.p_cashout_id,
        p_transaction_reference: params.p_transaction_reference,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cashoutRequests.detail(variables.p_cashout_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.all });
    },
  });
}

/**
 * Cancel cashout request
 */
export function useCancelCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cashoutId: string) => {
      const { data, error } = await supabase.rpc('cancel_cashout', {
        p_cashout_id: cashoutId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, cashoutId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cashoutRequests.detail(cashoutId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.all });
    },
  });
}

/**
 * Reject cashout request (admin)
 */
export function useRejectCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cashoutId,
      rejectionReason,
    }: {
      cashoutId: string;
      rejectionReason: string;
    }) => {
      const { data, error } = await supabase
        .from('cashout_requests')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', cashoutId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cashoutRequests.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.cashoutRequests.byWallet(data.wallet_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.all });
    },
  });
}