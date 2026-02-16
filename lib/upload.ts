// lib/upload.ts
import { createClient } from './supabase/client';

const supabase = createClient();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductImageInput {
  file: File;
  altText: string;
  isPrimary: boolean;
}

// ─── Single image upload ───────────────────────────────────────────────────────

export async function uploadProductImage(
  vendorId: string,
  productSku: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${vendorId}/products/${productSku}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('vendors')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('vendors').getPublicUrl(filePath);
  return data.publicUrl;
}

// ─── Upload images + insert product_images rows ───────────────────────────────

export async function uploadAndSaveProductImages(
  vendorId: string,
  productSku: string,
  productId: string,
  productImages: ProductImageInput[]
): Promise<string[]> {
  if (productImages.length === 0) {
    throw new Error('At least one product image is required');
  }

  // Step 1: Upload all files to storage in parallel
  const uploadedImageUrls = await Promise.all(
    productImages.map((img) =>
      uploadProductImage(vendorId, productSku, img.file)
    )
  );

  // Step 2: Build image gallery records
  const imageRecords = productImages.map((img, index) => ({
    product_id: productId,
    image_url: uploadedImageUrls[index],
    alt_text: img.altText,
    display_order: index + 1,
    is_primary: img.isPrimary,
  }));

  // Step 3: Insert all records into product_images table
  const { error: imagesError } = await supabase
    .from('product_images')
    .insert(imageRecords);

  if (imagesError) {
    throw new Error(`Failed to save image records: ${imagesError.message}`);
  }

  return uploadedImageUrls;
}

// ─── Delete single image ──────────────────────────────────────────────────────

export async function deleteProductImage(url: string): Promise<void> {
  const urlParts = url.split('/vendors/');
  if (urlParts.length < 2) {
    throw new Error('Invalid image URL format');
  }

  const path = urlParts[1];
  const { error } = await supabase.storage.from('vendors').remove([path]);
  if (error) throw error;
}

// ─── Delete image record from DB + storage ────────────────────────────────────

export async function deleteProductImageRecord(
  imageId: string,
  imageUrl: string
): Promise<void> {
  // Remove from product_images table first
  const { error: dbError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId);

  if (dbError) {
    throw new Error(`Failed to delete image record: ${dbError.message}`);
  }

  // Then remove from storage
  await deleteProductImage(imageUrl);
}

// ─── Upload multiple (storage only, no DB insert) ─────────────────────────────

export async function uploadProductImages(
  vendorId: string,
  productSku: string,
  files: File[]
): Promise<string[]> {
  return Promise.all(
    files.map((file) => uploadProductImage(vendorId, productSku, file))
  );
}

// ─── Validation helpers ───────────────────────────────────────────────────────

export function getFileSizeMB(file: File): number {
  return file.size / (1024 * 1024);
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSizeMB = 5;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.',
    };
  }

  if (getFileSizeMB(file) > maxSizeMB) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB. Please upload a smaller image.`,
    };
  }

  return { valid: true };
}