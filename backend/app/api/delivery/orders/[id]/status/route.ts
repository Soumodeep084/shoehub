import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { appendOrderEvent, notifyOrderStatusChange } from "@/lib/orderLifecycle";
import crypto from "crypto";
import type { Prisma } from "@prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function POST(req: Request, { params }: Params) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Dynamic security check
    if ((dbUser.role as string) !== "DELIVERY_AGENT" && dbUser.role !== "ADMIN") {
      return Response.json({ message: "Forbidden: Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const { status: targetStatus, otp, paymentCollected } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    // Security check: Only the assigned agent or an admin can update
    if (order.deliveryAgentId !== dbUser.id && dbUser.role !== "ADMIN") {
      return Response.json({ message: "Forbidden: You are not assigned to this delivery" }, { status: 403 });
    }

    const currentStatus = order.deliveryStatus;

    // Lock check: Once delivered, lock the delivery status
    if (currentStatus === "DELIVERED") {
      return Response.json({ message: "Delivery is already completed and locked" }, { status: 400 });
    }

    // Strict forward progressive transitions: ASSIGNED -> ACCEPTED -> PICKED_UP -> OUT_FOR_DELIVERY -> DELIVERED
    const transitions: Record<string, string> = {
      ASSIGNED: "ACCEPTED",
      ACCEPTED: "PICKED_UP",
      PICKED_UP: "OUT_FOR_DELIVERY",
      OUT_FOR_DELIVERY: "DELIVERED",
    };

    // If order has no status yet, it's invalid (admin must assign first)
    if (!currentStatus) {
      return Response.json({ message: "Order has not been assigned to a delivery agent yet" }, { status: 400 });
    }

    if (transitions[currentStatus] !== targetStatus) {
      return Response.json({
        message: `Invalid status transition: cannot move from ${currentStatus} to ${targetStatus}`,
      }, { status: 400 });
    }

    const orderStatusUpdate: Prisma.OrderUpdateInput = {};
    const paymentStatusUpdate: Prisma.OrderUpdateInput = {};
    const deliveryUpdate: Prisma.OrderUpdateInput = { deliveryStatus: targetStatus };
    const now = new Date();

    // Map transitions
    if (targetStatus === "ACCEPTED") {
      deliveryUpdate.deliveryAcceptedAt = now;
    } else if (targetStatus === "PICKED_UP") {
      deliveryUpdate.deliveryPickedUpAt = now;
      orderStatusUpdate.status = "SHIPPED"; // automatically set order status to SHIPPED
    } else if (targetStatus === "OUT_FOR_DELIVERY") {
      deliveryUpdate.deliveryOutForDeliveryAt = now;
      orderStatusUpdate.status = "OUT_FOR_DELIVERY"; // automatically set order status to OUT_FOR_DELIVERY
    } else if (targetStatus === "DELIVERED") {
      // ─── Verification logic based on payment method ───
      if (order.paymentMethod === "ONLINE") {
        if (!otp) {
          return Response.json({ message: "OTP is required for prepaid delivery verification" }, { status: 400 });
        }

        if (!order.deliveryOtpHash || !order.deliveryOtpExpiresAt) {
          return Response.json({ message: "No active OTP generated for this order" }, { status: 400 });
        }

        if (new Date() > new Date(order.deliveryOtpExpiresAt)) {
          return Response.json({ message: "OTP has expired. Please send a new OTP" }, { status: 400 });
        }

        const hashedInput = hashOtp(otp);
        if (hashedInput !== order.deliveryOtpHash) {
          return Response.json({ message: "Invalid OTP. Verification failed" }, { status: 400 });
        }

        // Clear OTP hash and expiry on success
        deliveryUpdate.deliveryOtpHash = null;
        deliveryUpdate.deliveryOtpExpiresAt = null;
      } else if (order.paymentMethod === "COD") {
        if (!paymentCollected) {
          return Response.json({ message: "You must collect cash payment before delivering COD orders" }, { status: 400 });
        }
        paymentStatusUpdate.paymentStatus = "PAID";
      }

      deliveryUpdate.deliveryDeliveredAt = now;
      orderStatusUpdate.status = "DELIVERED"; // set order status to DELIVERED
      paymentStatusUpdate.paymentStatus = "PAID"; // prepaid orders are already PAID, COD becomes PAID
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          ...deliveryUpdate,
          ...orderStatusUpdate,
          ...paymentStatusUpdate,
        },
      });

      // Log event to timeline
      let eventTitle = `Delivery Status: ${targetStatus}`;
      let eventDescription = `Delivery progress updated to ${targetStatus} by agent.`;
      if (targetStatus === "DELIVERED") {
        eventTitle = "Delivered";
        eventDescription = `Order delivered successfully by agent. Verified via ${order.paymentMethod === "ONLINE" ? "OTP" : "Cash Collection"}.`;
      } else if (targetStatus === "PICKED_UP") {
        eventTitle = "Order Shipped";
        eventDescription = "Items picked up by delivery agent and are in transit.";
      } else if (targetStatus === "OUT_FOR_DELIVERY") {
        eventTitle = "Out for Delivery";
        eventDescription = "Delivery agent is on their way with your order.";
      }

      await appendOrderEvent(tx, {
        orderId: id,
        status: updated.status,
        title: eventTitle,
        description: eventDescription,
      });

      // Send customer notification
      await notifyOrderStatusChange(tx, {
        userId: order.userId,
        orderId: id,
        status: updated.status,
        description: eventDescription,
      });

      return updated;
    });

    return Response.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("POST Delivery Order Status Error:", error);
    return Response.json({ message: "Failed to update delivery status" }, { status: 500 });
  }
}
