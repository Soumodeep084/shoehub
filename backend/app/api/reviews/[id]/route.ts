import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/currentUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Params = {
    params: Promise<{
        id: string;
    }>;
};

export async function GET(
    req: Request,
    { params }: Params
) {
    try {
        const { id } = await params;

        const review = await prisma.review.findUnique({
            where: {
                id,
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
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        if (!review) {
            return NextResponse.json(
                { message: "Review not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ review });
    } catch (error) {
        console.error("GET_REVIEW_ERROR", error);

        return NextResponse.json(
            { message: "Failed to fetch review" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request, { params }: Params) {
    try {
        const dbUser = await getCurrentDbUser(req);

        if (!dbUser) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        const body = await req.json();
        const { rating, comment } = body;

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

        const review = await prisma.review.findUnique({
            where: {
                id,
            },
        });

        if (!review) {
            return NextResponse.json(
                { message: "Review not found" },
                { status: 404 }
            );
        }

        if (review.userId !== dbUser.id) {
            return NextResponse.json(
                { message: "Forbidden" },
                { status: 403 }
            );
        }

        await prisma.$transaction(async (tx) => {
            await tx.review.update({
                where: {
                    id,
                },
                data: {
                    rating: numericRating,
                    comment,
                },
            });

            const aggregate = await tx.review.aggregate({
                where: {
                    productId: review.productId,
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
                    id: review.productId,
                },
                data: {
                    averageRating: aggregate._avg.rating ?? 0,
                    ratingCount: aggregate._count.rating,
                },
            });
        });

        return NextResponse.json({
            message: "Review updated successfully",
        });
    } catch (error) {
        console.error("UPDATE_REVIEW_ERROR", error);

        return NextResponse.json(
            { message: "Failed to update review" },
            { status: 500 }
        );
    }
}


export async function DELETE(
    req: Request,
    { params }: Params
) {
    try {
        const dbUser = await getCurrentDbUser(req);

        if (!dbUser) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        const review = await prisma.review.findUnique({
            where: {
                id,
            },
            include: {
                media: true,
            },
        });

        if (!review) {
            return NextResponse.json(
                { message: "Review not found" },
                { status: 404 }
            );
        }

        if (review.userId !== dbUser.id) {
            return NextResponse.json(
                { message: "Forbidden" },
                { status: 403 }
            );
        }

        // Delete files from Supabase first
        if (review.media.length > 0) {
            const paths = review.media
                .map((media) => media.path)
                .filter((path): path is string => Boolean(path));

            if (paths.length > 0) {
                const { error } = await supabaseAdmin.storage
                    .from("review-media")
                    .remove(paths);

                if (error) {
                    throw new Error(error.message);
                }
            }
        }

        await prisma.$transaction(async (tx) => {
            await tx.review.delete({
                where: {
                    id,
                },
            });

            const aggregate = await tx.review.aggregate({
                where: {
                    productId: review.productId,
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
                    id: review.productId,
                },
                data: {
                    averageRating: aggregate._avg.rating ?? 0,
                    ratingCount: aggregate._count.rating,
                },
            });
        });

        return NextResponse.json({
            message: "Review deleted successfully",
        });
    } catch (error) {
        console.error("DELETE_REVIEW_ERROR", error);

        return NextResponse.json(
            { message: "Failed to delete review" },
            { status: 500 }
        );
    }
}