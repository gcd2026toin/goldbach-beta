import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { TrophyDef } from "../trophies/trophyDefinitions";

interface TrophyListModalProps {
  visible: boolean;
  onClose: () => void;
  allTrophies: TrophyDef[];
  unlockedIds: string[];
  totalSetsPlayed: number;
  totalSetsWon: number;
  totalGamesWon: number;
}

export function TrophyListModal({
  visible,
  onClose,
  allTrophies,
  unlockedIds,
  totalSetsPlayed,
  totalSetsWon,
  totalGamesWon,
}: TrophyListModalProps) {
  const theme = useTheme();
  const unlockedCount = allTrophies.filter((t) => unlockedIds.includes(t.id)).length;
  const allUnlocked = allTrophies.length > 0 && unlockedCount === allTrophies.length;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.display.fontFamily }]}>
            トロフィー
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={{ color: theme.colors.accentGold, fontFamily: theme.typography.body.fontFamily, fontSize: 20 }}>閉じる</Text>
          </Pressable>
        </View>

        {allUnlocked ? (
          <Text
            style={{
              color: theme.colors.accentGold,
              fontFamily: theme.typography.display.fontFamily,
              fontSize: 20,
              marginBottom: 16,
            }}
          >
            You're a Goldbacher!
          </Text>
        ) : (
          <Text
            style={{ color: theme.colors.textSecondary, fontFamily: theme.typography.numeral.fontFamily, fontSize: 15, marginBottom: 16 }}
          >
            {unlockedCount} / {allTrophies.length} 達成　・　セット {totalSetsPlayed} 回プレイ({totalSetsWon}勝)　・　{totalGamesWon} ゲーム勝利
          </Text>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {allTrophies.map((t) => {
            const unlocked = unlockedIds.includes(t.id);
            // 隠しトロフィーは獲得するまでタイトル・条件を伏せる。それ以外は未獲得でも常に表示する。
            const shouldConceal = t.hidden && !unlocked;
            return (
              <View
                key={t.id}
                style={[
                  styles.row,
                  { borderColor: theme.colors.border, opacity: unlocked ? 1 : 0.45 },
                ]}
              >
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: unlocked ? theme.colors.accentGold : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>{unlocked ? "★" : "?"}</Text>
                </View>
                <View style={styles.rowText}>
                  <Text style={{ color: theme.colors.textPrimary, fontFamily: theme.typography.body.fontFamily, fontSize: 17 }}>
                    {shouldConceal ? "？？？" : t.title}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.body.fontFamily,
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    {shouldConceal ? "未獲得" : t.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.5,
    paddingVertical: 14,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowText: {
    flex: 1,
  },
});
