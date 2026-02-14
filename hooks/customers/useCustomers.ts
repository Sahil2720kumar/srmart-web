// hooks/customers/useCustomers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '../query-keys';
import {
  Customer,
  CustomerInsert,
  CustomerUpdate,
  CustomerAddress,
  CustomerAddressInsert,
  CustomerAddressUpdate,
} from '@/types/supabase';

// ============================================================================
// QUERIES
// ============================================================================
const supabase = createClient();
/**
 * Get all customers
 */
export function useCustomers(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.customers.list(filters),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, users(email, phone, is_active)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Customer & { users: { email: string; phone: string; is_active: boolean } })[];
    },
  });
}

/**
 * Get customer by ID
 */
export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, users(email, phone, is_active)')
        .eq('user_id', customerId)
        .single();

      if (error) throw error;
      return data as Customer & { users: { email: string; phone: string; is_active: boolean } };
    },
    enabled: !!customerId,
  });
}

/**
 * Get customer by user ID
 */
export function useCustomerByUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.customers.byUser(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, users(email, phone, is_active)')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as Customer & { users: { email: string; phone: string; is_active: boolean } };
    },
    enabled: !!userId,
  });
}

/**
 * Get customer addresses
 */
export function useCustomerAddresses(customerId: string) {
  return useQuery({
    queryKey: queryKeys.customers.addresses(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomerAddress[];
    },
    enabled: !!customerId,
  });
}

/**
 * Get customer default address
 */
export function useCustomerDefaultAddress(customerId: string) {
  return useQuery({
    queryKey: [...queryKeys.customers.addresses(customerId), 'default'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_default', true)
        .single();

      if (error) throw error;
      return data as CustomerAddress;
    },
    enabled: !!customerId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: CustomerInsert) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select('*, users(email, phone)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.setQueryData(queryKeys.customers.byUser(data.user_id), data);
    },
  });
}

/**
 * Update customer profile
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      updates,
    }: {
      customerId: string;
      updates: CustomerUpdate;
    }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('user_id', customerId)
        .select('*, users(email, phone)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.customers.byUser(data.user_id), data);
      queryClient.setQueryData(queryKeys.customers.detail(data.user_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

/**
 * Update customer profile for current user
 */
export function useUpdateCustomerProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: CustomerUpdate) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('user_id', userId)
        .select('*, users(email, phone)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.customers.byUser(userId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

/**
 * Delete customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('user_id', customerId);

      if (error) throw error;
    },
    onSuccess: (_, customerId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.removeQueries({ queryKey: queryKeys.customers.detail(customerId) });
      queryClient.removeQueries({ queryKey: queryKeys.customers.byUser(customerId) });
    },
  });
}

/**
 * Create customer address
 */
export function useCreateCustomerAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: CustomerAddressInsert) => {
      // If this is the default address, unset other defaults first
      if (address.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('customer_id', address.customer_id);
      }

      const { data, error } = await supabase
        .from('customer_addresses')
        .insert(address)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.addresses(data.customer_id),
      });
    },
  });
}

/**
 * Update customer address
 */
export function useUpdateCustomerAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      addressId,
      customerId,
      updates,
    }: {
      addressId: string;
      customerId: string;
      updates: CustomerAddressUpdate;
    }) => {
      // If setting as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('customer_id', customerId);
      }

      const { data, error } = await supabase
        .from('customer_addresses')
        .update(updates)
        .eq('id', addressId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.addresses(data.customer_id),
      });
    },
  });
}

/**
 * Delete customer address
 */
export function useDeleteCustomerAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      addressId,
      customerId,
    }: {
      addressId: string;
      customerId: string;
    }) => {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      return customerId;
    },
    onSuccess: (customerId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.addresses(customerId),
      });
    },
  });
}

/**
 * Set default customer address
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      addressId,
      customerId,
    }: {
      addressId: string;
      customerId: string;
    }) => {
      // Unset all defaults first
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId);

      // Set the new default
      const { data, error } = await supabase
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.addresses(data.customer_id),
      });
    },
  });
}