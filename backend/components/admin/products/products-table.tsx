"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "../data-table";
import { ConfirmDialog } from "../confirm-dialog";
import { StatusBadge } from "../status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { deleteProduct, toggleProductActive } from "@/lib/adminActions/product-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import Image from "next/image";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  basePrice: number;
  salePrice: number;
  discountPercent: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  imageUrl: string | null;
  variantCount: number;
  orderCount: number;
  soldCount: number;
  createdAt: Date;
}

interface ProductsTableProps {
  products: ProductRow[];
  pageCount: number;
  currentPage: number;
  total: number;
}

export function ProductsTable({
  products,
  pageCount,
  currentPage,
}: ProductsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending] = useTransition();

  // Sorting state from URL
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

  // Deletion state
  const [deleteProductItem, setDeleteProductItem] = useState<ProductRow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleSort = (key: string, order: "asc" | "desc") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", key);
    params.set("sortOrder", order);
    params.set("page", "1"); // Reset to page 1 on sort
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleToggleActive = async (productId: string, name: string, currentVal: boolean) => {
    try {
      const res = await toggleProductActive(productId, !currentVal);
      if (res.success) {
        toast.success(`Product "${name}" is now ${!currentVal ? "enabled" : "disabled"}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update product status");
      }
    } catch {
      toast.error("Failed to update product status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductItem) return;
    try {
      const res = await deleteProduct(deleteProductItem.id);
      if (res.success) {
        toast.success(`Product "${deleteProductItem.name}" has been soft-deleted`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete product");
      }
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleteProductItem(null);
    }
  };

  const columns: DataTableColumn<ProductRow>[] = [
    {
      header: "Product",
      sortKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <Image
              width={40}
              height={40}
              src={row.imageUrl}
              alt={row.name}
              className="h-10 w-10 rounded-lg object-cover bg-muted"
              unoptimized
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground text-sm leading-tight">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.brand}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (row) => <span className="text-sm text-foreground">{row.category}</span>,
    },
    {
      header: "Price",
      sortKey: "salePrice",
      cell: (row) => (
        <div>
          <p className="font-semibold text-sm text-foreground">{formatCurrency(row.salePrice)}</p>
          {row.discountPercent > 0 && (
            <p className="text-xs text-muted-foreground line-through">{formatCurrency(row.basePrice)}</p>
          )}
        </div>
      ),
    },
    {
      header: "Sold",
      sortKey: "soldCount",
      cell: (row) => <span className="text-sm text-foreground font-medium">{row.soldCount} units</span>,
    },
    {
      header: "Variants",
      cell: (row) => <span className="text-xs font-mono text-muted-foreground">{row.variantCount} sizes</span>,
    },
    {
      header: "Status",
      className: "w-32",
      cell: (row) => (
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <Switch
            id={`switch-${row.id}`}
            checked={row.isActive}
            onCheckedChange={() => handleToggleActive(row.id, row.name, row.isActive)}
          />
          <StatusBadge type="active" value={row.isActive} />
        </div>
      ),
    },
    {
      header: "Created",
      sortKey: "createdAt",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "w-14 text-right",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/admin/products/${row.id}`} className="flex items-center">
                <Eye className="mr-2 h-3.5 w-3.5" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/admin/products/${row.id}/edit`} className="flex items-center">
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setDeleteProductItem(row);
                setDeleteDialogOpen(true);
              }}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={products}
        loading={isPending}
        currentPage={currentPage}
        pageCount={pageCount}
        onPageChange={handlePageChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyTitle="No products found"
        emptyDescription="Get started by adding your first product or adjusting filters."
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description={
          deleteProductItem
            ? `Are you sure you want to soft-delete "${deleteProductItem.name}"? This will disable the product on the store. You can restore it from the Trash page later.`
            : ""
        }
        confirmText="Delete Product"
        onConfirm={handleDeleteConfirm}
        requiresVerification={true}
        dependencies={[
          "All sizes and SKUs under this product will be hidden.",
          "Related customer wishlist entries will be hidden from their profiles.",
        ]}
        variant="destructive"
      />
    </>
  );
}
