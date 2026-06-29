"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Package, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  getDeletedProducts,
  restoreProduct,
} from "@/lib/adminActions/product-actions";
import { formatCurrency } from "@/lib/utils";

interface DeletedProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  basePrice: number;
  salePrice: number;
  imageUrl: string | null;
  updatedAt: Date;
}

export default function ProductsTrashPage() {
  const router = useRouter();
  const [products, setProducts] = useState<DeletedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore state
  const [selectedProduct, setSelectedProduct] = useState<DeletedProduct | null>(
    null,
  );
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const data = await getDeletedProducts();
      setProducts(data);
    } catch {
      toast.error("Failed to fetch trash products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await getDeletedProducts();
        if (!ignore) {
          setProducts(data);
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          toast.error("Failed to fetch trash products");
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRestore = async () => {
    if (!selectedProduct) return;
    try {
      const res = await restoreProduct(selectedProduct.id);
      if (res.success) {
        toast.success(
          `Product "${selectedProduct.name}" restored successfully`,
        );
        fetchDeleted();
        router.refresh();
      } else {
        toast.error(res.error || "Failed to restore product");
      }
    } catch {
      toast.error("Failed to restore product");
    } finally {
      setSelectedProduct(null);
    }
  };

  const columns: DataTableColumn<DeletedProduct>[] = [
    {
      header: "Product",
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <Image
              src={row.imageUrl}
              alt={row.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-cover bg-muted"
              unoptimized
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Package className="h-4 w-4 text-muted-foreground" />
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
      header: "Category",
      cell: (row) => (
        <span className="text-sm text-foreground">{row.category}</span>
      ),
    },
    {
      header: "Price",
      cell: (row) => (
        <div>
          <p className="font-semibold text-sm text-foreground">
            {formatCurrency(row.salePrice)}
          </p>
          {row.basePrice > row.salePrice && (
            <p className="text-xs text-muted-foreground line-through">
              {formatCurrency(row.basePrice)}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Deleted At",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.updatedAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "w-28 text-right",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs flex items-center gap-1 ml-auto"
          onClick={() => {
            setSelectedProduct(row);
            setRestoreDialogOpen(true);
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restore
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products Trash"
        description="View and restore soft-deleted products. Restored products will return to inactive status."
      >
        <Button variant="outline" size="sm" asChild>
          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Products
          </Link>
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        emptyTitle="Trash is empty"
        emptyDescription="There are no soft-deleted products."
      />

      <ConfirmDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title="Restore Product"
        description={
          selectedProduct
            ? `Are you sure you want to restore "${selectedProduct.name}"? It will be active in your store management but marked inactive for clients by default.`
            : ""
        }
        confirmText="Restore"
        onConfirm={handleRestore}
        variant="default"
      />
    </div>
  );
}
