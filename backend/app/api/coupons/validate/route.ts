import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { applyCouponSchema } from "@/lib/validators/coupon";

// ─── POST /api/coupons/validate ─────────────────────────────────────────────
// Same logic as apply but explicitly named for real-time validation feedback.
export async function POST(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = applyCouponSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { valid: false, message: "Invalid input" },
        { status: 400 }
      );
    }

    const { code, subtotal } = parsed.data;

    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon) {
      return Response.json({ valid: false, message: "Invalid coupon code" }, { status: 404 });
    }

    if (!coupon.isActive) {
      return Response.json({ valid: false, message: "This coupon is no longer active" });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return Response.json({ valid: false, message: "This coupon has expired" });
    }

    let applicableSubtotal = subtotal;
    if (coupon.categoryId) {
      const cartItems = await prisma.cart.findMany({
        where: { userId: dbUser.id },
        include: { product: true },
      });
      applicableSubtotal = cartItems
        .filter((item) => item.product.categoryId === coupon.categoryId)
        .reduce((sum, item) => sum + Number(item.product.salePrice) * item.quantity, 0);

      if (applicableSubtotal === 0) {
        return Response.json({
          valid: false,
          message: "This coupon is only valid for items in a specific category",
        });
      }
    }

    if (applicableSubtotal < Number(coupon.minOrderAmount)) {
      return Response.json({
        valid: false,
        message: `Minimum order of ₹${Number(coupon.minOrderAmount)} required for the applicable category items`,
      });
    }

    if (coupon.totalUsageLimit !== null && coupon.usageCount >= coupon.totalUsageLimit) {
      return Response.json({ valid: false, message: "Coupon usage limit reached" });
    }

    const userUsageCount = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId: dbUser.id },
    });

    if (userUsageCount >= coupon.perUserLimit) {
      return Response.json({
        valid: false,
        message: "You have already used this coupon",
      });
    }

    // Calculate discount
    let discount: number;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (applicableSubtotal * Number(coupon.discountValue)) / 100;
      const max = coupon.maxDiscount ? Number(coupon.maxDiscount) : null;
      if (max !== null && discount > max) discount = max;
    } else {
      discount = Number(coupon.discountValue);
    }
    discount = Math.min(discount, applicableSubtotal);

    return Response.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
      },
      discount: Math.round(discount * 100) / 100,
    });
  } catch (error) {
    console.error("POST Validate Coupon Error:", error);
    return Response.json({ valid: false, message: "Validation failed" }, { status: 500 });
  }
}
