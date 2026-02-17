// hooks/products/useOffers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '../query-keys';
import {
  Offer,
  OfferInsert,
  OfferUpdate,
  OfferProduct,
  OfferProductInsert,
} from '@/types/supabase';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const supabase = createClient();

/**
 * Upload offer banner image to Supabase Storage
 */
async function uploadOfferBanner(
  offerId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `offers/${offerId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('offer-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data } = supabase.storage
    .from('offer-assets')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Delete offer banner image from Supabase Storage
 */
async function deleteOfferBanner(imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  // Extract file path from URL
  const urlParts = imageUrl.split('/offer-assets/');
  if (urlParts.length < 2) return;

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('offer-assets')
    .remove([filePath]);

  if (error) console.error('Error deleting banner:', error);
}

/**
 * Validate offer dates
 */
function validateOfferDates(startDate: string, endDate?: string | null): void {
  const start = new Date(startDate);
  const now = new Date();

  if (start < now) {
    throw new Error('Start date cannot be in the past');
  }

  if (endDate) {
    const end = new Date(endDate);
    if (end <= start) {
      throw new Error('End date must be after start date');
    }
  }
}

/**
 * Check if offer is currently active
 */
function isOfferActive(offer: Offer): boolean {
  if (!offer.is_active) return false;

  const now = new Date();
  const startDate = new Date(offer.start_date);
  
  if (now < startDate) return false;

  if (offer.end_date) {
    const endDate = new Date(offer.end_date);
    if (now > endDate) return false;
  }

  return true;
}

// ============================================================================
// OFFER QUERIES
// ============================================================================

/**
 * Get all offers
 */
export function useOffers(filters?: { 
  is_active?: boolean;
  offer_type?: string;
  applicable_to?: string;
}) {
  return useQuery({
    queryKey: queryKeys.offers.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('offers')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.offer_type) {
        query = query.eq('offer_type', filters.offer_type);
      }

      if (filters?.applicable_to) {
        query = query.eq('applicable_to', filters.applicable_to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Offer[];
    },
  });
}

/**
 * Get active offers only
 */
export function useActiveOffers() {
  return useQuery({
    queryKey: queryKeys.offers.active(),
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Offer[];
    },
  });
}

/**
 * Get offer by ID
 */
export function useOffer(offerId: string) {
  return useQuery({
    queryKey: queryKeys.offers.detail(offerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (error) throw error;
      return data as Offer;
    },
    enabled: !!offerId,
  });
}

/**
 * Get offer with related products
 */
export function useOfferWithProducts(offerId: string) {
  return useQuery({
    queryKey: queryKeys.offers.withProducts(offerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          offer_products:offer_products(
            id,
            product:products(
              id,
              name,
              slug,
              image,
              price,
              discount_price,
              stock_quantity,
              is_available
            )
          )
        `)
        .eq('id', offerId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!offerId,
  });
}

/**
 * Get offers by type (banner, flash_sale, combo, etc.)
 */
export function useOffersByType(offerType: string) {
  return useQuery({
    queryKey: queryKeys.offers.byType(offerType),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('offer_type', offerType)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Offer[];
    },
    enabled: !!offerType,
  });
}

/**
 * Get offers applicable to specific category/subcategory/vendor
 */
export function useOffersByApplicability(
  applicableTo: string,
  applicableId: string
) {
  return useQuery({
    queryKey: queryKeys.offers.byApplicability(applicableTo, applicableId),
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('applicable_to', applicableTo)
        .eq('applicable_id', applicableId)
        .eq('is_active', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Offer[];
    },
    enabled: !!applicableTo && !!applicableId,
  });
}

/**
 * Get banner offers for homepage
 */
export function useBannerOffers() {
  return useQuery({
    queryKey: queryKeys.offers.banners(),
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('offer_type', 'banner')
        .eq('is_active', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data as Offer[];
    },
  });
}

/**
 * Get offer statistics
 * UPDATED: Properly handles product counting based on applicable_to field
 */
