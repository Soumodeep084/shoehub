import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SectionCard } from "../SectionCard";
import {
  formatDateTimeWithTime,
  formatOrderStatus,
} from "@/utils/order.utils";
import type { SessionItem } from "@/types/index";

type Props = {
  session: SessionItem;
  isCurrent: boolean;
  onRevoke: (session: SessionItem) => void;
};

export function SessionCard({ session, isCurrent, onRevoke }: Props) {
  return (
    <View className="mb-4">
      <SectionCard>
        <View className="px-5 py-5">
          <View className="flex-row gap-3 flex-1">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100">
              <Ionicons
                name={
                  session.latestActivity?.deviceType
                    ?.toLowerCase()
                    .includes("mobile")
                    ? "phone-portrait-outline"
                    : "desktop-outline"
                }
                size={18}
                color="#18181b"
              />
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-black text-zinc-950">
                  {session.latestActivity?.browserName || "Unknown browser"}
                </Text>

                {isCurrent && (
                  <View className="rounded-full bg-emerald-50 px-2.5 py-1">
                    <Text className="text-[10px] font-black uppercase  text-emerald-700 text-center">
                      This Device
                    </Text>
                  </View>
                )}
              </View>

              <Text className="mt-1 text-sm font-medium text-zinc-400">
                {session.latestActivity?.deviceType || "Device"} ·{" "}
                {session.latestActivity?.city || "Unknown city"},{" "}
                {session.latestActivity?.country || "Unknown country"}
              </Text>

              <Text className="mt-1 text-xs font-bold uppercase text-zinc-400">
                LAST SEEN{" "}
                {formatDateTimeWithTime(session.lastActiveAt.toString())}
              </Text>
            </View>

            <View>
              <View className="rounded-xl bg-emerald-50 px-3 py-1.5">
              <Text className="text-[10px] font-black uppercase text-emerald-700 text-center">
                {formatOrderStatus(session.status)}
              </Text>
            </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => onRevoke(session)}
            activeOpacity={0.85}
            className={`mt-4 h-12 flex-row items-center justify-center gap-2 rounded-2xl ${
              isCurrent ? "bg-zinc-950" : "bg-red-600"
            }`}
          >
            <Ionicons name="log-out-outline" size={16} color="#ffffff" />

            <Text className="text-xs font-black uppercase tracking-[1px] text-white">
              {isCurrent ? "Sign out this session" : "Revoke session"}
            </Text>
          </TouchableOpacity>
        </View>
      </SectionCard>
    </View>
  );
}
