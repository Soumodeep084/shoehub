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
    const { otp } = await req.json();

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

    if (!otp) {
      return Response.json({ message: "OTP is required" }, { status: 400 });
    }

    if (!order.deliveryOtpHash || !order.deliveryOtpExpiresAt) {
      return Response.json({ message: "No active OTP generated for this order" }, { status: 400 });
    }

    if (new Date() > new Date(order.deliveryOtpExpiresAt)) {
      return Response.json({ message: "OTP has expired" }, { status: 400 });
    }

    const hashedInput = hashOtp(otp);
    if (hashedInput !== order.deliveryOtpHash) {
      return Response.json({ message: "Invalid OTP. Verification failed" }, { status: 400 });
    }

    return Response.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return Response.json({ message: "Failed to verify OTP" }, { status: 500 });
  }
}
