import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { FilterModal } from "@/components/search/FilterModal";
import { Ionicons } from "@expo/vector-icons";
import { useFilterStore, type SortByType } from "@/store/filterStore";
import { useCategoryStore } from "@/store/categoryStore";
import { searchPriceLabels } from "@/utils/price.utils"; // Swapped to match card price utilities
import type { Product } from "@/types";
import { ENV } from "@/config/env";
import SearchProductCard from "@/components/search/SearchProductCard";
import { useAuth } from "@clerk/expo";
import { useWishlistStore } from "@/store/wishlistStore";
import Toast from "react-native-toast-message";

const BACKEND_URL = ENV.API_URL;

const SORT_LABELS: Record<SortByType, string> = {
  newest: "Newest",
  trending: "Trending Now",
  featured: "Most Loved",
  priceLowToHigh: "Price: Low to High",
  priceHighToLow: "Price: High to Low",
};

const FilterChip = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) => (
  <View className="flex-row items-center bg-zinc-100 border border-zinc-200 rounded-full px-3 py-1">
    <Text className="text-zinc-700 text-xs font-semibold">{label}</Text>
    <TouchableOpacity className="ml-1.5" onPress={onRemove}>
      <Ionicons name="close" size={12} color="#1D4ED8" />
    </TouchableOpacity>
  </View>
);

