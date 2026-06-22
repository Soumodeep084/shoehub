import { useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { FormField } from "@/components/profile/FormField";
import { SectionCard } from "@/components/profile/SectionCard";

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
  }, [user]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSaving(true);

    try {
      await user?.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      await user?.reload();

      Toast.show({
        type: "success",
        text1: "Profile updated",
        text2: "Changes saved successfully.",
      });

      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Update failed",
        text2: error.message || "Something went wrong.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text className="text-3xl font-black text-zinc-950">Edit Profile</Text>

        <Text className="mt-1 text-sm text-zinc-400">
          Update your personal information.
        </Text>

        <View className="mt-6">
          <SectionCard>
            <View className="px-5 py-5">
              <FormField
                label="First name"
                value={firstName}
                onChangeText={setFirstName}
                error={errors.firstName}
              />

              <FormField
                label="Last name"
                value={lastName}
                onChangeText={setLastName}
                error={errors.lastName}
              />
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
              <Text className="text-xs font-black uppercase text-white">
                Update Profile
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.replace("/(root)/(tabs)/profile")}
          className="mt-4 items-center py-2"
        >
          <Text className="text-sm font-bold text-zinc-500">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
