import { Breadcrumbs } from "@/components/admin/dashboard/breadcrumbs";
import { BankOfferForm } from "@/components/admin/bank/bank-offer-form";
import { prisma } from "@/lib/prisma";

export default async function NewBankOfferPage() {
  const categories = await prisma.category.findMany({
    where: { isDeleted: false, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black">Create Bank Offer</h1>
        <p className="text-muted-foreground">
          Add a new bank-specific discount offer.
        </p>
      </div>

      <BankOfferForm categories={categories} />
    </div>
  );
}
