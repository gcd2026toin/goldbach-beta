import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { CardFace } from "../cards/CardFace";
import { Card, FieldState } from "../engine/types";

export interface PlayAnimationInfo {
  nonce: number; // 出すたびに変化させ、同じ方向からの連続の出し手でもアニメーションを再生させるための識別子
  originX: number; // 出した人がいる方向(左右)。中央からの相対値
  originY: number; // 出した人がいる方向(上下)。上の相手なら負、下の自分なら正
}

interface FieldAreaProps {
  field: FieldState;
  clearedSnapshot: Card[] | null;
  playAnimation: PlayAnimationInfo | null;
}

/**
 * 場を「脚の短いテーブル」のように見せる。
 * テーブル面(カードが乗る部分)と脚を独立したパーツとして描き、
 * 「テーブル」の数字はテーブル面(枠)の内側に、「スコア」は枠の外側に分けて表示することで、
 * 「テーブル」という言葉が実際のテーブル(卓)を指しているニュアンスを際立たせている。
 * 場が流れて空になった直後は、直前まで場にあった手を一瞬だけ薄く表示し続ける。
 * カードが出されるたびに、出した人がいる方向からカードが飛んでくるアニメーションを再生する。
 */
export function FieldArea({ field, clearedSnapshot, playAnimation }: FieldAreaProps) {
  const theme = useTheme();
  const showingSnapshot = field.cards.length === 0 && !!clearedSnapshot && clearedSnapshot.length > 0;
  const displayCards = field.cards.length > 0 ? field.cards : showingSnapshot ? clearedSnapshot! : [];

  const anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const handledNonceRef = useRef<number | null>(null);

  // 場を流した要因手を、薄くする前にまず普通の見え方で一瞬見せるための減光アニメーション
  const dimOpacity = useRef(new Animated.Value(1)).current;
  const handledSnapshotRef = useRef<Card[] | null>(null);

  // 新しい出し手(nonce変化)を検知したら、描画前に開始位置へ即座に飛ばしておく(アニメーション開始のちらつき防止)
  if (playAnimation && playAnimation.nonce !== handledNonceRef.current) {
    handledNonceRef.current = playAnimation.nonce;
    anim.setValue({ x: playAnimation.originX, y: playAnimation.originY });
    opacity.setValue(0);
  }

  // 新しい「場が流れた要因手」のスナップショットを検知したら、まず薄くない状態にリセットしておく
  if (clearedSnapshot && clearedSnapshot !== handledSnapshotRef.current) {
    handledSnapshotRef.current = clearedSnapshot;
    dimOpacity.setValue(1);
  }
  if (!clearedSnapshot) {
    handledSnapshotRef.current = null;
  }
  // スナップショット表示でないとき(本物の場札、または空)は、
  // 前回の減光が残ったまま新しいカードまで薄く見えてしまわないよう必ず1に戻す
  if (!showingSnapshot) {
    dimOpacity.setValue(1);
  }

  useEffect(() => {
    if (!playAnimation) return;
    Animated.parallel([
      Animated.timing(anim, {
        toValue: { x: 0, y: 0 },
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playAnimation?.nonce]);

  useEffect(() => {
    if (!showingSnapshot) return;
    // 出された直後は普通の見え方のまま少し間を置き、その後に薄くする
    const timer = setTimeout(() => {
      Animated.timing(dimOpacity, {
        toValue: 0.4,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearedSnapshot]);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.tableTop,
          {
            backgroundColor: theme.colors.felt,
            borderTopLeftRadius: theme.radius.panel,
            borderTopRightRadius: theme.radius.panel,
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
            borderBottomColor: theme.colors.accentGoldStrong,
          },
        ]}
      >
        {displayCards.length === 0 ? (
          <Text style={[styles.empty, { color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily }]}>
            場が空です。2〜3枚出して始めましょう
          </Text>
        ) : (
          <>
            <Animated.View
              style={[
                styles.cardsRow,
                {
                  opacity: Animated.multiply(opacity, dimOpacity),
                  transform: anim.getTranslateTransform(),
                },
              ]}
            >
              {displayCards.map((c, i) => (
                <CardFace key={`${c.suit}-${c.rank}-${i}`} rank={c.rank} suit={c.suit} size="md" />
              ))}
            </Animated.View>
            <Text
              numberOfLines={1}
              style={[
                styles.tableCaption,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.numeral.fontFamily,
                  fontWeight: "700",
                  opacity: field.cards.length > 0 ? 1 : 0,
                },
              ]}
            >
              {field.cards.length > 0 ? `テーブル ${field.table}` : "\u00A0"}
            </Text>
            <Text
              style={[
                styles.captionSecondary,
                { color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily, opacity: showingSnapshot ? 1 : 0 },
              ]}
            >
              {showingSnapshot ? "場が流れました" : "\u00A0"}
            </Text>
          </>
        )}
      </View>

      <View style={styles.legsRow}>
        <View style={[styles.leg, { backgroundColor: theme.colors.accentGoldStrong }]} />
        <View style={[styles.leg, { backgroundColor: theme.colors.accentGoldStrong }]} />
      </View>

      <Text
        style={[
          styles.scoreCaption,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.numeral.fontFamily,
            fontWeight: "700",
            opacity: field.cards.length > 0 ? 1 : 0,
          },
        ]}
      >
        {field.cards.length > 0 ? `スコア ${field.score}` : "\u00A0"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginBottom: 4,
  },
  tableTop: {
    width: "95%",
    maxWidth: 380,
    height: 220, // 内容によらず常に最大サイズで固定し、枠が動いたり縮んだりしないようにする
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderBottomWidth: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  legsRow: {
    width: "95%",
    maxWidth: 380,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  leg: {
    width: 10,
    height: 14,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tableCaption: {
    fontSize: 23,
    marginTop: 9,
  },
  scoreCaption: {
    fontSize: 20,
    marginTop: 6,
  },
  captionSecondary: {
    fontSize: 18,
    marginTop: 4,
  },
  empty: {
    fontSize: 20,
  },
});
