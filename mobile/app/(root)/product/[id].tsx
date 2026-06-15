import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice } from "@/utils/price.utils";
import type { Product } from "@/types";
import { ENV } from "@/config/env";
import MeasurementChartModal from "@/components/products/MeasurementChartModal";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@clerk/expo";
import Toast from "react-native-toast-message";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BACKEND_URL = ENV.API_URL;

export default function ProductDetailScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlistStore();
  const { addToCart, isInCart } = useCartStore();

  const mainListRef = useRef<FlatList>(null);

  // Core Data & UI State Framework
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [sizeChartVisible, setSizeChartVisible] = useState(false);

  const handleBack = () => {
    if (from === "search") {
      router.replace("/(root)/(tabs)/search");
    } else if (from === "wishlist") {
      router.replace("/(root)/(tabs)/wishlist");
    } else if (from === "cart") {
      router.replace("/(root)/(tabs)/cart");
    }else{
      router.replace("/(root)/(tabs)");
    }
  };

  // Fetch individual product schema layout payload
  useEffect(() => {
    if (!id) return;
    const fetchProductDetails = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);

          if (data.variants && data.variants.length > 0) {
            const firstInStock = data.variants.find(
              (v: { stock: number }) => v.stock > 0,
            );
            if (firstInStock) {
              setSelectedSize(firstInStock.size);
              setSelectedColor(firstInStock.color);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching product detail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  // Gallery Organizer: Prioritize Primary Images safely
  const sortedImages = useMemo(() => {
    if (!product?.images || product.images.length === 0) {
      return [
        {
          id: "placeholder",
          imageUrl:
            "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519",
        },
      ];
    }
    return [...product.images].sort((a, b) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return a.sortOrder - b.sortOrder;
    });
  }, [product]);

  // Dynamic Size Allocator
  const uniqueSizes = useMemo(() => {
    if (!product?.variants) return [];
    const sizesMap = product.variants.map((v) => v.size);
    return Array.from(new Set(sizesMap)).sort(
      (a, b) => parseFloat(a) - parseFloat(b),
    );
  }, [product]);

  // Dynamic Color Allocator
  const availableColors = useMemo(() => {
    if (!selectedSize || !product?.variants) {
      return [];
    }

    return Array.from(
      new Set(
        product.variants
          .filter((v) => v.size === selectedSize)
          .map((v) => v.color),
      ),
    );
  }, [selectedSize, product]);

  // Real-time Stock Status Monitor
  const currentStockStatus = useMemo(() => {
    if (!selectedSize || !product?.variants) return null;
    const variant = product.variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor,
    );
    const totalStock = variant?.stock ?? 0;

    if (totalStock <= 0)
      return {
        label: "Out of Stock",
        style: "text-red-500 bg-red-50 border-red-100",
      };
    if (totalStock <= 2)
      return {
        label: `Only ${totalStock} pairs left!`,
        style: "text-amber-600 bg-amber-50 border-amber-100",
      };
    return {
      label: "In Stock",
      style: "text-emerald-400 bg-emerald-50 border-emerald-100",
    };
  }, [selectedSize, selectedColor, product]);

  const selectedVariant = useMemo(() => {
    if (!selectedSize || !selectedColor || !product?.variants) {
      return null;
    }

    return (
      product.variants.find(
        (variant) =>
          variant.size === selectedSize && variant.color === selectedColor,
      ) || null
    );
  }, [selectedSize, selectedColor, product]);

  const alreadyInCart = selectedVariant ? isInCart(selectedVariant.id) : false;

  // Extensible Product Metadata Fallback Blocks
  const highlights = useMemo(() => {
    return (
      (product as any)?.highlights ?? [
        "Premium leather upper layout panels",
        "Signature high-performance air cushioning",
        "Engineered high-traction rubber outer track",
        "Limited high-tier boutique release",
      ]
    );
  }, [product]);

  const specifications = useMemo(() => {
    return (
      (product as any)?.specifications ?? [
        { label: "Material", value: "Premium Full-Grain Leather" },
        { label: "Fit Profile", value: "True to Size (Regular)" },
        { label: "Lacing Lockout", value: "Traditional Symmetric Lacing" },
        { label: "Origin Location", value: "Imported Premium Quality" },
      ]
    );
  }, [product]);

  const shippingInfo = useMemo(() => {
    return (
      (product as any)?.shippingInfo ?? {
        estimatedDelivery: "3 - 5 Business Days via Priority Express",
        returnPolicy: "Complimentary 7-Day Hassle-Free Returns Shield",
      }
    );
  }, [product]);

  const scrollToImage = (index: number) => {
    setActiveImageIndex(index);
    mainListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
  };

  const handleScrollEngine = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const computedIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (
      computedIndex !== activeImageIndex &&
      computedIndex >= 0 &&
      computedIndex < sortedImages.length
    ) {
      setActiveImageIndex(computedIndex);
    }
  };

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
        baseImageUrl: item.images?.[0]?.imageUrl || "",
      });

      Toast.show({
        type: "success",
        text1: "Wishlist updated",
        text2: "Your changes were saved",
      });
    } catch (error) {
      console.error("Wishlist toggle error:", error);

      Toast.show({
        type: "error",
        text1: "Something went wrong",
        text2: "Please try again later",
      });
    }
  };

  const handleAddToCart = async (product: Product, alreadyInCart: boolean) => {
    try {
      if (!selectedVariant) {
        Toast.show({
          type: "error",
          text1: "Select a variant",
          text2: "Please choose size and color",
        });

        return;
      }

      const token = await getToken();

      if (!token) {
        Toast.show({
          type: "error",
          text1: "Login required",
          text2: "Please log in to use cart",
        });
        return;
      }

      await addToCart(token, {
        productId: product.id,
        variantId: selectedVariant.id,

        name: product.name,
        brand: product.brand,

        salePrice: Number(product.salePrice),
        basePrice: Number(product.basePrice),

        imageUrl: sortedImages[0]?.imageUrl || "",
        size: selectedVariant.size,
        color: selectedVariant.color,

        quantity: 1,
      });

      Toast.show({
        type: "success",
        text1: `${alreadyInCart ? "Updated" : "Added"} to cart`,
        text2: `${product.name} ${alreadyInCart ? "updated" : "added"} successfully`,
      });
    } catch (error) {
      console.error(error);

      Toast.show({
        type: "error",
        text1: "Failed",
        text2: "Could not add item to cart",
      });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-zinc-50 items-center justify-center">
        <ActivityIndicator size="large" color="#18181b" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-zinc-50 items-center justify-center p-6">
        <Text className="text-zinc-900 font-bold text-lg">
          Product Asset Missing
        </Text>
        <TouchableOpacity
          className="mt-4 bg-zinc-950 px-6 py-3 rounded-full"
          onPress={handleBack}
        >
          <Text className="text-white font-semibold">Return To Shop</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const parsedRating = parseFloat(product.averageRating || "0");

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      {/* 1. FIXED PREMIUM HEADER ACTION TRACK BAR */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white">
        <TouchableOpacity
          onPress={handleBack}
          className="flex-row items-center gap-2 py-1"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#18181b" />
          <Text className="text-sm font-bold text-zinc-900 ">
            Shop
          </Text>
        </TouchableOpacity>

        <Text
          className="text-xs font-black uppercase text-zinc-900 max-w-[160px]"
          numberOfLines={1}
        >
          {product.brand}
        </Text>

        <TouchableOpacity
          onPress={() => handleWishlistToggle(product)}
          className="w-9 h-9 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100/80"
          activeOpacity={0.7}
        >
          <Ionicons
            name={isWishlisted(product.id) ? "heart" : "heart-outline"}
            size={18}
            color={isWishlisted(product.id) ? "#ef4444" : "#18181b"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* 2. PREMIUM HORIZONTAL FULL-WIDTH CAROUSEL GALLERY */}
        <View
          className="relative bg-zinc-50"
          style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.05 }}
        >
          <FlatList
            ref={mainListRef}
            data={sortedImages}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScrollEngine}
            scrollEventThrottle={32}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.05 }}
                resizeMode="cover"
              />
            )}
          />

          {/* Luxury Floating Numerical Counter Frame Overlay */}
          <View className="absolute right-5 bottom-5 bg-black/80 px-3 py-1.5 rounded-full border border-white/10">
            <Text className="text-[10px] font-black tracking-widest text-white uppercase">
              {activeImageIndex + 1} / {sortedImages.length}
            </Text>
          </View>

          {/* Conditional Discount Tag Accent */}
          {product.discountPercent > 0 && (
            <View className="absolute left-5 bottom-5 bg-black px-3 py-1.5 rounded-full">
              <Text className="text-[10px] font-black uppercase tracking-wider text-white">
                {product.discountPercent}% Off Elite Code
              </Text>
            </View>
          )}
        </View>

        {/* 3. SCROLLABLE SYNCED PREVIEW THUMBNAIL TRACK */}
        {sortedImages.length > 1 && (
          <View className="py-4 border-b border-zinc-100 bg-white">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            >
              {/* Change this block */}
              {sortedImages.map((img, idx) => {
                const isCurrent = idx === activeImageIndex;
                return (
                  <TouchableOpacity
                    key={img.id}
                    onPress={() => scrollToImage(idx)}
                    activeOpacity={0.8}
                    className={`w-16 h-16 rounded-[14px] overflow-hidden bg-zinc-50 border-2 ${
                      isCurrent
                        ? "border-zinc-950"
                        : "border-transparent opacity-50"
                    }`}
                    style={{
                      transform: [{ scale: isCurrent ? 1.05 : 1.0 }], // Safe native transform handling!
                    }}
                  >
                    <Image
                      source={{ uri: img.imageUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 4. PREMIUM COMPREHENSIVE INFORMATION INTERFACE ARCHITECTURE */}
        <View className="mt-6 px-6">
          {/* Section A: Brand Name Line */}
          <Text className="text-xs font-bold uppercase tracking-[2.5px] text-zinc-400">
            {product.brand}
          </Text>

          {/* Section B: Product Title Block */}
          <Text className="text-[26px] font-black tracking-tight text-zinc-900 mt-1 leading-8">
            {product.name}
          </Text>

          {/* Section C: Category Tag Routing Info */}
          <Text className="text-sm font-semibold text-zinc-500 mt-1.5 uppercase tracking-wide">
            {product.category?.name || "Sneaker Silhouette"}
          </Text>

          {/* Section D: Pricing Deck Framework */}
          <View className="flex-row items-center justify-between mt-5 pb-5 border-b border-zinc-100">
            <View className="flex-row items-baseline gap-3">
              <Text className="text-2xl font-black tracking-tight text-zinc-950">
                {formatPrice(product.salePrice)}
              </Text>
              {product.discountPercent > 0 && (
                <Text className="text-base font-semibold text-zinc-400 line-through">
                  {formatPrice(product.basePrice).replace(" /-", "")}
                </Text>
              )}
            </View>

            {/* Section E: Editorial Star Scoring Block Badge */}
            <View className="flex-row items-center gap-1 bg-zinc-50 border border-zinc-100/80 px-3 py-1.5 rounded-xl">
              <Ionicons name="star" size={13} color="#f59e0b" />
              <Text className="text-xs font-black text-zinc-900">
                {parsedRating.toFixed(1)}
              </Text>
              <Text className="text-[11px] font-bold text-zinc-400">
                ({product.ratingCount})
              </Text>
            </View>
          </View>

          {/* 5. SELECTABLE ALLOCATIONS: SIZE GRID PANEL ENGINE */}
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-baseline gap-2">
                <Text className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  Select Size
                </Text>
                {selectedSize && (
                  <Text className="text-xs font-bold text-zinc-400">
                    (US Men)
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setSizeChartVisible(true)}
                activeOpacity={0.7}
                className="flex-row items-center gap-1.5 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100"
              >
                <Ionicons name="git-commit-outline" size={14} color="#2563eb" />
                <Text className="text-xs font-black text-blue-600 tracking-wide uppercase">
                  Size Guide
                </Text>
              </TouchableOpacity>
            </View>

            {/* Size Button Matrix Layout */}
            <View className="flex-row flex-wrap gap-2.5">
              {uniqueSizes.map((size) => {
                const isSelected = selectedSize === size;

                const variantsForSize =
                  product.variants?.filter((v) => v.size === size) || [];

                const combinedStock = variantsForSize.reduce(
                  (acc, curr) => acc + curr.stock,
                  0,
                );

                const isOutOfStock = combinedStock <= 0;

                return (
                  <TouchableOpacity
                    key={size}
                    disabled={isOutOfStock}
                    onPress={() => {
                      setSelectedSize(size);

                      const firstAvailableVariant = product.variants?.find(
                        (v) => v.size === size && v.stock > 0,
                      );

                      setSelectedColor(firstAvailableVariant?.color ?? null);
                    }}
                    activeOpacity={isOutOfStock ? 1 : 0.5}
                    className={`h-12 min-w-[56px] px-5 items-center justify-center rounded-xl relative overflow-hidden ${
                      isSelected
                        ? "bg-zinc-950 border border-zinc-950"
                        : isOutOfStock
                          ? "bg-zinc-50/80 border border-zinc-100"
                          : "bg-white border border-zinc-200"
                    }`}
                  >
                    <Text
                      className={`text-sm font-black ${
                        isSelected
                          ? "text-white"
                          : isOutOfStock
                            ? "text-zinc-300"
                            : "text-zinc-800"
                      }`}
                    >
                      {size}
                    </Text>

                    {isOutOfStock && (
                      <View className="absolute w-[150%] h-[1px] bg-zinc-200 rotate-[30deg]" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="mt-6">
              <Text className="text-xs font-black uppercase tracking-wider text-zinc-900 mb-4">
                Select Color
              </Text>

              <View className="flex-row flex-wrap gap-3">
                {availableColors.map((color) => {
                  const isSelected = selectedColor === color;

                  const colorStock =
                    product.variants
                      ?.filter(
                        (v) => v.size === selectedSize && v.color === color,
                      )
                      .reduce((acc, curr) => acc + curr.stock, 0) ?? 0;

                  const isOutOfStock = colorStock <= 0;

                  return (
                    <TouchableOpacity
                      key={color}
                      disabled={isOutOfStock}
                      onPress={() => setSelectedColor(color)}
                      className={`px-4 py-3 rounded-xl border ${
                        isSelected
                          ? "bg-zinc-950 border-zinc-950"
                          : isOutOfStock
                            ? "bg-zinc-50 border-zinc-100"
                            : "bg-white border-zinc-200"
                      }`}
                    >
                      <Text
                        className={`font-bold ${
                          isSelected
                            ? "text-white"
                            : isOutOfStock
                              ? "text-zinc-300"
                              : "text-zinc-900"
                        }`}
                      >
                        {color}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Stock Metric Live Broadcast Strip */}
            {currentStockStatus && (
              <View
                className={`mt-3 flex-row items-center gap-2 px-3 py-2 rounded-xl border ${currentStockStatus.style}`}
              >
                <View className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                <Text className="text-xs font-bold tracking-tight">
                  {currentStockStatus.label}
                </Text>
              </View>
            )}
          </View>

          {/* 6. EXTENSIBLE CORE HIGHLIGHTS CARD LAYOUT BLOCK */}
          <View className="mt-8">
            <Text className="text-xs font-black uppercase tracking-wider text-zinc-900 mb-3">
              Product Highlights
            </Text>
            <View className="gap-2">
              {highlights.map((highlight: string, i: number) => (
                <View
                  key={i}
                  className="flex-row items-center gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100/50"
                >
                  <Ionicons name="checkmark-circle" size={18} color="#18181b" />
                  <Text className="text-sm font-semibold text-zinc-700 tracking-tight">
                    {highlight}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 7. SPECIFICATIONS DETAILED TABLE CARD SECTION */}
          <View className="mt-8">
            <Text className="text-xs font-black uppercase tracking-wider text-zinc-900 mb-3">
              Specifications
            </Text>
            <View className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-2xl shadow-black/[0.01]">
              {specifications.map((spec: any, i: number) => (
                <View
                  key={i}
                  className={`flex-row items-center justify-between p-4 ${
                    i !== specifications.length - 1
                      ? "border-b border-zinc-100"
                      : ""
                  }`}
                >
                  <Text className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                    {spec.label}
                  </Text>
                  <Text className="text-sm font-black text-zinc-800">
                    {spec.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 8. EDITORIAL ARCHIVAL DESCRIPTION CONTENT BLOCK */}
          <View className="mt-8">
            <Text className="text-xs font-black uppercase tracking-wider text-zinc-900 mb-2">
              Product Story
            </Text>
            <Text className="text-sm text-zinc-500 leading-6 tracking-wide font-normal text-justify">
              {product.description ||
                "This curated high-performance silhouette matches legacy visual identity details back into clean, streetwear-ready utility formats. Optimized padding combined with lightweight inner core stabilization arrays makes it a continuous staple pick for everyday rotations."}
            </Text>
          </View>

          {/* 9. SECURE LOGISTICS SHIPPING & RETURNS MATRIX BLOCK */}
          <View className="mt-8 gap-3">
            <View className="flex-row items-start gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              <Ionicons name="time-outline" size={20} color="#18181b" />
              <View className="flex-1">
                <Text className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                  Estimated Delivery
                </Text>
                <Text className="text-xs font-semibold text-zinc-500 mt-0.5">
                  {shippingInfo.estimatedDelivery}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#18181b"
              />
              <View className="flex-1">
                <Text className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                  Return Shield Policy
                </Text>
                <Text className="text-xs font-semibold text-zinc-500 mt-0.5">
                  {shippingInfo.returnPolicy}
                </Text>
              </View>
            </View>
          </View>

          {/* 10. REVIEWS INBOUND FALLBACK STANDALONE CORE DECK */}
          <View className="mt-8 border-t border-zinc-100 pt-6">
            <Text className="text-xs font-black uppercase tracking-wider text-zinc-900 mb-2">
              Verified Buyer Reviews
            </Text>
            <View className="bg-zinc-50/50 border border-dashed border-zinc-200 p-6 rounded-2xl items-center justify-center mt-2">
              <Ionicons name="chatbubbles-outline" size={22} color="#a1a1aa" />
              <Text className="text-sm font-bold text-zinc-800 mt-2">
                Product Reviews Coming Soon
              </Text>
              <Text className="text-xs text-zinc-400 mt-1 text-center leading-4 max-w-[220px]">
                We are actively processing verified purchase scoring datasets
                for this model.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 11. LUXURY STICKY FLOATING ATTACHMENT ACTION BAR */}
      <View className="bg-white border-t border-zinc-100 px-6 pt-4 pb-6 flex-row items-center gap-5 shadow-2xl shadow-black/20">
        <View className="flex-1">
          <Text className="text-[10px] font-black text-zinc-800 uppercase tracking-[1.5px]">
            Total Price
          </Text>
          <Text className="text-2xl font-black text-zinc-950 mt-0.5 tracking-tight">
            {formatPrice(product.salePrice)}
          </Text>

          <Text className="text-md font-black text-zinc-400 mt-0.5 tracking-tight line-through">
            {formatPrice(product.basePrice)}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleAddToCart(product, alreadyInCart)}
          disabled={!selectedVariant || selectedVariant.stock <= 0}
          className={`flex-[2] h-14 rounded-xl items-center justify-center shadow-md ${
            !selectedVariant || selectedVariant.stock <= 0
              ? "bg-zinc-300"
              : "bg-zinc-950"
          }`}
        >
          <Text className="text-white font-black text-xs uppercase tracking-[1.5px]">
            {alreadyInCart ? "Add One More to Cart" : "Add To Cart"}
          </Text>
        </TouchableOpacity>
      </View>

      <MeasurementChartModal
        isVisible={sizeChartVisible}
        onClose={() => setSizeChartVisible(false)}
        defaultTab="Men"
      />
    </SafeAreaView>
  );
}
