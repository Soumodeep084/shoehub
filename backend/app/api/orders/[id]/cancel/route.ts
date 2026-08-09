import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { stripe } from "@/lib/stripe";
import {
  restoreOrderInventory,
  processStripeRefundIfNeeded,
  appendOrderEvent,
  notifyOrderStatusChange,
} from "@/lib/orderLifecycle";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Params) {
  try {
    const dbUser = await getCurrentDbUser(req);

    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { reason } = await req.json().catch(() => ({ reason: "Cancelled by user" }));

    // Fetch order with items
    const order = await prisma.order.findFirst({
      where: { id, userId: dbUser.id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.status === "CANCELLED") {
      return Response.json({ message: "Order is already cancelled" }, { status: 400 });
    }

    const customerCancellable = ["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status);
    if (!customerCancellable) {
      return Response.json(
        { message: `Cancellation is no longer allowed. The order has already been ${order.status.toLowerCase()}.` },
        { status: 400 }
      );
    }

    // Perform refund and status update in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Restore Inventory
      await restoreOrderInventory(tx, order.items);

      // 2. Stripe refund if paid online
      let newPaymentStatus = order.paymentStatus;

      if (order.paymentMethod === "ONLINE" && order.paymentStatus === "PAID") {
        try {
          const refund = await processStripeRefundIfNeeded(stripe, order);
          if (refund) {
            newPaymentStatus = "REFUNDED";
          }
        } catch (refundErr) {
          console.error("Stripe refund error during cancellation:", refundErr);
        }
      }

      // 3. Update Order
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          paymentStatus: newPaymentStatus,
          cancelledAt: new Date(),
          cancelReason: reason || "Cancelled by user",
        },
      });

      // 4. Log timeline event
      await appendOrderEvent(tx, {
        orderId: id,
        status: "CANCELLED",
        description: reason || "Cancelled by user",
      });

      // 5. Notify customer
      await notifyOrderStatusChange(tx, {
        userId: dbUser.id,
        orderId: id,
        status: "CANCELLED",
        description: reason || "Cancelled by user",
      });

      return updated;
    });

    return Response.json(updatedOrder);
  } catch (error) {
    console.error("POST Order Cancel Error:", error);
    return Response.json({ message: "Failed to cancel order" }, { status: 500 });
  }
}
