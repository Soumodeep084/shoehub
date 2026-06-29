import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Ticket,
  Calendar,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { getCouponById } from "@/lib/adminActions/coupon-actions";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CouponUsageTable } from "@/components/admin/coupons/coupon-usage-table";
import { UsageRow } from "@/types/admin/coupons";

interface CouponDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CouponDetailPage({
  params,
}: CouponDetailPageProps) {
  const { id } = await params;
  const coupon = await getCouponById(id);

  if (!coupon || coupon.isDeleted) {
    notFound();
  }

  const usagesData: UsageRow[] = coupon.usages.map((u) => ({
    id: u.id,
    userName: u.userName,
    userEmail: u.userEmail,
    orderNumber: u.orderNumber,
    orderTotal: u.orderTotal,
    createdAt: u.createdAt,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Coupon: ${coupon.code}`}
        description={`Usage statistics and conditions for coupon discount code.`}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              href="/admin/coupons"
              className="flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link
              href={`/admin/coupons/${coupon.id}/edit`}
              className="flex items-center gap-1 text-xs"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Coupon
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coupon Rules Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Coupon Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">
                  Coupon Code
                </span>
                <span className="font-mono font-bold text-foreground text-base tracking-wide uppercase">
                  {coupon.code}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">
                  Description
                </span>
                <span className="text-foreground leading-relaxed">
                  {coupon.description || "No description provided."}
                </span>
              </div>
              <hr className="border-border my-2" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">
                    Discount
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {coupon.discountType === "PERCENTAGE"
                      ? `${coupon.discountValue}%`
                      : formatCurrency(coupon.discountValue)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">
                    Min Order
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {formatCurrency(coupon.minOrderAmount)}
                  </span>
                </div>
              </div>

              {coupon.maxDiscount && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">
                    Maximum Cap
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {formatCurrency(coupon.maxDiscount)}
                  </span>
                </div>
              )}

              <hr className="border-border my-2" />

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Expiration
                  </span>
                  <span className="text-xs text-foreground font-medium">
                    {coupon.expiresAt ? formatDateTime(coupon.expiresAt) : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5" /> Limit Per Customer
                  </span>
                  <span className="text-xs text-foreground font-semibold">
                    {coupon.perUserLimit} use(s)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> Max Usage Limit
                  </span>
                  <span className="text-xs text-foreground font-semibold">
                    {coupon.totalUsageLimit ?? "Unlimited"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Current Usage Count
                  </span>
                  <span className="text-xs text-foreground font-bold">
                    {coupon.usageCount} uses
                  </span>
                </div>
                <hr className="border-border my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Fulfillment Status
                  </span>
                  <StatusBadge
                    type="active"
                    value={coupon.isActive}
                    expiresAt={coupon.expiresAt}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage History List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Usages & Transactions</CardTitle>
            <CardDescription>
              Orders that successfully claimed discount using code {coupon.code}
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <CouponUsageTable data={usagesData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
