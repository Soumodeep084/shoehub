import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SectionCard } from "@/components/profile/SectionCard";
import { useNotificationStore } from "@/store/notificationStore";
import Toast from "react-native-toast-message";

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const preferences = useNotificationStore((state) => state.preferences);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const fetchPreferences = useNotificationStore((state) => state.fetchPreferences);
  const updatePreference = useNotificationStore((state) => state.updatePreference);

  useEffect(() => {
    const load = async () => {
      const token = await getToken();
      if (token) {
        await fetchPreferences(token);
      }
    };
    load().catch(() => undefined);
  }, []);

  const handleToggle = async (key: string, currentValue: boolean) => {
    try {
      const token = await getToken();
      if (token) {
        await updatePreference(token, { [key]: !currentValue });
        Toast.show({
          type: "success",
          text1: "Preferences Updated",
          text2: "Your notification settings have been saved.",
          position: "bottom",
        });
      }
    } catch (err) {
      console.error(err);
      Toast.show({
        type: "error",
        text1: "Failed to Update",
        text2: "Please try again later.",
        position: "bottom",
      });
    }
  };

  if (isLoading && !preferences) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#18181b" />
      </SafeAreaView>
    );
  }

  const prefs = preferences || {
    orderUpdates: true,
    promotionsOffers: true,
    coupons: true,
    bankOffers: true,
    newArrivals: true,
  };

  const preferenceItems = [
    {
      key: "orderUpdates",
      title: "Order Updates",
      description: "Get alerts on order status, deliveries, and cancellations",
      icon: "receipt-outline" as const,
      value: prefs.orderUpdates,
    },
    {
      key: "promotionsOffers",
      title: "Promotions & Offers",
      description: "Receive notifications about seasonal sales, campaigns, and events",
      icon: "flame-outline" as const,
      value: prefs.promotionsOffers,
    },
    {
      key: "coupons",
      title: "Coupons",
      description: "Stay updated on exclusive discount codes and coupon expiries",
      icon: "pricetag-outline" as const,
      value: prefs.coupons,
    },
    {
      key: "bankOffers",
      title: "Bank Offers",
      description: "Unlock cashbacks and bank discounts on checkout purchases",
      icon: "card-outline" as const,
      value: prefs.bankOffers,
    },
    {
      key: "newArrivals",
      title: "New Arrivals",
      description: "Be the first to hear about hot new drops and sneaker releases",
      icon: "sparkles-outline" as const,
      value: prefs.newArrivals,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-5 bg-white border-b border-zinc-100 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          className="h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm shadow-black/5"
        >
          <Ionicons name="chevron-back" size={18} color="#18181b" />
        </TouchableOpacity>

        <View>
          <Text className="text-2xl font-black text-zinc-950">
            Notification Preferences
          </Text>
          <Text className="mt-0.5 text-xs font-bold uppercase text-zinc-400">
            Manage alerts & subscription types
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <SectionCard>
          <View className="bg-white px-1 py-1">
            {preferenceItems.map((item, index) => (
              <View key={item.key}>
                <View className="flex-row items-center justify-between px-5 py-5">
                  <View className="flex-1 pr-4 flex-row gap-4 items-start">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 mt-0.5">
                      <Ionicons name={item.icon} size={20} color="#18181b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-black text-zinc-950">
                        {item.title}
                      </Text>
                      <Text className="mt-1 text-xs font-medium leading-5 text-zinc-400">
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    trackColor={{ false: "#E4E4E7", true: "#18181B" }}
                    thumbColor={item.value ? "#FFFFFF" : "#F4F4F5"}
                    ios_backgroundColor="#E4E4E7"
                    onValueChange={() => handleToggle(item.key, item.value)}
                    value={item.value}
                  />
                </View>

                {index !== preferenceItems.length - 1 && (
                  <View className="h-px bg-zinc-100 mx-5" />
                )}
              </View>
            ))}
          </View>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
