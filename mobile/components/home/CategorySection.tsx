import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import type { Category } from "@/types";
import { Ionicons } from "@expo/vector-icons";

type CategoriesSectionProps = {
  categories: Category[];
  onCategoryPress?: (category: Category) => void;
  onSeeAllPress?: () => void;
};

const { width } = Dimensions.get("window");
// Perfectly fits exactly 2.5 cards on screen dynamically
const CARD_WIDTH = (width - 48) / 2.3;
const CARD_HEIGHT = CARD_WIDTH * 1.25; // Sleek vertical aspect ratio

export const CategoriesSection = ({
  categories,
  onCategoryPress,
  onSeeAllPress,
}: CategoriesSectionProps) => {
  const router = useRouter();

  // Safe fallback routing
  const handleSeeAll = onSeeAllPress ?? (() => router.push("/search"));

  if (!categories || categories.length === 0) return null;

  return (
    <View className="mt-6">
      {/* Header Row matched identically with your Product sections */}
      <View className="mb-5 px-6">
        <View className="flex flex-row items-center justify-between">
          <Text className="text-[24px] font-black tracking-tight text-zinc-900">
            Shop by Collection
          </Text>

          <TouchableOpacity
            onPress={handleSeeAll}
            activeOpacity={0.75}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 shadow-sm shadow-black/5"
          >
            <Text className="text-xs font-bold uppercase tracking-[1px] text-zinc-900">
              See All <Ionicons name="chevron-forward" size={12} />
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="mt-2 text-[14px] leading-5 text-zinc-500">
          Curated silhouettes engineered for your rotation.
        </Text>
      </View>

      {/* Horizontal Category Track */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 14} // Matches Card Width + Right Margin perfectly
        contentContainerStyle={{
          paddingLeft: 24,
          paddingRight: 10, // Offset to balance out the final card's right margin
        }}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              onPress={() =>
                onCategoryPress?.(item) ??
                router.push(`/search?category=${item.id}`)
              }
              activeOpacity={0.9}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                marginRight: 14, // Bulletproof horizontal gap spacing between cards
              }}
              className="relative overflow-hidden rounded-[24px] bg-zinc-900"
            >
              {/* 1. Background Image (Completely fills container) */}
              <Image
                source={{
                  uri:
                    item.imageUrl ??
                    "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
                }}
                style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                className="absolute left-0 top-0"
                resizeMode="cover"
              />

              {/* 2. Pure Native Black Overlay Block to keep text crystal clear */}
              <View
                style={{ width: CARD_WIDTH }}
                className="absolute bottom-0 left-0 bg-black/40 pb-4 pt-8 px-4"
              >
                <Text
                  numberOfLines={1}
                  className="text-sm font-black tracking-tight text-white uppercase"
                >
                  {item.name} SNEAKERS
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};
