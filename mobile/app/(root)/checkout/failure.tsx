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

export default function FailureScreen() {
  const router = useRouter();

  // Capture context properties passed over from your failed payment layout loop
  const { orderId, message } = useLocalSearchParams<{
    orderId: string;
    message?: string;
  }>();

  useEffect(() => {
    // Intercept physical Android back button presses to keep navigation controlled
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );
    return () => subscription.remove();
  }, []);

  const shortOrderId = orderId?.slice(-12).toUpperCase() || "N/A";
  const errorReason =
    message || "The transaction was declined by the issuing banking authority.";

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-10 pb-8 justify-between">
          {/* MAIN BREAKDOWN IDENTITY HERO */}
          <View className="items-center">
            {/* ULTRA-PREMIUM CRISIS SHADOW RINGS */}
            <View className="mt-4 shadow-xl shadow-rose-500/10">
              <View className="w-32 h-32 rounded-full bg-rose-500/10 items-center justify-center border border-rose-500/20">
                <View className="w-24 h-24 rounded-full bg-rose-500/20 items-center justify-center border border-rose-500/30">
                  <View className="w-16 h-16 rounded-full bg-rose-500 items-center justify-center shadow-lg shadow-rose-500/40">
                    <Ionicons name="close-sharp" size={32} color="#fff" />
                  </View>
                </View>
              </View>
            </View>

            {/* HEADER TEXTS */}
            <Text className="text-3xl font-black text-zinc-950 mt-8 tracking-tight text-center">
              Transaction Failed
            </Text>

            <Text className="text-zinc-500 text-center text-[14px] font-medium mt-3 leading-6 px-4">
              Your security pipeline remains fully protected. The payment
              processing request could not be finalized securely.
            </Text>

            {/* ERROR SUMMARY METRIC TICKET */}
            <View className="w-full bg-white rounded-3xl border border-zinc-200/60 mt-8 p-6 shadow-sm shadow-zinc-100">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-zinc-400">
                    Order Reference
                  </Text>
                  <Text className="text-base font-extrabold text-zinc-900 mt-1">
                    #{shortOrderId}
                  </Text>
                </View>

                {/* FAILURE BADGE INDICATOR */}
                <View className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200/50">
                  <Text className="text-[10px] font-extrabold uppercase tracking-wide text-rose-700">
                    Unpaid
                  </Text>
                </View>
              </View>

              <View className="h-px bg-zinc-100 my-4" />

              {/* DYNAMIC ERROR TEXT RETURN PANEL */}
              <View>
                <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Reason for Failure
                </Text>
                <Text className="text-[13px] font-medium text-zinc-700 leading-5">
                  {errorReason}
                </Text>
              </View>
            </View>

            {/* RESOLUTION ASSISTANCE PANEL */}
            <View className="w-full bg-zinc-950 rounded-3xl p-6 mt-4 shadow-xl shadow-zinc-950/20">
              <Text className="text-white font-extrabold text-base mb-5 tracking-tight">
                Recommended Troubleshooting
              </Text>

              <View className="space-y-0">
                {/* STEP 1 */}
                <View className="flex-row items-start relative pb-5">
                  <View className="absolute left-[15px] top-8 bottom-0 w-px bg-zinc-800" />
                  <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center z-10 border border-zinc-700">
                    <Ionicons name="card-outline" size={14} color="#f43f5e" />
                  </View>
                  <View className="ml-4 flex-1 justify-center">
                    <Text className="text-white font-bold text-sm">
                      Verify Bank Limits
                    </Text>
                    <Text className="text-zinc-400 text-xs mt-0.5">
                      Ensure international or digital token options are active
                      inside your banking app profile.
                    </Text>
                  </View>
                </View>

                {/* STEP 2 */}
                <View className="flex-row items-start relative pb-5">
                  <View className="absolute left-[15px] top-8 bottom-0 w-px bg-zinc-800" />
                  <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center z-10 border border-zinc-700">
                    <Ionicons
                      name="phone-portrait-outline"
                      size={14}
                      color="#a1a1aa"
                    />
                  </View>
                  <View className="ml-4 flex-1 justify-center">
                    <Text className="text-zinc-300 font-semibold text-sm">
                      Alternative Instruments
                    </Text>
                    <Text className="text-zinc-500 text-xs mt-0.5">
                      Try shifting transaction strategy over to your alternative
                      card variants or direct UPI lines.
                    </Text>
                  </View>
                </View>

                {/* STEP 3 */}
                <View className="flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center z-10 border border-zinc-700">
                    <Ionicons
                      name="chatbubbles-outline"
                      size={14}
                      color="#a1a1aa"
                    />
                  </View>
                  <View className="ml-4 flex-1 justify-center">
                    <Text className="text-zinc-400 font-medium text-sm">
                      Support Concierge
                    </Text>
                    <Text className="text-zinc-600 text-xs mt-0.5">
                      Our terminal network systems are live 24/7 if payment
                      logging issues persist continuously.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ACTION INTERACTION CONTROLS */}
          <View className="mt-8">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                router.replace({
                  pathname: "/checkout",
                  params: { retryOrderId: orderId },
                } as any)
              }
              className="h-14 bg-zinc-950 rounded-2xl items-center justify-center flex-row shadow-lg shadow-zinc-950/20 active:bg-zinc-900"
            >
              <Ionicons name="refresh-sharp" size={18} color="#fff" />
              <Text className="text-white font-bold text-sm ml-2 tracking-tight">
                Retry Payment Window
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.replace("/cart" as any)}
              className="h-14 bg-transparent border border-zinc-200 rounded-2xl items-center justify-center mt-3 active:bg-zinc-100"
            >
              <Text className="text-zinc-800 font-bold text-sm tracking-tight">
                Return to Cart
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
