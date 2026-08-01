import React from "react";
import { StyleSheet, View } from "react-native";
import { CardFace } from "../cards/CardFace";
import { Card } from "../engine/types";

interface HandRowProps {
  hand: Card[];
  selected: Card[];
  onToggle: (card: Card) => void;
  disabled?: boolean;
}

function cardKey(c: Card): string {
  return `${c.suit}-${c.rank}`;
}

/**
 * 横スクロール1段だと手札が多いときに見切れてしまうため、
 * 折り返し(flexWrap)で自然に2段程度になるグリッド表示にしている。
 * 見やすさのためランク昇順に並べ替える。
 */
export function HandRow({ hand, selected, onToggle, disabled }: HandRowProps) {
  const selectedKeys = new Set(selected.map(cardKey));
  const sortedHand = [...hand].sort((a, b) => a.rank - b.rank);

  return (
    <View style={styles.grid}>
      {sortedHand.map((c) => (
        <CardFace
          key={cardKey(c)}
          rank={c.rank}
          suit={c.suit}
          size="sm"
          selected={selectedKeys.has(cardKey(c))}
          onPress={disabled ? undefined : () => onToggle(c)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
});

