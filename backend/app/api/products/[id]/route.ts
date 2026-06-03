import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

        const product = await prisma.product.findUnique({
            where: {
                id,
            },
            include: {
                category: true,
                images: {
                    orderBy: {
                        sortOrder: "asc",
                    },
                },
                variants: true,
            },
        });

        if (!product) {
            return NextResponse.json(
                { message: "Product not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("GET_PRODUCT_ERROR", error);

        return NextResponse.json(
            { message: "Failed to fetch product" },
            { status: 500 }
        );
    }
}