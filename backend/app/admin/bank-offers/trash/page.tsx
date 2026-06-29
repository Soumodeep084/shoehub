"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  getDeletedBankOffers,
  restoreBankOffer,
} from "@/lib/adminActions/coupon-actions";
import { formatCurrency } from "@/lib/utils";

interface DeletedBankOffer {
  id: string;
  bankName: string;
  cardType: string | null;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  updatedAt: Date;
}

export default function BankOffersTrashPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<DeletedBankOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore state
  const [selectedOffer, setSelectedOffer] = useState<DeletedBankOffer | null>(
    null,
  );
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const data = await getDeletedBankOffers();
      setOffers(data);
    } catch {
      toast.error("Failed to fetch trash bank offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await getDeletedBankOffers();
        if (!ignore) {
          setOffers(data);
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          toast.error("Failed to fetch trash bank offers");
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
    if (!selectedOffer) return;
    try {
      const res = await restoreBankOffer(selectedOffer.id);
      if (res.success) {
        toast.success(
          `Bank offer for "${selectedOffer.bankName}" restored successfully`,
        );
        fetchDeleted();
        router.refresh();
      } else {
        toast.error(res.error || "Failed to restore bank offer");
      }
    } catch {
      toast.error("Failed to restore bank offer");
    } finally {
      setSelectedOffer(null);
    }
  };

  const columns: DataTableColumn<DeletedBankOffer>[] = [
    {
      header: "Bank & Card Type",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm leading-tight">
              {row.bankName}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.cardType || "All Cards"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Discount",
      cell: (row) => (
        <span className="text-sm font-medium text-foreground">
          {row.discountType === "PERCENTAGE"
            ? `${row.discountValue}%`
            : formatCurrency(row.discountValue)}
        </span>
      ),
    },
    {
      header: "Min Order",
      cell: (row) => (
        <span className="text-sm text-foreground">
          {formatCurrency(row.minOrderAmount)}
        </span>
      ),
    },
    {
      header: "Description",
      cell: (row) => (
        <span className="text-xs text-muted-foreground truncate block max-w-62.5">
          {row.description}
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
            setSelectedOffer(row);
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
        title="Bank Offers Trash"
        description="View and restore soft-deleted bank offers. Restored offers will return in inactive state."
      >
        <Button variant="outline" size="sm" asChild>
          <Link
            href="/admin/bank-offers"
            className="flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Bank Offers
          </Link>
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={offers}
        loading={loading}
        emptyTitle="Trash is empty"
        emptyDescription="There are no soft-deleted bank offers."
      />

      <ConfirmDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title="Restore Bank Offer"
        description={
          selectedOffer
            ? `Are you sure you want to restore the bank offer for "${selectedOffer.bankName}"? It will become available during checkout if it is enabled and has not expired.`
            : ""
        }
        confirmText="Restore"
        onConfirm={handleRestore}
        variant="default"
      />
    </div>
  );
}
