import { create } from "zustand";


interface UserState {
  isUser: boolean;
  setIsUser: (isUser: boolean) => void;

  // isDeliveryBoy: boolean;
  // setIsDelivery: (isDeliveryBoy: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  isUser: false,
  setIsUser: (isUser: boolean) => set(() => ({ isUser })),
}));

export default useUserStore;