import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { GAMES_PER_SET } from "../state/useGameSession";

interface TopBarProps {
  gameIndex: number; // 0-indexed
  onBack?: () => void;
}

/**
 * 「何ゲーム目か」と「自分の累計スコア」を専用の行を増やさず、
 * 1本の細いバーの中に収めることで画面を窮屈にしない設計。
 * スコア表示の右下に「?」ボタンを配置して、ルールモーダルを開く。
 */
export function TopBar({ gameIndex, onBack }: TopBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.sideSlot}>
        <Text style={[styles.backIcon, { color: theme.colors.textSecondary }]}>{"\u2039"}</Text>
      </Pressable>

      <Text style={[styles.center, { color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily }]}>
        {gameIndex + 1}ゲーム目/{GAMES_PER_SET}ゲーム
      </Text>

      <View style={styles.sideSlot} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 38,
  },
  sideSlot: {
    width: 30,
    alignItems: "flex-start",
  },
  backIcon: {
    fontSize: 31,
  },
  center: {
    fontSize: 19,
  },
});
