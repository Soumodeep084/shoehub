import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";

// 1. GET USER WISHLIST
export async function GET(req: Request) {
    try {
        const dbUser = await getCurrentDbUser(req);

        if (!dbUser) {
            return Response.json({ message: "Unauthorized" }, { status: 401 });
        }

        const wishlist = await prisma.wishlist.findMany({
            where: {
                userId: dbUser.id,
            },
            include: {
                product: {
                    include: {
                        images: true,
                        category: true,
                        variants: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return Response.json(wishlist);
    } catch (error) {
        console.error("GET Wishlist Error:", error);
        return Response.json({ message: "Failed to fetch wishlist" }, { status: 500 });
    }
}

// 2. ADD TO WISHLIST
export async function POST(req: Request) {
    try {
        const dbUser = await getCurrentDbUser(req);

        if (!dbUser) {
            return Response.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { productId } = await req.json();

        if (!productId) {
            return Response.json({ message: "Product ID is required" }, { status: 400 });
        }

        // FIX: Verify product exists using its primary key ID
        const productExists = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!productExists) {
            return Response.json({ message: "Product not found" }, { status: 404 });
        }

        // OPTIMIZATION: Use high-speed findUnique leveraging your compound index
        const existingWishlistItem = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId: dbUser.id,
                    productId,
                },
            },
        });

        if (existingWishlistItem) {
            return Response.json({ message: "Product already in wishlist" }, { status: 409 });
        }

        const wishlistItem = await prisma.wishlist.create({
            data: {
                userId: dbUser.id,
                productId,
            },
        });

        return Response.json(wishlistItem, { status: 201 });
    } catch (error) {
        console.error("POST Wishlist Error:", error);
        return Response.json({ message: "Failed to add product to wishlist" }, { status: 500 });
    }
}

// 3. REMOVE FROM WISHLIST
export async function DELETE(req: Request) {
    try {
        const dbUser = await getCurrentDbUser(req);

        if (!dbUser) {
            return Response.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { productId } = await req.json();

        if (!productId) {
            return Response.json({ message: "Product ID is required" }, { status: 400 });
        }

        // OPTIMIZATION: Use findUnique to instantly find the record
        const existingWishlistItem = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId: dbUser.id,
                    productId,
                },
            },
        });

        if (!existingWishlistItem) {
            return Response.json({ message: "Wishlist item not found" }, { status: 404 });
        }

        // OPTIMIZATION: Perform a direct atomic delete instead of deleteMany
        await prisma.wishlist.delete({
            where: {
                userId_productId: {
                    userId: dbUser.id,
                    productId,
                },
            },
        });

        return Response.json({
            success: true,
            message: "Removed from wishlist",
        });
    } catch (error) {
        console.error("DELETE Wishlist Error:", error);
        return Response.json({ message: "Failed to remove wishlist item" }, { status: 500 });
    }
}