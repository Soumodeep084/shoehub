import { Product } from "@/types";
import { formatPrice } from "@/utils/price.utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TouchableOpacity, View, Text, Image } from "react-native";

const SearchProductCard = ({
  item,
  categoryName,
  onWishlistPress,
  getProductImageUrl,
  isWishlisted = false,
}: {
  item: Product;
  categoryName?: string;
  getProductImageUrl: (product: Product) => string;
  onWishlistPress: (item: Product) => void;
  isWishlisted: boolean;
}) => {
  const router = useRouter();
  const parsedRating = Number(item.averageRating) || 0;

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: "/product/[id]", params: { id: item.id , from: "search" } })
      }
      activeOpacity={0.9}
      className="flex-1 bg-transparent p-1.5 m-1 mt-2" // Transparent outer frame, equal grid gaps
    >
      {/* Media Frame Container - Exactly matches your home product card style */}
      <View className="relative w-full aspect-square overflow-hidden rounded-[24px] border border-zinc-100 bg-white shadow-2xl shadow-black/5">
        <Image
          source={{ uri: getProductImageUrl(item) }}
          className="w-full h-full bg-zinc-100"
          resizeMode="cover"
        />

        {/* New Badge */}
        {item.isNew && (
          <View className="absolute left-4 top-4 z-10 rounded-xl bg-zinc-900 px-3 py-0.5">
            <Text className="text-[9px] font-bold uppercase tracking-wider text-white">
              New
            </Text>
          </View>
        )}

        {/* Wishlist Icon */}
        <TouchableOpacity
          onPress={() => onWishlistPress(item)}
          hitSlop={12}
          activeOpacity={0.9}
          className="absolute right-4 top-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
        >
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={18}
            color={isWishlisted ? "#dc2626" : "#111827"}
          />
        </TouchableOpacity>
      </View>

      {/* Premium Information Typography Stack */}
      <View className="mt-2 gap-0.5 px-2">
        <Text
          className="text-[9px] font-bold uppercase tracking-[1.2px] text-zinc-500"
          numberOfLines={1}
        >
          {item.brand} - {categoryName || "Sneakers"}
        </Text>

        <Text
          className="text-sm font-semibold tracking-tight text-zinc-900"
          numberOfLines={1}
        >
          {item.name}
        </Text>

        {/* Dynamic Row: Layout Prices left, Ratings perfectly baseline right */}
        <View className="mt-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Text className="text-sm font-black text-zinc-950">
                {formatPrice(item.salePrice)}
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
              <Text className="text-[11px] font-bold text-zinc-500">
                {parsedRating.toFixed(1)}
              </Text>
            </View>
          </View>

          {item.basePrice && item.discountPercent > 0 && (
            <Text className="mt-0.5 text-[11px] font-medium text-zinc-400 line-through">
              {formatPrice(item.basePrice).replace("/-", "")}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SearchProductCard;
