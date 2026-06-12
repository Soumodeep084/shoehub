import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SectionCard } from "@/components/profile/SectionCard";
import { useOrderStore } from "@/store/orderStore";
import { formatPrice } from "@/utils/price.utils";
import {
  formatDateTimeWithTime,
  formatOrderStatus,
  getStatusTone,
} from "@/utils/order.utils";

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();

  const selectedOrder = useOrderStore((state) => state.selectedOrder);
  const isDetailLoading = useOrderStore((state) => state.isDetailLoading);
  const fetchOrderById = useOrderStore((state) => state.fetchOrderById);

  useEffect(() => {
    const load = async () => {
      if (!params.id) return;

      const token = await getToken();
      if (!token) return;

      if (selectedOrder?.id === params.id) return;

      await fetchOrderById(token, params.id);
    };

    load().catch(() => undefined);
  }, [fetchOrderById, getToken, params.id, selectedOrder?.id]);

  const order = selectedOrder;

  if (isDetailLoading && !order) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#18181b" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-50 items-center justify-center px-6">
        <Text className="text-xl font-black text-zinc-950">
          Order not found
        </Text>
        <Text className="mt-2 text-sm font-medium text-zinc-400 text-center">
          We couldn&apos;t load that order right now.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 py-5 bg-white border-b border-zinc-100 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.replace("/order/orders")}
              activeOpacity={0.85}
              className="h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm shadow-black/5"
            >
              <Ionicons name="chevron-back" size={18} color="#18181b" />
            </TouchableOpacity>

            <View>
              <Text className="text-2xl font-black  text-zinc-950">
                Order Details
              </Text>
              <Text className="mt-0.5 text-xs font-bold uppercase text-zinc-400">
                {order.orderNumber}
              </Text>
            </View>
          </View>

          <View
            className={`rounded-full border px-3 py-1.5 ${getStatusTone(order.status)}`}
          >
            <Text className="text-[10px] font-black uppercase ">
              {formatOrderStatus(order.status)}
            </Text>
          </View>
        </View>

        <View className="px-6 pt-6">
          <SectionCard>
            <View className="px-5 py-5">
              <Text className="text-[10px] font-bold uppercase  text-zinc-400">
                Ordered on
              </Text>
              <Text className="mt-1 text-base font-bold text-zinc-950">
                {formatDateTimeWithTime(order.createdAt)}
              </Text>

              <View className="mt-5 flex-row gap-3">
                <View className="flex-1 rounded-2xl bg-zinc-50 px-4 py-4">
                  <Text className="text-[10px] font-bold uppercase  text-zinc-400">
                    Payment
                  </Text>
                  <Text className="mt-1 text-sm font-black text-zinc-950">
                    {order.paymentStatus}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl bg-zinc-50 px-4 py-4">
                  <Text className="text-[10px] font-bold uppercase  text-zinc-400">
                    Total
                  </Text>
                  <Text className="mt-1 text-sm font-black text-zinc-950">
                    {formatPrice(order.totalAmount)}
                  </Text>
                </View>
              </View>
            </View>
          </SectionCard>

          <View className="mt-6">
            <SectionCard>
              <View className="px-5 py-5">
                <Text className="text-lg font-black  text-zinc-950">
                  Shipping Address
                </Text>
                <Text className="mt-3 text-sm font-bold text-zinc-950">
                  {order.shippingName}
                </Text>
                <Text className="mt-1 text-sm font-medium leading-6 text-zinc-500">
                  {order.shippingLine1}
                  {order.shippingLine2 ? `, ${order.shippingLine2}` : ""},{" "}
                  {order.shippingCity}, {order.shippingState}{" "}
                  {order.shippingPostalCode}
                </Text>
                <Text className="mt-1 text-xs font-bold uppercase  text-zinc-400">
                  {order.shippingPhone} · {order.shippingCountry}
                </Text>
                {order.shippingLandmark ? (
                  <Text className="mt-1 text-xs font-medium text-zinc-400">
                    Landmark: {order.shippingLandmark}
                  </Text>
                ) : null}
              </View>
            </SectionCard>
          </View>

          <View className="mt-6">
            <Text className="mb-3 px-1 text-xs font-black uppercase  text-zinc-400">
              Items
            </Text>
            {order.items.map((item) => (
              <View key={item.id} className="mb-4">
                <SectionCard>
                  <View className="flex-row gap-4 px-4 py-4">
                    <Image
                      source={{ uri: item.productImageUrl }}
                      className="h-24 w-24 rounded-[20px] bg-zinc-100"
                    />

                    <View className="flex-1 justify-between">
                      <View>
                        <Text className="text-[10px] font-bold uppercase  text-zinc-400">
                          {item.productBrand}
                        </Text>
                        <Text className="mt-1 text-base font-black  text-zinc-950">
                          {item.productName}
                        </Text>
                        <View className="mt-2 flex-row flex-wrap gap-2">
                          <View className="rounded-full bg-zinc-50 px-2.5 py-1">
                            <Text className="text-[10px] font-bold uppercase  text-zinc-500">
                              Size {item.size}
                            </Text>
                          </View>
                          <View className="rounded-full bg-zinc-50 px-2.5 py-1">
                            <Text className="text-[10px] font-bold uppercase  text-zinc-500">
                              {item.color}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="mt-3 flex-row items-end justify-between">
                        <View>
                          <Text className="text-xs font-bold uppercase  text-zinc-400">
                            Qty {item.quantity}
                          </Text>
                        </View>
                        <Text className="text-lg font-black  text-zinc-950">
                          {formatPrice(item.totalPrice)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </SectionCard>
              </View>
            ))}
          </View>

          <View className="mt-2">
            <SectionCard>
              <View className="px-5 py-5">
                <Text className="text-lg font-black  text-zinc-950">
                  Summary
                </Text>

                <View className="mt-4 gap-3">
                  <View className="flex-row justify-between">
                    <Text className="text-sm font-medium text-zinc-500">
                      Subtotal
                    </Text>
                    <Text className="text-sm font-bold text-zinc-950">
                      {formatPrice(order.subtotal)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm font-medium text-zinc-500">
                      Shipping
                    </Text>
                    <Text className="text-sm font-bold text-zinc-950">
                      {formatPrice(order.shippingFee)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm font-medium text-zinc-500">
                      Discount
                    </Text>
                    <Text className="text-sm font-bold text-emerald-600">
                      -{formatPrice(order.discountAmount)}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 h-px bg-zinc-100" />

                <View className="mt-4 flex-row justify-between">
                  <Text className="text-base font-black text-zinc-950">
                    Total
                  </Text>
                  <Text className="text-2xl font-black  text-zinc-950">
                    {formatPrice(order.totalAmount)}
                  </Text>
                </View>
              </View>
            </SectionCard>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
