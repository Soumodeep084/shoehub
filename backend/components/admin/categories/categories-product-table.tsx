"use client";

import Image from "next/image";
import Link from "next/link";
import { Package, ExternalLink } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatCurrency } from "@/lib/utils";

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  salePrice: number;
  isActive: boolean;
  imageUrl: string | null;
}

const productColumns: DataTableColumn<ProductRow>[] = [
  {
    header: "Product",
    cell: (row) => (
      <div className="flex items-center gap-3">
        {row.imageUrl ? (
          <Image
            src={row.imageUrl}
            alt={row.name}
            width={36}
            height={36}
            className="h-9 w-9 rounded object-cover bg-muted"
            unoptimized
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded bg-muted">
            <Package className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-semibold text-foreground text-sm leading-tight">
            {row.name}
          </p>
          <p className="text-xs text-muted-foreground">{row.brand}</p>
        </div>
      </div>
    ),
  },
  {
    header: "Price",
    cell: (row) => (
      <span className="text-sm font-medium text-foreground">
        {formatCurrency(row.salePrice)}
      </span>
    ),
  },
  {
    header: "Status",
    cell: (row) => <StatusBadge type="active" value={row.isActive} />,
  },
  {
    header: "Actions",
    className: "w-20 text-right",
    cell: (row) => (
      <Button
        variant="ghost"
        size="icon"
        asChild
        className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground"
      >
        <Link href={`/admin/products/${row.id}`}>
          <ExternalLink className="h-4 w-4" />
        </Link>
      </Button>
    ),
  },
];

export function CategoryProductsTable({
  products,
}: {
  products: ProductRow[];
}) {
  return (
    <DataTable
      columns={productColumns}
      data={products}
      emptyTitle="No products"
      emptyDescription="No active products are assigned to this category."
    />
  );
}
