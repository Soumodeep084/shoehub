import { getCategories } from "@/lib/adminActions/product-actions";
import { ProductForm } from "@/components/admin/products/product-form";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black">Add Product</h1>
        <p className="text-muted-foreground">
          Create a new product with variants.
        </p>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
