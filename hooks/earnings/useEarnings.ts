import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
  VendorPayout,
  DeliveryEarning,
  Wallet,
  WalletTransaction,
  CashoutRequest,
  DailyRevenue,
  VendorPerformance,
} from '@/types/supabase';

// ============================================================================
// QUERY KEYS
// ============================================================================
const supabase = createClient();

export const earningsQueryKeys = {
  all: ['earnings'] as const,

  overview: (dateRange?: string) =>
    [...earningsQueryKeys.all, 'overview', dateRange] as const,
  dailyRevenue: (from?: string, to?: string) =>
    [...earningsQueryKeys.all, 'daily-revenue', from, to] as const,
  revenueBreakdown: (from?: string, to?: string) =>
    [...earningsQueryKeys.all, 'revenue-breakdown', from, to] as const,

  orderEarnings: (filters?: OrderEarningsFilters) =>
    [...earningsQueryKeys.all, 'orders', filters] as const,
  orderVendors: () =>
    [...earningsQueryKeys.all, 'order-vendors'] as const,

  vendorEarningsList: () =>
    [...earningsQueryKeys.all, 'vendors', 'list'] as const,
  vendorEarnings: (vendorId: string) =>
    [...earningsQueryKeys.all, 'vendors', vendorId] as const,

  deliveryEarningsList: () =>
    [...earningsQueryKeys.all, 'delivery', 'list'] as const,
  deliveryEconomics: (dateRange?: string) =>
    [...earningsQueryKeys.all, 'delivery-economics', dateRange] as const,
  deliveryEarnings: (partnerId: string) =>
    [...earningsQueryKeys.all, 'delivery', partnerId] as const,

  reportPreview: (reportId: string, from: string, to: string) =>
    [...earningsQueryKeys.all, 'reports', 'preview', reportId, from, to] as const,

  wallet: (userId: string) =>
    [...earningsQueryKeys.all, 'wallet', userId] as const,
  walletTransactions: (walletId: string) =>
    [...earningsQueryKeys.all, 'wallet-transactions', walletId] as const,
  cashoutRequests: (status?: string) =>
    [...earningsQueryKeys.all, 'cashout', status] as const,
};

// ============================================================================
// FILTER / PARAM TYPES
// ============================================================================

