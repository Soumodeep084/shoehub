import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });


async function main() {
    console.log("🌱 Seeding sneaker store...");

    // Clear existing data
    await prisma.productVariant.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    // =====================
    // CATEGORIES
    // =====================
    const running = await prisma.category.create({
        data: {
            name: "Running",
            slug: "running",
            imageUrl:
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
            description: "Performance running sneakers",
        },
    });

    const basketball = await prisma.category.create({
        data: {
            name: "Basketball",
            slug: "basketball",
            imageUrl:
                "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2",
            description: "Basketball sneakers",
        },
    });

    const lifestyle = await prisma.category.create({
        data: {
            name: "Lifestyle",
            slug: "lifestyle",
            imageUrl:
                "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519",
            description: "Everyday lifestyle sneakers",
        },
    });

    // helper
    const createProduct = async (p: any) => {
        return prisma.product.create({ data: p });
    };

    // =====================
    // PRODUCTS (20+)
    // =====================

    const products = [
        {
            categoryId: running.id,
            name: "Nike Air Zoom Pegasus 40",
            slug: "nike-air-zoom-pegasus-40",
            brand: "Nike",
            description: "Lightweight running shoe built for daily training.",
            basePrice: 12999,
            salePrice: 10999,
            discountPercent: 15,
            averageRating: 4.6,
            ratingCount: 520,
            soldCount: 2100,
            isFeatured: true,
            isNew: false,
            images: {
                create: [
                    {
                        imageUrl:
                            "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
                        storagePath: "pegasus-40/1.jpg",
                        isPrimary: true,
                        sortOrder: 1,
                    },
                ],
            },
            variants: {
                create: [
                    { size: "7", color: "Black", sku: "PEG40-BLK-7", stock: 10 },
                    { size: "8", color: "Black", sku: "PEG40-BLK-8", stock: 12 },
                    { size: "9", color: "Black", sku: "PEG40-BLK-9", stock: 15 },
                ],
            },
        },

        {
            categoryId: running.id,
            name: "Adidas Ultraboost 22",
            slug: "adidas-ultraboost-22",
            brand: "Adidas",
            description: "Energy-return cushioning for long distance runs.",
            basePrice: 15999,
            salePrice: 12999,
            discountPercent: 19,
            averageRating: 4.7,
            ratingCount: 800,
            soldCount: 3200,
            isFeatured: true,
            isNew: false,
            images: {
                create: [
                    {
                        imageUrl:
                            "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519",
                        storagePath: "ub22/1.jpg",
                        isPrimary: true,
                        sortOrder: 1,
                    },
                ],
            },
            variants: {
                create: [
                    { size: "8", color: "White", sku: "UB22-WHT-8", stock: 8 },
                    { size: "9", color: "White", sku: "UB22-WHT-9", stock: 10 },
                    { size: "10", color: "White", sku: "UB22-WHT-10", stock: 6 },
                ],
            },
        },

        {
            categoryId: basketball.id,
            name: "Jordan 1 Retro High OG",
            slug: "jordan-1-retro-high-og",
            brand: "Jordan",
            description: "Iconic basketball sneaker with premium leather.",
            basePrice: 16999,
            salePrice: 16999,
            discountPercent: 0,
            averageRating: 4.9,
            ratingCount: 1200,
            soldCount: 5000,
            isFeatured: true,
            isNew: false,
            images: {
                create: [
                    {
                        imageUrl:
                            "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2",
                        storagePath: "jordan-1/1.jpg",
                        isPrimary: true,
                        sortOrder: 1,
                    },
                ],
            },
            variants: {
                create: [
                    { size: "9", color: "Red", sku: "J1-RED-9", stock: 5 },
                    { size: "10", color: "Red", sku: "J1-RED-10", stock: 4 },
                    { size: "11", color: "Red", sku: "J1-RED-11", stock: 3 },
                ],
            },
        },

        {
            categoryId: lifestyle.id,
            name: "Nike Air Force 1",
            slug: "nike-air-force-1",
            brand: "Nike",
            description: "Classic everyday streetwear sneaker.",
            basePrice: 9999,
            salePrice: 7999,
            discountPercent: 20,
            averageRating: 4.8,
            ratingCount: 1500,
            soldCount: 8000,
            isFeatured: true,
            isNew: false,
            images: {
                create: [
                    {
                        imageUrl:
                            "https://images.unsplash.com/photo-1528701800489-20be9c2c3f1b",
                        storagePath: "af1/1.jpg",
                        isPrimary: true,
                        sortOrder: 1,
                    },
                ],
            },
            variants: {
                create: [
                    { size: "7", color: "White", sku: "AF1-WHT-7", stock: 20 },
                    { size: "8", color: "White", sku: "AF1-WHT-8", stock: 25 },
                    { size: "9", color: "White", sku: "AF1-WHT-9", stock: 30 },
                ],
            },
        },

        {
            categoryId: lifestyle.id,
            name: "New Balance 550",
            slug: "new-balance-550",
            brand: "New Balance",
            description: "Retro basketball-inspired lifestyle sneaker.",
            basePrice: 11999,
            salePrice: 9999,
            discountPercent: 17,
            averageRating: 4.6,
            ratingCount: 600,
            soldCount: 2400,
            isFeatured: false,
            isNew: true,
            images: {
                create: [
                    {
                        imageUrl:
                            "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519",
                        storagePath: "nb550/1.jpg",
                        isPrimary: true,
                        sortOrder: 1,
                    },
                ],
            },
            variants: {
                create: [
                    { size: "8", color: "Grey", sku: "NB550-GRY-8", stock: 10 },
                    { size: "9", color: "Grey", sku: "NB550-GRY-9", stock: 8 },
                    { size: "10", color: "Grey", sku: "NB550-GRY-10", stock: 6 },
                ],
            },
        },
    ];

    // clone more to reach 20+ products
    const extraBrands = ["Puma", "Reebok", "Asics", "Skechers", "Fila"];

    for (let i = 0; i < 15; i++) {
        products.push({
            categoryId: [running.id, basketball.id, lifestyle.id][i % 3],
            name: `${extraBrands[i % extraBrands.length]} Model ${i + 1}`,
            slug: `${extraBrands[i % extraBrands.length].toLowerCase()}-model-${i + 1}`,
            brand: extraBrands[i % extraBrands.length],
            description: "Premium sneaker with comfort and durability.",
            basePrice: 8000 + i * 500,
            salePrice: 6500 + i * 400,
            discountPercent: 15,
            averageRating: 4.3,
            ratingCount: 100 + i * 10,
            soldCount: 500 + i * 20,
            isFeatured: i % 4 === 0,
            isNew: i % 3 === 0,
            images: {
                create: [
                    {
                        imageUrl:
                            "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
                        storagePath: `extra-${i}/1.jpg`,
                        isPrimary: true,
                        sortOrder: 1,
                    },
                ],
            },
            variants: {
                create: [
                    {
                        size: "8",
                        color: "Black",
                        sku: `SKU-${i}-8`,
                        stock: 10,
                    },
                    {
                        size: "9",
                        color: "White",
                        sku: `SKU-${i}-9`,
                        stock: 8,
                    },
                ],
            },
        });
    }

    // insert all products
    for (const p of products) {
        await createProduct(p);
    }

    console.log(`✅ Seed completed with ${products.length} sneakers`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});