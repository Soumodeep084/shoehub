import { useAuth } from "@clerk/expo";
import { Redirect, Slot } from "expo-router";
import { useBootstrapUserData } from "@/hooks/useBootstrapUserData";

export default function RootLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  useBootstrapUserData();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return <Slot />;
}
