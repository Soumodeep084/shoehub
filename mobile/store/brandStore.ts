import { create } from "zustand";

type BrandState = {
    brands: string[];
    setBrands: (brands: string[]) => void;
};

export const useBrandStore = create<BrandState>((set) => ({
    brands: [],
    setBrands: (brands) => set({ brands }),
}));