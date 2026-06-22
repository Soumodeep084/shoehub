import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ReviewMedia } from "@/types";

interface Props {
  media: ReviewMedia[];
}

export default function ReviewGallery({ media }: Props) {
  return (
    <View className="flex-row flex-wrap">
      {media.map((item) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.85}
          className="mr-3 mb-3 overflow-hidden rounded-2xl"
        >
          <View className="relative">
            <Image
              source={{
                uri: item.url,
              }}
              className="h-24 w-24 rounded-2xl bg-zinc-100"
            />

            {item.type === "VIDEO" && (
              <View className="absolute inset-0 items-center justify-center">
                <View className="rounded-full bg-black/60 p-2">
                  <Ionicons name="play" size={18} color="white" />
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
