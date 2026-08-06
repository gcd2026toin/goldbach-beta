import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { PlayerConfig } from "../state/useGameSession";
import { GameState } from "../engine/types";

const DIFFICULTY_LABEL: Record<PlayerConfig["difficulty"], string> = {
  easy: "初級",
  medium: "中級",
  hard: "上級",
};

interface OpponentRowProps {
  bots: PlayerConfig[];
  state: GameState;
  cumulativeScores: Record<number, number>;
  forcedPassIds: Set<number>;
}

export function OpponentRow({ bots, state, cumulativeScores, forcedPassIds }: OpponentRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {bots.map((bot) => {
        const player = state.players.find((p) => p.id === bot.id);
        const handCount = player?.hand.length ?? 0;
        const score = cumulativeScores[bot.id] ?? 0;
        const isActive = state.currentPlayerId === bot.id && !state.finished;
        const hasPassed = player?.passed ?? false;
        const wasForcedPass = forcedPassIds.has(bot.id);
        const scoreColor = score > 0 ? theme.colors.accentGold : score < 0 ? theme.colors.textSecondary : theme.colors.textPrimary;

        return (
          <View key={bot.id} style={styles.item}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: theme.colors.accentTeal,
                  opacity: hasPassed ? 0.45 : 1,
                },
                isActive ? [styles.avatarActive, { borderColor: theme.colors.accentGold, shadowColor: theme.colors.accentGold }] : null,
              ]}
            >
              <Text style={[styles.avatarText, { fontFamily: theme.typography.body.fontFamily }]}>{bot.name}</Text>
            </View>
            <Text style={[styles.meta, { color: theme.colors.textSecondary, fontFamily: theme.typography.numeral.fontFamily }]}>
              残り{handCount}
            </Text>
            <Text style={[styles.meta, { color: scoreColor, fontFamily: theme.typography.numeral.fontFamily }]}>
              {score > 0 ? `+${score}` : score}
            </Text>
            {hasPassed ? (
              <Text style={[styles.passedLabel, { color: theme.colors.accentGold, fontFamily: theme.typography.body.fontFamily }]}>
                {wasForcedPass ? "パス" : "パス"}
              </Text>
            ) : (
              <Text style={[styles.difficulty, { color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily }]}>
                {DIFFICULTY_LABEL[bot.difficulty]}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  item: {
    alignItems: "center",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarActive: {
    borderWidth: 4,
    transform: [{ scale: 1.12 }],
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  avatarText: {
    color: "#FFFDF8",
    fontSize: 20,
  },
  meta: {
    fontSize: 21,
    lineHeight: 22,
    fontWeight: "600",
  },
  difficulty: {
    fontSize: 16,
    marginTop: 2,
  },
  passedLabel: {
    fontSize: 16,
    marginTop: 2,
    fontWeight: "600",
  },
});
