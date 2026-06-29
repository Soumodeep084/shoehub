import { prisma } from "@/lib/prisma";
import { bankOfferFormSchema } from "@/lib/validators/coupon";
import { currentUser } from "@clerk/nextjs/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── GET /api/admin/bank-offers/[id] ────────────────────────────────────────
export async function GET(req: Request, context: RouteContext) {
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ message: "Unauthorized - User not found" }, { status: 401 });
    }

    const role = user.publicMetadata?.role;
    if (role !== "ADMIN" && role !== "STAFF") {
      return Response.json({ message: "Forbidden Access" }, { status: 403 });
    }

    const { id } = await context.params;

    const offer = await prisma.bankOffer.findUnique({ where: { id } });

    if (!offer) {
      return Response.json({ message: "Bank offer not found" }, { status: 404 });
    }

    return Response.json({
      ...offer,
      discountValue: Number(offer.discountValue),
      minOrderAmount: Number(offer.minOrderAmount),
      maxDiscount: offer.maxDiscount ? Number(offer.maxDiscount) : null,
    });
  } catch (error) {
    console.error("GET Admin Bank Offer By ID Error:", error);
    return Response.json({ message: "Failed to fetch bank offer" }, { status: 500 });
  }
}

// ─── PATCH /api/admin/bank-offers/[id] ──────────────────────────────────────
export async function PATCH(req: Request, context: RouteContext) {
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
    const body = await req.json();

    // Handle quick toggle
    if (Object.keys(body).length === 1 && typeof body.isActive === "boolean") {
      const offer = await prisma.bankOffer.update({
        where: { id },
        data: { isActive: body.isActive },
      });
      return Response.json(offer);
    }

    const parsed = bankOfferFormSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const offer = await prisma.bankOffer.update({
      where: { id },
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

    return Response.json(offer);
  } catch (error) {
    console.error("PATCH Admin Bank Offer Error:", error);
    return Response.json({ message: "Failed to update bank offer" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/bank-offers/[id] ─────────────────────────────────────
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

    await prisma.bankOffer.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    return Response.json({ message: "Bank offer deleted" });
  } catch (error) {
    console.error("DELETE Admin Bank Offer Error:", error);
    return Response.json({ message: "Failed to delete bank offer" }, { status: 500 });
  }
}
