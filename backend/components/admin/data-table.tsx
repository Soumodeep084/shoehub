"use client";

import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface DataTableColumn<T> {
  header: string;
  className?: string;
  sortKey?: string;
  cell: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  // Pagination
  currentPage?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  // Sorting
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string, order: "asc" | "desc") => void;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle = "No data found",
  emptyDescription = "There are no records matching your query.",
  currentPage = 1,
  pageCount = 1,
  onPageChange,
  sortBy,
  sortOrder,
  onSort,
}: DataTableProps<T>) {

  const handleSortClick = (key: string) => {
    if (!onSort) return;
    if (sortBy === key) {
      onSort(key, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(key, "asc");
    }
  };

  const renderSortIcon = (key: string) => {
    if (sortBy !== key) {
      return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-primary" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Responsive Table Wrapper */}
        <div className="w-full overflow-x-auto scrollbar-thin">
          <Table className="w-full table-auto">
            <TableHeader className="bg-muted/40">
              <TableRow className="px-4 py-3">
                {columns.map((col, index) => {
                  const isSortable = !!col.sortKey && !!onSort;
                  return (
                    <TableHead
                      key={index}
                      className={col.className}
                    >
                      {isSortable ? (
                        <button
                          type="button"
                          onClick={() => handleSortClick(col.sortKey!)}
                          className="group -ml-2 inline-flex items-center rounded-md px-2 py-1 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                        >
                          {col.header}
                          {renderSortIcon(col.sortKey!)}
                        </button>
                      ) : (
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {col.header}
                        </span>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading Skeleton Row Block
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((col, colIndex) => (
                      <TableCell key={colIndex} className={col.className}>
                        <Skeleton className="h-5 w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-44 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <p className="font-semibold text-foreground text-sm">{emptyTitle}</p>
                      <p className="text-xs text-muted-foreground">{emptyDescription}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className="hover:bg-muted/30 transition-colors">
                    {columns.map((col, colIndex) => (
                      <TableCell key={colIndex} className={col.className}>
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      {!loading && pageCount > 1 && onPageChange && (
        <div className="flex items-center justify-between px-2 py-1">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
            <span className="font-medium text-foreground">{pageCount}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="text-xs h-8 px-2.5"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= pageCount}
              className="text-xs h-8 px-2.5"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
