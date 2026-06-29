"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const labelMap: Record<string, string> = {
  admin: "Dashboard",
  products: "Products",
  categories: "Categories",
  orders: "Orders",
  users: "Users",
  new: "New",
  edit: "Edit",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link
        href="/admin"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.slice(1).map((segment, i) => {
        const href = "/" + segments.slice(0, i + 2).join("/");
        const isLast = i === segments.length - 2;
        const label = labelMap[segment] || segment;

        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="font-medium text-foreground capitalize">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-foreground transition-colors capitalize"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
