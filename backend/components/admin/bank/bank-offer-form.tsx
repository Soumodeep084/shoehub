"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  bankOfferFormSchema,
  type BankOfferFormValues,
} from "@/lib/validators/coupon";
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormSwitch,
} from "@/components/admin/form-components";

interface BankOfferFormProps {
  initialData?: BankOfferFormValues & { id: string };
  categories?: { id: string; name: string }[];
}

export function BankOfferForm({ initialData, categories = [] }: BankOfferFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BankOfferFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bankOfferFormSchema) as any,
    defaultValues: {
      bankName: initialData?.bankName ?? "",
      cardType: initialData?.cardType ?? null,
      description: initialData?.description ?? "",
      discountType: initialData?.discountType ?? "PERCENTAGE",
      discountValue: initialData?.discountValue ?? 0,
      minOrderAmount: initialData?.minOrderAmount ?? 0,
      maxDiscount: initialData?.maxDiscount ?? null,
      isActive: initialData?.isActive ?? true,
      expiresAt: (initialData?.expiresAt
        ? new Date(initialData.expiresAt).toISOString().slice(0, 16)
        : "") as unknown as Date,
      categoryId: initialData?.categoryId ?? "",
    },
  });

  const discountType = useWatch({
    control,
    name: "discountType",
  });

  const isActive = useWatch({
    control,
    name: "isActive",
  });

  const categoryId = useWatch({
    control,
    name: "categoryId",
  });

  const onSubmit = async (data: BankOfferFormValues) => {
    try {
      const url = isEditing
        ? `/api/admin/bank-offers/${initialData!.id}`
        : "/api/admin/bank-offers";

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Operation failed");
      }

      toast.success(
        isEditing
          ? `Bank offer for "${data.bankName}" updated`
          : `Bank offer for "${data.bankName}" created`,
      );
      router.push("/admin/bank-offers");
      router.refresh();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-black">Bank Offer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Bank Name"
              placeholder="e.g. HDFC Bank, ICICI Bank"
              required
              error={errors.bankName?.message}
              {...register("bankName")}
            />

            <FormInput
              label="Card Type Exclusion"
              placeholder="e.g. Credit Card, Debit Card, Visa Only"
              error={errors.cardType?.message}
              {...register("cardType")}
            />
          </div>

          <FormTextarea
            label="Terms / Description"
            placeholder="Describe the offer conditions..."
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              label="Applicable Category Scope"
              value={categoryId || ""}
              required
              onValueChange={(val) => setValue("categoryId", val || null)}
              placeholder="All Categories (Global Bank Offer)"
              options={[
                { label: "All Categories (Global Bank Offer)", value: "" },
                ...categories.map((cat) => ({
                  label: cat.name,
                  value: cat.id,
                })),
              ]}
              description="Restricts this bank offer discount to items matching the selected category."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormSelect
              label="Discount Type"
              value={discountType}
              onValueChange={(val) =>
                setValue("discountType", val as "PERCENTAGE" | "FIXED")
              }
              options={[
                { label: "Percentage (%)", value: "PERCENTAGE" },
                { label: "Fixed Amount (₹)", value: "FIXED" },
              ]}
              required
            />

            <FormInput
              label={
                discountType === "PERCENTAGE"
                  ? "Discount (%)"
                  : "Discount Amount (₹)"
              }
              type="number"
              step="0.01"
              required
              error={errors.discountValue?.message}
              {...register("discountValue")}
            />

            <FormInput
              label="Min Order Amount (₹)"
              type="number"
              step="0.01"
              required
              error={errors.minOrderAmount?.message}
              {...register("minOrderAmount")}
            />

            {discountType === "PERCENTAGE" && (
              <FormInput
                label="Max Discount Cap (₹)"
                type="number"
                step="0.01"
                placeholder="No cap limit"
                error={errors.maxDiscount?.message}
                {...register("maxDiscount")}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Availability & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Expiry Date"
              type="datetime-local"
              error={errors.expiresAt?.message}
              {...register("expiresAt")}
            />
          </div>

          <FormSwitch
            label="Active Status"
            description="Toggle whether customers can view and redeem this credit/debit card offer discount."
            checked={isActive}
            onCheckedChange={(val) => setValue("isActive", val)}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="font-semibold h-9"
        >
          {isSubmitting
            ? "Saving..."
            : isEditing
              ? "Update Offer"
              : "Create Offer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => router.push("/admin/bank-offers")}
          className="h-9"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
