import { getUsers } from "@/lib/adminActions/user-actions";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { ExportButtons } from "@/components/admin/dashboard/export-buttons";
import { UserSearch } from "@/components/admin/users/user-search";
import { UsersTable } from "@/components/admin/users/users-table";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const sortBy = params.sortBy || "createdAt";
  const sortOrder = (params.sortOrder || "desc") as "asc" | "desc";

  const { users, total, pageCount } = await getUsers({
    page,
    limit: 10,
    search: params.search,
    sortBy,
    sortOrder,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Monitor registered customer profiles, transaction metrics, and manage account access lockouts."
      >
        <ExportButtons
          entity="users"
          params={{
            search: params.search,
            sortBy,
            sortOrder,
          }}
        />
      </PageHeader>

      <UserSearch />

      <UsersTable
        users={users}
        pageCount={pageCount}
        currentPage={page}
        total={total}
      />
    </div>
  );
}
