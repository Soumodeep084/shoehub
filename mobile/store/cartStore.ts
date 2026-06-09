import { create } from "zustand";
import { ENV } from "@/config/env";

const BACKEND_URL = ENV.API_URL;

export interface CartItem {
    productId: string;
    variantId: string;
    name: string;
    brand: string;
    salePrice: number;
    basePrice: number;
    imageUrl: string;
    size: string;
    color: string;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    isLoading: boolean;
    fetchUserCart: (token: string) => Promise<void>;
    addToCart: (token: string, item: CartItem) => Promise<void>;
    updateQuantity: (token: string, variantId: string, quantity: number) => Promise<void>;
    removeFromCart: (token: string, variantId: string) => Promise<void>;
    isInCart: (variantId: string) => boolean;
    getCartItem: (variantId: string) => CartItem | undefined;
    clearCart: () => void;
    getTotalCartItemsCount: () => number;
    getCartTotal: () => number;
    getCartCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    isLoading: false,

    // FETCH USER CART
    fetchUserCart: async (token) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${BACKEND_URL}/api/cart`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Cart fetch failed (${response.status})`);
            }

            const rawData = await response.json();
            const mappedItems: CartItem[] = rawData.map((item: any) => ({
                productId: item.productId,
                variantId: item.variantId,
                name: item.product.name,
                brand: item.product.brand,
                salePrice: Number(item.product.salePrice),
                basePrice: Number(item.product.basePrice),
                imageUrl:
                    item.product.images?.find((img: any) => img.isPrimary)?.imageUrl ||
                    item.product.images?.[0]?.imageUrl || "",
                size: item.variant.size,
                color: item.variant.color,
                quantity: item.quantity,
            }));

            set({ items: mappedItems });
        } catch (error) {
            console.error("Failed fetching cart:", error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    // ADD TO CART
    addToCart: async (token, item) => {
        const previousItems = get().items;
        const existingItem = previousItems.find((i) => i.variantId === item.variantId);

        let optimisticItems: CartItem[];
        if (existingItem) {
            optimisticItems = previousItems.map((i) =>
                i.variantId === item.variantId ? { ...i, quantity: i.quantity + item.quantity } : i
            );
        } else {
            optimisticItems = [...previousItems, item];
        }

        set({ items: optimisticItems });
        try {
            const response = await fetch(`${BACKEND_URL}/api/cart`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Cart sync failed (${response.status})`);
            }
        } catch (error) {
            console.error("Add to cart failed. Rolling back...", error);
            set({ items: previousItems });
            throw error; // Rethrow to frontend
        }
    },

    // REMOVE FROM CART
    removeFromCart: async (token, variantId) => {
        const previousItems = get().items;
        const optimisticItems = previousItems.filter((item) => item.variantId !== variantId);

        set({ items: optimisticItems });

        try {
            const response = await fetch(`${BACKEND_URL}/api/cart`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ variantId }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Delete failed (${response.status})`);
            }
        } catch (error) {
            console.error("Delete failed. Rolling back...", error);
            set({ items: previousItems });
            throw error; // Rethrow to frontend
        }
    },

    // UPDATE QUANTITY
    updateQuantity: async (token, variantId, quantity) => {
        const previousItems = get().items;
        const optimisticItems = previousItems.map((item) =>
            item.variantId === variantId ? { ...item, quantity } : item
        );

        set({ items: optimisticItems });
        try {
            const response = await fetch(`${BACKEND_URL}/api/cart`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ variantId, quantity }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                // Throws backend message like: "Only X items available in stock"
                throw new Error(errData.message || `Update failed (${response.status})`);
            }
        } catch (error) {
            console.error("Quantity update failed. Rolling back...", error);
            set({ items: previousItems });
            throw error; // CRITICAL FIX: Rethrow to catch in component UI
        }
    },

    isInCart: (variantId) => get().items.some((item) => item.variantId === variantId),
    getCartItem: (variantId) => get().items.find((item) => item.variantId === variantId),
    getCartCount: () => get().items.length,
    getTotalCartItemsCount: () => get().items.reduce((total, item) => total + item.quantity, 0),
    getCartTotal: () => get().items.reduce((total, item) => total + item.salePrice * item.quantity, 0),
    clearCart: () => set({ items: [] }),
}));