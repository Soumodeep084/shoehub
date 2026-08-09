import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import Toast from "react-native-toast-message";
import { useCouponStore } from "@/store/couponStore";

interface CouponInputProps {
  subtotal: number;
}

export default function CouponInput({ subtotal }: CouponInputProps) {
  const [code, setCode] = useState("");
  const { getToken } = useAuth();

  const { appliedCoupon, isApplying, applyCoupon, removeCoupon } =
    useCouponStore();

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      Toast.show({
        type: "error",
        text1: "Enter a coupon code",
        text2: "Please type a valid coupon code to apply.",
      });
      return;
    }

    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again");
      await applyCoupon(token, trimmed, subtotal);
      Toast.show({
        type: "success",
        text1: "Coupon Applied! 🎉",
        text2: `You saved ₹${useCouponStore.getState().appliedCoupon?.discount ?? 0}`,
      });
    } catch (err: any) {
      setCode("");
      Toast.show({
        type: "error",
        text1: "Invalid Coupon",
        text2: err.message || "This coupon could not be applied.",
      });
    }
  };

  const handleRemove = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again");
      await removeCoupon(token);
      setCode("");
      Toast.show({
        type: "info",
        text1: "Coupon Removed",
        text2: "The coupon has been removed from your order.",
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Could not remove coupon.",
      });
    }
  };

  // ─── Applied Coupon State ──────────────────────────────────────────────
  if (appliedCoupon) {
    return (
      <View className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="bg-emerald-100 p-2 rounded-xl mr-3">
              <Ionicons name="pricetag" size={18} color="#059669" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-sm font-black text-emerald-800">
                  {appliedCoupon.coupon.code}
                </Text>
                <View className="bg-emerald-200 px-1.5 py-0.5 rounded ml-2">
                  <Text className="text-[10px] font-bold text-emerald-800">
                    APPLIED
                  </Text>
                </View>
              </View>
              {appliedCoupon.coupon.description && (
                <Text
                  className="text-xs text-emerald-600 mt-0.5"
                  numberOfLines={1}
                >
                  {appliedCoupon.coupon.description}
                </Text>
              )}
            </View>
          </View>

          <View className="items-end ml-3">
            <Text className="text-sm font-black text-emerald-700">
              -₹{appliedCoupon.discount}
            </Text>
            <TouchableOpacity onPress={handleRemove} className="mt-1">
              <Text className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── Input State ───────────────────────────────────────────────────────
  return (
    <View className="bg-white rounded-2xl border border-zinc-200 p-4">
      <View className="flex-row items-center">
        <View className="bg-zinc-100 p-2 rounded-xl mr-3">
          <Ionicons name="pricetag-outline" size={18} color="#71717a" />
        </View>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Enter coupon code"
          autoCapitalize="characters"
          className="flex-1 text-sm font-bold text-zinc-900 h-10"
          placeholderTextColor="#a1a1aa"
          editable={!isApplying}
        />
        <TouchableOpacity
          onPress={handleApply}
          disabled={isApplying || !code.trim()}
          activeOpacity={0.7}
          className={`h-10 px-4 rounded-xl items-center justify-center ml-2 ${isApplying || !code.trim() ? "bg-zinc-200" : "bg-zinc-900"
            }`}
        >
          {isApplying ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text
              className={`text-xs font-bold uppercase tracking-wide ${!code.trim() ? "text-zinc-400" : "text-white"
                }`}
            >
              Apply
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
