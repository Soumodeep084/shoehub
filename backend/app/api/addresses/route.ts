import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { addressSchema } from "@/lib/validators/profile";

export async function GET(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);

    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: dbUser.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return Response.json(addresses);
  } catch (error) {
    console.error("GET Addresses Error:", error);
    return Response.json({ message: "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);

    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = addressSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: "Invalid address payload", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const address = await prisma.$transaction(async (tx) => {
      const existingCount = await tx.address.count({
        where: { userId: dbUser.id },
      });

      if (data.isDefault || existingCount === 0) {
        await tx.address.updateMany({
          where: { userId: dbUser.id },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: dbUser.id,
          label: data.label,
          fullName: data.fullName,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2 || null,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country || "India",
          landmark: data.landmark || null,
          isDefault: data.isDefault || existingCount === 0,
        },
      });
    });

    return Response.json(address, { status: 201 });
  } catch (error) {
    console.error("POST Addresses Error:", error);
    return Response.json({ message: "Failed to create address" }, { status: 500 });
  }
}
