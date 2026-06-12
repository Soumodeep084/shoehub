import { ClerkProvider } from "@clerk/expo";
import { StripeProvider } from "@stripe/stripe-react-native";
import { tokenCache } from "@clerk/expo/token-cache";
import { Slot } from "expo-router";
import "../global.css";
import ClerkUserSync from "@/hooks/ClerkUserSync";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";
import React from "react";

// This disables the strict mode warning spam
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
if (!clerkPublishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
if (!stripePublishableKey) {
  throw new Error("Add your Stripe Publishable Key to the .env file");
}


export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <StripeProvider
        publishableKey={stripePublishableKey}
        merchantIdentifier="merchant.com.shoehub" // Required for Apple Pay
        urlScheme="shoehub" // Required for 3D Secure and bank redirects
      >
        {/* Sync Clerk metadata into zustand early */}
        <ClerkUserSync />
        <Slot />
        <Toast />
      </StripeProvider>
    </ClerkProvider>
  );
}
