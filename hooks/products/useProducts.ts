// hooks/products/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '../query-keys';
import {
  Product,
  ProductInsert,
  ProductUpdate,
  ProductImage,
  ProductImageInsert,
  ProductFilters,
  ProductWithRelations,
  BestSellerProduct,
  TrendingProduct,
  LowStockProduct,
  UpdateProductStockArgs,
} from '@/types/supabase';

// ============================================================================
// QUERIES
// ============================================================================
const supabase = createClient();
/**
 * Get all products with filters
 */
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug),
          sub_category:sub_categories(id, name, slug),
          vendor:vendors(store_name, store_image, rating)
        `);

      // Apply filters
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters?.sub_category_id) {
        query = query.eq('sub_category_id', filters.sub_category_id);
      }
      if (filters?.vendor_id) {
        query = query.eq('vendor_id', filters.vendor_id);
      }
      if (filters?.is_available !== undefined) {
        query = query.eq('is_available', filters.is_available);
      }
      if (filters?.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured);
      }
      if (filters?.is_trending !== undefined) {
        query = query.eq('is_trending', filters.is_trending);
      }
      if (filters?.is_best_seller !== undefined) {
        query = query.eq('is_best_seller', filters.is_best_seller);
      }
      if (filters?.min_price !== undefined) {
        query = query.gte('price', filters.min_price);
      }
      if (filters?.max_price !== undefined) {
        query = query.lte('price', filters.max_price);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProductWithRelations[];
    },
  });
}

/**
 * Get product by ID
 */
export function useProduct(productId: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          sub_category:sub_categories(*),
          vendor:vendors(store_name, store_image, rating, address, city, state)
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as ProductWithRelations;
    },
    enabled: !!productId,
  });
}

/**
 * Get products by vendor
 */
export function useVendorProducts(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.products.byVendor(vendorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name),
          sub_category:sub_categories(name)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });
}

/**
 * Get products by category
 */
export function useCategoryProducts(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.products.byCategory(categoryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendors(store_name, rating),
          sub_category:sub_categories(name)
        `)
        .eq('category_id', categoryId)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!categoryId,
  });
}

/**
 * Get product images
 */
export function useProductImages(productId: string) {
  return useQuery({
    queryKey: queryKeys.products.images(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!productId,
  });
}

/**
 * Get trending products from view
 */
export function useTrendingProducts(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.products.trending(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_trending_products')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data as TrendingProduct[];
    },
  });
}

/**
 * Get best seller products from view
 */
export function useBestSellerProducts(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.products.bestSellers(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_best_seller_products')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data as BestSellerProduct[];
    },
  });
}

/**
 * Get low stock products from view
 */
export function useLowStockProducts(vendorId?: string) {
  return useQuery({
    queryKey: queryKeys.products.lowStock(),
    queryFn: async () => {
      let query = supabase.from('v_low_stock_products').select('*');

      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }

      const { data, error } = await query.order('stock_quantity', { ascending: true });

      if (error) throw error;
      return data as LowStockProduct[];
    },
  });
}

/**
 * Get featured products
 */
export function useFeaturedProducts(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.products.featured(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendors(store_name, rating),
          category:categories(name)
        `)
        .eq('is_featured', true)
        .eq('is_available', true)
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.byVendor(data.vendor_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.byCategory(data.category_id),
      });
    },
  });
}

/**
 * Update product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      updates,
    }: {
      productId: string;
      updates: ProductUpdate;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.products.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.byVendor(data.vendor_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.byCategory(data.category_id),
      });
    },
  });
}

/**
 * Delete product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(productId) });
    },
  });
}

/**
 * Update product stock using database function
 */
export function useUpdateProductStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateProductStockArgs) => {
      const { data, error } = await supabase.rpc('update_product_stock', {
        p_product_id: params.p_product_id,
        p_new_quantity: params.p_new_quantity,
        p_reason: params.p_reason,
        p_user_id: params.p_user_id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables.p_product_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stockMovements.byProduct(variables.p_product_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lowStock() });
    },
  });
}

/**
 * Add product image
 */
export function useAddProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: ProductImageInsert) => {
      const { data, error } = await supabase
        .from('product_images')
        .insert(image)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.images(data.product_id),
      });
    },
  });
}

/**
 * Delete product image
 */
export function useDeleteProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      imageId,
      productId,
    }: {
      imageId: string;
      productId: string;
    }) => {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.images(productId),
      });
    },
  });
}

/**
 * Set primary product image
 */
export function useSetPrimaryProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      imageId,
      productId,
    }: {
      imageId: string;
      productId: string;
    }) => {
      // Unset all primary images for this product
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);

      // Set new primary image
      const { data, error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.images(data.product_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(data.product_id),
      });
    },
  });
}

/**
 * Toggle product availability
 */
export function useToggleProductAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      isAvailable,
    }: {
      productId: string;
      isAvailable: boolean;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ is_available: isAvailable })
        .eq('id', productId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.products.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.byVendor(data.vendor_id),
      });
    },
  });
}