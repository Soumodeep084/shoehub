import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
    try {
        // 1. Grab the search parameters from the URL
        const { searchParams } = new URL(req.url);
        const featured = searchParams.get("featured");
        const isNew = searchParams.get("new");
        const trendingParam = searchParams.get("trending"); // 1. Get the trending parameter
        const limitParam = searchParams.get("limit");       // Optional: to limit results (e.g., top 10)
        const brandParam = searchParams.get("brand");

        // 2. Dynamically build your 'where' object
        const queryWhere: Prisma.ProductWhereInput = {
            isActive: true,
        };

        if (featured === "true")  queryWhere.isFeatured = true;
        if (isNew === "true") queryWhere.isNew = true;
        if (brandParam) queryWhere.brand = brandParam;

        // 2. Build dynamic orderBy clause
        let orderByClause: any = { createdAt: "desc" }; // Default: newest first

        if (trendingParam === "true") {
            orderByClause = { soldCount: "desc" }; // Trending: highest sold count first
        }

        // 3. Handle optional limit/pagination
        const take = limitParam ? parseInt(limitParam, 10) : undefined;

        // 4. Fetch from Prisma using the dynamic where clause
        const products = await prisma.product.findMany({
            where: queryWhere,
            include: {
                category: true,
                images: {
                    orderBy: {
                        sortOrder: "asc",
                    },
                },
                variants: true,
            },
            orderBy: orderByClause,
            take,
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error("GET_PRODUCTS_ERROR", error);

        return NextResponse.json(
            { message: "Failed to fetch products" },
            { status: 500 }
        );
    }
}