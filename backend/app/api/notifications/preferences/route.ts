import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { ensureNotificationPreference } from "@/lib/orderLifecycle";

export async function GET(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const preferences = await ensureNotificationPreference(prisma, dbUser.id);
    return Response.json(preferences);
  } catch (error) {
    console.error("GET Notification Preferences Error:", error);
    return Response.json({ message: "Failed to fetch notification preferences" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { orderUpdates, promotionsOffers, coupons, bankOffers, newArrivals } = body;

    const data: Record<string, boolean> = {};
    if (typeof orderUpdates === "boolean") data.orderUpdates = orderUpdates;
    if (typeof promotionsOffers === "boolean") data.promotionsOffers = promotionsOffers;
    if (typeof coupons === "boolean") data.coupons = coupons;
    if (typeof bankOffers === "boolean") data.bankOffers = bankOffers;
    if (typeof newArrivals === "boolean") data.newArrivals = newArrivals;

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        ...data,
      },
      update: data,
    });

    return Response.json(preferences);
  } catch (error) {
    console.error("PATCH Notification Preferences Error:", error);
    return Response.json({ message: "Failed to update notification preferences" }, { status: 500 });
  }
}
