import { GetDashboardAnalyticsParams, DateRange, DashboardRangePreset } from "@/types/admin/dashboard-analytics";

export function startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function endOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

export function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function startOfYear(date: Date) {
    return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

export function formatDateLabel(date: Date) {
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
    }).format(date);
}

export function formatMonthLabel(date: Date) {
    return new Intl.DateTimeFormat("en-IN", {
        month: "short",
        year: "2-digit",
    }).format(date);
}

export function getRangeLabel(range: DateRange) {
    if (range.preset === "today") return "Today";
    if (range.preset === "7d") return "Last 7 Days";
    if (range.preset === "30d") return "Last 30 Days";
    if (range.preset === "month") return "This Month";
    if (range.preset === "year") return "This Year";
    return `${formatDateLabel(range.from)} - ${formatDateLabel(range.to)}`;
}

export function resolveDashboardDateRange({
    range,
    from,
    to,
}: GetDashboardAnalyticsParams = {}): DateRange {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const parsedRange = (range as DashboardRangePreset | undefined) ?? "30d";

    if (parsedRange === "today") {
        const dateRange = { preset: parsedRange, from: todayStart, to: todayEnd, label: "Today" };
        return dateRange;
    }

    if (parsedRange === "7d") {
        const dateRange = {
            preset: parsedRange,
            from: startOfDay(addDays(now, -6)),
            to: todayEnd,
            label: "Last 7 Days",
        };
        return dateRange;
    }

    if (parsedRange === "month") {
        const dateRange = {
            preset: parsedRange,
            from: startOfMonth(now),
            to: todayEnd,
            label: "This Month",
        };
        return dateRange;
    }

    if (parsedRange === "year") {
        const dateRange = {
            preset: parsedRange,
            from: startOfYear(now),
            to: todayEnd,
            label: "This Year",
        };
        return dateRange;
    }

    if (parsedRange === "custom" && from && to) {
        const fromDate = startOfDay(new Date(from));
        const toDate = endOfDay(new Date(to));

        if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime()) && fromDate <= toDate) {
            const dateRange = {
                preset: parsedRange,
                from: fromDate,
                to: toDate,
                label: `${formatDateLabel(fromDate)} - ${formatDateLabel(toDate)}`,
            };
            return dateRange;
        }
    }

    const fallback = {
        preset: "30d" as const,
        from: startOfDay(addDays(now, -29)),
        to: todayEnd,
        label: "Last 30 Days",
    };

    return fallback;
}

export function getPreviousPeriod(range: DateRange) {
    const currentDuration = range.to.getTime() - range.from.getTime() + 1;
    const prevTo = new Date(range.from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - currentDuration + 1);
    return { from: prevFrom, to: prevTo };
}

export function getPercentChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

export function getTrendGranularity(from: Date, to: Date) {
    const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    return days > 90 ? "month" : "day";
}

export function buildTrendBuckets(from: Date, to: Date, granularity: "day" | "month") {
    const buckets: Array<{ key: string; label: string; start: Date; end: Date }> = [];

    if (granularity === "month") {
        const cursor = new Date(from.getFullYear(), from.getMonth(), 1, 0, 0, 0, 0);
        const endMonth = new Date(to.getFullYear(), to.getMonth(), 1, 0, 0, 0, 0);

        while (cursor <= endMonth) {
            const start = new Date(cursor);
            const end = endOfDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
            const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
            buckets.push({ key, label: formatMonthLabel(cursor), start, end });
            cursor.setMonth(cursor.getMonth() + 1);
        }

        return buckets;
    }

    const cursor = startOfDay(from);
    const last = endOfDay(to);

    while (cursor <= last) {
        const bucketDate = new Date(cursor);
        const key = `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, "0")}-${String(bucketDate.getDate()).padStart(2, "0")}`;
        buckets.push({
            key,
            label: formatDateLabel(bucketDate),
            start: startOfDay(bucketDate),
            end: endOfDay(bucketDate),
        });
        cursor.setDate(cursor.getDate() + 1);
    }

    return buckets;
}

export function bucketKey(date: Date, granularity: "day" | "month") {
    if (granularity === "month") {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}