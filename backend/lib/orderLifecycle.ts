import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";

export type OrderStatusValue =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type NotificationTypeValue =
  | "ORDER_PLACED"
  | "ORDER_CONFIRMED"
  | "ORDER_PACKED"
  | "ORDER_SHIPPED"
  | "ORDER_OUT_FOR_DELIVERY"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "PROMOTIONS_OFFERS"
  | "COUPONS"
  | "BANK_OFFERS"
  | "NEW_ARRIVALS";

export function normalizeOrderStatus(status: string): OrderStatusValue {
  return status as OrderStatusValue;
}

export function getNextOrderStatusAllowed(currentStatus: string, nextStatus: string) {
  const current = currentStatus as OrderStatusValue;
  const next = nextStatus as OrderStatusValue;

  // If current is same as next, it's allowed (no-op)
  if (current === next) return true;

  // Can't move from terminal states
  if (["CANCELLED", "REFUNDED", "DELIVERED"].includes(current)) {
    // Only exception is DELIVERED -> REFUNDED or CANCELLED -> REFUNDED
    if ((current === "DELIVERED" || current === "CANCELLED") && next === "REFUNDED") {
      return true;
    }
    return false;
  }

  // If next is CANCELLED, it's allowed from PENDING, CONFIRMED, PROCESSING, PACKED, SHIPPED, OUT_FOR_DELIVERY
  if (next === "CANCELLED") {
    return ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(current);
  }

  // Define progressive order of stages
  const stages: OrderStatusValue[] = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED"
  ];

  const currentIndex = stages.indexOf(current);
  const nextIndex = stages.indexOf(next);

  // If they are valid stages, allow moving forward (nextIndex > currentIndex)
  if (currentIndex !== -1 && nextIndex !== -1) {
    return nextIndex > currentIndex;
  }

  return false;
}

export function canCancelOrder(status: string) {
  return ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(status);
}

export function getTimelineTitle(status: OrderStatusValue) {
  switch (status) {
    case "PENDING":
      return "Order Placed";
    case "CONFIRMED":
      return "Order Confirmed";
    case "PROCESSING":
      return "Order Processing";
    case "PACKED":
      return "Order Packed";
    case "SHIPPED":
      return "Order Shipped";
    case "OUT_FOR_DELIVERY":
      return "Out for Delivery";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    case "REFUNDED":
      return "Refunded";
    default:
      return "Order Updated";
  }
}

export function getNotificationCopy(status: OrderStatusValue) {
  switch (status) {
    case "PENDING":
      return {
        type: "ORDER_PLACED" as NotificationTypeValue,
        title: "Order placed successfully",
        body: "We have received your order and it is now being prepared.",
      };
    case "CONFIRMED":
      return {
        type: "ORDER_CONFIRMED" as NotificationTypeValue,
        title: "Order confirmed",
        body: "Your order is confirmed and will move to packing soon.",
      };
    case "PROCESSING":
      return {
        type: "ORDER_CONFIRMED" as NotificationTypeValue,
        title: "Order processing",
        body: "Your order is now being processed.",
      };
    case "PACKED":
      return {
        type: "ORDER_PACKED" as NotificationTypeValue,
        title: "Order packed",
        body: "Your items have been packed and are ready to ship.",
      };
    case "SHIPPED":
      return {
        type: "ORDER_SHIPPED" as NotificationTypeValue,
        title: "Order shipped",
        body: "Your order is on the way to the delivery hub.",
      };
    case "OUT_FOR_DELIVERY":
      return {
        type: "ORDER_OUT_FOR_DELIVERY" as NotificationTypeValue,
        title: "Out for delivery",
        body: "Your order is out for delivery and will arrive soon.",
      };
    case "DELIVERED":
      return {
        type: "ORDER_DELIVERED" as NotificationTypeValue,
        title: "Order delivered",
        body: "Your order has been delivered successfully.",
      };
    case "CANCELLED":
      return {
        type: "ORDER_CANCELLED" as NotificationTypeValue,
        title: "Order cancelled",
        body: "Your order was cancelled and any applicable refund was processed.",
      };
    case "REFUNDED":
      return {
        type: "ORDER_CANCELLED" as NotificationTypeValue,
        title: "Order refunded",
        body: "Your order has been refunded successfully.",
      };
    default:
      return {
        type: "ORDER_PLACED" as NotificationTypeValue,
        title: "Order updated",
        body: "Your order status has changed.",
      };
  }
}

export async function ensureNotificationPreference(db: Prisma.TransactionClient, userId: string) {
  const existing = await db.notificationPreference.findUnique({ where: { userId } });
  if (existing) return existing;

  return db.notificationPreference.create({
    data: { userId },
  });
}

export async function sendNotification(
  db: Prisma.TransactionClient,
  params: {
    userId: string;
    type: NotificationTypeValue;
    title: string;
    body: string;
    orderId?: string | null;
    data?: Record<string, unknown>;
  }
) {
  const preference = await ensureNotificationPreference(db, params.userId);
  const allowed =
    params.type.startsWith("ORDER_")
      ? preference.orderUpdates
      : params.type === "PROMOTIONS_OFFERS"
        ? preference.promotionsOffers
        : params.type === "COUPONS"
          ? preference.coupons
          : params.type === "BANK_OFFERS"
            ? preference.bankOffers
            : params.type === "NEW_ARRIVALS"
              ? preference.newArrivals
              : true;

  if (!allowed) return null;

  return db.notification.create({
    data: {
      userId: params.userId,
      orderId: params.orderId ?? null,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data ?? undefined,
    },
  });
}

export async function appendOrderEvent(
  db: Prisma.TransactionClient,
  params: {
    orderId: string;
    status: OrderStatusValue;
    title?: string;
    description?: string | null;
  }
) {
  return db.orderEvent.create({
    data: {
      orderId: params.orderId,
      status: normalizeOrderStatus(params.status),
      title: params.title ?? getTimelineTitle(params.status),
      description: params.description ?? null,
    },
  });
}

export async function notifyOrderStatusChange(
  db: Prisma.TransactionClient,
  params: {
    userId: string;
    orderId: string;
    status: OrderStatusValue;
    description?: string | null;
  }
) {
  const copy = getNotificationCopy(params.status);
  await sendNotification(db, {
    userId: params.userId,
    type: copy.type,
    title: copy.title,
    body: params.description ? `${copy.body} ${params.description}` : copy.body,
    orderId: params.orderId,
    data: { status: normalizeOrderStatus(params.status) },
  });
}

export async function reserveOrderInventory(
  db: Prisma.TransactionClient,
  cartItems: { variantId: string; quantity: number }[]
) {
  for (const item of cartItems) {
    await db.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { decrement: item.quantity } },
    });
  }
}

export async function restoreOrderInventory(
  db: Prisma.TransactionClient,
  orderItems: { variantId: string; quantity: number }[]
) {
  for (const item of orderItems) {
    await db.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    });
  }
}

export async function processStripeRefundIfNeeded(
  stripe: Stripe,
  order: {
    paymentStatus: string;
    paymentMethod: string;
    stripePaymentIntentId?: string | null;
  }
) {
  if (
    order.paymentMethod !== "ONLINE" ||
    order.paymentStatus !== "PAID" ||
    !order.stripePaymentIntentId
  ) {
    return null;
  }

  return stripe.refunds.create({
    payment_intent: order.stripePaymentIntentId,
  });
}