import { useEffect } from "react";
import { useUser } from "@clerk/expo";
import { useUserStore } from "@/store/userStore";
import { useAddressStore } from "@/store/addressStore";
import { useOrderStore } from "@/store/orderStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { usePushNotifications } from "./usePushNotifications";

export default function ClerkUserSync() {
  usePushNotifications();
  const { user, isSignedIn } = useUser();

  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const clearAddresses = useAddressStore((state) => state.clearAddresses);
  const clearOrders = useOrderStore((state) => state.clearOrders);
  const clearCart = useCartStore((state) => state.clearCart);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  useEffect(() => {
    if (isSignedIn && user) {
      const role = (user.publicMetadata?.role as string | undefined) ?? "USER";

      setUser({
        id: user.id,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        role,
      });
    } else {
      clearUser();
      clearAddresses();
      clearOrders();
      clearCart();
      clearWishlist();
    }
  }, [
    isSignedIn,
    user,
    setUser,
    clearUser,
    clearAddresses,
    clearOrders,
    clearCart,
    clearWishlist,
  ]);

  return null;
}