export type OrderEarningsFilters = {
  vendorId?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

export type DateRangeFilter = {
  from: string;
  to: string;
};

export type ReportType =
  | 'daily-earnings'
  | 'vendor-commission'
  | 'delivery-payout'
  | 'tax-gst'
  | 'refund-cancellation'
  | 'monthly-summary';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

// ============================================================================
// PAGE 1: ADMIN EARNINGS OVERVIEW  (/admin/earnings)
// ============================================================================

export function useAdminEarningsOverview(dateRange?: DateRangeFilter) {
  return useQuery({
    queryKey: earningsQueryKeys.overview(
      dateRange ? `${dateRange.from}_${dateRange.to}` : 'all'
    ),
    queryFn: async () => {
      let ordersQuery = supabase
        .from('orders')
        .select(
          `total_amount, total_commission, vendor_payout,
           delivery_fee, delivery_fee_paid_by_customer,
           platform_net_revenue, coupon_discount, status`
        );

      if (dateRange?.from) ordersQuery = ordersQuery.gte('created_at', dateRange.from);
      if (dateRange?.to)   ordersQuery = ordersQuery.lte('created_at', dateRange.to);

      let couponQuery = supabase
        .from('coupon_usage')
        .select('id, discount_amount', { count: 'exact' });

      if (dateRange?.from) couponQuery = couponQuery.gte('used_at', dateRange.from);
      if (dateRange?.to)   couponQuery = couponQuery.lte('used_at', dateRange.to);

      const [
        { data: orders, error: ordersErr },
        { data: coupons, count: couponCount, error: couponErr },
      ] = await Promise.all([ordersQuery, couponQuery]);

      if (ordersErr) throw ordersErr;
      if (couponErr) throw couponErr;

      const delivered = (orders ?? []).filter((o) => o.status === 'delivered');
      const cancelled = (orders ?? []).filter((o) => o.status === 'cancelled');
      const refunded  = (orders ?? []).filter((o) => o.status === 'refunded');

      const sum = (arr: typeof delivered, key: keyof (typeof delivered)[0]) =>
        arr.reduce((acc, o) => acc + (Number(o[key]) || 0), 0);

      const totalDiscounts = (coupons ?? []).reduce(
        (acc, c) => acc + (c.discount_amount ?? 0),
        0
      );

      const platformCommission    = sum(delivered, 'total_commission');
      const deliveryFeesCollected = sum(delivered, 'delivery_fee_paid_by_customer');

      const netPlatformEarnings = sum(delivered, 'platform_net_revenue');

      return {
        grossOrderValue: sum(delivered, 'total_amount'),
        platformCommission,
        deliveryFeesCollected,
        netPlatformEarnings,
        totalOrders:     delivered.length,
        cancelledOrders: cancelled.length,
        refundedOrders:  refunded.length,
        couponsApplied:  couponCount ?? 0,
        totalDiscounts,
        netProfit:       netPlatformEarnings,
      };
    },
  });
}

// ============================================================================
// PAGE 1: CHARTS
// ============================================================================

export function useDailyEarningsTrend(from?: string, to?: string) {
  return useQuery({
    queryKey: earningsQueryKeys.dailyRevenue(from, to),
    queryFn: async () => {
      let query = supabase
        .from('v_daily_revenue')
        .select(
          'order_date, total_revenue, delivery_revenue, completed_orders, total_orders'
        )
        .order('order_date', { ascending: true });

      if (from) query = query.gte('order_date', from);
      if (to)   query = query.lte('order_date', to);

      const { data, error } = await query;
      if (error) throw error;

      return (data as DailyRevenue[]).map((d) => ({
        date:            d.order_date     ?? '',
        earnings:        d.total_revenue  ?? 0,
        deliveryRevenue: d.delivery_revenue ?? 0,
        completedOrders: d.completed_orders ?? 0,
        totalOrders:     d.total_orders   ?? 0,
      }));
    },
  });
}

export function useRevenueBreakdown(from?: string, to?: string) {
  return useQuery({
    queryKey: earningsQueryKeys.revenueBreakdown(from, to),
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('created_at, vendor_payout, total_commission, delivery_fee')
        .eq('status', 'delivered');

      if (from) query = query.gte('created_at', from);
      if (to)   query = query.lte('created_at', to);

      const { data, error } = await query;
      if (error) throw error;

      const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const map: Record<
        string,
        { label: string; vendorPayout: number; commission: number; deliveryFee: number }
      > = {};

      (data ?? []).forEach((o) => {
        const label = DAY_LABELS[new Date(o.created_at!).getDay()];
        if (!map[label]) map[label] = { label, vendorPayout: 0, commission: 0, deliveryFee: 0 };
        map[label].vendorPayout += o.vendor_payout    ?? 0;
        map[label].commission   += o.total_commission ?? 0;
        map[label].deliveryFee  += o.delivery_fee     ?? 0;
      });

      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
        (label) => map[label] ?? { label, vendorPayout: 0, commission: 0, deliveryFee: 0 }
      );
    },
  });
}

// ============================================================================
// PAGE 2: ORDER EARNINGS  (/admin/earnings/orders)
// ============================================================================

export function useOrderEarnings(filters?: OrderEarningsFilters) {
  return useQuery({
    queryKey: earningsQueryKeys.orderEarnings(filters),
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(
          `id, order_number, total_amount, total_commission, delivery_fee,
           platform_net_revenue, payment_method, payment_status, status, created_at,
           customers!inner(first_name, last_name),
           vendors!inner(store_name, user_id)`
        )
        .order('created_at', { ascending: false });

      if (filters?.vendorId)      query = query.eq('vendor_id', filters.vendorId);
      if (filters?.paymentMethod) query = query.eq('payment_method', filters.paymentMethod);
      if (filters?.paymentStatus) query = query.eq('payment_status', filters.paymentStatus);
      if (filters?.orderStatus)   query = query.eq('status', filters.orderStatus);
      if (filters?.dateFrom)      query = query.gte('created_at', filters.dateFrom);
      if (filters?.dateTo)        query = query.lte('created_at', filters.dateTo);
      if (filters?.search)        query = query.ilike('order_number', `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((o) => {
        const customer = o.customers as unknown as { first_name: string; last_name: string };
        const vendor   = o.vendors   as unknown as { store_name: string; user_id: string };
        return {
          orderId:          o.order_number,
          rawId:            o.id,
          customer:         `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim(),
          vendor:           vendor?.store_name ?? '',
          vendorId:         vendor?.user_id    ?? '',
          orderTotal:       o.total_amount          ?? 0,
          vendorCommission: o.total_commission       ?? 0,
          deliveryFee:      o.delivery_fee           ?? 0,
          platformFee:      o.platform_net_revenue   ?? 0,
          netEarning:       o.platform_net_revenue   ?? 0,
          paymentStatus:    o.payment_status         ?? 'Pending',
          orderStatus:      o.status,
          paymentMethod:    o.payment_method,
          date:             o.created_at?.split('T')[0] ?? '',
        };
      });
    },
  });
}

