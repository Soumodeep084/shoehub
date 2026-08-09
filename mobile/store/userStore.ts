import { create } from "zustand";

interface UserState {
  isUser: boolean;
  role: string | null;
  id: string | null;
  firstName: string | null;
  lastName: string | null;
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
  role: null,
  id: null,
  firstName: null,
  lastName: null,
  avatarLabel: null,

  setUser: (user) =>
    set({
      isUser: user.role === "USER",
      role: user.role ?? "USER",
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarLabel: `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase(),
    }),

  clearUser: () =>
    set({
      isUser: false,
      role: null,
      id: null,
      firstName: null,
      lastName: null,
      avatarLabel: null,
    }),
}));