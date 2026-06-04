import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import type { Product } from "@/types";
import { formatPrice } from "@/utils/price.utils";

type HeroSlide = {
  product: Product;
  image: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
};

type HeroCarouselProps = {
  slides: HeroSlide[];
};

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const itemWidth = width - 32;
  const listRef = useRef<FlatList<HeroSlide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 70 }),
    [],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      const index = viewableItems[0]?.index ?? 0;
      setActiveIndex(index);
    },
  ).current;

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, 4200);

    return () => clearInterval(timer);
  }, [activeIndex, slides.length]);

  if (!slides.length) {
    return null;
  }

  return (
    <View className="mt-4">
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled={false}
        snapToInterval={itemWidth + 16}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View className="w-4" />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: itemWidth + 16,
          offset: (itemWidth + 16) * index,
          index,
        })}
        renderItem={({ item }) => {
          return (
            <View
              className="overflow-hidden rounded-[36px] bg-zinc-950 shadow-2xl shadow-black/20"
              style={{ width: itemWidth }}
            >
              <TouchableOpacity
                onPress={() => router.push(`/product/${item.product.id}`)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: item.image }}
                  className="h-[390px] w-full"
                  resizeMode="cover"
                />
                <View className="absolute inset-0 bg-black/35" />
                <View className="absolute bottom-0 left-0 right-0 p-6">
                  <View className="flex-row items-center justify-between">
                    <View className="rounded-full bg-white/15 px-3 py-1.5">
                      <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-white">
                        {item.subtitle}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-1 rounded-full bg-white px-3 py-1.5">
                      <Ionicons name="flash" size={12} color="#111827" />
                      <Text className="text-[11px] font-semibold uppercase tracking-[1px] text-zinc-900">
                        Drop
                      </Text>
                    </View>
                  </View>

                  <Text className="mt-4 text-[32px] font-black leading-9 tracking-tight text-white">
                    {item.title}
                  </Text>

                  <Text className="mt-3 max-w-[80%] text-base leading-6 text-zinc-200">
                    {item.product.brand} innovation with premium comfort and a
                    clean silhouette made for everyday wear.
                  </Text>

                  <View className="mt-6 flex-row items-center justify-between">
                    <View>
                      {/* Label */}
                      <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-zinc-300">
                        {item.product.discountPercent > 0
                          ? "Special Offer"
                          : "Starting at"}
                      </Text>

                      {/* Price Container */}
                      <View className="mt-1 flex-row items-baseline gap-2">
                        {/* Sale Price (The current active price) */}
                        <Text className="text-2xl font-black text-white">
                          {formatPrice(item.product.salePrice)}
                        </Text>

                        {/* Slashed Original Price (Only shows if there's actually a discount) */}
                        {item.product.discountPercent > 0 && (
                          <Text className="ms-1 text-xl font-semibold text-zinc-400 line-through">
                            {formatPrice(item.product.basePrice)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => router.push(`/product/${item.product.id}`)}
                      className="rounded-full bg-white px-4 py-2"
                    >
                      <Text className="text-sm font-semibold uppercase tracking-[1px] text-zinc-950">
                        {item.ctaLabel}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="absolute right-5 top-5 rounded-full bg-white px-3 py-1.5">
                  <Text className="text-[11px] font-bold uppercase tracking-[1px] text-zinc-900">
                    {item.product.isNew
                      ? "New"
                      : item.product.discountPercent > 0
                        ? `${item.product.discountPercent}% Off`
                        : "Trending"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <View className="mt-4 flex-row justify-center gap-2">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <View
              key={slide.product.id}
              className={`h-2 rounded-full transition-all ${isActive ? "w-7 bg-zinc-950" : "w-2 bg-zinc-300"}`}
            />
          );
        })}
      </View>
    </View>
  );
}