export function useOrderEarningsVendors() {
  return useQuery({
    queryKey: earningsQueryKeys.orderVendors(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('user_id, store_name')
        .eq('is_verified', true)
        .order('store_name');
      if (error) throw error;
      return (data ?? []).map((v) => ({ id: v.user_id, name: v.store_name }));
    },
  });
}

// ============================================================================
// PAGE 3: VENDOR EARNINGS  (/admin/earnings/vendors)
// ============================================================================
//
// ✅ Removed dependency on v_vendor_performance (was returning 403 Forbidden).
//    Now queries `orders` + `vendors` + `wallets` directly — same tables the
//    rest of the hooks use, so RLS policies already allow access.
//
//    Fields returned (aligned with the updated VendorEarningsPage component):
//      vendorId, vendorName, totalOrders, deliveredOrders, cancelledOrders,
//      totalItems, grossSales, commissionRate, commissionAmount,
//      vendorPayout, platformNetRevenue, totalDeliveryCollected, walletBalance
// ============================================================================

export function useVendorEarningsList() {
  return useQuery({
    queryKey: earningsQueryKeys.vendorEarningsList(),
    queryFn: async () => {
      // 1. All vendors (name + id)
      // 2. All orders with the numeric fields we need to aggregate
      // 3. Wallet balances per vendor
      const [
        { data: vendors,  error: vendorsErr  },
        { data: orders,   error: ordersErr   },
        { data: wallets,  error: walletsErr  },
        { data: items,    error: itemsErr    },
      ] = await Promise.all([
        supabase
          .from('vendors')
          .select('user_id, store_name')
          .order('store_name'),

        supabase
          .from('orders')
          .select(
            `vendor_id, status, item_count,
             subtotal, total_commission, vendor_payout,
             platform_net_revenue, delivery_fee_paid_by_customer`
          ),

        supabase
          .from('wallets')
          .select('user_id, available_balance, pending_balance')
          .eq('user_type', 'vendor'),

        supabase
          .from('order_items')
          .select('vendor_id, commission_rate'),
      ]);

      if (vendorsErr) throw vendorsErr;
      if (ordersErr)  throw ordersErr;
      if (walletsErr) throw walletsErr;
      if (itemsErr)   throw itemsErr;

      // ── aggregate orders per vendor ──────────────────────────────────────
      type OrderAgg = {
        totalOrders:            number;
        deliveredOrders:        number;
        cancelledOrders:        number;
        totalItems:             number;
        grossSales:             number;
        commissionAmount:       number;
        vendorPayout:           number;
        platformNetRevenue:     number;
        totalDeliveryCollected: number;
      };

      const orderMap: Record<string, OrderAgg> = {};

      (orders ?? []).forEach((o) => {
        const vid = o.vendor_id ?? '';
        if (!orderMap[vid]) {
          orderMap[vid] = {
            totalOrders:            0,
            deliveredOrders:        0,
            cancelledOrders:        0,
            totalItems:             0,
            grossSales:             0,
            commissionAmount:       0,
            vendorPayout:           0,
            platformNetRevenue:     0,
            totalDeliveryCollected: 0,
          };
        }
        const agg = orderMap[vid];
        agg.totalOrders            += 1;
        agg.totalItems             += o.item_count                      ?? 0;
        agg.grossSales             += Number(o.subtotal                 ?? 0);
        agg.commissionAmount       += Number(o.total_commission         ?? 0);
        agg.vendorPayout           += Number(o.vendor_payout            ?? 0);
        agg.platformNetRevenue     += Number(o.platform_net_revenue     ?? 0);
        agg.totalDeliveryCollected += Number(o.delivery_fee_paid_by_customer ?? 0);
        if (o.status === 'delivered') agg.deliveredOrders += 1;
        if (o.status === 'cancelled') agg.cancelledOrders += 1;
      });

      // ── average commission rate per vendor (from order_items) ────────────
      const rateMap: Record<string, number[]> = {};
      (items ?? []).forEach((item) => {
        const vid = item.vendor_id ?? '';
        if (item.commission_rate) {
          if (!rateMap[vid]) rateMap[vid] = [];
          rateMap[vid].push(item.commission_rate);
        }
      });

      // ── wallet balance per vendor ────────────────────────────────────────
      const walletMap: Record<string, number> = {};
      (wallets ?? []).forEach((w) => {
        walletMap[w.user_id] = Number(w.available_balance ?? 0);
      });

      // ── combine ──────────────────────────────────────────────────────────
      return (vendors ?? []).map((v) => {
        const vid  = v.user_id ?? '';
        const agg  = orderMap[vid] ?? {
          totalOrders: 0, deliveredOrders: 0, cancelledOrders: 0,
          totalItems: 0, grossSales: 0, commissionAmount: 0,
          vendorPayout: 0, platformNetRevenue: 0, totalDeliveryCollected: 0,
        };
        const rates    = rateMap[vid] ?? [];
        const avgRate  = rates.length > 0
          ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
          : 0;

        return {
          vendorId:               vid,
          vendorName:             v.store_name             ?? '',
          totalOrders:            agg.totalOrders,
          deliveredOrders:        agg.deliveredOrders,
          cancelledOrders:        agg.cancelledOrders,
          totalItems:             agg.totalItems,
          grossSales:             agg.grossSales,
          commissionRate:         avgRate,
          commissionAmount:       agg.commissionAmount,
          vendorPayout:           agg.vendorPayout,
          platformNetRevenue:     agg.platformNetRevenue,
          totalDeliveryCollected: agg.totalDeliveryCollected,
          walletBalance:          walletMap[vid] ?? 0,
        };
      });
    },
  });
}

