import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function EmptyState({
  title,
  description,
  icon = "sad-outline",
  actionLabel,
  onActionPress,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-6 py-12">
      <View className="mb-6 h-20 w-20 items-center justify-center rounded-full border border-zinc-100 bg-white shadow-xl shadow-black/5">
        <Ionicons name={icon} size={30} color="#18181b" />
      </View>

      <Text className="mb-2 text-center text-2xl font-black tracking-tight text-zinc-950">
        {title}
      </Text>

      <Text className="mb-8 max-w-[280px] text-center text-sm font-medium leading-6 text-zinc-400">
        {description}
      </Text>

      {actionLabel && onActionPress ? (
        <TouchableOpacity
          onPress={onActionPress}
          activeOpacity={0.85}
          className="h-14 items-center justify-center rounded-2xl bg-zinc-950 px-6"
        >
          <Text className="text-xs font-black uppercase tracking-[2px] text-white">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
