"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  couponFormSchema,
  type CouponFormValues,
} from "@/lib/validators/coupon";
import { FormInput, FormTextarea, FormSelect, FormSwitch } from "@/components/admin/form-components";

interface CouponFormProps {
  initialData?: CouponFormValues & { id: string };
  categories?: { id: string; name: string }[];
}

export function CouponForm({ initialData, categories = [] }: CouponFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(couponFormSchema) as any,
    defaultValues: {
      code: initialData?.code ?? "",
      description: initialData?.description ?? "",
      discountType: initialData?.discountType ?? "PERCENTAGE",
      discountValue: initialData?.discountValue ?? 0,
      minOrderAmount: initialData?.minOrderAmount ?? 0,
      maxDiscount: initialData?.maxDiscount ?? null,
      isActive: initialData?.isActive ?? true,
      expiresAt: (initialData?.expiresAt
        ? new Date(initialData.expiresAt).toISOString().slice(0, 16)
        : "") as unknown as Date,
      totalUsageLimit: initialData?.totalUsageLimit ?? null,
      perUserLimit: initialData?.perUserLimit ?? 1,
      categoryId: initialData?.categoryId ?? "",
    },
  });

  const discountType = useWatch({
    control,
    name: "discountType"
  });
  const isActive = useWatch({
    control,
    name: "isActive"
  });
  const categoryId = useWatch({
    control,
    name: "categoryId"
  });

  const onSubmit = async (data: CouponFormValues) => {

    try {
      const url = isEditing
        ? `/api/admin/coupons/${initialData!.id}`
        : "/api/admin/coupons";

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Operation failed");
      }

      toast.success(isEditing ? `Coupon "${data.code}" updated` : `Coupon "${data.code}" created`);
      router.push("/admin/coupons");
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
          <CardTitle className="text-base text-black">Coupon Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Coupon Code"
              placeholder="e.g. EXTRA10"
              required
              className="uppercase"
              error={errors.code?.message}
              {...register("code")}
            />

            <FormSelect
              label="Discount Type"
              value={discountType}
              onValueChange={(val) => setValue("discountType", val as "PERCENTAGE" | "FIXED")}
              options={[
                { label: "Percentage (%)", value: "PERCENTAGE" },
                { label: "Fixed Amount (₹)", value: "FIXED" },
              ]}
              required
            />
          </div>

          <FormTextarea
            label="Description"
            placeholder="Describe the offer parameters..."
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              label="Applicable Category Scope"
              value={categoryId || ""}
              onValueChange={(val) => setValue("categoryId", val || null)}
              placeholder="All Categories (Global Coupon)"
              options={[
                { label: "All Categories (Global Coupon)", value: "" },
                ...categories.map((cat) => ({
                  label: cat.name,
                  value: cat.id,
                })),
              ]}
              description="Restricts this coupon discount to items matching the selected category."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormInput
              label={discountType === "PERCENTAGE" ? "Discount (%)" : "Discount Amount (₹)"}
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
          <CardTitle className="text-base">Limits & Expiry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormInput
              label="Total Usage Limit"
              type="number"
              placeholder="Unlimited usages"
              error={errors.totalUsageLimit?.message}
              {...register("totalUsageLimit")}
            />

            <FormInput
              label="Per Customer Limit"
              type="number"
              min={1}
              required
              error={errors.perUserLimit?.message}
              {...register("perUserLimit")}
            />

            <FormInput
              label="Expiry Date"
              type="datetime-local"
              error={errors.expiresAt?.message}
              {...register("expiresAt")}
            />
          </div>

          <FormSwitch
            label="Active Status"
            description="Toggle whether checkout sessions can validate and apply this coupon discount code."
            checked={isActive}
            onCheckedChange={(val) => setValue("isActive", val)}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting} className="font-semibold h-9">
          {isSubmitting
            ? "Saving..."
            : isEditing
              ? "Update Coupon"
              : "Create Coupon"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => router.push("/admin/coupons")}
          className="h-9"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
