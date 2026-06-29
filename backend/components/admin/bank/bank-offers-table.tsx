"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, Pencil, Trash2, Eye } from "lucide-react";
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
import { toggleBankOfferActive } from "@/lib/adminActions/coupon-actions";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BankOfferRow {
  id: string;
  bankName: string;
  cardType: string | null;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  isActive: boolean;
  expiresAt: Date | string | null;
  createdAt: Date;
}

interface BankOffersTableProps {
  offers: BankOfferRow[];
}

export function BankOffersTable({ offers }: BankOffersTableProps) {
  const router = useRouter();
  const [isPending] = useTransition();

  // Deletion state
  const [deleteOfferItem, setDeleteOfferItem] = useState<BankOfferRow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleToggleActive = async (offerId: string, bankName: string, currentVal: boolean) => {
    try {
      const res = await toggleBankOfferActive(offerId, !currentVal);
      if (res.success) {
        toast.success(`Bank offer for "${bankName}" is now ${!currentVal ? "enabled" : "disabled"}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update offer status");
      }
    } catch {
      toast.error("Failed to update offer status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOfferItem) return;
    try {
      const res = await fetch(`/api/admin/bank-offers/${deleteOfferItem.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Bank offer for "${deleteOfferItem.bankName}" has been soft-deleted`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Failed to delete bank offer");
      }
    } catch {
      toast.error("Failed to delete bank offer");
    } finally {
      setDeleteOfferItem(null);
    }
  };

  const columns: DataTableColumn<BankOfferRow>[] = [
    {
      header: "Bank & Card",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-muted border">
            <CreditCard className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm leading-tight">{row.bankName}</p>
            <p className="text-xs text-muted-foreground">{row.cardType || "All Cards"}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Description",
      cell: (row) => (
        <span className="text-xs text-muted-foreground truncate block max-w-50" title={row.description}>
          {row.description}
        </span>
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
            onCheckedChange={() => handleToggleActive(row.id, row.bankName, row.isActive)}
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
              <Link href={`/admin/bank-offers/${row.id}`} className="flex items-center">
                <Eye className="mr-2 h-3.5 w-3.5" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/admin/bank-offers/${row.id}/edit`} className="flex items-center">
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setDeleteOfferItem(row);
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
        data={offers}
        loading={isPending}
        emptyTitle="No bank offers found"
        emptyDescription="Get started by creating your first card promotion offer."
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Bank Offer"
        description={
          deleteOfferItem
            ? `Are you sure you want to soft-delete the bank offer for "${deleteOfferItem.bankName}"? It will immediately stop appearing at checkout. You can restore it from the Trash page later.`
            : ""
        }
        confirmText="Delete Offer"
        onConfirm={handleDeleteConfirm}
        requiresVerification={true}
        dependencies={[
          "Ongoing client carts claiming this promotion will lose the discount on checkout.",
          "This offer rules snapshot will remain saved in historical paid order receipt logs.",
        ]}
        variant="destructive"
      />
    </>
  );
}
