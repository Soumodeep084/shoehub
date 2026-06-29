"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, X, Star } from "lucide-react";
import { uploadProductImage, deleteProductImage, setPrimaryImage } from "@/lib/adminActions/product-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductImagesProps {
  productId: string;
  images: {
    id: string;
    imageUrl: string;
    storagePath: string;
    isPrimary: boolean;
    sortOrder: number;
  }[];
}

export function ProductImages({ productId, images }: ProductImagesProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.set("file", files[i]);
        formData.set("productId", productId);
        formData.set("isPrimary", images.length === 0 && i === 0 ? "true" : "false");

        const result = await uploadProductImage(formData);
        if ("error" in result && result.error) {
          toast.error(`Failed to upload ${files[i].name}: ${result.error}`);
        }
      }
      toast.success("Images uploaded");
      router.refresh();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(imageId: string) {
    try {
      const result = await deleteProductImage(imageId);
      if (result.success) {
        toast.success("Image deleted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete image");
      }
    } catch {
      toast.error("Failed to delete image");
    }
  }

  async function handleSetPrimary(imageId: string) {
    try {
      await setPrimaryImage(imageId, productId);
      toast.success("Primary image updated");
      router.refresh();
    } catch {
      toast.error("Failed to update primary image");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Images</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-1" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No images yet. Click upload to add.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square rounded-lg overflow-hidden border"
              >
                <img
                  src={img.imageUrl}
                  alt="Product"
                  className="h-full w-full object-cover"
                />
                {img.isPrimary && (
                  <div className="absolute top-1 left-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      <Star className="h-3 w-3" />
                      Primary
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.isPrimary && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetPrimary(img.id)}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Primary
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(img.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
