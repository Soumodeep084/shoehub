import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DateRangeFiltersProps {
  selectedRange: string;
  from?: string;
  to?: string;
}

const presets: Array<{ key: string; label: string }> = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

export function DateRangeFilters({ selectedRange, from, to }: DateRangeFiltersProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <CalendarRange className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">Date Range</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.key}
            asChild
            size="sm"
            variant={selectedRange === preset.key ? "default" : "outline"}
            className="h-8"
          >
            <Link href={`/admin?range=${preset.key}`}>{preset.label}</Link>
          </Button>
        ))}
      </div>

      <form action="/admin" className="mt-4 flex flex-wrap items-end gap-2 text-black">
        <input type="hidden" name="range" value="custom" />
        <div className="space-y-1">
          <label htmlFor="from" className="text-xs text-muted-foreground">
            From
          </label>
          <Input id="from" name="from" type="date" defaultValue={from} className="h-9 w-40" />
        </div>
        <div className="space-y-1">
          <label htmlFor="to" className="text-xs text-muted-foreground">
            To
          </label>
          <Input id="to" name="to" type="date" defaultValue={to} className="h-9 w-40" />
        </div>
        <Button type="submit" size="sm" className="h-9 px-4">
          Apply Custom Range
        </Button>
      </form>
    </div>
  );
}
