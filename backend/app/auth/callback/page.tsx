import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuthCallbackPage() {
  const session = await auth();

  if (!session.userId || !session.sessionId) {
    redirect("/sign-in");
  }

  // ✅ Tier 1: Check JWT metadata first
  const clerkRole = session.sessionClaims?.metadata?.role;

  if (clerkRole === "ADMIN") {
    redirect("/admin");
  }

  // ✅ Tier 2: Fallback to Prisma
  const user = await prisma.user.findUnique({
    where: {
      clerkId: session.userId,
    },
    select: {
      role: true,
    },
  });

  if (user?.role === "ADMIN") {
    redirect("/admin");
  }

  // ❌ Not an admin → revoke session
  const client = await clerkClient();

  await client.sessions.revokeSession(session.sessionId);

  redirect("/sign-in?reason=unauthorized");
}
