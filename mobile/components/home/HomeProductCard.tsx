import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Animated, Image, Text, TouchableOpacity, View } from "react-native";
import { formatPrice } from "@/utils/price.utils";
import { useCategoryStore } from "@/store/categoryStore";

type ProductCardProps = {
  image: string;
  brand: string;
  categoryId: string;
  name: string;
  salePrice: string;
  originalPrice?: string;
  discountPercent?: number;
  rating: number;
  isWishlisted?: boolean;
  onPress?: () => void;
  onWishlistToggle?: () => void;
};

export const HomeProductCard = ({
  image,
  brand,
  categoryId,
  name,
  salePrice,
  originalPrice,
  discountPercent,
  rating,
  isWishlisted,
  onPress,
  onWishlistToggle,
}: ProductCardProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const category = useCategoryStore((state) =>
    state.categories.find((c) => c.id === categoryId),
  );

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className="w-60"
      onPress={onPress}
      onPressIn={() => animateTo(0.96)} // Slightly deeper press feel
      onPressOut={() => animateTo(1)}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View className="overflow-hidden rounded-[28px] border border-zinc-100 bg-white shadow-2xl shadow-black/5">
          <Image
            source={{ uri: image }}
            className="h-64 w-full bg-zinc-100"
            resizeMode="cover"
          />

          {typeof discountPercent === "number" && discountPercent > 0 && (
            <View className="absolute left-4 top-4 rounded-full bg-black px-3 py-1.5">
              <Text className="text-xs font-semibold uppercase tracking-wide text-white">
                {discountPercent}% Off
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={onWishlistToggle}
            hitSlop={12}
            className="absolute right-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
            activeOpacity={0.8}
          >
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={18}
              color={isWishlisted ? "#dc2626" : "#111827"}
            />
          </TouchableOpacity>
        </View>

        {/* Info Area */}
        <View className="mt-2 gap-1 px-2">
          <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-zinc-600">
            {brand} - {category?.name || "Unknown Category"}
          </Text>

          <Text
            numberOfLines={1}
            className="text-base font-semibold tracking-tight text-zinc-900"
          >
            {name}
          </Text>

          <View className="flex-row items-baseline gap-1">
            <Text className="text-lg font-black text-zinc-950">
              {formatPrice(salePrice)}
            </Text>

            {originalPrice && originalPrice && (
              <Text className="text-sm font-medium text-zinc-500 line-through">
                {formatPrice(originalPrice).replace(" /-", "")}
              </Text>
            )}
          </View>

          <View className="flex-row items-center gap-1 px-1">
            <Ionicons name="star" size={13} color="#f59e0b" />
            <Text className="text-xs font-semibold text-zinc-500">
              {rating.toFixed(1)}
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};
