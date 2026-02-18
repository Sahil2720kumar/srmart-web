// hooks/wallet/useDeliveryWallet.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Wallet, WalletTransaction, CashoutRequest,
} from '@/types/supabase';

const supabase = createClient();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeliveryWalletListItem {
  walletId: string;
  userId: string;
  partnerName: string;
  email: string;
  phone: string;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  totalWithdrawn: number;
  totalDeliveries: number;
  rating: number;
  bankStatus: 'Verified' | 'Pending' | 'Rejected' | 'Not Added';
  isOnline: boolean;
  lastUpdated: string | null;
}

export interface DeliveryWalletDetail {
  walletId: string;
  userId: string;
  partnerName: string;
  email: string;
  phone: string;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  totalWithdrawn: number;
  totalDeliveries: number;
  rating: number;
  isOnline: boolean;
  bankStatus: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch: string;
    verifiedDate: string | null;
    upiId: string | null;
  } | null;
  earningsTimeline: {
    today: number;
    week: number;
    month: number;
  };
}

export interface DeliveryWalletSummary {
  totalPartners: number;
  onlinePartners: number;
  verifiedBanks: number;
  avgRating: number;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const deliveryWalletKeys = {
  all: ['delivery-wallets'] as const,
  list: () => [...deliveryWalletKeys.all, 'list'] as const,
  summary: () => [...deliveryWalletKeys.all, 'summary'] as const,
  detail: (userId: string) => [...deliveryWalletKeys.all, 'detail', userId] as const,
  transactions: (userId: string) => [...deliveryWalletKeys.all, 'transactions', userId] as const,
  cashouts: (userId: string) => [...deliveryWalletKeys.all, 'cashouts', userId] as const,
};

// ─── List Query ───────────────────────────────────────────────────────────────

export function useAdminDeliveryWallets() {
  return useQuery({
    queryKey: deliveryWalletKeys.list(),
    queryFn: async (): Promise<DeliveryWalletListItem[]> => {
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select(`
          id, user_id, available_balance, pending_balance,
          lifetime_earnings, total_withdrawn, updated_at,
          users!wallets_user_id_fkey(email, phone)
        `)
        .eq('user_type', 'delivery_boy')
        .order('available_balance', { ascending: false });

      if (error) throw error;

      return Promise.all(
        (wallets ?? []).map(async (wallet) => {
          const [{ data: db }, { data: bank }] = await Promise.all([
            supabase
              .from('delivery_boys')
              .select('first_name, last_name, rating, total_deliveries, is_online')
              .eq('user_id', wallet.user_id)
              .maybeSingle(),
            supabase
              .from('delivery_boy_bank_details')
              .select('is_verified, status')
              .eq('delivery_boy_id', wallet.user_id)
              .maybeSingle(),
          ]);

          let bankStatus: DeliveryWalletListItem['bankStatus'] = 'Not Added';
          if (bank) {
            bankStatus = bank.is_verified
              ? 'Verified'
              : bank.status === 'pending'
              ? 'Pending'
              : 'Rejected';
          }

          const partnerName = db
            ? `${db.first_name} ${db.last_name}`
            : (wallet.users as any)?.email ?? 'Unknown';

          return {
            walletId: wallet.id,
            userId: wallet.user_id,
            partnerName,
            email: (wallet.users as any)?.email ?? '',
            phone: (wallet.users as any)?.phone ?? '',
            availableBalance: wallet.available_balance ?? 0,
            pendingBalance: wallet.pending_balance ?? 0,
            lifetimeEarnings: wallet.lifetime_earnings ?? 0,
            totalWithdrawn: wallet.total_withdrawn ?? 0,
            totalDeliveries: db?.total_deliveries ?? 0,
            rating: db?.rating ?? 0,
            bankStatus,
            isOnline: db?.is_online ?? false,
            lastUpdated: wallet.updated_at,
          } as DeliveryWalletListItem;
        })
      );
    },
  });
}

// ─── Summary Query ────────────────────────────────────────────────────────────

export function useAdminDeliveryWalletsSummary() {
  return useQuery({
    queryKey: deliveryWalletKeys.summary(),
    queryFn: async (): Promise<DeliveryWalletSummary> => {
      const [
        { count: totalPartners },
        { count: onlinePartners },
        { count: verifiedBanks },
        { data: ratings },
      ] = await Promise.all([
        supabase
          .from('wallets')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', 'delivery_boy'),
        supabase
          .from('delivery_boys')
          .select('*', { count: 'exact', head: true })
          .eq('is_online', true),
        supabase
          .from('delivery_boy_bank_details')
          .select('*', { count: 'exact', head: true })
          .eq('is_verified', true),
        supabase
          .from('delivery_boys')
          .select('rating')
          .not('rating', 'is', null),
      ]);

      const avgRating =
        ratings && ratings.length > 0
          ? ratings.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratings.length
          : 0;

      return {
        totalPartners: totalPartners ?? 0,
        onlinePartners: onlinePartners ?? 0,
        verifiedBanks: verifiedBanks ?? 0,
        avgRating: parseFloat(avgRating.toFixed(1)),
      };
    },
  });
}

// ─── Detail Query ─────────────────────────────────────────────────────────────

export function useAdminDeliveryWalletDetail(userId: string) {
  return useQuery({
    queryKey: deliveryWalletKeys.detail(userId),
    queryFn: async (): Promise<DeliveryWalletDetail> => {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

      const [walletRpc, dbRow, bankRow, userRow, monthEarnings] = await Promise.all([
        supabase.rpc('get_wallet_details', { p_user_id: userId }),
        supabase
          .from('delivery_boys')
          .select('first_name, last_name, rating, total_deliveries, is_online')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('delivery_boy_bank_details')
          .select('*')
          .eq('delivery_boy_id', userId)
          .maybeSingle(),
        supabase
          .from('users')
          .select('email, phone')
          .eq('auth_id', userId)
          .maybeSingle(),
        supabase
          .from('delivery_earnings')
          .select('total_earnings, earned_at, created_at')
          .eq('delivery_boy_id', userId)
          .eq('status', 'paid')
          .gte('created_at', monthStart.toISOString()),
      ]);

      if (walletRpc.error) throw walletRpc.error;
      const wd = walletRpc.data?.[0];
      if (!wd) throw new Error('Wallet not found');

      const earnings = monthEarnings.data ?? [];
      const ts = (e: { earned_at: string | null; created_at: string | null }) =>
        e.earned_at ?? e.created_at ?? '';
      const sum = (arr: typeof earnings) =>
        arr.reduce((a, e) => a + (e.total_earnings ?? 0), 0);

      const bank = bankRow.data;

      return {
        walletId: wd.wallet_id,
        userId,
        partnerName: dbRow.data
          ? `${dbRow.data.first_name} ${dbRow.data.last_name}`
          : userRow.data?.email ?? 'Unknown',
        email: userRow.data?.email ?? '',
        phone: userRow.data?.phone ?? '',
        availableBalance: wd.available_balance ?? 0,
        pendingBalance: wd.pending_balance ?? 0,
        lifetimeEarnings: wd.lifetime_earnings ?? 0,
        totalWithdrawn: wd.total_withdrawn ?? 0,
        totalDeliveries: dbRow.data?.total_deliveries ?? 0,
        rating: dbRow.data?.rating ?? 0,
        isOnline: dbRow.data?.is_online ?? false,
        bankStatus: bank?.is_verified
          ? 'Verified'
          : bank?.status === 'pending'
          ? 'Pending'
          : bank
          ? 'Rejected'
          : 'Not Added',
        bankDetails: bank
          ? {
              accountName: bank.account_holder_name,
              accountNumber: `****${bank.account_number.slice(-4)}`,
              ifscCode: bank.ifsc_code,
              bankName: bank.bank_name,
              branch: bank.branch ?? '',
              verifiedDate: bank.verified_at,
              upiId: bank.upi_id,
            }
          : null,
        earningsTimeline: {
          today: sum(earnings.filter((e) => ts(e) >= todayStart.toISOString())),
          week: sum(earnings.filter((e) => ts(e) >= weekStart.toISOString())),
          month: sum(earnings),
        },
      };
    },
    enabled: !!userId,
  });
}

// ─── Transactions Query ───────────────────────────────────────────────────────

export function useDeliveryWalletTransactions(userId: string) {
  return useQuery({
    queryKey: deliveryWalletKeys.transactions(userId),
    queryFn: async (): Promise<WalletTransaction[]> => {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .eq('user_type', 'delivery_boy')
        .maybeSingle();

      if (!wallet) return [];

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!userId,
  });
}

// ─── Cashout Requests Query ───────────────────────────────────────────────────

export function useDeliveryCashoutRequests(userId: string) {
  return useQuery({
    queryKey: deliveryWalletKeys.cashouts(userId),
    queryFn: async (): Promise<CashoutRequest[]> => {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .eq('user_type', 'delivery_boy')
        .maybeSingle();

      if (!wallet) return [];

      const { data, error } = await supabase
        .from('cashout_requests')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CashoutRequest[];
    },
    enabled: !!userId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useApproveDeliveryCashout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cashoutId,
      approvedBy,
    }: {
      cashoutId: string;
      approvedBy: string;
    }) => {
      const { data, error } = await supabase.rpc('approve_cashout', {
        p_cashout_id: cashoutId,
        p_approved_by: approvedBy,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryWalletKeys.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
    },
  });
}

export function useCompleteDeliveryCashout() {
  const queryClient = useQueryClient();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryWalletKeys.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
    },
  });
}

