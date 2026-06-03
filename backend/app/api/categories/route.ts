import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("GET_CATEGORIES_ERROR", error);

        return NextResponse.json(
            { message: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}