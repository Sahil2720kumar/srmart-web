// hooks/wallet/usePayouts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { CashoutRequest, Wallet } from '@/types/supabase';

const supabase = createClient();

// ─── Types ────────────────────────────────────────────────────────────────────

export type PayoutStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'transferred'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type PayoutUserType = 'vendor' | 'delivery';

export interface PayoutCashoutRequest {
  id: string;
  request_number: string;
  wallet_id: string;
  user_id: string;
  user_type: PayoutUserType;
  user_name: string;
  amount: number;
  status: PayoutStatus;
  bank_verified: boolean;
  transaction_reference?: string | null;
  admin_notes?: string | null;
  rejection_reason?: string | null;
  requested_at: string;
  approved_at?: string | null;
  transferred_at?: string | null;
  completed_at?: string | null;
  rejected_at?: string | null;
  cancelled_at?: string | null;
}

export interface PayoutWallet {
  id: string;
  user_id: string;
  user_type: PayoutUserType;
  user_name: string;
  pending_balance: number;
  available_balance: number;
  lifetime_earnings: number;
  total_withdrawn: number;
}

export interface PayoutMetrics {
  vendorPendingBalance: number;
  vendorAvailableBalance: number;
  deliveryAvailableBalance: number;
  pendingCount: number;
  pendingAmount: number;
  completedThisWeek: number;
  completedCountThisWeek: number;
  totalCompleted: number;
}

