import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FolderTree } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { CategoryProductsTable } from "@/components/admin/categories/categories-product-table";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  salePrice: number;
  isActive: boolean;
  imageUrl: string | null;
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      products: {
        where: { isDeleted: false },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!category || category.isDeleted) {
    notFound();
  }

  const productsData: ProductRow[] = category.products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    salePrice: Number(p.salePrice),
    isActive: p.isActive,
    imageUrl: p.images[0]?.imageUrl ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Category: ${category.name}`}
        description={`Details and related products under this category.`}
      >
        <Button variant="outline" size="sm" asChild>
          <Link
            href="/admin/categories"
            className="flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Categories
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category Profile */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Category Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {category.imageUrl ? (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted mb-4">
                <Image
                  fill
                  src={category.imageUrl}
                  alt={category.name}
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-muted border border-dashed mb-4">
                <FolderTree className="h-10 w-10 text-muted-foreground" />
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">
                  Name
                </span>
                <span className="font-semibold text-foreground">
                  {category.name}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">
                  Slug
                </span>
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                  {category.slug}
                </code>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">
                  Description
                </span>
                <span className="text-foreground leading-relaxed">
                  {category.description || "No description provided."}
                </span>
              </div>
              <hr className="border-border my-2" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge type="active" value={category.isActive} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Products under {category.name}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {productsData.length} active products
              </span>
            </CardTitle>
            <CardDescription>
              Products associated with this category that are not soft-deleted.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <CategoryProductsTable products={productsData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
