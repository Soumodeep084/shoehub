import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useCouponStore } from "@/store/couponStore";
import { useAuth } from "@clerk/expo";
import Toast from "react-native-toast-message";

interface AvailableCouponsListProps {
  subtotal: number;
}

export default function AvailableCouponsList({ subtotal }: AvailableCouponsListProps) {
  const { availableCoupons, appliedCoupon, applyCoupon, isApplying } = useCouponStore();
  const { getToken } = useAuth();

  if (availableCoupons.length === 0) return null;

  const handleApplyCoupon = async (code: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again");
      await applyCoupon(token, code, subtotal);
      Toast.show({
        type: "success",
        text1: "Coupon Applied! 🎉",
        text2: `You saved ₹${useCouponStore.getState().appliedCoupon?.discount ?? 0}`,
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to Apply",
        text2: err.message || "This coupon could not be applied.",
      });
    }
  };

  const getDiscountText = (coupon: any) => {
    if (coupon.discountType === "PERCENTAGE") {
      let text = `${coupon.discountValue}% off`;
      if (coupon.maxDiscount) text += ` (up to ₹${coupon.maxDiscount})`;
      return text;
    }
    return `₹${coupon.discountValue} off`;
  };

  return (
    <View className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">
        Available Coupons ({availableCoupons.length})
      </Text>

      {availableCoupons.map((coupon) => {
        const isCurrentlyApplied = appliedCoupon?.coupon.id === coupon.id;
        const isEligible = subtotal >= coupon.minOrderAmount;

        return (
          <View
            key={coupon.id}
            className={`py-3.5 border-b border-zinc-50 last:border-b-0 ${
              !isEligible ? "opacity-50" : ""
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center flex-wrap gap-2">
                  <View className="bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">
                    <Text className="text-xs font-black font-mono text-zinc-800 uppercase">
                      {coupon.code}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-emerald-600">
                    {getDiscountText(coupon)}
                  </Text>
                </View>

                {coupon.description && (
                  <Text className="text-xs text-zinc-500 mt-2 font-medium">
                    {coupon.description}
                  </Text>
                )}

                <Text className="text-[10px] font-bold text-zinc-400 mt-1">
                  Min order: ₹{coupon.minOrderAmount}
                  {coupon.expiresAt && ` • Expires: ${new Date(coupon.expiresAt).toLocaleDateString("en-IN")}`}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleApplyCoupon(coupon.code)}
                disabled={isCurrentlyApplied || !isEligible || isApplying}
                activeOpacity={0.7}
                className={`px-3 py-1.5 rounded-lg border ${
                  isCurrentlyApplied
                    ? "bg-emerald-50 border-emerald-300"
                    : !isEligible
                    ? "bg-zinc-50 border-zinc-200"
                    : "bg-zinc-950 border-zinc-950"
                }`}
              >
                {isApplying && isCurrentlyApplied ? (
                  <ActivityIndicator color="#059669" size="small" />
                ) : (
                  <Text
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      isCurrentlyApplied
                        ? "text-emerald-700"
                        : !isEligible
                        ? "text-zinc-400"
                        : "text-white"
                    }`}
                  >
                    {isCurrentlyApplied ? "Applied" : !isEligible ? "Locked" : "Apply"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}
