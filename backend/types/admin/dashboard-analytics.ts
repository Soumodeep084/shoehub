export type DashboardRangePreset =
    | "today"
    | "7d"
    | "30d"
    | "month"
    | "year"
    | "custom";

export interface GetDashboardAnalyticsParams {
    range?: string;
    from?: string;
    to?: string;
}

export interface DateRange {
    preset: DashboardRangePreset;
    from: Date;
    to: Date;
    label: string;
}


// Frontend :

export interface AnalyticsDashboardProps {
    analytics: {
        range: { label: string };
        cards: {
            revenue: { value: number; change: number };
            orders: { value: number; change: number };
            newUsers: { value: number; change: number };
            avgOrderValue: { value: number; change: number };
            paidOrders: { value: number; change: number };
        };
        charts: {
            revenueTrend: Array<{ label: string; value: number }>;
            ordersTrend: Array<{ label: string; value: number }>;
            topSellingProducts: Array<{ name: string; quantity: number; revenue: number }>;
            salesByCategory: Array<{ name: string; quantity: number; revenue: number }>;
            orderStatusDistribution: Array<{ name: string; value: number }>;
            paymentMethodDistribution: Array<{ name: string; value: number }>;
            monthlyNewUsers: Array<{ label: string; value: number }>;
        };
        lists: {
            recentOrders: Array<{
                id: string;
                orderNumber: string;
                customerName: string;
                status: string;
                totalAmount: number;
                createdAt: string;
            }>;
            recentUsers: Array<{
                id: string;
                name: string;
                email: string;
                role: string;
                orders: number;
                createdAt: string;
            }>;
            lowStockProducts: Array<{
                id: string;
                name: string;
                brand: string;
                category: string;
                stock: number;
            }>;
            bestSellingProducts: Array<{
                id: string;
                name: string;
                brand: string;
                category: string;
                soldCount: number;
                salePrice: number;
            }>;
        };
    };
}