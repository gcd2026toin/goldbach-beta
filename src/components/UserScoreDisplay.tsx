import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";

interface UserScoreDisplayProps {
  score: number;
  gamesWon: number;
  gamesPlayed: number;
}

export function UserScoreDisplay({ score, gamesWon, gamesPlayed }: UserScoreDisplayProps) {
  const theme = useTheme();
  const scoreColor = score > 0 ? theme.colors.accentGold : score < 0 ? theme.colors.textSecondary : theme.colors.textPrimary;

  return (
    <View style={styles.container}>
      <View style={styles.scoreRow}>
        <Text style={[styles.label, { color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily }]}>
          あなたの成績
        </Text>
        <Text style={[styles.score, { color: scoreColor, fontFamily: theme.typography.numeral.fontFamily }]}>
          {score > 0 ? `+${score}` : score}
        </Text>
      </View>
      <View style={styles.recordRow}>
        <Text style={[styles.record, { color: theme.colors.textSecondary, fontFamily: theme.typography.numeral.fontFamily }]}>
          {gamesWon} / {gamesPlayed}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 12,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  label: {
    fontSize: 14,
  },
  score: {
    fontSize: 18,
    fontWeight: "700",
  },
  recordRow: {
    marginTop: 4,
  },
  record: {
    fontSize: 13,
  },
});
