"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DataTable, type DataTableColumn } from "../data-table";
import { StatusBadge } from "../status-badge";
import { formatDate } from "@/lib/utils";

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string | null;
  role: string;
  orderCount: number;
  createdAt: Date;
}

interface UsersTableProps {
  users: UserRow[];
  pageCount: number;
  currentPage: number;
  total: number;
}

export function UsersTable({
  users,
  pageCount,
  currentPage,
}: UsersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending] = useTransition();

  // Sorting state from URL
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSort = (key: string, order: "asc" | "desc") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", key);
    params.set("sortOrder", order);
    params.set("page", "1"); // Reset to page 1
    router.push(`/admin/users?${params.toString()}`);
  };

  const columns: DataTableColumn<UserRow>[] = [
    {
      header: "User",
      sortKey: "firstName",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shadow-sm">
            <AvatarImage src={row.imageUrl ?? undefined} />
            <AvatarFallback className="text-xs font-semibold">
              {row.firstName?.[0]}
              {row.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm text-foreground">
            {row.firstName} {row.lastName}
          </span>
        </div>
      ),
    },
    {
      header: "Email",
      sortKey: "email",
      cell: (row) => <span className="text-sm text-muted-foreground">{row.email}</span>,
    },
    {
      header: "Role",
      cell: (row) => <StatusBadge type="role" value={row.role} />,
    },
    {
      header: "Orders Placed",
      cell: (row) => <span className="text-sm font-medium text-foreground">{row.orderCount} orders</span>,
    },
    {
      header: "Joined Date",
      sortKey: "createdAt",
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
        <Button variant="ghost" size="icon" asChild className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground">
          <Link href={`/admin/users/${row.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      loading={isPending}
      currentPage={currentPage}
      pageCount={pageCount}
      onPageChange={handlePageChange}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={handleSort}
      emptyTitle="No users found"
      emptyDescription="There are no registered user records matching your query."
    />
  );
}
