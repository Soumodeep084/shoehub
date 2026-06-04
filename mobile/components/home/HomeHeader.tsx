import { useUserStore } from "@/store/userStore";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, Text, View } from "react-native";

type HomeHeaderProps = {
  onSearchPress?: () => void;
  onWishlistPress?: () => void;
  onAvatarPress?: () => void;
};

export function HomeHeader({
  onSearchPress,
  onWishlistPress,
  onAvatarPress,
}: HomeHeaderProps) {
  const avatarLabel = useUserStore((state) => state.avatarLabel);

  return (
    <View className="bg-white px-6 pt-2 pb-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-950 shadow-lg shadow-black/20">
            <Text className="text-sm font-bold tracking-[1px] text-white">
              SH
            </Text>
          </View>

          <View>
            <Text className="text-[18px] font-black tracking-tight text-zinc-950">
              ShoeHub
            </Text>
            <Text className="text-xs font-medium uppercase tracking-[1px] text-zinc-500">
              Curated Sneakers
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={onSearchPress}
            activeOpacity={0.82}
            className="h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm shadow-black/5"
          >
            <Ionicons name="search-outline" size={18} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onWishlistPress}
            activeOpacity={0.82}
            className="h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm shadow-black/5"
          >
            <Ionicons name="heart-outline" size={18} color="#111827" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onAvatarPress}
            activeOpacity={0.82}
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-950 shadow-lg shadow-black/20"
          >
            <Text className="text-xs font-bold tracking-[1px] text-white">
              {avatarLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="self-start rounded-full bg-zinc-100 px-3 py-1 mt-2">
        <Text className="text-xs font-semibold text-zinc-700">
          🔥 New Drops Today
        </Text>
      </View>
    </View>
  );
}
