"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { OrderStatus, PaymentStatus, Prisma, DeliveryStatus } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import {
  canCancelOrder,
  restoreOrderInventory,
  processStripeRefundIfNeeded,
  appendOrderEvent,
  notifyOrderStatusChange,
  getNextOrderStatusAllowed
} from "@/lib/orderLifecycle";

interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getOrders({
  page = 1,
  limit = 10,
  status,
  search,
  sortBy,
  sortOrder = "desc",
}: GetOrdersParams = {}) {
  const where: Prisma.OrderWhereInput = {};

  if (status && status !== "all") {
    where.status = status as OrderStatus;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { firstName: { contains: search, mode: "insensitive" } } },
      { user: { lastName: { contains: search, mode: "insensitive" } } },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy.createdAt = "desc";
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, imageUrl: true },
        },
        items: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: {
        name: `${order.user.firstName} ${order.user.lastName}`,
        email: order.user.email,
        imageUrl: order.user.imageUrl,
      },
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: Number(order.totalAmount),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt,
    })),
    total,
    pageCount: Math.ceil(total / limit),
  };
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
      deliveryAgent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
      items: true,
      events: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!order) return null;

  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    couponDiscount: Number(order.couponDiscount),
    bankOfferDiscount: Number(order.bankOfferDiscount),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
    events: order.events.map((event) => ({
      ...event,
      createdAt: event.createdAt,
    })),
  };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.status === status) {
      return { success: true };
    }

    // Validate transition
    const isAllowed = getNextOrderStatusAllowed(order.status, status);
    if (!isAllowed) {
      return { success: false, error: `Fulfillment status transition from ${order.status} to ${status} is not allowed.` };
    }

    if (status === "CANCELLED") {
      if (!canCancelOrder(order.status)) {
        return { success: false, error: "Order cannot be cancelled in its current state." };
      }

      await prisma.$transaction(async (tx) => {
        // 1. Restore Stock
        await restoreOrderInventory(tx, order.items);

        // 2. Process Stripe refund
        let newPaymentStatus = order.paymentStatus;
        if (order.paymentMethod === "ONLINE" && order.paymentStatus === "PAID") {
          try {
            const refund = await processStripeRefundIfNeeded(stripe, order);
            if (refund) {
              newPaymentStatus = "REFUNDED";
            }
          } catch (refundErr) {
            console.error("Stripe refund error during admin cancellation:", refundErr);
          }
        }

        // 3. Update Order
        await tx.order.update({
          where: { id },
          data: {
            status: "CANCELLED",
            paymentStatus: newPaymentStatus,
            cancelledAt: new Date(),
            cancelReason: "Cancelled by administrator",
          },
        });

        // 4. Log timeline event
        await appendOrderEvent(tx, {
          orderId: id,
          status: "CANCELLED",
          description: "Cancelled by administrator",
        });

        // 5. Notify user
        await notifyOrderStatusChange(tx, {
          userId: order.userId,
          orderId: id,
          status: "CANCELLED",
          description: "Cancelled by administrator",
        });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        const updateData: Prisma.OrderUpdateInput = { status };
        if (status === "DELIVERED") {
          updateData.paymentStatus = "PAID";
        }

        await tx.order.update({
          where: { id },
          data: updateData,
        });

        await appendOrderEvent(tx, {
          orderId: id,
          status,
        });

        await notifyOrderStatusChange(tx, {
          userId: order.userId,
          orderId: id,
          status,
        });
      });
    }

    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error("Admin Update Order Status Error:", error);
    return { success: false, error: error.message || "Failed to update order status." };
  }
}

export async function updateOrderPaymentStatus(id: string, paymentStatus: PaymentStatus) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { paymentStatus: true, paymentMethod: true, status: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.paymentMethod === "COD" && order.status === "DELIVERED") {
      return { success: false, error: "Payment status cannot be modified once a Cash on Delivery (COD) order has been delivered." };
    }

    if (order.status === "DELIVERED" && (paymentStatus === "PENDING" || paymentStatus === "FAILED")) {
      return { success: false, error: "Payment status cannot be set to PENDING or FAILED once the order has been delivered." };
    }

    if (paymentStatus === "REFUNDED") {
      if (order.paymentStatus !== "PAID") {
        return { success: false, error: "Payment status can only be set to REFUNDED if it is currently PAID." };
      }
    }

    await prisma.order.update({
      where: { id },
      data: { paymentStatus },
    });

    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error("Admin Update Order Payment Status Error:", error);
    return { success: false, error: error.message || "Failed to update payment status." };
  }
}

export async function getDeliveryAgents() {
  try {
    const sessionUser = await currentUser();
    if (!sessionUser) return { error: "Unauthorized" };

    const adminUser = await prisma.user.findUnique({
      where: { clerkId: sessionUser.id },
    });
    if (!adminUser || (adminUser.role !== "ADMIN" && adminUser.role !== "STAFF")) {
      return { error: "Forbidden: Only admins or staff can perform this action" };
    }

    const agents = await prisma.user.findMany({
      where: { role: "DELIVERY_AGENT" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        imageUrl: true,
      },
      orderBy: { firstName: "asc" },
    });

    return { success: true, agents };
  } catch (err) {
    const error = err as Error;
    console.error("Get delivery agents error:", error);
    return { error: error.message || "Failed to fetch delivery agents" };
  }
}

