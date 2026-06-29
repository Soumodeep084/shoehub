import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import slugify from "slugify";
import { customAlphabet } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 4);

export function generateSlug(name: string) {
  return `${slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  })}-${nanoid()}`;
}

export function generateSKU(brand: string, size: string, color: string) {
  const brandCode = brand
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 3);

  const colorCode = color
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 3);

  return `SH-${brandCode}-${size}-${colorCode}-${nanoid()}`;
}

export const getDiscountPercentage = (originalPrice: number, discountedPrice: number): number => {
  if (originalPrice <= 0) {
    throw new Error("Original price must be greater than 0.");
  }

  const percentage = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Number(percentage.toFixed(1));
};