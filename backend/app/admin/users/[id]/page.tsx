import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserById } from "@/lib/adminActions/user-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";
import { UserBanButton } from "@/components/admin/users/user-ban-button";
import { UserRoleActions } from "@/components/admin/users/user-role-actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-black">
        User Details
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Profile */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.imageUrl ?? undefined} />
                <AvatarFallback className="text-xl">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex gap-2 items-center">
                <StatusBadge type="role" value={user.role} />
                {user.isBanned && (
                  <span className="inline-flex items-center rounded-full border border-rose-100 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30">
                    Banned
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 w-full pt-4 text-center">
                <div>
                  <p className="text-xl font-bold">{user._count.orders}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{user._count.reviews}</p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{user._count.wishlists}</p>
                  <p className="text-xs text-muted-foreground">Wishlist</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Joined {formatDate(user.createdAt)}
              </p>
              {user.role === "ADMIN" ? null : (
                <div className="w-full pt-4 space-y-2">
                  <UserBanButton
                    userId={user.id}
                    isBanned={user.isBanned}
                    userEmail={user.email}
                  />
                  <UserRoleActions
                    userId={user.id}
                    role={user.role}
                    userEmail={user.email}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {user.orders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No orders yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Items
                      </TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-medium text-sm hover:underline"
                          >
                            {order.orderNumber.slice(0, 18)}…
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge type="order" value={order.status} />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {order.itemCount}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
