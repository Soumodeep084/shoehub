// components/admin/coupon-usage-table.tsx

"use client";

import { DataTable, DataTableColumn } from "@/components/admin/data-table";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { BankOfferUsageRow } from "@/types/admin/table-usages";
import Link from "next/link";

const columns: DataTableColumn<BankOfferUsageRow>[] = [
    {
        header: "Customer",
        cell: (row) => (
            <div>
                <p className="font-semibold text-foreground text-sm leading-none mb-1">
                    {row.customerName}
                </p>
                <p className="text-xs text-muted-foreground">{row.customerEmail}</p>
            </div>
        ),
    },
    {
        header: "Order",
        cell: (row) => (
            <Link
                href={`/admin/orders/${row.id}`}
                className="font-mono text-xs text-primary hover:underline font-semibold"
            >
                {row.orderNumber.slice(0, 18)}…
            </Link>
        ),
    },
    {
        header: "Offer Discount",
        cell: (row) => (
            <span className="text-sm font-semibold text-destructive">
                -{formatCurrency(row.discountApplied)}
            </span>
        ),
    },
    {
        header: "Order Total",
        cell: (row) => (
            <span className="text-sm text-foreground">
                {formatCurrency(row.totalAmount)}
            </span>
        ),
    },
    {
        header: "Date",
        cell: (row) => (
            <span className="text-xs text-muted-foreground">
                {formatDateTime(row.createdAt)}
            </span>
        ),
    },
];
export function BankOfferUsageTable({ data }: { data: BankOfferUsageRow[] }) {
    return (
        <DataTable
            columns={columns}
            data={data}
        />
    );
}