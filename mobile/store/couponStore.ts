import { create } from "zustand";
import { ENV } from "@/config/env";
import type { AppliedCoupon, BankOffer, Coupon } from "@/types";

const BACKEND_URL = ENV.API_URL;

interface CouponState {
  appliedCoupon: AppliedCoupon | null;
  availableCoupons: Coupon[];
  availableBankOffers: BankOffer[];
  selectedBankOffer: BankOffer | null;
  isApplying: boolean;
  isLoading: boolean;
  error: string | null;

  applyCoupon: (token: string, code: string, subtotal: number) => Promise<void>;
  removeCoupon: (token: string) => Promise<void>;
  fetchCoupons: (token: string) => Promise<void>;
  fetchBankOffers: (token: string) => Promise<void>;
  selectBankOffer: (offer: BankOffer | null) => void;
  clearAll: () => void;
}

export const useCouponStore = create<CouponState>((set) => ({
  appliedCoupon: null,
  availableCoupons: [],
  availableBankOffers: [],
  selectedBankOffer: null,
  isApplying: false,
  isLoading: false,
  error: null,

  applyCoupon: async (token, code, subtotal) => {
    set({ isApplying: true, error: null });
    try {
      const response = await fetch(`${BACKEND_URL}/api/coupons/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, subtotal }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to apply coupon");
      }

      set({
        appliedCoupon: {
          coupon: data.coupon,
          discount: data.discount,
          subtotal: data.subtotal,
          newTotal: data.newTotal,
        },
        error: null,
      });
    } catch (error: any) {
      set({ error: error.message, appliedCoupon: null });
      throw error;
    } finally {
      set({ isApplying: false });
    }
  },

  removeCoupon: async (token) => {
    const previousCoupon = useCouponStore.getState().appliedCoupon;
    set({ appliedCoupon: null, error: null });

    try {
      const response = await fetch(`${BACKEND_URL}/api/coupons/remove`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to remove coupon");
      }
    } catch (error: any) {
      // Rollback on failure
      set({ appliedCoupon: previousCoupon, error: error.message });
      throw error;
    }
  },

  fetchCoupons: async (token) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${BACKEND_URL}/api/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch coupons");
      }

      const data = await response.json();
      set({ availableCoupons: data });
    } catch (error: any) {
      console.error("Failed to fetch coupons:", error);
      set({ availableCoupons: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBankOffers: async (token) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${BACKEND_URL}/api/bank-offers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bank offers");
      }

      const data = await response.json();
      set({ availableBankOffers: data });
    } catch (error: any) {
      console.error("Failed to fetch bank offers:", error);
      set({ availableBankOffers: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  selectBankOffer: (offer) => {
    set({ selectedBankOffer: offer });
  },

  clearAll: () => {
    set({
      appliedCoupon: null,
      availableCoupons: [],
      availableBankOffers: [],
      selectedBankOffer: null,
      isApplying: false,
      isLoading: false,
      error: null,
    });
  },
}));
