import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { FormField } from "@/components/profile/FormField";
import { SectionCard } from "@/components/profile/SectionCard";
import { ENV } from "@/config/env";

import { useAddressStore } from "@/store/addressStore";
import { useCartStore } from "@/store/cartStore";
import { useOrderStore } from "@/store/orderStore";
import { useUserStore } from "@/store/userStore";
import { useWishlistStore } from "@/store/wishlistStore";

export default function AccountScreen() {
  const router = useRouter();
  const { getToken, signOut } = useAuth();

  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteCode] = useState(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    return Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  });

  const expectedConfirmation = `DELETE-${deleteCode}`;

  const clearAddresses = useAddressStore((state) => state.clearAddresses);
  const clearOrders = useOrderStore((state) => state.clearOrders);
  const clearCart = useCartStore((state) => state.clearCart);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const clearUser = useUserStore((state) => state.clearUser);

  const handleLogout = async () => {
    Alert.alert("Logout", "Do you want to sign out from this device?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            clearAddresses();
            clearOrders();
            clearCart();
            clearWishlist();
            clearUser();

            await signOut().catch(() => undefined);

            router.replace("/sign-in");
          } catch (error) {
            Toast.show({
              type: "error",
              text1: "Logout failed",
              text2: "Please try again.",
            });
            console.error("LOGOUT_ERROR", error);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (
      confirmText.trim().toUpperCase() !== expectedConfirmation.toUpperCase()
    ) {
      Alert.alert("Confirmation required", 'Please type "DELETE" to continue.');
      return;
    }

    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. All your data will be removed.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const token = await getToken();

            if (!token) {
              Toast.show({
                type: "error",
                text1: "Authentication failed",
                text2: "Please sign in again.",
              });
              return;
            }

            setLoading(true);

            try {
              const response = await fetch(`${ENV.API_URL}/api/account`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                const errData = await response.json().catch(() => ({}));

                throw new Error(
                  errData.message || `Delete failed (${response.status})`,
                );
              }

              clearAddresses();
              clearOrders();
              clearCart();
              clearWishlist();
              clearUser();

              await signOut().catch(() => undefined);

              Toast.show({
                type: "success",
                text1: "Account deleted",
                text2: "Your account and data have been removed.",
              });

              router.replace("/sign-in");
            } catch (error: any) {
              Alert.alert(
                "Delete failed",
                error.message || "Could not delete account.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };
  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text className="text-3xl font-black text-zinc-950">Account</Text>
        <Text className="mt-1 text-sm font-medium text-zinc-400">
          Final controls for your ShoeHub profile.
        </Text>

        <View className="mt-6">
          <SectionCard>
            <View className="px-5 py-5">
              <Text className="text-lg font-black text-red-600">
                Delete account
              </Text>

              <Text className="mt-2 text-sm leading-6 text-zinc-500">
                This action is permanent. Your profile, addresses, order
                history, wishlist, and saved preferences will be removed from
                ShoeHub.
              </Text>

              <View className="mt-5">
                <FormField
                  label={`Type ${expectedConfirmation} to confirm`}
                  placeholder={expectedConfirmation}
                  value={confirmText}
                  onChangeText={setConfirmText}
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={loading}
                onPress={handleDeleteAccount}
                className={`mt-5 h-14 items-center justify-center rounded-2xl ${
                  loading ? "bg-red-300" : "bg-red-600"
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-xs font-black uppercase text-white">
                    Delete Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </SectionCard>
        </View>

        <View className="mt-4">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLogout}
            className="h-14 items-center justify-center rounded-2xl border border-zinc-200 bg-white"
          >
            <Text className="text-xs font-black uppercase text-zinc-900">
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          className="mt-4 items-center py-2"
        >
          <Text className="text-sm font-bold text-zinc-500">Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
