import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/components/profile/EmptyState";
import { SectionCard } from "@/components/profile/SectionCard";
import { useOrderStore } from "@/store/orderStore";
import { formatPrice } from "@/utils/price.utils";
import {
  formatDateTime,
  formatOrderStatus,
  getStatusTone,
} from "@/utils/order.utils";

export default function OrdersScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const orders = useOrderStore((state) => state.orders);
  const isLoading = useOrderStore((state) => state.isLoading);
  const fetchOrders = useOrderStore((state) => state.fetchOrders);

  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    await fetchOrders(token);
  }, [fetchOrders, getToken]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const renderItem = ({ item }: any) => (
    <View className="mb-4">
      <SectionCard>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/order/order-details",
              params: { id: item.id },
            } as any)
          }
          activeOpacity={0.88}
          className="px-5 py-5"
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[10px] font-bold uppercase  text-zinc-400">
                Order ID: {item.orderNumber.split("-")[1]} - {item.orderNumber.split("-")[2]}
              </Text>
              <Text className="mt-1 text-xl font-black  text-zinc-950">
                {formatPrice(item.totalAmount)}
              </Text>
              <Text className="mt-1 text-sm font-medium text-zinc-400">
                {item.items?.length || 0} item
                {(item.items?.length || 0) !== 1 ? "s" : ""} ·{" "}
                {formatDateTime(item.createdAt)}
              </Text>
            </View>

            <View
              className={`rounded-full border px-3 py-1.5 ${getStatusTone(item.status)}`}
            >
              <Text className="text-[10px] font-black uppercase ">
                {formatOrderStatus(item.status)}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {item.items?.slice(0, 3).map((entry: any) => (
                <Image
                  key={entry.id}
                  source={{ uri: entry.productImageUrl }}
                  className="h-10 w-10 rounded-xl bg-zinc-100"
                />
              ))}
            </View>

            <View className="flex-row items-center gap-1">
              <Text className="text-xs font-bold uppercase  text-zinc-400">
                View details
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#a1a1aa" />
            </View>
          </View>
        </TouchableOpacity>
      </SectionCard>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      <View className="px-6 py-5 bg-white border-b border-zinc-100">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            // onPress={() => router.replace("/(root)/(tabs)/profile")}
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white"
          >
            <Ionicons name="arrow-back" size={18} color="#18181b" />
          </TouchableOpacity>

          <View>
            <Text className="text-2xl font-black  text-zinc-950">
              Order History
            </Text>
            <Text className="mt-0.5 text-xs font-bold uppercase text-zinc-400">
              Past purchases and shipment updates
            </Text>
          </View>
        </View>
      </View>

      {isLoading && !refreshing && orders.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#18181b" />
        </View>
      ) : null}

      {!isLoading && orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Once you place your first order, it will appear here with tracking and item details."
          icon="bag-outline"
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#18181b"
              colors={["#18181b"]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
