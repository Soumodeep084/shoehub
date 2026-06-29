import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, CreditCard, Calendar } from "lucide-react";
import { getBankOfferById } from "@/lib/adminActions/coupon-actions";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BankOfferUsageRow } from "@/types/admin/table-usages";
import { BankOfferUsageTable } from "@/components/admin/bank/bank-offer-usage-table";

interface BankOfferDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BankOfferDetailPage({
  params,
}: BankOfferDetailPageProps) {
  const { id } = await params;
  const offer = await getBankOfferById(id);

  if (!offer || offer.isDeleted) {
    notFound();
  }

  // Fetch orders that claimed this bank offer
  const orders = await prisma.order.findMany({
    where: {
      bankOfferName: offer.bankName,
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const ordersData: BankOfferUsageRow[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: `${o.user.firstName} ${o.user.lastName}`,
    customerEmail: o.user.email,
    discountApplied: Number(o.bankOfferDiscount),
    totalAmount: Number(o.totalAmount),
    createdAt: o.createdAt,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bank Offer: ${offer.bankName}`}
        description={`Usage statistics and rules for the bank card promotion.`}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              href="/admin/bank-offers"
              className="flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link
              href={`/admin/bank-offers/${offer.id}/edit`}
              className="flex items-center gap-1 text-xs"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Offer
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Offer Rules Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Offer Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">
                  Bank Name
                </span>
                <span className="font-bold text-foreground text-base tracking-wide uppercase">
                  {offer.bankName}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">
                  Card Exclusions
                </span>
                <span className="font-medium text-foreground">
                  {offer.cardType || "All Card Types"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">
                  Terms / Description
                </span>
                <span className="text-foreground leading-relaxed">
                  {offer.description}
                </span>
              </div>
              <hr className="border-border my-2" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">
                    Discount Value
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {offer.discountType === "PERCENTAGE"
                      ? `${offer.discountValue}%`
                      : formatCurrency(offer.discountValue)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">
                    Min Order
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {formatCurrency(offer.minOrderAmount)}
                  </span>
                </div>
              </div>

              {offer.maxDiscount && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">
                    Maximum Cap
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {formatCurrency(offer.maxDiscount)}
                  </span>
                </div>
              )}

              <hr className="border-border my-2" />

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Expiration
                  </span>
                  <span className="text-xs text-foreground font-medium">
                    {offer.expiresAt ? formatDate(offer.expiresAt) : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Fulfillment Status
                  </span>
                  <StatusBadge
                    type="active"
                    value={offer.isActive}
                    expiresAt={offer.expiresAt}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage History List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Transactions</CardTitle>
            <CardDescription>
              Recent store checkouts that claimed this promotional bank offer.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <BankOfferUsageTable data={ordersData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
