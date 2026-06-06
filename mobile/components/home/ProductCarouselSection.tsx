import { ProductCard } from "@/components/home/HomeProductCard";
import type { Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

type ProductCarouselSectionProps = {
  title: string;
  subtitle: string;
  products: Product[];
  getImageUrl: (product: Product) => string;
  onSeeAll?: () => void;
  emptyLabel?: string;
};

export function ProductCarouselSection({
  title,
  subtitle,
  products,
  getImageUrl,
  onSeeAll,
  emptyLabel = "No sneakers matched this selection yet.",
}: ProductCarouselSectionProps) {
  const router = useRouter();

  const handleSeeAll = onSeeAll ?? (() => router.push("/search"));

  return (
    <View className="mt-8">
      <View className="mb-5 px-6">
        <View className="flex flex-row items-center justify-between">
          <Text className="text-[24px] font-black tracking-tight text-zinc-900">
            {title}
          </Text>

          <TouchableOpacity
            onPress={handleSeeAll}
            activeOpacity={0.8}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2"
          >
            <Text className="text-xs font-bold uppercase tracking-[1px] text-zinc-900">
              See All <Ionicons name="chevron-forward" size={12} />
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="mt-2 text-[15px] leading-6 text-zinc-500">
          {subtitle}
        </Text>
      </View>

      {products.length === 0 ? (
        <View className="mx-6 rounded-[28px] border border-dashed border-zinc-200 bg-zinc-50 px-5 py-8">
          <Text className="text-base font-semibold text-zinc-900">
            Nothing here yet
          </Text>
          <Text className="mt-2 text-sm leading-6 text-zinc-500">
            {emptyLabel}
          </Text>
        </View>
      ) : (
        <FlatList
          horizontal
          data={products}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToAlignment="start"
          snapToInterval={252}
          disableIntervalMomentum
          ItemSeparatorComponent={() => <View className="w-5" />}
          ListHeaderComponent={<View className="w-6" />}
          ListFooterComponent={<View className="w-6" />}
          renderItem={({ item }) => (
            <ProductCard
              image={getImageUrl(item)}
              categoryId={item.categoryId}
              brand={item.brand}
              name={item.name}
              salePrice={item.salePrice}
              originalPrice={item.basePrice}
              discountPercent={item.discountPercent}
              rating={parseFloat(item.averageRating)}
              onPress={() => router.push(`/product/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}
