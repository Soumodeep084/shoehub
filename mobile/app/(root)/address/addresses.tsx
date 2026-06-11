import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { EmptyState } from "@/components/profile/EmptyState";
import { useAddressStore } from "@/store/addressStore";
import AddressRender from "@/components/profile/address/AddressRender";

export default function AddressesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const addresses = useAddressStore((state) => state.addresses);
  const isLoading = useAddressStore((state) => state.isLoading);
  const isSaving = useAddressStore((state) => state.isSaving);
  const fetchAddresses = useAddressStore((state) => state.fetchAddresses);
  const deleteAddress = useAddressStore((state) => state.deleteAddress);
  const setDefaultAddress = useAddressStore((state) => state.setDefaultAddress);

  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    await fetchAddresses(token);
  }, [fetchAddresses , getToken]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const handleDelete = (id: string, label: string) => {
    Alert.alert("Delete address", `Remove ${label} from your address book?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const token = await getToken();
          if (!token) return;

          try {
            await deleteAddress(token, id);
            await fetchAddresses(token);
            Toast.show({
              type: "success",
              text1: "Address deleted",
              text2: "The address was removed from your account.",
            });
          } catch (error: any) {
            Toast.show({
              type: "error",
              text1: "Delete failed",
              text2: error.message || "Could not delete the address.",
            });
          }
        },
      },
    ]);
  };

  const handleDefault = async (id: string) => {
    const token = await getToken();
    if (!token) return;

    try {
      await setDefaultAddress(token, id);
      await fetchAddresses(token);
      Toast.show({
        type: "success",
        text1: "Default updated",
        text2: "This address is now your default shipping address.",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Update failed",
        text2: error.message || "Could not update the default address.",
      });
    }
  };

  const sortedAddresses = useMemo(
    () =>
      [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
    [addresses],
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      <View className="px-6 py-5 bg-white border-b border-zinc-100 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            // onPress={() => router.replace("/(root)/(tabs)/profile")}
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white"
          >
            <Ionicons name="arrow-back" size={18} color="#18181b" />
          </TouchableOpacity>

          <View>
            <Text className="text-2xl font-black text-zinc-950">Addresses</Text>

            <Text className="mt-0.5 text-xs font-bold uppercase text-zinc-400">
              Delivery locations
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/address-form")}
          activeOpacity={0.85}
          className="h-11 w-11 items-center justify-center rounded-full bg-zinc-950"
        >
          <Ionicons name="add" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing && addresses.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#18181b" />
        </View>
      ) : null}

      {!isLoading && addresses.length === 0 ? (
        <EmptyState
          title="No saved addresses"
          description="Add a delivery address to speed up checkout and keep your orders organized."
          icon="location-outline"
          actionLabel="Add Address"
          onActionPress={() => router.push("/address-form")}
        />
      ) : (
        <FlatList
          data={sortedAddresses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AddressRender
              item={item}
              handleDefault={handleDefault}
              handleDelete={handleDelete}
            />
          )}
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#18181b"
              colors={["#18181b"]}
            />
          }
          ListHeaderComponent={
            isSaving ? (
              <View className="mb-4 rounded-2xl bg-zinc-950 px-4 py-3">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-white">
                  Saving changes...
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
