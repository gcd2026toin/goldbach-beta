import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { CardSize } from "./CardFace";

const SIZE_MAP: Record<CardSize, { width: number; height: number }> = {
  sm: { width: 52, height: 74 },
  md: { width: 63, height: 88 },
  lg: { width: 76, height: 108 },
};

/** シンプルな二重罫線パターンの裏面。テーマの金×インクで統一。 */
export function CardBack({ size = "sm" }: { size?: CardSize }) {
  const theme = useTheme();
  const dims = SIZE_MAP[size];
  return (
    <View
      style={[
        styles.outer,
        {
          width: dims.width,
          height: dims.height,
          borderRadius: theme.radius.card,
          backgroundColor: theme.colors.accentGoldStrong,
          borderColor: theme.colors.accentGold,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            borderRadius: theme.radius.card - 4,
            borderColor: theme.colors.accentGold,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: "70%",
    height: "70%",
    borderWidth: 1,
    opacity: 0.6,
  },
});
