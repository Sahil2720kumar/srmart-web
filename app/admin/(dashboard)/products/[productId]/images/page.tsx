"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Save,
  Upload,
  Trash2,
  Star,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  useProductImages,
  useDeleteProductImage,
  useSetPrimaryProductImage,
} from "@/hooks/products/useProducts";
import { queryKeys } from "@/hooks/query-keys";
import {
  uploadAndSaveProductImages,
  validateImageFile,
  ProductImageInput,
} from "@/lib/upload";
import { ProductImage } from "@/types/supabase";

export default function ProductImagesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {productId} = useParams<{productId:string}>();

  // ─── Local UI state ───────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [localOrder, setLocalOrder] = useState<ProductImage[] | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ─── Queries ─────────────────────────────────────────────────────────────
  const {
    data: serverImages = [],
    isLoading,
    isError,
    error,
  } = useProductImages(productId);

  // Derive display images: prefer local (drag) order, fall back to server data
  const images: ProductImage[] = localOrder ?? serverImages;
  const hasLocalChanges = localOrder !== null;

  // ─── Mutations ────────────────────────────────────────────────────────────
  const setPrimary = useSetPrimaryProductImage();
  const deleteImage = useDeleteProductImage();

  /**
   * Upload new images: validates files, uploads to storage via uploadAndSaveProductImages,
   * and inserts product_images rows — then invalidates the images cache.
   */
  const uploadImages = useMutation({
    mutationFn: async (files: File[]) => {
      // Validate every file before touching the network
      for (const file of files) {
        const { valid, error } = validateImageFile(file);
        if (!valid) throw new Error(error);
      }

      const slotsRemaining = 10 - images.length;
      if (files.length > slotsRemaining) {
        throw new Error(
          `You can only upload ${slotsRemaining} more image${slotsRemaining === 1 ? "" : "s"}.`
        );
      }

      // We need vendorId + SKU for the storage path.
      // Fetch the product row to get them (already cached by React Query).
      const supabase = createClient();
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("vendor_id, sku")
        .eq("id", productId)
        .single();
      if (productError) throw productError;

      const productImages: ProductImageInput[] = files.map((file, i) => ({
        file,
        altText: file.name.replace(/\.[^.]+$/, ""),
        // Mark first upload as primary only when the product has no images yet
        isPrimary: images.length === 0 && i === 0,
      }));

      return uploadAndSaveProductImages(
        product.vendor_id,
        product.sku,
        productId,
        productImages
      );
    },
    onSuccess: () => {
      setUploadError(null);
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.images(productId),
      });
    },
    onError: (err: Error) => {
      setUploadError(err.message);
    },
  });

  /**
   * Persist reordered display_order values — one update per image.
   * Replace with a batch RPC if you prefer a single round-trip.
   */
  const updateOrder = useMutation({
    mutationFn: async (ordered: ProductImage[]) => {
      const supabase = createClient();
      await Promise.all(
        ordered.map((img) =>
          supabase
            .from("product_images")
            .update({ display_order: img.display_order })
            .eq("id", img.id)
        )
      );
    },
    onSuccess: () => {
      setLocalOrder(null);
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.images(productId),
      });
      router.push(`/admin/products/${productId}`);
    },
    onError: (err: Error) => {
      setUploadError(err.message);
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSetPrimary = (imageId: string) => {
    setPrimary.mutate({ imageId, productId });
  };

  const handleDeleteImage = (imageId: string) => {
    const imageToDelete = images.find((img) => img.id === imageId);
    if (!imageToDelete) return;

    if (imageToDelete.is_primary && images.length > 1) {
      alert("Cannot delete primary image. Set another image as primary first.");
      return;
    }

    if (confirm("Are you sure you want to delete this image?")) {
      if (localOrder) {
        setLocalOrder((prev) =>
          prev ? prev.filter((img) => img.id !== imageId) : null
        );
      }
      // deleteProductImageRecord removes the DB row AND the storage file
      deleteImage.mutate({ imageId, productId });
    }
  };

  // ─── Upload ───────────────────────────────────────────────────────────────

  /** Opens the hidden file input */
  const handleUploadClick = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  /** Called when the user picks files from the OS dialog */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;
      uploadImages.mutate(files);
      // Reset so the same file can be re-selected if needed
      e.target.value = "";
    },
    [uploadImages]
  );

  // ─── Drag & Drop ──────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
    if (!localOrder) setLocalOrder([...serverImages]);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    setLocalOrder((prev) => {
      const base = prev ?? [...serverImages];
      const next = [...base];
      const dragged = next[draggedItem];
      next.splice(draggedItem, 1);
      next.splice(index, 0, dragged);
      return next.map((img, idx) => ({ ...img, display_order: idx + 1 }));
    });

    setDraggedItem(index);
  };

  const handleDragEnd = () => setDraggedItem(null);

  const handleSaveOrder = () => {
    if (localOrder) updateOrder.mutate(localOrder);
  };

  // ─── Derived state ────────────────────────────────────────────────────────
  const isMutating =
    setPrimary.isPending ||
    deleteImage.isPending ||
    uploadImages.isPending ||
    updateOrder.isPending;

  const primaryImage = images.find((img) => img.is_primary);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-8">
      {/* Hidden file input — triggered programmatically */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/admin/products/${productId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
                Product Images
              </h1>
              <p className="text-slate-600 mt-2">
                Manage product images and display order
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleUploadClick}
              disabled={isMutating || images.length >= 10}
              className="gap-2"
            >
              {uploadImages.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload Images
            </Button>

            <Button
              onClick={handleSaveOrder}
              disabled={!hasLocalChanges || isMutating}
              className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {updateOrder.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Order
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ImageIcon className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">
                  Image Management Tips
                </h4>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Drag and drop images to reorder them</li>
                  <li>Click the star icon to set an image as primary</li>
                  <li>Primary image is displayed first in product listings</li>
                  <li>Recommended image size: 800×800px</li>
                  <li>Maximum 10 images per product</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error banner — fetch errors */}
        {isError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">
                  {(error as Error)?.message ?? "Failed to load images"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error banner — mutation errors */}
        {(uploadError || setPrimary.isError || deleteImage.isError || updateOrder.isError) && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-red-700">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-medium">
                    {uploadError
                      ?? (setPrimary.error as Error)?.message
                      ?? (deleteImage.error as Error)?.message
                      ?? (updateOrder.error as Error)?.message}
                  </span>
                </div>
                <button onClick={() => setUploadError(null)} className="p-1 rounded hover:bg-red-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-slate-600">Total Images</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {isLoading ? "—" : images.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-slate-600">Primary Image</div>
              <div className="text-lg font-medium text-emerald-600 mt-1 truncate">
                {isLoading ? "—" : primaryImage?.id ?? "None"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-slate-600">Available Slots</div>
              <div className="text-3xl font-bold text-blue-600 mt-1">
                {isLoading ? "—" : 10 - images.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Loading skeleton */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <Card key={n} className="overflow-hidden animate-pulse">
                    <CardContent className="p-0">
                      <div className="aspect-square bg-slate-200" />
                      <div className="p-4 space-y-2">
                        <div className="h-8 bg-slate-200 rounded" />
                        <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-16">
                <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No images uploaded
                </h3>
                <p className="text-slate-600 mb-6">
                  Upload your first product image to get started
                </p>
                <Button
                  onClick={handleUploadClick}
                  className="gap-2"
                  disabled={uploadImages.isPending}
                >
                  {uploadImages.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload Images
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`relative group cursor-move transition-all ${
                      draggedItem === index
                        ? "opacity-50 scale-95"
                        : "opacity-100 scale-100"
                    }`}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-0">
                        {/* Image Preview */}
                        <div className="aspect-square bg-slate-200 relative flex items-center justify-center overflow-hidden">
                          {image.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={image.image_url}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-20 h-20 text-slate-400" />
                          )}

                          {/* Drag Handle */}
                          <div className="absolute top-2 left-2 p-1 bg-white/90 rounded-md shadow-sm cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-5 h-5 text-slate-600" />
                          </div>

                          {/* Primary Badge */}
                          {image.is_primary && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
                                <Star className="w-3 h-3 mr-1 fill-yellow-900" />
                                Primary
                              </Badge>
                            </div>
                          )}

                          {/* Pending overlay */}
                          {(setPrimary.isPending || deleteImage.isPending) && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                            </div>
                          )}

                          {/* Display Order */}
                          <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary" className="bg-white/90">
                              #{image.display_order}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 space-y-2">
                          <div className="flex gap-2">
                            {!image.is_primary && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetPrimary(image.id)}
                                disabled={setPrimary.isPending}
                                className="flex-1 gap-2"
                              >
                                {setPrimary.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Star className="w-4 h-4" />
                                )}
                                Set Primary
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteImage(image.id)}
                              disabled={deleteImage.isPending}
                              className="gap-2"
                            >
                              {deleteImage.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              {image.is_primary ? "" : "Remove"}
                            </Button>
                          </div>
                          <div className="text-xs text-slate-500 text-center truncate">
                            Image ID: {image.id}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                {/* Upload New Card */}
                {images.length < 10 && (
                  <Card
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-400 cursor-pointer transition-colors"
                    onClick={handleUploadClick}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors">
                        {uploadImages.isPending ? (
                          <Loader2 className="w-12 h-12 mb-3 animate-spin text-emerald-500" />
                        ) : (
                          <Upload className="w-12 h-12 mb-3" />
                        )}
                        <span className="font-medium">Upload Image</span>
                        <span className="text-xs mt-1">
                          {10 - images.length} slots remaining
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unsaved Changes Warning */}
        {hasLocalChanges && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="font-medium text-amber-900">
                    You have unsaved display order changes
                  </span>
                </div>
                <Button
                  onClick={handleSaveOrder}
                  disabled={isMutating}
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {updateOrder.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Order
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}