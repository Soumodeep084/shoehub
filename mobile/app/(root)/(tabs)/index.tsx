import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { RefreshControl, ScrollView, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PremiumStats } from "@/components/home/PremiumStats";
import { CategoriesSection } from "@/components/home/CategorySection";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import { ProductCarouselSection } from "@/components/home/ProductCarouselSection";
import { SectionReveal } from "@/components/home/SectionReveal";
import { PopularBrandsSection } from "@/components/home/PopularBrandsSection";
import type { Category, Product } from "@/types";
import { getGreeting } from "@/utils/home.utils";
import { useUserStore } from "@/store/userStore";
import { useCategoryStore } from "@/store/categoryStore";
import { useBrandStore } from "@/store/brandStore"; // Linked Store Hook
import { ENV } from "@/config/env";

const BACKEND_URL = ENV.API_URL;
if (!BACKEND_URL) {
  throw new Error(
    "BACKEND_URL is not defined. Please set EXPO_PUBLIC_BACKEND_URL in your environment variables.",
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const firstRender = useRef(true);

  // 1. Data Fetching State Blocks
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);

  // 2. UI State Control
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 3. Filter States (Defaulted cleanly to tracking states)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");

  // Global Store Access
  const { categories, setCategories } = useCategoryStore();
  const { brands, setBrands } = useBrandStore();

  // --- DYNAMIC "ALL" ARRAYS FOR UI ---
  const displayCategories = useMemo(() => {
    const allCategory = {
      id: "All",
      name: "All",
      description: "Everything",
      imageUrl: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519",
      isActive: true,
    } as Category;

    return [allCategory, ...categories];
  }, [categories]);

  const displayBrands = useMemo(() => {
    return ["All", ...brands];
  }, [brands]);

  // --- REACTIVE API FETCH ACTIONS ---
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Categories error:", err);
    }
  }, [setCategories]);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/brands`);
      if (res.ok) {
        const data = await res.json();
        setBrands(data);
      }
    } catch (err) {
      console.error("Brands error:", err);
    }
  }, [setBrands]);

  const fetchNewArrivals = useCallback(
    async (catId: string, brandName: string) => {
      try {
        let url = `${BACKEND_URL}/api/products?new=true&limit=10`;
        if (catId !== "All") url += `&categoryId=${catId}`;
        if (brandName !== "All") url += `&brand=${brandName}`;

        const res = await fetch(url);
        if (res.ok) setNewArrivals(await res.json());
      } catch (err) {
        console.error("New Arrivals error:", err);
      }
    },
    [],
  );

  const fetchTrending = useCallback(
    async (catId: string, brandName: string) => {
      try {
        let url = `${BACKEND_URL}/api/products?trending=true&limit=10`;
        if (catId !== "All") url += `&categoryId=${catId}`;
        if (brandName !== "All") url += `&brand=${brandName}`;

        const res = await fetch(url);
        if (res.ok) setTrending(await res.json());
      } catch (err) {
        console.error("Trending error:", err);
      }
    },
    [],
  );

  const fetchFeatured = useCallback(
    async (catId: string, brandName: string) => {
      try {
        let url = `${BACKEND_URL}/api/products?featured=true&limit=10`;
        if (catId !== "All") url += `&categoryId=${catId}`;
        if (brandName !== "All") url += `&brand=${brandName}`;

        const res = await fetch(url);
        if (res.ok) setFeatured(await res.json());
      } catch (err) {
        console.error("Featured error:", err);
      }
    },
    [],
  );

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.allSettled([
        fetchCategories(),
        fetchBrands(),
        fetchNewArrivals("All", "All"),
        fetchTrending("All", "All"),
        fetchFeatured("All", "All"),
      ]);
      setIsLoading(false);
    };

    loadInitialData();
  }, []);

  // --- FILTER LISTENER (Runs every time the user taps a chip) ---
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const reFetchProducts = async () => {
      await Promise.allSettled([
        fetchNewArrivals(selectedCategoryId, selectedBrand),
        fetchTrending(selectedCategoryId, selectedBrand),
        fetchFeatured(selectedCategoryId, selectedBrand),
      ]);
    };

    reFetchProducts();
  }, [
    selectedCategoryId,
    selectedBrand,
  ]);

  // --- GESTURE PULL-TO-REFRESH HANDLER ---
  const onRefresh = async () => {
    setIsRefreshing(true);
    setSelectedCategoryId("All");
    setSelectedBrand("All");

    await Promise.allSettled([
      fetchCategories(),
      fetchBrands(),
      fetchNewArrivals("All", "All"),
      fetchTrending("All", "All"),
      fetchFeatured("All", "All"),
    ]);
    setIsRefreshing(false);
  };

  // --- MEMOIZED DATA SELECTORS ---
  const activeCategory = useMemo(() => {
    if (categories.length === 0) return null;
    if (selectedCategoryId === "All") return categories[0];
    return categories.find((c) => c.id === selectedCategoryId) ?? categories[0];
  }, [categories, selectedCategoryId]);

  const getProductImageUrl = useCallback(
    (product: Product) => {
      if (product.images && product.images.length > 0) {
        const primary = product.images.find((img) => img.isPrimary);
        return primary ? primary.imageUrl : product.images[0].imageUrl;
      }
      return activeCategory?.imageUrl ?? "";
    },
    [activeCategory],
  );

  const heroSlides = useMemo(() => {
    const combinedProducts = [...featured, ...newArrivals, ...trending];
    const uniqueProducts = combinedProducts.filter(
      (product, index, self) =>
        self.findIndex((p) => p.id === product.id) === index,
    );

    return uniqueProducts.slice(0, 4).map((product) => ({
      product,
      image: getProductImageUrl(product),
      title: product.name,
      subtitle: activeCategory?.name || "Featured Item",
      ctaLabel: "Shop Now",
    }));
  }, [featured, newArrivals, trending, activeCategory, getProductImageUrl]);

  // User Profile Greeting Parsing
  const firstName = useUserStore((state) => state.firstName);
  const subGreeting = "Fresh drops. Built for collectors.";
  const greeting = getGreeting(firstName);

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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#111827"
            />
          }
        >
          {/* Header */}
          <View className="bg-white">
            <HomeHeader
              onSearchPress={() => router.push("/search")}
              onWishlistPress={() => router.push("/wishlist")}
              onAvatarPress={() => router.push("/profile")}
              onNotificationPress={() => router.push("/notifications" as any)}
            />
          </View>

          {/* Greeting */}
          <View className="mt-0 px-6">
            <Text className="mt-2 text-[20px] font-bold leading-9 tracking-tight text-zinc-900">
              {greeting}
            </Text>
            <Text className="mt-1 text-base leading-6 text-zinc-500">
              {subGreeting}
            </Text>
          </View>

          {/* Hero Slider */}
          <SectionReveal delay={60}>
            <HeroCarousel slides={heroSlides} />
          </SectionReveal>

          {/* Premium Stats */}
          <PremiumStats />

          {/* Categories */}
          <CategoriesSection
            categories={displayCategories}
            onCategoryPress={(cat) => setSelectedCategoryId(cat.id)}
          />

          {/* Brands */}
          {brands.length > 0 && (
            <SectionReveal delay={120}>
              <PopularBrandsSection
                brands={displayBrands}
                selectedBrand={selectedBrand}
                onSelectBrand={(brand) => setSelectedBrand(brand)}
              />
            </SectionReveal>
          )}

          {/* New Arrivals */}
          <SectionReveal delay={240}>
            <ProductCarouselSection
              title="Just Landed"
              subtitle="The freshest arrivals with premium comfort and new-season energy."
              products={newArrivals}
              getImageUrl={getProductImageUrl}
              onSeeAll={() => {
                router.push({
                  pathname: "/search",
                  params: {
                    openFilters: "true",
                    sort: "newest",
                    category:
                      selectedCategoryId !== "All"
                        ? selectedCategoryId
                        : undefined,
                    brand: selectedBrand !== "All" ? selectedBrand : undefined,
                  },
                });
              }}
              emptyLabel="No new arrivals in this selection yet."
            />
          </SectionReveal>

          {/* Trending Now */}
          <SectionReveal delay={300}>
            <ProductCarouselSection
              title="Trending Now"
              subtitle="Sorted by sold count and rating for the strongest signal."
              products={trending}
              getImageUrl={getProductImageUrl}
              onSeeAll={() => {
                router.push({
                  pathname: "/search",
                  params: {
                    openFilters: "true",
                    sort: "trending",
                    category:
                      selectedCategoryId !== "All"
                        ? selectedCategoryId
                        : undefined,
                    brand: selectedBrand !== "All" ? selectedBrand : undefined,
                  },
                });
              }}
              emptyLabel="Nothing trending in this filter. Switch the category or brand to explore more."
            />
          </SectionReveal>

          {/* Featured Collections */}
          <SectionReveal delay={360}>
            <ProductCarouselSection
              title="Most Loved"
              subtitle="Top-rated sneakers loved by thousands of sneakerheads."
              products={featured}
              getImageUrl={getProductImageUrl}
              onSeeAll={() => {
                router.push({
                  pathname: "/search",
                  params: {
                    openFilters: "true",
                    sort: "featured",
                    category:
                      selectedCategoryId !== "All"
                        ? selectedCategoryId
                        : undefined,
                    brand: selectedBrand !== "All" ? selectedBrand : undefined,
                  },
                });
              }}
              emptyLabel="No highly rated products available."
            />
          </SectionReveal>

          <View className="h-12" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
