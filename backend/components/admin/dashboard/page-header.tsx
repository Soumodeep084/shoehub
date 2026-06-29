"use client";

import React from "react";
import { Breadcrumbs } from "./breadcrumbs";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5 mb-6">
      <div className="space-y-1.5">
        <div className="lg:hidden mb-2">
          <Breadcrumbs />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
