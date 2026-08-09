"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@/lib/clerkClient";
import { currentUser } from "@clerk/nextjs/server";

interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getUsers({
  page = 1,
  limit = 10,
  search,
  sortBy,
  sortOrder = "desc",
}: GetUsersParams = {}) {
  const where: any = {};  // @typescript-eslint/no-explicit-any

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy.createdAt = "desc";
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: { select: { orders: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      imageUrl: user.imageUrl,
      role: user.role,
      orderCount: user._count.orders,
      createdAt: user.createdAt,
    })),
    total,
    pageCount: Math.ceil(total / limit),
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      },
      _count: {
        select: { orders: true, reviews: true, wishlists: true },
      },
    },
  });

  if (!user) return null;

  let isBanned = false;

  try {
    const clerkUser = await clerkClient.users.getUser(user.clerkId);
    isBanned = clerkUser.banned;
  } catch (err) {
    console.error("Failed to fetch Clerk user ban status:", err);
  }

  return {
    ...user,
    isBanned,
    orders: user.orders.map((o) => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      itemCount: o._count.items,
    })),
  };
}

export async function banUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return { error: "User not found" };

    await clerkClient.users.banUser(user.clerkId);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to Ban user" };
  }
}

export async function unBanUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return { error: "User not found" };

    await clerkClient.users.unbanUser(user.clerkId);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to unBan user" };
  }
}

export async function promoteToDeliveryAgent(userId: string) {
  try {
    const sessionUser = await currentUser();
    if (!sessionUser) return { error: "Unauthorized" };

    const adminUser = await prisma.user.findUnique({
      where: { clerkId: sessionUser.id },
    });
    if (!adminUser || adminUser.role !== "ADMIN") {
      return { error: "Forbidden: Only admins can perform this action" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return { error: "User not found" };

    await prisma.user.update({
      where: { id: userId },
      data: { role: "DELIVERY_AGENT" },
    });

    await clerkClient.users.updateUser(user.clerkId, {
      publicMetadata: { role: "DELIVERY_AGENT" },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Promote to delivery agent error:", error);
    return { error: error.message || "Failed to promote user" };
  }
}

export async function demoteFromDeliveryAgent(userId: string) {
  try {
    const sessionUser = await currentUser();
    if (!sessionUser) return { error: "Unauthorized" };

    const adminUser = await prisma.user.findUnique({
      where: { clerkId: sessionUser.id },
    });
    if (!adminUser || adminUser.role !== "ADMIN") {
      return { error: "Forbidden: Only admins can perform this action" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return { error: "User not found" };

    await prisma.user.update({
      where: { id: userId },
      data: { role: "USER" },
    });

    await clerkClient.users.updateUser(user.clerkId, {
      publicMetadata: { role: "USER" },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Demote from delivery agent error:", error);
    return { error: error.message || "Failed to demote user" };
  }
}
