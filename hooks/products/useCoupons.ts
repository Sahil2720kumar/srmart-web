// hooks/useCoupons.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

const supabase = createClient();

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type Coupon       = Tables<'coupons'>;
export type CouponInsert = TablesInsert<'coupons'>;
export type CouponUpdate = TablesUpdate<'coupons'>;
export type CouponUsage  = Tables<'coupon_usage'>;

// All valid applicable_to values — subcategory added
export type ApplicableTo = 'all' | 'category' | 'subcategory' | 'vendor' | 'product';

export type CouponFilters = {
  is_active?:     boolean;
  discount_type?: 'flat' | 'percentage';
  applicable_to?: ApplicableTo;
  search?:        string;
};

// Normalized product shape returned by useCouponApplicableProducts
export interface CouponProduct {
  id:             string;
  name:           string;
  slug:           string;
  sku:            string;
  image:          string | null;
  price:          number;
  discount_price: number | null;
  stock_quantity: number | null;
  stock_status:   string | null;
  is_available:   boolean | null;
  category:       { id: string; name: string } | null;
  vendor:         { store_name: string } | null;
}

// ─────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────

export const couponKeys = {
  all:      ['coupons']                                              as const,
  lists:    ()                  => [...couponKeys.all, 'list']       as const,
  list:     (f?: CouponFilters) => [...couponKeys.lists(), f]        as const,
  detail:   (id: string)        => [...couponKeys.all, 'detail', id] as const,
  byCode:   (code: string)      => [...couponKeys.all, 'code', code] as const,
  usage:    (id: string)        => [...couponKeys.all, 'usage', id]  as const,
  stats:    (id: string)        => [...couponKeys.all, 'stats', id]  as const,
  products: (id: string)        => [...couponKeys.all, 'products', id] as const,
  validate: (code: string, subtotal: number, customerId: string) =>
    [...couponKeys.all, 'validate', code, subtotal, customerId]      as const,
};

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/** All coupons with optional server-side filters */
export function useCoupons(filters?: CouponFilters) {
  return useQuery({
    queryKey: couponKeys.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.is_active     !== undefined) query = query.eq('is_active',     filters.is_active);
      if (filters?.discount_type)               query = query.eq('discount_type', filters.discount_type);
      if (filters?.applicable_to)               query = query.eq('applicable_to', filters.applicable_to);
      if (filters?.search)
        query = query.or(`code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data as Coupon[];
    },
  });
}

/** Single coupon by ID */
export function useCoupon(id: string) {
  return useQuery({
    queryKey: couponKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Coupon;
    },
    enabled: !!id,
  });
}

/** Look up a coupon by its code string */
export function useCouponByCode(code: string) {
  return useQuery({
    queryKey: couponKeys.byCode(code),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();
      if (error) throw error;
      return data as Coupon;
    },
    enabled: !!code,
  });
}

/** Only coupons that are currently active (customer-facing) */
export function useActiveCoupons(applicable_to?: string) {
  const now = new Date().toISOString();
  return useQuery({
    queryKey: couponKeys.list({ is_active: true, applicable_to: applicable_to as ApplicableTo }),
    queryFn: async () => {
      let query = supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date',   now)
        .order('created_at', { ascending: false });

      if (applicable_to)
        query = query.or(`applicable_to.eq.all,applicable_to.eq.${applicable_to}`);

      const { data, error } = await query;
      if (error) throw error;
      return data as Coupon[];
    },
  });
}

/**
 * Coupon stats — mirrors useOfferStats.
 * Branches on applicable_to including 'subcategory' (maps to sub_category_id on products).
 */
export function useCouponStats(couponId: string) {
  return useQuery({
    queryKey: couponKeys.stats(couponId),
    queryFn: async () => {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .single();
      if (couponError) throw couponError;

      // ── Count applicable products ────────────────────────────────────────
      let productsCount = 0;
      const aid = coupon.applicable_id;

      if (coupon.applicable_to === 'category' && aid) {
        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', aid)
          .eq('is_available', true);
        if (error) throw error;
        productsCount = count ?? 0;

      } else if (coupon.applicable_to === 'subcategory' && aid) {
        // sub_categories.id → products.sub_category_id
        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('sub_category_id', aid)
          .eq('is_available', true);
        if (error) throw error;
        productsCount = count ?? 0;

      } else if (coupon.applicable_to === 'vendor' && aid) {
        // vendors.user_id → products.vendor_id
        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', aid)
          .eq('is_available', true);
        if (error) throw error;
        productsCount = count ?? 0;

      } else if (coupon.applicable_to === 'product' && aid) {
        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('id', aid)
          .eq('is_available', true);
        if (error) throw error;
        productsCount = count ?? 0;

      } else {
        // 'all'
        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_available', true);
        if (error) throw error;
        productsCount = count ?? 0;
      }

      // ── Derive status ───────────────────────────────────────────────────
      const now       = new Date();
      const startDate = new Date(coupon.start_date);
      const endDate   = coupon.end_date ? new Date(coupon.end_date) : null;

      type CouponStatus = 'upcoming' | 'active' | 'expired' | 'inactive';
      let status: CouponStatus;

      if (!coupon.is_active)               status = 'inactive';
      else if (now < startDate)            status = 'upcoming';
      else if (endDate && now > endDate)   status = 'expired';
      else                                 status = 'active';

      return {
        products_count: productsCount,
        status,
        usage_count:    coupon.usage_count ?? 0,
        usage_limit:    coupon.usage_limit ?? null,
        days_remaining: endDate
          ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      };
    },
    enabled: !!couponId,
  });
}

/** Reusable product SELECT with category + vendor join */
const PRODUCT_SELECT = `
  id, name, slug, sku, image, price, discount_price,
  stock_quantity, stock_status, is_available,
  category:categories(id, name),
  vendor:vendors(store_name)
` as const;

/**
 * Products a coupon applies to — mirrors useOfferProducts.
 *  - 'all'         → all available (limit 100)
 *  - 'category'    → category_id match
 *  - 'subcategory' → sub_category_id match
 *  - 'vendor'      → vendor_id match (vendors.user_id)
 *  - 'product'     → single product by id
 */
export function useCouponApplicableProducts(couponId: string) {
  return useQuery({
    queryKey: couponKeys.products(couponId),
    queryFn: async (): Promise<CouponProduct[]> => {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('applicable_to, applicable_id')
        .eq('id', couponId)
        .single();
      if (couponError) throw couponError;

      const at  = coupon.applicable_to as ApplicableTo;
      const aid = coupon.applicable_id;

      let query = supabase.from('products').select(PRODUCT_SELECT);

      if (at === 'category' && aid) {
        query = query.eq('category_id', aid).eq('is_available', true);
      } else if (at === 'subcategory' && aid) {
        query = query.eq('sub_category_id', aid).eq('is_available', true);
      } else if (at === 'vendor' && aid) {
        query = query.eq('vendor_id', aid).eq('is_available', true);
      } else if (at === 'product' && aid) {
        query = query.eq('id', aid);
      } else {
        query = query.eq('is_available', true).limit(100);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as CouponProduct[];
    },
    enabled: !!couponId,
  });
}

/** Usage history joined with customer + order (admin view) */
export function useCouponUsage(couponId: string) {
  return useQuery({
    queryKey: couponKeys.usage(couponId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupon_usage')
        .select(`
          *,
          customers ( first_name, last_name, user_id ),
          orders    ( order_number, total_amount, status )
        `)
        .eq('coupon_id', couponId)
        .order('used_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!couponId,
  });
}

/** Discount amount via RPC */
export function useCouponDiscount(code: string, subtotal: number, customerId: string) {
  return useQuery({
    queryKey: couponKeys.validate(code, subtotal, customerId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_coupon_discount', {
        p_coupon_code: code,
        p_subtotal:    subtotal,
      });
      if (error) throw error;
      return data as number;
    },
    enabled: !!code && subtotal > 0 && !!customerId,
  });
}

/** Free-delivery eligibility via RPC */
export function useFreeDeliveryEligibility(customerId: string, subtotal: number, couponCode?: string) {
  return useQuery({
    queryKey: ['free-delivery', customerId, subtotal, couponCode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_free_delivery_eligibility', {
        p_customer_id: customerId,
        p_subtotal:    subtotal,
        p_coupon_code: couponCode,
      });
      if (error) throw error;
      return data?.[0] as { is_free_delivery: boolean; min_order_required: number; reason: string };
    },
    enabled: !!customerId && subtotal > 0,
  });
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CouponInsert) => {
      const { data, error } = await supabase
        .from('coupons')
        .insert({ ...payload, code: payload.code.toUpperCase().trim() })
        .select()
        .single();
      if (error) throw error;
      return data as Coupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: CouponUpdate & { id: string }) => {
      const normalized = payload.code
        ? { ...payload, code: payload.code.toUpperCase().trim() }
        : payload;
      const { data, error } = await supabase
        .from('coupons')
        .update(normalized)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Coupon;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
      queryClient.invalidateQueries({ queryKey: couponKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: couponKeys.stats(data.id) });
      queryClient.invalidateQueries({ queryKey: couponKeys.products(data.id) });
      if (data.code) queryClient.invalidateQueries({ queryKey: couponKeys.byCode(data.code) });
    },
  });
}

export function useToggleCouponStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('coupons')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Coupon;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
      queryClient.invalidateQueries({ queryKey: couponKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: couponKeys.stats(data.id) });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
      queryClient.removeQueries({ queryKey: couponKeys.detail(id) });
      queryClient.removeQueries({ queryKey: couponKeys.stats(id) });
      queryClient.removeQueries({ queryKey: couponKeys.products(id) });
    },
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      coupon_id:       string;
      customer_id:     string;
      order_id:        string;
      discount_amount: number;
    }) => {
      const { data, error } = await supabase
        .from('coupon_usage')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as CouponUsage;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: couponKeys.usage(data.coupon_id) });
      queryClient.invalidateQueries({ queryKey: couponKeys.detail(data.coupon_id) });
      queryClient.invalidateQueries({ queryKey: couponKeys.stats(data.coupon_id) });
    },
  });
}