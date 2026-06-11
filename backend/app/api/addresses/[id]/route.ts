import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { addressSchema } from "@/lib/validators/profile";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const dbUser = await getCurrentDbUser(req);

    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = addressSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: "Invalid address payload", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!existingAddress) {
      return Response.json({ message: "Address not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (parsed.data.isDefault) {
        await tx.address.updateMany({
          where: { userId: dbUser.id },
          data: { isDefault: false },
        });
        return tx.address.update({
          where: { id },
          data: {
            label: parsed.data.label,
            fullName: parsed.data.fullName,
            phone: parsed.data.phone,
            line1: parsed.data.line1,
            line2: parsed.data.line2 || null,
            city: parsed.data.city,
            state: parsed.data.state,
            postalCode: parsed.data.postalCode,
            country: parsed.data.country || "India",
            landmark: parsed.data.landmark || null,
            isDefault: true,
          },
        });
      }

      const address = await tx.address.update({
        where: { id },
        data: {
          label: parsed.data.label,
          fullName: parsed.data.fullName,
          phone: parsed.data.phone,
          line1: parsed.data.line1,
          line2: parsed.data.line2 || null,
          city: parsed.data.city,
          state: parsed.data.state,
          postalCode: parsed.data.postalCode,
          country: parsed.data.country || "India",
          landmark: parsed.data.landmark || null,
          isDefault: false,
        },
      });

      if (existingAddress.isDefault) {
        const fallback = await tx.address.findFirst({
          where: { userId: dbUser.id, NOT: { id } },
          orderBy: { createdAt: "desc" },
        });

        if (fallback) {
          await tx.address.update({
            where: { id: fallback.id },
            data: { isDefault: true },
          });
        } else {
          await tx.address.update({
            where: { id },
            data: { isDefault: true },
          });
        }
      }

      return address;
    });

    return Response.json(updated);
  } catch (error) {
    console.error("PATCH Address Error:", error);
    return Response.json({ message: "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const dbUser = await getCurrentDbUser(req);

    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!existingAddress) {
      return Response.json({ message: "Address not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      if (existingAddress.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId: dbUser.id },
          orderBy: { createdAt: "desc" },
        });

        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return Response.json({ success: true, message: "Address deleted" });
  } catch (error) {
    console.error("DELETE Address Error:", error);
    return Response.json({ message: "Failed to delete address" }, { status: 500 });
  }
}
