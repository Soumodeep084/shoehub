import { notFound } from "next/navigation";
import { getCouponById } from "@/lib/adminActions/coupon-actions";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { CouponForm } from "@/components/admin/coupons/coupon-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";

interface EditCouponPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCouponPage({ params }: EditCouponPageProps) {
  const { id } = await params;
  const coupon = await getCouponById(id);

  if (!coupon) notFound();

  const categories = await prisma.category.findMany({
    where: { isDeleted: false, isActive: true },
    orderBy: { name: "asc" },
  });

  const formData = {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description ?? "",
    discountType: coupon.discountType as "PERCENTAGE" | "FIXED",
    discountValue: coupon.discountValue,
    minOrderAmount: coupon.minOrderAmount,
    maxDiscount: coupon.maxDiscount,
    isActive: coupon.isActive,
    expiresAt: coupon.expiresAt,
    totalUsageLimit: coupon.totalUsageLimit,
    perUserLimit: coupon.perUserLimit,
    categoryId: coupon.categoryId,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Coupon: ${coupon.code}`}
        description="Update coupon rules, usage thresholds, and expiry limits."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/coupons/${coupon.id}`} className="flex items-center gap-1 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Coupon Details
          </Link>
        </Button>
      </PageHeader>

      <CouponForm initialData={formData} categories={categories} />
    </div>
  );
}
