import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, Text } from "react-native";

export default function EmptyWishlist({ onPress }: { onPress: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-zinc-50 shadow-sm border border-zinc-100 mb-6">
        <Ionicons name="heart-outline" size={42} color="#a1a1aa" />
      </View>

      <Text className="text-xl font-bold tracking-tight text-zinc-900 text-center mb-2">
        Your Wishlist is Empty
      </Text>

      <Text className="text-sm text-zinc-500 text-center leading-6 max-w-[280px] mb-8">
        Tap the heart icon on any product to save items here for later access.
      </Text>

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        className="mt-1 flex-row items-center justify-center rounded-2xl bg-zinc-900 px-6 py-4"
      >
        <Text className="mr-2 text-sm font-bold tracking-wide text-white uppercase">
          Shop Sneakers
        </Text>

        <Ionicons name="arrow-forward" size={16} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
