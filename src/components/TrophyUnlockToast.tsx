import React, { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../ThemeContext";
import { TrophyDef, TROPHY_DEFS } from "../trophies/trophyDefinitions";

interface TrophyUnlockToastProps {
  trophies: TrophyDef[];
  onDismiss: () => void;
}

/**
 * トランプの序列を返す（1番目=A, 2番目=2, ..., 10番目=10, 11番目=J, 12番目=Q, 13番目=K）
 */
function getTrumpRank(trophyIndex: number): string {
  const rank = (trophyIndex % 13) + 1;
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  return ranks[rank - 1];
}

/**
 * expo-hapticsはAndroid/iOSはもちろん、Web(ブラウザ)でも
 * navigator.vibrate または iOS Safari向けのフォールバックで動作するため、
 * プラットフォーム分岐なしでそのまま使える。
 */
export function TrophyUnlockToast({ trophies, onDismiss }: TrophyUnlockToastProps) {
  const theme = useTheme();

  // ハプティクスフィードバック
  useEffect(() => {
    if (trophies.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [trophies]);

  // 3秒後に自動的に閉じる
  useEffect(() => {
    if (trophies.length === 0) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }, [trophies, onDismiss]);

  if (trophies.length === 0) return null;

  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.background, borderColor: theme.colors.accentGold }]}>
          <Text style={{ color: theme.colors.accentGold, fontFamily: theme.typography.display.fontFamily, fontSize: 24, marginBottom: 12 }}>
            トロフィー獲得！
          </Text>
          {trophies.map((t) => {
            const trophyIndex = TROPHY_DEFS.findIndex((def) => def.id === t.id);
            const trumpRank = getTrumpRank(trophyIndex);
            return (
              <View key={t.id} style={styles.trophyRow}>
                <View
                  style={[
                    styles.rankBadge,
                    { backgroundColor: theme.colors.accentGold },
                  ]}
                >
                  <Text style={styles.rankText}>{trumpRank}</Text>
                </View>
                <Text
                  style={{ color: theme.colors.textPrimary, fontFamily: theme.typography.body.fontFamily, fontSize: 16, flex: 1 }}
                >
                  {t.title}
                </Text>
              </View>
            );
          })}
          <Pressable onPress={onDismiss} style={[styles.dismissButton, { backgroundColor: theme.colors.accentGold }]} hitSlop={8}>
            <Text style={{ color: theme.colors.background, fontFamily: theme.typography.body.fontFamily, fontSize: 14, fontWeight: "600" }}>
              確認
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  card: {
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    maxWidth: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  trophyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  dismissButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: "center",
    alignItems: "center",
  },
});
