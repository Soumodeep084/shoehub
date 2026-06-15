import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { clerkClient } from "@/lib/clerkClient";

export async function DELETE(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);

    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    await clerkClient.users.deleteUser(dbUser.clerkId);

    await prisma.user.delete({
      where: { id: dbUser.id },
    });

    return Response.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Account Error:", error);
    return Response.json({ message: "Failed to delete account" }, { status: 500 });
  }
}
