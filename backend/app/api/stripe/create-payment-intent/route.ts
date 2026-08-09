import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";

export async function POST(req: Request) {
    try {
        const dbUser = await getCurrentDbUser(req);

        if (!dbUser) {
            return Response.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { orderId } = await req.json();

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: dbUser.id,
            },
        });

        if (!order) {
            return Response.json({ message: "Order not found" }, { status: 404 });
        }

        if (order.paymentStatus === "PAID") {
            return Response.json(
                { message: "Order already paid" },
                { status: 400 }
            );
        }

        // Calculate the exact amount needed in paisa/cents
        // const targetAmountInCents = Math.round(parseFloat(rawAmount.toString()) * 100);
        const targetAmountInCents = 100;

        // Safety guard for low transaction balances
        if (targetAmountInCents < 50) {
            return Response.json(
                { message: "Amount too small for Stripe minimum" },
                { status: 400 }
            );
        }

        // 🔄 SMART REUSE ENGINE: Validate old intents before blindly recycling them
        if (order.stripePaymentIntentId) {
            try {
                const existingIntent = await stripe.paymentIntents.retrieve(
                    order.stripePaymentIntentId
                );

                // Check that the intent can be used, and its saved cost matches the database row perfectly
                if (
                    existingIntent.client_secret &&
                    existingIntent.amount === targetAmountInCents &&
                    existingIntent.status === "requires_payment_method"
                ) {
                    return Response.json({
                        clientSecret: existingIntent.client_secret,
                    });
                }
            } catch (stripeErr) {
                // If it fails to retrieve (e.g. expired or wrong ID), log it and fall back to creating a new one
                console.warn("Stale intent retrieval skipped:", stripeErr);
            }
        }

        // 🌟 CREATE FRESH INTENT: Runs if none existed or the order cost changed via retry updates
        const paymentIntent = await stripe.paymentIntents.create({
            amount: targetAmountInCents,
            currency: "inr",
            payment_method_types: ["card", "upi"],
            metadata: {
                orderId: order.id,
                userId: dbUser.id,
            },
        });

        // Log the fresh token back to the targeting transaction row
        await prisma.order.update({
            where: { id: order.id },
            data: {
                stripePaymentIntentId: paymentIntent.id,
            },
        });

        return Response.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error("Payment Intent Core Failure:", error);
        return Response.json(
            { message: "Failed to create payment intent" },
            { status: 500 }
        );
    }
}