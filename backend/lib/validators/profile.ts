import { z } from "zod";

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(64),
  lastName: z.string().trim().min(1).max(64),
});

export const addressSchema = z.object({
  label: z.string().trim().min(2).max(32),
  fullName: z.string().trim().min(2).max(64),
  phone: z.string().trim().min(6).max(24),
  line1: z.string().trim().min(3).max(120),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(64),
  state: z.string().trim().min(2).max(64),
  postalCode: z.string().trim().min(6).max(6),
  country: z.string().trim().min(2).max(64).default("India"),
  landmark: z.string().trim().max(120).optional().or(z.literal("")),
  isDefault: z.boolean().optional().default(false),
});