export function useVendorEarningsDetail(vendorId: string) {
  return useQuery({
    queryKey: earningsQueryKeys.vendorEarnings(vendorId),
    queryFn: async () => {
      const [
        { data: payouts, error: payoutsErr },
        { data: wallet,  error: walletErr  },
      ] = await Promise.all([
        supabase
          .from('vendor_payouts')
          .select(`*, orders(order_number, total_amount, created_at, status)`)
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false }),
        supabase
          .from('wallets')
          .select('*')
          .eq('user_id', vendorId)
          .eq('user_type', 'vendor')
          .single(),
      ]);

      if (payoutsErr) throw payoutsErr;

      return {
        payouts: payouts as (VendorPayout & { orders: any })[],
        wallet:  wallet  as Wallet | null,
      };
    },
    enabled: !!vendorId,
  });
}

// ============================================================================
// PAGE 4: DELIVERY EARNINGS  (/admin/earnings/delivery)
// ============================================================================

export function useDeliveryEarningsList() {
  return useQuery({
    queryKey: earningsQueryKeys.deliveryEarningsList(),
    queryFn: async () => {
      // ✅ delivery_earnings table may be empty (no "paid" rows yet).
      //    Primary source of truth for delivery fees is the orders table:
      //      - delivery_fee_paid_by_customer → what the partner earned per order
      //      - vendor_payout is for vendors; delivery boys earn the delivery_fee
      //    delivery_earnings is used as a supplement for incentives/bonuses only.
      const [
        { data: partners, error: partnersErr },
        { data: orders,   error: ordersErr   },
        { data: earnings, error: earningsErr },
        { data: wallets,  error: walletsErr  },
      ] = await Promise.all([
        supabase
          .from('delivery_boys')
          .select('user_id, first_name, last_name, rating, total_deliveries')
          .order('total_deliveries', { ascending: false }),

        // Count delivered orders and sum delivery fees per delivery_boy_id
        supabase
          .from('orders')
          .select('delivery_boy_id, delivery_fee, delivery_fee_paid_by_customer, status')
          .not('delivery_boy_id', 'is', null),

        // Incentives & bonuses from delivery_earnings (any status — not just 'paid')
        supabase
          .from('delivery_earnings')
          .select('delivery_boy_id, base_fee, incentives, bonus, total_earnings'),

        supabase
          .from('wallets')
          .select('user_id, available_balance, pending_balance, lifetime_earnings, total_withdrawn')
          .eq('user_type', 'delivery_boy'),
      ]);

      if (partnersErr) throw partnersErr;
      if (ordersErr)   throw ordersErr;
      if (earningsErr) throw earningsErr;
      if (walletsErr)  throw walletsErr;

      // ── Aggregate delivery fees from orders ──────────────────────────────
      // Use delivery_fee (what the platform charges) as the fee earned per delivery.
      // For free-delivery orders, delivery_fee_paid_by_customer = 0 but the
      // partner still gets paid the delivery_fee by the platform.
      type OrderAgg = {
        totalDeliveries: number;
        deliveryFeesEarned: number;
      };
      const orderMap: Record<string, OrderAgg> = {};
      (orders ?? []).forEach((o) => {
        const id = o.delivery_boy_id!;
        if (!orderMap[id]) orderMap[id] = { totalDeliveries: 0, deliveryFeesEarned: 0 };
        if (o.status === 'delivered') {
          orderMap[id].totalDeliveries   += 1;
          // Partner earns the full delivery_fee regardless of who paid it
          orderMap[id].deliveryFeesEarned += Number(o.delivery_fee ?? 0);
        }
      });

      // ── Aggregate incentives/bonuses from delivery_earnings ──────────────
      const earningsMap: Record<string, { incentives: number; bonuses: number; net: number }> = {};
      (earnings ?? []).forEach((e) => {
        const id = e.delivery_boy_id;
        if (!earningsMap[id]) earningsMap[id] = { incentives: 0, bonuses: 0, net: 0 };
        earningsMap[id].incentives += Number(e.incentives     ?? 0);
        earningsMap[id].bonuses    += Number(e.bonus          ?? 0);
        earningsMap[id].net        += Number(e.total_earnings ?? 0);
      });

      // ── Wallet balances ───────────────────────────────────────────────────
      const walletMap: Record<string, { available: number; pending: number; lifetimeEarnings: number; totalWithdrawn: number }> = {};
      (wallets ?? []).forEach((w) => {
        walletMap[w.user_id] = {
          available:        Number(w.available_balance  ?? 0),
          pending:          Number(w.pending_balance    ?? 0),
          lifetimeEarnings: Number(w.lifetime_earnings  ?? 0),
          totalWithdrawn:   Number(w.total_withdrawn    ?? 0),
        };
      });

      return (partners ?? []).map((p) => {
        const oAgg   = orderMap[p.user_id]   ?? { totalDeliveries: 0, deliveryFeesEarned: 0 };
        const eAgg   = earningsMap[p.user_id] ?? { incentives: 0, bonuses: 0, net: 0 };
        const wallet = walletMap[p.user_id];

        const deliveryFeesEarned = oAgg.deliveryFeesEarned;
        const incentives         = eAgg.incentives;
        const bonuses            = eAgg.bonuses;
        // ✅ Always compute net from orders-based delivery fees + any incentives/bonuses.
        // Never use delivery_earnings.total_earnings directly — it may be stale,
        // partial, or reflect a different subset of orders than what's in orders table.
        const netPayout = deliveryFeesEarned + incentives + bonuses;

        return {
          partnerId:          p.user_id,
          partnerName:        `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
          totalDeliveries:    oAgg.totalDeliveries || (p.total_deliveries ?? 0),
          deliveryFeesEarned,
          lifetimeEarnings:   wallet?.lifetimeEarnings ?? deliveryFeesEarned,
          totalWithdrawn:     wallet?.totalWithdrawn   ?? 0,
          incentives,
          bonuses,
          netPayout,
          walletBalance:      wallet?.available ?? 0,
          pendingBalance:     wallet?.pending   ?? 0,
          walletStatus:       wallet != null ? 'Active' : 'Pending',
          rating:             p.rating ?? 0,
        };
      });
    },
  });
}

export function useDeliveryEconomics(dateRange?: DateRangeFilter) {
  return useQuery({
    queryKey: earningsQueryKeys.deliveryEconomics(
      dateRange ? `${dateRange.from}_${dateRange.to}` : 'all'
    ),
    queryFn: async () => {
      // ✅ Removed .eq('status', 'delivered') from the Supabase query.
      //    Some Supabase RLS policies block column-filtered queries from the
      //    client (CORS 403). We fetch all orders we have access to and
      //    filter delivered ones client-side instead.
      let ordersQuery = supabase
        .from('orders')
        .select('delivery_fee, delivery_fee_paid_by_customer, status');

      let earningsQuery = supabase
        .from('delivery_earnings')
        .select('base_fee, incentives, bonus, total_earnings')
        .eq('status', 'paid');

      if (dateRange?.from) {
        ordersQuery   = ordersQuery.gte('created_at', dateRange.from);
        earningsQuery = earningsQuery.gte('earned_at', dateRange.from);
      }
      if (dateRange?.to) {
        ordersQuery   = ordersQuery.lte('created_at', dateRange.to);
        earningsQuery = earningsQuery.lte('earned_at', dateRange.to);
      }

      const [
        { data: orders,   error: ordersErr   },
        { data: earnings, error: earningsErr },
      ] = await Promise.all([ordersQuery, earningsQuery]);

      if (ordersErr)   throw ordersErr;
      if (earningsErr) throw earningsErr;

      const deliveredOrders = (orders ?? []).filter((o) => o.status === 'delivered');

      // What customers actually paid for delivery
      const totalFeesCollected = deliveredOrders.reduce(
        (acc, o) => acc + Number(o.delivery_fee_paid_by_customer ?? 0), 0
      );

      // What the platform subsidised (free delivery orders)
      const platformCovered = deliveredOrders.reduce(
        (acc, o) => acc + Math.max(
          Number(o.delivery_fee ?? 0) - Number(o.delivery_fee_paid_by_customer ?? 0),
          0
        ), 0
      );

      // Total partner payouts = full delivery_fee on every delivered order
      // (partner gets paid regardless of whether customer paid or platform covered it)
      const totalPartnerPayouts = deliveredOrders.reduce(
        (acc, o) => acc + Number(o.delivery_fee ?? 0), 0
      );

      // Incentives & bonuses on top (from delivery_earnings if populated)
      const totalIncentivesAndBonuses = (earnings ?? []).reduce(
        (acc, e) => acc + Number(e.incentives ?? 0) + Number(e.bonus ?? 0), 0
      );

      // Net delivery impact = what the platform LOST on delivery
      // = fees it covered (not paid by customer) + incentives/bonuses paid out
      // Base partner fees are NOT a platform loss — they come from customer fees + platform subsidy
      const netDeliveryImpact = platformCovered + totalIncentivesAndBonuses;

      return {
        totalFeesCollected,
        totalPartnerPayouts,          // total delivery_fee paid to all partners
        totalIncentivesAndBonuses,
        platformCoveredCost: platformCovered,
        netDeliveryImpact,
        // Extra: how much platform earned/lost net of all delivery costs
        platformDeliveryNet: totalFeesCollected - totalPartnerPayouts - totalIncentivesAndBonuses,
      };
    },
  });
}

export function useDeliveryPartnerEarningsDetail(partnerId: string) {
  return useQuery({
    queryKey: earningsQueryKeys.deliveryEarnings(partnerId),
    queryFn: async () => {
      const [
        { data: earnings, error: earningsErr },
        { data: wallet,   error: walletErr   },
      ] = await Promise.all([
        supabase
          .from('delivery_earnings')
          .select(`*, orders(order_number, total_amount, created_at, status)`)
          .eq('delivery_boy_id', partnerId)
          .order('earned_at', { ascending: false }),
        supabase
          .from('wallets')
          .select('*')
          .eq('user_id', partnerId)
          .eq('user_type', 'delivery_boy')
          .single(),
      ]);

      if (earningsErr) throw earningsErr;

      return {
        earnings: earnings as (DeliveryEarning & { orders: any })[],
        wallet:   wallet   as Wallet | null,
      };
    },
    enabled: !!partnerId,
  });
}

// ============================================================================
// PAGE 5: FINANCIAL REPORTS  (/admin/earnings/reports)
// ============================================================================

export function useReportPreview(
  reportId: ReportType,
  dateRange: DateRangeFilter,
  enabled = true
) {
  return useQuery({
    queryKey: earningsQueryKeys.reportPreview(reportId, dateRange.from, dateRange.to),
    enabled: enabled && !!dateRange.from && !!dateRange.to,
    queryFn: async () => {
      switch (reportId) {
        case 'daily-earnings': {
          const { data, error } = await supabase
            .from('v_daily_revenue')
            .select('order_date, total_revenue, total_orders')
            .gte('order_date', dateRange.from)
            .lte('order_date', dateRange.to);
          if (error) throw error;
          return {
            rows:         data?.length ?? 0,
            totalRevenue: (data ?? []).reduce((a, d) => a + (d.total_revenue ?? 0), 0),
            totalOrders:  (data ?? []).reduce((a, d) => a + (d.total_orders  ?? 0), 0),
          };
        }
        case 'vendor-commission': {
          const { data, error } = await supabase
            .from('vendor_payouts')
            .select('commission, net_amount')
            .gte('created_at', dateRange.from)
            .lte('created_at', dateRange.to);
          if (error) throw error;
          return {
            rows:            data?.length ?? 0,
            totalCommission: (data ?? []).reduce((a, d) => a + (d.commission ?? 0), 0),
            totalPayout:     (data ?? []).reduce((a, d) => a + (d.net_amount ?? 0), 0),
          };
        }
        case 'delivery-payout': {
          const { data, error } = await supabase
            .from('delivery_earnings')
            .select('total_earnings')
            .gte('earned_at', dateRange.from)
            .lte('earned_at', dateRange.to);
          if (error) throw error;
          return {
            rows:          data?.length ?? 0,
            totalEarnings: (data ?? []).reduce((a, d) => a + (d.total_earnings ?? 0), 0),
          };
        }
        case 'refund-cancellation': {
          const { data, error } = await supabase
            .from('orders')
            .select('status, total_amount')
            .in('status', ['cancelled', 'refunded'])
            .gte('created_at', dateRange.from)
            .lte('created_at', dateRange.to);
          if (error) throw error;
          return {
            rows:       data?.length ?? 0,
            totalValue: (data ?? []).reduce((a, d) => a + (d.total_amount ?? 0), 0),
            cancelled:  (data ?? []).filter((d) => d.status === 'cancelled').length,
            refunded:   (data ?? []).filter((d) => d.status === 'refunded').length,
          };
        }
        case 'tax-gst': {
          const { data, error } = await supabase
            .from('orders')
            .select('tax, total_amount')
            .eq('status', 'delivered')
            .gte('created_at', dateRange.from)
            .lte('created_at', dateRange.to);
          if (error) throw error;
          return {
            rows:         data?.length ?? 0,
            totalTax:     (data ?? []).reduce((a, d) => a + (d.tax          ?? 0), 0),
            totalRevenue: (data ?? []).reduce((a, d) => a + (d.total_amount ?? 0), 0),
          };
        }
        case 'monthly-summary': {
          const { data, error } = await supabase
            .from('orders')
            .select('total_amount, total_commission, platform_net_revenue')
            .eq('status', 'delivered')
            .gte('created_at', dateRange.from)
            .lte('created_at', dateRange.to);
          if (error) throw error;
          return {
            rows:            data?.length ?? 0,
            totalRevenue:    (data ?? []).reduce((a, d) => a + (d.total_amount         ?? 0), 0),
            totalCommission: (data ?? []).reduce((a, d) => a + (d.total_commission     ?? 0), 0),
            netEarnings:     (data ?? []).reduce((a, d) => a + (d.platform_net_revenue ?? 0), 0),
          };
        }
      }
    },
  });
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: async ({
      reportId,
      dateRange,
      format,
    }: {
      reportId: ReportType;
      dateRange: DateRangeFilter;
      format: ExportFormat;
    }) => {
      let rows: Record<string, unknown>[] = [];

      switch (reportId) {
        case 'daily-earnings': {
          const { data, error } = await supabase
            .from('v_daily_revenue')
            .select('*')
            .gte('order_date', dateRange.from)
            .lte('order_date', dateRange.to)
            .order('order_date', { ascending: true });
          if (error) throw error;
          rows = data ?? [];
          break;
        }
        case 'vendor-commission': {
          const { data, error } = await supabase
            .from('vendor_payouts')
            .select(
              `id, amount, commission, commission_rate, net_amount,
               status, payout_date, created_at,
               vendors(store_name),
               orders(order_number, total_amount)`
            )
            .gte('created_at', dateRange.from)
            .lte('created_at', dateRange.to)
            .order('created_at', { ascending: false });
          if (error) throw error;
          rows = (data ?? []).map((r) => ({
            payout_id:         r.id,
            vendor:            (r.vendors as any)?.store_name   ?? '',
            order_number:      (r.orders  as any)?.order_number ?? '',
            order_amount:      r.amount,
            commission_rate:   r.commission_rate,
            commission_amount: r.commission,
            net_payout:        r.net_amount,
            status:            r.status,
            payout_date:       r.payout_date ?? r.created_at,
          }));
          break;
        }
        case 'delivery-payout': {
          const { data, error } = await supabase
            .from('delivery_earnings')
            .select(
              `id, base_fee, distance_fee, incentives, bonus,
               tip_amount, deductions, total_earnings, status, earned_at,
               delivery_boys(first_name, last_name),
               orders(order_number)`
            )
            .gte('earned_at', dateRange.from)
            .lte('earned_at', dateRange.to)
            .order('earned_at', { ascending: false });
          if (error) throw error;
          rows = (data ?? []).map((r) => ({
            earning_id:   r.id,
            partner:      `${(r.delivery_boys as any)?.first_name ?? ''} ${(r.delivery_boys as any)?.last_name ?? ''}`.trim(),
            order_number: (r.orders as any)?.order_number ?? '',
            base_fee:     r.base_fee,
            distance_fee: r.distance_fee ?? 0,
            incentives:   r.incentives   ?? 0,
            bonus:        r.bonus        ?? 0,
            tip:          r.tip_amount   ?? 0,
            deductions:   r.deductions   ?? 0,
            total:        r.total_earnings,
            status:       r.status,
            date:         r.earned_at,
          }));
          break;
        }
        case 'tax-gst': {
          const { data, error } = await supabase
            .from('orders')
            .select(
              `order_number, subtotal, tax, tax_percentage,
               total_amount, created_at, vendors(store_name)`
            )
            .eq('status', 'delivered')
            .gte('created_at', dateRange.from)
            .lte('created_at', dateRange.to)
            .order('created_at', { ascending: false });
          if (error) throw error;
          rows = (data ?? []).map((r) => ({
            order_number:   r.order_number,
            vendor:         (r.vendors as any)?.store_name ?? '',
            subtotal:       r.subtotal,
            tax_percentage: r.tax_percentage ?? 0,
            tax_amount:     r.tax            ?? 0,
            total_amount:   r.total_amount,
            date:           r.created_at,
          }));
          break;
        }
        case 'refund-cancellation': {
          const { data, error } = await supabase
            .from('orders')
            .select(
              `order_number, status, total_amount, cancellation_reason,
               cancelled_at, created_at,
               customers(first_name, last_name),
               vendors(store_name)`
            )
            .in('status', ['cancelled', 'refunded'])
            .gte('created_at', dateRange.from)
            .lte('created_at', dateRange.to)
            .order('created_at', { ascending: false });
          if (error) throw error;
          rows = (data ?? []).map((r) => ({
            order_number: r.order_number,
            status:       r.status,
            customer:     `${(r.customers as any)?.first_name ?? ''} ${(r.customers as any)?.last_name ?? ''}`.trim(),
            vendor:       (r.vendors as any)?.store_name ?? '',
            amount:       r.total_amount,
            reason:       r.cancellation_reason ?? '',
            cancelled_at: r.cancelled_at        ?? '',
            order_date:   r.created_at,
          }));
          break;
        }
        case 'monthly-summary': {
          const { data, error } = await supabase
            .from('v_daily_revenue')
            .select('*')
            .gte('order_date', dateRange.from)
            .lte('order_date', dateRange.to)
            .order('order_date', { ascending: true });
          if (error) throw error;
          rows = data ?? [];
          break;
        }
      }

      if (format === 'csv' && rows.length > 0) {
        const headers = Object.keys(rows[0]);
        const escape  = (val: unknown) => {
          const s = String(val ?? '');
          return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        };
        const csv = [
          headers.join(','),
          ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
        ].join('\n');
        return { format, csv, rows, filename: `${reportId}_${dateRange.from}_${dateRange.to}.csv` };
      }

      return {
        format,
        rows,
        filename: `${reportId}_${dateRange.from}_${dateRange.to}.${format}`,
      };
    },
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

export function useAutoReleaseVendorPayments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('auto_release_vendor_payments');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: earningsQueryKeys.all });
    },
  });
}

export function useVendorWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      vendorUserId,
      amount,
    }: {
      vendorUserId: string;
      amount: number;
    }) => {
      const { error } = await supabase.rpc('vendor_withdraw', {
        p_vendor_user_id: vendorUserId,
        p_amount: amount,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: earningsQueryKeys.wallet(variables.vendorUserId),
      });
      queryClient.invalidateQueries({ queryKey: earningsQueryKeys.vendorEarningsList() });
    },
  });
}