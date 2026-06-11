import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

type SettingRowProps = {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  right?: string;
  danger?: boolean;
};

export function SettingRow({
  title,
  subtitle,
  icon,
  onPress,
  right,
  danger,
}: SettingRowProps) {
  const content = (
    <>
      <View
        className={`h-11 w-11 items-center justify-center rounded-2xl ${
          danger ? "bg-red-50" : "bg-zinc-50"
        }`}
      >
        <Ionicons name={icon} size={18} color={danger ? "#dc2626" : "#18181b"} />
      </View>

      <View className="flex-1">
        <Text
          className={`text-[15px] font-bold tracking-tight ${
            danger ? "text-red-600" : "text-zinc-950"
          }`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs font-medium leading-5 text-zinc-400">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? (
        <Text className="text-xs font-bold uppercase tracking-[1.5px] text-zinc-400">
          {right}
        </Text>
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#a1a1aa" />
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className="flex-row items-center gap-4 px-5 py-4"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View className="flex-row items-center gap-4 px-5 py-4">{content}</View>;
}
