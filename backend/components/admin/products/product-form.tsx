"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { getDiscountPercentage } from "@/lib/utils";
import { Plus, Trash2, Upload, X, Star } from "lucide-react";
import Image from "next/image";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/lib/validators/product";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
} from "@/lib/adminActions/product-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FormInput,
  FormTextarea,
  FormSelect,
} from "@/components/admin/form-components";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ProductImages } from "./product-images";

interface ProductFormProps {
  categories: { id: string; name: string }[];
  initialData?: ProductFormValues & { id?: string };
  productId?: string;
  existingImages?: {
    id: string;
    imageUrl: string;
    storagePath: string;
    isPrimary: boolean;
    sortOrder: number;
  }[];
}

export function ProductForm({
  categories,
  initialData,
  productId,
  existingImages = [],
}: ProductFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!productId;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState<number>(0);
  const stagerFileInputRef = useRef<HTMLInputElement>(null);

  const handleStagingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const filesArr = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...filesArr]);

    const newUrls = filesArr.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  };

  const handleRemoveStaged = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== index));
    if (primaryIndex === index) {
      setPrimaryIndex(0);
    } else if (primaryIndex > index) {
      setPrimaryIndex((prev) => prev - 1);
    }
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: initialData ?? {
      name: "",
      description: "",
      brand: "",
      categoryId: "",
      basePrice: 0,
      salePrice: 0,
      discountPercent: 0,
      isFeatured: false,
      isNew: false,
      isActive: true,
      variants: [{ size: "", color: "", stock: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = form;

  const basePrice = useWatch({
    control,
    name: "basePrice",
  });

  const salePrice = useWatch({
    control,
    name: "salePrice",
  });

  useEffect(() => {
    if (
      typeof basePrice === "number" &&
      typeof salePrice === "number" &&
      basePrice > 0 &&
      salePrice >= 0
    ) {
      setValue("discountPercent", getDiscountPercentage(basePrice, salePrice));
    } else {
      setValue("discountPercent", 0);
    }
  }, [basePrice, salePrice, setValue]);

  useEffect(() => {
    if (
      typeof basePrice === "number" &&
      typeof salePrice === "number" &&
      basePrice > 0 &&
      salePrice > 0
    ) {
      if (basePrice < salePrice) {
        toast.error("Sale price cannot be greater than base price.");
        setValue("salePrice", basePrice);
        setValue("discountPercent", 0);
        return;
      }
      setValue("discountPercent", getDiscountPercentage(basePrice, salePrice));
    } else {
      setValue("discountPercent", 0);
    }
  }, [basePrice, salePrice, setValue]);

  async function onSubmit(data: ProductFormValues) {

    if (!isEditing && selectedFiles.length < 3) {
      toast.error("Please upload at least 3 product images.");
      return;
    }

    if (!isEditing && selectedFiles.length > 8) {
      toast.error("You can upload a maximum of 8 images.");
      return;
    }
    setSubmitting(true);

    try {
      const result = isEditing
        ? await updateProduct(productId!, data)
        : await createProduct(data);


      if ("error" in result && result.error) {
        const errorObj = result.error;
        if (typeof errorObj === "object") {
          Object.entries(errorObj).forEach(([key, messages]) => {
            if (Array.isArray(messages)) {
              toast.error(`${key}: ${messages.join(", ")}`);
            }
          });
        }
        return;
      }

      // If creating and we have staged files, upload them now!
      if (
        !isEditing &&
        "productId" in result &&
        result.productId &&
        selectedFiles.length > 0
      ) {
        const newProductId = result.productId as string;
        toast.info("Uploading product images...");
        for (let i = 0; i < selectedFiles.length; i++) {
          const formData = new FormData();
          formData.set("file", selectedFiles[i]);
          formData.set("productId", newProductId);
          formData.set("isPrimary", i === primaryIndex ? "true" : "false");

          const uploadRes = await uploadProductImage(formData);
          if ("error" in uploadRes && uploadRes.error) {
            toast.error(
              `Failed to upload ${selectedFiles[i].name}: ${uploadRes.error}`,
            );
          }
        }
      }

      toast.success(isEditing ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormInput
                label="Product Name"
                placeholder="e.g. Air Max 90"
                required
                error={errors.name?.message}
                {...register("name")}
              />

              <FormTextarea
                label="Description"
                placeholder="Write detailed product descriptions..."
                required
                error={errors.description?.message}
                {...register("description")}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Brand"
                  placeholder="e.g. Nike"
                  required
                  error={errors.brand?.message}
                  {...register("brand")}
                />

                <FormSelect
                  label="Category"
                  value={useWatch({
                    control,
                    name: "categoryId",
                  })}
                  onValueChange={(val) =>
                    setValue("categoryId", val, { shouldValidate: true })
                  }
                  options={categories.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                  required
                  error={errors.categoryId?.message}
                  placeholder="Select a category"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormInput
                  label="Base Price (₹)"
                  type="number"
                  step="0.01"
                  required
                  error={errors.basePrice?.message}
                  {...register("basePrice", {
                    valueAsNumber: true, // Convert input value to number
                  })}
                />

                <FormInput
                  label="Sale Price (₹)"
                  type="number"
                  step="0.01"
                  required
                  error={errors.salePrice?.message}
                  {...register("salePrice", {
                    valueAsNumber: true, // Convert input value to number
                  })}
                />

                <FormInput
                  label="Discount Percent (%)"
                  disabled
                  error={errors.discountPercent?.message}
                  {...register("discountPercent")}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                All variants inherit the product&apos;s base/sale pricing.
              </p>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Variants</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ size: "", color: "", stock: 0 })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Variant
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.variants &&
                typeof errors.variants === "object" &&
                "message" in errors.variants && (
                  <p className="text-xs text-destructive">
                    {errors.variants.message}
                  </p>
                )}

              {fields.map((field, index) => (
                <div key={field.id}>
                  {index > 0 && <Separator className="mb-4" />}
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Size</Label>
                      <Input
                        {...register(`variants.${index}.size`)}
                        placeholder="e.g. 9"
                      />
                      {errors.variants?.[index]?.size && (
                        <p className="text-xs text-destructive">
                          {errors.variants[index].size?.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Color</Label>
                      <Input
                        {...register(`variants.${index}.color`)}
                        placeholder="e.g. Black"
                      />
                      {errors.variants?.[index]?.color && (
                        <p className="text-xs text-destructive">
                          {errors.variants[index].color?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        {...register(`variants.${index}.stock`)}
                      />
                      {errors.variants?.[index]?.stock && (
                        <p className="text-xs text-destructive">
                          {errors.variants[index].stock?.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fields.length > 1 && remove(index)}
                        disabled={fields.length <= 1}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Images (shown in edit mode when product exists, otherwise show staging) */}
          {isEditing && productId ? (
            <ProductImages productId={productId} images={existingImages} />
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Images (Upload at least 3, maximum 8) <span className="text-red-500">*</span></CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => stagerFileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Select Images
                </Button>
                <input
                  ref={stagerFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleStagingChange}
                  className="hidden"
                />
              </CardHeader>
              <CardContent>
                {selectedFiles.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      No images selected yet. Click select to add.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square rounded-lg overflow-hidden border"
                      >
                        <Image
                          src={previewUrls[idx] || ""}
                          alt="Staged"
                          width={200}
                          height={200}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                        {primaryIndex === idx && (
                          <div className="absolute top-1 left-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                              <Star className="h-3 w-3" />
                              Primary
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {primaryIndex !== idx && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setPrimaryIndex(idx)}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Primary
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveStaged(idx)}
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
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={useWatch({ control, name: "isActive" })}
                  onCheckedChange={(v) => setValue("isActive", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isFeatured">Featured</Label>
                <Switch
                  id="isFeatured"
                  checked={useWatch({ control, name: "isFeatured" })}
                  onCheckedChange={(v) => setValue("isFeatured", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isNew">New Arrival</Label>
                <Switch
                  id="isNew"
                  checked={useWatch({ control, name: "isNew" })}
                  onCheckedChange={(v) => setValue("isNew", v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                      ? "Update Product"
                      : "Create Product"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => router.back()}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
