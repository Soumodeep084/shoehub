"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, FolderTree, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  getDeletedCategories,
  restoreCategory,
} from "@/lib/adminActions/category-actions";

interface DeletedCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
  updatedAt: Date;
}

export default function CategoriesTrashPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<DeletedCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore state
  const [selectedCategory, setSelectedCategory] =
    useState<DeletedCategory | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const data = await getDeletedCategories();
      setCategories(data);
    } catch {
      toast.error("Failed to fetch trash categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await getDeletedCategories();
        if (!ignore) {
          setCategories(data);
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          toast.error("Failed to fetch trash categories");
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
    if (!selectedCategory) return;
    try {
      const res = await restoreCategory(selectedCategory.id);
      if (res.success) {
        toast.success(
          `Category "${selectedCategory.name}" restored successfully`,
        );
        fetchDeleted();
        router.refresh();
      } else {
        toast.error(res.error || "Failed to restore category");
      }
    } catch {
      toast.error("Failed to restore category");
    } finally {
      setSelectedCategory(null);
    }
  };

  const columns: DataTableColumn<DeletedCategory>[] = [
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FolderTree className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground text-sm leading-tight">
              {row.name}
            </p>
            {row.description && (
              <p className="text-xs text-muted-foreground truncate max-w-xs">
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
      header: "Inactive Products",
      cell: (row) => (
        <span className="text-sm text-foreground">
          {row.productCount} product{row.productCount !== 1 ? "s" : ""}
        </span>
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
            setSelectedCategory(row);
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
        title="Categories Trash"
        description="View and restore soft-deleted categories. Products originally linked will remain in inactive status."
      >
        <Button variant="outline" size="sm" asChild>
          <Link
            href="/admin/categories"
            className="flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Categories
          </Link>
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        emptyTitle="Trash is empty"
        emptyDescription="There are no soft-deleted categories."
      />

      <ConfirmDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title="Restore Category"
        description={
          selectedCategory
            ? `Are you sure you want to restore category "${selectedCategory.name}"? This will make the category available for filtering and products linking again.`
            : ""
        }
        confirmText="Restore"
        onConfirm={handleRestore}
        variant="default"
      />
    </div>
  );
}