const Search = () => {
  const params = useLocalSearchParams<{
    openFilters?: string;
    sort?: string;
    category?: string;
    brand?: string;
  }>();

  // Local UI States
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Guard to guarantee router sync runs exactly once on mount
  const isInitialSyncDone = useRef(false);

  // Global Filter Store Hook
  const {
    categoryId,
    brand,
    size,
    minPrice,
    maxPrice,
    sortBy,
    setCategoryId,
    setBrand,
    setSize,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    resetFilters,
  } = useFilterStore();

  const categories = useCategoryStore((state) => state.categories);
  const category = categories.find((c) => c.id === categoryId);

  const { getToken } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlistStore();

  // --- 1. ONE-TIME INITIAL SEEDING FROM HOME SCREEN ---
  useEffect(() => {
    if (isInitialSyncDone.current) return;

    if (params.category) setCategoryId(params.category);
    if (params.brand) setBrand(params.brand);

    if (params.sort) {
      setSortBy(params.sort as SortByType);
    }

    if (params.openFilters === "true") {
      setShowFilters(true);
    }

    isInitialSyncDone.current = true;
  }, [
    params.category,
    params.brand,
    params.sort,
    params.openFilters,
    setCategoryId,
    setBrand,
    setSortBy,
  ]);

  // --- 2. DEBOUNCE KEYSTROKES FROM SEARCH BAR ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // --- 3. DYNAMIC BACKEND API FETCH ENGINE ---
  useEffect(() => {
    const controller = new AbortController();

    const fetchFilteredProducts = async () => {
      setIsLoading(true);

      try {
        let url = `${BACKEND_URL}/api/products?`;

        if (debouncedSearch) {
          url += `search=${encodeURIComponent(debouncedSearch)}&`;
        }

        if (categoryId && categoryId !== "All" && categoryId !== "all") {
          url += `categoryId=${categoryId}&`;
        }

        if (brand && brand !== "All") {
          url += `brand=${encodeURIComponent(brand)}&`;
        }

        if (minPrice !== null) {
          url += `minPrice=${minPrice}&`;
        }

        if (maxPrice !== null) {
          url += `maxPrice=${maxPrice}&`;
        }

        if (size && size !== "Any") {
          url += `size=${encodeURIComponent(size)}&`;
        }

        if (sortBy === "newest") {
          url += "new=true&";
        } else if (sortBy === "trending") {
          url += "trending=true&";
        } else if (sortBy === "featured") {
          url += "featured=true&";
        } else if (sortBy === "priceLowToHigh") {
          url += "sort=price_asc&";
        } else if (sortBy === "priceHighToLow") {
          url += "sort=price_desc&";
        }

        const res = await fetch(url, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const data = await res.json();

        // Only update state if request wasn't aborted
        if (!controller.signal.aborted) {
          setProducts(data);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Fetch products error:", err);
        }
      } finally {
        // Prevent state updates from aborted requests
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchFilteredProducts();

    return () => {
      controller.abort();
    };
  }, [debouncedSearch, categoryId, brand, minPrice, maxPrice, sortBy, size]);

  const activeFilterCount = [
    categoryId && categoryId !== "All" && categoryId !== "all",
    brand && brand !== "All",
    size && size !== "Any",
    minPrice !== null,
    maxPrice !== null,
    sortBy !== "newest",
  ].filter(Boolean).length;

  const priceLabel = searchPriceLabels(minPrice, maxPrice);

  const getProductImageUrl = useCallback((product: Product) => {
    if (product.images && product.images.length > 0) {
      const primary = product.images.find((img) => img.isPrimary);
      return primary ? primary.imageUrl : product.images[0].imageUrl;
    }
    return "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519";
  }, []);

  const handleWishlistToggle = async (item: Product) => {
    try {
      const token = await getToken();

      if (!token) {
        Toast.show({
          type: "error",
          text1: "Login required",
          text2: "Please log in to use wishlist",
        });
        return;
      }

      await toggleWishlist(token, {
        productId: item.id,
        categoryId: item.categoryId,
        name: item.name,
        brand: item.brand,
        basePrice: Number(item.basePrice),
        salePrice: Number(item.salePrice),
        discountPercent: item.discountPercent,
        averageRating: Number(item.averageRating),
        baseImageUrl: getProductImageUrl(item),
      });

      Toast.show({
        type: "success",
        text1: "Wishlist updated",
        text2: "Your changes were saved",
      });
    } catch (error) {
      console.error("Wishlist error:", error);

      Toast.show({
        type: "error",
        text1: "Something went wrong",
        text2: "Please try again later",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-zinc-900 mb-4">
          Find Sneakers
        </Text>

        {/* Search Input Layout */}
        <View className="flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center bg-white rounded-2xl px-4 gap-3 border border-zinc-100 shadow-sm">
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 py-3 text-zinc-800 font-medium"
              placeholder="Search sneakers..."
              placeholderTextColor="#9CA3AF"
              value={searchInput}
              onChangeText={setSearchInput}
              autoCapitalize="none"
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={() => setSearchInput("")}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Trigger Filters */}
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className={`w-12 h-12 rounded-2xl items-center justify-center ${
              activeFilterCount > 0
                ? "bg-zinc-900"
                : "bg-white border border-zinc-100"
            }`}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFilterCount > 0 ? "#fff" : "#374151"}
            />
            {activeFilterCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full items-center justify-center border-2 border-white">
                <Text className="text-white text-[10px] font-bold">
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Interactive Dynamic Chips Layout */}
        {activeFilterCount > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-3">
            {categoryId && categoryId !== "All" && categoryId !== "all" && (
              <FilterChip
                label={`Category: ${category?.name ?? "Selected"}`}
                onRemove={() => setCategoryId("All")}
              />
            )}
            {brand && brand !== "All" && (
              <FilterChip
                label={`Brand: ${brand}`}
                onRemove={() => setBrand("All")}
              />
            )}
            {(minPrice !== null || maxPrice !== null) && (
              <FilterChip
                label={`Price: ${priceLabel}`}
                onRemove={() => {
                  setMinPrice(null);
                  setMaxPrice(null);
                }}
              />
            )}
            {size && size !== "Any" && (
              <FilterChip
                label={`Size: ${size}`}
                onRemove={() => setSize("Any")}
              />
            )}
            {sortBy && sortBy !== "newest" && (
              <FilterChip
                label={`Sort: ${SORT_LABELS[sortBy]}`}
                onRemove={() => setSortBy("newest")}
              />
            )}
          </View>
        )}
      </View>

      {/* Grid Shelf Output */}
      <View className="flex-1 px-3.5">
        {/* Re-balanced gutter sizing for 2-column clean mapping */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#111827" />
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <SearchProductCard
                item={item}
                getProductImageUrl={getProductImageUrl}
                onWishlistPress={() => handleWishlistToggle(item)}
                isWishlisted={isWishlisted(item.id)}
              />
            )}
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 5 }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center pt-24">
                <Text className="text-zinc-400 font-medium text-base mt-4 text-center">
                  No Sneakers match your criteria.{"\n"}Try cleaning up your
                  selections.
                </Text>
                {activeFilterCount > 0 && (
                  <TouchableOpacity
                    className="mt-5 bg-zinc-900 px-6 py-2.5 rounded-full"
                    onPress={resetFilters}
                  >
                    <Text className="text-white font-semibold text-sm">
                      Reset Everything
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      <FilterModal
        isVisible={showFilters}
        onClose={() => setShowFilters(false)}
      />
    </SafeAreaView>
  );
};

export default Search;
