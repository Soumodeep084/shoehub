import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { SectionCard } from "@/components/profile/SectionCard";
import { useAddressStore } from "@/store/addressStore";
import type { AddressInput } from "@/types";
import { FormField } from "@/components/profile/FormField";

const EMPTY_ADDRESS: AddressInput = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  landmark: "",
  isDefault: false,
};

export default function AddressFormScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();

  const addresses = useAddressStore((state) => state.addresses);
  const createAddress = useAddressStore((state) => state.createAddress);
  const updateAddress = useAddressStore((state) => state.updateAddress);
  const isSaving = useAddressStore((state) => state.isSaving);

  const editingAddress = useMemo(
    () => addresses.find((address) => address.id === params.id),
    [addresses, params.id],
  );

  const [form, setForm] = useState<AddressInput>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!params.id) {
      setForm(EMPTY_ADDRESS);
      return;
    }

    if (editingAddress) {
      setForm({
        label: editingAddress.label,
        fullName: editingAddress.fullName,
        phone: editingAddress.phone,
        line1: editingAddress.line1,
        line2: editingAddress.line2 ?? "",
        city: editingAddress.city,
        state: editingAddress.state,
        postalCode: editingAddress.postalCode,
        country: editingAddress.country,
        landmark: editingAddress.landmark ?? "",
        isDefault: editingAddress.isDefault,
      });
    }
  }, [editingAddress, params.id]);

  const setField = (key: keyof AddressInput, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.label.trim()) nextErrors.label = "Label is required.";
    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!form.phone.trim()) nextErrors.phone = "Phone is required.";
    if (!form.line1.trim()) nextErrors.line1 = "Address line is required.";
    if (!form.city.trim()) nextErrors.city = "City is required.";
    if (!form.state.trim()) nextErrors.state = "State is required.";
    if (!form.postalCode.trim())
      nextErrors.postalCode = "Postal code is required.";

    if (!/^\d{6}$/.test(form.postalCode.trim()))
      nextErrors.postalCode = "Postal code must be 6 Numbers long.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const token = await getToken();
    if (!token) return;

    try {
      const payload: AddressInput = {
        ...form,
        line2: form.line2?.trim() || undefined,
        landmark: form.landmark?.trim() || undefined,
        country: form.country?.trim() || "India",
      };

      if (editingAddress) {
        await updateAddress(token, editingAddress.id, payload);
        Toast.show({
          type: "success",
          text1: "Address updated",
          text2: "Your delivery address was saved successfully.",
        });
      } else {
        await createAddress(token, payload);
        Toast.show({
          type: "success",
          text1: "Address added",
          text2: "New delivery address added to your account.",
        });
      }

      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Save failed",
        text2: error.message || "Could not save address.",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-black tracking-tight text-zinc-950">
              {editingAddress ? "Edit Address" : "Add Address"}
            </Text>
            <Text className="mt-1 text-sm font-medium text-zinc-400">
              Save a shipping location for faster checkout.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm shadow-black/5"
          >
            <Ionicons name="close" size={18} color="#18181b" />
          </TouchableOpacity>
        </View>

        <View className="mt-6">
          <SectionCard>
            <View className="px-5 py-5">
              <View className="mb-5">
                <Text className="mb-2 text-[11px] font-black uppercase tracking-[2px] text-zinc-500">
                  Address Type <Text className="text-red-500">*</Text>
                </Text>

                <View className="flex-row gap-3">
                  {[
                    {
                      label: "Home",
                      icon: "home-outline",
                    },
                    {
                      label: "Office",
                      icon: "business-outline",
                    },
                    {
                      label: "Other",
                      icon: "location-outline",
                    },
                  ].map((item) => {
                    const selected = form.label === item.label;

                    return (
                      <TouchableOpacity
                        key={item.label}
                        activeOpacity={0.85}
                        onPress={() => setField("label", item.label)}
                        className={`flex-1 items-center rounded-2xl border px-3 py-4 ${
                          selected
                            ? "border-zinc-950 bg-zinc-950"
                            : "border-zinc-200 bg-white"
                        }`}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={selected ? "#ffffff" : "#18181b"}
                        />

                        <Text
                          className={`mt-2 text-xs font-bold ${
                            selected ? "text-white" : "text-zinc-950"
                          }`}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {errors.label ? (
                  <Text className="mt-2 text-xs text-red-500">
                    {errors.label}
                  </Text>
                ) : null}
              </View>
              <FormField
                label="Full name"
                placeholder="Recipient name"
                value={form.fullName}
                onChangeText={(value) => setField("fullName", value)}
                autoCapitalize="words"
                error={errors.fullName}
              />
              <FormField
                label="Phone"
                placeholder="Mobile number"
                value={form.phone}
                onChangeText={(value) => setField("phone", value)}
                keyboardType="phone-pad"
                autoCapitalize="none"
                error={errors.phone}
              />
              <FormField
                label="Address line 1"
                placeholder="House / apartment / street"
                value={form.line1}
                onChangeText={(value) => setField("line1", value)}
                autoCapitalize="words"
                error={errors.line1}
              />
              <FormField
                label="Address line 2"
                placeholder="Landmark, floor, block"
                value={form.line2 ?? ""}
                onChangeText={(value) => setField("line2", value)}
                autoCapitalize="words"
                required={false}
              />
              <FormField
                label="City"
                placeholder="City"
                value={form.city}
                onChangeText={(value) => setField("city", value)}
                autoCapitalize="words"
                error={errors.city}
              />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <FormField
                    label="State"
                    placeholder="State"
                    value={form.state}
                    onChangeText={(value) => setField("state", value)}
                    autoCapitalize="words"
                    error={errors.state}
                  />
                </View>
                <View className="flex-1">
                  <FormField
                    label="Postal code"
                    placeholder="PIN / ZIP"
                    value={form.postalCode}
                    onChangeText={(value) => setField("postalCode", value)}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    error={errors.postalCode}
                  />
                </View>
              </View>
              <FormField
                label="Country"
                placeholder="Country"
                value={form.country ?? "India"}
                onChangeText={(value) => setField("country", value)}
                autoCapitalize="words"
              />
              <FormField
                label="Landmark"
                placeholder="Nearby landmark"
                value={form.landmark ?? ""}
                onChangeText={(value) => setField("landmark", value)}
                autoCapitalize="words"
                required={false}
              />

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setField("isDefault", !form.isDefault)}
                className="mt-2 flex-row items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4"
              >
                <View>
                  <Text className="text-sm font-bold text-zinc-950">
                    Set as default address
                  </Text>
                  <Text className="mt-1 text-xs font-medium text-zinc-400">
                    Use this address automatically during checkout.
                  </Text>
                </View>
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border ${
                    form.isDefault
                      ? "border-zinc-950 bg-zinc-950"
                      : "border-zinc-300 bg-white"
                  }`}
                >
                  {form.isDefault ? (
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          </SectionCard>
        </View>

        <View className="mt-6">
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isSaving}
            onPress={handleSubmit}
            className="h-14 items-center justify-center rounded-2xl bg-zinc-950"
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-xs font-black uppercase tracking-[2px] text-white">
                {editingAddress ? "Update Address" : "Save Address"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
