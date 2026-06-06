import { useEffect, useRef } from "react";
import { Animated } from "react-native";

type SectionRevealProps = {
  children: React.ReactNode;
  delay?: number;
};

export function SectionReveal({ children, delay = 0 }: SectionRevealProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        delay,
        useNativeDriver: true,
      }),

      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      {children}
    </Animated.View>
  );
}