export function useOfferStats(offerId: string) {
  return useQuery({
    queryKey: queryKeys.offers.stats(offerId),
    queryFn: async () => {
      // Get offer details first to determine how to count products
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;

      let productsCount = 0;

      // Count products based on applicable_to field
      if (offer.applicable_to === 'product' && !offer.applicable_id) {
        // Products are in offer_products join table
        const { count, error: countError } = await supabase
          .from('offer_products')
          .select('*', { count: 'exact', head: true })
          .eq('offer_id', offerId);

        if (countError) throw countError;
        productsCount = count || 0;
      } else if (offer.applicable_to === 'category' && offer.applicable_id) {
        // Count products in this category
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', offer.applicable_id)
          .eq('is_available', true);

        if (countError) throw countError;
        productsCount = count || 0;
      } else if (offer.applicable_to === 'subcategory' && offer.applicable_id) {
        // Count products in this subcategory
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('sub_category_id', offer.applicable_id)
          .eq('is_available', true);

        if (countError) throw countError;
        productsCount = count || 0;
      } else if (offer.applicable_to === 'vendor' && offer.applicable_id) {
        // Count products from this vendor
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', offer.applicable_id)
        
          console.log("vendors counts",count,offer.applicable_id);
          

        if (countError) throw countError;
        productsCount = count || 0;
      } else if (offer.applicable_to === 'all') {
        // Count all available products
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_available', true);

        if (countError) throw countError;
        productsCount = count || 0;
      }

      // Calculate status
      const now = new Date();
      const startDate = new Date(offer.start_date);
      const endDate = offer.end_date ? new Date(offer.end_date) : null;

      let status: 'upcoming' | 'active' | 'expired' | 'inactive';
      
      if (!offer.is_active) {
        status = 'inactive';
      } else if (now < startDate) {
        status = 'upcoming';
      } else if (endDate && now > endDate) {
        status = 'expired';
      } else {
        status = 'active';
      }

      return {
        products_count: productsCount,
        status,
        is_currently_active: isOfferActive(offer),
        days_remaining: endDate 
          ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      };
    },
    enabled: !!offerId,
  });
}

// ============================================================================
// OFFER PRODUCTS QUERIES
// ============================================================================

/**
 * Get products for a specific offer
 * UPDATED: Properly handles different applicable_to scenarios
 */
export function useOfferProducts(offerId: string) {
  return useQuery({
    queryKey: queryKeys.offers.products(offerId),
    queryFn: async () => {
      // First, get the offer to determine how to fetch products
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select('applicable_to, applicable_id')
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;

      // Handle different applicable_to scenarios
      if (offer.applicable_to === 'product' && !offer.applicable_id) {
        // Products are in offer_products join table
        const { data, error } = await supabase
          .from('offer_products')
          .select(`
            id,
            created_at,
            product:products(
              id,
              name,
              slug,
              sku,
              image,
              price,
              discount_price,
              stock_quantity,
              stock_status,
              is_available,
              category:categories(id, name),
              vendor:vendors(store_name)
            )
          `)
          .eq('offer_id', offerId);

        if (error) throw error;
        return data;
      } else if (offer.applicable_to === 'category' && offer.applicable_id) {
        // Fetch products from category
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            slug,
            sku,
            image,
            price,
            discount_price,
            stock_quantity,
            stock_status,
            is_available,
            category:categories(id, name),
            vendor:vendors(store_name)
          `)
          .eq('category_id', offer.applicable_id)
          .eq('is_available', true);

        if (error) throw error;
        // Transform to match offer_products structure
        return data.map(product => ({
          id: `${offerId}-${product.id}`,
          created_at: new Date().toISOString(),
          product,
        }));
      } else if (offer.applicable_to === 'subcategory' && offer.applicable_id) {
        // Fetch products from subcategory
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            slug,
            sku,
            image,
            price,
            discount_price,
            stock_quantity,
            stock_status,
            is_available,
            category:categories(id, name),
            vendor:vendors(store_name)
          `)
          .eq('sub_category_id', offer.applicable_id)
          .eq('is_available', true);

        if (error) throw error;
        return data.map(product => ({
          id: `${offerId}-${product.id}`,
          created_at: new Date().toISOString(),
          product,
        }));
      } else if (offer.applicable_to === 'vendor' && offer.applicable_id) {
        // Fetch products from vendor
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            slug,
            sku,
            image,
            price,
            discount_price,
            stock_quantity,
            stock_status,
            is_available,
            category:categories(id, name),
            vendor:vendors(store_name)
          `)
          .eq('vendor_id', offer.applicable_id)

        if (error) throw error;
        return data.map(product => ({
          id: `${offerId}-${product.id}`,
          created_at: new Date().toISOString(),
          product,
        }));
      } else if (offer.applicable_to === 'all') {
        // Fetch all available products (with a reasonable limit)
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            slug,
            sku,
            image,
            price,
            discount_price,
            stock_quantity,
            stock_status,
            is_available,
            category:categories(id, name),
            vendor:vendors(store_name)
          `)
          .eq('is_available', true)
          .limit(100); // Limit to prevent too many results

        if (error) throw error;
        return data.map(product => ({
          id: `${offerId}-${product.id}`,
          created_at: new Date().toISOString(),
          product,
        }));
      }

      return [];
    },
    enabled: !!offerId,
  });
}

