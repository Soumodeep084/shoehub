import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Sparkles,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import { getProductById } from "@/lib/adminActions/product-actions";
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
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={`Manage details, variants, and images for ${product.brand} - ${product.category.name}.`}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              href="/admin/products"
              className="flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="flex items-center gap-1 text-xs"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Product
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gallery & Description Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Description</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground/95 leading-relaxed whitespace-pre-wrap">
              {product.description || "No description provided."}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Product Images
              </CardTitle>
              <CardDescription>
                Primary and supplementary images uploaded for this product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {product.images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed rounded-lg">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm">
                    No images uploaded for this product.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Primary Preview */}
                  {primaryImage && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                      <Image
                        fill
                        src={primaryImage.imageUrl}
                        alt={product.name}
                        className="object-contain p-4"
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        priority
                        unoptimized
                      />
                      <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded shadow-sm">
                        Primary
                      </span>
                    </div>
                  )}

                  {/* Thumbnail Row */}
                  {product.images.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {product.images.map((img) => (
                        <div
                          key={img.id}
                          className={`relative aspect-square rounded-md overflow-hidden border bg-muted transition-all ${
                            img.isPrimary
                              ? "ring-2 ring-primary ring-offset-2"
                              : ""
                          }`}
                        >
                          <Image
                            fill
                            src={img.imageUrl}
                            alt=""
                            className="object-cover"
                            sizes="100px"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status, Price & Variants Column */}
        <div className="space-y-6">
          {/* Overview Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">
                    Brand
                  </span>
                  <span className="font-semibold text-foreground">
                    {product.brand}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">
                    Category
                  </span>
                  <span className="font-semibold text-foreground">
                    {product.category.name}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">
                    Base Price
                  </span>
                  <span className="font-medium text-muted-foreground line-through">
                    {formatCurrency(product.basePrice)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">
                    Sale Price
                  </span>
                  <span className="font-bold text-foreground text-base">
                    {formatCurrency(product.salePrice)}
                  </span>
                </div>
              </div>

              {product.discountPercent > 0 && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-2.5 text-xs font-semibold flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-900/30">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  Discount of {product.discountPercent}% active on checkout
                </div>
              )}

              <hr className="border-border my-2" />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Store Status</span>
                  <StatusBadge type="active" value={product.isActive} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Featured Highlight
                  </span>
                  <StatusBadge
                    type="order"
                    value={product.isFeatured ? "Confirmed" : "Pending"}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    New Arrival Badge
                  </span>
                  <StatusBadge
                    type="role"
                    value={product.isNew ? "Admin" : "User"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants & Stock */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Variants & Stock</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Total Stock:{" "}
                  {product.variants.reduce((acc, curr) => acc + curr.stock, 0)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {product.variants.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  No variants defined for this product.
                </p>
              ) : (
                <div className="divide-y divide-border border-t border-b border-border">
                  {product.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex justify-between items-center p-3.5 hover:bg-muted/10 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-foreground">
                          Size: {variant.size} | Color: {variant.color}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          SKU: {variant.sku}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          variant.stock === 0
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                            : variant.stock < 5
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                              : "bg-muted text-foreground"
                        }`}
                      >
                        {variant.stock === 0
                          ? "Out of Stock"
                          : `${variant.stock} units`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
