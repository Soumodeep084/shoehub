import React from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SectionCard } from "../SectionCard";

type Props = {
  showPasswordSection: boolean;
  setShowPasswordSection: React.Dispatch<React.SetStateAction<boolean>>;

  currentPassword: string;
  setCurrentPassword: (value: string) => void;

  newPassword: string;
  setNewPassword: (value: string) => void;

  confirmPassword: string;
  setConfirmPassword: (value: string) => void;

  passwordError: string;
  passwordLoading: boolean;

  onSubmit: () => void;
};

export function ChangePasswordCard({
  showPasswordSection,
  setShowPasswordSection,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordError,
  passwordLoading,
  onSubmit,
}: Props) {
  return (
    <SectionCard>
      <View className="px-5 py-5">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowPasswordSection((prev) => !prev)}
          className="flex-row items-center"
        >
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-zinc-50">
            <Ionicons name="key-outline" size={18} color="#18181b" />
          </View>

          <View className="flex-1 ml-3">
            <Text className="text-lg font-black tracking-tight text-zinc-950">
              Change Password
            </Text>

            <Text className="text-sm font-medium text-zinc-400">
              Update your account password
            </Text>
          </View>

          <Ionicons
            name={showPasswordSection ? "chevron-up" : "chevron-down"}
            size={20}
            color="#71717a"
          />
        </TouchableOpacity>

        {showPasswordSection && (
          <View className="mt-5 border-t border-zinc-100 pt-5">
            {/* CURRENT PASSWORD */}
            <View className="mb-4">
              <Text className="mb-2 text-[11px] font-black uppercase tracking-[2px] text-zinc-500">
                Current Password
              </Text>

              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#a1a1aa"
                secureTextEntry
                autoCapitalize="none"
                className="h-14 rounded-2xl border border-zinc-200 bg-white px-4 text-[15px] font-medium text-zinc-900"
              />
            </View>

            {/* NEW PASSWORD */}
            <View className="mb-2">
              <Text className="mb-2 text-[11px] font-black uppercase tracking-[2px] text-zinc-500">
                New Password
              </Text>

              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#a1a1aa"
                secureTextEntry
                autoCapitalize="none"
                className="h-14 rounded-2xl border border-zinc-200 bg-white px-4 text-[15px] font-medium text-zinc-900"
              />
            </View>

            <Text className="mb-4 text-xs font-medium text-zinc-400 leading-5">
              Minimum 8 characters with a mix of letters and numbers.
            </Text>

            {/* CONFIRM PASSWORD */}
            <View className="mb-4">
              <Text className="mb-2 text-[11px] font-black uppercase tracking-[2px] text-zinc-500">
                Confirm Password
              </Text>

              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor="#a1a1aa"
                secureTextEntry
                autoCapitalize="none"
                className="h-14 rounded-2xl border border-zinc-200 bg-white px-4 text-[15px] font-medium text-zinc-900"
              />
            </View>

            {passwordError ? (
              <View className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                <Text className="text-sm font-medium text-red-600">
                  {passwordError}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={onSubmit}
              disabled={passwordLoading}
              activeOpacity={0.85}
              className="h-14 items-center justify-center rounded-2xl bg-zinc-950"
            >
              {passwordLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-xs font-black uppercase tracking-[2px] text-white">
                  Update Password
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SectionCard>
  );
}
