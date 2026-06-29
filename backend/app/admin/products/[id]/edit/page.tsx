import { notFound } from "next/navigation";
import {
  getProductById,
  getCategories,
} from "@/lib/adminActions/product-actions";
import { ProductForm } from "@/components/admin/products/product-form";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  const initialData = {
    name: product.name,
    slug: product.slug,
    description: product.description,
    brand: product.brand,
    categoryId: product.categoryId,
    basePrice: product.basePrice,
    salePrice: product.salePrice,
    discountPercent: product.discountPercent,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isActive: product.isActive,
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      sku: v.sku,
      stock: v.stock,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black">Edit Product</h1>
      </div>
      <ProductForm
        categories={categories}
        initialData={initialData}
        productId={product.id}
        existingImages={product.images.map((img) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          storagePath: img.storagePath,
          isPrimary: img.isPrimary,
          sortOrder: img.sortOrder,
        }))}
      />
    </div>
  );
}
