import { ENV } from "@/config/env";
import { create } from "zustand";

export interface WishlistItem {
    productId: string;
    categoryId: string;
    name: string;
    brand: string;
    basePrice: number;
    salePrice: number;
    discountPercent: number;
    averageRating: number;
    baseImageUrl: string;
}

interface WishlistState {
    items: WishlistItem[];
    isLoading: boolean;
    fetchUserWishlist: (token: string) => Promise<void>;
    toggleWishlist: (token: string, item: WishlistItem) => Promise<void>;
    isWishlisted: (productId: string) => boolean;
    clearWishlist: () => void;
}

const BACKEND_URL = ENV.API_URL;

export const useWishlistStore = create<WishlistState>((set, get) => ({
    items: [],
    isLoading: false,

    /**
     * Fetch wishlist from database + Map to fit Frontend UI
     */
    fetchUserWishlist: async (token) => {
        set({ isLoading: true });

        try {
            const response = await fetch(`${BACKEND_URL}/api/wishlist`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Wishlist fetch failed (${response.status})`);
            }

            const rawData = await response.json();

            // 1. DATA MAPPER: Flattens the nested Prisma object structure into clean UI state
            const mappedItems: WishlistItem[] = rawData.map((item: any) => {
                const prod = item.product;

                // Extract the designated primary image or grab the first element as fallback
                const primaryImage = prod.images?.find((img: any) => img.isPrimary)?.imageUrl
                    || prod.images?.[0]?.imageUrl
                    || "";

                return {
                    productId: item.productId,
                    categoryId: prod.categoryId,
                    name: prod.name,
                    brand: prod.brand,
                    basePrice: Number(prod.basePrice),           // Convert Prisma decimal string to number
                    salePrice: Number(prod.salePrice),           // Convert Prisma decimal string to number
                    discountPercent: prod.discountPercent,
                    averageRating: Number(prod.averageRating),   // Convert Prisma decimal string to number
                    baseImageUrl: primaryImage,
                };
            });

            set({ items: mappedItems });
        } catch (error) {
            console.error("Failed to fetch wishlist:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    /**
     * Add / Remove Wishlist
     * Optimistic Update + Rollback
     */
    toggleWishlist: async (token, item) => {
        const previousItems = get().items;
        const exists = previousItems.some((i) => i.productId === item.productId);

        let optimisticItems: WishlistItem[];
        if (exists) {
            optimisticItems = previousItems.filter((i) => i.productId !== item.productId);
        } else {
            optimisticItems = [...previousItems, item];
        }

        set({ items: optimisticItems });

        try {
            const response = await fetch(`${BACKEND_URL}/api/wishlist`, {
                method: exists ? "DELETE" : "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId: item.productId,
                }),
            });

            if (!response.ok) {
                throw new Error(`Wishlist sync failed (${response.status})`);
            }
        } catch (error) {
            console.error("Wishlist sync failed. Rolling back...", error);
            // Rollback UI State if the backend server throws an error
            set({ items: previousItems });
        }
    },

    isWishlisted: (productId) => {
        return get().items.some((item) => item.productId === productId);
    },

    clearWishlist: () => set({ items: [] }),
}));