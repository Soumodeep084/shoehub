import { create } from "zustand";
import { ENV } from "@/config/env";
import type { Notification, NotificationPreference } from "@/types";

const BACKEND_URL = ENV.API_URL;

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreference | null;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: (token: string) => Promise<void>;
  fetchUnreadCount: (token: string) => Promise<number>;
  markAsRead: (token: string, ids: string[]) => Promise<void>;
  markAllAsRead: (token: string) => Promise<void>;
  fetchPreferences: (token: string) => Promise<NotificationPreference | null>;
  updatePreference: (
    token: string,
    updates: Partial<NotificationPreference>
  ) => Promise<NotificationPreference>;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  preferences: null,
  isLoading: false,
  error: null,

  fetchNotifications: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch notifications");
      }

      const data = await res.json();
      set({ notifications: data });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async (token) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch unread count");
      }

      const { unreadCount } = await res.json();
      set({ unreadCount });
      return unreadCount;
    } catch (error) {
      console.error("fetchUnreadCount error:", error);
      return get().unreadCount;
    }
  },

  markAsRead: async (token, ids) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      // Update local state
      set((state) => {
        const updatedNotifications = state.notifications.map((n) =>
          ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n
        );
        const newUnreadCount = Math.max(state.unreadCount - ids.length, 0);

        return {
          notifications: updatedNotifications,
          unreadCount: newUnreadCount,
        };
      });
    } catch (error) {
      console.error("markAsRead error:", error);
      throw error;
    }
  },

  markAllAsRead: async (token) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to mark all as read");
      }

      // Update local state
      set((state) => {
        const updatedNotifications = state.notifications.map((n) => ({
          ...n,
          readAt: n.readAt || new Date().toISOString(),
        }));

        return {
          notifications: updatedNotifications,
          unreadCount: 0,
        };
      });
    } catch (error) {
      console.error("markAllAsRead error:", error);
      throw error;
    }
  },

  fetchPreferences: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch notification preferences");
      }

      const data = await res.json();
      set({ preferences: data });
      return data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updatePreference: async (token, updates) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/preferences`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error("Failed to update notification preferences");
      }

      const data = await res.json();
      set({ preferences: data });
      return data;
    } catch (error) {
      console.error("updatePreference error:", error);
      throw error;
    }
  },

  clearNotifications: () =>
    set({
      notifications: [],
      unreadCount: 0,
      preferences: null,
      error: null,
      isLoading: false,
    }),
}));
