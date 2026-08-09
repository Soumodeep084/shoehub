import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import crypto from "crypto";

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

    if (dbUser.role !== "DELIVERY_AGENT" && dbUser.role !== "ADMIN") {
      return Response.json({ message: "Forbidden: Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.deliveryAgentId !== dbUser.id && dbUser.role !== "ADMIN") {
      return Response.json({ message: "Forbidden: You are not assigned to this delivery" }, { status: 403 });
    }

    if (order.deliveryStatus === "DELIVERED") {
      return Response.json({ message: "Order is already delivered" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save hashed OTP to db
    await prisma.order.update({
      where: { id },
      data: {
        deliveryOtpHash: otpHash,
        deliveryOtpExpiresAt: expiresAt,
      },
    });

    // Send customer notification containing the plain OTP
    await prisma.notification.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        type: "ORDER_OUT_FOR_DELIVERY",
        title: "Delivery Verification OTP",
        body: `Your secure OTP for order ${order.orderNumber} is ${otp}. It is valid for 10 minutes. Share this only with your delivery agent.`,
      },
    });

    return Response.json({ success: true, message: "OTP sent to customer successfully" });
  } catch (error) {
    console.error("Generate OTP error:", error);
    return Response.json({ message: "Failed to generate OTP" }, { status: 500 });
  }
}
