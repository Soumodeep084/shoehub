// components/admin/coupon-usage-table.tsx

"use client";

import { DataTable, DataTableColumn } from "@/components/admin/data-table";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CouponUsageRow } from "@/types/admin/table-usages";

const columns: DataTableColumn<CouponUsageRow>[] = [
    {
        header: "Customer",
        cell: (row) => (
            <div>
                <p className="font-semibold text-foreground text-sm leading-none mb-1">
                    {row.userName}
                </p>
                <p className="text-xs text-muted-foreground">{row.userEmail}</p>
            </div>
        ),
    },
    {
        header: "Order Number",
        cell: (row) => (
            <code className="text-xs font-mono text-muted-foreground select-all">
                {row.orderNumber}
            </code>
        ),
    },
    {
        header: "Order Total",
        cell: (row) => (
            <span className="text-sm text-foreground">
                {formatCurrency(row.orderTotal)}
            </span>
        ),
    },
    {
        header: "Used At",
        cell: (row) => (
            <span className="text-xs text-muted-foreground">
                {formatDateTime(row.createdAt)}
            </span>
        ),
    },
];

export function CouponUsageTable({ data }: { data: CouponUsageRow[] }) {
    return (
        <DataTable
            columns={columns}
            data={data}
        />
    );
}