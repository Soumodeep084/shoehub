import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";

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

    const address = await prisma.address.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!address) {
      return Response.json({ message: "Address not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId: dbUser.id },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    return Response.json(updated);
  } catch (error) {
    console.error("PATCH Default Address Error:", error);
    return Response.json({ message: "Failed to set default address" }, { status: 500 });
  }
}
