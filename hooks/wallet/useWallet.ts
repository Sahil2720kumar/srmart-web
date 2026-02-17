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


export interface VendorWalletData {
  wallet_id: string;
  available_balance: number;
  pending_balance: number;
  lifetime_earnings: number;
  total_withdrawn: number;
  earnings_today: number;
  earnings_this_week: number;
  earnings_this_month: number;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function startOfDay(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function startOfWeek(d: Date): string {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay()); // back to Sunday
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function startOfMonth(d: Date): string {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function sumNet(rows: { net_amount: number | null }[]): number {
  return rows.reduce((acc, r) => acc + (r.net_amount ?? 0), 0);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVendorWallet(vendorUserId: string) {
  return useQuery<VendorWalletData | null>({
    queryKey: ["vendor_wallet", vendorUserId],
    queryFn: async () => {
      const now = new Date();

      // ── 1. Wallet row (balances) ──────────────────────────────────────────
      let walletId          = "";
      let available_balance = 0;
      let pending_balance   = 0;
      let lifetime_earnings = 0;
      let total_withdrawn   = 0;

      // Try RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_wallet_details",
        { p_user_id: vendorUserId }
      );

      if (!rpcError && rpcData && rpcData.length > 0) {
        const row     = rpcData[0];
        walletId          = row.wallet_id         ?? "";
        available_balance = row.available_balance ?? 0;
        pending_balance   = row.pending_balance   ?? 0;
        lifetime_earnings = row.lifetime_earnings ?? 0;
        total_withdrawn   = row.total_withdrawn   ?? 0;
      } else {
        // Fallback: direct wallets table query
        const { data: walletRow, error: walletError } = await supabase
          .from("wallets")
          .select("id, available_balance, pending_balance, lifetime_earnings, total_withdrawn")
          .eq("user_id", vendorUserId)
          .eq("user_type", "vendor")
          .maybeSingle();

        if (walletError) throw walletError;
        if (!walletRow) return null;

        walletId          = walletRow.id;
        available_balance = walletRow.available_balance ?? 0;
        pending_balance   = walletRow.pending_balance   ?? 0;
        lifetime_earnings = walletRow.lifetime_earnings ?? 0;
        total_withdrawn   = walletRow.total_withdrawn   ?? 0;
      }

      // ── 2. Date-based earnings computed from vendor_payouts ───────────────
      // Fetch payouts from start of current month in one query, then bucket
      // client-side into today / this-week / this-month.
      const monthStart = startOfMonth(now);

      const { data: recentPayouts, error: payoutsError } = await supabase
        .from("vendor_payouts")
        .select("net_amount, payout_date, created_at")
        .eq("vendor_id", vendorUserId)
        .gte("created_at", monthStart);

      if (payoutsError) throw payoutsError;

      const payouts   = recentPayouts ?? [];
      const todayStart = startOfDay(now);
      const weekStart  = startOfWeek(now);

      // Best available timestamp for each row
      const ts = (p: { payout_date: string | null; created_at: string | null }) =>
        p.payout_date ?? p.created_at ?? "";

      const earnings_today       = sumNet(payouts.filter((p) => ts(p) >= todayStart));
      const earnings_this_week   = sumNet(payouts.filter((p) => ts(p) >= weekStart));
      const earnings_this_month  = sumNet(payouts); // all rows are already >= monthStart

      // ── 3. Return assembled result ────────────────────────────────────────
      return {
        wallet_id: walletId,
        available_balance,
        pending_balance,
        lifetime_earnings,
        total_withdrawn,
        earnings_today,
        earnings_this_week,
        earnings_this_month,
      } satisfies VendorWalletData;
    },
    enabled: !!vendorUserId,
  });
}