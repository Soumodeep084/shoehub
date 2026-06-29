"use server";

import { prisma } from "@/lib/prisma";

// ─── Coupon Actions ─────────────────────────────────────────────────────────

export async function getCoupons() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { usages: true } },
      category: {
        select: {
          id: true,
          name: true
        }
      },
    },
  });

  return coupons.map((coupon) => ({
    ...coupon,
    discountValue: Number(coupon.discountValue),
    minOrderAmount: Number(coupon.minOrderAmount),
    maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
    actualUsageCount: coupon._count.usages,
  }));
}

export async function getCouponById(id: string) {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      usages: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
          order: {
            select: { orderNumber: true, totalAmount: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: { select: { usages: true } },
    },
  });

  if (!coupon) return null;

  return {
    ...coupon,
    discountValue: Number(coupon.discountValue),
    minOrderAmount: Number(coupon.minOrderAmount),
    maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
    actualUsageCount: coupon._count.usages,
    usages: coupon.usages.map((u) => ({
      id: u.id,
      userName: `${u.user.firstName} ${u.user.lastName}`,
      userEmail: u.user.email,
      orderNumber: u.order.orderNumber,
      orderTotal: Number(u.order.totalAmount),
      createdAt: u.createdAt,
    })),
  };
}

export async function getCouponStats() {
  const [totalCoupons, activeCoupons, totalUsages] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.couponUsage.count(),
  ]);

  return { totalCoupons, activeCoupons, totalUsages };
}

// ─── Bank Offer Actions ─────────────────────────────────────────────────────

export async function getBankOffers() {
  const offers = await prisma.bankOffer.findMany({
    orderBy: { createdAt: "desc" },
  });

  return offers.map((offer) => ({
    ...offer,
    discountValue: Number(offer.discountValue),
    minOrderAmount: Number(offer.minOrderAmount),
    maxDiscount: offer.maxDiscount ? Number(offer.maxDiscount) : null,
  }));
}

export async function getBankOfferById(id: string) {
  const offer = await prisma.bankOffer.findUnique({
    where: { id },
  });

  if (!offer) return null;

  return {
    ...offer,
    discountValue: Number(offer.discountValue),
    minOrderAmount: Number(offer.minOrderAmount),
    maxDiscount: offer.maxDiscount ? Number(offer.maxDiscount) : null,
  };
}

export async function restoreCoupon(id: string) {
  try {
    await prisma.coupon.update({
      where: { id },
      data: { isDeleted: false },
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to restore coupon";
    return { error: message };
  }
}

export async function getDeletedCoupons() {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { isDeleted: true },
      include: { _count: { select: { usages: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return coupons.map((coupon) => ({
      ...coupon,
      discountValue: Number(coupon.discountValue),
      minOrderAmount: Number(coupon.minOrderAmount),
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      actualUsageCount: coupon._count.usages,
    }));
  } catch (error) {
    console.error("Get deleted coupons error:", error);
    return [];
  }
}

export async function toggleCouponActive(id: string, isActive: boolean) {
  try {
    await prisma.coupon.update({
      where: { id },
      data: { isActive },
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to toggle coupon";
    return { error: message };
  }
}

export async function restoreBankOffer(id: string) {
  try {
    await prisma.bankOffer.update({
      where: { id },
      data: { isDeleted: false },
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to restore bank offer";
    return { error: message };
  }
}

export async function getDeletedBankOffers() {
  try {
    const offers = await prisma.bankOffer.findMany({
      where: { isDeleted: true },
      orderBy: { updatedAt: "desc" },
    });

    return offers.map((offer) => ({
      ...offer,
      discountValue: Number(offer.discountValue),
      minOrderAmount: Number(offer.minOrderAmount),
      maxDiscount: offer.maxDiscount ? Number(offer.maxDiscount) : null,
    }));
  } catch (error) {
    console.error("Get deleted bank offers error:", error);
    return [];
  }
}

export async function toggleBankOfferActive(id: string, isActive: boolean) {
  try {
    await prisma.bankOffer.update({
      where: { id },
      data: { isActive },
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to toggle bank offer";
    return { error: message };
  }
}
