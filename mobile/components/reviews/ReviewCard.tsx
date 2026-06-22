import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReviewGallery from "./ReviewGallery";
import { useRouter } from "expo-router";
import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
  isMine: boolean;
  onMorePress: (review: Review, isMine: boolean) => void;
}

export default function ReviewCard({
  review,
  isMine,
  onMorePress,
}: ReviewCardProps) {
  const router = useRouter();
  const fullName = `${review.user.firstName} ${review.user.lastName}`.trim();

  const createdDate = new Date(review.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View className="mb-5 rounded-[24px] border border-zinc-100 bg-white p-5">
      <View className="flex-row">
        {review.user.imageUrl ? (
          <Image
            source={{ uri: review.user.imageUrl }}
            className="h-12 w-12 rounded-full"
          />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-zinc-200">
            <Ionicons name="person" size={22} color="#52525b" />
          </View>
        )}

        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[15px] font-black text-zinc-900">
                {fullName}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onMorePress(review, isMine)}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color="#71717a" />
            </TouchableOpacity>
          </View>

          <View className="mt-2 flex-row items-center justify-between">
            <View className="flex-row">
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < review.rating ? "star" : "star-outline"}
                  size={16}
                  color="#f59e0b"
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>

            <Text className="text-[12px] font-medium text-zinc-400">
              {createdDate}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: "/review/[id]",
            params: {
              id: review.id,
            },
          })
        }
      >
        {/* ---------------- Comment ---------------- */}
        {review.comment ? (
          <Text
            numberOfLines={3}
            ellipsizeMode="tail"
            className="mt-5 text-[14px] leading-6 text-zinc-600"
          >
            {review.comment}
          </Text>
        ) : null}

        {/* ---------------- Gallery ---------------- */}

        {review.media?.length > 0 && (
          <View className="mt-5">
            <ReviewGallery media={review.media} />
          </View>
        )}

        {/* ---------------- Footer ---------------- */}
        <View className="mt-5 flex-row items-center justify-between border-t border-zinc-100 pt-4">
          <Text className="text-[12px] text-zinc-400">
            Tap to view full review
          </Text>

          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    </View>
  );
}