export async function assignDeliveryAgent(orderId: string, agentId: string) {
  try {
    const sessionUser = await currentUser();
    if (!sessionUser) return { error: "Unauthorized" };

    const adminUser = await prisma.user.findUnique({
      where: { clerkId: sessionUser.id },
    });
    if (!adminUser || (adminUser.role !== "ADMIN" && adminUser.role !== "STAFF")) {
      return { error: "Forbidden: Only admins or staff can perform this action" };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) return { error: "Order not found" };

    // Prevent assigning if not packed
    const allowedStatuses: OrderStatus[] = ["PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
    if (!allowedStatuses.includes(order.status)) {
      return { error: "Orders can only be assigned to a delivery agent after they have been packed." };
    }

    // Reassignment restriction: only allowed if status is ASSIGNED or no agent assigned yet.
    if (order.deliveryStatus && order.deliveryStatus !== "ASSIGNED") {
      return { error: "Cannot reassign order. Delivery process has already started (agent has accepted or picked up)." };
    }

    const agent = await prisma.user.findUnique({
      where: { id: agentId, role: "DELIVERY_AGENT" },
    });
    if (!agent) return { error: "Selected delivery agent not found or invalid role." };

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          deliveryAgentId: agentId,
          deliveryStatus: "ASSIGNED",
          deliveryAssignedAt: new Date(),
        },
      });

      await appendOrderEvent(tx, {
        orderId,
        status: order.status,
        title: "Delivery Agent Assigned",
        description: `Delivery agent ${agent.firstName} ${agent.lastName} has been assigned to this order.`,
      });

      // Send custom push/in-app notification to client
      await notifyOrderStatusChange(tx, {
        userId: order.userId,
        orderId,
        status: order.status,
        description: `Delivery agent ${agent.firstName} ${agent.lastName} has been assigned to deliver your order.`,
      });

      // Send a notification to the delivery agent themselves
      await tx.notification.create({
        data: {
          userId: agent.id,
          orderId,
          type: "ORDER_CONFIRMED",
          title: "New Delivery Assigned",
          body: `You have been assigned to order ${order.orderNumber}. Please check details and accept.`,
        }
      });

      return updated;
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error("Assign delivery agent error:", error);
    return { error: error.message || "Failed to assign delivery agent" };
  }
}

export async function overrideDeliveryStatus(orderId: string, deliveryStatus: DeliveryStatus, reason: string) {
  try {
    const sessionUser = await currentUser();
    if (!sessionUser) return { error: "Unauthorized" };

    const adminUser = await prisma.user.findUnique({
      where: { clerkId: sessionUser.id },
    });
    if (!adminUser || adminUser.role !== "ADMIN") {
      return { error: "Forbidden: Only admins can override delivery status" };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) return { error: "Order not found" };

    if (!reason || reason.trim() === "") {
      return { error: "An audit reason is required for a delivery status override." };
    }

    // Determine target OrderStatus based on DeliveryStatus
    let targetOrderStatus: OrderStatus = order.status;
    let paymentStatus: PaymentStatus = order.paymentStatus;
    const now = new Date();
    const timestampsUpdate: Prisma.OrderUpdateInput = {};

    if (deliveryStatus === "ASSIGNED") {
      timestampsUpdate.deliveryAssignedAt = now;
    } else if (deliveryStatus === "ACCEPTED") {
      timestampsUpdate.deliveryAcceptedAt = now;
    } else if (deliveryStatus === "PICKED_UP") {
      targetOrderStatus = "SHIPPED";
      timestampsUpdate.deliveryPickedUpAt = now;
    } else if (deliveryStatus === "OUT_FOR_DELIVERY") {
      targetOrderStatus = "OUT_FOR_DELIVERY";
      timestampsUpdate.deliveryOutForDeliveryAt = now;
    } else if (deliveryStatus === "DELIVERED") {
      targetOrderStatus = "DELIVERED";
      paymentStatus = "PAID";
      timestampsUpdate.deliveryDeliveredAt = now;
      timestampsUpdate.deliveryOtpHash = null;
      timestampsUpdate.deliveryOtpExpiresAt = null;
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          deliveryStatus,
          status: targetOrderStatus,
          paymentStatus,
          ...timestampsUpdate,
        },
      });

      await appendOrderEvent(tx, {
        orderId,
        status: targetOrderStatus,
        title: `Delivery Override: ${deliveryStatus}`,
        description: `Admin override to ${deliveryStatus}. Reason: ${reason}`,
      });

      await notifyOrderStatusChange(tx, {
        userId: order.userId,
        orderId,
        status: targetOrderStatus,
        description: `Delivery status updated to ${deliveryStatus} by system administrator.`,
      });
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error("Override delivery status error:", error);
    return { error: error.message || "Failed to override delivery status" };
  }
}
