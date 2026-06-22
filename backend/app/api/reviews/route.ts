import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/currentUser";

export async function POST(req: Request) {
    try {
        const dbUser = await getCurrentDbUser(req);

        if (!dbUser) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { productId, rating, comment } = body;


        if (!productId || !rating) {
            return NextResponse.json(
                { message: "Missing fields" },
                { status: 400 }
            );
        }

        const numericRating = Number(rating);

        if (
            Number.isNaN(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return NextResponse.json(
                { message: "Rating must be between 1 and 5" },
                { status: 400 }
            );
        }

        const product = await prisma.product.findUnique({
            where: {
                id: productId,
            },
            select: {
                id: true,
            },
        });

        if (!product) {
            return NextResponse.json(
                { message: "Product not found" },
                { status: 404 }
            );
        }

        // prevent duplicate review
        const existing = await prisma.review.findUnique({
            where: {
                userId_productId: {
                    userId: dbUser.id,
                    productId,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { message: "Already reviewed this product" },
                { status: 409 }
            );
        }

        const hasPurchased = await prisma.orderItem.findFirst({
            where: {
                productId,
                order: {
                    userId: dbUser.id,
                    status: "DELIVERED",
                },
            },
        });

        if (!hasPurchased) {
            return NextResponse.json(
                {
                    message: "You can review only purchased products",
                },
                { status: 403 }
            );
        }

        const review = await prisma.$transaction(async (tx) => {
            const createdReview = await tx.review.create({
                data: {
                    userId: dbUser.id,
                    productId,
                    rating: numericRating,
                    comment,
                },
            });

            const aggregate = await tx.review.aggregate({
                where: {
                    productId,
                },
                _avg: {
                    rating: true,
                },
                _count: {
                    rating: true,
                },
            });

            await tx.product.update({
                where: {
                    id: productId,
                },
                data: {
                    averageRating: aggregate._avg.rating ?? 0,
                    ratingCount: aggregate._count.rating,
                },
            });

            return createdReview;
        });

        return NextResponse.json({
            reviewId: review.id,
        });


    } catch (error) {
        console.error("CREATE_REVIEW_ERROR", error);

        return NextResponse.json(
            { message: "Failed to create review" },
            { status: 500 }
        );
    }
}