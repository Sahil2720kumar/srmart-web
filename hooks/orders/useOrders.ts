// hooks/orders/useOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '../query-keys';
import {
  Order,
  OrderInsert,
  OrderUpdate,
  OrderItem,
  OrderTracking,
  OrderGroup,
  OrderFilters,
  OrderWithRelations,
  CreateOrderGroupWithOrdersArgs,
  VendorAcceptOrderArgs,
  VendorRejectOrderArgs,
  MarkOrderReadyArgs,
  CustomerCancelOrderArgs,
  AssignDeliveryPartnerArgs,
} from '@/types/supabase';

// ============================================================================
// QUERIES
// ============================================================================
const supabase = createClient();
/**
 * Get all orders with filters
 */
export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers(first_name, last_name, users(email, phone)),
          vendors(store_name, users(phone)),
          delivery_boys(first_name, last_name, users(phone))
        `);

      // Apply filters
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters?.vendor_id) {
        query = query.eq('vendor_id', filters.vendor_id);
      }
      if (filters?.delivery_boy_id) {
        query = query.eq('delivery_boy_id', filters.delivery_boy_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrderWithRelations[];
    },
  });
}

/**
 * Get order by ID with full details
 */
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers(*, users(email, phone)),
          vendors(*, users(email, phone)),
          delivery_boys(*, users(phone)),
          delivery_address:customer_addresses(*),
          coupon:coupons(code, discount_type, discount_value)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data as OrderWithRelations;
    },
    enabled: !!orderId,
  });
}

/**
 * Get orders by customer
 */
export function useCustomerOrders(customerId: string) {
  return useQuery({
    queryKey: queryKeys.orders.byCustomer(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          vendors(store_name, store_image),
          delivery_boys(first_name, last_name)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

/**
 * Get orders by vendor
 */
export function useVendorOrders(vendorId: string, status?: string) {
  return useQuery({
    queryKey: queryKeys.orders.byVendor(vendorId),
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers(first_name, last_name, users(phone)),
          delivery_boys(first_name, last_name, users(phone)),
          delivery_address:customer_addresses(*)
        `)
        .eq('vendor_id', vendorId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });
}

/**
 * Get orders by delivery boy
 */
