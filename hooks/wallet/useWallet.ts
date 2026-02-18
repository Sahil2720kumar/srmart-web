// hooks/wallet/useWallet.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '../query-keys';
import {
  Wallet, WalletTransaction, CashoutRequest, WalletDetails,
  RequestCashoutArgs, ApproveCashoutArgs, CompleteCashoutArgs,
} from '@/types/supabase';

const supabase = createClient();

// ─── Existing queries (unchanged) ─────────────────────────────────────────────

export function useWallet(userId: string) {
  return useQuery({
    queryKey: queryKeys.wallets.byUser(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets').select('*').eq('user_id', userId).single();
      if (error) throw error;
      return data as Wallet;
    },
    enabled: !!userId,
  });
}

export function useWalletDetails(userId: string) {
  return useQuery({
    queryKey: queryKeys.wallets.details(userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_wallet_details', { p_user_id: userId });
      if (error) throw error;
      return data?.[0] as WalletDetails;
    },
    enabled: !!userId,
  });
}

export function useWalletTransactions(walletId: string) {
  return useQuery({
    queryKey: queryKeys.wallets.transactions(walletId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions').select('*')
        .eq('wallet_id', walletId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!walletId,
  });
}

export function useCashoutRequests(walletId: string) {
  return useQuery({
    queryKey: queryKeys.cashoutRequests.byWallet(walletId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashout_requests').select('*')
        .eq('wallet_id', walletId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as CashoutRequest[];
    },
    enabled: !!walletId,
  });
}

export function useAllCashoutRequests(filters?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.cashoutRequests.list(filters),
    queryFn: async () => {
      let query = supabase.from('cashout_requests').select(`
        *, wallet:wallets(user_id, user_type, users(email, phone))
      `);
      if (filters?.status) query = query.eq('status', filters.status);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCashoutRequest(requestId: string) {
  return useQuery({
    queryKey: queryKeys.cashoutRequests.detail(requestId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashout_requests')
        .select(`*, wallet:wallets(user_id, user_type, users(email, phone))`)
        .eq('id', requestId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });
}

// ─── NEW: Admin wallet list ────────────────────────────────────────────────────

export interface AdminWalletListItem {
  walletId: string;
  userId: string;
  userType: 'vendor' | 'delivery_boy';
  userName: string;
  email: string;
  phone: string;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  totalWithdrawn: number;
  lastUpdated: string | null;
}

export function useAdminWallets(userTypeFilter?: 'vendor' | 'delivery_boy') {
  return useQuery({
    queryKey: ['admin', 'wallets', userTypeFilter ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('wallets')
        .select(`
          id, user_id, user_type,
          available_balance, pending_balance, lifetime_earnings, total_withdrawn, updated_at,
          users!wallets_user_id_fkey(email, phone)
        `)
        .order('available_balance', { ascending: false });

      if (userTypeFilter) {
        query = query.eq('user_type', userTypeFilter);
      } else {
        query = query.in('user_type', ['vendor', 'delivery_boy']);
      }

      const { data, error } = await query;
      if (error) throw error;

      const enriched = await Promise.all(
        (data ?? []).map(async (wallet) => {
          let userName = (wallet.users as any)?.email ?? 'Unknown';

          if (wallet.user_type === 'vendor') {
            const { data: v } = await supabase
              .from('vendors').select('store_name').eq('user_id', wallet.user_id).maybeSingle();
            if (v?.store_name) userName = v.store_name;
          } else {
            const { data: db } = await supabase
              .from('delivery_boys').select('first_name, last_name').eq('user_id', wallet.user_id).maybeSingle();
            if (db) userName = `${db.first_name} ${db.last_name}`;
          }

          return {
            walletId: wallet.id,
            userId: wallet.user_id,
            userType: wallet.user_type as 'vendor' | 'delivery_boy',
            userName,
            email: (wallet.users as any)?.email ?? '',
            phone: (wallet.users as any)?.phone ?? '',
            availableBalance: wallet.available_balance ?? 0,
            pendingBalance: wallet.pending_balance ?? 0,
            lifetimeEarnings: wallet.lifetime_earnings ?? 0,
            totalWithdrawn: wallet.total_withdrawn ?? 0,
            lastUpdated: wallet.updated_at,
          } as AdminWalletListItem;
        })
      );
      return enriched;
    },
  });
}

export function useAdminWalletKPIs() {
  return useQuery({
    queryKey: ['admin', 'wallets', 'kpis'],
    queryFn: async () => {
      const [{ data: wallets, error: we }, { count: pendingCashouts, error: ce }] =
        await Promise.all([
          supabase.from('wallets')
            .select('available_balance, pending_balance, lifetime_earnings, total_withdrawn')
            .in('user_type', ['vendor', 'delivery_boy']),
          supabase.from('cashout_requests')
            .select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);

      if (we) throw we;
      if (ce) throw ce;

      return (wallets ?? []).reduce(
        (acc, w) => ({
          totalAvailable: acc.totalAvailable + (w.available_balance ?? 0),
          totalPending: acc.totalPending + (w.pending_balance ?? 0),
          totalLifetime: acc.totalLifetime + (w.lifetime_earnings ?? 0),
          totalWithdrawn: acc.totalWithdrawn + (w.total_withdrawn ?? 0),
          pendingCashouts: pendingCashouts ?? 0,
        }),
        { totalAvailable: 0, totalPending: 0, totalLifetime: 0, totalWithdrawn: 0, pendingCashouts: 0 }
      );
    },
  });
}

// ─── NEW: Admin vendor wallet list ────────────────────────────────────────────

export interface VendorWalletListItem {
  walletId: string;
  vendorUserId: string;
  vendorName: string;
  email: string;
  phone: string;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  totalWithdrawn: number;
  bankStatus: 'Verified' | 'Pending' | 'Rejected' | 'Not Added';
  lastUpdated: string | null;
}

export function useAdminVendorWallets() {
  return useQuery({
    queryKey: ['admin', 'vendor-wallets'],
    queryFn: async () => {
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select(`
          id, user_id, available_balance, pending_balance,
          lifetime_earnings, total_withdrawn, updated_at,
          users!wallets_user_id_fkey(email, phone)
        `)
        .eq('user_type', 'vendor')
        .order('available_balance', { ascending: false });

      if (error) throw error;

      return Promise.all(
        (wallets ?? []).map(async (wallet) => {
          const [{ data: vendor }, { data: bank }] = await Promise.all([
            supabase.from('vendors').select('store_name').eq('user_id', wallet.user_id).maybeSingle(),
            supabase.from('vendor_bank_details').select('status, is_verified').eq('vendor_id', wallet.user_id).maybeSingle(),
          ]);

          let bankStatus: VendorWalletListItem['bankStatus'] = 'Not Added';
          if (bank) {
            bankStatus = bank.is_verified ? 'Verified' : bank.status === 'pending' ? 'Pending' : 'Rejected';
          }

          return {
            walletId: wallet.id,
            vendorUserId: wallet.user_id,
            vendorName: vendor?.store_name ?? (wallet.users as any)?.email ?? 'Unknown',
            email: (wallet.users as any)?.email ?? '',
            phone: (wallet.users as any)?.phone ?? '',
            availableBalance: wallet.available_balance ?? 0,
            pendingBalance: wallet.pending_balance ?? 0,
            lifetimeEarnings: wallet.lifetime_earnings ?? 0,
            totalWithdrawn: wallet.total_withdrawn ?? 0,
            bankStatus,
            lastUpdated: wallet.updated_at,
          } as VendorWalletListItem;
        })
      );
    },
  });
}

export function useAdminVendorWalletsSummary() {
  return useQuery({
    queryKey: ['admin', 'vendor-wallets', 'summary'],
    queryFn: async () => {
      const [{ count: total }, { count: verified }, { count: pending }, { count: highPending }] =
        await Promise.all([
          supabase.from('wallets').select('*', { count: 'exact', head: true }).eq('user_type', 'vendor'),
          supabase.from('vendor_bank_details').select('*', { count: 'exact', head: true }).eq('is_verified', true),
          supabase.from('vendor_bank_details').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('wallets').select('*', { count: 'exact', head: true }).eq('user_type', 'vendor').gt('pending_balance', 10000),
        ]);
      return {
        totalVendors: total ?? 0,
        verifiedBanks: verified ?? 0,
        pendingVerification: pending ?? 0,
        highPendingBalance: highPending ?? 0,
      };
    },
  });
}

// ─── NEW: Admin vendor wallet detail ──────────────────────────────────────────

export interface VendorWalletDetail {
  walletId: string;
  vendorUserId: string;
  vendorName: string;
  email: string;
  phone: string;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  totalWithdrawn: number;
  bankStatus: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch: string;
    verifiedDate: string | null;
  } | null;
  earningsTimeline: { today: number; week: number; month: number };
}

export function useAdminVendorWalletDetail(vendorUserId: string) {
  return useQuery({
    queryKey: ['admin', 'vendor-wallet-detail', vendorUserId],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
      const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

      const [walletRpc, vendorRow, bankRow, userRow, monthPayouts] = await Promise.all([
        supabase.rpc('get_wallet_details', { p_user_id: vendorUserId }),
        supabase.from('vendors').select('store_name').eq('user_id', vendorUserId).maybeSingle(),
        supabase.from('vendor_bank_details').select('*').eq('vendor_id', vendorUserId).maybeSingle(),
        supabase.from('users').select('email, phone').eq('auth_id', vendorUserId).maybeSingle(),
        supabase.from('vendor_payouts')
          .select('net_amount, payout_date, created_at')
          .eq('vendor_id', vendorUserId)
          .gte('created_at', monthStart.toISOString()),
      ]);

      if (walletRpc.error) throw walletRpc.error;
      const wd = walletRpc.data?.[0];
      if (!wd) throw new Error('Wallet not found');

      const payouts = monthPayouts.data ?? [];
      const ts = (p: { payout_date: string | null; created_at: string | null }) => p.payout_date ?? p.created_at ?? '';
      const sum = (arr: typeof payouts) => arr.reduce((a, p) => a + (p.net_amount ?? 0), 0);
      const bank = bankRow.data;

      return {
        walletId: wd.wallet_id,
        vendorUserId,
        vendorName: vendorRow.data?.store_name ?? userRow.data?.email ?? 'Unknown',
        email: userRow.data?.email ?? '',
        phone: userRow.data?.phone ?? '',
        availableBalance: wd.available_balance ?? 0,
        pendingBalance: wd.pending_balance ?? 0,
        lifetimeEarnings: wd.lifetime_earnings ?? 0,
        totalWithdrawn: wd.total_withdrawn ?? 0,
        bankStatus: bank?.is_verified ? 'Verified' : bank?.status === 'pending' ? 'Pending' : bank ? 'Rejected' : 'Not Added',
        bankDetails: bank ? {
          accountName: bank.account_holder_name,
          accountNumber: `****${bank.account_number.slice(-4)}`,
          ifscCode: bank.ifsc_code,
          bankName: bank.bank_name,
          branch: bank.branch ?? '',
          verifiedDate: bank.verified_at,
        } : null,
        earningsTimeline: {
          today: sum(payouts.filter((p) => ts(p) >= todayStart.toISOString())),
          week: sum(payouts.filter((p) => ts(p) >= weekStart.toISOString())),
          month: sum(payouts),
        },
      } as VendorWalletDetail;
    },
    enabled: !!vendorUserId,
  });
}

export function useVendorWalletTransactions(vendorUserId: string) {
  return useQuery({
    queryKey: ['vendor-wallet-transactions', vendorUserId],
    queryFn: async () => {
      const { data: wallet } = await supabase
        .from('wallets').select('id').eq('user_id', vendorUserId).eq('user_type', 'vendor').maybeSingle();
      if (!wallet) return [];
      const { data, error } = await supabase
        .from('wallet_transactions').select('*')
        .eq('wallet_id', wallet.id).order('created_at', { ascending: false }).limit(50);
        
      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!vendorUserId,
  });
}

export function useVendorCashoutRequests(vendorUserId: string) {
  return useQuery({
    queryKey: ['vendor-cashout-requests', vendorUserId],
    queryFn: async () => {
      const { data: wallet } = await supabase
        .from('wallets').select('id').eq('user_id', vendorUserId).eq('user_type', 'vendor').maybeSingle();
      if (!wallet) return [];
      const { data, error } = await supabase
        .from('cashout_requests').select('*')
        .eq('wallet_id', wallet.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data as CashoutRequest[];
    },
    enabled: !!vendorUserId,
  });
}

// ─── Mutations (existing + updated invalidations) ─────────────────────────────

export function useRequestCashout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: RequestCashoutArgs) => {
      const { data, error } = await supabase.rpc('request_cashout', {
        p_wallet_id: params.p_wallet_id, p_amount: params.p_amount,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.byUser(v.p_wallet_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.byWallet(v.p_wallet_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
    },
  });
}

export function useApproveCashout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: ApproveCashoutArgs) => {
      const { data, error } = await supabase.rpc('approve_cashout', {
        p_cashout_id: params.p_cashout_id, p_approved_by: params.p_approved_by,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.detail(v.p_cashout_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-cashout-requests'] });
    },
  });
}

export function useCompleteCashout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: CompleteCashoutArgs) => {
      const { data, error } = await supabase.rpc('complete_cashout', {
        p_cashout_id: params.p_cashout_id, p_transaction_reference: params.p_transaction_reference,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.detail(v.p_cashout_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-cashout-requests'] });
    },
  });
}

export function useCancelCashout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cashoutId: string) => {
      const { data, error } = await supabase.rpc('cancel_cashout', { p_cashout_id: cashoutId });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, cashoutId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.detail(cashoutId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-cashout-requests'] });
    },
  });
}


/**
 * Release vendor pending balance to available (admin manual release)
 */
export function useReleaseVendorPendingBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendorUserId: string) => {
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id, available_balance, pending_balance')
        .eq('user_id', vendorUserId)
        .eq('user_type', 'vendor')
        .single();

      if (walletError) throw walletError;
      if (!wallet) throw new Error('Wallet not found');
      if ((wallet.pending_balance ?? 0) <= 0) throw new Error('No pending balance to release');

      const pendingAmount = wallet.pending_balance ?? 0;
      const newAvailable = (wallet.available_balance ?? 0) + pendingAmount;

      const { error: updateError } = await supabase
        .from('wallets')
        .update({
          available_balance: newAvailable,
          pending_balance: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          transaction_type: 'credit',
          amount: pendingAmount,
          balance_after: newAvailable,
          description: 'Pending balance manually released by admin',
        });

      if (txError) throw txError;

      return { walletId: wallet.id, releasedAmount: pendingAmount };
    },
    onSuccess: (_, vendorUserId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendor-wallet-detail', vendorUserId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendor-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-wallet-transactions', vendorUserId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.byUser(vendorUserId) });
    },
  });
}

