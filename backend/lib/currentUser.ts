import { verifyToken } from "@clerk/backend";
import { prisma } from "./prisma";

export async function getCurrentDbUser(req: Request) {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) return null;

    const token = authHeader.replace("Bearer ", "");

    const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
    });

    const clerkId = payload.sub;

    if (!clerkId) return null;

    const user = await prisma.user.findUnique({
        where: { clerkId },
    });

    return user;
}