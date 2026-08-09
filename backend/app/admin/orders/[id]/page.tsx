import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/adminActions/order-actions";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusUpdate } from "@/components/admin/orders/order-status-update";
import { DeliveryAssign } from "@/components/admin/orders/delivery-assign";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const sessionUser = await currentUser();
  const dbUser = sessionUser
    ? await prisma.user.findUnique({ where: { clerkId: sessionUser.id } })
    : null;
  const isAdmin = dbUser?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">Order Details</h1>
          <p className="text-muted-foreground font-mono text-sm">
            {order.orderNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge type="order" value={order.status} />
          <StatusBadge type="payment" value={order.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Info & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.productImageUrl && (
                            <Image
                              width={40}
                              height={40}
                              src={item.productImageUrl}
                              alt={item.productName}
                              className="h-10 w-10 rounded object-cover"
                              unoptimized
                            />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {item.productName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.productBrand}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.size} / {item.color}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Price Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Price Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-sm pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>

              {order.couponCode && (
                <div className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">
                      Coupon Discount
                    </span>
                    <span className="text-[10px] font-mono bg-muted text-foreground px-1 py-0.5 rounded w-max mt-0.5 uppercase tracking-wide font-bold">
                      {order.couponCode}
                    </span>
                  </div>
                  <span className="text-destructive font-medium">
                    -{formatCurrency(Number(order.couponDiscount))}
                  </span>
                </div>
              )}

              {order.bankOfferName && (
                <div className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">
                      Bank Offer Discount
                    </span>
                    <span className="text-[10px] bg-muted text-foreground px-1 py-0.5 rounded w-max mt-0.5 font-medium">
                      {order.bankOfferName}
                    </span>
                  </div>
                  <span className="text-destructive font-medium">
                    -{formatCurrency(Number(order.bankOfferDiscount))}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping Fee</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(order.shippingFee)}
                </span>
              </div>

              <Separator />
              <div className="flex justify-between font-semibold text-base text-foreground pt-1">
                <span>Total Amount</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {/* Payment & Timeline */}
            <Card className="">
              <CardHeader>
                <CardTitle className="text-base">Payment & Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created At</span>
                  <span className="text-foreground">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="text-foreground">
                    {formatDateTime(order.updatedAt)}
                  </span>
                </div>

                <Separator className="my-1" />

                {order.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-medium text-foreground">
                      {order.paymentMethod}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  <span className="font-medium text-foreground">
                    {order.paymentStatus}
                  </span>
                </div>

                {order.stripePaymentIntentId && (
                  <div className="space-y-1 pt-1">
                    <span className="text-xs text-muted-foreground block">
                      Stripe Transaction ID
                    </span>
                    <code className="text-xs font-mono bg-muted p-1.5 rounded block text-foreground overflow-x-auto break-all select-all">
                      {order.stripePaymentIntentId}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Event Timeline */}
            <Card>
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                  Order Event Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {order.events && order.events.length > 0 ? (
                  <div className="relative border-l border-border pl-4 ml-2 space-y-5">
                    {order.events.map((event) => (
                      <div key={event.id} className="relative">
                        {/* Timeline dot */}
                        <span className="absolute -left-[21.5px] top-1 flex h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {event.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {formatDateTime(event.createdAt)}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-xs text-muted-foreground">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No events recorded for this order.</p>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">
                  {order.user.firstName} {order.user.lastName}
                </p>
                <p className="text-muted-foreground">{order.user.email}</p>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium"><span className="font-semibold text-foreground">Shipping Name : </span>{order.shippingName}</p>
                <p className="text-muted-foreground"><span className="font-semibold text-foreground">Phone : </span>{order.shippingPhone}</p>
                <p className="text-muted-foreground"><span className="font-semibold text-foreground">Address 1 : </span>{order.shippingLine1}</p>
                {order.shippingLine2 && (
                  <p className="text-muted-foreground"><span className="font-semibold text-foreground">Address 2 : </span>{order.shippingLine2}</p>
                )}
                <p className="text-muted-foreground"><span className="font-semibold text-foreground">City : </span>{order.shippingCity}</p>
                <p className="text-muted-foreground"><span className="font-semibold text-foreground">State : </span>{order.shippingState}</p>
                <p className="text-muted-foreground"><span className="font-semibold text-foreground">Pincode : </span>{order.shippingPostalCode}</p>
                <p className="text-muted-foreground"><span className="font-semibold text-foreground">Country : </span>{order.shippingCountry}</p>
                {order.shippingLandmark && (
                  <p className="text-muted-foreground"><span className="font-semibold text-foreground">Landmark : </span>{order.shippingLandmark}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <OrderStatusUpdate
            orderId={order.id}
            currentStatus={order.status}
            currentPaymentStatus={order.paymentStatus}
            paymentMethod={order.paymentMethod}
          />

          {/* Delivery Assignment */}
          <DeliveryAssign
            orderId={order.id}
            orderStatus={order.status}
            deliveryStatus={order.deliveryStatus}
            assignedAgent={order.deliveryAgent}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
