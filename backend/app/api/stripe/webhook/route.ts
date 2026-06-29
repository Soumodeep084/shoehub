/* eslint-disable @typescript-eslint/no-explicit-any */
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const sig = (await headers()).get("stripe-signature");

        if (!sig) {
            return new Response("Missing signature", { status: 400 });
        }

        let event;

        try {
            event = stripe.webhooks.constructEvent(
                body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err) {
            console.error("Webhook signature error:", err);
            return new Response("Webhook Error", { status: 400 });
        }
        console.log(`✅ [WEBHOOK VERIFIED]: Parsed Stripe Event ➔ ${event.type}`)
        const paymentIntent = event.data.object as any;
        const orderId = paymentIntent.metadata?.orderId;

        // If the webhook event doesn't carry an orderId metadata tag, skip it gracefully
        if (!orderId) {
            return Response.json({ received: true });
        }

        // ─── CASE 1: PAYMENT SUCCESS ────────────────────────────────────────
        if (event.type === "payment_intent.succeeded") {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
            });

            // Prevent double-processing if webhook fires multiple times
            if (!order || order.paymentStatus === "PAID") {
                return Response.json({ received: true });
            }

            // Mark order as paid & confirmed
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: "PAID",
                    status: "CONFIRMED",
                },
            });

            // Clear the user's shopping cart in the database
            await prisma.cart.deleteMany({
                where: { userId: order.userId },
            });

            console.log(`🔔 Webhook: Order ${orderId} successfully PAID.`);
        }

        // ─── CASE 2: PAYMENT FAILED (Card Declined, System Fault, etc.) ──────
        else if (event.type === "payment_intent.payment_failed") {
            const errorMessage = paymentIntent.last_payment_error?.message || "Payment declined";

            // Update DB record to reflect the decline
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: "FAILED",
                    // We keep status as PENDING so the user can retry checkout from their order history tab!
                },
            });

            console.log(`❌ Webhook: Order ${orderId} payment failed. Reason: ${errorMessage}`);
        }

        // ─── CASE 3: INTENT EXPLICITLY CANCELED ──────────────────────────────
        else if (event.type === "payment_intent.canceled") {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: "FAILED",
                    status: "CANCELLED",
                },
            });

            console.log(`🚫 Webhook: Order ${orderId} intent was explicitly canceled.`);
        }

        return Response.json({ received: true });

    } catch (error) {
        console.error("Webhook route runtime error:", error);
        return Response.json({ message: "Internal Webhook Error" }, { status: 500 });
    }
}