// hooks/products/useCategories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '../query-keys';
import {
  Category,
  CategoryInsert,
  CategoryUpdate,
  SubCategory,
  SubCategoryInsert,
  SubCategoryUpdate,
} from '@/types/supabase';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const supabase = createClient();

/**
 * Upload category image to Supabase Storage
 */
async function uploadCategoryImage(
  categorySlug: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `categories/${categorySlug}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('category-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data } = supabase.storage
    .from('category-assets')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Delete category image from Supabase Storage
 */
async function deleteCategoryImage(imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  // Extract file path from URL
  const urlParts = imageUrl.split('/category-assets/');
  if (urlParts.length < 2) return;

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('category-assets')
    .remove([filePath]);

  if (error) console.error('Error deleting image:', error);
}

/**
 * Upload subcategory image to Supabase Storage
 */
async function uploadSubCategoryImage(
  categorySlug: string,
  subCategorySlug: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `categories/${categorySlug}/${subCategorySlug}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('category-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data } = supabase.storage
    .from('category-assets')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// ============================================================================
// CATEGORY QUERIES
// ============================================================================

/**
 * Get all categories
 */
export function useCategories(filters?: { is_active?: boolean }) {
  return useQuery({
    queryKey: queryKeys.categories.list(filters),
    queryFn: async () => {
      let query = supabase.from('categories').select('*').order('display_order');

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Category[];
    },
  });
}

/**
 * Get active categories only
 */
export function useActiveCategories() {
  return useQuery({
    queryKey: queryKeys.categories.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as Category[];
    },
  });
}

/**
 * Get category by ID
 */
export function useCategory(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.categories.detail(categoryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      return data as Category;
    },
    enabled: !!categoryId,
  });
}

/**
 * Get category with products count and subcategories
 */
