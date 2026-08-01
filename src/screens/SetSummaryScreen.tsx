import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { PlayerConfig } from "../state/useGameSession";

interface SetSummaryScreenProps {
  players: PlayerConfig[];
  cumulativeScores: Record<number, number>;
  onBackToHome: () => void;
}

export function SetSummaryScreen({ players, cumulativeScores, onBackToHome }: SetSummaryScreenProps) {
  const theme = useTheme();
  const ranked = [...players].sort((a, b) => (cumulativeScores[b.id] ?? 0) - (cumulativeScores[a.id] ?? 0));
  const topScore = cumulativeScores[ranked[0].id] ?? 0;
  const isTie = ranked.filter((p) => (cumulativeScores[p.id] ?? 0) === topScore).length > 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.display.fontFamily }]}>
        セット結果
      </Text>
      <Text style={{ color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily, fontSize: 21, marginBottom: 26 }}>
        {isTie ? "引き分け" : `${ranked[0].name} の勝利`}
      </Text>

      {ranked.map((p, i) => {
        const s = cumulativeScores[p.id] ?? 0;
        return (
          <View key={p.id} style={[styles.row, { borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.textSecondary, fontFamily: theme.typography.numeral.fontFamily, fontSize: 21, width: 28 }}>
              {i + 1}
            </Text>
            <Text style={{ color: theme.colors.textPrimary, fontFamily: theme.typography.body.fontFamily, fontSize: 24, flex: 1 }}>
              {p.name}
            </Text>
            <Text
              style={{
                color: s > 0 ? theme.colors.accentGold : theme.colors.textSecondary,
                fontFamily: theme.typography.numeral.fontFamily,
                fontSize: 24,
                fontWeight: "700",
              }}
            >
              {s > 0 ? `+${s}` : s}
            </Text>
          </View>
        );
      })}

      <Pressable
        onPress={onBackToHome}
        style={[styles.button, { backgroundColor: theme.colors.accentGold, borderRadius: theme.radius.control }]}
      >
        <Text style={{ color: theme.colors.onAccentGold, fontFamily: theme.typography.body.fontFamily, fontSize: 21 }}>
          ホームへ戻る
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 36,
    textAlign: "center",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.5,
    paddingVertical: 12,
  },
  button: {
    marginTop: 28,
    alignItems: "center",
    paddingVertical: 14,
  },
});
