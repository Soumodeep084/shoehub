import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export const PremiumStats = () => {
  return (
    <View className="mx-6 mt-6 flex-row items-center justify-between rounded-2xl p-5 p-y-6 ">
      {/* Stat 1: Customers */}
      <View className="flex-1 items-center">
        <Text className="text-xl font-black tracking-tight text-zinc-900">
          25K+
        </Text>
        <Text className="mt-1 text-[10px] font-bold uppercase tracking-[1.5px] text-zinc-400">
          Customers
        </Text>
      </View>

      {/* Divider */}
      <View className="h-8 w-[1px] bg-zinc-200" />

      {/* Stat 2: Rating */}
      <View className="flex-1 items-center">
        <View className="flex-row items-center gap-1">
          <Text className="text-xl font-black tracking-tight text-zinc-900">
            4.9
          </Text>
          <Ionicons
            name="star"
            size={14}
            color="#111827"
            style={{ marginTop: -2 }}
          />
        </View>
        <Text className="mt-1 text-[10px] font-bold uppercase tracking-[1.5px] text-zinc-400">
          Rating
        </Text>
      </View>

      {/* Divider */}
      <View className="h-8 w-[1px] bg-zinc-200" />

      {/* Stat 3: Authentic */}
      <View className="flex-1 items-center">
        <Text className="text-xl font-black tracking-tight text-zinc-900">
          100%
        </Text>
        <Text className="mt-1 text-[10px] font-bold uppercase tracking-[1.5px] text-zinc-400">
          Authentic
        </Text>
      </View>
    </View>
  );
};
