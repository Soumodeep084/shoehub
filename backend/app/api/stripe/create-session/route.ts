import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getCurrentDbUser } from "@/lib/currentUser";

export async function POST(req: Request) {
    try {
        const dbUser = await getCurrentDbUser(req);

        if (!dbUser) {
            return Response.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { orderId } = await req.json();

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: dbUser.id,
            },
            include: {
                items: true,
            },
        });

        if (!order) {
            return Response.json(
                { message: "Order not found" },
                { status: 404 }
            );
        }

        const session = await stripe.checkout.sessions.create({
            customer_email: "namaste@yopmail.com",
            payment_method_types: ["card", "upi" , "amazon_pay" , ""],

            mode: "payment",

            line_items: order.items.map((item) => ({
                price_data: {
                    currency: "inr",

                    product_data: {
                        name: item.productName,
                        images: [item.productImageUrl],
                    },

                    unit_amount: 1000, // For testing, set to 1 INR (100 paise)

                    // unit_amount: Math.round(
                    //     Number(item.unitPrice) * 100
                    // ),
                },

                quantity: item.quantity,
            })),

            success_url:
                "shoehub://checkout/success?orderId=" + order.id,

            cancel_url:
                "shoehub://checkout/failure?orderId=" + order.id,

            metadata: {
                orderNumber: order.orderNumber,
                orderId: order.id,
                userId: dbUser.id,
            },
        });

        await prisma.order.update({
            where: {
                id: order.id,
            },
            data: {
                stripeSessionId: session.id,
                stripePaymentIntentId:
                    typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : null,
            },
        });

        return Response.json({
            url: session.url,
        });
    } catch (error) {
        console.error(error);

        return Response.json(
            {
                message: "Failed to create session",
            },
            { status: 500 }
        );
    }
}