export function useRejectCashout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cashoutId, rejectionReason }: { cashoutId: string; rejectionReason: string }) => {
      const { data, error } = await supabase
        .from('cashout_requests')
        .update({ status: 'rejected', rejected_at: new Date().toISOString(), rejection_reason: rejectionReason })
        .eq('id', cashoutId).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.byWallet(data.wallet_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashoutRequests.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-cashout-requests'] });
    },
  });
}

// ─── Vendor wallet hook (vendor-facing) ───────────────────────────────────────
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

function startOfDay(d: Date): string { const x = new Date(d); x.setHours(0,0,0,0); return x.toISOString(); }
function startOfWeek(d: Date): string { const x = new Date(d); x.setDate(x.getDate()-x.getDay()); x.setHours(0,0,0,0); return x.toISOString(); }
function startOfMonth(d: Date): string { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x.toISOString(); }
function sumNet(rows: { net_amount: number | null }[]): number { return rows.reduce((acc, r) => acc + (r.net_amount ?? 0), 0); }

export function useVendorWallet(vendorUserId: string) {
  return useQuery<VendorWalletData | null>({
    queryKey: ['vendor_wallet', vendorUserId],
    queryFn: async () => {
      const now = new Date();
      let walletId = '', available_balance = 0, pending_balance = 0, lifetime_earnings = 0, total_withdrawn = 0;

      const { data: rpcData, error: rpcError } = await supabase.rpc('get_wallet_details', { p_user_id: vendorUserId });
      if (!rpcError && rpcData?.length > 0) {
        const row = rpcData[0];
        walletId = row.wallet_id ?? ''; available_balance = row.available_balance ?? 0;
        pending_balance = row.pending_balance ?? 0; lifetime_earnings = row.lifetime_earnings ?? 0;
        total_withdrawn = row.total_withdrawn ?? 0;
      } else {
        const { data: walletRow, error } = await supabase
          .from('wallets').select('id, available_balance, pending_balance, lifetime_earnings, total_withdrawn')
          .eq('user_id', vendorUserId).eq('user_type', 'vendor').maybeSingle();
        if (error) throw error;
        if (!walletRow) return null;
        walletId = walletRow.id; available_balance = walletRow.available_balance ?? 0;
        pending_balance = walletRow.pending_balance ?? 0; lifetime_earnings = walletRow.lifetime_earnings ?? 0;
        total_withdrawn = walletRow.total_withdrawn ?? 0;
      }

      const { data: payouts, error: pe } = await supabase
        .from('vendor_payouts').select('net_amount, payout_date, created_at')
        .eq('vendor_id', vendorUserId).gte('created_at', startOfMonth(now));
      if (pe) throw pe;

      const p = payouts ?? [];
      const ts = (x: { payout_date: string | null; created_at: string | null }) => x.payout_date ?? x.created_at ?? '';

      return {
        wallet_id: walletId, available_balance, pending_balance, lifetime_earnings, total_withdrawn,
        earnings_today: sumNet(p.filter((x) => ts(x) >= startOfDay(now))),
        earnings_this_week: sumNet(p.filter((x) => ts(x) >= startOfWeek(now))),
        earnings_this_month: sumNet(p),
      };
    },
    enabled: !!vendorUserId,
  });
}