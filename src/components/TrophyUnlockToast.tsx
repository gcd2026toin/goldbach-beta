import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../ThemeContext";
import { TrophyDef } from "../trophies/trophyDefinitions";

interface TrophyUnlockToastProps {
  trophies: TrophyDef[];
  onDismiss: () => void;
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
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={[styles.card, { backgroundColor: theme.colors.background, borderColor: theme.colors.accentGold }]}>
        <Text style={{ color: theme.colors.accentGold, fontFamily: theme.typography.display.fontFamily, fontSize: 18 }}>
          トロフィー獲得！
        </Text>
        {trophies.map((t) => (
          <Text
            key={t.id}
            style={{ color: theme.colors.textPrimary, fontFamily: theme.typography.body.fontFamily, fontSize: 16, marginTop: 4 }}
          >
            {t.title}
          </Text>
        ))}
        <Pressable onPress={onDismiss} style={styles.dismissButton} hitSlop={8}>
          <Text style={{ color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily, fontSize: 13 }}>閉じる</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 56,
    right: 0,
    alignItems: "flex-end",
    paddingRight: 8,
    zIndex: 20,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  dismissButton: {
    marginTop: 8,
  },
});
