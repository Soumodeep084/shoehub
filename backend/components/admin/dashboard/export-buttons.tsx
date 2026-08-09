import Link from "next/link";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonsProps {
  entity: "orders" | "products" | "users" | "coupons" | "analytics";
  params?: Record<string, string | undefined>;
}

function buildHref(entity: ExportButtonsProps["entity"], format: "csv" | "xlsx", params?: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  search.set("entity", entity);
  search.set("format", format);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        search.set(key, value);
      }
    }
  }

  return `/api/admin/exports?${search.toString()}`;
}

export function ExportButtons({ entity, params }: ExportButtonsProps) {
  const csvHref = buildHref(entity, "csv", params);
  const excelHref = buildHref(entity, "xlsx", params);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild className="h-9">
        <Link href={csvHref} className="text-xs font-semibold">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild className="h-9">
        <Link href={excelHref} className="text-xs font-semibold">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Export Excel
        </Link>
      </Button>
    </div>
  );
}