export function useCategoryWithProducts(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.categories.withProducts(categoryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products:products(count),
          sub_categories:sub_categories(count)
        `)
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!categoryId,
  });
}

/**
 * Get category stats (subcategories count, active products count)
 */
export function useCategoryStats(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.categories.stats(categoryId),
    queryFn: async () => {
      // Get subcategories count
      const { count: subCategoryCount, error: subError } = await supabase
        .from('sub_categories')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);


        
      if (subError) throw subError;

      // Get active products count
      const { count: activeProductsCount, error: productError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
      

      if (productError) throw productError;

      return {
        subcategory_count: subCategoryCount || 0,
        active_products: activeProductsCount || 0,
      };
    },
    enabled: !!categoryId,
  });
}

// ============================================================================
// SUB-CATEGORY QUERIES
// ============================================================================

/**
 * Get all sub-categories
 */
export function useSubCategories(filters?: { is_active?: boolean }) {
  return useQuery({
    queryKey: queryKeys.subCategories.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('sub_categories')
        .select('*, category:categories(name)')
        .order('display_order');

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Get sub-categories by category ID
 */
export function useSubCategoriesByCategory(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.subCategories.byCategory(categoryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sub_categories')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as SubCategory[];
    },
    enabled: !!categoryId,
  });
}

/**
 * Get all sub-categories by category ID (including inactive)
 */
export function useAllSubCategoriesByCategory(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.subCategories.allByCategory(categoryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sub_categories')
        .select('*')
        .eq('category_id', categoryId)
        .order('display_order');
       
      if (error) throw error;
      return data as SubCategory[];
    },
    enabled: !!categoryId,
  });
}

/**
 * Get sub-category by ID
 */
export function useSubCategory(subCategoryId: string) {
  return useQuery({
    queryKey: queryKeys.subCategories.detail(subCategoryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sub_categories')
        .select('*, category:categories(*)')
        .eq('id', subCategoryId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!subCategoryId,
  });
}

// ============================================================================
// CATEGORY MUTATIONS
// ============================================================================

/**
 * Create a new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      category,
      imageFile,
    }: {
      category: CategoryInsert;
      imageFile?: File;
    }) => {
      // Upload image if provided
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadCategoryImage(category.slug, imageFile);
      }

      // Insert category with image URL
      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...category,
          image: imageUrl,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/**
 * Update category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      updates,
      imageFile,
      removeImage,
    }: {
      categoryId: string;
      updates: CategoryUpdate;
      imageFile?: File;
      removeImage?: boolean;
    }) => {
      // Get current category to access old image URL
      const { data: currentCategory } = await supabase
        .from('categories')
        .select('image, slug')
        .eq('id', categoryId)
        .single();

      let imageUrl = currentCategory?.image;

      // Handle image removal
      if (removeImage && imageUrl) {
        await deleteCategoryImage(imageUrl);
        imageUrl = undefined;
      }

      // Handle new image upload
      if (imageFile) {
        // Delete old image if exists
        if (imageUrl) {
          await deleteCategoryImage(imageUrl);
        }
        // Upload new image
        const slug = updates.slug || currentCategory?.slug || '';
        imageUrl = await uploadCategoryImage(slug, imageFile);
      }

      // Update category
      const { data, error } = await supabase
        .from('categories')
        .update({
          ...updates,
          image: imageUrl,
        })
        .eq('id', categoryId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.categories.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/**
 * Delete category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      // Get category to access image URL
      const { data: category } = await supabase
        .from('categories')
        .select('image')
        .eq('id', categoryId)
        .single();

      // Delete image if exists
      if (category?.image) {
        await deleteCategoryImage(category.image);
      }

      // Delete category (cascade will handle subcategories)
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);

      if (error) throw error;
      return categoryId;
    },
    onSuccess: (categoryId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.removeQueries({ queryKey: queryKeys.categories.detail(categoryId) });
    },
  });
}

/**
 * Toggle category active status
 */
export function useToggleCategoryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      // Get current status
      const { data: category } = await supabase
        .from('categories')
        .select('is_active')
        .eq('id', categoryId)
        .single();

      if (!category) throw new Error('Category not found');

      // Toggle status
      const { data, error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', categoryId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.categories.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

// ============================================================================
// SUB-CATEGORY MUTATIONS
// ============================================================================

/**
 * Create a new sub-category
 */
export function useCreateSubCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subCategory,
      imageFile,
      categorySlug,
    }: {
      subCategory: SubCategoryInsert;
      imageFile?: File;
      categorySlug: string;
    }) => {
      // Upload image if provided
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadSubCategoryImage(
          categorySlug,
          subCategory.slug,
          imageFile
        );
      }

      // Insert sub-category with image URL
      const { data, error } = await supabase
        .from('sub_categories')
        .insert({
          ...subCategory,
          image: imageUrl,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subCategories.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subCategories.byCategory(data.category_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subCategories.allByCategory(data.category_id),
      });
    },
  });
}

/**
 * Update sub-category
 */
export function useUpdateSubCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subCategoryId,
      updates,
      imageFile,
      removeImage,
      categorySlug,
    }: {
      subCategoryId: string;
      updates: SubCategoryUpdate;
      imageFile?: File;
      removeImage?: boolean;
      categorySlug: string;
    }) => {
      // Get current sub-category to access old image URL
      const { data: currentSubCategory } = await supabase
        .from('sub_categories')
        .select('image, slug')
        .eq('id', subCategoryId)
        .single();

      let imageUrl = currentSubCategory?.image;

      // Handle image removal
      if (removeImage && imageUrl) {
        await deleteCategoryImage(imageUrl);
        imageUrl = undefined;
      }

      // Handle new image upload
      if (imageFile) {
        // Delete old image if exists
        if (imageUrl) {
          await deleteCategoryImage(imageUrl);
        }
        // Upload new image
        const slug = updates.slug || currentSubCategory?.slug || '';
        imageUrl = await uploadSubCategoryImage(categorySlug, slug, imageFile);
      }

      // Update sub-category
      const { data, error } = await supabase
        .from('sub_categories')
        .update({
          ...updates,
          image: imageUrl,
        })
        .eq('id', subCategoryId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.subCategories.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.subCategories.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subCategories.byCategory(data.category_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subCategories.allByCategory(data.category_id),
      });
    },
  });
}

/**
 * Delete sub-category
 */
export function useDeleteSubCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subCategoryId: string) => {
      // Get sub-category to access image URL and category_id
      const { data: subCategory } = await supabase
        .from('sub_categories')
        .select('image, category_id')
        .eq('id', subCategoryId)
        .single();

      // Delete image if exists
      if (subCategory?.image) {
        await deleteCategoryImage(subCategory.image);
      }

      // Delete sub-category
      const { error } = await supabase
        .from('sub_categories')
        .delete()
        .eq('id', subCategoryId);

      if (error) throw error;
      return { subCategoryId, categoryId: subCategory?.category_id };
    },
    onSuccess: ({ subCategoryId, categoryId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subCategories.all });
      queryClient.removeQueries({ queryKey: queryKeys.subCategories.detail(subCategoryId) });
      if (categoryId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.subCategories.byCategory(categoryId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.subCategories.allByCategory(categoryId),
        });
      }
    },
  });
}

/**
 * Toggle sub-category active status
 */
export function useToggleSubCategoryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subCategoryId: string) => {
      // Get current status
      const { data: subCategory } = await supabase
        .from('sub_categories')
        .select('is_active')
        .eq('id', subCategoryId)
        .single();

      if (!subCategory) throw new Error('Sub-category not found');

      // Toggle status
      const { data, error } = await supabase
        .from('sub_categories')
        .update({ is_active: !subCategory.is_active })
        .eq('id', subCategoryId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.subCategories.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.subCategories.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subCategories.byCategory(data.category_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subCategories.allByCategory(data.category_id),
      });
    },
  });
}