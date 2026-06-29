import { prisma } from "@/lib/prisma";
import { bankOfferFormSchema } from "@/lib/validators/coupon";
import { currentUser } from "@clerk/nextjs/server";

// ─── GET /api/admin/bank-offers ─────────────────────────────────────────────
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ message: "Unauthorized - User not found" }, { status: 401 });
    }
    const role = user.publicMetadata?.role;
    if (role !== "ADMIN" && role !== "STAFF") {
      return Response.json({ message: "Forbidden Access" }, { status: 403 });
    }

    const offers = await prisma.bankOffer.findMany({
      orderBy: { createdAt: "desc" },
    });

    return Response.json(
      offers.map((o) => ({
        ...o,
        discountValue: Number(o.discountValue),
        minOrderAmount: Number(o.minOrderAmount),
        maxDiscount: o.maxDiscount ? Number(o.maxDiscount) : null,
      }))
    );
  } catch (error) {
    console.error("GET Admin Bank Offers Error:", error);
    return Response.json({ message: "Failed to fetch bank offers" }, { status: 500 });
  }
}

// ─── POST /api/admin/bank-offers ────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ message: "Unauthorized - User not found" }, { status: 401 });
    }
    const role = user.publicMetadata?.role;
    if (role !== "ADMIN") {
      return Response.json({ message: "Forbidden Access - Admin Only" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = bankOfferFormSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const offer = await prisma.bankOffer.create({
      data: {
        bankName: data.bankName,
        cardType: data.cardType ?? null,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
        maxDiscount: data.maxDiscount ?? null,
        isActive: data.isActive,
        expiresAt: data.expiresAt ?? null,
        categoryId: data.categoryId?.trim() === '' ? null : data.categoryId,
      },
    });

    return Response.json(offer, { status: 201 });
  } catch (error) {
    console.error("POST Admin Create Bank Offer Error:", error);
    return Response.json({ message: "Failed to create bank offer" }, { status: 500 });
  }
}
