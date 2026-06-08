import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useWishlistStore, WishlistItem } from "@/store/wishlistStore";
import { WishlistProductCard } from "@/components/wishlist/WishlistProductCard";
import EmptyWishlist from "@/components/wishlist/WishListRenderState";
import Toast from "react-native-toast-message";
import { useCategoryStore } from "@/store/categoryStore";

const WishlistScreen = () => {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();

  const { categories } = useCategoryStore();

  // Connect Zustand store state selectors
  const items = useWishlistStore((state) => state.items);
  const isLoading = useWishlistStore((state) => state.isLoading);
  const fetchUserWishlist = useWishlistStore(
    (state) => state.fetchUserWishlist,
  );
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const [refreshing, setRefreshing] = useState(false);

  // Core handler to request data updates from the server
  const loadWishlistData = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const token = await getToken();

      if (token) {
        await fetchUserWishlist(token);
      }
    } catch (error) {
      console.error("Error updating wishlist view layer:", error);
    }
  }, [isSignedIn, getToken, fetchUserWishlist]);

  // Sync state on base initialization mounts
  useEffect(() => {
    loadWishlistData();
  }, [loadWishlistData]);

  // Handle pull-to-refresh interactions cleanly
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await loadWishlistData();
    } finally {
      setRefreshing(false);
    }
  }, [loadWishlistData]);

  const handleWishlistToggle = async (item: WishlistItem) => {
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
        productId: item.productId,
        categoryId: item.categoryId,
        name: item.name,
        brand: item.brand,
        basePrice: Number(item.basePrice),
        salePrice: Number(item.salePrice),
        discountPercent: item.discountPercent,
        averageRating: Number(item.averageRating),
        baseImageUrl: item.baseImageUrl,
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
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* HEADER SECTION STACK */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-zinc-100">
        <View>
          <Text className="text-2xl font-black tracking-tight text-zinc-900">
            Favorites
          </Text>
          {items.length > 0 && (
            <Text className="text-xs font-medium text-zinc-400 mt-0.5">
              {items.length} {items.length === 1 ? "item" : "items"} saved
            </Text>
          )}
        </View>
      </View>

      {/* CONDITIONAL LAYOUT STATE ROUTER */}
      {isLoading && !refreshing && items.length === 0 ? (
        <View className="flex-1 items-center justify-center bg-transparent">
          <ActivityIndicator size="small" color="#18181b" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.productId}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            items.length === 0
              ? { flex: 1 }
              : { paddingHorizontal: 10, paddingVertical: 12 }
          }
          ListEmptyComponent={
            <EmptyWishlist onPress={() => router.push("/search")} />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#18181b" // Match loading color scale for iOS
              colors={["#18181b"]} // Match loading color scale for Android
            />
          }
          renderItem={({ item }: { item: WishlistItem }) => (
            <WishlistProductCard
              item={item}
              onRemovePress={() => handleWishlistToggle(item)}
              categoryName={categories.find((c) => c.id === item.categoryId)?.name || "Sneakers"}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default WishlistScreen;
