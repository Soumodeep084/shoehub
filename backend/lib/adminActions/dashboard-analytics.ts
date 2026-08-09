"use server";

import { prisma } from "@/lib/prisma";
import { GetDashboardAnalyticsParams } from "@/types/admin/dashboard-analytics";
import { getPercentChange, getPreviousPeriod, getTrendGranularity, buildTrendBuckets, bucketKey, getRangeLabel, resolveDashboardDateRange } from "@/lib/helpers/analytics-helpers";


export async function getDashboardAnalytics(params: GetDashboardAnalyticsParams = {}) {
    const selectedRange = resolveDashboardDateRange(params);
    const previousRange = getPreviousPeriod(selectedRange);

    const orderWhere = {
        createdAt: {
            gte: selectedRange.from,
            lte: selectedRange.to,
        },
    };

    const previousOrderWhere = {
        createdAt: {
            gte: previousRange.from,
            lte: previousRange.to,
        },
    };

    const userWhere = {
        createdAt: {
            gte: selectedRange.from,
            lte: selectedRange.to,
        },
    };

    const previousUserWhere = {
        createdAt: {
            gte: previousRange.from,
            lte: previousRange.to,
        },
    };

    const [ordersInRange, previousOrders, currentUsers, previousUsers, topItemsRaw, recentOrders, recentUsers, lowStockProductsRaw, bestSellingProductsRaw] =
        await Promise.all([
            prisma.order.findMany({
                where: orderWhere,
                select: {
                    id: true,
                    status: true,
                    paymentStatus: true,
                    paymentMethod: true,
                    totalAmount: true,
                    createdAt: true,
                    orderNumber: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    items: {
                        select: {
                            quantity: true,
                        },
                    },
                },
            }),
            prisma.order.findMany({
                where: previousOrderWhere,
                select: {
                    paymentStatus: true,
                    totalAmount: true,
                },
            }),
            prisma.user.count({ where: userWhere }),
            prisma.user.count({ where: previousUserWhere }),
            prisma.orderItem.groupBy({
                by: ["productId"],
                where: {
                    order: {
                        createdAt: {
                            gte: selectedRange.from,
                            lte: selectedRange.to,
                        },
                        paymentStatus: "PAID",
                    },
                },
                _sum: {
                    quantity: true,
                    totalPrice: true,
                },
                orderBy: {
                    _sum: {
                        quantity: "desc",
                    },
                },
                take: 20,
            }),
            prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: { firstName: true, lastName: true, email: true },
                    },
                    items: { select: { quantity: true } },
                },
            }),
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    _count: {
                        select: { orders: true },
                    },
                },
            }),
            prisma.product.findMany({
                where: {
                    isDeleted: false,
                },
                include: {
                    variants: {
                        select: { stock: true },
                    },
                    category: {
                        select: { name: true },
                    },
                },
            }),
            prisma.product.findMany({
                where: {
                    isDeleted: false,
                },
                orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
                take: 5,
                include: {
                    category: {
                        select: { name: true },
                    },
                },
            }),
        ]);

    const paidOrdersInRange = ordersInRange.filter((o) => o.paymentStatus === "PAID");
    const paidOrdersPrevious = previousOrders.filter((o) => o.paymentStatus === "PAID");

    const currentRevenue = paidOrdersInRange.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const previousRevenue = paidOrdersPrevious.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    const currentOrderCount = ordersInRange.length;
    const previousOrderCount = previousOrders.length;

    const currentPaidOrderCount = paidOrdersInRange.length;
    const previousPaidOrderCount = paidOrdersPrevious.length;

    const currentAov = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;
    const previousAov = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;

    const trendGranularity = getTrendGranularity(selectedRange.from, selectedRange.to);
    const buckets = buildTrendBuckets(selectedRange.from, selectedRange.to, trendGranularity);

    const revenueByBucket = new Map<string, number>();
    const ordersByBucket = new Map<string, number>();

    for (const order of ordersInRange) {
        const key = bucketKey(order.createdAt, trendGranularity);
        ordersByBucket.set(key, (ordersByBucket.get(key) ?? 0) + 1);

        if (order.paymentStatus === "PAID") {
            revenueByBucket.set(key, (revenueByBucket.get(key) ?? 0) + Number(order.totalAmount));
        }
    }

    const revenueTrend = buckets.map((bucket) => ({
        label: bucket.label,
        value: Number((revenueByBucket.get(bucket.key) ?? 0).toFixed(2)),
    }));

    const ordersTrend = buckets.map((bucket) => ({
        label: bucket.label,
        value: ordersByBucket.get(bucket.key) ?? 0,
    }));

    const statusDistributionMap = new Map<string, number>();
    const paymentMethodMap = new Map<string, number>();

    for (const order of ordersInRange) {
        statusDistributionMap.set(order.status, (statusDistributionMap.get(order.status) ?? 0) + 1);
        const method = order.paymentMethod?.trim() || "Unknown";
        paymentMethodMap.set(method, (paymentMethodMap.get(method) ?? 0) + 1);
    }

    const orderStatusDistribution = [...statusDistributionMap.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const paymentMethodDistribution = [...paymentMethodMap.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const productIds = topItemsRaw.map((item) => item.productId);
    const productsForTopItems = productIds.length
        ? await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                name: true,
                category: {
                    select: { name: true },
                },
            },
        })
        : [];

    const productMap = new Map(productsForTopItems.map((p) => [p.id, p]));

    const topSellingProducts = topItemsRaw.slice(0, 5).map((item) => {
        const product = productMap.get(item.productId);
        return {
            name: product?.name ?? "Unknown Product",
            quantity: item._sum.quantity ?? 0,
            revenue: Number(item._sum.totalPrice ?? 0),
        };
    });

    const salesByCategoryAccumulator = new Map<string, { revenue: number; quantity: number }>();

    for (const item of topItemsRaw) {
        const product = productMap.get(item.productId);
        const categoryName = product?.category.name ?? "Uncategorized";
        const current = salesByCategoryAccumulator.get(categoryName) ?? { revenue: 0, quantity: 0 };
        current.revenue += Number(item._sum.totalPrice ?? 0);
        current.quantity += item._sum.quantity ?? 0;
        salesByCategoryAccumulator.set(categoryName, current);
    }

    const salesByCategory = [...salesByCategoryAccumulator.entries()]
        .map(([name, values]) => ({
            name,
            revenue: Number(values.revenue.toFixed(2)),
            quantity: values.quantity,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);

    const monthlyUsersStart = new Date();
    monthlyUsersStart.setMonth(monthlyUsersStart.getMonth() - 5);
    monthlyUsersStart.setDate(1);
    monthlyUsersStart.setHours(0, 0, 0, 0);

    const usersLastYear = await prisma.user.findMany({
        where: {
            createdAt: {
                gte: monthlyUsersStart,
            },
        },
        select: { createdAt: true },
    });

    const monthBuckets = buildTrendBuckets(monthlyUsersStart, new Date(), "month");
    const usersByMonth = new Map<string, number>();

    for (const user of usersLastYear) {
        const key = bucketKey(user.createdAt, "month");
        usersByMonth.set(key, (usersByMonth.get(key) ?? 0) + 1);
    }

    const monthlyNewUsers = monthBuckets.map((bucket) => ({
        label: bucket.label,
        value: usersByMonth.get(bucket.key) ?? 0,
    }));

    const lowStockProducts = lowStockProductsRaw
        .map((product) => {
            const stock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
            return {
                id: product.id,
                name: product.name,
                brand: product.brand,
                category: product.category.name,
                stock,
            };
        })
        .filter((product) => product.stock > 0 && product.stock <= 10)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);

    const bestSellingProducts = bestSellingProductsRaw.map((product) => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category.name,
        soldCount: product.soldCount,
        salePrice: Number(product.salePrice),
    }));

    return {
        range: {
            ...selectedRange,
            label: getRangeLabel(selectedRange),
            from: selectedRange.from.toISOString(),
            to: selectedRange.to.toISOString(),
        },
        cards: {
            revenue: {
                value: Number(currentRevenue.toFixed(2)),
                change: Number(getPercentChange(currentRevenue, previousRevenue).toFixed(2)),
            },
            orders: {
                value: currentOrderCount,
                change: Number(getPercentChange(currentOrderCount, previousOrderCount).toFixed(2)),
            },
            newUsers: {
                value: currentUsers,
                change: Number(getPercentChange(currentUsers, previousUsers).toFixed(2)),
            },
            avgOrderValue: {
                value: Number(currentAov.toFixed(2)),
                change: Number(getPercentChange(currentAov, previousAov).toFixed(2)),
            },
            paidOrders: {
                value: currentPaidOrderCount,
                change: Number(getPercentChange(currentPaidOrderCount, previousPaidOrderCount).toFixed(2)),
            },
        },
        charts: {
            revenueTrend,
            ordersTrend,
            topSellingProducts,
            salesByCategory,
            orderStatusDistribution,
            paymentMethodDistribution,
            monthlyNewUsers,
        },
        lists: {
            recentOrders: recentOrders.map((order) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                customerName: `${order.user.firstName} ${order.user.lastName}`,
                customerEmail: order.user.email,
                status: order.status,
                paymentStatus: order.paymentStatus,
                totalAmount: Number(order.totalAmount),
                itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
                createdAt: order.createdAt.toISOString(),
            })),
            recentUsers: recentUsers.map((user) => ({
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: user.role,
                orders: user._count.orders,
                createdAt: user.createdAt.toISOString(),
            })),
            lowStockProducts,
            bestSellingProducts,
        },
    };
}
