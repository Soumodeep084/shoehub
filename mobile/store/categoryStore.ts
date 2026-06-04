import { create } from "zustand";
import type { Category } from "@/types";

type CategoryState = {
    categories: Category[];
    setCategories: (categories: Category[]) => void;
};

export const useCategoryStore = create<CategoryState>((set) => ({
    categories: [],
    setCategories: (categories) => set({ categories }),
}));