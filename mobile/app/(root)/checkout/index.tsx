import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";
import Toast from "react-native-toast-message";
import { useStripe } from "@stripe/stripe-react-native";

// Stores
import { useCartStore } from "@/store/cartStore";
import { useOrderStore } from "@/store/orderStore";
import { useAddressStore } from "@/store/addressStore";

// Utils
import { formatPrice } from "@/utils/price.utils";

export default function CheckoutScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const { items, getCartTotal, clearCart } = useCartStore();
  const {
    createOrder,
    createPaymentIntent,
    updateOrderPaymentStatus,
    fetchOrders,
  } = useOrderStore();
  const {
    addresses = [],
    isLoading: isAddressesLoading,
    fetchAddresses,
  } = useAddressStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">(
    "ONLINE",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const subtotal = getCartTotal();
  const shippingFee = subtotal > 1000 ? 0 : 99;
  const discount = 0;
  const totalAmount = subtotal + shippingFee - discount;

  useEffect(() => {
    const loadData = async () => {
      const token = await getToken();
      if (token) await fetchAddresses(token);
    };
    loadData();
  }, [fetchAddresses, getToken]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  const handleProceedToPayment = async () => {
    if (!selectedAddressId) {
      Toast.show({
        type: "error",
        text1: "Missing Address",
        text2: "Please select a delivery address.",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const token = await getToken();
      if (!token)
        throw new Error("Authentication failed. Please sign in again.");

      let orderId = activeOrderId;

      // 1. Re-use existing order session or create a fresh backend entry row
      if (!orderId) {
        const orderData = await createOrder(
          token,
          selectedAddressId,
          paymentMethod,
        );
        if (!orderData?.orderId)
          throw new Error("Order setup processing failed");
        orderId = orderData.orderId;
        setActiveOrderId(orderId);
      }

      // ─── BRANCH A: CASH ON DELIVERY (COD) ──────────────────────────────
      if (paymentMethod === "COD") {
        clearCart();
        fetchOrders(token); // Refresh local orders cache to reflect new order in history
        setActiveOrderId(null);
        setIsProcessing(false);

        router.replace({
          pathname: "/checkout/success",
          params: { orderId, method: "COD" },
        });
        return;
      }

      // ─── BRANCH B: ONLINE STRIPE DISPATCH ──────────────────────────────
      const paymentData = await createPaymentIntent(token, orderId);
      if (!paymentData?.clientSecret)
        throw new Error("Stripe network initialization failed");

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentData.clientSecret,
        merchantDisplayName: "ShoeHub",
        allowsDelayedPaymentMethods: true,
        returnURL: "shoehub://stripe-redirect",
        defaultBillingDetails: { address: { country: "IN" } },
      });

      if (initError) throw new Error(initError.message);

      const { error: payError } = await presentPaymentSheet();

      if (payError) {
        Toast.show({
          type: "info",
          text1: "Payment not completed",
          text2:
            "Your pending order is saved. You can try paying again safely.",
        });
        return;
      }

      // 🔄 Syncing local states instantly via fallback synchronous request engine
      await updateOrderPaymentStatus(token, orderId);

      clearCart();
      fetchOrders(token);
      setActiveOrderId(null);

      router.replace({
        pathname: "/checkout/success",
        params: { orderId, method: "ONLINE" },
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Checkout Error",
        text2: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isProcessing) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-xl font-bold">Your Cart is Empty</Text>
        <TouchableOpacity
          onPress={() => router.navigate("/explore" as any)}
          className="bg-black px-6 py-3 rounded-xl mt-4"
        >
          <Text className="text-white">Continue Shopping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      {/* HEADER BAR */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-zinc-100">
        <TouchableOpacity
          onPress={() => router.push("/cart")}
          className="w-10 h-10 items-center justify-center rounded-full bg-zinc-100"
        >
          <Ionicons name="arrow-back" size={20} color="#18181b" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-base font-black tracking-tight text-zinc-900 mr-10">
          Checkout
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* DELIVERY ADDRESS SELECTION */}
        <View className="mt-6 px-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Delivery Address
            </Text>
            {addresses.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push("/address/address-form")}
              >
                <Text className="text-zinc-900 font-bold text-xs">Add New</Text>
              </TouchableOpacity>
            )}
          </View>

          {isAddressesLoading ? (
            <View className="h-32 bg-zinc-200 rounded-2xl" />
          ) : addresses.length === 0 ? (
            <TouchableOpacity
              onPress={() => router.push("/address/address-form")}
              className="bg-white border border-dashed border-zinc-300 rounded-2xl p-6 items-center justify-center h-36"
            >
              <Ionicons name="location-outline" size={28} color="#a1a1aa" />
              <Text className="text-zinc-900 font-bold text-sm mt-2">
                No Delivery Addresses
              </Text>
              <Text className="text-zinc-400 text-xs mt-0.5">
                Tap here to save a shipping address
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="space-y-3">
              {addresses.map((address) => {
                const isSelected = selectedAddressId === address.id;
                return (
                  <TouchableOpacity
                    key={address.id}
                    onPress={() => setSelectedAddressId(address.id)}
                    activeOpacity={0.8}
                    className={`p-4 rounded-2xl border mb-3 ${
                      isSelected
                        ? "bg-zinc-100 border-zinc-900"
                        : "bg-white border-zinc-200"
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center space-x-2">
                        <View className="bg-zinc-200 px-2 py-0.5 rounded-md">
                          <Text className="text-[10px] font-bold text-zinc-700 uppercase tracking-wide">
                            {address.label}
                          </Text>
                        </View>
                        {address.isDefault && (
                          <Text className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide ml-2">
                            Default
                          </Text>
                        )}
                      </View>
                      <View
                        className={`w-5 h-5 rounded-full border items-center justify-center ${
                          isSelected
                            ? "border-zinc-900 bg-zinc-900"
                            : "border-zinc-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color="#ffffff"
                          />
                        )}
                      </View>
                    </View>

                    <Text className="text-sm font-black text-zinc-900 mt-3">
                      {address.fullName}
                    </Text>
                    <Text className="text-xs text-zinc-500 font-medium mt-1">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                    </Text>
                    <Text className="text-xs text-zinc-500 font-medium">
                      {address.city}, {address.state} {address.postalCode}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* PAYMENT METHOD SELECTOR BOXES */}
        <View className="mt-6 px-4">
          <Text className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Select Payment Method
          </Text>

          {/* ONLINE OPTION CARD */}
          <TouchableOpacity
            onPress={() => setPaymentMethod("ONLINE")}
            activeOpacity={0.8}
            className={`p-4 rounded-2xl border flex-row items-center mb-3 ${
              paymentMethod === "ONLINE"
                ? "bg-zinc-100 border-zinc-900"
                : "bg-white border-zinc-200"
            }`}
          >
            <View className="p-2 bg-zinc-200 rounded-xl mr-4">
              <Ionicons name="card" size={22} color="#18181b" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-zinc-900">
                Pay Online Securely
              </Text>
              <Text className="text-xs text-zinc-500 mt-0.5">
                Supports UPI, Credit/Debit Cards, NetBanking
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border items-center justify-center ${
                paymentMethod === "ONLINE"
                  ? "border-zinc-900 bg-zinc-900"
                  : "border-zinc-300 bg-white"
              }`}
            >
              {paymentMethod === "ONLINE" && (
                <View className="w-2 h-2 rounded-full bg-white" />
              )}
            </View>
          </TouchableOpacity>

          {/* COD OPTION CARD */}
          <TouchableOpacity
            onPress={() => setPaymentMethod("COD")}
            activeOpacity={0.8}
            className={`p-4 rounded-2xl border flex-row items-center ${
              paymentMethod === "COD"
                ? "bg-zinc-100 border-zinc-900"
                : "bg-white border-zinc-200"
            }`}
          >
            <View className="p-2 bg-zinc-200 rounded-xl mr-4">
              <Ionicons name="cash" size={22} color="#18181b" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-zinc-900">
                Cash on Delivery (COD)
              </Text>
              <Text className="text-xs text-zinc-500 mt-0.5">
                Pay via cash or UPI when items are delivered
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border items-center justify-center ${
                paymentMethod === "COD"
                  ? "border-zinc-900 bg-zinc-900"
                  : "border-zinc-300 bg-white"
              }`}
            >
              {paymentMethod === "COD" && (
                <View className="w-2 h-2 rounded-full bg-white" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* ORDER PREVIEW CONTAINER */}
        <View className="mt-6 px-4">
          <Text className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Order Preview ({items.reduce((a, b) => a + b.quantity, 0)})
          </Text>
          <View className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
            {items.slice(0, 3).map((item, index) => (
              <View
                key={item.variantId}
                className={`flex-row py-3 ${
                  index !== Math.min(items.length, 3) - 1
                    ? "border-b border-zinc-100"
                    : ""
                }`}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  className="w-14 h-14 rounded-xl bg-zinc-50"
                  resizeMode="cover"
                />
                <View className="flex-1 ml-3 justify-center">
                  <Text className="text-[10px] font-bold text-zinc-400 uppercase">
                    {item.brand}
                  </Text>
                  <Text
                    className="text-xs font-bold text-zinc-900 mt-0.5"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-[11px] font-medium text-zinc-500 mt-0.5">
                    US {item.size} • {item.color} • Qty {item.quantity}
                  </Text>
                </View>
                <View className="justify-center items-end ml-2">
                  <Text className="text-xs font-black text-zinc-900">
                    {formatPrice(item.salePrice * item.quantity)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* PRICE BREAKDOWN SECTION */}
        <View className="mt-6 px-4">
          <Text className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Price Details
          </Text>
          <View className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
            <View className="flex-row justify-between mb-2.5">
              <Text className="text-xs font-semibold text-zinc-500">
                Subtotal
              </Text>
              <Text className="text-xs font-bold text-zinc-900">
                {formatPrice(subtotal)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2.5">
              <Text className="text-xs font-semibold text-zinc-500">
                Shipping
              </Text>
              <Text
                className={`text-xs font-bold ${shippingFee === 0 ? "text-emerald-600" : "text-zinc-900"}`}
              >
                {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
              </Text>
            </View>
            <View className="h-[1px] bg-zinc-100 my-3" />
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-black text-zinc-900">
                Total Amount
              </Text>
              <Text className="text-xl font-black text-zinc-900">
                {formatPrice(totalAmount)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION STICKY MODULE */}
      <View className="bg-white px-6 pt-4 pb-2 border-t border-zinc-100">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
              Total Payable
            </Text>
            <Text className="text-xl font-black text-zinc-950">
              {formatPrice(totalAmount)}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!selectedAddressId || isProcessing || items.length === 0}
            onPress={handleProceedToPayment}
            className={`h-12 px-6 rounded-xl flex-row items-center justify-center ${
              !selectedAddressId || isProcessing ? "bg-zinc-200" : "bg-zinc-950"
            }`}
          >
            {isProcessing ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text className="text-white font-bold text-xs uppercase tracking-wider mr-2">
                  {paymentMethod === "COD"
                    ? "Place COD Order"
                    : "Proceed to Payment"}
                </Text>
                <Ionicons
                  name={
                    paymentMethod === "COD" ? "checkmark-circle" : "lock-closed"
                  }
                  size={14}
                  color="#ffffff"
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
