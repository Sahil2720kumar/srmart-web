"use client";

import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Mock image data
const mockImages = [
  {
    id: "IMG001",
    url: "/products/rice-1.jpg",
    isPrimary: true,
    displayOrder: 1,
  },
  {
    id: "IMG002",
    url: "/products/rice-2.jpg",
    isPrimary: false,
    displayOrder: 2,
  },
  {
    id: "IMG003",
    url: "/products/rice-3.jpg",
    isPrimary: false,
    displayOrder: 3,
  },
  {
    id: "IMG004",
    url: "/products/rice-4.jpg",
    isPrimary: false,
    displayOrder: 4,
  },
];

export default function ProductImagesPage({ params }) {
  const router = useRouter();
  const [images, setImages] = useState(mockImages);
  const [draggedItem, setDraggedItem] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSetPrimary = (imageId) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }))
    );
    setHasChanges(true);
  };

  const handleDeleteImage = (imageId) => {
    const imageToDelete = images.find((img) => img.id === imageId);
    if (imageToDelete.isPrimary && images.length > 1) {
      alert("Cannot delete primary image. Set another image as primary first.");
      return;
    }

    if (confirm("Are you sure you want to delete this image?")) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      setHasChanges(true);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedItem];
    newImages.splice(draggedItem, 1);
    newImages.splice(index, 0, draggedImage);

    // Update display order
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      displayOrder: idx + 1,
    }));

    setImages(reorderedImages);
    setDraggedItem(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleUpload = () => {
    // Simulate file upload
    const newImage = {
      id: `IMG00${images.length + 1}`,
      url: `/products/rice-${images.length + 1}.jpg`,
      isPrimary: images.length === 0,
      displayOrder: images.length + 1,
    };
    setImages((prev) => [...prev, newImage]);
    setHasChanges(true);
  };

  const handleSave = () => {
    console.log("Saving image order:", images);
    // Here you would typically send the data to your backend
    setHasChanges(false);
    router.push("/admin/products/PROD001");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/products/PROD001">
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
              onClick={handleUpload}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Images
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Save className="w-4 h-4" />
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
                  <li>Recommended image size: 800x800px</li>
                  <li>Maximum 10 images per product</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-slate-600">Total Images</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {images.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-slate-600">Primary Image</div>
              <div className="text-lg font-medium text-emerald-600 mt-1">
                {images.find((img) => img.isPrimary)?.id || "None"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-slate-600">Available Slots</div>
              <div className="text-3xl font-bold text-blue-600 mt-1">
                {10 - images.length}
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
            {images.length === 0 ? (
              <div className="text-center py-16">
                <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No images uploaded
                </h3>
                <p className="text-slate-600 mb-6">
                  Upload your first product image to get started
                </p>
                <Button onClick={handleUpload} className="gap-2">
                  <Upload className="w-4 h-4" />
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
                        <div className="aspect-square bg-slate-200 relative flex items-center justify-center">
                          <ImageIcon className="w-20 h-20 text-slate-400" />
                          
                          {/* Drag Handle */}
                          <div className="absolute top-2 left-2 p-1 bg-white/90 rounded-md shadow-sm cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-5 h-5 text-slate-600" />
                          </div>

                          {/* Primary Badge */}
                          {image.isPrimary && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
                                <Star className="w-3 h-3 mr-1 fill-yellow-900" />
                                Primary
                              </Badge>
                            </div>
                          )}

                          {/* Display Order */}
                          <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary" className="bg-white/90">
                              #{image.displayOrder}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 space-y-2">
                          <div className="flex gap-2">
                            {!image.isPrimary && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetPrimary(image.id)}
                                className="flex-1 gap-2"
                              >
                                <Star className="w-4 h-4" />
                                Set Primary
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteImage(image.id)}
                              className="gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              {image.isPrimary ? "" : "Remove"}
                            </Button>
                          </div>
                          <div className="text-xs text-slate-500 text-center">
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
                    onClick={handleUpload}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors">
                        <Upload className="w-12 h-12 mb-3" />
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
        {hasChanges && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="font-medium text-amber-900">
                    You have unsaved changes
                  </span>
                </div>
                <Button
                  onClick={handleSave}
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Save className="w-4 h-4" />
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