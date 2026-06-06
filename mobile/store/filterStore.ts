import { create } from "zustand";

export type SortByType = "newest" | "trending" | "featured" | "priceLowToHigh" | "priceHighToLow";

interface FilterState {
    search: string;
    categoryId: string; // Defaults to "All"
    brand: string;      // Defaults to "All"
    size: string;       // Defaults to "Any"
    minPrice: number | null;
    maxPrice: number | null;
    sortBy: SortByType;

    setSearch: (value: string) => void;
    setCategoryId: (value: string) => void;
    setBrand: (value: string) => void;
    setSize: (value: string) => void;
    setMinPrice: (value: number | null) => void;
    setMaxPrice: (value: number | null) => void;
    setSortBy: (value: SortByType) => void;
    resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
    search: "",
    categoryId: "All",
    brand: "All",
    size: "Any",
    minPrice: null,
    maxPrice: null,
    sortBy: "newest",

    setSearch: (value) => set({ search: value }),
    setCategoryId: (value) => set({ categoryId: value }),
    setBrand: (value) => set({ brand: value }),
    setSize: (value) => set({ size: value }),
    setMinPrice: (value) => set({ minPrice: value }),
    setMaxPrice: (value) => set({ maxPrice: value }),
    setSortBy: (value) => set({ sortBy: value }),

    resetFilters: () =>
        set({
            search: "",
            categoryId: "All",
            brand: "All",
            size: "Any",
            minPrice: null,
            maxPrice: null,
            sortBy: "newest",
        }),
}));