/**
 * Check if a product is in any active offer
 */
export function useProductOffers(productId: string) {
  return useQuery({
    queryKey: queryKeys.offers.byProduct(productId),
    queryFn: async () => {
      const now = new Date().toISOString();

      // First, get the product to know its category, subcategory, and vendor
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('category_id, sub_category_id, vendor_id')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Get offers from multiple sources:
      // 1. Direct product offers (offer_products table)
      // 2. Category offers
      // 3. Subcategory offers
      // 4. Vendor offers
      // 5. All products offers

      const { data: directOffers, error: directError } = await supabase
        .from('offer_products')
        .select(`
          id,
          offer:offers(
            id,
            title,
            offer_type,
            discount,
            discount_type,
            discount_value,
            start_date,
            end_date,
            is_active,
            banner_image,
            tag,
            applicable_to,
            applicable_id
          )
        `)
        .eq('product_id', productId);

      if (directError) throw directError;

      // Get category, subcategory, vendor, and all offers
      const { data: scopedOffers, error: scopedError } = await supabase
        .from('offers')
        .select('*')
        .or(`
          and(applicable_to.eq.category,applicable_id.eq.${product.category_id}),
          and(applicable_to.eq.subcategory,applicable_id.eq.${product.sub_category_id}),
          and(applicable_to.eq.vendor,applicable_id.eq.${product.vendor_id}),
          applicable_to.eq.all
        `)
        .eq('is_active', true);

      if (scopedError) throw scopedError;

      // Combine and format results
      const allOffers = [
        ...directOffers.map(item => ({ id: item.id, offer: item.offer })),
        ...scopedOffers.map(offer => ({ id: offer.id, offer })),
      ];

      // Filter to only active offers
      const activeOffers = allOffers.filter((item: any) => {
        const offer = item.offer;
        if (!offer || !offer.is_active) return false;
        
        const start = new Date(offer.start_date);
        if (now < start.toISOString()) return false;
        
        if (offer.end_date) {
          const end = new Date(offer.end_date);
          if (now > end.toISOString()) return false;
        }
        
        return true;
      });

      // Remove duplicates by offer ID
      const uniqueOffers = Array.from(
        new Map(activeOffers.map(item => [item.offer.id, item])).values()
      );

      return uniqueOffers;
    },
    enabled: !!productId,
  });
}

// ============================================================================
// OFFER MUTATIONS
// ============================================================================

/**
 * Create a new offer
 */
export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      offer,
      bannerFile,
      productIds,
    }: {
      offer: OfferInsert;
      bannerFile?: File;
      productIds?: string[];
    }) => {
      // Validate dates
      if (offer.start_date) {
        validateOfferDates(offer.start_date, offer.end_date);
      }

      // Insert offer first
      const { data: newOffer, error: offerError } = await supabase
        .from('offers')
        .insert(offer)
        .select('*')
        .single();

      if (offerError) throw offerError;

      // Upload banner if provided
      let bannerUrl: string | undefined;
      if (bannerFile) {
        bannerUrl = await uploadOfferBanner(newOffer.id, bannerFile);
        
        // Update offer with banner URL
        const { data: updatedOffer, error: updateError } = await supabase
          .from('offers')
          .update({ banner_image: bannerUrl })
          .eq('id', newOffer.id)
          .select('*')
          .single();

        if (updateError) throw updateError;
        
        // Add products if provided AND applicable_to is 'product'
        if (productIds && productIds.length > 0 && updatedOffer.applicable_to === 'product') {
          const offerProducts = productIds.map(productId => ({
            offer_id: updatedOffer.id,
            product_id: productId,
          }));

          const { error: productsError } = await supabase
            .from('offer_products')
            .insert(offerProducts);

          if (productsError) throw productsError;
        }

        return updatedOffer;
      }

      // Add products if provided (no banner case) AND applicable_to is 'product'
      if (productIds && productIds.length > 0 && newOffer.applicable_to === 'product') {
        const offerProducts = productIds.map(productId => ({
          offer_id: newOffer.id,
          product_id: productId,
        }));

        const { error: productsError } = await supabase
          .from('offer_products')
          .insert(offerProducts);

        if (productsError) throw productsError;
      }

      return newOffer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
    },
  });
}