export function useDeliveryBoyOrders(deliveryBoyId: string, status?: string) {
  return useQuery({
    queryKey: queryKeys.orders.byDeliveryBoy(deliveryBoyId),
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers(first_name, last_name, users(phone)),
          vendors(store_name, address, users(phone)),
          delivery_address:customer_addresses(*)
        `)
        .eq('delivery_boy_id', deliveryBoyId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!deliveryBoyId,
  });
}

/**
 * Get order items
 */
export function useOrderItems(orderId: string) {
  return useQuery({
    queryKey: queryKeys.orders.items(orderId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, products(name, image, sku)')
        .eq('order_id', orderId);

      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!orderId,
  });
}

/**
 * Get order tracking history
 */
export function useOrderTracking(orderId: string) {
  return useQuery({
    queryKey: queryKeys.orders.tracking(orderId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_tracking')
        .select('*, created_by_user:users(email)')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as OrderTracking[];
    },
    enabled: !!orderId,
  });
}

/**
 * Get order group with orders
 */
export function useOrderGroup(orderGroupId: string) {
  return useQuery({
    queryKey: queryKeys.orderGroups.detail(orderGroupId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_groups')
        .select(`
          *,
          orders(
            *,
            vendors(store_name, store_image),
            order_items(*, products(name, image))
          )
        `)
        .eq('id', orderGroupId)
        .single();

      if (error) throw error;
      return data as OrderGroup;
    },
    enabled: !!orderGroupId,
  });
}

/**
 * Get order summary from view
 */
export function useOrderSummary(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.orders.summary(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_order_summary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create order group with multiple orders
 */
export function useCreateOrderGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateOrderGroupWithOrdersArgs) => {
      const { data, error } = await supabase.rpc(
        'create_order_group_with_orders_simple',
        {
          p_customer_id: params.p_customer_id,
          p_orders: params.p_orders,
          p_payment_method: params.p_payment_method,
          p_subtotal: params.p_subtotal,
          p_tax: params.p_tax,
          p_discount: params.p_discount,
          p_delivery_fee: params.p_delivery_fee,
          p_coupon_code: params.p_coupon_code,
        }
      );

      if (error) throw error;
      return data as string; // Returns order group ID
    },
    onSuccess: (orderGroupId, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orderGroups.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byCustomer(variables.p_customer_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart.byCustomer(variables.p_customer_id),
      });
    },
  });
}

/**
 * Vendor accepts order
 */
export function useVendorAcceptOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: VendorAcceptOrderArgs) => {
      const { data, error } = await supabase.rpc('vendor_accept_order', {
        p_order_id: params.p_order_id,
        p_vendor_id: params.p_vendor_id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(variables.p_order_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byVendor(variables.p_vendor_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Vendor rejects order
 */
export function useVendorRejectOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: VendorRejectOrderArgs) => {
      const { data, error } = await supabase.rpc('vendor_reject_order', {
        p_order_id: params.p_order_id,
        p_vendor_id: params.p_vendor_id,
        p_rejection_reason: params.p_rejection_reason,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(variables.p_order_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byVendor(variables.p_vendor_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Mark order as ready for pickup
 */
export function useMarkOrderReady() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MarkOrderReadyArgs) => {
      const { data, error } = await supabase.rpc('mark_order_ready', {
        p_order_id: params.p_order_id,
        p_vendor_id: params.p_vendor_id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(variables.p_order_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byVendor(variables.p_vendor_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Assign delivery partner to order
 */
export function useAssignDeliveryPartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AssignDeliveryPartnerArgs) => {
      const { data, error } = await supabase.rpc('assign_delivery_partner', {
        p_order_id: params.p_order_id,
        p_delivery_boy_id: params.p_delivery_boy_id,
        p_vendor_id: params.p_vendor_id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(variables.p_order_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byVendor(variables.p_vendor_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byDeliveryBoy(variables.p_delivery_boy_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Customer cancels order
 */
export function useCustomerCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CustomerCancelOrderArgs) => {
      const { data, error } = await supabase.rpc('customer_cancel_order', {
        p_order_id: params.p_order_id,
        p_customer_id: params.p_customer_id,
        p_cancellation_reason: params.p_cancellation_reason,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(variables.p_order_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byCustomer(variables.p_customer_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Update order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      description,
    }: {
      orderId: string;
      status: string;
      description?: string;
    }) => {
      // Update order status
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select('*')
        .single();

      if (orderError) throw orderError;

      // Add tracking entry
      const { error: trackingError } = await supabase
        .from('order_tracking')
        .insert({
          order_id: orderId,
          status,
          description,
        });

      if (trackingError) throw trackingError;

      return orderData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(data.id) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.tracking(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byCustomer(data.customer_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byVendor(data.vendor_id),
      });
      if (data.delivery_boy_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.byDeliveryBoy(data.delivery_boy_id),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Complete order delivery
 */
export function useCompleteOrderDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      otp,
    }: {
      orderId: string;
      otp: string;
    }) => {
      // Verify OTP and complete delivery
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('delivery_otp')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;
      if (orderData.delivery_otp !== otp) {
        throw new Error('Invalid OTP');
      }

      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select('*')
        .single();

      if (error) throw error;

      // Add tracking entry
      await supabase.from('order_tracking').insert({
        order_id: orderId,
        status: 'delivered',
        description: 'Order delivered successfully',
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(data.id) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byCustomer(data.customer_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byVendor(data.vendor_id),
      });
      if (data.delivery_boy_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.byDeliveryBoy(data.delivery_boy_id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.deliveryBoys.earnings(data.delivery_boy_id),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}