import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { Suit } from "../engine/types";

export type CardSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<CardSize, { width: number; height: number; rankFont: number; cornerFont: number }> = {
  sm: { width: 52, height: 74, rankFont: 27, cornerFont: 14 },
  md: { width: 63, height: 88, rankFont: 31, cornerFont: 15 },
  lg: { width: 76, height: 108, rankFont: 37, cornerFont: 17 },
};

const SUIT_GLYPH: Record<Suit, string> = {
  spade: "\u2660",
  heart: "\u2665",
  diamond: "\u2666",
  club: "\u2663",
};

// カード面(theme.colors.cardFace)はライト/ダークどちらのテーマでも常に明るい色で固定されている
// (実物のトランプらしい質感を保つため)。そのため、カード面の上に乗る文字色・枠線色も
// テーマに追従させず固定値にする。テーマの textPrimary 等をそのまま使うと、
// ダークモード時に明るい文字色が選ばれてしまい、同じく明るいカード面と重なって
// 見えにくくなってしまうため。
const CARD_INK = "#2A2420"; // ライトテーマのtextPrimaryと同じ値に固定
const CARD_GOLD = "#B8863B"; // ライトテーマのaccentGoldと同じ値に固定
const CARD_BORDER = "#E3D9C4"; // ライトテーマのborderと同じ値に固定

function rankLabel(rank: number): string {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

interface CardFaceProps {
  rank: number;
  suit: Suit;
  size?: CardSize;
  selected?: boolean;
  dimmed?: boolean;
  onPress?: () => void;
}

/**
 * このゲームでは数字(ランク)だけが意味を持つため、スート(絵柄)は
 * 4枚の同ランクカードを区別するための最小限の飾りとして小さく添えるに留め、
 * 中央の数字を主役にしたデザインにしている。
 */
export function CardFace({ rank, suit, size = "md", selected = false, dimmed = false, onPress }: CardFaceProps) {
  const theme = useTheme();
  const dims = SIZE_MAP[size];
  const suitColor = suit === "heart" || suit === "diamond" ? CARD_GOLD : CARD_INK;

  const content = (
    <View
      style={[
        styles.card,
        {
          width: dims.width,
          height: dims.height,
          backgroundColor: theme.colors.cardFace,
          borderRadius: theme.radius.card,
          borderColor: selected ? CARD_GOLD : CARD_BORDER,
          borderWidth: selected ? 2 : 0.5,
          opacity: dimmed ? 0.45 : 1,
        },
        selected ? styles.selectedLift : null,
      ]}
    >
      <Text style={[styles.corner, { fontSize: dims.cornerFont, color: suitColor, fontFamily: theme.typography.numeral.fontFamily }]}>
        {rankLabel(rank)}
        {SUIT_GLYPH[suit]}
      </Text>
      <Text
        style={[
          styles.rank,
          {
            fontSize: dims.rankFont,
            color: selected ? CARD_GOLD : CARD_INK,
            fontFamily: theme.typography.numeral.fontFamily,
          },
        ]}
      >
        {rankLabel(rank)}
      </Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} hitSlop={4}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    top: 3,
    left: 4,
  },
  rank: {
    fontWeight: "600",
  },
  selectedLift: {
    transform: [{ translateY: -6 }],
  },
});