/**
 * Update offer
 */
export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      offerId,
      updates,
      bannerFile,
      removeBanner,
    }: {
      offerId: string;
      updates: OfferUpdate;
      bannerFile?: File;
      removeBanner?: boolean;
    }) => {
      // Validate dates if being updated
      if (updates.start_date) {
        validateOfferDates(updates.start_date, updates.end_date);
      }

      // Get current offer to access old banner URL
      const { data: currentOffer } = await supabase
        .from('offers')
        .select('banner_image')
        .eq('id', offerId)
        .single();

      let bannerUrl = currentOffer?.banner_image;

      // Handle banner removal
      if (removeBanner && bannerUrl) {
        await deleteOfferBanner(bannerUrl);
        bannerUrl = undefined;
      }

      // Handle new banner upload
      if (bannerFile) {
        // Delete old banner if exists
        if (bannerUrl) {
          await deleteOfferBanner(bannerUrl);
        }
        // Upload new banner
        bannerUrl = await uploadOfferBanner(offerId, bannerFile);
      }

      // Update offer
      const { data, error } = await supabase
        .from('offers')
        .update({
          ...updates,
          banner_image: bannerUrl,
        })
        .eq('id', offerId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.offers.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.withProducts(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.stats(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.products(data.id) });
    },
  });
}

/**
 * Delete offer
 */
export function useDeleteOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string) => {
      // Get offer to access banner URL
      const { data: offer } = await supabase
        .from('offers')
        .select('banner_image')
        .eq('id', offerId)
        .single();

      // Delete banner if exists
      if (offer?.banner_image) {
        await deleteOfferBanner(offer.banner_image);
      }

      // Delete offer products first (foreign key constraint)
      const { error: productsError } = await supabase
        .from('offer_products')
        .delete()
        .eq('offer_id', offerId);

      if (productsError) throw productsError;

      // Delete offer
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;
      return offerId;
    },
    onSuccess: (offerId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
      queryClient.removeQueries({ queryKey: queryKeys.offers.detail(offerId) });
    },
  });
}

/**
 * Toggle offer active status
 */
export function useToggleOfferStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string) => {
      // Get current status
      const { data: offer } = await supabase
        .from('offers')
        .select('is_active')
        .eq('id', offerId)
        .single();

      if (!offer) throw new Error('Offer not found');

      // Toggle status
      const { data, error } = await supabase
        .from('offers')
        .update({ is_active: !offer.is_active })
        .eq('id', offerId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.offers.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.stats(data.id) });
    },
  });
}

/**
 * Update offer display order
 */
export function useUpdateOfferOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offers: { id: string; display_order: number }[]) => {
      const updates = offers.map(offer =>
        supabase
          .from('offers')
          .update({ display_order: offer.display_order })
          .eq('id', offer.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw errors[0].error;
      }

      return offers;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
    },
  });
}

// ============================================================================
// OFFER PRODUCTS MUTATIONS
// ============================================================================

/**
 * Add products to offer
 * NOTE: Only works when applicable_to = 'product'
 */
export function useAddProductsToOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      offerId,
      productIds,
    }: {
      offerId: string;
      productIds: string[];
    }) => {
      // Verify offer is applicable_to = 'product'
      const { data: offer } = await supabase
        .from('offers')
        .select('applicable_to')
        .eq('id', offerId)
        .single();

      if (offer?.applicable_to !== 'product') {
        throw new Error('Can only add products to offers with applicable_to = "product"');
      }

      // Get existing products to avoid duplicates
      const { data: existing } = await supabase
        .from('offer_products')
        .select('product_id')
        .eq('offer_id', offerId);

      const existingIds = new Set(existing?.map(p => p.product_id) || []);
      const newProductIds = productIds.filter(id => !existingIds.has(id));

      if (newProductIds.length === 0) {
        throw new Error('All products are already in this offer');
      }

      const offerProducts = newProductIds.map(productId => ({
        offer_id: offerId,
        product_id: productId,
      }));

      const { data, error } = await supabase
        .from('offer_products')
        .insert(offerProducts)
        .select('*');

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.offers.products(variables.offerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.offers.withProducts(variables.offerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.offers.stats(variables.offerId) 
      });
      // Invalidate product offers for each added product
      variables.productIds.forEach(productId => {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.offers.byProduct(productId) 
        });
      });
    },
  });
}

