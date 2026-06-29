import { getOrders } from "@/lib/adminActions/order-actions";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { OrderFilters } from "@/components/admin/orders/order-filters";
import { OrdersTable } from "@/components/admin/orders/orders-table";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const sortBy = params.sortBy || "createdAt";
  const sortOrder = (params.sortOrder || "desc") as "asc" | "desc";

  const { orders, total, pageCount } = await getOrders({
    page,
    limit: 10,
    status: params.status,
    search: params.search,
    sortBy,
    sortOrder,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Fulfill order deliveries, manage payments, and track sales receipts."
      />

      <OrderFilters />

      <OrdersTable
        orders={orders}
        pageCount={pageCount}
        currentPage={page}
        total={total}
      />
    </div>
  );
}
