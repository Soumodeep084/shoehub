import Link from "next/link";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { getBankOffers } from "@/lib/adminActions/coupon-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { BankOffersTable } from "@/components/admin/bank/bank-offers-table";

export default async function AdminBankOffersPage() {
  const offers = await getBankOffers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Offers"
        description="Fulfill payment integrations by managing promotional credit/debit card bank offers."
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="h-9">
            <Link
              href="/admin/bank-offers/trash"
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              View Trash
            </Link>
          </Button>
          <Button size="sm" asChild className="h-9">
            <Link
              href="/admin/bank-offers/new"
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              Create Offer
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Offers
                </p>
                <p className="text-2xl font-bold">{offers.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/40">
                <CreditCard className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Active Offers
                </p>
                <p className="text-2xl font-bold">
                  {offers.filter((o) => o.isActive).length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BankOffersTable offers={offers} />
    </div>
  );
}
