// import React, { useEffect, useState, useMemo, useRef } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   Image,
//   TouchableOpacity,
//   ActivityIndicator,
//   Dimensions,
//   FlatList,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { formatPrice } from "@/utils/price.utils";
// import type { Product } from "@/types";
// import { ENV } from "@/config/env";
// import MeasurementChartModal from "@/components/products/MeasurementChartModal";

// const { width: SCREEN_WIDTH } = Dimensions.get("window");
// const BACKEND_URL = ENV.API_URL;

// export default function ProductDetailScreen() {
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const router = useRouter();
//   const mainListRef = useRef<FlatList>(null);

//   // Data & UI State Management
//   const [product, setProduct] = useState<Product | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [activeImageIndex, setActiveImageIndex] = useState(0);
//   const [selectedSize, setSelectedSize] = useState<string | null>(null);
//   const [sizeChartVisible, setSizeChartVisible] = useState(false);

//   // Fetch individual product payload
//   useEffect(() => {
//     if (!id) return;
//     const fetchProductDetails = async () => {
//       try {
//         setIsLoading(true);
//         const res = await fetch(`${BACKEND_URL}/api/products/${id}`);
//         if (res.ok) {
//           const data = await res.json();
//           setProduct(data);

//           if (data.variants && data.variants.length > 0) {
//             const firstInStock = data.variants.find((v: any) => v.stock > 0);
//             if (firstInStock) setSelectedSize(firstInStock.size);
//           }
//         }
//       } catch (error) {
//         console.error("Error fetching product detail:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchProductDetails();
//   }, [id]);

//   // Track sorted gallery images
//   const sortedImages = useMemo(() => {
//     if (!product?.images || product.images.length === 0) {
//       return [
//         {
//           id: "placeholder",
//           imageUrl:
//             "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519",
//         },
//       ];
//     }
//     return [...product.images].sort((a, b) => {
//       if (a.isPrimary) return -1;
//       if (b.isPrimary) return 1;
//       return a.sortOrder - b.sortOrder;
//     });
//   }, [product]);

//   // Extract unique sorted sizes dynamically
//   const uniqueSizes = useMemo(() => {
//     if (!product?.variants) return [];
//     const sizesMap = product.variants.map((v) => v.size);
//     return Array.from(new Set(sizesMap)).sort(
//       (a, b) => parseFloat(a) - parseFloat(b),
//     );
//   }, [product]);

//   const scrollToImage = (index: number) => {
//     setActiveImageIndex(index);
//     mainListRef.current?.scrollToIndex({ index, animated: true });
//   };

//   if (isLoading) {
//     return (
//       <View className="flex-1 bg-zinc-50 items-center justify-center">
//         <ActivityIndicator size="large" color="#18181b" />
//       </View>
//     );
//   }

//   if (!product) {
//     return (
//       <View className="flex-1 bg-zinc-50 items-center justify-center p-6">
//         <Text className="text-zinc-900 font-bold text-lg">
//           Product Not Found
//         </Text>
//         <TouchableOpacity
//           className="mt-4 bg-zinc-900 px-6 py-2.5 rounded-full"
//           onPress={() => router.back()}
//         >
//           <Text className="text-white font-semibold">Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   const parsedRating = parseFloat(product.averageRating || "0");

//   return (
//     <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
//       {/* 1. FIXED PREMIUM HEADER BAR WITH EXPLICIT BACK NAVIGATION */}
//       <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-100">
//         <TouchableOpacity
//           onPress={() => router.back()}
//           className="flex-row items-center gap-1 py-1.5 pr-3"
//           activeOpacity={0.7}
//         >
//           <Ionicons name="arrow-back" size={22} color="#18181b" />
//           <Text className="text-sm font-bold text-zinc-900 tracking-tight">
//             Back to Shop
//           </Text>
//         </TouchableOpacity>

//         <Text
//           className="text-xs font-black uppercase tracking-widest text-zinc-400 max-w-[180px]"
//           numberOfLines={1}
//         >
//           {product.brand}
//         </Text>

//         <View className="w-10 h-10 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100">
//           <Ionicons name="heart-outline" size={18} color="#18181b" />
//         </View>
//       </View>

