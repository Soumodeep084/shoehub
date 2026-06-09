import { useEffect } from "react";
import { useAuth } from "@clerk/expo";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

export function useBootstrapUserData() {
    const { getToken, isSignedIn } = useAuth();

    const fetchUserWishlist = useWishlistStore((state) => state.fetchUserWishlist);

    const fetchUserCart = useCartStore((state) => state.fetchUserCart);

    useEffect(() => {
        const bootstrap = async () => {
            if (!isSignedIn) return;

            try {
                const token = await getToken();

                if (!token) return;

                await Promise.all([
                    fetchUserWishlist(token),
                    fetchUserCart(token)

                    // Future:
                    // fetchNotifications(token)
                ]);
            } catch (error) {
                console.error("Bootstrap failed:", error);
            }
        };

        bootstrap();
    }, [isSignedIn]);
}