export interface PayoutDetail extends PayoutCashoutRequest {
  wallet: {
    available_balance: number;
    pending_balance: number;
    lifetime_earnings: number;
    total_withdrawn: number;
  };
  bank: {
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    branch: string | null;
    is_verified: boolean;
    upi_id: string | null;
    verified_at: string | null;
  } | null;
  recent_transactions: Array<{
    id: string;
    transaction_type: string;
    amount: number;
    balance_after: number;
    description: string;
    order_id: string | null;
    created_at: string | null;
  }>;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const payoutKeys = {
  all: ['payouts'] as const,
  list: (filters?: object) => [...payoutKeys.all, 'list', filters] as const,
  metrics: () => [...payoutKeys.all, 'metrics'] as const,
  detail: (id: string) => [...payoutKeys.all, 'detail', id] as const,
};

// ─── Helper: Enrich cashout rows with user names ──────────────────────────────

async function enrichCashoutRequests(rows: any[]): Promise<PayoutCashoutRequest[]> {
  if (!rows.length) return [];

  const walletIds = [...new Set(rows.map((r) => r.wallet_id))];
  const { data: wallets } = await supabase
    .from('wallets')
    .select('id, user_id, user_type')
    .in('id', walletIds);

  const walletMap = new Map((wallets ?? []).map((w) => [w.id, w]));

  const userIds = [...new Set((wallets ?? []).map((w) => w.user_id))];
  const vendorIds = (wallets ?? []).filter((w) => w.user_type === 'vendor').map((w) => w.user_id);
  const deliveryIds = (wallets ?? []).filter((w) => w.user_type === 'delivery_boy').map((w) => w.user_id);

  const [vendorRes, deliveryRes, bankVendorRes, bankDeliveryRes] = await Promise.all([
    vendorIds.length > 0
      ? supabase.from('vendors').select('user_id, store_name').in('user_id', vendorIds)
      : Promise.resolve({ data: [] }),
    deliveryIds.length > 0
      ? supabase.from('delivery_boys').select('user_id, first_name, last_name').in('user_id', deliveryIds)
      : Promise.resolve({ data: [] }),
    vendorIds.length > 0
      ? supabase.from('vendor_bank_details').select('vendor_id, is_verified').in('vendor_id', vendorIds)
      : Promise.resolve({ data: [] }),
    deliveryIds.length > 0
      ? supabase.from('delivery_boy_bank_details').select('delivery_boy_id, is_verified').in('delivery_boy_id', deliveryIds)
      : Promise.resolve({ data: [] }),
  ]);

  const vendorNames = new Map((vendorRes.data ?? []).map((v) => [v.user_id, v.store_name]));
  const deliveryNames = new Map(
    (deliveryRes.data ?? []).map((d) => [d.user_id, `${d.first_name} ${d.last_name}`])
  );
  const vendorBankVerified = new Map((bankVendorRes.data ?? []).map((b) => [b.vendor_id, b.is_verified]));
  const deliveryBankVerified = new Map(
    (bankDeliveryRes.data ?? []).map((b) => [b.delivery_boy_id, b.is_verified])
  );

  return rows.map((row) => {
    const wallet = walletMap.get(row.wallet_id);
    const userId = wallet?.user_id ?? '';
    const isDelivery = wallet?.user_type === 'delivery_boy';
    const userType: PayoutUserType = isDelivery ? 'delivery' : 'vendor';
    const userName = isDelivery
      ? (deliveryNames.get(userId) ?? 'Unknown')
      : (vendorNames.get(userId) ?? 'Unknown');
    const bankVerified = isDelivery
      ? (deliveryBankVerified.get(userId) ?? false)
      : (vendorBankVerified.get(userId) ?? false);

    return {
      id: row.id,
      request_number: row.request_number,
      wallet_id: row.wallet_id,
      user_id: userId,
      user_type: userType,
      user_name: userName,
      amount: row.amount,
      status: (row.status ?? 'pending') as PayoutStatus,
      bank_verified: bankVerified,
      transaction_reference: row.transaction_reference,
      admin_notes: row.admin_notes,
      rejection_reason: row.rejection_reason,
      requested_at: row.request_date ?? row.created_at ?? new Date().toISOString(),
      approved_at: row.approved_at,
      transferred_at: row.transferred_at,
      completed_at: row.completed_at,
      rejected_at: row.rejected_at,
      cancelled_at: null,
    };
  });
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePayoutRequests(filters?: {
  status?: PayoutStatus;
  userType?: PayoutUserType;
}) {
  return useQuery({
    queryKey: payoutKeys.list(filters),
    queryFn: async (): Promise<PayoutCashoutRequest[]> => {
      let query = supabase
        .from('cashout_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);

      const { data, error } = await query;
      if (error) throw error;

      const enriched = await enrichCashoutRequests(data ?? []);

      if (filters?.userType) {
        return enriched.filter((r) => r.user_type === filters.userType);
      }
      return enriched;
    },
  });
}

export function usePayoutMetrics() {
  return useQuery({
    queryKey: payoutKeys.metrics(),
    queryFn: async (): Promise<PayoutMetrics> => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [vendorWallets, deliveryWallets, pendingRequests, completedRequests] =
        await Promise.all([
          supabase
            .from('wallets')
            .select('available_balance, pending_balance')
            .eq('user_type', 'vendor'),
          supabase
            .from('wallets')
            .select('available_balance')
            .eq('user_type', 'delivery_boy'),
          supabase
            .from('cashout_requests')
            .select('amount, status')
            .in('status', ['pending', 'approved']),
          supabase
            .from('cashout_requests')
            .select('amount, completed_at, status')
            .eq('status', 'completed'),
        ]);

      const vendorPendingBalance = (vendorWallets.data ?? []).reduce(
        (s, w) => s + (w.pending_balance ?? 0), 0
      );
      const vendorAvailableBalance = (vendorWallets.data ?? []).reduce(
        (s, w) => s + (w.available_balance ?? 0), 0
      );
      const deliveryAvailableBalance = (deliveryWallets.data ?? []).reduce(
        (s, w) => s + (w.available_balance ?? 0), 0
      );

      const pending = pendingRequests.data ?? [];
      const pendingCount = pending.filter((r) => r.status === 'pending').length;
      const pendingAmount = pending.reduce((s, r) => s + (r.amount ?? 0), 0);

      const completed = completedRequests.data ?? [];
      const completedThisWeek = completed
        .filter((r) => r.completed_at && new Date(r.completed_at) > weekAgo)
        .reduce((s, r) => s + (r.amount ?? 0), 0);

      return {
        vendorPendingBalance,
        vendorAvailableBalance,
        deliveryAvailableBalance,
        pendingCount,
        pendingAmount,
        completedThisWeek,
        completedCountThisWeek: completed.filter(
          (r) => r.completed_at && new Date(r.completed_at) > weekAgo
        ).length,
        totalCompleted: completed.length,
      };
    },
  });
}

export function usePayoutDetail(cashoutId: string) {
  return useQuery({
    queryKey: payoutKeys.detail(cashoutId),
    queryFn: async (): Promise<PayoutDetail> => {
      const { data: row, error } = await supabase
        .from('cashout_requests')
        .select('*')
        .eq('id', cashoutId)
        .single();
      if (error) throw error;

      const enriched = await enrichCashoutRequests([row]);
      const base = enriched[0];

      // Get wallet
      const { data: walletRow } = await supabase
        .from('wallets')
        .select('available_balance, pending_balance, lifetime_earnings, total_withdrawn, user_id, user_type')
        .eq('id', row.wallet_id)
        .maybeSingle();

      const userId = walletRow?.user_id ?? '';
      const isDelivery = walletRow?.user_type === 'delivery_boy';

      // Get bank details
      const bankQuery = isDelivery
        ? supabase
            .from('delivery_boy_bank_details')
            .select('account_holder_name, account_number, ifsc_code, bank_name, branch, is_verified, upi_id, verified_at')
            .eq('delivery_boy_id', userId)
            .maybeSingle()
        : supabase
            .from('vendor_bank_details')
            .select('account_holder_name, account_number, ifsc_code, bank_name, branch, is_verified, upi_id, verified_at')
            .eq('vendor_id', userId)
            .maybeSingle();

      const { data: bankRow } = await bankQuery;

      // Get recent transactions
      const { data: txns } = await supabase
        .from('wallet_transactions')
        .select('id, transaction_type, amount, balance_after, description, order_id, created_at')
        .eq('wallet_id', row.wallet_id)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        ...base,
        wallet: {
          available_balance: walletRow?.available_balance ?? 0,
          pending_balance: walletRow?.pending_balance ?? 0,
          lifetime_earnings: walletRow?.lifetime_earnings ?? 0,
          total_withdrawn: walletRow?.total_withdrawn ?? 0,
        },
        bank: bankRow
          ? {
              account_holder_name: bankRow.account_holder_name,
              account_number: `****${bankRow.account_number.slice(-4)}`,
              ifsc_code: bankRow.ifsc_code,
              bank_name: bankRow.bank_name,
              branch: bankRow.branch ?? null,
              is_verified: bankRow.is_verified ?? false,
              upi_id: bankRow.upi_id ?? null,
              verified_at: bankRow.verified_at ?? null,
            }
          : null,
        recent_transactions: (txns ?? []),
      };
    },
    enabled: !!cashoutId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useApprovePayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cashoutId, approvedBy }: { cashoutId: string; approvedBy: string }) => {
      const { data, error } = await supabase.rpc('approve_cashout', {
        p_cashout_id: cashoutId,
        p_approved_by: approvedBy,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { cashoutId }) => {
      qc.invalidateQueries({ queryKey: payoutKeys.all });
      qc.invalidateQueries({ queryKey: payoutKeys.detail(cashoutId) });
    },
  });
}

export function useMarkProcessingPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cashoutId: string) => {
      const { data, error } = await supabase
        .from('cashout_requests')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', cashoutId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, cashoutId) => {
      qc.invalidateQueries({ queryKey: payoutKeys.all });
      qc.invalidateQueries({ queryKey: payoutKeys.detail(cashoutId) });
    },
  });
}

