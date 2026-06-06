import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
    try {
        // 1. Grab all possible parameters from the incoming URL
        const { searchParams } = new URL(req.url);
        const featured = searchParams.get("featured");
        const isNew = searchParams.get("new");
        const trending = searchParams.get("trending");
        const limitParam = searchParams.get("limit");
        const brandParam = searchParams.get("brand");
        const categoryIdParam = searchParams.get("categoryId");

        // Advanced filters from search page
        const searchParam = searchParams.get("search");
        const minPriceParam = searchParams.get("minPrice");
        const maxPriceParam = searchParams.get("maxPrice");
        const sizeParam = searchParams.get("size");
        const sortParam = searchParams.get("sort"); // Captures price_asc / price_desc

        // 2. Dynamically build your Prisma 'where' clause
        const queryWhere: Prisma.ProductWhereInput = {
            isActive: true,
        };

        // Boolean status filters (Home screen sections)
        if (featured === "true") queryWhere.isFeatured = true;
        if (isNew === "true") queryWhere.isNew = true;

        // Category & Brand filtering
        if (brandParam && brandParam !== "All") {
            queryWhere.brand = brandParam;
        }
        if (categoryIdParam && categoryIdParam !== "All" && categoryIdParam !== "all") {
            queryWhere.categoryId = categoryIdParam;
        }

        // Text Search logic (matches name or brand text loosely)
        if (searchParam) {
            queryWhere.OR = [
                { name: { contains: searchParam, mode: "insensitive" } },
                { brand: { contains: searchParam, mode: "insensitive" } },
            ];
        }

        // Price Boundaries Filter (applies to basePrice or salePrice)
        if (minPriceParam || maxPriceParam) {
            const priceFilter: any = {};
            if (minPriceParam) priceFilter.gte = parseFloat(minPriceParam);
            if (maxPriceParam) priceFilter.lte = parseFloat(maxPriceParam);

            // Checks basePrice field. Switch to salePrice if your schema relies heavily on discounts
            queryWhere.basePrice = priceFilter;
        }

        // Size Variant Deep Querying
        if (sizeParam && sizeParam !== "Any") {
            queryWhere.variants = {
                some: {
                    size: sizeParam,
                },
            };
        }

        // 3. Build complex dynamic sorting clauses
        let orderByClause: any = { createdAt: "desc" }; // Default sorting baseline

        if (trending === "true") {
            orderByClause = { soldCount: "desc" };
        }

        // Handles both structural parameter formats seamlessly
        if (sortParam === "price_asc" || searchParams.get("price_asc") === "true") {
            orderByClause = { basePrice: "asc" };
        } else if (sortParam === "price_desc" || searchParams.get("price_desc") === "true") {
            orderByClause = { basePrice: "desc" };
        }

        // 4. Implement dynamic result capping
        const take = limitParam ? parseInt(limitParam, 10) : undefined;

        // 5. Execute unified database transaction
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