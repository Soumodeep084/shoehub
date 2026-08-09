import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import type { Prisma } from "@prisma/client";

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

    const whereClause: Prisma.OrderWhereInput = { id };
    if (dbUser.role !== "ADMIN" && dbUser.role !== "STAFF") {
      whereClause.OR = [
        { userId: dbUser.id },
        { deliveryAgentId: dbUser.id }
      ];
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        items: true,
        events: {
          orderBy: {
            createdAt: "asc",
          },
        },
        deliveryAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          }
        }
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
