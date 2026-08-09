import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SectionCard } from "@/components/profile/SectionCard";
import { useNotificationStore } from "@/store/notificationStore";
import { formatDateTimeWithTime } from "@/utils/order.utils";
import type { Notification, NotificationType } from "@/types";

export default function NotificationsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const notifications = useNotificationStore((state) => state.notifications);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const token = await getToken();
      if (token) {
        await fetchNotifications(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotifications().catch(() => undefined);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = await getToken();
      if (token) {
        await markAllAsRead(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationPress = async (item: Notification) => {
    try {
      if (!item.readAt) {
        const token = await getToken();
        if (token) {
          await markAsRead(token, [item.id]);
        }
      }
    } catch (err) {
      console.error(err);
    }

    if (item.orderId) {
      router.push(`/order/order-details?id=${item.orderId}` as any);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "ORDER_PLACED":
        return { name: "cart-outline" as const, color: "#10B981", bg: "#E6F4EA" };
      case "ORDER_CONFIRMED":
        return { name: "checkmark-circle-outline" as const, color: "#10B981", bg: "#E6F4EA" };
      case "ORDER_PACKED":
        return { name: "cube-outline" as const, color: "#F59E0B", bg: "#FEF3C7" };
      case "ORDER_SHIPPED":
        return { name: "airplane-outline" as const, color: "#3B82F6", bg: "#DBEAFE" };
      case "ORDER_OUT_FOR_DELIVERY":
        return { name: "bicycle-outline" as const, color: "#3B82F6", bg: "#DBEAFE" };
      case "ORDER_DELIVERED":
        return { name: "home-outline" as const, color: "#10B981", bg: "#E6F4EA" };
      case "ORDER_CANCELLED":
        return { name: "close-circle-outline" as const, color: "#EF4444", bg: "#FEE2E2" };
      case "PROMOTIONS_OFFERS":
        return { name: "flame-outline" as const, color: "#F97316", bg: "#FFEDD5" };
      case "COUPONS":
        return { name: "pricetag-outline" as const, color: "#D97706", bg: "#FEF3C7" };
      case "BANK_OFFERS":
        return { name: "card-outline" as const, color: "#2563EB", bg: "#DBEAFE" };
      case "NEW_ARRIVALS":
        return { name: "sparkles-outline" as const, color: "#8B5CF6", bg: "#EDE9FE" };
      default:
        return { name: "notifications-outline" as const, color: "#6B7280", bg: "#F3F4F6" };
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-5 bg-white border-b border-zinc-100 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.85}
            className="h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm shadow-black/5"
          >
            <Ionicons name="chevron-back" size={18} color="#18181b" />
          </TouchableOpacity>

          <View>
            <Text className="text-2xl font-black text-zinc-950">
              Notifications
            </Text>
            <Text className="mt-0.5 text-xs font-bold uppercase text-zinc-400">
              {unreadCount > 0 ? `${unreadCount} unread updates` : "All caught up"}
            </Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            activeOpacity={0.8}
            className="rounded-full bg-zinc-100 px-3.5 py-2"
          >
            <Text className="text-[10px] font-black uppercase text-zinc-800">
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main List */}
      {isLoading && notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#18181b" />
        </View>
      ) : notifications.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#18181b" />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6 mt-20">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-zinc-100 mb-4">
                <Ionicons name="notifications-off-outline" size={36} color="#9CA3AF" />
              </View>
              <Text className="text-lg font-black text-zinc-950 text-center">
                No notifications yet
              </Text>
              <Text className="mt-2 text-sm font-medium text-zinc-400 text-center">
                We will notify you here when order updates, promotions, and bank offers drop.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#18181b" />
          }
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const icon = getNotificationIcon(item.type);
            return (
              <View className="mb-4">
                <SectionCard>
                  <TouchableOpacity
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.8}
                    className={`flex-row gap-4 px-4 py-4 rounded-[20px] ${
                      !item.readAt ? "bg-zinc-50/70 border border-zinc-200" : "bg-white"
                    }`}
                  >
                    <View
                      style={{ backgroundColor: icon.bg }}
                      className="h-12 w-12 items-center justify-center rounded-2xl"
                    >
                      <Ionicons name={icon.name} size={22} color={icon.color} />
                    </View>

                    <View className="flex-1 justify-between">
                      <View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-black text-zinc-950 flex-1 pr-2">
                            {item.title}
                          </Text>
                          {!item.readAt && (
                            <View className="h-2.5 w-2.5 rounded-full bg-red-500" />
                          )}
                        </View>
                        <Text className="mt-1 text-xs font-semibold leading-5 text-zinc-500">
                          {item.body}
                        </Text>
                      </View>

                      <View className="mt-3 flex-row items-center justify-between">
                        <Text className="text-[10px] font-bold uppercase text-zinc-400">
                          {formatDateTimeWithTime(item.createdAt)}
                        </Text>
                        {item.orderId && (
                          <View className="flex-row items-center gap-1">
                            <Text className="text-[10px] font-black uppercase text-zinc-950">
                              View Order
                            </Text>
                            <Ionicons name="chevron-forward" size={10} color="#18181b" />
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </SectionCard>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
