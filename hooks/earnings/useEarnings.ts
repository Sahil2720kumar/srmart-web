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
const supabase=createClient()


export const earningsQueryKeys = {
  all: ['earnings'] as const,

  // Page 1: Admin Earnings Overview (/admin/earnings)
  overview: (dateRange?: string) =>
    [...earningsQueryKeys.all, 'overview', dateRange] as const,
  dailyRevenue: (from?: string, to?: string) =>
    [...earningsQueryKeys.all, 'daily-revenue', from, to] as const,
  revenueBreakdown: (from?: string, to?: string) =>
    [...earningsQueryKeys.all, 'revenue-breakdown', from, to] as const,

  // Page 2: Order Earnings (/admin/earnings/orders)
  orderEarnings: (filters?: OrderEarningsFilters) =>
    [...earningsQueryKeys.all, 'orders', filters] as const,
  orderVendors: () =>
    [...earningsQueryKeys.all, 'order-vendors'] as const,

  // Page 3: Vendor Earnings (/admin/earnings/vendors)
  vendorEarningsList: () =>
    [...earningsQueryKeys.all, 'vendors', 'list'] as const,
  vendorEarnings: (vendorId: string) =>
    [...earningsQueryKeys.all, 'vendors', vendorId] as const,

  // Page 4: Delivery Earnings (/admin/earnings/delivery)
  deliveryEarningsList: () =>
    [...earningsQueryKeys.all, 'delivery', 'list'] as const,
  deliveryEconomics: (dateRange?: string) =>
    [...earningsQueryKeys.all, 'delivery-economics', dateRange] as const,
  deliveryEarnings: (partnerId: string) =>
    [...earningsQueryKeys.all, 'delivery', partnerId] as const,

  // Page 5: Financial Reports (/admin/earnings/reports)
  reportPreview: (reportId: string, from: string, to: string) =>
    [...earningsQueryKeys.all, 'reports', 'preview', reportId, from, to] as const,

  // Shared
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

/**
 * Powers the 4 KPI cards (Gross Order Value, Platform Commission,
 * Delivery Fees Collected, Net Platform Earnings) and the Financial Summary
 * section at the bottom of the overview page.
 */
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
      if (dateRange?.to) ordersQuery = ordersQuery.lte('created_at', dateRange.to);

      let couponQuery = supabase
        .from('coupon_usage')
        .select('id, discount_amount', { count: 'exact' });

      if (dateRange?.from) couponQuery = couponQuery.gte('used_at', dateRange.from);
      if (dateRange?.to) couponQuery = couponQuery.lte('used_at', dateRange.to);

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

      const platformCommission      = sum(delivered, 'total_commission');
      const deliveryFeesCollected   = sum(delivered, 'delivery_fee_paid_by_customer');
      const netPlatformEarnings     = platformCommission + deliveryFeesCollected - totalDiscounts;

      return {
        // KPI cards
        grossOrderValue:       sum(delivered, 'total_amount'),
        platformCommission,
        deliveryFeesCollected,
        netPlatformEarnings,
        // Financial Summary + Earnings Calculation cards
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

/**
 * Powers the "Daily Earnings Trend" bar chart.
 * Reads from the v_daily_revenue view and returns
 * one data point per day within the range.
 */
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
        date:             d.order_date ?? '',
        earnings:         d.total_revenue ?? 0,
        deliveryRevenue:  d.delivery_revenue ?? 0,
        completedOrders:  d.completed_orders ?? 0,
        totalOrders:      d.total_orders ?? 0,
      }));
    },
  });
}

/**
 * Powers the "Revenue Breakdown" stacked bar chart.
 * Groups delivered orders by day-of-week and splits each bar into
 * vendor payout / commission / delivery fee segments.
 */
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
      const map: Record<string, { label: string; vendorPayout: number; commission: number; deliveryFee: number }> = {};

      (data ?? []).forEach((o) => {
        const label = DAY_LABELS[new Date(o.created_at!).getDay()];
        if (!map[label]) map[label] = { label, vendorPayout: 0, commission: 0, deliveryFee: 0 };
        map[label].vendorPayout += o.vendor_payout     ?? 0;
        map[label].commission   += o.total_commission  ?? 0;
        map[label].deliveryFee  += o.delivery_fee      ?? 0;
      });

      // Always return Mon–Sun order (matching mock data shape)
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
        (label) => map[label] ?? { label, vendorPayout: 0, commission: 0, deliveryFee: 0 }
      );
    },
  });
}