//       <ScrollView showsVerticalScrollIndicator={true} className="flex-1">
//         {/* 2. THE MEDIA CAROUSEL FRAME */}
//         <View
//           className="bg-zinc-50"
//           style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
//         >
//           <FlatList
//             ref={mainListRef}
//             data={sortedImages}
//             keyExtractor={(item) => item.id}
//             horizontal
//             pagingEnabled
//             showsHorizontalScrollIndicator={false}
//             onMomentumScrollEnd={(e) => {
//               const index = Math.round(
//                 e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
//               );
//               setActiveImageIndex(index);
//             }}
//             renderItem={({ item }) => (
//               <Image
//                 source={{ uri: item.imageUrl }}
//                 style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
//                 resizeMode="cover"
//               />
//             )}
//           />
//         </View>

//         {/* 3. VISIBLE THUMBNAIL TRACK (SCROLLBAR & NAV ALTERNATIVE) */}
//         {sortedImages.length > 1 && (
//           <View className="border-b border-zinc-100 py-3 bg-white">
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={true}
//               contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
//             >
//               {sortedImages.map((img, idx) => {
//                 const isCurrent = idx === activeImageIndex;
//                 return (
//                   <TouchableOpacity
//                     key={img.id}
//                     onPress={() => scrollToImage(idx)}
//                     activeOpacity={0.8}
//                     className={`w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 border-2 transition-all ${
//                       isCurrent
//                         ? "border-zinc-950 scale-105"
//                         : "border-transparent opacity-60"
//                     }`}
//                   >
//                     <Image
//                       source={{ uri: img.imageUrl }}
//                       className="w-full h-full"
//                       resizeMode="cover"
//                     />
//                   </TouchableOpacity>
//                 );
//               })}
//             </ScrollView>
//           </View>
//         )}

//         {/* 4. PRODUCT METRICS DECK */}
//         <View className="mt-5 px-6">
//           <View className="flex-row items-center gap-1.5">
//             <Text className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
//               {product.category?.name || "Sneakers"}
//             </Text>
//           </View>

//           <Text className="text-2xl font-black tracking-tight text-zinc-900 mt-1">
//             {product.name}
//           </Text>

//           <View className="flex-row items-center justify-between mt-3 pb-5 border-b border-zinc-100">
//             <View className="flex-row items-baseline gap-2.5">
//               <Text className="text-2xl font-black text-zinc-950">
//                 {formatPrice(product.salePrice)}
//               </Text>
//               {product.discountPercent > 0 && (
//                 <Text className="text-sm font-medium text-zinc-400 line-through">
//                   {formatPrice(product.basePrice).replace(" /-", "")}
//                 </Text>
//               )}
//             </View>

//             <View className="flex-row items-center gap-1 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-lg">
//               <Ionicons name="star" size={13} color="#f59e0b" />
//               <Text className="text-xs font-bold text-zinc-800">
//                 {parsedRating.toFixed(1)}
//               </Text>
//               <Text className="text-[11px] font-medium text-zinc-400">
//                 ({product.ratingCount})
//               </Text>
//             </View>
//           </View>

//           {/* 5. SIZE DECK WITH TOP-RIGHT CHART TRIGGER & STOCK LOCKS */}
//           <View className="mt-6">
//             <View className="flex-row items-center justify-between mb-4">
//               <Text className="text-xs font-black uppercase tracking-wider text-zinc-900">
//                 Select Size (US)
//               </Text>

//               <TouchableOpacity
//                 onPress={() => setSizeChartVisible(true)}
//                 activeOpacity={0.7}
//                 className="flex-row items-center gap-1 bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-100"
//               >
//                 <Ionicons name="list-outline" size={14} color="#2563eb" />
//                 <Text className="text-xs font-bold text-blue-600 tracking-wide">
//                   Size Guide
//                 </Text>
//               </TouchableOpacity>
//             </View>

//             {/* Sizes Buttons layout */}
//             <View className="flex-row flex-wrap gap-2.5">
//               {uniqueSizes.map((size) => {
//                 const isSelected = selectedSize === size;
//                 const matchingVariants =
//                   product.variants?.filter((v) => v.size === size) || [];
//                 const totalStockForSize = matchingVariants.reduce(
//                   (acc, curr) => acc + curr.stock,
//                   0,
//                 );
//                 const isOutOfStock = totalStockForSize <= 0;

