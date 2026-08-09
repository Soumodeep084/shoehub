import Link from "next/link";
import { Ticket, Plus, Trash2 } from "lucide-react";
import { getCoupons, getCouponStats } from "@/lib/adminActions/coupon-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { ExportButtons } from "@/components/admin/dashboard/export-buttons";
import { CouponsTable } from "@/components/admin/coupons/coupons-table";

export default async function AdminCouponsPage() {
  const [coupons, stats] = await Promise.all([getCoupons(), getCouponStats()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        description="Configure promotional campaign coupons, discount rates, and checkout rules."
      >
        <div className="flex gap-2">
          <ExportButtons entity="coupons" />
          <Button variant="outline" size="sm" asChild className="h-9">
            <Link
              href="/admin/coupons/trash"
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              View Trash
            </Link>
          </Button>
          <Button size="sm" asChild className="h-9">
            <Link
              href="/admin/coupons/new"
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              Create Coupon
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Coupons
                </p>
                <p className="text-2xl font-bold">{stats.totalCoupons}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40">
                <Ticket className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Active
                </p>
                <p className="text-2xl font-bold">{stats.activeCoupons}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                <Ticket className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Usages
                </p>
                <p className="text-2xl font-bold">{stats.totalUsages}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
                <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CouponsTable coupons={coupons} />
    </div>
  );
}
