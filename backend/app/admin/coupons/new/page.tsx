import { Breadcrumbs } from "@/components/admin/dashboard/breadcrumbs";
import { CouponForm } from "@/components/admin/coupons/coupon-form";
import { prisma } from "@/lib/prisma";

export default async function NewCouponPage() {
  const categories = await prisma.category.findMany({
    where: { isDeleted: false, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black">Create Coupon</h1>
        <p className="text-muted-foreground">
          Add a new discount coupon for your store.
        </p>
      </div>

      <CouponForm categories={categories} />
    </div>
  );
}
