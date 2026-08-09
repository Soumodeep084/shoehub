import { DateRangeFilters } from "@/components/admin/dashboard/date-range-filters";
import { ExportButtons } from "@/components/admin/dashboard/export-buttons";
import { AnalyticsDashboard } from "@/components/admin/dashboard/analytics-dashboard";
import { getDashboardAnalytics } from "@/lib/adminActions/dashboard-analytics";

interface PageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminDashboard({ searchParams }: PageProps) {
  const params = await searchParams;

  const analytics = await getDashboardAnalytics({
    range: params.range,
    from: params.from,
    to: params.to,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Premium overview of revenue, growth, order lifecycle, and inventory risk.
          </p>
        </div>
        <ExportButtons entity="analytics" params={{ range: params.range, from: params.from, to: params.to }} />
      </div>

      <DateRangeFilters selectedRange={params.range ?? "30d"} from={params.from} to={params.to} />

      <AnalyticsDashboard analytics={analytics} />
    </div>
  );
}
