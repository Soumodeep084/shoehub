import { create } from "zustand";

interface UserState {
  isUser: boolean;
  id: string | null;
  avatarLabel: string | null;

  setUser: (user: {
    id: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => void;

  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  isUser: false,
  id: null,
  avatarLabel: null,

  setUser: (user) =>
    set({
      isUser: user.role === "USER",
      id: user.id,
      avatarLabel: `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase(),
    }),

  clearUser: () =>
    set({
      isUser: false,
      id: null,
      avatarLabel: null,
    }),
}));