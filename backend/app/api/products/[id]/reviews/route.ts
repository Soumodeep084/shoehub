import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/currentUser";
type Params = {
    params: Promise<{
        id: string;
    }>;
};

export async function GET(req: Request, { params }: Params) {
    try {
        const dbUser = await getCurrentDbUser(req);
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { message: "Product ID missing" },
                { status: 400 }
            );
        }

        const reviews = await prisma.review.findMany({
            where: {
                productId: id,
            },

            include: {
                user: {
                    select: {
                        clerkId: true,
                        firstName: true,
                        lastName: true,
                        imageUrl: true,
                    },
                },

                media: {
                    select: {
                        id: true,
                        type: true,
                        url: true,
                    },
                },
            },

            orderBy: {
                createdAt: "desc",
            },
        });

        const product = await prisma.product.findUnique({
            where: {
                id,
            },
            select: {
                averageRating: true,
                ratingCount: true,
            },
        });

        const ratingSummary = {
            total: product?.ratingCount ?? 0,
            average: Number(product?.averageRating ?? 0),
        };

        let hasPurchased = false;
        let hasReviewed = false;

        if (dbUser) {
            const purchased = await prisma.orderItem.findFirst({
                where: {
                    productId: id,
                    order: {
                        userId: dbUser.id,
                        status: "DELIVERED",
                    },
                },
                select: {
                    id: true,
                },
            });

            hasPurchased = !!purchased;

            const reviewed = await prisma.review.findUnique({
                where: {
                    userId_productId: {
                        userId: dbUser.id,
                        productId: id,
                    },
                },
                select: {
                    id: true,
                },
            });

            hasReviewed = !!reviewed;
        }

        const canReview = hasPurchased && !hasReviewed;

        return NextResponse.json({
            reviews,
            ratingSummary,
            hasPurchased,
            hasReviewed,
            canReview,
        });
    } catch (error) {
        console.error("GET_PRODUCT_REVIEWS_ERROR", error);

        return NextResponse.json(
            { message: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}