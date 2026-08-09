import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";

export async function GET(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(notifications);
  } catch (error) {
    console.error("GET Notifications Error:", error);
    return Response.json({ message: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { ids, markAllAsRead } = await req.json().catch(() => ({}));

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId: dbUser.id, readAt: null },
        data: { readAt: new Date() },
      });
    } else if (Array.isArray(ids) && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { userId: dbUser.id, id: { in: ids } },
        data: { readAt: new Date() },
      });
    } else {
      return Response.json({ message: "Invalid request payload" }, { status: 400 });
    }

    return Response.json({ success: true, message: "Notifications updated successfully" });
  } catch (error) {
    console.error("PATCH Notifications Error:", error);
    return Response.json({ message: "Failed to update notifications" }, { status: 500 });
  }
}
