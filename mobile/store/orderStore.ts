import { create } from "zustand";
import { ENV } from "@/config/env";
import type { Order } from "@/types";

const BACKEND_URL = ENV.API_URL;

interface CreateOrderResponse {
  orderId: string;
  amount: number;
  orderNumber: string;
}

interface UpdatePaymentStatusResponse {
  message: string;
  orderId: string;
  paymentStatus: "PAID";
}

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  isLoading: boolean;
  isDetailLoading: boolean;
  error: string | null;

  createOrder: (
    token: string,
    addressId: string,
    paymentMethod: "COD" | "ONLINE"
  ) => Promise<CreateOrderResponse>;

  createPaymentIntent: (
    token: string,
    orderId: string
  ) => Promise<{ clientSecret: string }>;

  // 🔄 New Action added to the interface map
  updateOrderPaymentStatus: (
    token: string,
    orderId: string
  ) => Promise<UpdatePaymentStatusResponse>;

  fetchOrders: (token: string) => Promise<void>;
  fetchOrderById: (token: string, id: string) => Promise<Order | null>;
  getOrderCount: () => number;
  clearOrders: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  selectedOrder: null,
  isLoading: false,
  isDetailLoading: false,
  error: null,

  createPaymentIntent: async (token, orderId) => {
    const res = await fetch(
      `${BACKEND_URL}/api/stripe/create-payment-intent`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Payment intent failed");
    }

    return res.json();
  },

  createOrder: async (token, addressId, paymentMethod) => {
    const response = await fetch(`${BACKEND_URL}/api/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ addressId, paymentMethod }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Order creation failed");
    }

    return (await response.json()) as CreateOrderResponse;
  },

  // 🚀 New Action: Triggers PATCH call to synchronize payment state
  updateOrderPaymentStatus: async (token, orderId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update payment status");
      }

      const data = (await response.json()) as UpdatePaymentStatusResponse;

      // Dynamically update local client state arrays to match the new paid status row
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId
            ? { ...o, paymentStatus: "PAID", status: "CONFIRMED" }
            : o
        ),
        selectedOrder:
          state.selectedOrder?.id === orderId
            ? { ...state.selectedOrder, paymentStatus: "PAID", status: "CONFIRMED" }
            : state.selectedOrder,
      }));

      return data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOrders: async (token) => {
    set({ isLoading: true, error: null });

    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch orders");
      }

      set({ orders: await res.json() });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOrderById: async (token, id) => {
    set({ isDetailLoading: true });

    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Order fetch failed");
      }

      const order = await res.json();
      set({ selectedOrder: order });
      return order;
    } finally {
      set({ isDetailLoading: false });
    }
  },

  getOrderCount: () => get().orders.length,

  clearOrders: () =>
    set({
      orders: [],
      selectedOrder: null,
      error: null,
      isLoading: false,
      isDetailLoading: false,
    }),
}));