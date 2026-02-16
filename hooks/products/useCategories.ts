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
// CATEGORY QUERIES
// ============================================================================
const supabase=createClient()
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
 * Get category with products
 */
export function useCategoryWithProducts(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.categories.withProducts(categoryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*, products(count)')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      return data;
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
    mutationFn: async (category: CategoryInsert) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
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
    }: {
      categoryId: string;
      updates: CategoryUpdate;
    }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
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

// ============================================================================
// SUB-CATEGORY MUTATIONS
// ============================================================================

/**
 * Create a new sub-category
 */
export function useCreateSubCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subCategory: SubCategoryInsert) => {
      const { data, error } = await supabase
        .from('sub_categories')
        .insert(subCategory)
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
    }: {
      subCategoryId: string;
      updates: SubCategoryUpdate;
    }) => {
      const { data, error } = await supabase
        .from('sub_categories')
        .update(updates)
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
      const { error } = await supabase
        .from('sub_categories')
        .delete()
        .eq('id', subCategoryId);

      if (error) throw error;
      return subCategoryId;
    },
    onSuccess: (subCategoryId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subCategories.all });
      queryClient.removeQueries({ queryKey: queryKeys.subCategories.detail(subCategoryId) });
    },
  });
}