//                 return (
//                   <TouchableOpacity
//                     key={size}
//                     disabled={isOutOfStock}
//                     onPress={() => setSelectedSize(size)}
//                     activeOpacity={isOutOfStock ? 1 : 0.7}
//                     className={`h-14 min-w-[64px] items-center justify-center px-4 rounded-xl relative overflow-hidden transition-all ${
//                       isSelected
//                         ? "bg-zinc-950 border border-zinc-950 shadow-sm"
//                         : isOutOfStock
//                           ? "bg-zinc-50 border border-zinc-100"
//                           : "bg-white border border-zinc-200"
//                     }`}
//                   >
//                     <Text
//                       className={`text-sm font-black ${
//                         isSelected
//                           ? "text-white"
//                           : isOutOfStock
//                             ? "text-zinc-300"
//                             : "text-zinc-800"
//                       }`}
//                     >
//                       {size}
//                     </Text>

//                     {/* Absolute Diagonal Lockout Line for Sold Out Sizes */}
//                     {isOutOfStock && (
//                       <View className="absolute w-[140%] h-[1.5px] bg-zinc-300 rotate-[35deg]" />
//                     )}
//                   </TouchableOpacity>
//                 );
//               })}
//             </View>
//           </View>

//           {/* Description Block */}
//           <View className="mt-8">
//             <Text className="text-xs font-black uppercase tracking-wider text-zinc-900 mb-2">
//               Product Overview
//             </Text>
//             <Text className="text-sm text-zinc-500 leading-6 tracking-wide font-normal">
//               {product.description ||
//                 "No dynamic overview details compiled for this shoe model variant asset yet."}
//             </Text>
//           </View>
//         </View>
//       </ScrollView>

//       {/* FIXED BOTTOM ACTION PANEL */}
//       <View className="bg-white border-t border-zinc-100 px-6 pt-3 pb-5 flex-row items-center gap-4 shadow-xl">
//         <View className="flex-1">
//           <Text className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
//             Total Price
//           </Text>
//           <Text className="text-xl font-black text-zinc-950 mt-0.5">
//             {formatPrice(product.salePrice)}
//           </Text>
//         </View>

//         <TouchableOpacity
//           activeOpacity={0.8}
//           className="flex-[2] h-14 bg-zinc-950 rounded-xl items-center justify-center"
//         >
//           <Text className="text-white font-bold text-sm uppercase tracking-wider">
//             Add to Bag
//           </Text>
//         </TouchableOpacity>
//       </View>

//       <MeasurementChartModal
//         isVisible={sizeChartVisible}
//         onClose={() => setSizeChartVisible(false)}
//       />
//     </SafeAreaView>
//   );
// }

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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BACKEND_URL = ENV.API_URL;

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mainListRef = useRef<FlatList>(null);

  // Core Data & UI State Framework
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeChartVisible, setSizeChartVisible] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

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
            const firstInStock = data.variants.find((v: any) => v.stock > 0);
            if (firstInStock) setSelectedSize(firstInStock.size);
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

  // Real-time Stock Status Monitor
  const currentStockStatus = useMemo(() => {
    if (!selectedSize || !product?.variants) return null;
    const relevantVariants = product.variants.filter(
      (v) => v.size === selectedSize,
    );
    const totalStock = relevantVariants.reduce(
      (acc, curr) => acc + curr.stock,
      0,
    );

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
  }, [selectedSize, product]);

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
          onPress={() => router.back()}
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
          onPress={() => router.back()}
          className="flex-row items-center gap-2 py-1"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#18181b" />
          <Text className="text-sm font-bold text-zinc-900 tracking-tight">
            Shop
          </Text>
        </TouchableOpacity>

        <Text
          className="text-xs font-black uppercase tracking-[2px] text-zinc-900 max-w-[160px]"
          numberOfLines={1}
        >
          {product.brand}
        </Text>

        <TouchableOpacity
          onPress={() => setIsWishlisted(!isWishlisted)}
          className="w-9 h-9 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100/80"
          activeOpacity={0.7}
        >
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={18}
            color={isWishlisted ? "#ef4444" : "#18181b"}
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
                    onPress={() => setSelectedSize(size)}
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
          <Text className="text-[10px] font-black text-zinc-400 uppercase tracking-[1.5px]">
            Total Price
          </Text>
          <Text className="text-2xl font-black text-zinc-950 mt-0.5 tracking-tight">
            {formatPrice(product.salePrice)}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-[2] h-14 bg-zinc-950 rounded-xl items-center justify-center shadow-md active:bg-zinc-900"
        >
          <Text className="text-white font-black text-xs uppercase tracking-[1.5px]">
            Add To Cart
          </Text>
        </TouchableOpacity>
      </View>

      <MeasurementChartModal
        isVisible={sizeChartVisible}
        onClose={() => setSizeChartVisible(false)}
      />
    </SafeAreaView>
  );
}
