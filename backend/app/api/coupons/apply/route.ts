import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { applyCouponSchema } from "@/lib/validators/coupon";

// ─── Shared discount calculator ─────────────────────────────────────────────
function calculateDiscount(
  discountType: "PERCENTAGE" | "FIXED",
  discountValue: number,
  subtotal: number,
  maxDiscount: number | null
): number {
  let discount: number;

  if (discountType === "PERCENTAGE") {
    discount = (subtotal * discountValue) / 100;
    if (maxDiscount !== null && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else {
    discount = discountValue;
  }

  // Discount can never exceed subtotal
  return Math.min(discount, subtotal);
}

// ─── POST /api/coupons/apply ────────────────────────────────────────────────
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
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { code, subtotal } = parsed.data;

    // 1. Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return Response.json({ message: "Invalid coupon code" }, { status: 404 });
    }

    // 2. Check active status
    if (!coupon.isActive) {
      return Response.json({ message: "This coupon is no longer active" }, { status: 400 });
    }

    // 3. Check expiry
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return Response.json({ message: "This coupon has expired" }, { status: 400 });
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
        return Response.json(
          { message: "This coupon is only valid for items in a specific category" },
          { status: 400 }
        );
      }
    }

    // 4. Check minimum order amount
    if (applicableSubtotal < Number(coupon.minOrderAmount)) {
      return Response.json(
        {
          message: `Minimum order amount of ₹${Number(coupon.minOrderAmount)} required for the applicable category items`,
          minOrderAmount: Number(coupon.minOrderAmount),
        },
        { status: 400 }
      );
    }

    // 5. Check total usage limit
    if (coupon.totalUsageLimit !== null && coupon.usageCount >= coupon.totalUsageLimit) {
      return Response.json(
        { message: "This coupon has reached its usage limit" },
        { status: 400 }
      );
    }

    // 6. Check per-user usage limit
    const userUsageCount = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId: dbUser.id },
    });

    if (userUsageCount >= coupon.perUserLimit) {
      return Response.json(
        { message: "You have already used this coupon the maximum number of times" },
        { status: 400 }
      );
    }

    // 7. Calculate discount (server-side only)
    const discount = calculateDiscount(
      coupon.discountType,
      Number(coupon.discountValue),
      applicableSubtotal,
      coupon.maxDiscount ? Number(coupon.maxDiscount) : null
    );

    return Response.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      },
      discount: Math.round(discount * 100) / 100,
      subtotal,
      newTotal: Math.round((subtotal - discount) * 100) / 100,
    });
  } catch (error) {
    console.error("POST Apply Coupon Error:", error);
    return Response.json({ message: "Failed to apply coupon" }, { status: 500 });
  }
}
