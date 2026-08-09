import { prisma } from "@/lib/prisma";

// ─── GET /api/bank-offers ───────────────────────────────────────────────────
// Public endpoint: returns all active, non-expired bank offers for mobile display.
export async function GET() {
  try {
    const now = new Date();

    const offers = await prisma.bankOffer.findMany({
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
      offers.map((o) => ({
        id: o.id,
        bankName: o.bankName,
        cardType: o.cardType,
        description: o.description,
        discountType: o.discountType,
        discountValue: Number(o.discountValue),
        minOrderAmount: Number(o.minOrderAmount),
        maxDiscount: o.maxDiscount ? Number(o.maxDiscount) : null,
        expiresAt: o.expiresAt,
      }))
    );
  } catch (error) {
    console.error("GET Bank Offers Error:", error);
    return Response.json({ message: "Failed to fetch bank offers" }, { status: 500 });
  }
}
