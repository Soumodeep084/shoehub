import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentDbUser } from "@/lib/currentUser";
import { couponFormSchema } from "@/lib/validators/coupon";

// ─── GET /api/admin/coupons ─────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "STAFF")) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { usages: true } } },
    });

    return Response.json(
      coupons.map((c) => ({
        ...c,
        discountValue: Number(c.discountValue),
        minOrderAmount: Number(c.minOrderAmount),
        maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
        actualUsageCount: c._count.usages,
      }))
    );
  } catch (error) {
    console.error("GET Admin Coupons Error:", error);
    return Response.json({ message: "Failed to fetch coupons" }, { status: 500 });
  }
}

// ─── POST /api/admin/coupons ────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
    const role = user.publicMetadata?.role;
    if (role !== "ADMIN") {
      return Response.json({ message: "Forbidden Access" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = couponFormSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check uniqueness
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      return Response.json(
        { message: `Coupon code "${data.code}" already exists` },
        { status: 409 }
      );
    }

    // Check Expiry Date and Time is before Today's Date and Time
    if (data.expiresAt && data.expiresAt < new Date()) {
      return Response.json(
        { message: "Coupon expiry date and time cannot be in the past" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
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

    return Response.json(coupon, { status: 201 });
  } catch (error) {
    console.error("POST Admin Create Coupon Error:", error);
    return Response.json({ message: "Failed to create coupon" }, { status: 500 });
  }
}
