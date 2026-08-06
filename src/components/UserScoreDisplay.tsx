import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";

interface UserScoreDisplayProps {
  score: number;
}

/**
 * TopBarから移動したユーザースコア表示
 * 場のスコア表示と手札との間に配置される
 */
export function UserScoreDisplay({ score }: UserScoreDisplayProps) {
  const theme = useTheme();
  const scoreColor = score > 0 ? theme.colors.accentGold : score < 0 ? theme.colors.textSecondary : theme.colors.textPrimary;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { borderColor: theme.colors.border }]}>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 16, fontFamily: theme.typography.body.fontFamily }}>
          あなた
        </Text>
        <Text
          style={{
            color: scoreColor,
            fontSize: 20,
            fontWeight: "700",
            fontFamily: theme.typography.numeral.fontFamily,
            marginLeft: 6,
          }}
        >
          {score > 0 ? `+${score}` : score}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 10,
  },
  badge: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
});
