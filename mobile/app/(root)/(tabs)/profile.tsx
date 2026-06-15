import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { EmptyState } from "@/components/profile/EmptyState";
import { SectionCard } from "@/components/profile/SectionCard";
import { SettingRow } from "@/components/profile/SettingRow";
import { useAddressStore } from "@/store/addressStore";
import { useCartStore } from "@/store/cartStore";
import { useOrderStore } from "@/store/orderStore";
import { useUserStore } from "@/store/userStore";
import { useWishlistStore } from "@/store/wishlistStore";
import Toast from "react-native-toast-message";

export default function ProfileTab() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user, isLoaded } = useUser();

  const clearAddresses = useAddressStore((state) => state.clearAddresses);
  const clearOrders = useOrderStore((state) => state.clearOrders);
  const clearCart = useCartStore((state) => state.clearCart);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  const userStore = useUserStore();
  const ordersCount = useOrderStore((state) => state.getOrderCount());
  const addressCount = useAddressStore((state) => state.getAddressCount());

  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Sign out", "Do you want to sign out from this device?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut().finally(() => {
            userStore.clearUser();
            clearAddresses();
            clearOrders();
            clearCart();
            clearWishlist();
          });
          router.replace("/sign-in");
        },
      },
    ]);
  };

  const settingsRowData = useMemo(
    () => [
      {
        title: "Edit Profile",
        subtitle: "Update your name and phone number",
        icon: "create-outline" as keyof typeof Ionicons.glyphMap,
        onPress: () => router.push("/profile/profile-edit"),
      },
      {
        title: "Address Book",
        subtitle: "Manage delivery addresses",
        icon: "location-outline" as keyof typeof Ionicons.glyphMap,
        onPress: () => router.push("/address/addresses"),
      },
      {
        title: "Order History",
        subtitle: "Track all past purchases",
        icon: "receipt-outline" as keyof typeof Ionicons.glyphMap,
        onPress: () => router.push("/order/orders"),
      },
      {
        title: "Security",
        subtitle: "Passwords and active sessions",
        icon: "shield-checkmark-outline" as keyof typeof Ionicons.glyphMap,
        onPress: () => router.push("/profile/security"),
      },
    ],
    [router],
  );

  const handleUpdateProfileImage = async () => {
    try {
      // 1. Permission (FIXED)
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission Required",
          text2: "Please allow photo access in settings.",
        });
        return;
      }

      // 2. Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
        allowsMultipleSelection: false,
      });

      if (result.canceled) return;

      setIsUpdating(true);
      // 3. Upload to Clerk
      if (!result.assets[0].base64) {
        throw new Error("No base64 image returned");
      }

      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;

      await user?.setProfileImage({
        file: base64Image,
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Profile picture updated successfully!",
      });

      await user?.reload();
    } catch (error) {
      console.error("Error updating profile image:", error);

      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update profile picture. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isLoaded) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-zinc-50"
        edges={["top"]}
      >
        <View className="mt-6 items-center py-6">
          <ActivityIndicator color="#18181b" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-zinc-50"
        edges={["top"]}
      >
        <View className="mt-6">
          <EmptyState
            title="Profile not loaded"
            description="We couldn't load your account data right now. Pull to refresh on the next screen or reopen the app."
            icon="person-outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="px-6 pt-2 pb-4 bg-white border-b border-zinc-100">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-black tracking-tight text-zinc-950">
                Profile
              </Text>
              <Text className="mt-1 text-xs font-semibold uppercase tracking-[1px] text-zinc-400">
                Your Account center
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 pt-6">
          {/* Profile Info */}
          <SectionCard>
            <View className="bg-zinc-950 px-5 py-6 overflow-hidden">
              <View className="flex-row items-center gap-4">
                <View className="relative">
                  {user?.imageUrl ? (
                    <Image
                      source={{ uri: user.imageUrl }}
                      className="h-20 w-20 rounded-full"
                    />
                  ) : (
                    <View className="h-20 w-20 items-center justify-center rounded-full bg-white/10">
                      <Text className="text-xl font-black text-white">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={handleUpdateProfileImage}
                    disabled={isUpdating}
                    activeOpacity={0.8}
                    className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-950 bg-white"
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#18181b" />
                    ) : (
                      <Ionicons name="camera" size={15} color="#18181b" />
                    )}
                  </TouchableOpacity>
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-medium text-zinc-500">
                    Welcome back
                  </Text>

                  <Text className="mt-1 text-xl font-black tracking-tight text-white">
                    {user?.firstName} {user?.lastName}
                  </Text>

                  <Text className="mt-1 text-sm font-medium text-zinc-300">
                    {user?.primaryEmailAddress?.emailAddress}
                  </Text>

                  <Text className="mt-2 text-xs font-medium text-zinc-500">
                    Member since{" "}
                    {new Date(user?.createdAt || Date.now()).toLocaleDateString(
                      "en-US",
                      { month: "short", year: "numeric" },
                    )}
                  </Text>
                </View>
              </View>
              <View className="mt-4 flex-row gap-2">
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push("/order/orders")}
                  className="flex-1 rounded-2xl bg-white/10 px-4 py-3"
                >
                  <Text className="text-[10px] font-bold uppercase tracking-[2px] text-zinc-400">
                    Orders
                  </Text>

                  <Text className="mt-1 text-2xl font-black text-white">
                    {ordersCount}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push("/address/addresses")}
                  className="flex-1 rounded-2xl bg-white/10 px-4 py-3"
                >
                  <Text className="text-[10px] font-bold uppercase tracking-[2px] text-zinc-400">
                    Addresses
                  </Text>

                  <Text className="mt-1 text-2xl font-black text-white">
                    {addressCount}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Settings */}
            <View className="bg-white">
              {settingsRowData.map((row, index) => (
                <View key={row.title}>
                  <SettingRow
                    title={row.title}
                    subtitle={row.subtitle}
                    icon={row.icon}
                    onPress={row.onPress}
                  />

                  {index !== settingsRowData.length - 1 && (
                    <View className="h-px bg-zinc-100" />
                  )}
                </View>
              ))}
            </View>
          </SectionCard>

          {/* Account Actions */}
          <View className="mt-2">
            <SectionCard>
              <SettingRow
                title="Account Settings"
                subtitle="Delete your account and clean up data"
                icon="trash-outline"
                danger
                onPress={() => router.push("/profile/account")}
              />
            </SectionCard>
          </View>

          {/* Logout */}
          <View className="mt-2">
            <SectionCard>
              <SettingRow
                title="Logout"
                subtitle="Sign out from this device"
                icon="log-out-outline"
                danger
                onPress={handleLogout}
              />
            </SectionCard>
          </View>
          <View className="mt-6 items-center">
            <Text className="text-xs font-medium text-zinc-400">
              ShoeHub v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