// ============================================================================
// PAGE 2: ORDER EARNINGS  (/admin/earnings/orders)
// ============================================================================

/**
 * Powers the main orders table including:
 * - Summary KPI cards (total orders, order value, commission, net earnings)
 * - Filterable / searchable table rows
 * - Totals footer row
 *
 * Supports filters: search (order# / customer), status, vendor, payment method,
 * payment status, and date range.
 */
export function useOrderEarnings(filters?: OrderEarningsFilters) {
  return useQuery({
    queryKey: earningsQueryKeys.orderEarnings(filters),
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(
          `
          id,
          order_number,
          total_amount,
          total_commission,
          delivery_fee,
          platform_net_revenue,
          payment_method,
          payment_status,
          status,
          created_at,
          customers!inner(first_name, last_name),
          vendors!inner(store_name, user_id)
          `
        )
        .order('created_at', { ascending: false });

      if (filters?.vendorId)       query = query.eq('vendor_id', filters.vendorId);
      if (filters?.paymentMethod)  query = query.eq('payment_method', filters.paymentMethod);
      if (filters?.paymentStatus)  query = query.eq('payment_status', filters.paymentStatus);
      if (filters?.orderStatus)    query = query.eq('status', filters.orderStatus);
      if (filters?.dateFrom)       query = query.gte('created_at', filters.dateFrom);
      if (filters?.dateTo)         query = query.lte('created_at', filters.dateTo);

      // Search by order number only (customer name search requires a view/rpc)
      if (filters?.search) {
        query = query.ilike('order_number', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((o) => {
        const customer = o.customers as unknown as { first_name: string; last_name: string };
        const vendor   = o.vendors   as unknown as { store_name: string; user_id: string };
        return {
          orderId:       o.order_number,
          rawId:         o.id,
          customer:      `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim(),
          vendor:        vendor?.store_name ?? '',
          vendorId:      vendor?.user_id    ?? '',
          orderTotal:    o.total_amount       ?? 0,
          vendorCommission: o.total_commission ?? 0,
          deliveryFee:   o.delivery_fee        ?? 0,
          platformFee:   o.platform_net_revenue ?? 0,
          netEarning:    o.platform_net_revenue ?? 0,
          paymentStatus: o.payment_status ?? 'Pending',
          orderStatus:   o.status,
          paymentMethod: o.payment_method,
          date:          o.created_at?.split('T')[0] ?? '',
        };
      });
    },
  });
}

/**
 * Fetches all verified vendor id/name pairs for the vendor filter dropdown
 * on the Order Earnings page.
 */
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

/**
 * Powers the 3 summary cards (Total Vendor Revenue, Platform Commission,
 * Pending Vendor Payouts), the vendor table rows, and the Commission
 * Breakdown progress bars at the bottom of the page.
 *
 * Joins v_vendor_performance with per-vendor commission aggregates from
 * order_items so every column in the table is populated.
 */
export function useVendorEarningsList() {
  return useQuery({
    queryKey: earningsQueryKeys.vendorEarningsList(),
    queryFn: async () => {
      const [
        { data: perf,  error: perfErr  },
        { data: items, error: itemsErr },
      ] = await Promise.all([
        supabase
          .from('v_vendor_performance')
          .select(
            'id, store_name, total_orders, total_revenue, available_balance, pending_balance'
          ),
        supabase
          .from('order_items')
          .select('vendor_id, commission_rate, commission_amount, total_price'),
      ]);

      if (perfErr)  throw perfErr;
      if (itemsErr) throw itemsErr;

      // Aggregate commission data per vendor
      const commMap: Record<
        string,
        { totalCommission: number; totalSales: number; rates: number[] }
      > = {};
      (items ?? []).forEach((item) => {
        const vid = item.vendor_id ?? '';
        if (!commMap[vid]) commMap[vid] = { totalCommission: 0, totalSales: 0, rates: [] };
        commMap[vid].totalCommission += item.commission_amount ?? 0;
        commMap[vid].totalSales      += item.total_price        ?? 0;
        if (item.commission_rate) commMap[vid].rates.push(item.commission_rate);
      });

      return (perf ?? []).map((v) => {
        const comm = commMap[v.id ?? ''] ?? { totalCommission: 0, totalSales: 0, rates: [] };
        const avgRate =
          comm.rates.length > 0
            ? Math.round(comm.rates.reduce((a, b) => a + b, 0) / comm.rates.length)
            : 0;
        return {
          vendorId:         v.id         ?? '',
          vendorName:       v.store_name ?? '',
          totalOrders:      v.total_orders ?? 0,
          grossSales:       comm.totalSales || (v.total_revenue ?? 0),
          commissionRate:   avgRate,
          commissionAmount: comm.totalCommission,
          vendorPayout:     (comm.totalSales || (v.total_revenue ?? 0)) - comm.totalCommission,
          walletBalance:    v.available_balance ?? 0,
        };
      });
    },
  });
}

/**
 * Fetches payout history + wallet for a single vendor.
 * Called when the admin clicks "View" or "Payouts" on the vendor earnings table.
 */
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
          .select(
            `*, orders(order_number, total_amount, created_at, status)`
          )
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

/**
 * Powers the delivery partner table (all rows) and the 3 summary cards:
 * Total Delivery Fees Collected, Delivery Payouts to Partners,
 * Platform-Covered Cost.
 *
 * Aggregates delivery_earnings per partner and joins with wallets.
 */
export function useDeliveryEarningsList() {
  return useQuery({
    queryKey: earningsQueryKeys.deliveryEarningsList(),
    queryFn: async () => {
      const [
        { data: partners,  error: partnersErr  },
        { data: earnings,  error: earningsErr  },
      ] = await Promise.all([
        supabase
          .from('delivery_boys')
          .select(
            `user_id, first_name, last_name, rating, total_deliveries,
             wallets(id, available_balance, pending_balance)`
          )
          .order('total_deliveries', { ascending: false }),
        supabase
          .from('delivery_earnings')
          .select('delivery_boy_id, base_fee, incentives, bonus, total_earnings')
          .eq('status', 'paid'),
      ]);

      if (partnersErr) throw partnersErr;
      if (earningsErr) throw earningsErr;

      // Aggregate per partner
      const earningsMap: Record<
        string,
        { fees: number; incentives: number; bonuses: number; net: number }
      > = {};
      (earnings ?? []).forEach((e) => {
        const id = e.delivery_boy_id;
        if (!earningsMap[id])
          earningsMap[id] = { fees: 0, incentives: 0, bonuses: 0, net: 0 };
        earningsMap[id].fees       += e.base_fee        ?? 0;
        earningsMap[id].incentives += e.incentives      ?? 0;
        earningsMap[id].bonuses    += e.bonus           ?? 0;
        earningsMap[id].net        += e.total_earnings  ?? 0;
      });

      return (partners ?? []).map((p) => {
        const wallet = Array.isArray(p.wallets) ? p.wallets[0] : (p.wallets as any);
        const agg    = earningsMap[p.user_id] ?? { fees: 0, incentives: 0, bonuses: 0, net: 0 };
        return {
          partnerId:          p.user_id,
          partnerName:        `${p.first_name} ${p.last_name}`.trim(),
          totalDeliveries:    p.total_deliveries  ?? 0,
          deliveryFeesEarned: agg.fees,
          incentives:         agg.incentives,
          bonuses:            agg.bonuses,
          netPayout:          agg.net,
          walletStatus:       wallet?.available_balance != null ? 'Active' : 'Pending',
          rating:             p.rating ?? 0,
        };
      });
    },
  });
}

/**
 * Powers the "Delivery Economics" breakdown card on the delivery earnings page.
 * Returns totals for: fees collected, partner payouts, incentives & bonuses,
 * platform-covered cost, and net delivery impact.
 */
export function useDeliveryEconomics(dateRange?: DateRangeFilter) {
  return useQuery({
    queryKey: earningsQueryKeys.deliveryEconomics(
      dateRange ? `${dateRange.from}_${dateRange.to}` : 'all'
    ),
    queryFn: async () => {
      let ordersQuery = supabase
        .from('orders')
        .select('delivery_fee, delivery_fee_paid_by_customer')
        .eq('status', 'delivered');

      let earningsQuery = supabase
        .from('delivery_earnings')
        .select('base_fee, incentives, bonus, total_earnings')
        .eq('status', 'paid');

      if (dateRange?.from) {
        ordersQuery  = ordersQuery .gte('created_at', dateRange.from);
        earningsQuery = earningsQuery.gte('earned_at', dateRange.from);
      }
      if (dateRange?.to) {
        ordersQuery  = ordersQuery .lte('created_at', dateRange.to);
        earningsQuery = earningsQuery.lte('earned_at', dateRange.to);
      }

      const [
        { data: orders,   error: ordersErr   },
        { data: earnings, error: earningsErr },
      ] = await Promise.all([ordersQuery, earningsQuery]);

      if (ordersErr)   throw ordersErr;
      if (earningsErr) throw earningsErr;

      const totalFeesCollected = (orders ?? []).reduce(
        (acc, o) => acc + (o.delivery_fee_paid_by_customer ?? 0), 0
      );
      const platformCovered = (orders ?? []).reduce(
        (acc, o) =>
          acc + ((o.delivery_fee ?? 0) - (o.delivery_fee_paid_by_customer ?? 0)),
        0
      );
      const totalPartnerPayouts = (earnings ?? []).reduce(
        (acc, e) => acc + (e.total_earnings ?? 0), 0
      );
      const totalIncentivesAndBonuses = (earnings ?? []).reduce(
        (acc, e) => acc + (e.incentives ?? 0) + (e.bonus ?? 0), 0
      );

      return {
        totalFeesCollected,
        totalPartnerPayouts,
        totalIncentivesAndBonuses,
        platformCoveredCost:  Math.max(platformCovered, 0),
        netDeliveryImpact:    totalIncentivesAndBonuses + Math.max(platformCovered, 0),
      };
    },
  });
}

/**
 * Fetches per-delivery breakdown for a single partner.
 * Called when the admin clicks "View" on the delivery earnings table.
 */
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

/**
 * Fetches a lightweight preview (row count + key totals) for the selected
 * report type and date range. Shown inside each report card before download.
 */
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
            rows: data?.length ?? 0,
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
            rows: data?.length ?? 0,
            totalCommission: (data ?? []).reduce((a, d) => a + (d.commission  ?? 0), 0),
            totalPayout:     (data ?? []).reduce((a, d) => a + (d.net_amount  ?? 0), 0),
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

/**
 * Mutation: fetches full report data for the selected report type + date range
 * and serialises it to CSV (or returns raw rows for xlsx/pdf handling).
 * Called when the user clicks "Download CSV", "Excel", or "PDF".
 */
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
            vendor:            (r.vendors as any)?.store_name ?? '',
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
            distance_fee: r.distance_fee   ?? 0,
            incentives:   r.incentives     ?? 0,
            bonus:        r.bonus          ?? 0,
            tip:          r.tip_amount     ?? 0,
            deductions:   r.deductions     ?? 0,
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
            order_number:    r.order_number,
            vendor:          (r.vendors as any)?.store_name ?? '',
            subtotal:        r.subtotal,
            tax_percentage:  r.tax_percentage ?? 0,
            tax_amount:      r.tax            ?? 0,
            total_amount:    r.total_amount,
            date:            r.created_at,
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
            order_number:  r.order_number,
            status:        r.status,
            customer:      `${(r.customers as any)?.first_name ?? ''} ${(r.customers as any)?.last_name ?? ''}`.trim(),
            vendor:        (r.vendors as any)?.store_name ?? '',
            amount:        r.total_amount,
            reason:        r.cancellation_reason ?? '',
            cancelled_at:  r.cancelled_at        ?? '',
            order_date:    r.created_at,
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

      // Serialize to CSV string when format is 'csv'
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

      // For xlsx / pdf the caller handles rendering; we return raw rows
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




/** Admin trigger: bulk auto-release all eligible vendor pending balances. */
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

/** Admin: initiate a vendor withdrawal to their registered bank account. */
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

