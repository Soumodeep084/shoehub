"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Ticket, Pencil, Trash2, Eye } from "lucide-react";
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
import { toggleCouponActive } from "@/lib/adminActions/coupon-actions";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  isActive: boolean;
  expiresAt: Date | string | null;
  actualUsageCount: number;
  createdAt: Date;
  category: {
    id: string;
    name: string;
  } | null;
}

interface CouponsTableProps {
  coupons: CouponRow[];
}

export function CouponsTable({ coupons }: CouponsTableProps) {
  const router = useRouter();
  const [isPending] = useTransition();

  // Deletion state
  const [deleteCouponItem, setDeleteCouponItem] = useState<CouponRow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleToggleActive = async (couponId: string, code: string, currentVal: boolean) => {
    try {
      const res = await toggleCouponActive(couponId, !currentVal);
      if (res.success) {
        toast.success(`Coupon "${code}" is now ${!currentVal ? "enabled" : "disabled"}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update coupon status");
      }
    } catch {
      toast.error("Failed to update coupon status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCouponItem) return;
    try {
      const res = await fetch(`/api/admin/coupons/${deleteCouponItem.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Coupon "${deleteCouponItem.code}" has been soft-deleted`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Failed to delete coupon");
      }
    } catch {
      toast.error("Failed to delete coupon");
    } finally {
      setDeleteCouponItem(null);
    }
  };

  const columns: DataTableColumn<CouponRow>[] = [
    {
      header: "Coupon Code",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-muted border">
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-mono font-bold text-foreground text-sm uppercase">{row.code}</p>
            {row.description && (
              <p className="text-xs text-muted-foreground truncate block max-w-50">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Discount",
      cell: (row) => (
        <span className="text-sm font-medium text-foreground">
          {row.discountType === "PERCENTAGE" ? (
            `${row.discountValue}%`
          ) : (
            formatCurrency(row.discountValue)
          )}
        </span>
      ),
    },
    {
      header: "Min Order",
      cell: (row) => <span className="text-sm text-foreground">{formatCurrency(row.minOrderAmount)}</span>,
    },
    {
      header: "Usages",
      cell: (row) => <span className="text-sm text-foreground">{row.actualUsageCount} uses</span>,
    },
    {
      header: "Category",
      cell: (row) => (
        <span className="text-sm text-foreground">
          {row.category?.id ? row.category.name : "All Categories"}
        </span>
      ),
    },
    {
      header: "Expiry Date",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.expiresAt ? formatDate(row.expiresAt) : "Never"}
        </span>
      ),
    },
    {
      header: "Status",
      className: "w-32",
      cell: (row) => (
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <Switch
            id={`switch-${row.id}`}
            checked={row.isActive}
            onCheckedChange={() => handleToggleActive(row.id, row.code, row.isActive)}
          />
          <StatusBadge type="active" value={row.isActive} expiresAt={row.expiresAt} />
        </div>
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
              <Link href={`/admin/coupons/${row.id}`} className="flex items-center">
                <Eye className="mr-2 h-3.5 w-3.5" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/admin/coupons/${row.id}/edit`} className="flex items-center">
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setDeleteCouponItem(row);
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
        data={coupons}
        loading={isPending}
        emptyTitle="No coupons found"
        emptyDescription="Get started by creating your first promotional coupon."
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Coupon"
        description={
          deleteCouponItem
            ? `Are you sure you want to soft-delete coupon code "${deleteCouponItem.code}"? New store checkouts will no longer be able to apply it. You can restore it from the Trash page later.`
            : ""
        }
        confirmText="Delete Coupon"
        onConfirm={handleDeleteConfirm}
        requiresVerification={true}
        dependencies={[
          "Any pending client orders using this coupon discount will keep their discount snapshot intact.",
          "This coupon code will immediately become invalid for new cart sessions.",
        ]}
        variant="destructive"
      />
    </>
  );
}