/**
 * Remove product from offer
 * NOTE: Only works when applicable_to = 'product'
 */
export function useRemoveProductFromOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      offerId,
      productId,
    }: {
      offerId: string;
      productId: string;
    }) => {
      // Verify offer is applicable_to = 'product'
      const { data: offer } = await supabase
        .from('offers')
        .select('applicable_to')
        .eq('id', offerId)
        .single();

      if (offer?.applicable_to !== 'product') {
        throw new Error('Can only remove products from offers with applicable_to = "product"');
      }

      const { error } = await supabase
        .from('offer_products')
        .delete()
        .eq('offer_id', offerId)
        .eq('product_id', productId);

      if (error) throw error;
      return { offerId, productId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.offers.products(data.offerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.offers.withProducts(data.offerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.offers.stats(data.offerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.offers.byProduct(data.productId) 
      });
    },
  });
}

/**
 * Bulk update products for offer (replace all)
 * NOTE: Only works when applicable_to = 'product'
 */
export function useUpdateOfferProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      offerId,
      productIds,
    }: {
      offerId: string;
      productIds: string[];
    }) => {
      // Verify offer is applicable_to = 'product'
      const { data: offer } = await supabase
        .from('offers')
        .select('applicable_to')
        .eq('id', offerId)
        .single();

      if (offer?.applicable_to !== 'product') {
        throw new Error('Can only update products for offers with applicable_to = "product"');
      }

      // Delete all existing products
      const { error: deleteError } = await supabase
        .from('offer_products')
        .delete()
        .eq('offer_id', offerId);

      if (deleteError) throw deleteError;

      // Insert new products
      if (productIds.length > 0) {
        const offerProducts = productIds.map(productId => ({
          offer_id: offerId,
          product_id: productId,
        }));

        const { data, error: insertError } = await supabase
          .from('offer_products')
          .insert(offerProducts)
          .select('*');

        if (insertError) throw insertError;
        return data;
      }

      return [];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.offers.products(variables.offerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.offers.withProducts(variables.offerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.offers.stats(variables.offerId) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
    },
  });
}

/**
 * Duplicate offer (copy with new dates)
 */
export function useDuplicateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      offerId,
      newTitle,
      newStartDate,
      newEndDate,
    }: {
      offerId: string;
      newTitle?: string;
      newStartDate: string;
      newEndDate?: string | null;
    }) => {
      // Get original offer
      const { data: originalOffer, error: fetchError } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (fetchError) throw fetchError;

      // Get original offer products (only if applicable_to = 'product')
      let originalProducts: any[] = [];
      if (originalOffer.applicable_to === 'product') {
        const { data, error: productsError } = await supabase
          .from('offer_products')
          .select('product_id')
          .eq('offer_id', offerId);

        if (productsError) throw productsError;
        originalProducts = data || [];
      }

      // Create new offer
      const { id, created_at, updated_at, banner_image, ...offerData } = originalOffer;
      
      const { data: newOffer, error: createError } = await supabase
        .from('offers')
        .insert({
          ...offerData,
          title: newTitle || `${originalOffer.title} (Copy)`,
          start_date: newStartDate,
          end_date: newEndDate,
          is_active: false, // Start inactive
        })
        .select('*')
        .single();

      if (createError) throw createError;

      // Copy products (only if applicable_to = 'product')
      if (originalProducts.length > 0 && newOffer.applicable_to === 'product') {
        const newOfferProducts = originalProducts.map(p => ({
          offer_id: newOffer.id,
          product_id: p.product_id,
        }));

        const { error: insertProductsError } = await supabase
          .from('offer_products')
          .insert(newOfferProducts);

        if (insertProductsError) throw insertProductsError;
      }

      return newOffer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
    },
  });
}