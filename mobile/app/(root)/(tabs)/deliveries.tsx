import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { ENV } from "@/config/env";
import { SectionCard } from "@/components/profile/SectionCard";
import { formatPrice } from "@/utils/price.utils";
import { formatDateTime } from "@/utils/order.utils";
import Toast from "react-native-toast-message";

const BACKEND_URL = ENV.API_URL;

export default function DeliveriesTabScreen() {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();

  const [activeTab, setActiveTab] = useState<"assigned" | "active" | "completed">("assigned");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Keep unstable getToken in ref to avoid triggering effect restarts
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const fetchDeliveries = useCallback(async (showLoading = true) => {
    if (!isSignedIn) return;
    if (showLoading) setIsLoading(true);

    try {
      const token = await getTokenRef.current();
      if (!token) return;

      const res = await fetch(`${BACKEND_URL}/api/delivery/orders?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch deliveries");
      }

      const data = await res.json();
      setOrders(data);
    } catch (error: any) {
      console.error("Fetch deliveries error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Could not load deliveries",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, activeTab]);

  // Load when activeTab changes or when screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchDeliveries(true);
    }, [fetchDeliveries])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveries(false);
    setRefreshing(false);
  };

  const handleCallCustomer = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch((err) => {
      console.error("Failed to open dialer:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not open dialer",
      });
    });
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      setIsLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/delivery/orders/${orderId}/status`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to accept delivery");
      }

      Toast.show({
        type: "success",
        text1: "Delivery Accepted",
        text2: "You have accepted this delivery task",
      });

      // Switch to active tab to show progress
      setActiveTab("active");
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to Accept",
        text2: err.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDeliveryBadgeClass = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-50 border-blue-100 text-blue-600";
      case "ACCEPTED":
        return "bg-sky-50 border-sky-100 text-sky-600";
      case "PICKED_UP":
        return "bg-indigo-50 border-indigo-100 text-indigo-600";
      case "OUT_FOR_DELIVERY":
        return "bg-purple-50 border-purple-100 text-purple-600";
      case "DELIVERED":
        return "bg-emerald-50 border-emerald-100 text-emerald-600";
      default:
        return "bg-zinc-50 border-zinc-100 text-zinc-600";
    }
  };

  const getFriendlyStatus = (status: string) => {
    if (!status) return "Assigned";
    return status.replace(/_/g, " ");
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="mb-4">
      <SectionCard>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/order/delivery-details",
              params: { id: item.id },
            } as any)
          }
          activeOpacity={0.88}
          className="px-5 py-5"
        >
          <View className="flex-row items-center justify-between border-b border-zinc-100 pb-3 mb-3">
            <View>
              <Text className="text-[10px] font-bold uppercase text-zinc-400">
                Order: #{item.orderNumber.split("-")[1] || item.orderNumber.slice(-8)}
              </Text>
              <Text className="text-[10px] font-semibold text-zinc-400 mt-0.5">
                Assigned: {formatDateTime(item.deliveryAssignedAt || item.createdAt)}
              </Text>
            </View>

            <View className={`rounded-full border px-2.5 py-1 ${getDeliveryBadgeClass(item.deliveryStatus)}`}>
              <Text className="text-[9px] font-black uppercase tracking-wide">
                {getFriendlyStatus(item.deliveryStatus)}
              </Text>
            </View>
          </View>

          {/* Customer Details */}
          <View className="mb-3">
            <Text className="text-xs font-bold uppercase text-zinc-400">
              Customer Info
            </Text>
            <Text className="mt-1 text-sm font-black text-zinc-950">
              {item.shippingName}
            </Text>
            <Text className="text-xs text-zinc-500 mt-1 leading-5">
              {item.shippingLine1}, {item.shippingCity}, {item.shippingState} {item.shippingPostalCode}
            </Text>
          </View>

          <View className="flex-row items-center justify-between pt-3 border-t border-zinc-100 mt-1">
            <View>
              <Text className="text-[10px] font-bold text-zinc-400 uppercase">
                Payment ({item.paymentMethod})
              </Text>
              <Text className="text-base font-black text-zinc-950 mt-0.5">
                {formatPrice(item.totalAmount)}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              {/* <TouchableOpacity
                onPress={() => handleCallCustomer(item.shippingPhone)}
                activeOpacity={0.7}
                className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200"
              >
                <Ionicons name="call" size={16} color="#18181b" />
              </TouchableOpacity> */}

              {activeTab === "assigned" ? (
                <TouchableOpacity
                  onPress={() => handleAcceptOrder(item.id)}
                  activeOpacity={0.8}
                  className="bg-zinc-950 px-4 py-2.5 rounded-full"
                >
                  <Text className="text-xs font-bold text-white uppercase">
                    Accept
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/order/delivery-details",
                      params: { id: item.id },
                    } as any)
                  }
                  activeOpacity={0.8}
                  className="bg-zinc-950 px-4 py-2.5 rounded-full flex-row items-center gap-1.5"
                >
                  <Text className="text-xs font-bold text-white uppercase">
                    Details
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </SectionCard>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      <View className="px-6 py-5 bg-white border-b border-zinc-100">
        <Text className="text-2xl font-black text-zinc-950">Deliveries</Text>
        <Text className="mt-0.5 text-xs font-bold uppercase text-zinc-400">
          Manage assigned shipments and tracking
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-zinc-100 px-5 py-3">
        <TouchableOpacity
          onPress={() => setActiveTab("assigned")}
          activeOpacity={0.8}
          className={`flex-1 items-center py-2.5 rounded-2xl ${activeTab === "assigned" ? "bg-zinc-950" : "bg-transparent"
            }`}
        >
          <Text
            className={`text-xs font-black uppercase tracking-wide ${activeTab === "assigned" ? "text-white" : "text-zinc-400"
              }`}
          >
            Assigned
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("active")}
          activeOpacity={0.8}
          className={`flex-1 items-center py-2.5 rounded-2xl ${activeTab === "active" ? "bg-zinc-950" : "bg-transparent"
            }`}
        >
          <Text
            className={`text-xs font-black uppercase tracking-wide ${activeTab === "active" ? "text-white" : "text-zinc-400"
              }`}
          >
            Active{' '}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("completed")}
          activeOpacity={0.8}
          className={`flex-1 items-center py-2.5 rounded-2xl ${activeTab === "completed" ? "bg-zinc-950" : "bg-transparent"
            }`}
        >
          <Text
            className={`text-xs font-black uppercase tracking-wide ${activeTab === "completed" ? "text-white" : "text-zinc-400"
              }`}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing && orders.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#18181b" />
        </View>
      ) : null}

      {!isLoading && orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6 text-center">
          <Ionicons name="cube-outline" size={48} color="#a1a1aa" />
          <Text className="text-lg font-black text-zinc-950 mt-4">
            No deliveries found
          </Text>
          <Text className="text-xs text-zinc-400 text-center font-medium mt-1">
            {activeTab === "assigned"
              ? "You do not have any new delivery requests at this moment."
              : activeTab === "active"
                ? "No active delivery runs in progress. Check assigned deliveries."
                : "Completed delivery records will appear here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#18181b"
              colors={["#18181b"]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
