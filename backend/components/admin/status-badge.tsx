"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  type: "order" | "payment" | "role" | "active";
  value: string | boolean;
  expiresAt?: Date | string | null;
}

export function StatusBadge({ type, value, expiresAt }: StatusBadgeProps) {
  let label = String(value);
  let bgClass = "bg-muted text-muted-foreground border-muted-foreground/10";

  if (type === "active") {
    const isActive = Boolean(value);
    const isExpired = expiresAt && new Date(expiresAt) < new Date();

    if (!isActive) {
      label = "Inactive";
      bgClass = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
    } else if (isExpired) {
      label = "Expired";
      bgClass = "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100 dark:border-rose-900/30";
    } else {
      label = "Active";
      bgClass = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30";
    }
  } else if (type === "role") {
    label = String(value).toUpperCase();
    if (label === "ADMIN") {
      bgClass = "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/30 font-semibold";
    } else if (label === "STAFF") {
      bgClass = "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 font-medium";
    } else {
      bgClass = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
    }
  } else if (type === "payment") {
    label = String(value).toUpperCase();
    switch (label) {
      case "PAID":
        bgClass = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30";
        break;
      case "PENDING":
        bgClass = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900/30";
        break;
      case "FAILED":
        bgClass = "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100 dark:border-rose-900/30";
        break;
      case "REFUNDED":
        bgClass = "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/30";
        break;
    }
  } else if (type === "order") {
    label = String(value).toUpperCase();
    switch (label) {
      case "DELIVERED":
        bgClass = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30";
        break;
      case "PENDING":
        bgClass = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
        break;
      case "CONFIRMED":
        bgClass = "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/30";
        break;
      case "PROCESSING":
        bgClass = "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-100 dark:border-sky-900/30";
        break;
      case "SHIPPED":
        bgClass = "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30";
        break;
      case "CANCELLED":
      case "REFUNDED":
        bgClass = "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100 dark:border-rose-900/30";
        break;
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
        bgClass
      )}
    >
      {label}
    </span>
  );
}
