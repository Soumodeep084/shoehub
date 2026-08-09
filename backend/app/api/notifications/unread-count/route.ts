import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";

export async function GET(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: dbUser.id, readAt: null },
    });

    return Response.json({ unreadCount });
  } catch (error) {
    console.error("GET Unread Notification Count Error:", error);
    return Response.json({ message: "Failed to fetch unread notification count" }, { status: 500 });
  }
}
