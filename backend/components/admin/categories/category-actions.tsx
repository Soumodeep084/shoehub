"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { deleteCategory } from "@/lib/adminActions/category-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  productCount: number;
}

interface CategoryActionsProps {
  editCategory: CategoryData;
}

export function CategoryActions({ editCategory }: CategoryActionsProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDelete() {
    try {
      const result = await deleteCategory(editCategory.id);
      if ("error" in result && result.error) {
        toast.error(result.error as string);
      } else {
        toast.success(`Category "${editCategory.name}" has been soft-deleted`);
        router.refresh();
      }
    } catch {
      toast.error("Failed to delete category");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href={`/admin/categories/${editCategory.id}`}
              className="flex items-center"
            >
              <Eye className="mr-2 h-3.5 w-3.5" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href={`/admin/categories/${editCategory.id}/edit`}
              className="flex items-center"
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Category"
        description={`Are you sure you want to soft-delete category "${editCategory.name}"? This will hide the category from customer catalogs. You can restore it from the Trash page.`}
        confirmText="Delete Category"
        onConfirm={handleDelete}
        requiresVerification={true}
        dependencies={[
          `Automatically deactivates all ${editCategory.productCount} product(s) currently nested under this category.`,
          "Restoring the category will NOT automatically reactivate those products.",
        ]}
        variant="destructive"
      />
    </>
  );
}
