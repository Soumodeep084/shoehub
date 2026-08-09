import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getDashboardAnalytics } from "@/lib/adminActions/dashboard-analytics";
import { currentUser } from "@clerk/nextjs/server";

type ExportEntity = "orders" | "products" | "users" | "coupons" | "analytics";
type ExportFormat = "csv" | "xlsx";

function escapeCsv(value: unknown) {
    const stringValue = value == null ? "" : String(value);
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

function buildCsv(rows: Array<Record<string, unknown>>) {
    if (!rows.length) return "";
    const headers = Object.keys(rows[0]);
    const headerLine = headers.map(escapeCsv).join(",");
    const lines = rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","));
    return [headerLine, ...lines].join("\n");
}

function toFilename(entity: ExportEntity, format: ExportFormat) {
    const date = new Date().toISOString().slice(0, 10);
    return `${entity}-export-${date}.${format === "xlsx" ? "xlsx" : "csv"}`;
}

function successResponse(rows: Array<Record<string, unknown>>, entity: ExportEntity, format: ExportFormat) {
    const fileName = toFilename(entity, format);

    if (format === "csv") {
        const csv = buildCsv(rows);
        return new Response(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename=\"${fileName}\"`,
            },
        });
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new Response(buffer, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=\"${fileName}\"`,
        },
    });
}

async function getOrdersRows() {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            items: { select: { quantity: true } },
        },
    });

    return orders.map((order) => ({
        orderNumber: order.orderNumber,
        customerName: `${order.user.firstName} ${order.user.lastName}`,
        customerEmail: order.user.email,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod ?? "",
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt.toISOString(),
    }));
}

async function getProductsRows() {
    const products = await prisma.product.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        include: {
            category: { select: { name: true } },
            variants: { select: { stock: true } },
        },
    });

    return products.map((product) => ({
        name: product.name,
        brand: product.brand,
        slug: product.slug,
        category: product.category.name,
        basePrice: Number(product.basePrice),
        salePrice: Number(product.salePrice),
        soldCount: product.soldCount,
        stock: product.variants.reduce((sum, variant) => sum + variant.stock, 0),
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        isNew: product.isNew,
        createdAt: product.createdAt.toISOString(),
    }));
}

async function getUsersRows() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { orders: true } },
        },
    });

    return users.map((user) => ({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        orderCount: user._count.orders,
        createdAt: user.createdAt.toISOString(),
    }));
}

async function getCouponsRows() {
    const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            category: { select: { name: true } },
            _count: { select: { usages: true } },
        },
    });

    return coupons.map((coupon) => ({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        minOrderAmount: Number(coupon.minOrderAmount),
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : "",
        category: coupon.category?.name ?? "",
        usageCount: coupon._count.usages,
        isActive: coupon.isActive,
        expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : "",
        createdAt: coupon.createdAt.toISOString(),
    }));
}

async function getAnalyticsRows(range: string | null, from: string | null, to: string | null) {
    const analytics = await getDashboardAnalytics({
        range: range ?? undefined,
        from: from ?? undefined,
        to: to ?? undefined,
    });

    const summaryRows = [
        {
            section: "Summary",
            metric: "Revenue",
            value: analytics.cards.revenue.value,
            changePercent: analytics.cards.revenue.change,
            range: analytics.range.label,
        },
        {
            section: "Summary",
            metric: "Orders",
            value: analytics.cards.orders.value,
            changePercent: analytics.cards.orders.change,
            range: analytics.range.label,
        },
        {
            section: "Summary",
            metric: "New Users",
            value: analytics.cards.newUsers.value,
            changePercent: analytics.cards.newUsers.change,
            range: analytics.range.label,
        },
        {
            section: "Summary",
            metric: "Paid Orders",
            value: analytics.cards.paidOrders.value,
            changePercent: analytics.cards.paidOrders.change,
            range: analytics.range.label,
        },
    ];

    const revenueRows = analytics.charts.revenueTrend.map((point) => ({
        section: "Revenue Trend",
        metric: point.label,
        value: point.value,
        changePercent: "",
        range: analytics.range.label,
    }));

    const ordersRows = analytics.charts.ordersTrend.map((point) => ({
        section: "Orders Trend",
        metric: point.label,
        value: point.value,
        changePercent: "",
        range: analytics.range.label,
    }));

    return [...summaryRows, ...revenueRows, ...ordersRows];
}

export async function GET(req: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return Response.json({ message: "Unauthorized" }, { status: 401 });
        }
        const role = user.publicMetadata?.role;
        if (role !== "ADMIN") {
            return Response.json({ message: "Forbidden Access" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const entity = searchParams.get("entity") as ExportEntity | null;
        const format = (searchParams.get("format") ?? "csv") as ExportFormat;

        if (!entity || !["orders", "products", "users", "coupons", "analytics"].includes(entity)) {
            return Response.json({ message: "Invalid export entity" }, { status: 400 });
        }

        if (!["csv", "xlsx"].includes(format)) {
            return Response.json({ message: "Invalid export format" }, { status: 400 });
        }

        let rows: Array<Record<string, unknown>> = [];

        if (entity === "orders") rows = await getOrdersRows();
        if (entity === "products") rows = await getProductsRows();
        if (entity === "users") rows = await getUsersRows();
        if (entity === "coupons") rows = await getCouponsRows();
        if (entity === "analytics") {
            rows = await getAnalyticsRows(searchParams.get("range"), searchParams.get("from"), searchParams.get("to"));
        }

        return successResponse(rows, entity, format);
    } catch (error) {
        console.error("GET Admin Export Error:", error);
        return Response.json({ message: "Failed to export data" }, { status: 500 });
    }
}
