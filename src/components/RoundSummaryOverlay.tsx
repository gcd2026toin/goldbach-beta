import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { PlayerConfig } from "../state/useGameSession";
import { Card } from "../engine/types";
import { CardFace } from "../cards/CardFace";

interface RoundSummaryOverlayProps {
  visible: boolean;
  winnerId: number | null;
  scoresThisGame: Record<number, number>;
  players: PlayerConfig[];
  gameIndex: number;
  gamesPerSet: number;
  onNext: () => void;
  finalTable: number | null;
  humanHandBeforeDiscard: Card[] | null;
}

export function RoundSummaryOverlay({
  visible,
  winnerId,
  scoresThisGame,
  players,
  gameIndex,
  gamesPerSet,
  onNext,
  finalTable,
  humanHandBeforeDiscard,
}: RoundSummaryOverlayProps) {
  const theme = useTheme();
  const isLastGame = gameIndex + 1 >= gamesPerSet;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.background, borderRadius: theme.radius.sheet }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.display.fontFamily }]}>
              {winnerId === null ? "ステイルメイト" : `${players.find((p) => p.id === winnerId)?.name} の勝ち`}
            </Text>
            <Text
              style={{ color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily, fontSize: 21, marginBottom: 16 }}
            >
              {gameIndex + 1}戦目の結果
            </Text>

            {players.map((p) => {
              const s = scoresThisGame[p.id] ?? 0;
              return (
                <View key={p.id} style={styles.scoreRow}>
                  <Text style={{ color: theme.colors.textPrimary, fontFamily: theme.typography.body.fontFamily, fontSize: 22 }}>
                    {p.name}
                  </Text>
                  <Text
                    style={{
                      color: s > 0 ? theme.colors.accentGold : theme.colors.textSecondary,
                      fontFamily: theme.typography.numeral.fontFamily,
                      fontSize: 22,
                    }}
                  >
                    {s > 0 ? `+${s}` : s}
                  </Text>
                </View>
              );
            })}

            {finalTable !== null && (
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.numeral.fontFamily,
                  fontSize: 16,
                  marginTop: 14,
                }}
              >
                最後のテーブル：{finalTable}
              </Text>
            )}

            {humanHandBeforeDiscard && humanHandBeforeDiscard.length > 0 && (
              <View style={styles.handSection}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.body.fontFamily,
                    fontSize: 14,
                    marginBottom: 6,
                  }}
                >
                  あなたが捨てる前の手札
                </Text>
                <View style={styles.handRow}>
                  {humanHandBeforeDiscard.map((c, i) => (
                    <CardFace key={`${c.suit}-${c.rank}-${i}`} rank={c.rank} suit={c.suit} size="sm" />
                  ))}
                </View>
              </View>
            )}

            <Pressable
              onPress={onNext}
              style={[styles.button, { backgroundColor: theme.colors.accentGold, borderRadius: theme.radius.control }]}
            >
              <Text style={{ color: theme.colors.onAccentGold, fontFamily: theme.typography.body.fontFamily, fontSize: 22 }}>
                {isLastGame ? "セット結果を見る" : "次のゲームへ"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 320,
    maxHeight: "80%",
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    marginBottom: 5,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  handSection: {
    marginTop: 10,
  },
  handRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  button: {
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 12,
  },
});