export function useMarkTransferredPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cashoutId,
      transactionReference,
    }: {
      cashoutId: string;
      transactionReference: string;
    }) => {
      const { data, error } = await supabase
        .from('cashout_requests')
        .update({
          status: 'transferred',
          transaction_reference: transactionReference,
          transferred_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', cashoutId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { cashoutId }) => {
      qc.invalidateQueries({ queryKey: payoutKeys.all });
      qc.invalidateQueries({ queryKey: payoutKeys.detail(cashoutId) });
    },
  });
}

export function useCompletePayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cashoutId,
      transactionReference,
    }: {
      cashoutId: string;
      transactionReference: string;
    }) => {
      const { data, error } = await supabase.rpc('complete_cashout', {
        p_cashout_id: cashoutId,
        p_transaction_reference: transactionReference,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { cashoutId }) => {
      qc.invalidateQueries({ queryKey: payoutKeys.all });
      qc.invalidateQueries({ queryKey: payoutKeys.detail(cashoutId) });
    },
  });
}

export function useRejectPayout() {
  const qc = useQueryClient();
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
          rejection_reason: rejectionReason,
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', cashoutId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { cashoutId }) => {
      qc.invalidateQueries({ queryKey: payoutKeys.all });
      qc.invalidateQueries({ queryKey: payoutKeys.detail(cashoutId) });
    },
  });
}

export function useCancelPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cashoutId: string) => {
      const { data, error } = await supabase.rpc('cancel_cashout', {
        p_cashout_id: cashoutId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, cashoutId) => {
      qc.invalidateQueries({ queryKey: payoutKeys.all });
      qc.invalidateQueries({ queryKey: payoutKeys.detail(cashoutId) });
    },
  });
}

export function useAddPayoutAdminNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cashoutId,
      notes,
    }: {
      cashoutId: string;
      notes: string;
    }) => {
      const { data, error } = await supabase
        .from('cashout_requests')
        .update({ admin_notes: notes, updated_at: new Date().toISOString() })
        .eq('id', cashoutId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { cashoutId }) => {
      qc.invalidateQueries({ queryKey: payoutKeys.detail(cashoutId) });
    },
  });
}