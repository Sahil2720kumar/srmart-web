// hooks/cart/useCart.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '../query-keys';
import {
  Cart,
  CartInsert,
  CartUpdate,
  CartItemWithProduct,
  Wishlist,
  WishlistInsert,
} from '@/types/supabase';

// ============================================================================
// CART QUERIES
// ============================================================================
const supabase = createClient();
/**
 * Get cart items for customer with product details
 */
export function useCart(customerId: string) {
  return useQuery({
    queryKey: queryKeys.cart.byCustomer(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          *,
          product:products(
            *,
            vendor:vendors(store_name, store_image),
            category:categories(name),
            product_images(image_url, is_primary)
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CartItemWithProduct[];
    },
    enabled: !!customerId,
  });
}

/**
 * Get cart items count
 */
export function useCartCount(customerId: string) {
  return useQuery({
    queryKey: queryKeys.cart.count(customerId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('cart')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!customerId,
  });
}

// ============================================================================
// CART MUTATIONS
// ============================================================================

/**
 * Add item to cart
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: CartInsert) => {
      // Check if item already exists in cart
      const { data: existing } = await supabase
        .from('cart')
        .select('*')
        .eq('customer_id', item.customer_id)
        .eq('product_id', item.product_id)
        .single();

      if (existing) {
        // Update quantity if already exists
        const { data, error } = await supabase
          .from('cart')
          .update({ quantity: existing.quantity + (item.quantity || 1) })
          .eq('id', existing.id)
          .select('*')
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new item
        const { data, error } = await supabase
          .from('cart')
          .insert(item)
          .select('*')
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart.byCustomer(data.customer_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart.count(data.customer_id),
      });
    },
  });
}

/**
 * Update cart item quantity
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cartId,
      customerId,
      quantity,
    }: {
      cartId: string;
      customerId: string;
      quantity: number;
    }) => {
      const { data, error } = await supabase
        .from('cart')
        .update({ quantity })
        .eq('id', cartId)
        .select('*')
        .single();

      if (error) throw error;
      return { data, customerId };
    },
    onSuccess: ({ customerId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart.byCustomer(customerId),
      });
    },
  });
}

/**
 * Remove item from cart
 */
export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cartId,
      customerId,
    }: {
      cartId: string;
      customerId: string;
    }) => {
      const { error } = await supabase.from('cart').delete().eq('id', cartId);

      if (error) throw error;
      return customerId;
    },
    onSuccess: (customerId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart.byCustomer(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart.count(customerId),
      });
    },
  });
}

/**
 * Clear entire cart
 */
export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('customer_id', customerId);

      if (error) throw error;
      return customerId;
    },
    onSuccess: (customerId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart.byCustomer(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart.count(customerId),
      });
    },
  });
}

// ============================================================================
// WISHLIST QUERIES
// ============================================================================

/**
 * Get wishlist items for customer
 */
export function useWishlist(customerId: string) {
  return useQuery({
    queryKey: queryKeys.wishlist.byCustomer(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          product:products(
            *,
            vendor:vendors(store_name, rating),
            category:categories(name),
            product_images(image_url, is_primary)
          )
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
 * Get wishlist items count
 */
export function useWishlistCount(customerId: string) {
  return useQuery({
    queryKey: queryKeys.wishlist.count(customerId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('wishlist')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!customerId,
  });
}

/**
 * Check if product is in wishlist
 */
export function useIsInWishlist(customerId: string, productId: string) {
  return useQuery({
    queryKey: [...queryKeys.wishlist.byCustomer(customerId), 'check', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('customer_id', customerId)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
      return !!data;
    },
    enabled: !!customerId && !!productId,
  });
}

// ============================================================================
// WISHLIST MUTATIONS
// ============================================================================

/**
 * Add item to wishlist
 */
export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: WishlistInsert) => {
      const { data, error } = await supabase
        .from('wishlist')
        .insert(item)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.wishlist.byCustomer(data.customer_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.wishlist.count(data.customer_id),
      });
    },
  });
}

/**
 * Remove item from wishlist
 */
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      wishlistId,
      customerId,
    }: {
      wishlistId: string;
      customerId: string;
    }) => {
      const { error } = await supabase.from('wishlist').delete().eq('id', wishlistId);

      if (error) throw error;
      return customerId;
    },
    onSuccess: (customerId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.wishlist.byCustomer(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.wishlist.count(customerId),
      });
    },
  });
}

/**
 * Remove item from wishlist by product ID
 */
export function useRemoveFromWishlistByProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      customerId,
    }: {
      productId: string;
      customerId: string;
    }) => {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('customer_id', customerId)
        .eq('product_id', productId);

      if (error) throw error;
      return customerId;
    },
    onSuccess: (customerId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.wishlist.byCustomer(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.wishlist.count(customerId),
      });
    },
  });
}

/**
 * Toggle product in wishlist
 */
export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      productId,
    }: {
      customerId: string;
      productId: string;
    }) => {
      // Check if exists
      const { data: existing } = await supabase
        .from('wishlist')
        .select('id')
        .eq('customer_id', customerId)
        .eq('product_id', productId)
        .single();

      if (existing) {
        // Remove if exists
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { customerId, action: 'removed' as const };
      } else {
        // Add if doesn't exist
        const { error } = await supabase
          .from('wishlist')
          .insert({ customer_id: customerId, product_id: productId });

        if (error) throw error;
        return { customerId, action: 'added' as const };
      }
    },
    onSuccess: ({ customerId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.wishlist.byCustomer(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.wishlist.count(customerId),
      });
    },
  });
}

/**
 * Move item from wishlist to cart
 */
export function useMoveToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      wishlistId,
      customerId,
      productId,
      quantity = 1,
    }: {
      wishlistId: string;
      customerId: string;
      productId: string;
      quantity?: number;
    }) => {
      // Add to cart
      const { error: cartError } = await supabase.from('cart').insert({
        customer_id: customerId,
        product_id: productId,
        quantity,
      });

      if (cartError) throw cartError;

      // Remove from wishlist
      const { error: wishlistError } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId);

      if (wishlistError) throw wishlistError;

      return customerId;
    },
    onSuccess: (customerId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.wishlist.byCustomer(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.wishlist.count(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart.byCustomer(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.cart.count(customerId),
      });
    },
  });
}