export function useRejectDeliveryCashout() {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryWalletKeys.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
    },
  });
}

export function useCancelDeliveryCashout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cashoutId: string) => {
      const { data, error } = await supabase.rpc('cancel_cashout', {
        p_cashout_id: cashoutId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryWalletKeys.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
    },
  });
}

// ─── Global Transactions Query ────────────────────────────────────────────────

export interface GlobalWalletTransaction {
  id: string;
  date: string;
  userId: string;
  userName: string;
  userType: 'Vendor' | 'Delivery';
  transactionType: 'Credit' | 'Debit';
  amount: number;
  orderId: string | null;
  balanceAfter: number;
  description: string;
}

export function useGlobalWalletTransactions(filters?: {
  userType?: 'Vendor' | 'Delivery';
  transactionType?: 'Credit' | 'Debit';
  dateFrom?: string;
}) {
  return useQuery({
    queryKey: ['global-wallet-transactions', filters],
    queryFn: async (): Promise<GlobalWalletTransaction[]> => {
      let query = supabase
        .from('wallet_transactions')
        .select(`
          id, amount, balance_after, transaction_type, description, order_id, created_at,
          wallet:wallets!wallet_transactions_wallet_id_fkey(
            user_id, user_type,
            users!wallets_user_id_fkey(email)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as any[];

      // Fetch display names for all unique user IDs
      const userIds = [...new Set(rows.map((r) => r.wallet?.user_id).filter(Boolean))];

      const [vendorNames, deliveryNames] = await Promise.all([
        userIds.length > 0
          ? supabase
              .from('vendors')
              .select('user_id, store_name')
              .in('user_id', userIds)
          : Promise.resolve({ data: [] }),
        userIds.length > 0
          ? supabase
              .from('delivery_boys')
              .select('user_id, first_name, last_name')
              .in('user_id', userIds)
          : Promise.resolve({ data: [] }),
      ]);

      const vendorMap = new Map(
        (vendorNames.data ?? []).map((v) => [v.user_id, v.store_name])
      );
      const deliveryMap = new Map(
        (deliveryNames.data ?? []).map((d) => [
          d.user_id,
          `${d.first_name} ${d.last_name}`,
        ])
      );

      const mapped: GlobalWalletTransaction[] = rows.map((row) => {
        const userId = row.wallet?.user_id ?? '';
        const userType = row.wallet?.user_type;
        const isDelivery = userType === 'delivery_boy';
        const displayType: 'Vendor' | 'Delivery' = isDelivery ? 'Delivery' : 'Vendor';
        const userName = isDelivery
          ? (deliveryMap.get(userId) ?? row.wallet?.users?.email ?? 'Unknown')
          : (vendorMap.get(userId) ?? row.wallet?.users?.email ?? 'Unknown');

        return {
          id: row.id,
          date: row.created_at,
          userId,
          userName,
          userType: displayType,
          transactionType:
            row.transaction_type === 'credit' ? 'Credit' : 'Debit',
          amount: row.amount ?? 0,
          orderId: row.order_id,
          balanceAfter: row.balance_after ?? 0,
          description: row.description ?? '',
        };
      });

      // Client-side filters
      return mapped.filter((t) => {
        if (filters?.userType && t.userType !== filters.userType) return false;
        if (filters?.transactionType && t.transactionType !== filters.transactionType)
          return false;
        return true;
      });
    },
  });
}