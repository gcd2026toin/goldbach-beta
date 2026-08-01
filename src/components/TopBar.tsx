import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { GAMES_PER_SET } from "../state/useGameSession";

interface TopBarProps {
  gameIndex: number; // 0-indexed
  myScore: number;
  onBack?: () => void;
  onRulesPress?: () => void;
}

/**
 * 「何ゲーム目か」と「自分の累計スコア」を専用の行を増やさず、
 * 1本の細いバーの中に収めることで画面を窮屈にしない設計。
 * スコア表示の右下に「?」ボタンを配置して、ルールモーダルを開く。
 */
export function TopBar({ gameIndex, myScore, onBack, onRulesPress }: TopBarProps) {
  const theme = useTheme();
  const scoreColor = myScore > 0 ? theme.colors.accentGold : myScore < 0 ? theme.colors.textSecondary : theme.colors.textPrimary;

  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.sideSlot}>
        <Text style={[styles.backIcon, { color: theme.colors.textSecondary }]}>{"\u2039"}</Text>
      </Pressable>

      <Text style={[styles.center, { color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily }]}>
        セット ・ {gameIndex + 1}/{GAMES_PER_SET}戦目
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
        <Pressable onPress={onRulesPress} hitSlop={8} style={styles.rulesButton}>
          <Text style={[styles.rulesButtonText, { color: theme.colors.textSecondary }]}>?</Text>
        </Pressable>
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
    borderWidth: 0.5,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rulesButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  rulesButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
