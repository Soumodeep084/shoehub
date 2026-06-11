import { create } from "zustand";
import { ENV } from "@/config/env";
import type { Address, AddressInput } from "@/types";

const BACKEND_URL = ENV.API_URL;

interface AddressState {
  addresses: Address[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchAddresses: (token: string) => Promise<void>;
  createAddress: (token: string, payload: AddressInput) => Promise<Address>;
  updateAddress: (token: string, id: string, payload: AddressInput) => Promise<Address>;
  deleteAddress: (token: string, id: string) => Promise<void>;
  setDefaultAddress: (token: string, id: string) => Promise<Address>;
  getAddressCount: () => number;
  clearAddresses: () => void;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  isLoading: false,
  isSaving: false,
  error: null,

  fetchAddresses: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${BACKEND_URL}/api/addresses`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Address fetch failed (${response.status})`);
      }

      const addresses = (await response.json()) as Address[];
      set({ addresses });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch addresses" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createAddress: async (token, payload) => {
    set({ isSaving: true, error: null });
    try {
      const response = await fetch(`${BACKEND_URL}/api/addresses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Address create failed (${response.status})`);
      }

      const created = (await response.json()) as Address;
      await get().fetchAddresses(token);
      return created;
    } catch (error: any) {
      set({ error: error.message || "Failed to create address" });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  updateAddress: async (token, id, payload) => {
    set({ isSaving: true, error: null });
    try {
      const response = await fetch(`${BACKEND_URL}/api/addresses/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Address update failed (${response.status})`);
      }

      const updated = (await response.json()) as Address;
      await get().fetchAddresses(token);
      return updated;
    } catch (error: any) {
      set({ error: error.message || "Failed to update address" });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  deleteAddress: async (token, id) => {
    set({ isSaving: true, error: null });
    try {
      const response = await fetch(`${BACKEND_URL}/api/addresses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Address delete failed (${response.status})`);
      }

      await get().fetchAddresses(token);
    } catch (error: any) {
      set({ error: error.message || "Failed to delete address" });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  setDefaultAddress: async (token, id) => {
    set({ isSaving: true, error: null });
    try {
      const response = await fetch(`${BACKEND_URL}/api/addresses/${id}/default`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Default address update failed (${response.status})`);
      }

      const updated = (await response.json()) as Address;
      await get().fetchAddresses(token);
      return updated;
    } catch (error: any) {
      set({ error: error.message || "Failed to set default address" });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  getAddressCount: () => get().addresses.length,

  clearAddresses: () => set({ addresses: [], error: null, isLoading: false, isSaving: false }),
}));
