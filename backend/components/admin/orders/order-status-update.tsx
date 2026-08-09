"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { updateOrderStatus, updateOrderPaymentStatus } from "@/lib/adminActions/order-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

interface OrderStatusUpdateProps {
  orderId: string;
  currentStatus: OrderStatus;
  currentPaymentStatus: PaymentStatus;
  paymentMethod: string;
}

export function OrderStatusUpdate({
  orderId,
  currentStatus,
  currentPaymentStatus,
  paymentMethod,
}: OrderStatusUpdateProps) {
  const router = useRouter();

  // Order Status state
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Payment Status state
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(currentPaymentStatus);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  function isStatusDisabled(s: OrderStatus, current: OrderStatus): boolean {
    if (current === s) return false;

    const PROGRESSIVE_STAGES: OrderStatus[] = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "PACKED",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];

    const currentIndex = PROGRESSIVE_STAGES.indexOf(current);
    const targetIndex = PROGRESSIVE_STAGES.indexOf(s);

    if (currentIndex !== -1) {
      if (targetIndex !== -1 && targetIndex < currentIndex) {
        return true;
      }
      if (s === "CANCELLED" && current === "DELIVERED") {
        return true;
      }
      if (s === "REFUNDED" && current !== "DELIVERED" && current !== "CANCELLED") {
        return true;
      }
    }

    if (current === "CANCELLED") {
      return s !== "REFUNDED";
    }

    if (current === "REFUNDED") {
      return true;
    }

    return false;
  }

  async function handleUpdateStatus() {
    if (status === currentStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await updateOrderStatus(orderId, status);
      if (res.success) {
        toast.success("Order status updated successfully");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleUpdatePayment() {
    if (paymentStatus === currentPaymentStatus) return;
    setUpdatingPayment(true);
    try {
      const res = await updateOrderPaymentStatus(orderId, paymentStatus);
      if (res.success) {
        toast.success("Payment status updated successfully");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update payment status");
      }
    } catch {
      toast.error("Failed to update payment status");
    } finally {
      setUpdatingPayment(false);
    }
  }

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Order Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        {/* Order Status Control */}
        <div className="space-y-2">
          <Label htmlFor="orderStatusSelect" className="text-xs font-semibold text-foreground">
            Order Fulfillment Status
          </Label>
          <div className="flex gap-2">
            <Select value={status} onValueChange={(val) => setStatus(val as OrderStatus)}>
              <SelectTrigger id="orderStatusSelect" className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="text-xs"
                    disabled={isStatusDisabled(s, currentStatus)}
                  >
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleUpdateStatus}
              disabled={updatingStatus || status === currentStatus}
              className="h-9 px-3 shrink-0 text-xs font-semibold"
            >
              {updatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>

        <hr className="border-border" />

        {/* Payment Status Control */}
        <div className="space-y-2">
          <Label htmlFor="paymentStatusSelect" className="text-xs font-semibold text-foreground">
            Payment Transaction Status
          </Label>
          {paymentMethod === "COD" && currentStatus === "DELIVERED" ? (
            <div className="rounded-md bg-amber-50 p-2.5 border border-amber-200">
              <p className="text-xs text-amber-800 leading-normal font-medium">
                Payment status is locked as <strong>PAID</strong> because this Cash on Delivery (COD) order has been delivered.
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select
                value={paymentStatus}
                onValueChange={(val) => setPaymentStatus(val as PaymentStatus)}
                disabled={updatingPayment}
              >
                <SelectTrigger id="paymentStatusSelect" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((p) => {
                    const isDisabled = currentStatus === "DELIVERED" && (p === "PENDING" || p === "FAILED");
                    return (
                      <SelectItem
                        key={p}
                        value={p}
                        className="text-xs"
                        disabled={isDisabled}
                      >
                        {p}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleUpdatePayment}
                disabled={updatingPayment || paymentStatus === currentPaymentStatus}
                className="h-9 px-3 shrink-0 text-xs font-semibold"
              >
                {updatingPayment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
