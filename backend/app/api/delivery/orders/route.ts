import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import type { DeliveryStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Dynamic security check: Block users whose role is not DELIVERY_AGENT or ADMIN
    if ((dbUser.role as string) !== "DELIVERY_AGENT" && dbUser.role !== "ADMIN") {
      return Response.json({ message: "Forbidden: Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tabStatus = searchParams.get("status") || "assigned";

    let deliveryStatusFilter: DeliveryStatus | { in: DeliveryStatus[] } | { not: null };

    if (tabStatus === "assigned") {
      deliveryStatusFilter = "ASSIGNED";
    } else if (tabStatus === "active") {
      deliveryStatusFilter = { in: ["ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"] };
    } else if (tabStatus === "completed") {
      deliveryStatusFilter = "DELIVERED";
    } else if (tabStatus === "history") {
      // Return all assigned orders
      deliveryStatusFilter = { not: null };
    } else {
      return Response.json({ message: "Invalid status parameter" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: {
        deliveryAgentId: dbUser.id,
        deliveryStatus: deliveryStatusFilter,
      },
      include: {
        items: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return Response.json(orders);
  } catch (error) {
    console.error("GET Delivery Orders Error:", error);
    return Response.json({ message: "Failed to fetch delivery orders" }, { status: 500 });
  }
}
