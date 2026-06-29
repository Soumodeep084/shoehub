import { prisma } from "@/lib/prisma";
import { couponFormSchema } from "@/lib/validators/coupon";
import { currentUser } from "@clerk/nextjs/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── GET /api/admin/coupons/[id] ────────────────────────────────────────────
export async function GET(req: Request, context: RouteContext) {
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
    const role = user.publicMetadata?.role;
    if (role !== "ADMIN" && role !== "STAFF") {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        usages: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            order: { select: { orderNumber: true, totalAmount: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: { select: { usages: true } },
      },
    });

    if (!coupon) {
      return Response.json({ message: "Coupon not found" }, { status: 404 });
    }

    return Response.json({
      ...coupon,
      discountValue: Number(coupon.discountValue),
      minOrderAmount: Number(coupon.minOrderAmount),
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      actualUsageCount: coupon._count.usages,
      usages: coupon.usages.map((u) => ({
        id: u.id,
        userName: `${u.user.firstName} ${u.user.lastName}`,
        userEmail: u.user.email,
        orderNumber: u.order.orderNumber,
        orderTotal: Number(u.order.totalAmount),
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET Admin Coupon By ID Error:", error);
    return Response.json({ message: "Failed to fetch coupon" }, { status: 500 });
  }
}

// ─── PATCH /api/admin/coupons/[id] ──────────────────────────────────────────
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
    const role = user.publicMetadata?.role;
    if (role !== "ADMIN" && role !== "STAFF") {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    // Handle quick toggle (only isActive field)
    if (Object.keys(body).length === 1 && typeof body.isActive === "boolean") {
      const coupon = await prisma.coupon.update({
        where: { id },
        data: { isActive: body.isActive },
      });
      return Response.json(coupon);
    }
    const parsed = couponFormSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check uniqueness (excluding current)
    const existing = await prisma.coupon.findFirst({
      where: { code: data.code, id: { not: id } },
    });
    if (existing) {
      return Response.json(
        { message: `Coupon code "${data.code}" already exists` },
        { status: 409 }
      );
    }

    // Check if Expiry Date and Time is before Today's Date and Time
    if (data.expiresAt && data.expiresAt < new Date()) {
      return Response.json(
        { message: "Coupon expiry date and time cannot be in the past" },
        { status: 400 }
      );
    }

    // Check if Min Order Amount is less than Max Discount Cap
    if (data.discountType === "PERCENTAGE" && data.maxDiscount && data.minOrderAmount > data.maxDiscount) {
      return Response.json(
        { message: "Minimum order amount cannot be greater than maximum discount amount" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: data.code,
        description: data.description ?? null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
        maxDiscount: data.maxDiscount ?? null,
        isActive: data.isActive,
        expiresAt: data.expiresAt ?? null,
        totalUsageLimit: data.totalUsageLimit ?? null,
        perUserLimit: data.perUserLimit,
        categoryId: data.categoryId?.trim() === '' ? null : data.categoryId,
      },
    });

    return Response.json(coupon);
  } catch (error) {
    console.error("PATCH Admin Coupon Error:", error);
    return Response.json({ message: "Failed to update coupon" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/coupons/[id] ─────────────────────────────────────────
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ message: "Unauthorized - User not found" }, { status: 401 });
    }
    const role = user.publicMetadata?.role;
    if (role !== "ADMIN") {
      return Response.json({ message: "Forbidden Access - Admin Only" }, { status: 403 });
    }

    const { id } = await context.params;

    await prisma.coupon.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    return Response.json({ message: "Coupon deleted successfully!" });
  } catch (error) {
    console.error("DELETE Admin Coupon Error:", error);
    return Response.json({ message: "Failed to delete coupon" }, { status: 500 });
  }
}
