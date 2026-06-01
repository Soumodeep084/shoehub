import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Slot } from "expo-router";
import "../global.css";
import dynamic from "react-native-dynamic";
import ClerkUserSync from "@/components/ClerkUserSync";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {/* Sync Clerk metadata into zustand early */}
      <ClerkUserSync />
      <Slot />
    </ClerkProvider>
  );
}
