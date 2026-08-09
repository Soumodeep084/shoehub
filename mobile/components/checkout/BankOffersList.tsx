import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BankOffer } from "@/types";
import { useCouponStore } from "@/store/couponStore";

interface BankOffersListProps {
  subtotal: number;
}

export default function BankOffersList({ subtotal }: BankOffersListProps) {
  const { availableBankOffers, selectedBankOffer, selectBankOffer } =
    useCouponStore();

  // Filter offers that meet the minimum order amount
  const eligibleOffers = availableBankOffers.filter(
    (offer) => subtotal >= offer.minOrderAmount
  );

  if (eligibleOffers.length === 0) return null;

  const getDiscountText = (offer: BankOffer) => {
    if (offer.discountType === "PERCENTAGE") {
      let text = `${offer.discountValue}% off`;
      if (offer.maxDiscount) text += ` (up to ₹${offer.maxDiscount})`;
      return text;
    }
    return `₹${offer.discountValue} off`;
  };

  return (
    <View>
      <Text className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
        Bank Offers
      </Text>

      {eligibleOffers.map((offer) => {
        const isSelected = selectedBankOffer?.id === offer.id;

        return (
          <TouchableOpacity
            key={offer.id}
            onPress={() => selectBankOffer(isSelected ? null : offer)}
            activeOpacity={0.8}
            className={`p-4 rounded-2xl border flex-row items-center mb-3 ${
              isSelected
                ? "bg-cyan-50 border-cyan-500"
                : "bg-white border-zinc-200"
            }`}
          >
            <View
              className={`p-2 rounded-xl mr-3 ${
                isSelected ? "bg-cyan-100" : "bg-zinc-100"
              }`}
            >
              <Ionicons
                name="card"
                size={20}
                color={isSelected ? "#0891b2" : "#71717a"}
              />
            </View>

            <View className="flex-1">
              <View className="flex-row items-center">
                <Text
                  className={`text-sm font-bold ${
                    isSelected ? "text-cyan-800" : "text-zinc-900"
                  }`}
                >
                  {offer.bankName}
                </Text>
                {offer.cardType && (
                  <View className="bg-zinc-200 px-1.5 py-0.5 rounded ml-2">
                    <Text className="text-[10px] font-bold text-zinc-600 uppercase">
                      {offer.cardType}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-xs text-zinc-500 mt-0.5" numberOfLines={2}>
                {offer.description}
              </Text>
              <Text
                className={`text-[11px] font-bold mt-1 ${
                  isSelected ? "text-cyan-600" : "text-emerald-600"
                }`}
              >
                {getDiscountText(offer)}
              </Text>
            </View>

            <View
              className={`w-5 h-5 rounded-full border items-center justify-center ${
                isSelected
                  ? "border-cyan-600 bg-cyan-600"
                  : "border-zinc-300 bg-white"
              }`}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={12} color="#ffffff" />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
