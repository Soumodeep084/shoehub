import { z } from "zod";

export const variantSchema = z.object({
  id: z.string().optional(),
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or more"),
});

export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().min(1, "Description is required"),
  brand: z.string().min(1, "Brand is required").max(100),
  categoryId: z.string().min(1, "Category is required"),
  basePrice: z.coerce.number().positive("Base price must be positive"),
  salePrice: z.coerce.number().positive("Sale price must be positive"),
  discountPercent: z.coerce.number().int().min(0).max(100),
  isFeatured: z.boolean(),
  isNew: z.boolean(),
  isActive: z.boolean(),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type VariantFormValues = z.infer<typeof variantSchema>;
