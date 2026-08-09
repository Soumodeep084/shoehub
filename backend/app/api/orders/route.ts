import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import {
  appendOrderEvent,
  notifyOrderStatusChange,
  reserveOrderInventory,
} from "@/lib/orderLifecycle";

function generateOrderNumber(userId: string) {
  const timestamp = Date.now();
  const splitUserId = userId.split("-")[0];
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${splitUserId}-${randomSuffix}`;
}

// ─── Discount Calculator ────────────────────────────────────────────────────
function calculateDiscount(
  discountType: "PERCENTAGE" | "FIXED",
  discountValue: number,
  subtotal: number,
  maxDiscount: number | null
): number {
  let discount: number;

  if (discountType === "PERCENTAGE") {
    discount = (subtotal * discountValue) / 100;
    if (maxDiscount !== null && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else {
    discount = discountValue;
  }

  return Math.min(discount, subtotal);
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

    const { addressId, paymentMethod, couponCode, bankOfferId } = await req.json();
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

    // ─── Coupon Validation (server-side, never trust frontend) ────────────
    let couponDiscount = 0;
    let couponCodeSnapshot: string | null = null;
    let validatedCouponId: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() },
      });

      if (!coupon) {
        return Response.json({ message: "Invalid coupon code" }, { status: 400 });
      }

      if (!coupon.isActive) {
        return Response.json({ message: "This coupon is no longer active" }, { status: 400 });
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return Response.json({ message: "This coupon has expired" }, { status: 400 });
      }

      let applicableSubtotal = computedSubtotal;
      if (coupon.categoryId) {
        applicableSubtotal = cartItems
          .filter((item) => item.product.categoryId === coupon.categoryId)
          .reduce((sum, item) => sum + Number(item.product.salePrice) * item.quantity, 0);

        if (applicableSubtotal === 0) {
          return Response.json(
            { message: "This coupon is only valid for items in a specific category" },
            { status: 400 }
          );
        }
      }

      if (applicableSubtotal < Number(coupon.minOrderAmount)) {
        return Response.json(
          { message: `Minimum order amount of ₹${Number(coupon.minOrderAmount)} required for the applicable category items` },
          { status: 400 }
        );
      }

      if (coupon.totalUsageLimit !== null && coupon.usageCount >= coupon.totalUsageLimit) {
        return Response.json({ message: "This coupon has reached its usage limit" }, { status: 400 });
      }

      const userUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId: dbUser.id },
      });

      if (userUsageCount >= coupon.perUserLimit) {
        return Response.json(
          { message: "You have already used this coupon the maximum number of times" },
          { status: 400 }
        );
      }

      couponDiscount = calculateDiscount(
        coupon.discountType,
        Number(coupon.discountValue),
        applicableSubtotal,
        coupon.maxDiscount ? Number(coupon.maxDiscount) : null
      );
      couponCodeSnapshot = coupon.code;
      validatedCouponId = coupon.id;
    }

    // ─── Bank Offer Validation ────────────────────────────────────────────
    let bankOfferDiscount = 0;
    let bankOfferNameSnapshot: string | null = null;

    if (bankOfferId) {
      const bankOffer = await prisma.bankOffer.findUnique({
        where: { id: bankOfferId },
      });

      if (bankOffer && bankOffer.isActive) {
        const notExpired = !bankOffer.expiresAt || new Date(bankOffer.expiresAt) >= new Date();

        let applicableSubtotal = computedSubtotal;
        if (bankOffer.categoryId) {
          applicableSubtotal = cartItems
            .filter((item) => item.product.categoryId === bankOffer.categoryId)
            .reduce((sum, item) => sum + Number(item.product.salePrice) * item.quantity, 0);
        }

        const meetsMinimum = applicableSubtotal > 0 && applicableSubtotal >= Number(bankOffer.minOrderAmount);

        if (notExpired && meetsMinimum) {
          bankOfferDiscount = calculateDiscount(
            bankOffer.discountType,
            Number(bankOffer.discountValue),
            applicableSubtotal,
            bankOffer.maxDiscount ? Number(bankOffer.maxDiscount) : null
          );
          bankOfferNameSnapshot = `${bankOffer.bankName}${bankOffer.cardType ? ` (${bankOffer.cardType})` : ""}`;
        }
      }
      // Bank offer failures are soft — we don't block the order
    }

    // ─── Compute Final Amounts ────────────────────────────────────────────
    const shippingFee = computedSubtotal > 1000 ? 0 : 99;
    const totalDiscount = couponDiscount + bankOfferDiscount;
    const discountAmount = Math.round(totalDiscount * 100) / 100;
    const computedTotal = Math.max(computedSubtotal + shippingFee - discountAmount, 0);

    const orderNumber = generateOrderNumber(dbUser.id);
    const isCod = paymentMethod === "COD";

    if (bankOfferId && isCod) {
      return Response.json(
        { message: "Bank offers require online payment. COD is not available for this order." },
        { status: 400 }
      );
    }

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

        // Also clean up any stale coupon usage from the previous attempt
        await tx.couponUsage.deleteMany({
          where: { orderId: existingPendingOrder.id }
        });

        const updatedOrder = await tx.order.update({
          where: { id: existingPendingOrder.id },
          data: {
            subtotal: computedSubtotal,
            shippingFee,
            discountAmount,
            totalAmount: computedTotal,
            couponCode: couponCodeSnapshot,
            couponDiscount,
            bankOfferName: bankOfferNameSnapshot,
            bankOfferDiscount,
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

        // Record coupon usage
        if (validatedCouponId) {
          await tx.couponUsage.create({
            data: {
              couponId: validatedCouponId,
              userId: dbUser.id,
              orderId: updatedOrder.id,
            },
          });
          await tx.coupon.update({
            where: { id: validatedCouponId },
            data: { usageCount: { increment: 1 } },
          });
        }

        // Log timeline event
        await appendOrderEvent(tx, {
          orderId: updatedOrder.id,
          status: "PENDING",
        });
        await notifyOrderStatusChange(tx, {
          userId: dbUser.id,
          orderId: updatedOrder.id,
          status: "PENDING",
        });

        if (isCod) {
          await tx.cart.deleteMany({ where: { userId: dbUser.id } });
          for (const item of cartItems) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
          }
          await appendOrderEvent(tx, {
            orderId: updatedOrder.id,
            status: "CONFIRMED",
          });
          await notifyOrderStatusChange(tx, {
            userId: dbUser.id,
            orderId: updatedOrder.id,
            status: "CONFIRMED",
          });
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
          couponCode: couponCodeSnapshot,
          couponDiscount,
          bankOfferName: bankOfferNameSnapshot,
          bankOfferDiscount,
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

      // Record coupon usage
      if (validatedCouponId) {
        await tx.couponUsage.create({
          data: {
            couponId: validatedCouponId,
            userId: dbUser.id,
            orderId: newOrder.id,
          },
        });
        await tx.coupon.update({
          where: { id: validatedCouponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      // Log timeline event
      await appendOrderEvent(tx, {
        orderId: newOrder.id,
        status: "PENDING",
      });
      await notifyOrderStatusChange(tx, {
        userId: dbUser.id,
        orderId: newOrder.id,
        status: "PENDING",
      });

      if (isCod) {
        await tx.cart.deleteMany({ where: { userId: dbUser.id } });
        for (const item of cartItems) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
        await appendOrderEvent(tx, {
          orderId: newOrder.id,
          status: "CONFIRMED",
        });
        await notifyOrderStatusChange(tx, {
          userId: dbUser.id,
          orderId: newOrder.id,
          status: "CONFIRMED",
        });
      }

      return newOrder;
    });

    return Response.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.totalAmount),
      couponDiscount: Number(order.couponDiscount),
      bankOfferDiscount: Number(order.bankOfferDiscount),
      totalDiscount: Number(order.discountAmount),
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

    await prisma.$transaction(async (tx) => {
      // 1. Fetch order items
      const orderRecord = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!orderRecord) {
        throw new Error("Order not found");
      }

      // 2. Decrement stock
      await reserveOrderInventory(tx, orderRecord.items);

      // 3. Mark as paid
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      });

      // 4. Clear cart
      await tx.cart.deleteMany({
        where: { userId: dbUser.id },
      });

      // 5. Append timeline event
      await appendOrderEvent(tx, {
        orderId,
        status: "CONFIRMED",
      });

      // 6. Notify user
      await notifyOrderStatusChange(tx, {
        userId: dbUser.id,
        orderId,
        status: "CONFIRMED",
      });
    });

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
