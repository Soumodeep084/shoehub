"use client";

import { useTransition } from "react";
import { FolderTree } from "lucide-react";
import Image from "next/image";
import { DataTable, type DataTableColumn } from "../data-table";
import { CategoryActions } from "./category-actions";
import { CategoryStatusToggle } from "./category-status-toggle";
import { formatDate } from "@/lib/utils";

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

interface CategoriesTableProps {
  categories: CategoryRow[];
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const [isPending] = useTransition();

  const columns: DataTableColumn<CategoryRow>[] = [
    {
      header: "Category",
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border">
              <FolderTree className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground text-sm leading-tight">
              {row.name}
            </p>
            {row.description && (
              <p className="text-xs text-muted-foreground truncate block max-w-50">
                {row.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Slug",
      cell: (row) => (
        <code className="text-xs font-mono text-muted-foreground">
          {row.slug}
        </code>
      ),
    },
    {
      header: "Active Products",
      cell: (row) => (
        <span className="text-sm font-medium text-foreground">
          {row.productCount} products
        </span>
      ),
    },
    {
      header: "Status",
      className: "w-32",
      cell: (row) => (
        <CategoryStatusToggle
          id={row.id}
          name={row.name}
          isActive={row.isActive}
        />
      ),
    },
    {
      header: "Created",
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
        <CategoryActions editCategory={row} />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={categories}
      loading={isPending}
      emptyTitle="No categories found"
      emptyDescription="Get started by creating your first product category."
    />
  );
}
