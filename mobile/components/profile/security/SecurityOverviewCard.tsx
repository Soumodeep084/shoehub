import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SectionCard } from "../SectionCard";

type Props = {
  sessionsCount: number;
};

export function SecurityOverviewCard({ sessionsCount }: Props) {
  return (
    <SectionCard>
      <View className="px-5 py-5">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
            <Ionicons
              name="shield-checkmark"
              size={22}
              color="#059669"
            />
          </View>

          <View className="flex-1">
            <Text className="text-lg font-black text-zinc-950">
              Account Protected
            </Text>

            <Text className="mt-1 text-sm text-zinc-500">
              Password secured and {sessionsCount} active session
              {sessionsCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </View>
    </SectionCard>
  );
}