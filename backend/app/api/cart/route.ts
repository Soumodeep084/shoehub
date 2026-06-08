import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";

export async function GET(req: Request) {
    try {
        const dbUser = await getCurrentDbUser(req);

        if (!dbUser) {
            return Response.json(
                { error: "UNAUTHORIZED", message: "Unauthorized" },
                { status: 401 }
            );
        }

        const cart = await prisma.cart.findMany({
            where: {
                userId: dbUser.id,
            },
            include: {
                product: {
                    include: {
                        images: true,
                        category: true,
                    },
                },
                variant: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return Response.json(cart);
    } catch (error) {
        console.error("GET Cart Error:", error);

        return Response.json(
            { message: "Failed to fetch cart" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const dbUser = await getCurrentDbUser(req);

        if (!dbUser) {
            return Response.json(
                { error: "UNAUTHORIZED", message: "Unauthorized" },
                { status: 401 }
            );
        }

        const {
            productId,
            variantId,
            quantity = 1,
        } = await req.json();

        if (!productId || !variantId) {
            return Response.json(
                { message: "Product ID and Variant ID are required" },
                { status: 400 }
            );
        }

        if (quantity < 1) {
            return Response.json(
                { message: "Quantity must be at least 1" },
                { status: 400 }
            );
        }

        const variant = await prisma.productVariant.findUnique({
            where: {
                id: variantId,
            },
        });

        if (!variant) {
            return Response.json(
                { message: "Variant not found" },
                { status: 404 }
            );
        }

        if (variant.productId !== productId) {
            return Response.json(
                { message: "Selected variant does not belong to this product." },
                { status: 400 }
            );
        }

        if (variant.stock < 1) {
            return Response.json(
                { message: "Variant is out of stock" },
                { status: 409 }
            );
        }

        if (variant.stock < quantity) {
            return Response.json(
                { message: `Requested quantity exceeds available stock. Only ${variant.stock} item${variant.stock === 1 ? '' : 's'} currently available.` },
                { status: 409 }
            );
        }

        const existingItem = await prisma.cart.findUnique({
            where: {
                userId_variantId: {
                    userId: dbUser.id,
                    variantId,
                },
            },
        });

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;

            if (newQuantity > variant.stock) {
                return Response.json(
                    {
                        message: `Only ${variant.stock} items available in stock`,
                    },
                    { status: 400 }
                );
            }

            const updated = await prisma.cart.update({
                where: {
                    userId_variantId: {
                        userId: dbUser.id,
                        variantId,
                    },
                },
                data: {
                    quantity: newQuantity,
                },
            });

            return Response.json(updated);
        }

        if (quantity > variant.stock) {
            return Response.json(
                {
                    message: `Only ${variant.stock} item${variant.stock === 1 ? "" : "s"} available in stock.`,
                },
                { status: 409 }
            );
        }

        const cartItem = await prisma.cart.create({
            data: {
                userId: dbUser.id,
                productId,
                variantId,
                quantity,
            },
        });

        return Response.json(cartItem, {
            status: 201,
        });
    } catch (error) {
        console.error("POST Cart Error:", error);

        return Response.json(
            { message: "Failed to add item to cart" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const dbUser = await getCurrentDbUser(req);

        if (!dbUser) {
            return Response.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const {
            variantId,
            quantity,
        } = await req.json();

        if (!variantId) {
            return Response.json(
                { message: "Variant ID is required" },
                { status: 400 }
            );
        }

        if (!quantity || quantity < 1) {
            return Response.json(
                { message: "Quantity must be greater than 0" },
                { status: 400 }
            );
        }

        const cartItem = await prisma.cart.findUnique({
            where: {
                userId_variantId: {
                    userId: dbUser.id,
                    variantId,
                },
            },
        });

        if (!cartItem) {
            return Response.json(
                { message: "Cart item not found" },
                { status: 404 }
            );
        }

        const variant = await prisma.productVariant.findUnique({
            where: {
                id: variantId,
            },
        });

        if (!variant) {
            return Response.json(
                { message: "Variant not found" },
                { status: 404 }
            );
        }

        if (quantity > variant.stock) {
            return Response.json(
                {
                    message: `Only ${variant.stock} items available in stock`,
                },
                { status: 400 }
            );
        }

        const updated = await prisma.cart.update({
            where: {
                userId_variantId: {
                    userId: dbUser.id,
                    variantId,
                },
            },
            data: {
                quantity,
            },
        });

        return Response.json(updated);
    } catch (error) {
        console.error("PATCH Cart Error:", error);

        return Response.json(
            { message: "Failed to update quantity" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const dbUser = await getCurrentDbUser(req);

        if (!dbUser) {
            return Response.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { variantId } = await req.json();

        if (!variantId) {
            return Response.json(
                { message: "Variant ID is required" },
                { status: 400 }
            );
        }

        const cartItem = await prisma.cart.findUnique({
            where: {
                userId_variantId: {
                    userId: dbUser.id,
                    variantId,
                },
            },
        });

        if (!cartItem) {
            return Response.json(
                { message: "Cart item not found" },
                { status: 404 }
            );
        }

        await prisma.cart.delete({
            where: {
                userId_variantId: {
                    userId: dbUser.id,
                    variantId,
                },
            },
        });

        return Response.json({
            success: true,
            message: "Item removed from cart",
        });
    } catch (error) {
        console.error("DELETE Cart Error:", error);

        return Response.json(
            { message: "Failed to remove item from cart" },
            { status: 500 }
        );
    }
}