import React from "react";
import { Text, TextInput, View } from "react-native";

export const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = true,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
}) => (
  <View className="mb-5">
    <Text className="mb-2 text-[11px] font-black uppercase tracking-[1px] text-zinc-500 select-none">
      {label}

      {required && <Text className="text-red-500"> *</Text>}

      {!required && <Text className="text-zinc-400"> (Optional)</Text>}
    </Text>

    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ? placeholder : `Enter ${label.toLowerCase()}`}
      placeholderTextColor="#a1a1aa"
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      className={`rounded-2xl border bg-white px-4 py-4 text-[15px] font-medium text-zinc-900 ${
        error ? "border-red-400" : "border-zinc-200"
      }`}
    />

    {error ? (
      <Text className="mt-2 text-xs font-medium text-red-500">{error}</Text>
    ) : null}
  </View>
);
