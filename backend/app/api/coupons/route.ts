import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";

// ─── GET /api/coupons ───────────────────────────────────────────────────────
// Public endpoint for logged-in users to list available active coupons.
export async function GET(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(
      coupons.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: Number(c.discountValue),
        minOrderAmount: Number(c.minOrderAmount),
        maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
        expiresAt: c.expiresAt,
        perUserLimit: c.perUserLimit,
      }))
    );
  } catch (error) {
    console.error("GET Coupons Discovery List Error:", error);
    return Response.json({ message: "Failed to fetch available coupons" }, { status: 500 });
  }
}
