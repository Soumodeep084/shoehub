import { getAllCategories } from "@/lib/adminActions/category-actions";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { CategoriesTable } from "@/components/admin/categories/categories-table";
import Link from "next/link";
import { Trash2, Plus } from "lucide-react";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
  isActive: boolean;
  createdAt: Date;
}

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  const categoriesData: CategoryRow[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    imageUrl: cat.imageUrl,
    productCount: cat.productCount,
    isActive: cat.isActive,
    createdAt: cat.createdAt,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize shoes by activity, lifestyle segment, or sport collection."
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="h-9">
            <Link
              href="/admin/categories/trash"
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              View Trash
            </Link>
          </Button>
          <Button size="sm" asChild className="h-9 font-semibold text-xs">
            <Link href="/admin/categories/new">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Category
            </Link>
          </Button>
        </div>
      </PageHeader>

      <CategoriesTable categories={categoriesData} />
    </div>
  );
}
