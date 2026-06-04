// import type { Category } from "@/types";
// import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";

// type CategorySectionProps = {
//   categories: Category[];
//   selectedCategoryId: string;
//   onSelectCategory: (categoryId: string) => void;
// };

// function CategoryCard({
//   category,
//   isActive,
//   onPress,
// }: {
//   category: Category;
//   isActive: boolean;
//   onPress: () => void;
// }) {
//   return (
//     <TouchableOpacity
//       activeOpacity={0.9}
//       onPress={onPress}
//       className={`h-36 w-40 overflow-hidden rounded-[24px] bg-zinc-100 ${isActive ? "border-2 border-zinc-950" : "border border-zinc-100"}`}
//     >
//       <Image source={{ uri: category.imageUrl }} className="h-full w-full" resizeMode="cover" />

//       <View className="absolute inset-0 bg-black/25" />

//       <View className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5">
//         <Text className="text-[10px] font-bold uppercase tracking-[1px] text-zinc-900">
//           {category.name}
//         </Text>
//       </View>

//       {isActive && <View className="absolute inset-x-4 bottom-4 h-1 rounded-full bg-white/85" />}

//       <View className="absolute bottom-4 left-4 right-4">
//         <Text className="text-base font-bold tracking-tight text-white">{category.name}</Text>
//       </View>
//     </TouchableOpacity>
//   );
// }

// export function CategorySection({ categories, selectedCategoryId, onSelectCategory }: CategorySectionProps) {
//   return (
//     <View className="mt-11">
//       <View className="mb-5 px-6">
//         <Text className="text-[24px] font-black tracking-tight text-zinc-900">Shop By Sport</Text>
//         <Text className="mt-2 text-[15px] leading-6 text-zinc-500">Tap a category to reshape the collection instantly.</Text>
//       </View>

//       <FlatList
//         horizontal
//         data={categories}
//         keyExtractor={(item) => item.id}
//         showsHorizontalScrollIndicator={false}
//         decelerationRate="fast"
//         snapToAlignment="start"
//         snapToInterval={176}
//         disableIntervalMomentum
//         ItemSeparatorComponent={() => <View className="w-4" />}
//         ListHeaderComponent={<View className="w-6" />}
//         ListFooterComponent={<View className="w-6" />}
//         renderItem={({ item }) => (
//           <CategoryCard
//             category={item}
//             isActive={selectedCategoryId === item.id}
//             onPress={() => onSelectCategory(item.id)}
//           />
//         )}
//       />
//     </View>
//   );
// }

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
