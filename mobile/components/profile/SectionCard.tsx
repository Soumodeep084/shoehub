import { ReactNode } from "react";
import { View } from "react-native";

export function SectionCard({ children }: { children: ReactNode }) {
  return (
    <View className="overflow-hidden rounded-[28px] border border-zinc-100 bg-white shadow-2xl shadow-black/5 mt-1">
      {children}
    </View>
  );
}
