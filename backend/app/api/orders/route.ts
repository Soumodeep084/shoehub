import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";

function generateOrderNumber(userId: string) {
  const timestamp = Date.now();
  const splitUserId = userId.split("-")[0];
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${splitUserId}-${randomSuffix}`;
}

export async function GET(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: { userId: dbUser.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(
      orders.map((order) => ({
        ...order,
        itemCount: order.items.reduce((count, item) => count + item.quantity, 0),
      }))
    );
  } catch (error) {
    console.error("GET Orders Error:", error);
    return Response.json({ message: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { addressId, paymentMethod } = await req.json();
    if (!addressId) return Response.json({ message: "Address required" }, { status: 400 });

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: dbUser.id },
    });
    if (!address) return Response.json({ message: "Address not found" }, { status: 404 });

    const cartItems = await prisma.cart.findMany({
      where: { userId: dbUser.id },
      include: {
        product: { include: { images: true } },
        variant: true,
      },
    });
    if (cartItems.length === 0) return Response.json({ message: "Cart is empty" }, { status: 400 });

    let computedSubtotal = 0;
    for (const item of cartItems) {
      if (item.quantity > item.variant.stock) {
        return Response.json(
          { message: `${item.product.name} only has ${item.variant.stock} units left in stock.` },
          { status: 400 }
        );
      }
      computedSubtotal += Number(item.product.salePrice) * item.quantity;
    }

    const shippingFee = computedSubtotal > 1000 ? 0 : 99;
    const discountAmount = 0;
    const computedTotal = computedSubtotal + shippingFee - discountAmount;
    // const computedTotal = 60;

    const orderNumber = generateOrderNumber(dbUser.id);
    const isCod = paymentMethod === "COD";

    const order = await prisma.$transaction(async (tx) => {
      // 🔄 RETRY PROTECTION RULE: Look for an existing, unfulfilled PENDING order session
      const existingPendingOrder = await tx.order.findFirst({
        where: {
          userId: dbUser.id,
          status: "PENDING",
          paymentStatus: "PENDING"
        }
      });

      if (existingPendingOrder) {
        // Drop outdated items linked to the previous broken run
        await tx.orderItem.deleteMany({
          where: { orderId: existingPendingOrder.id }
        });

        // Update existing row metrics. 
        // Note: Resetting stripePaymentIntentId to null so the upcoming intent generation puts a fresh token on it.
        const updatedOrder = await tx.order.update({
          where: { id: existingPendingOrder.id },
          data: {
            subtotal: computedSubtotal,
            shippingFee,
            discountAmount,
            totalAmount: computedTotal,
            status: isCod ? "CONFIRMED" : "PENDING",
            stripePaymentIntentId: null,
            shippingName: address.fullName,
            shippingPhone: address.phone,
            shippingLine1: address.line1,
            shippingLine2: address.line2,
            shippingCity: address.city,
            shippingState: address.state,
            shippingPostalCode: address.postalCode,
            shippingCountry: address.country,
            shippingLandmark: address.landmark,
            items: {
              create: cartItems.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                productName: item.product.name,
                productBrand: item.product.brand,
                productImageUrl:
                  item.product.images.find((i) => i.isPrimary)?.imageUrl ||
                  item.product.images[0]?.imageUrl ||
                  "",
                size: item.variant.size,
                color: item.variant.color,
                quantity: item.quantity,
                unitPrice: Number(item.product.salePrice),
                totalPrice: Number(item.product.salePrice) * item.quantity,
              })),
            },
          }
        });

        if (isCod) {
          await tx.cart.deleteMany({ where: { userId: dbUser.id } });
          for (const item of cartItems) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }

        return updatedOrder;
      }

      // ✨ FRESH ORDER PATHWAY
      const newOrder = await tx.order.create({
        data: {
          userId: dbUser.id,
          orderNumber,
          subtotal: computedSubtotal,
          shippingFee,
          discountAmount,
          totalAmount: computedTotal,
          status: isCod ? "CONFIRMED" : "PENDING",
          paymentStatus: "PENDING",
          shippingName: address.fullName,
          shippingPhone: address.phone,
          shippingLine1: address.line1,
          shippingLine2: address.line2,
          shippingCity: address.city,
          shippingState: address.state,
          shippingPostalCode: address.postalCode,
          shippingCountry: address.country,
          shippingLandmark: address.landmark,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.product.name,
              productBrand: item.product.brand,
              productImageUrl:
                item.product.images.find((i) => i.isPrimary)?.imageUrl ||
                item.product.images[0]?.imageUrl ||
                "",
              size: item.variant.size,
              color: item.variant.color,
              quantity: item.quantity,
              unitPrice: Number(item.product.salePrice),
              totalPrice: Number(item.product.salePrice) * item.quantity,
            })),
          },
        },
      });

      if (isCod) {
        await tx.cart.deleteMany({ where: { userId: dbUser.id } });
        for (const item of cartItems) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return newOrder;
    });

    return Response.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.totalAmount),
    });
  } catch (error) {
    console.error("POST Order Creation Error:", error);
    return Response.json({ message: "Failed to execute order generation" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { orderId } = await req.json();
    if (!orderId) return Response.json({ message: "Order ID is required" }, { status: 400 });

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: dbUser.id },
    });
    if (!order) return Response.json({ message: "Order record not found" }, { status: 404 });

    // Ensure the Stripe intent ID has been updated onto the row by your stripe endpoint
    if (!order.stripePaymentIntentId) {
      return Response.json(
        { message: "Cannot verify payment status: No Stripe Payment Intent ID is linked to this order row." },
        { status: 400 }
      );
    }

    if (order.paymentStatus === "PAID") {
      return Response.json({ message: "Order payment status is already marked as success." }, { status: 200 });
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      }),
      prisma.cart.deleteMany({
        where: { userId: dbUser.id },
      }),
    ]);

    return Response.json({
      message: "Payment verified and order finalized successfully.",
      orderId: order.id,
      paymentStatus: "PAID",
    }, { status: 200 });
  } catch (error) {
    console.error("PATCH Order Verification Error:", error);
    return Response.json({ message: "Failed to update order payment parameters" }, { status: 500 });
  }
}

