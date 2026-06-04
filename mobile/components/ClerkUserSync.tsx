import { useEffect } from "react";
import { useUser } from "@clerk/expo";

import { useUserStore } from "@/store/userStore";

export default function ClerkUserSync() {
  const { user, isSignedIn } = useUser();

  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    if (isSignedIn && user) {
      const role = (user.publicMetadata?.role as string | undefined) ?? "USER";

      setUser({
        id: user.id,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.primaryEmailAddress?.emailAddress ?? "",
        imageUrl: user.imageUrl,
        role,
      });
    } else {
      clearUser();
    }
  }, [isSignedIn, user, setUser, clearUser]);

  return null;
}
