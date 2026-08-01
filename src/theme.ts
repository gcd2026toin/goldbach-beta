// ゴールドバッハ - デザイントークン
// ライト: 温かみのある白基調 / ダーク: シックな黒基調
// カード面は温白(#FFFDF8)でテーマ非依存(実物のトランプらしい質感を両テーマで統一)

export const palette = {
  light: {
    background: "#FAF6EE", // 温かみのある白(ページ全体)
    felt: "#EFE6D3", // 場(フィールド)の背景
    cardFace: "#FFFDF8", // カード面(テーマ非依存)
    textPrimary: "#2A2420",
    textSecondary: "#7A7166",
    accentGold: "#B8863B", // メインアクセント(「ゴールド」バッハに掛ける)
    accentGoldStrong: "#8C6329",
    accentTeal: "#2F5D62", // 互いに素・公約数出しなどの強調用
    border: "#E3D9C4",
    onAccentGold: "#FFFDF8",
  },
  dark: {
    background: "#16151A", // シックな黒基調(ページ全体)
    felt: "#1F1D22",
    cardFace: "#FFFDF8", // カード面はダークでも温白のまま
    textPrimary: "#EDE8DE",
    textSecondary: "#9C978C",
    accentGold: "#D9AA4D", // 黒地でも視認性が保てるよう明度を上げる
    accentGoldStrong: "#C9962E",
    accentTeal: "#5FA0A6",
    border: "#332F38",
    onAccentGold: "#16151A",
  },
} as const;

export const typography = {
  // 見出し(タイトル・場のラベルなど): 気品のある明朝体
  display: {
    fontFamily: "ShipporiMincho_500Medium",
  },
  // 本文・UI要素: 読みやすいゴシック体
  body: {
    fontFamily: "ZenKakuGothicNew_400Regular",
  },
  // スコア/テーブルの数字・カードのランク数字: 記帳のような等幅
  numeral: {
    fontFamily: "SpaceMono_400Regular",
  },
} as const;

export const radius = {
  card: 6,
  panel: 16,
  sheet: 28,
  control: 10,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export type ThemeMode = "light" | "dark";

export function getTheme(mode: ThemeMode) {
  return {
    colors: palette[mode],
    typography,
    radius,
    spacing,
  };
}
