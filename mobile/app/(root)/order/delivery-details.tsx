import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { ENV } from "@/config/env";
import { SectionCard } from "@/components/profile/SectionCard";
import { formatPrice } from "@/utils/price.utils";
import { formatDateTime } from "@/utils/order.utils";
import Toast from "react-native-toast-message";

const BACKEND_URL = ENV.API_URL;

export default function DeliveryDetailsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // OTP Verification inputs (prepaid only)
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // COD collection checklist
  const [cashCollected, setCashCollected] = useState(false);

  const fetchOrderDetail = useCallback(async (showLoading = true) => {
    if (!id) return;
    if (showLoading) setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${BACKEND_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch order details");
      }

      const data = await res.json();
      setOrder(data);
    } catch (error: any) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load order detail",
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    fetchOrderDetail(true);
  }, [fetchOrderDetail]);

  const handleCallCustomer = () => {
    if (!order?.shippingPhone) return;
    Linking.openURL(`tel:${order.shippingPhone}`).catch((err) => {
      console.error("Failed to open dialer:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not open phone dialer",
      });
    });
  };

  const updateDeliveryStatus = async (targetStatus: string, payload: any = {}) => {
    setActionLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${BACKEND_URL}/api/delivery/orders/${id}/status`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: targetStatus, ...payload }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to update status");
      }

      Toast.show({
        type: "success",
        text1: "Status Updated",
        text2: `Delivery updated to ${targetStatus.replace(/_/g, " ")}`,
      });

      // Reload detail
      await fetchOrderDetail(false);
      setOtp("");
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: err.message || "Could not update delivery status",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setActionLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${BACKEND_URL}/api/delivery/orders/${id}/otp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to send OTP");
      }

      setOtpSent(true);
      Toast.show({
        type: "success",
        text1: "OTP Sent",
        text2: "Verification OTP has been sent to the customer",
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to Send OTP",
        text2: err.message || "Could not generate OTP",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyAndDeliver = () => {
    if (!otp || otp.length !== 6) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter a valid 6-digit OTP code",
      });
      return;
    }
    updateDeliveryStatus("DELIVERED", { otp });
  };

  const handleCODDeliver = () => {
    if (!cashCollected) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please check cash payment collection box first",
      });
      return;
    }
    updateDeliveryStatus("DELIVERED", { paymentCollected: true });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#18181b" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-50 items-center justify-center px-6">
        <Text className="text-lg font-black text-zinc-950">Delivery not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-zinc-950 px-6 py-2.5 rounded-full"
        >
          <Text className="text-white font-bold text-xs uppercase">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const getTimelineSteps = () => {
    const steps = [
      { key: "ASSIGNED", title: "Assigned", timestamp: order.deliveryAssignedAt },
      { key: "ACCEPTED", title: "Accepted", timestamp: order.deliveryAcceptedAt },
      { key: "PICKED_UP", title: "Picked Up", timestamp: order.deliveryPickedUpAt },
      { key: "OUT_FOR_DELIVERY", title: "Out for Delivery", timestamp: order.deliveryOutForDeliveryAt },
      { key: "DELIVERED", title: "Delivered", timestamp: order.deliveryDeliveredAt },
    ];
    return steps;
  };

  const currentStatus = order.deliveryStatus;

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      <View className="px-6 py-5 bg-white border-b border-zinc-100 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.85}
            className="h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white"
          >
            <Ionicons name="chevron-back" size={18} color="#18181b" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-black text-zinc-950">Delivery Details</Text>
            <Text className="text-xs font-bold uppercase text-zinc-400">
              #{order.orderNumber.split("-")[1] || order.orderNumber.slice(-8)}
            </Text>
          </View>
        </View>

        <View className="rounded-full bg-zinc-100 border border-zinc-200 px-3 py-1.5">
          <Text className="text-[10px] font-black uppercase text-zinc-800">
            {order.paymentMethod}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Customer Detail Card */}
        <SectionCard>
          <View className="p-5">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 pr-3">
                <Text className="text-[10px] font-bold text-zinc-400 uppercase">Customer Name</Text>
                <Text className="text-base font-black text-zinc-950 mt-0.5">{order.shippingName}</Text>
              </View>
              <TouchableOpacity
                onPress={handleCallCustomer}
                activeOpacity={0.7}
                className="h-11 w-11 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200"
              >
                <Ionicons name="call" size={18} color="#059669" />
              </TouchableOpacity>
            </View>

            <View className="mb-3">
              <Text className="text-[10px] font-bold text-zinc-400 uppercase">Delivery Address</Text>
              <Text className="text-sm font-semibold text-zinc-800 mt-1 leading-6">
                {order.shippingLine1}
                {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
                {"\n"}{order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
              </Text>
              {order.shippingLandmark ? (
                <Text className="text-xs font-medium text-zinc-400 mt-1">
                  Landmark: {order.shippingLandmark}
                </Text>
              ) : null}
            </View>

            <View className="flex-row justify-between pt-3 border-t border-zinc-100 mt-1">
              <View>
                <Text className="text-[10px] font-bold text-zinc-400 uppercase">Total Amount</Text>
                <Text className="text-lg font-black text-zinc-950 mt-0.5">{formatPrice(order.totalAmount)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] font-bold text-zinc-400 uppercase">Payment Status</Text>
                <Text className="text-sm font-black text-zinc-950 mt-0.5">{order.paymentStatus}</Text>
              </View>
            </View>
          </View>
        </SectionCard>

        {/* Delivery Progress Steps */}
        <View className="my-6">
          <SectionCard>
            <View className="p-5">
              <Text className="text-base font-black text-zinc-950 mb-5">Delivery Tracking</Text>

              {getTimelineSteps().map((step, index) => {
                const isCompleted = !!step.timestamp;
                const isCurrent = currentStatus === step.key;
                const isLast = index === 4;

                return (
                  <View key={step.key} className="flex-row items-stretch">
                    <View className="items-center mr-4">
                      <View
                        className={`h-7 w-7 rounded-full items-center justify-center border-2 ${
                          isCompleted
                            ? "bg-zinc-950 border-zinc-950"
                            : isCurrent
                            ? "bg-white border-zinc-950"
                            : "bg-white border-zinc-200"
                        }`}
                      >
                        {isCompleted ? (
                          <Ionicons name="checkmark" size={14} color="white" />
                        ) : (
                          <View className={`h-2.5 w-2.5 rounded-full ${isCurrent ? "bg-zinc-950" : "bg-zinc-200"}`} />
                        )}
                      </View>
                      {!isLast && (
                        <View
                          className={`w-0.5 flex-1 my-1 ${
                            isCompleted && !!getTimelineSteps()[index + 1].timestamp ? "bg-zinc-950" : "bg-zinc-200"
                          }`}
                          style={{ minHeight: 35 }}
                        />
                      )}
                    </View>

                    <View className="flex-1 pb-6 justify-start">
                      <Text className={`text-sm font-black ${isCompleted || isCurrent ? "text-zinc-950" : "text-zinc-400"}`}>
                        {step.title}
                      </Text>
                      {step.timestamp && (
                        <Text className="mt-1 text-[10px] font-bold uppercase text-zinc-400">
                          {formatDateTime(step.timestamp)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </SectionCard>
        </View>

        {/* Action Panel */}
        <View className="mb-6">
          <SectionCard>
            <View className="p-5">
              <Text className="text-base font-black text-zinc-950 mb-4">Required Action</Text>

              {actionLoading ? (
                <View className="py-4 items-center justify-center">
                  <ActivityIndicator color="#18181b" />
                </View>
              ) : currentStatus === "ASSIGNED" ? (
                <TouchableOpacity
                  onPress={() => updateDeliveryStatus("ACCEPTED")}
                  className="bg-zinc-950 py-4 rounded-3xl items-center"
                >
                  <Text className="text-sm font-black text-white uppercase tracking-wider">Accept Delivery</Text>
                </TouchableOpacity>
              ) : currentStatus === "ACCEPTED" ? (
                <TouchableOpacity
                  onPress={() => updateDeliveryStatus("PICKED_UP")}
                  className="bg-zinc-950 py-4 rounded-3xl items-center"
                >
                  <Text className="text-sm font-black text-white uppercase tracking-wider">Mark Picked Up (Shipped)</Text>
                </TouchableOpacity>
              ) : currentStatus === "PICKED_UP" ? (
                <TouchableOpacity
                  onPress={() => updateDeliveryStatus("OUT_FOR_DELIVERY")}
                  className="bg-zinc-950 py-4 rounded-3xl items-center"
                >
                  <Text className="text-sm font-black text-white uppercase tracking-wider">Mark Out for Delivery</Text>
                </TouchableOpacity>
              ) : currentStatus === "OUT_FOR_DELIVERY" ? (
                order.paymentMethod === "ONLINE" ? (
                  // Prepaid OTP Validation
                  <View className="space-y-4">
                    <Text className="text-xs font-semibold text-zinc-500 leading-5">
                      This is a prepaid (Online Payment) order. Send a secure verification OTP to the customer and enter it below to complete delivery.
                    </Text>

                    {!otpSent ? (
                      <TouchableOpacity
                        onPress={handleSendOTP}
                        className="bg-zinc-950 py-3.5 rounded-2xl items-center"
                      >
                        <Text className="text-xs font-black text-white uppercase">Send OTP to Customer</Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="gap-3">
                        <TextInput
                          placeholder="Enter 6-digit OTP code"
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="number-pad"
                          maxLength={6}
                          className="bg-zinc-100 border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-center tracking-[4px]"
                        />
                        <TouchableOpacity
                          onPress={handleVerifyAndDeliver}
                          className="bg-zinc-950 py-3.5 rounded-2xl items-center mt-2"
                        >
                          <Text className="text-xs font-black text-white uppercase">Verify & Complete Delivery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleSendOTP}
                          className="border border-zinc-200 py-3 rounded-2xl items-center mt-1"
                        >
                          <Text className="text-xs font-bold text-zinc-500 uppercase">Resend OTP</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : (
                  // COD Cash Collection
                  <View className="space-y-4">
                    <Text className="text-xs font-semibold text-zinc-500 leading-5">
                      This is a Cash on Delivery (COD) order. You must collect payment before handing over items.
                    </Text>

                    <TouchableOpacity
                      onPress={() => setCashCollected(!cashCollected)}
                      activeOpacity={0.8}
                      className={`flex-row items-center p-4 border rounded-2xl ${
                        cashCollected ? "bg-emerald-50 border-emerald-200" : "bg-zinc-50 border-zinc-200"
                      }`}
                    >
                      <Ionicons
                        name={cashCollected ? "checkbox" : "square-outline"}
                        size={20}
                        color={cashCollected ? "#059669" : "#a1a1aa"}
                      />
                      <View className="ml-3 flex-1">
                        <Text className={`text-xs font-black ${cashCollected ? "text-emerald-800" : "text-zinc-800"}`}>
                          Cash payment collected
                        </Text>
                        <Text className="text-[10px] text-zinc-400 mt-0.5">
                          Collected amount: {formatPrice(order.totalAmount)}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleCODDeliver}
                      disabled={!cashCollected}
                      className={`py-4 rounded-3xl items-center ${cashCollected ? "bg-zinc-950" : "bg-zinc-200"}`}
                    >
                      <Text className={`text-sm font-black uppercase tracking-wider ${cashCollected ? "text-white" : "text-zinc-400"}`}>
                        Complete Delivery
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                <View className="flex-row items-center justify-center gap-2 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                  <Text className="text-xs font-black text-emerald-800 uppercase tracking-wide">
                    Delivery Completed
                  </Text>
                </View>
              )}
            </View>
          </SectionCard>
        </View>

        {/* Order Items */}
        <View className="mb-4">
          <Text className="text-xs font-black uppercase text-zinc-400 mb-3 px-1">Order Items</Text>
          {order.items?.map((item: any) => (
            <View key={item.id} className="mb-4">
              <SectionCard>
                <View className="flex-row gap-4 p-4">
                  <Image source={{ uri: item.productImageUrl }} className="h-20 w-20 rounded-2xl bg-zinc-100" />
                  <View className="flex-1 justify-between py-1">
                    <View>
                      <Text className="text-[9px] font-bold text-zinc-400 uppercase">{item.productBrand}</Text>
                      <Text className="text-sm font-black text-zinc-950 mt-0.5">{item.productName}</Text>
                      <Text className="text-[10px] text-zinc-500 mt-1 font-semibold">
                        Size: {item.size} · Color: {item.color}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-end">
                      <Text className="text-[10px] text-zinc-400 font-bold uppercase">Qty: {item.quantity}</Text>
                      <Text className="text-sm font-black text-zinc-950">{formatPrice(item.totalPrice)}</Text>
                    </View>
                  </View>
                </View>
              </SectionCard>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
