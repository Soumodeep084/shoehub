"use server";

import { prisma } from "@/lib/prisma";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validators/category";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

export async function getAllCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    imageUrl: cat.imageUrl,
    isActive: cat.isActive,
    productCount: cat._count.products,
    createdAt: cat.createdAt,
  }));
}

export async function createCategory(data: CategoryFormValues) {
  const parsed = categoryFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const slug = slugify(parsed.data.name, { lower: true, strict: true, trim: true });

  const existing = await prisma.category.findUnique({
    where: { slug },
  });
  if (existing) {
    return { error: { name: ["A category with this name already exists"] } };
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  return { success: true, categoryId: category.id };
}

export async function updateCategory(id: string, data: CategoryFormValues) {
  const parsed = categoryFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.category.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${id}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function uploadCategoryImage(formData: FormData) {
  const file = formData.get("file") as File;
  const categoryId = formData.get("categoryId") as string;

  if (!file || !categoryId) {
    return { error: "Missing file or category ID" };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Invalid file type" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "Image must be under 5 MB" };
  }

  const ext = file.name.split(".").pop();
  const fileName = `${randomUUID()}.${ext}`;
  const path = `${categoryId}/${fileName}`;

  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("category-images")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = supabaseAdmin.storage
    .from("category-images")
    .getPublicUrl(path);

  await prisma.category.update({
    where: { id: categoryId },
    data: { imageUrl: data.publicUrl },
  });

  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${categoryId}`);
  return { success: true, imageUrl: data.publicUrl };
}

export async function deleteCategory(id: string) {
  try {
    await prisma.$transaction([
      prisma.category.update({
        where: { id },
        data: { isDeleted: true, isActive: false },
      }),
      prisma.product.updateMany({
        where: { categoryId: id },
        data: { isActive: false },
      }),
    ]);

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return { error: message };
  }
}

export async function restoreCategory(id: string) {
  try {
    await prisma.category.update({
      where: { id },
      data: { isDeleted: false },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/categories/trash");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to restore category";
    return { error: message };
  }
}

export async function getDeletedCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { isDeleted: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      isActive: cat.isActive,
      productCount: cat._count.products,
      updatedAt: cat.updatedAt,
    }));
  } catch (error) {
    console.error("Get deleted categories error:", error);
    return [];
  }
}

export async function toggleCategoryActive(id: string, isActive: boolean) {
  try {
    if (!isActive) {
      await prisma.$transaction([
        prisma.category.update({
          where: { id },
          data: { isActive },
        }),
        prisma.product.updateMany({
          where: { categoryId: id },
          data: { isActive: false },
        }),
      ]);
    } else {
      await prisma.category.update({
        where: { id },
        data: { isActive },
      });
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/categories/${id}`);
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update category status";
    return { error: message };
  }
}
