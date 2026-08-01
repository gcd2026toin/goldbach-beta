import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";

interface ActionBarProps {
  canPlay: boolean;
  canPass: boolean;
  selectedCount: number;
  onPlay: () => void;
  onPass: () => void;
  isMyTurn: boolean;
  humanPassed: boolean;
  humanPassWasForced: boolean;
  isForcedPassPending: boolean;
  currentPlayerName: string;
}

export function ActionBar({
  canPlay,
  canPass,
  selectedCount,
  onPlay,
  onPass,
  isMyTurn,
  humanPassed,
  humanPassWasForced,
  isForcedPassPending,
  currentPlayerName,
}: ActionBarProps) {
  const theme = useTheme();

  if (!isMyTurn) {
    return (
      <View style={styles.waitingRow}>
        {humanPassed && (
          <Text
            style={{
              color: theme.colors.accentGold,
              fontFamily: theme.typography.body.fontFamily,
              fontSize: 23,
              fontWeight: "600",
              marginBottom: 2,
            }}
          >
            {humanPassWasForced ? "出せる手がなく、自動的にパスしました" : "あなたはパスしました"}
          </Text>
        )}
        <Text style={{ color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily, fontSize: 23 }}>
          {isForcedPassPending ? "出せる手がないためパスします…" : `${currentPlayerName}の番です…`}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text
        style={{
          color: theme.colors.accentGold,
          fontFamily: theme.typography.body.fontFamily,
          fontSize: 18,
          fontWeight: "700",
          textAlign: "center",
          marginBottom: 6,
        }}
      >
        あなたの番です
      </Text>
      <View style={styles.row}>
        <Pressable
          onPress={onPass}
          disabled={!canPass}
          style={[styles.passButton, { borderColor: theme.colors.border, opacity: canPass ? 1 : 0.4 }]}
        >
          <Text style={{ color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily, fontSize: 22 }}>パス</Text>
        </Pressable>
        <Pressable
          onPress={onPlay}
          disabled={!canPlay}
          style={[
            styles.playButton,
            {
              backgroundColor: canPlay ? theme.colors.accentGold : theme.colors.border,
              borderRadius: theme.radius.control,
            },
          ]}
        >
          <Text style={{ color: theme.colors.onAccentGold, fontFamily: theme.typography.body.fontFamily, fontSize: 22 }}>
            {selectedCount > 0 ? `出す(${selectedCount}枚)` : "出す"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  waitingRow: {
    alignItems: "center",
    paddingVertical: 12,
  },
  passButton: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  playButton: {
    flex: 1.4,
    alignItems: "center",
    paddingVertical: 12,
  },
});
