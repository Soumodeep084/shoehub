import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

function SkeletonBlock({ className }: { className: string }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View className={`bg-zinc-200 ${className}`} style={{ opacity }} />
  );
}

export function HomeSkeleton() {
  return (
    <View className="px-6 pt-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <SkeletonBlock className="h-11 w-11 rounded-full" />
          <View className="gap-2">
            <SkeletonBlock className="h-5 w-32 rounded-full" />
            <SkeletonBlock className="h-3 w-24 rounded-full" />
          </View>
        </View>
        <View className="flex-row gap-2">
          <SkeletonBlock className="h-11 w-11 rounded-full" />
          <SkeletonBlock className="h-11 w-11 rounded-full" />
          <SkeletonBlock className="h-11 w-11 rounded-full" />
        </View>
      </View>

      <SkeletonBlock className="mt-7 h-8 w-72 rounded-full" />
      <SkeletonBlock className="mt-3 h-5 w-96 max-w-full rounded-full" />

      <View className="mt-8 overflow-hidden rounded-[34px] bg-zinc-100">
        <SkeletonBlock className="h-[360px] w-full rounded-[34px]" />
      </View>

      <View className="mt-11 gap-4">
        <SkeletonBlock className="h-6 w-40 rounded-full" />
        <View className="flex-row gap-4">
          <SkeletonBlock className="h-36 w-40 rounded-[24px]" />
          <SkeletonBlock className="h-36 w-40 rounded-[24px]" />
          <SkeletonBlock className="h-36 w-40 rounded-[24px]" />
        </View>
      </View>

      <View className="mt-12 gap-4">
        <SkeletonBlock className="h-6 w-44 rounded-full" />
        <View className="flex-row gap-5">
          <SkeletonBlock className="h-[420px] w-60 rounded-[28px]" />
          <SkeletonBlock className="h-[420px] w-60 rounded-[28px]" />
        </View>
      </View>
    </View>
  );
}
