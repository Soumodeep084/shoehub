import { z } from "zod";

// ─── Coupon Schemas ─────────────────────────────────────────────────────────

export const couponFormSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(30, "Code must be at most 30 characters")
    .transform((v) => v.toUpperCase().trim()),
  description: z.string().max(500).optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce
    .number()
    .positive("Discount value must be positive"),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  expiresAt: z.coerce.date().optional().nullable(),
  totalUsageLimit: z.coerce.number().int().positive().optional().nullable(),
  perUserLimit: z.coerce.number().int().min(1).default(1),
  categoryId: z.string().optional().nullable(),
});

export type CouponFormValues = z.output<typeof couponFormSchema>;

// ─── Bank Offer Schemas ─────────────────────────────────────────────────────

export const bankOfferFormSchema = z.object({
  bankName: z.string().min(1, "Bank name is required").max(100),
  cardType: z.string().optional().nullable(),
  description: z.string().min(1, "Description is required").max(500),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce
    .number()
    .positive("Discount value must be positive"),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  expiresAt: z.preprocess(
    (value) => (value === "" ? null : value),
    z.coerce.date().nullable().optional()
  ),
  categoryId: z.string().optional().nullable(),
});

export type BankOfferFormValues = z.output<typeof bankOfferFormSchema>;

// ─── User-facing Schemas ────────────────────────────────────────────────────

export const applyCouponSchema = z.object({
  code: z
    .string()
    .min(1, "Coupon code is required")
    .transform((v) => v.toUpperCase().trim()),
  subtotal: z.coerce.number().positive("Subtotal must be positive"),
});

export type ApplyCouponValues = z.infer<typeof applyCouponSchema>;

export const applyBankOfferSchema = z.object({
  bankOfferId: z.string().uuid("Invalid bank offer ID"),
  subtotal: z.coerce.number().positive("Subtotal must be positive"),
});

export type ApplyBankOfferValues = z.infer<typeof applyBankOfferSchema>;
