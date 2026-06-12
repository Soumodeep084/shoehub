import { useEffect } from "react";
import { useAuth } from "@clerk/expo";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAddressStore } from "@/store/addressStore";
import { useOrderStore } from "@/store/orderStore";

export function useBootstrapUserData() {
    const { getToken, isSignedIn } = useAuth();

    const fetchUserWishlist = useWishlistStore((state) => state.fetchUserWishlist);
    const fetchUserCart = useCartStore((state) => state.fetchUserCart);
    const fetchAddresses = useAddressStore((state) => state.fetchAddresses);
    const fetchOrders = useOrderStore((state) => state.fetchOrders);

    useEffect(() => {
        if (!isSignedIn) return;

        let isActive = true;

        const bootstrap = async () => {
            try {
                const token = await getToken();
                if (!token || !isActive) return;

                await Promise.allSettled([
                    fetchUserWishlist(token),
                    fetchUserCart(token),
                    fetchAddresses(token),
                    fetchOrders(token),
                ]);
            } catch (error) {
                console.error("Bootstrap failed:", error);
            }
        };

        bootstrap();

        return () => {
            isActive = false;
        };
    }, [isSignedIn]);
}
