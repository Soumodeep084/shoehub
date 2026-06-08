import { WishlistItem } from "@/store/wishlistStore";
import { formatPrice } from "@/utils/price.utils";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { TouchableOpacity, View, Text, Image } from "react-native";

export const WishlistProductCard = ({
  item,
  categoryName,
  onRemovePress,
}: {
  item: WishlistItem;
  categoryName: string;
  onRemovePress: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${item.productId}` as any)}
      activeOpacity={0.9}
      className="flex-1 bg-transparent p-1.5 m-1"
    >
      {/* Image media bounding frame containing your exact shadow layer configuration */}
      <View className="relative w-full aspect-square overflow-hidden rounded-[24px] border border-zinc-100 bg-white shadow-2xl shadow-black/5">
        <Image
          source={{ uri: item.baseImageUrl }}
          className="w-full h-full bg-zinc-100"
          resizeMode="cover"
        />

        {/* Wishlist Active Target (Guaranteed to be filled red inside this view page layout) */}
        <TouchableOpacity
          onPress={onRemovePress}
          hitSlop={12}
          activeOpacity={0.9}
          className="absolute right-4 top-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
        >
          <Ionicons name="heart" size={18} color="#dc2626" />
        </TouchableOpacity>
      </View>

      {/* Metadata layout engine matching details styling tags exactly */}
      <View className="mt-2 gap-0.5 px-2">
        <Text
          className="text-[10px] font-bold uppercase tracking-[1.2px] text-zinc-500"
          numberOfLines={1}
        >
          {item.brand} - {categoryName}
        </Text>

        <Text
          className="text-sm font-semibold tracking-tight text-zinc-900"
          numberOfLines={1}
        >
          {item.name} 
        </Text>

        <View className="mt-1 mx-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Text className="text-sm font-black text-zinc-950">
                {formatPrice(item.salePrice.toString())}
              </Text>

              {item.discountPercent > 0 && (
                <View className="rounded-full bg-amber-50 px-2 py-1">
                  <Text className="text-[10px] font-bold tracking-wide text-amber-500">
                    {item.discountPercent}% OFF
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center">
              <Ionicons name="star" size={11} color="#f59e0b" />
              <Text className="text-[11px] font-bold text-zinc-500 ml-0.5">
                {item.averageRating.toFixed(1)}
              </Text>
            </View>
          </View>

          {item.basePrice && item.discountPercent > 0 && (
            <Text className="mt-0.5 text-[11px] font-medium text-zinc-400 line-through">
              {formatPrice(item.basePrice.toString())}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
