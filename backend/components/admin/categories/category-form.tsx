"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Upload, X, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validators/category";
import { createCategory, updateCategory, uploadCategoryImage } from "@/lib/adminActions/category-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormInput, FormTextarea, FormSwitch } from "@/components/admin/form-components";

interface CategoryFormProps {
  initialData?: CategoryFormValues & { id?: string; imageUrl?: string | null };
}

export function CategoryForm({ initialData }: CategoryFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!initialData?.id;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CategoryFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(categoryFormSchema) as any,
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      imageUrl: initialData?.imageUrl ?? "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = form;

  const isActiveValue = useWatch({
    control,
    name: "isActive"
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveStaged = () => {
    if (selectedFile && previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(initialData?.imageUrl || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function onSubmit(data: CategoryFormValues) {
    setSubmitting(true);
    try {
      const result = isEditing
        ? await updateCategory(initialData.id!, data)
        : await createCategory(data);

      if ("error" in result && result.error) {
        const errorObj = result.error;
        if (typeof errorObj === "object") {
          Object.entries(errorObj).forEach(([key, messages]) => {
            if (Array.isArray(messages)) {
              toast.error(`${key}: ${messages.join(", ")}`);
            }
          });
        } else if (typeof errorObj === "string") {
          toast.error(errorObj);
        }
        return;
      }

      // Handle image upload if a file is selected
      const categoryId = isEditing
        ? initialData.id!
        : (result as { success: boolean; categoryId?: string }).categoryId;
      if (selectedFile && categoryId) {
        toast.info("Uploading category image...");
        const formData = new FormData();
        formData.set("file", selectedFile);
        formData.set("categoryId", categoryId);

        const uploadRes = await uploadCategoryImage(formData);
        if ("error" in uploadRes && uploadRes.error) {
          toast.error(`Failed to upload category image: ${uploadRes.error}`);
        }
      }

      toast.success(isEditing ? "Category updated successfully" : "Category created successfully");
      router.push("/admin/categories");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {isEditing ? "Edit Category" : "New Category"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEditing ? "Modify category metadata and image settings." : "Add a new product category to catalogs."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Category Information</CardTitle>
              <CardDescription className="text-xs">Provide details for this category.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormInput
                label="Category Name"
                placeholder="e.g. Running Shoes"
                required
                error={errors.name?.message}
                {...register("name")}
              />

              <FormTextarea
                label="Description"
                placeholder="Describe the items in this product group..."
                error={errors.description?.message}
                {...register("description")}
              />
            </CardContent>
          </Card>

          {/* Category Image Stager */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Category Image</CardTitle>
                <CardDescription className="text-xs">Upload a thumbnail image for this category catalog.</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs"
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Choose Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                <div className="relative w-48 h-48 rounded-lg overflow-hidden border bg-muted group">
                  <Image
                    src={previewUrl}
                    alt="Category image preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveStaged}
                      className="h-8 px-3"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-10 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <ImageIcon className="h-8 w-8 mb-2 opacity-40 text-muted-foreground" />
                  <p className="text-xs">No image uploaded. Click &apos;Choose Image&apos; to pick.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormSwitch
                label="Active Status"
                description="Show this category in product catalog filters."
                checked={isActiveValue}
                onCheckedChange={(val) => setValue("isActive", val)}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={submitting} className="w-full font-semibold">
                  {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Category"}
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
