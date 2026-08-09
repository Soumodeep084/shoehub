import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function SuccessScreen() {
  const router = useRouter();

  const { orderId, method } = useLocalSearchParams<{
    orderId: string;
    method: "ONLINE" | "COD";
  }>();

  const isCod = method === "COD";

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );
    return () => subscription.remove();
  }, []);

  const shortOrderId = orderId?.slice(-12).toUpperCase() || "N/A";

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-10 pb-8 justify-between">
          {/* MAIN STATUS IDENTITY HERO */}
          <View className="items-center">
            {/* ULTRA-PREMIUM GRADIENT RING EFFECT */}
            <View className="mt-4 shadow-xl shadow-emerald-500">
              <View className="w-32 h-32 rounded-full items-center justify-center border border-emerald-500">
                <View className="w-24 h-24 rounded-full items-center justify-center border border-emerald-500">
                  <View className="w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-emerald-500">
                    <Ionicons
                      name={isCod ? "bag-check" : "checkmark-sharp"}
                      size={32}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* HEADER TEXTS */}
            <Text className="text-3xl font-black text-zinc-950 mt-8 tracking-tight text-center">
              {isCod ? "Order Placed!" : "Payment Received"}
            </Text>

            <Text className="text-zinc-500 text-center text-[14px] font-medium mt-3 leading-6 px-4">
              {isCod
                ? "Your order has been logged into our systems. Please prepare your cash reserve for transit arrival execution."
                : "Your transaction was successfully validated via secure pipelines. Production processing has initiated."}
            </Text>

            {/* SUMMARY TICKET CARD */}
            <View className="w-full bg-white rounded-3xl border border-zinc-200/60 mt-8 p-6 shadow-sm shadow-zinc-100">
              {/* ORDER ID FIELD */}
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-zinc-400">
                    Order Reference
                  </Text>
                  <Text className="text-base font-extrabold text-zinc-900 mt-1">
                    #{shortOrderId}
                  </Text>
                </View>

                {/* STATUS CHIP INDICATOR */}
                <View
                  className={`px-3 py-1 rounded-full ${isCod ? "bg-amber-50 border border-amber-200/50" : "bg-emerald-50 border border-emerald-200/50"}`}
                >
                  <Text
                    className={`text-[10px] font-extrabold uppercase tracking-wide ${isCod ? "text-amber-700" : "text-emerald-700"}`}
                  >
                    {isCod ? "COD Status" : "Verified Paid"}
                  </Text>
                </View>
              </View>

              <View className="h-px bg-zinc-100 my-4" />

              {/* DETAILS METRICS ROW */}
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Payment Method
                </Text>
                <Text className="text-sm font-bold text-zinc-800">
                  {isCod ? "Cash On Delivery" : "Digital Wallet / Card"}
                </Text>
              </View>
            </View>

            {/* TIMELINE EXECUTION TRACKER */}
            <View className="w-full bg-zinc-950 rounded-3xl p-6 mt-4 shadow-xl shadow-zinc-950/20">
              <Text className="text-white font-extrabold text-base mb-6 tracking-tight">
                Fulfillment Timeline
              </Text>

              <View className="space-y-0">
                {/* STEP 1: COMPLETED */}
                <View className="flex-row items-start relative pb-6">
                  <View className="absolute left-[15px] top-8 bottom-0 w-px bg-zinc-800" />
                  <View className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center z-10 shadow-md shadow-emerald-500/20">
                    <Ionicons name="checkmark-sharp" size={16} color="#fff" />
                  </View>
                  <View className="ml-4 flex-1 justify-center">
                    <Text className="text-white font-bold text-sm">
                      Order Confirmed
                    </Text>
                    <Text className="text-zinc-400 text-xs mt-0.5">
                      We&apos;ve securely received your request parameters.
                    </Text>
                  </View>
                </View>

                {/* STEP 2: ACTIVE/PENDING */}
                <View className="flex-row items-start relative pb-6">
                  <View className="absolute left-[15px] top-8 bottom-0 w-px bg-zinc-800" />
                  <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center z-10 border border-zinc-700">
                    <Ionicons name="cube-outline" size={14} color="#a1a1aa" />
                  </View>
                  <View className="ml-4 flex-1 justify-center">
                    <Text className="text-zinc-300 font-semibold text-sm">
                      Inventory Processing
                    </Text>
                    <Text className="text-zinc-500 text-xs mt-0.5">
                      Allocation and packing setup operations are underway.
                    </Text>
                  </View>
                </View>

                {/* STEP 3: FUTURE */}
                <View className="flex-row items-start relative pb-6">
                  <View className="absolute left-[15px] top-8 bottom-0 w-px bg-zinc-800" />
                  <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center z-10 border border-zinc-700">
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#a1a1aa"
                    />
                  </View>
                  <View className="ml-4 flex-1 justify-center">
                    <Text className="text-zinc-400 font-medium text-sm">
                      In Transit Delivery
                    </Text>
                    <Text className="text-zinc-600 text-xs mt-0.5">
                      Live shipping confirmation parameters will sync shortly.
                    </Text>
                  </View>
                </View>

                {/* STEP 4: FINAL */}
                <View className="flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center z-10 border border-zinc-700">
                    <Ionicons name="gift-outline" size={14} color="#a1a1aa" />
                  </View>
                  <View className="ml-4 flex-1 justify-center">
                    <Text className="text-zinc-400 font-medium text-sm">
                      Final Handoff
                    </Text>
                    <Text className="text-zinc-600 text-xs mt-0.5">
                      Package collection and verification complete.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ACTION NAVIGATION CONTROLS */}
          <View className="mt-8">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.replace("/order/orders")}
              className="h-14 bg-zinc-950 rounded-2xl items-center justify-center flex-row shadow-lg shadow-zinc-950/20 active:bg-zinc-900"
            >
              <Ionicons name="speedometer-outline" size={18} color="#fff" />
              <Text className="text-white font-bold text-sm ml-2 tracking-tight">
                Track Live Order
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.replace("/(root)/(tabs)")}
              className="h-14 bg-transparent border border-zinc-200 rounded-2xl items-center justify-center mt-3 active:bg-zinc-100"
            >
              <Text className="text-zinc-800 font-bold text-sm tracking-tight">
                Return to Hub
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
