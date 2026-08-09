import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { getProducts, getCategories } from "@/lib/adminActions/product-actions";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { ExportButtons } from "@/components/admin/dashboard/export-buttons";
import { ProductFilters } from "@/components/admin/products/product-filters";
import { ProductsTable } from "@/components/admin/products/products-table";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    categoryId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const sortBy = params.sortBy || "createdAt";
  const sortOrder = (params.sortOrder || "desc") as "asc" | "desc";

  const [{ products, total, pageCount }, categories] = await Promise.all([
    getProducts({
      page,
      limit: 10,
      search: params.search,
      categoryId: params.categoryId,
      status: params.status,
      sortBy,
      sortOrder,
    }),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage shoe catalogue, inventory stocks, prices, and features."
      >
        <div className="flex gap-2">
          <ExportButtons
            entity="products"
            params={{
              search: params.search,
              categoryId: params.categoryId,
              status: params.status,
              sortBy,
              sortOrder,
            }}
          />
          <Button variant="outline" size="sm" asChild className="h-9">
            <Link
              href="/admin/products/trash"
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              View Trash
            </Link>
          </Button>
          <Button size="sm" asChild className="h-9">
            <Link
              href="/admin/products/new"
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </PageHeader>

      <ProductFilters categories={categories} />

      <ProductsTable
        products={products}
        pageCount={pageCount}
        currentPage={page}
        total={total}
      />
    </div>
  );
}
