import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // 1. Group products by brand and aggregate total sales
        const brandSales = await prisma.product.groupBy({
            by: ["brand"],
            where: {
                isActive: true,
            },
            _sum: {
                soldCount: true, // Sum up sales for each brand
            },
            orderBy: {
                _sum: {
                    soldCount: "desc", // Most total sales first
                },
            },
            take: 10, // Adjust to limit your top popular brands (e.g., top 10)
        });

        // 2. Extract just the brand names into a clean string array
        const popularBrands = brandSales.map((item) => item.brand);

        return NextResponse.json(popularBrands);
    } catch (error) {
        console.error("GET_POPULAR_BRANDS_ERROR", error);
        return NextResponse.json(
            { message: "Failed to fetch popular brands" },
            { status: 500 }
        );
    }
}