import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: Params) {
  try {
    const dbUser = await getCurrentDbUser(req);

    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: dbUser.id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    return Response.json(order);
  } catch (error) {
    console.error("GET Order Detail Error:", error);
    return Response.json({ message: "Failed to fetch order" }, { status: 500 });
  }
}
