"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Ticket, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  getDeletedCoupons,
  restoreCoupon,
} from "@/lib/adminActions/coupon-actions";
import { formatCurrency } from "@/lib/utils";

interface DeletedCoupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  actualUsageCount: number;
  updatedAt: Date;
}

export default function CouponsTrashPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<DeletedCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore state
  const [selectedCoupon, setSelectedCoupon] = useState<DeletedCoupon | null>(
    null,
  );
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const data = await getDeletedCoupons();
      setCoupons(data);
    } catch {
      toast.error("Failed to fetch trash coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await getDeletedCoupons();
        if (!ignore) {
          setCoupons(data);
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          toast.error("Failed to fetch trash coupons");
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
    if (!selectedCoupon) return;
    try {
      const res = await restoreCoupon(selectedCoupon.id);
      if (res.success) {
        toast.success(`Coupon "${selectedCoupon.code}" restored successfully`);
        fetchDeleted();
        router.refresh();
      } else {
        toast.error(res.error || "Failed to restore coupon");
      }
    } catch {
      toast.error("Failed to restore coupon");
    } finally {
      setSelectedCoupon(null);
    }
  };

  const columns: DataTableColumn<DeletedCoupon>[] = [
    {
      header: "Coupon Code",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-mono font-bold text-foreground text-sm uppercase">
              {row.code}
            </p>
            {row.description && (
              <p className="text-xs text-muted-foreground truncate max-w-50">
                {row.description}
              </p>
            )}
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
      header: "Total Usages",
      cell: (row) => (
        <span className="text-sm text-foreground">
          {row.actualUsageCount} usages
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
            setSelectedCoupon(row);
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
        title="Coupons Trash"
        description="View and restore soft-deleted coupons. Restored coupons will return in inactive state."
      >
        <Button variant="outline" size="sm" asChild>
          <Link
            href="/admin/coupons"
            className="flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Coupons
          </Link>
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={coupons}
        loading={loading}
        emptyTitle="Trash is empty"
        emptyDescription="There are no soft-deleted coupons."
      />

      <ConfirmDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title="Restore Coupon"
        description={
          selectedCoupon
            ? `Are you sure you want to restore coupon "${selectedCoupon.code}"? It will become active for checkout operations if it has not expired.`
            : ""
        }
        confirmText="Restore"
        onConfirm={handleRestore}
        variant="default"
      />
    </div>
  );
}
