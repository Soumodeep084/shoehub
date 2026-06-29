"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "../data-table";
import { StatusBadge } from "../status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderRow {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    imageUrl: string | null;
  };
  status: string;
  paymentStatus: string;
  totalAmount: number;
  itemCount: number;
  createdAt: Date;
}

interface OrdersTableProps {
  orders: OrderRow[];
  pageCount: number;
  currentPage: number;
  total: number;
}

export function OrdersTable({
  orders,
  pageCount,
  currentPage,
}: OrdersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending] = useTransition();

  // Sorting state from URL
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleSort = (key: string, order: "asc" | "desc") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", key);
    params.set("sortOrder", order);
    params.set("page", "1"); // Reset to page 1
    router.push(`/admin/orders?${params.toString()}`);
  };

  const columns: DataTableColumn<OrderRow>[] = [
    {
      header: "Order Number",
      sortKey: "orderNumber",
      cell: (row) => (
        <div>
          <Link href={`/admin/orders/${row.id}`} className="font-mono text-sm font-semibold text-primary hover:underline block leading-none mb-1 select-all">
            {row.orderNumber.slice(0, 18)}…
          </Link>
          <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>
        </div>
      ),
    },
    {
      header: "Customer",
      cell: (row) => (
        <div>
          <p className="font-medium text-sm text-foreground leading-tight">{row.customer.name}</p>
          <p className="text-xs text-muted-foreground">{row.customer.email}</p>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge type="order" value={row.status} />,
    },
    {
      header: "Payment",
      cell: (row) => <StatusBadge type="payment" value={row.paymentStatus} />,
    },
    {
      header: "Items",
      cell: (row) => <span className="text-sm font-medium text-foreground">{row.itemCount} units</span>,
    },
    {
      header: "Amount",
      sortKey: "totalAmount",
      className: "text-right",
      cell: (row) => <span className="text-sm font-bold text-foreground block text-right">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      header: "Actions",
      className: "w-14 text-right",
      cell: (row) => (
        <Button variant="ghost" size="icon" asChild className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground">
          <Link href={`/admin/orders/${row.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={orders}
      loading={isPending}
      currentPage={currentPage}
      pageCount={pageCount}
      onPageChange={handlePageChange}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={handleSort}
      emptyTitle="No orders found"
      emptyDescription="There are no purchase orders matching your search or status query."
    />
  );
}
