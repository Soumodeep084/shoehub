import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/price.utils";

export default function Cart() {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();

  const {
    items,
    isLoading,
    fetchUserCart,
    updateQuantity,
    removeFromCart,
    getCartCount,
    getCartTotal,
  } = useCartStore();

  const [refreshing, setRefreshing] = useState(false);
  // TRACK INDIVIDUAL LOADING ITEMS BY VARIANT ID
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  const loadCartData = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (token) {
        await fetchUserCart(token);
      }
    } catch (error: any) {
      console.error("Error updating cart view layer:", error);
      Toast.show({
        type: "error",
        text1: "Sync Failed",
        text2: error.message || "Could not sync your cart with the server.",
      });
    }
  }, [isSignedIn, getToken, fetchUserCart]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCartData();
    } finally {
      setRefreshing(false);
    }
  }, [loadCartData]);

  const handleIncrease = async (variantId: string, quantity: number) => {
    if (loadingItems[variantId]) return; // Guard clause against double taps

    const token = await getToken();
    if (!token) return;

    setLoadingItems((prev) => ({ ...prev, [variantId]: true }));
    try {
      await updateQuantity(token, variantId, quantity + 1);
      Toast.show({
        type: "success",
        text1: "Quantity Updated",
        text2: "Item quantity successfully increased.",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Stock Limit Reached",
        text2: error.message || "Unable to update item quantity.",
      });
    } finally {
      setLoadingItems((prev) => ({ ...prev, [variantId]: false }));
    }
  };

  const handleDecrease = async (
    variantId: string,
    quantity: number,
    name: string,
  ) => {
    if (loadingItems[variantId]) return; // Guard clause

    const token = await getToken();
    if (!token) return;

    if (quantity <= 1) {
      Alert.alert(
        "Remove Item",
        `Do you want to remove ${name} from your cart?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              setLoadingItems((prev) => ({ ...prev, [variantId]: true }));
              try {
                await removeFromCart(token, variantId);
                Toast.show({
                  type: "success",
                  text1: "Item Removed",
                  text2: "Item successfully cleared from your cart.",
                });
              } catch (error: any) {
                Toast.show({
                  type: "error",
                  text1: "Deletion Failed",
                  text2:
                    error.message || "Something went wrong removing the item.",
                });
                setLoadingItems((prev) => ({ ...prev, [variantId]: false }));
              }
            },
          },
        ],
      );
      return;
    }

    setLoadingItems((prev) => ({ ...prev, [variantId]: true }));
    try {
      await updateQuantity(token, variantId, quantity - 1);
      Toast.show({
        type: "success",
        text1: "Quantity Updated",
        text2: "Item quantity successfully decreased.",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error.message || "Unable to decrease quantity.",
      });
    } finally {
      setLoadingItems((prev) => ({ ...prev, [variantId]: false }));
    }
  };

  const handleRemove = async (variantId: string, name: string) => {
    if (loadingItems[variantId]) return;

    const token = await getToken();
    if (!token) return;

    Alert.alert(
      "Remove Item",
      `Do you want to remove ${name} from your cart?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setLoadingItems((prev) => ({ ...prev, [variantId]: true }));
            try {
              await removeFromCart(token, variantId);
              Toast.show({
                type: "success",
                text1: "Item Removed",
                text2: "Item successfully cleared from your cart.",
              });
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Deletion Failed",
                text2: error.message || "Could not reach server to drop item.",
              });
              setLoadingItems((prev) => ({ ...prev, [variantId]: false }));
            }
          },
        },
      ],
    );
  };

  const cartTotal = getCartTotal();
  const cartCount = getCartCount();

  const SHIPPING_THRESHOLD = 1000;
  const STANDARD_SHIPPING = 99;

  const shippingFee = cartTotal >= SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;

  const totalSavings = items.reduce(
    (total, item) =>
      total + (Number(item.basePrice) - Number(item.salePrice)) * item.quantity,
    0,
  );

  const finalTotal = cartTotal + shippingFee;

  if (isLoading && !refreshing && items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="small" color="#18181b" />
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="relative mb-8 items-center justify-center">
            <View className="absolute h-32 w-32 rounded-full bg-zinc-50/50 scale-105 border border-zinc-50" />
            <View className="h-24 w-24 items-center justify-center rounded-full bg-white border border-zinc-100/80 shadow-xl shadow-zinc-200/50">
              <Ionicons name="cart-outline" size={38} color="#18181b" />
            </View>
          </View>

          <Text className="text-2xl font-black tracking-tight text-zinc-900 text-center mb-3">
            Your Cart Is Empty
          </Text>
          <Text className="text-[14px] text-zinc-400 text-center leading-6 max-w-[260px] font-medium mb-10">
            Looks like you haven't curated any items into your shopping cart
            yet.
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/explore" as any)}
            activeOpacity={0.8}
            className="w-full max-w-[220px] bg-zinc-950 h-14 rounded-2xl shadow-lg shadow-zinc-950/20 flex-row items-center justify-center gap-2"
          >
            <Text className="text-white font-bold tracking-wide text-sm">
              Explore Shop
            </Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color="#ffffff"
              className="mt-0.5"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 py-5 bg-white border-b border-zinc-100">
        <Text className="text-3xl font-black tracking-tight text-zinc-950">
          Your Shopping Cart
        </Text>
        <Text className="text-zinc-400 mt-0.5 font-semibold text-xs uppercase tracking-wider">
          {cartCount} item{cartCount !== 1 ? "s" : ""} added in cart
        </Text>
      </View>

      {/* CART LIST */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.variantId}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#18181b"
            colors={["#18181b"]}
          />
        }
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 220,
        }}
        renderItem={({ item }) => {
          const isItemLoading = !!loadingItems[item.variantId];

          return (
            <View className="bg-white rounded-[24px] border border-zinc-100/80 shadow-2xl shadow-black/5 overflow-hidden mb-4">
              <TouchableOpacity
                onPress={() => router.push(`/product/${item.productId}` as any)}
                activeOpacity={0.7}
                disabled={isItemLoading}
                className={`flex-row p-4 ${isItemLoading ? "opacity-60" : ""}`}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  className="w-24 h-24 rounded-2xl bg-zinc-100"
                  resizeMode="cover"
                />

                <View className="flex-1 ml-4 justify-between">
                  <View>
                    <Text
                      className="text-[10px] uppercase tracking-[1.2px] text-zinc-400 font-bold"
                      numberOfLines={1}
                    >
                      {item.brand}
                    </Text>
                    <Text
                      className="text-base font-bold tracking-tight text-zinc-900 mt-0.5"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>

                    <View className="flex-row gap-2 mt-2">
                      <View className="bg-zinc-50 border border-zinc-100 px-2.5 py-0.5 rounded-lg">
                        <Text className="text-[11px] font-bold text-zinc-500">
                          US {item.size}
                        </Text>
                      </View>
                      <View className="bg-zinc-50 border border-zinc-100 px-2.5 py-0.5 rounded-lg">
                        <Text className="text-[11px] font-bold text-zinc-500">
                          {item.color}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row items-baseline gap-2 mt-2">
                    <Text className="text-base font-black text-zinc-950">
                      {formatPrice(item.salePrice)}
                    </Text>
                    {item.basePrice > item.salePrice && (
                      <Text className="text-zinc-400 line-through text-xs font-medium">
                        {formatPrice(item.basePrice)}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              <View className="border-t border-zinc-50 px-4 py-3 bg-zinc-50/50 flex-row items-center justify-between">
                <View
                  className={`flex-row items-center bg-white border border-zinc-200/60 rounded-full shadow-sm ${
                    isItemLoading ? "opacity-40" : ""
                  }`}
                >
                  <TouchableOpacity
                    onPress={() =>
                      handleDecrease(item.variantId, item.quantity, item.name)
                    }
                    disabled={isItemLoading}
                    hitSlop={8}
                    className="w-8 h-8 items-center justify-center"
                  >
                    <Ionicons name="remove" size={14} color="#18181b" />
                  </TouchableOpacity>

                  <Text className="font-bold text-zinc-900 text-xs min-w-[24px] text-center">
                    {item.quantity}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      handleIncrease(item.variantId, item.quantity)
                    }
                    disabled={isItemLoading}
                    hitSlop={8}
                    className="w-8 h-8 items-center justify-center"
                  >
                    <Ionicons name="add" size={14} color="#18181b" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => handleRemove(item.variantId, item.name)}
                  disabled={isItemLoading}
                  activeOpacity={0.7}
                  className={`flex-row items-center gap-1.5 px-2 py-1 ${
                    isItemLoading ? "opacity-30" : ""
                  }`}
                >
                  <Ionicons name="trash-outline" size={15} color="#ef4444" />
                  <Text className="text-red-500 font-bold text-xs">Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View className="mt-6">
            {/* FREE SHIPPING PROGRESS */}
            {cartTotal < SHIPPING_THRESHOLD ? (
              <View className="mb-4 bg-amber-50 border border-amber-200 rounded-3xl p-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="gift-outline" size={18} color="#d97706" />
                  <Text className="flex-1 text-amber-700 text-xs font-bold leading-5">
                    Add products worth{" "}
                    {formatPrice(SHIPPING_THRESHOLD - cartTotal)} more and
                    unlock FREE shipping.
                  </Text>
                </View>
              </View>
            ) : (
              <View className="mb-4 bg-emerald-50 border border-emerald-200 rounded-3xl p-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                  <Text className="text-emerald-700 text-xs font-bold">
                    Congratulations! You unlocked FREE shipping.
                  </Text>
                </View>
              </View>
            )}

            <View className="bg-white rounded-[28px] border border-zinc-100 overflow-hidden">
              {/* HEADER */}
              <View className="px-6 pt-6 pb-5">
                <Text className="text-lg font-black text-zinc-950">
                  Order Summary
                </Text>

                <Text className="text-xs text-zinc-400 mt-1">
                  Review your order before checkout
                </Text>
              </View>

              <View className="h-[1px] bg-zinc-100" />

              {/* ITEM BREAKDOWN */}
              <View className="px-4 py-5">
                <View className="flex-row justify-between mb-3 text-black">
                  <Text className="flex-1 text-[11px] uppercase tracking-wider font-black ">
                    Item
                  </Text>

                  <Text className="w-16 text-right text-[11px] uppercase tracking-wider font-black">
                    Qty
                  </Text>

                  <Text className="w-24 text-right text-[11px] uppercase tracking-wider font-black ">
                    Total
                  </Text>
                </View>
                {items.map((item) => (
                  <View
                    key={item.variantId}
                    className="flex-row items-center py-4 border-b border-zinc-50"
                  >
                    {/* Product Info */}
                    <View className="flex-1 pr-3">
                      <Text
                        numberOfLines={1}
                        className="text-sm font-semibold text-zinc-900"
                      >
                        {item.name}
                      </Text>

                      <Text className="text-xs text-zinc-400 mt-1">
                        Size: {item.size}, Color: {item.color}
                      </Text>
                    </View>

                    {/* Qty */}
                    <View className="w-16 items-center">
                      <Text className="text-sm font-bold text-zinc-600">
                        {item.quantity}
                      </Text>
                    </View>

                    {/* Price */}
                    <View className="w-28 items-end">
                      <Text className="font-black text-zinc-950">
                        {formatPrice(item.salePrice * item.quantity)}
                      </Text>

                      {item.basePrice > item.salePrice && (
                        <>
                          <Text className="text-xs line-through text-zinc-400">
                            {formatPrice(item.basePrice * item.quantity)}
                          </Text>

                          <Text className="text-[11px] font-bold text-emerald-600">
                            Saved{" "}
                            {formatPrice(
                              (item.basePrice - item.salePrice) * item.quantity,
                            )}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              <View className="h-[1px] bg-zinc-100" />

              {/* BILL DETAILS */}
              <View className="px-6 py-5">
                <View className="flex-row justify-between mb-4">
                  <Text className="text-zinc-500 text-sm">Subtotal</Text>

                  <Text className="font-semibold text-zinc-900">
                    {formatPrice(cartTotal)}
                  </Text>
                </View>

                <View className="flex-row justify-between mb-4">
                  <Text className="text-zinc-500 text-sm">Shipping Fee</Text>

                  {shippingFee === 0 ? (
                    <Text className="font-bold text-emerald-600">FREE</Text>
                  ) : (
                    <Text className="font-semibold text-zinc-900">
                      {formatPrice(shippingFee)}
                    </Text>
                  )}
                </View>

                <View className="flex-row justify-between mb-4">
                  <Text className="text-zinc-500 text-sm">Discount Saved</Text>

                  <Text className="font-bold text-emerald-600">
                    -{formatPrice(totalSavings)}
                  </Text>
                </View>

                <View className="h-[1px] bg-zinc-100 my-4" />

                <View className="flex-row justify-between">
                  <Text className="text-base font-black text-zinc-950">
                    Grand Total
                  </Text>

                  <Text className="text-2xl font-black tracking-tight text-zinc-950">
                    {formatPrice(finalTotal)}
                  </Text>
                </View>
              </View>
            </View>

            {/* TRUST BADGES */}
            <View className="mt-5 bg-white rounded-[28px] border border-zinc-100 p-5">
              <View className="flex-row items-center gap-3 mb-4">
                <Ionicons name="shield-checkmark" size={18} color="#22c55e" />

                <Text className="text-sm font-semibold text-zinc-700">
                  Secure payments with industry-standard encryption
                </Text>
              </View>

              <View className="flex-row items-center gap-3 mb-4">
                <Ionicons name="refresh-circle" size={18} color="#22c55e" />

                <Text className="text-sm font-semibold text-zinc-700">
                  Easy 7-day return policy on eligible products
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                <Ionicons name="rocket-outline" size={18} color="#22c55e" />

                <Text className="text-sm font-semibold text-zinc-700">
                  Fast delivery across India
                </Text>
              </View>
            </View>
          </View>
        }
      />

      {/* STICKY FOOTER */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-6 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">
              Grand Total
            </Text>

            <Text className="text-2xl font-black text-zinc-950">
              {formatPrice(finalTotal)}
            </Text>
          </View>

          <Text className="text-xs text-emerald-600 font-bold">
            {shippingFee === 0 ? "Free Shipping" : "Standard Shipping"}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          className="h-14 rounded-2xl bg-zinc-950 items-center justify-center"
        >
          <Text className="text-white font-black tracking-widest text-xs uppercase">
            Proceed To Checkout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
