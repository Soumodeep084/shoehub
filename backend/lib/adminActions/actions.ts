"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [
    totalProducts,
    totalCategories,
    totalOrders,
    totalUsers,
    revenueResult,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
      },
      _sum: {
        totalAmount: true,
      },
    }),
  ]);

  return {
    totalProducts,
    totalCategories,
    totalOrders,
    totalUsers,
    totalRevenue: Number(revenueResult._sum.totalAmount ?? 0),
  };
}

export async function getRecentOrders() {
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
      items: true,
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: `${order.user.firstName} ${order.user.lastName}`,
    customerEmail: order.user.email,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: Number(order.totalAmount),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: order.createdAt,
  }));
}

export async function getRecentProducts() {
  const products = await prisma.product.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      images: {
        where: { isPrimary: true },
        take: 1,
      },
      _count: { select: { variants: true } },
    },
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category.name,
    basePrice: Number(product.basePrice),
    salePrice: Number(product.salePrice),
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    imageUrl: product.images[0]?.imageUrl ?? null,
    variantCount: product._count.variants,
    createdAt: product.createdAt,
  }));
}
