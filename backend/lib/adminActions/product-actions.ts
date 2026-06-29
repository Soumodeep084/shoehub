"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { productFormSchema, type ProductFormValues } from "@/lib/validators/product";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { generateSlug, generateSKU } from "@/lib/utils";

interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getProducts({
  page = 1,
  limit = 10,
  search,
  categoryId,
  status,
  sortBy,
  sortOrder = "desc",
}: GetProductsParams = {}) {
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId && categoryId !== "all") {
    where.categoryId = categoryId;
  }

  if (status === "active") where.isActive = true;
  else if (status === "inactive") where.isActive = false;
  else if (status === "featured") where.isFeatured = true;
  else if (status === "new-arrivals") where.isNew = true;
  else if (status === "out-of-stock") where.variants = { none: { stock: { gt: 0 } } };

  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy.createdAt = "desc";
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { variants: true, orderItems: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      category: p.category.name,
      basePrice: Number(p.basePrice),
      salePrice: Number(p.salePrice),
      discountPercent: p.discountPercent,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      averageRating: Number(p.averageRating),
      ratingCount: p.ratingCount,
      isNew: p.isNew,
      imageUrl: p.images[0]?.imageUrl ?? null,
      variantCount: p._count.variants,
      orderCount: p._count.orderItems,
      soldCount: p.soldCount,
      createdAt: p.createdAt,
    })),
    total,
    pageCount: Math.ceil(total / limit),
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!product) return null;

  return {
    ...product,
    basePrice: Number(product.basePrice),
    salePrice: Number(product.salePrice),
    averageRating: Number(product.averageRating),
  };
}

export async function createProduct(data: ProductFormValues) {
  const parsed = productFormSchema.safeParse(data);

  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const { variants, ...productData } = parsed.data;

  // Generate unique slug
  let slug = generateSlug(productData.name);

  for (let i = 0; i < 3; i++) {
    const existing = await prisma.product.findUnique({
      where: {
        slug,
      },
    });

    if (!existing) break;

    slug = generateSlug(productData.name);
  }

  // Generate unique SKU for every variant
  const variantsWithSku = [];

  for (const variant of variants) {
    let sku = generateSKU(
      productData.brand,
      variant.size,
      variant.color
    );

    for (let i = 0; i < 3; i++) {
      const existingSku = await prisma.productVariant.findUnique({
        where: {
          sku,
        },
      });

      if (!existingSku) break;

      sku = generateSKU(
        productData.brand,
        variant.size,
        variant.color
      );
    }

    variantsWithSku.push({
      ...variant,
      sku,
    });
  }

  const product = await prisma.product.create({
    data: {
      ...productData,
      slug,
      variants: {
        create: variantsWithSku.map((variant) => ({
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          stock: variant.stock,
        })),
      },
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin");

  return {
    success: true,
    productId: product.id,
  };
}

export async function updateProduct(id: string, data: ProductFormValues) {
  const parsed = productFormSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { variants, ...productData } = parsed.data;

  await prisma.$transaction(async (tx) => {
    // Update product (slug is never updated)
    await tx.product.update({
      where: { id },
      data: productData,
    });

    // Get existing variant IDs
    const existingVariants = await tx.productVariant.findMany({
      where: { productId: id },
      select: { id: true },
    });

    const existingIds = new Set(existingVariants.map((v) => v.id));

    // Separate into update vs create
    const toUpdate = variants.filter(
      (v) => v.id && existingIds.has(v.id)
    );

    const toCreate = variants.filter((v) => !v.id);

    const incomingIds = new Set(
      variants.filter((v) => v.id).map((v) => v.id!)
    );

    const toDelete = [...existingIds].filter(
      (id) => !incomingIds.has(id)
    );

    // Delete removed variants
    if (toDelete.length > 0) {
      await tx.productVariant.deleteMany({
        where: {
          id: {
            in: toDelete,
          },
        },
      });
    }

    // Update existing variants
    for (const v of toUpdate) {
      await tx.productVariant.update({
        where: {
          id: v.id,
        },
        data: {
          size: v.size,
          color: v.color,
          stock: v.stock,
        },
      });
    }

    // Create new variants
    if (toCreate.length > 0) {
      for (const v of toCreate) {
        let sku = generateSKU(productData.brand, v.size, v.color);

        for (let i = 0; i < 3; i++) {
          const existingSku = await tx.productVariant.findUnique({
            where: { sku },
          });

          if (!existingSku) break;

          sku = generateSKU(productData.brand, v.size, v.color);
        }

        await tx.productVariant.create({
          data: {
            productId: id,
            size: v.size,
            color: v.color,
            stock: v.stock,
            sku,
          },
        });
      }
    }
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/admin");

  return { success: true };
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete product" };
  }
}

export async function restoreProduct(id: string) {
  try {
    await prisma.product.update({
      where: { id },
      data: { isDeleted: false },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/products/trash");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to restore product" };
  }
}

export async function getDeletedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: true },
      include: {
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      category: p.category.name,
      basePrice: Number(p.basePrice),
      salePrice: Number(p.salePrice),
      imageUrl: p.images[0]?.imageUrl ?? null,
      updatedAt: p.updatedAt,
    }));
  } catch (error: any) {
    console.error("Get deleted products error:", error);
    return [];
  }
}

export async function toggleProductActive(id: string, isActive: boolean) {
  try {
    await prisma.product.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update product status" };
  }
}

export async function uploadProductImage(formData: FormData) {
  const file = formData.get("file") as File;
  const productId = formData.get("productId") as string;
  const isPrimary = formData.get("isPrimary") === "true";

  if (!file || !productId) {
    return { error: "Missing file or product ID" };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Invalid file type" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "Image must be under 5 MB" };
  }

  const ext = file.name.split(".").pop();
  const fileName = `${randomUUID()}.${ext}`;
  const path = `${productId}/${fileName}`;

  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("product-images")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = supabaseAdmin.storage
    .from("product-images")
    .getPublicUrl(path);

  // If marking as primary, unset existing primaries
  if (isPrimary) {
    await prisma.productImage.updateMany({
      where: { productId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const maxSort = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const image = await prisma.productImage.create({
    data: {
      productId,
      imageUrl: data.publicUrl,
      storagePath: path,
      isPrimary,
      sortOrder: (maxSort?.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath(`/admin/products/${productId}/edit`);
  return { success: true, image };
}

export async function deleteProductImage(imageId: string) {
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
  });

  if (!image) return { error: "Image not found" };

  await supabaseAdmin.storage
    .from("product-images")
    .remove([image.storagePath]);

  await prisma.productImage.delete({ where: { id: imageId } });

  // If deleted image was primary, set the first remaining image as primary
  if (image.isPrimary) {
    const firstImage = await prisma.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: { sortOrder: "asc" },
    });
    if (firstImage) {
      await prisma.productImage.update({
        where: { id: firstImage.id },
        data: { isPrimary: true },
      });
    }
  }

  revalidatePath(`/admin/products/${image.productId}/edit`);
  return { success: true };
}

export async function setPrimaryImage(imageId: string, productId: string) {
  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId, isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    }),
  ]);

  revalidatePath(`/admin/products/${productId}/edit`);
  return { success: true };
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
