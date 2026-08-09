import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  RefreshControl,
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
import Toast from "react-native-toast-message";

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();

  const selectedOrder = useOrderStore((state) => state.selectedOrder);
  const isDetailLoading = useOrderStore((state) => state.isDetailLoading);
  const fetchOrderById = useOrderStore((state) => state.fetchOrderById);
  const cancelOrder = useOrderStore((state) => state.cancelOrder);

  // Cancellation Modal States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const cancellationReasons = [
    "Changed my mind",
    "Found a better price elsewhere",
    "Incorrect size or color selected",
    "Delivery time is too long",
    "Other (Please specify)",
  ];

  const handleRefresh = async () => {
    if (!params.id) return;
    setRefreshing(true);
    try {
      const token = await getToken();
      if (token) {
        await fetchOrderById(token, params.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!params.id) return;

      const token = await getToken();
      if (!token) return;

      await fetchOrderById(token, params.id);
    };

    load().catch(() => undefined);
  }, [params.id]);

  const order = selectedOrder;

  const handleCancelOrder = async () => {
    const reasonText = selectedReason === "Other (Please specify)" ? customReason : selectedReason;
    if (!reasonText.trim()) {
      Toast.show({
        type: "error",
        text1: "Reason Required",
        text2: "Please select or type a cancellation reason.",
      });
      return;
    }

    setCancelling(true);
    try {
      const token = await getToken();
      if (!token) return;

      await cancelOrder(token, order!.id, reasonText);

      Toast.show({
        type: "success",
        text1: "Order Cancelled",
        text2: "Your order has been cancelled successfully.",
      });
      setShowCancelModal(false);
      setSelectedReason("");
      setCustomReason("");
      await fetchOrderById(token, order!.id);
    } catch (err: any) {
      console.error(err);
      Toast.show({
        type: "error",
        text1: "Failed to Cancel",
        text2: err.message || "Something went wrong.",
      });
    } finally {
      setCancelling(false);
    }
  };

  const getTimelineSteps = () => {
    if (!order) return [];

    const isCancelled = order.status === "CANCELLED";
    const events = order.events || [];

    const findEvent = (status: string) => {
      return events.find((e) => e.status === status);
    };

    const steps = [
      {
        key: "PENDING",
        title: "Order Placed",
        description: "Your order has been received",
        event: findEvent("PENDING"),
      },
      {
        key: "CONFIRMED",
        title: "Confirmed",
        description: "Seller has confirmed your order",
        event: findEvent("CONFIRMED"),
      },
      {
        key: "PACKED",
        title: "Packed",
        description: "Items have been packed and inspected",
        event: findEvent("PACKED") || findEvent("PROCESSING"),
      },
      {
        key: "SHIPPED",
        title: "Shipped",
        description: "Order is in transit to the delivery hub",
        event: findEvent("SHIPPED"),
      },
      {
        key: "OUT_FOR_DELIVERY",
        title: "Out for Delivery",
        description: "Delivery agent is on their way",
        event: findEvent("OUT_FOR_DELIVERY"),
      },
    ];

    if (isCancelled) {
      steps.push({
        key: "CANCELLED",
        title: "Cancelled",
        description: order.cancelReason || "Order was cancelled",
        event: findEvent("CANCELLED"),
      });
    } else {
      steps.push({
        key: "DELIVERED",
        title: "Delivered",
        description: "Order has been delivered successfully",
        event: findEvent("DELIVERED"),
      });
    }

    return steps;
  };

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#18181b"
            colors={["#18181b"]}
          />
        }
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

            {/* Tracking Timeline */}
            <View className="mt-6">
              <SectionCard>
                <View className="px-5 py-5">
                  <Text className="text-lg font-black text-zinc-950 mb-5">
                    Order Tracking
                  </Text>

                  {getTimelineSteps().map((step, idx, arr) => {
                    const isCompleted = !!step.event;
                    const isLast = idx === arr.length - 1;
                    const isLineCompleted = isCompleted && idx < arr.length - 1 && !!arr[idx + 1].event;

                    return (
                      <View key={step.key} className="flex-row items-stretch">
                        {/* Circle Graphic Column */}
                        <View className="items-center mr-4">
                          <View
                            className={`h-7 w-7 rounded-full items-center justify-center border-2 ${
                              isCompleted
                                ? step.key === "CANCELLED"
                                  ? "bg-red-500 border-red-500"
                                  : "bg-zinc-950 border-zinc-950"
                                : "bg-white border-zinc-200"
                            }`}
                          >
                            {isCompleted ? (
                              <Ionicons
                                name={step.key === "CANCELLED" ? "close" : "checkmark"}
                                size={14}
                                color="white"
                              />
                            ) : (
                              <View className="h-2 w-2 rounded-full bg-zinc-200" />
                            )}
                          </View>
                          {!isLast && (
                            <View
                              className={`w-0.5 flex-1 my-1 ${
                                isLineCompleted ? "bg-zinc-950" : "bg-zinc-200"
                              }`}
                              style={{ minHeight: 32 }}
                            />
                          )}
                        </View>

                        {/* Event details column */}
                        <View className="flex-1 pb-6 justify-start">
                          <Text
                            className={`text-sm font-black ${
                              isCompleted ? "text-zinc-950" : "text-zinc-400"
                            }`}
                          >
                            {step.title}
                          </Text>
                          <Text
                            className={`text-xs mt-0.5 font-medium leading-5 ${
                              isCompleted ? "text-zinc-500" : "text-zinc-400/80"
                            }`}
                          >
                            {step.event?.description || step.description}
                          </Text>
                          {isCompleted && step.event && (
                            <Text className="mt-1.5 text-[10px] font-bold uppercase text-zinc-400">
                              {formatDateTimeWithTime(step.event.createdAt)}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </SectionCard>
            </View>

            {/* Delivery Agent Details */}
            {/* {order.deliveryAgent && (
              <View className="mt-6">
                <SectionCard>
                  <View className="px-5 py-5">
                    <Text className="text-lg font-black text-zinc-950 mb-4">
                      Delivery Information
                    </Text>

                    <View className="flex-row items-center gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      {order.deliveryAgent.imageUrl ? (
                        <Image
                          source={{ uri: order.deliveryAgent.imageUrl }}
                          className="h-12 w-12 rounded-full"
                        />
                      ) : (
                        <View className="h-12 w-12 rounded-full bg-zinc-200 items-center justify-center">
                          <Ionicons name="person" size={20} color="#71717a" />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-sm font-black text-zinc-950">
                          {order.deliveryAgent.firstName} {order.deliveryAgent.lastName}
                        </Text>
                        <Text className="text-xs text-zinc-500 mt-0.5">
                          {order.deliveryAgent.email}
                        </Text>
                      </View>
                      <View className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-1">
                        <Text className="text-[9px] font-black uppercase text-zinc-800 tracking-wide">
                          {(order.deliveryStatus || "Assigned").replace(/_/g, " ")}
                        </Text>
                      </View>
                    </View>
                  </View>
                </SectionCard>
              </View>
            )} */}

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

          {/* Cancellation Button */}
          {["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status) && (
            <View className="mt-6">
              <TouchableOpacity
                onPress={() => setShowCancelModal(true)}
                activeOpacity={0.8}
                className="w-full bg-red-50 border border-red-100 rounded-3xl py-4 items-center justify-center"
              >
                <Text className="text-sm font-black uppercase text-red-600">
                  Cancel Order
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Cancellation Reason Selection Modal */}
      <Modal
        visible={showCancelModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[40px] px-6 pt-8 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black text-zinc-950">
                Cancel Order
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCancelModal(false);
                  setSelectedReason("");
                  setCustomReason("");
                }}
                className="h-8 w-8 items-center justify-center rounded-full bg-zinc-100"
              >
                <Ionicons name="close" size={16} color="#18181b" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm font-semibold text-zinc-500 mb-6 leading-6">
              We&apos;re sorry to see you cancel. Please help us improve by selecting a reason:
            </Text>

            {cancellationReasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => setSelectedReason(reason)}
                activeOpacity={0.8}
                className={`flex-row items-center justify-between p-4 rounded-2xl mb-3 border ${
                  selectedReason === reason
                    ? "bg-zinc-950 border-zinc-950"
                    : "bg-zinc-50 border-zinc-100"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    selectedReason === reason ? "text-white" : "text-zinc-800"
                  }`}
                >
                  {reason}
                </Text>
                {selectedReason === reason && (
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                )}
              </TouchableOpacity>
            ))}

            {selectedReason === "Other (Please specify)" && (
              <TextInput
                value={customReason}
                onChangeText={setCustomReason}
                placeholder="Please write your reason here..."
                placeholderTextColor="#A1A1AA"
                multiline
                numberOfLines={3}
                className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-semibold text-zinc-900 mt-2 mb-4 h-20 text-start"
                style={{ textAlignVertical: "top" }}
              />
            )}

            <TouchableOpacity
              onPress={handleCancelOrder}
              disabled={cancelling}
              activeOpacity={0.85}
              className="mt-4 w-full bg-red-600 rounded-3xl py-4 items-center justify-center shadow-lg shadow-red-500/25"
            >
              {cancelling ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-sm font-black uppercase text-white tracking-[1px]">
                  Confirm Cancellation
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
