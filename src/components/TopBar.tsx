import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { GAMES_PER_SET } from "../state/useGameSession";

interface TopBarProps {
  gameIndex: number; // 0-indexed
  myScore: number;
  onBack?: () => void;
}

/**
 * 「何ゲーム目か」と「自分の累計スコア」を専用の行を増やさず、
 * 1本の細いバーの中に収めることで画面を窮屈にしない設計。
 * スコア表示の右下に「?」ボタンを配置して、ルールモーダルを開く。
 */
export function TopBar({ gameIndex, myScore, onBack }: TopBarProps) {
  const theme = useTheme();
  const scoreColor = myScore > 0 ? theme.colors.accentGold : myScore < 0 ? theme.colors.textSecondary : theme.colors.textPrimary;

  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.sideSlot}>
        <Text style={[styles.backIcon, { color: theme.colors.textSecondary }]}>{"\u2039"}</Text>
      </Pressable>

      <Text style={[styles.center, { color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily }]}>
        {gameIndex + 1}ゲーム目/{GAMES_PER_SET}ゲーム
      </Text>

      <View style={styles.scoreSlot}>
        <View style={[styles.scoreBadge, { borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 18, fontFamily: theme.typography.body.fontFamily }}>あなた</Text>
          <Text
            style={{
              color: scoreColor,
              fontSize: 22,
              fontWeight: "700",
              fontFamily: theme.typography.numeral.fontFamily,
              marginLeft: 5,
            }}
          >
            {myScore > 0 ? `+${myScore}` : myScore}
          </Text>
        </View>
      </View>
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
  scoreSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    borderWidth: 0.8,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
