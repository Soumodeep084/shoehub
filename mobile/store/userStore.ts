import { create } from "zustand";

interface UserState {
  isUser: boolean;

  id: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
  avatarLabel: string | null;

  setUser: (user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    imageUrl?: string | null;
    role?: string;
  }) => void;

  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  isUser: false,

  id: null,
  firstName: null,
  lastName: null,
  email: null,
  imageUrl: null,
  avatarLabel: null,

  setUser: (user) =>
    set({
      isUser: user.role === "USER",
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      imageUrl: user.imageUrl ?? null,

      avatarLabel: `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase(),
    }),

  clearUser: () =>
    set({
      isUser: false,
      id: null,
      firstName: null,
      lastName: null,
      email: null,
      imageUrl: null,
      avatarLabel: null,
    }),
}));