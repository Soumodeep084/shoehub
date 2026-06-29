import { notFound } from "next/navigation";
import { getBankOfferById } from "@/lib/adminActions/coupon-actions";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { BankOfferForm } from "@/components/admin/bank/bank-offer-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";

interface EditBankOfferPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBankOfferPage({
  params,
}: EditBankOfferPageProps) {
  const { id } = await params;
  const offer = await getBankOfferById(id);

  if (!offer) notFound();

  const categories = await prisma.category.findMany({
    where: { isDeleted: false, isActive: true },
    orderBy: { name: "asc" },
  });

  const formData = {
    id: offer.id,
    bankName: offer.bankName,
    cardType: offer.cardType,
    description: offer.description,
    discountType: offer.discountType as "PERCENTAGE" | "FIXED",
    discountValue: offer.discountValue,
    minOrderAmount: offer.minOrderAmount,
    maxDiscount: offer.maxDiscount,
    isActive: offer.isActive,
    expiresAt: offer.expiresAt,
    categoryId: offer.categoryId,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Bank Offer: ${offer.bankName}`}
        description="Update discount value, terms, and card type exclusions."
      >
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/admin/bank-offers/${offer.id}`}
            className="flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Offer Details
          </Link>
        </Button>
      </PageHeader>

      <BankOfferForm initialData={formData} categories={categories} />
    </div>
  );
}
