import { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategorySection } from "@/components/home/CategorySection";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import { PopularBrandsSection } from "@/components/home/PopularBrandsSection";
import { ProductCarouselSection } from "@/components/home/ProductCarouselSection";
import { SectionReveal } from "@/components/home/SectionReveal";

import {
  categories,
  productImages,
  products,
} from "@/data/mock-data";
import type { Product } from "@/types";

export default function HomeScreen() {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0].id);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 850);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  };

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? categories[0],
    [selectedCategoryId]
  );

  const filteredCatalog = useMemo(
    () =>
      products.filter(
        (product) =>
          product.isActive &&
          (selectedBrand ? product.brand === selectedBrand : true)
      ),
    [selectedBrand]
  );

  const catalogByCategory = useMemo(
    () => filteredCatalog.filter((product) => product.categoryId === selectedCategoryId),
    [filteredCatalog, selectedCategoryId]
  );

  const featuredProducts = useMemo(
    () => catalogByCategory.filter((product) => product.isFeatured),
    [catalogByCategory]
  );

  const newArrivals = useMemo(
    () => catalogByCategory.filter((product) => product.isNew),
    [catalogByCategory]
  );

  const trendingProducts = useMemo(
    () =>
      [...catalogByCategory]
        .sort((a, b) => {
          const scoreA = a.soldCount + a.averageRating * 100;
          const scoreB = b.soldCount + b.averageRating * 100;

          return scoreB - scoreA;
        })
        .slice(0, 8),
    [catalogByCategory]
  );

  const primaryProductImageMap = useMemo(
    () =>
      new Map(
        productImages
          .filter((image) => image.isPrimary)
          .map((image) => [image.productId, image.imageUrl])
      ),
    []
  );

  const categoryImageMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.imageUrl])),
    []
  );

  const getProductImageUrl = (product: Product) =>
    primaryProductImageMap.get(product.id) ??
    categoryImageMap.get(product.categoryId) ??
    categories[0].imageUrl;

  const heroSource = useMemo(() => {
    const ordered = [
      ...featuredProducts,
      ...newArrivals,
      ...trendingProducts,
      ...catalogByCategory,
      ...filteredCatalog,
      ...products,
    ];

    return ordered.filter(
      (product, index, array) => array.findIndex((item) => item.id === product.id) === index
    );
  }, [catalogByCategory, featuredProducts, filteredCatalog, newArrivals, trendingProducts]);

  const heroSlides = useMemo(
    () =>
      heroSource.slice(0, 4).map((product) => ({
        product,
        image: getProductImageUrl(product),
        title: product.name,
        subtitle: activeCategory.name,
        ctaLabel: "Shop Now",
      })),
    [activeCategory.name, heroSource]
  );

  const handleSeeAll = () => router.push("/search");

  return (
    <SafeAreaView className="flex-1 bg-white">
      {isLoading ? (
        <HomeSkeleton />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces
          decelerationRate="fast"
          stickyHeaderIndices={[0]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111827" />}
        >
          <View className="bg-white">
            <HomeHeader
              greeting="Good morning, sneakerhead."
              subGreeting="Discover curated drops, limited runs, and the cleanest pairs in the game."
              avatarLabel="JD"
              onSearchPress={() => router.push("/search")}
              onWishlistPress={() => router.push("/wishlist")}
              onAvatarPress={() => router.push("/profile")}
            />
          </View>

          <SectionReveal delay={60}>
            <HeroCarousel slides={heroSlides} />
          </SectionReveal>

          <SectionReveal delay={120}>
            <CategorySection
              categories={categories.filter((category) => category.isActive)}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          </SectionReveal>

          <SectionReveal delay={180}>
            <ProductCarouselSection
              title={`Featured Drops${selectedBrand ? ` · ${selectedBrand}` : ""}`}
              subtitle={`Curated releases in ${activeCategory.name.toLowerCase()}.`}
              products={featuredProducts}
              getImageUrl={getProductImageUrl}
              onSeeAll={handleSeeAll}
              emptyLabel={`No featured drops right now for ${activeCategory.name.toLowerCase()}. Try another brand or category.`}
            />
          </SectionReveal>

          <SectionReveal delay={240}>
            <ProductCarouselSection
              title="Just Landed"
              subtitle="The freshest arrivals with premium comfort and new-season energy."
              products={newArrivals}
              getImageUrl={getProductImageUrl}
              onSeeAll={handleSeeAll}
              emptyLabel="No new arrivals in this selection yet."
            />
          </SectionReveal>

          <SectionReveal delay={300}>
            <ProductCarouselSection
              title="Trending Now"
              subtitle="Sorted by sold count and rating for the strongest signal."
              products={trendingProducts}
              getImageUrl={getProductImageUrl}
              onSeeAll={handleSeeAll}
              emptyLabel="Nothing trending in this filter. Switch the category or brand to explore more."
            />
          </SectionReveal>

          <SectionReveal delay={360}>
            <PopularBrandsSection
              brands={["Nike", "Adidas", "Jordan", "New Balance"]}
              selectedBrand={selectedBrand ?? undefined}
              onSelectBrand={(brand) => setSelectedBrand((current) => (current === brand ? null : brand))}
            />
          </SectionReveal>

          <View className="h-12" />
        </ScrollView>)}
    </SafeAreaView>
  )
}