import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { CardFace } from "../cards/CardFace";
import { Suit } from "../engine/types";

interface ExampleCard {
  rank: number;
  suit: Suit;
}

interface Example {
  before?: ExampleCard[]; // 「場」として先に示すカード(あれば矢印の左側に表示)
  cards: ExampleCard[]; // 実際に出すカード(矢印の右側、または単独表示)
  caption: string;
}

interface Section {
  title: string;
  body: string;
  examples?: Example[];
}

const SECTIONS: Section[] = [
  {
    title: "用語",
    body:
      "場札：最近に場に出されて、場にあるカード\n" +
      "ターン：何もない場にカードが出されてから、誰もカードを出せなくなるまでの一期間\n" +
      "スコア：出したカードの数字の最大\n" +
      "テーブル：出したカードの数字の総和\n" +
      "あがる：すべての手札をなくすこと",
    examples: [
      {
        cards: [
          { rank: 3, suit: "club" },
          { rank: 7, suit: "heart" },
        ],
        caption: "この2枚を出すと、スコアは7(最大)、テーブルは10(合計)",
      },
    ],
  },
  {
    title: "基本",
    body:
      "joker を抜いた52枚のトランプを参加者になるべく均等に配って遊びます。\n" +
      "すべての手番で出されるカードについて、テーブルは23以下でなければなりません。",
  },
  {
    title: "1. 場が空のとき",
    body:
      "ターンを始める人が、2枚または3枚のカードを場に出します。\n" +
      "出されたカードのスコアとテーブルを計算し、以降時計回りで手番が移ります。\n\n" +
      "※ 手札の2枚・3枚のどの組み合わせを選んでもテーブルが23を超えてしまい、出せる手が一つも無い場合は、" +
      "自動的にパス扱いとなり次の人に手番が回ります。",
    examples: [
      {
        cards: [
          { rank: 3, suit: "club" },
          { rank: 7, suit: "heart" },
        ],
        caption: "例: 3と7を出して始める → テーブル10・スコア7",
      },
    ],
  },
  {
    title: "2. 場が空でないとき",
    body:
      "次の人は、以下のいずれかを行います。\n\n" +
      "① 場札と同じテーブルかつ場札を超えるスコアである、2枚または3枚のカードを出す\n" +
      "(出す枚数は場札の枚数と一致している必要はありません。2枚・3枚どちらでも構いません)。\n" +
      "特に3枚のカードを出すとき、そのうちどんな2枚も互いに素であるなら、場を空に戻します。\n\n" +
      "② 場札の数字すべての公約数である数字の札を、直前のカードより1枚少なく出す。\n" +
      "この場合スコアとテーブルは計算せず、場は空に戻ります。\n\n" +
      "③ 何も出さずに手番を回す(パス)。パスした人は、新しいターンが始まるまでカードを出せません。\n" +
      "パスしていない人がただ1人になったとき、場は空に戻ります。\n\n" +
      "※ アプリでは、①・②のどちらの出し方もできない(パスするしかない)ときは、自動的にパス扱いになります。",
    examples: [
      {
        before: [
          { rank: 3, suit: "club" },
          { rank: 7, suit: "heart" },
        ],
        cards: [
          { rank: 2, suit: "spade" },
          { rank: 8, suit: "diamond" },
        ],
        caption: "①の例: 場(テーブル10・スコア7)に対し、2と8(テーブル10・スコア8)で返せる",
      },
      {
        before: [
          { rank: 4, suit: "club" },
          { rank: 4, suit: "spade" },
          { rank: 8, suit: "diamond" },
        ],
        cards: [
          { rank: 2, suit: "heart" },
          { rank: 4, suit: "diamond" },
        ],
        caption:
          "②の例: 場(4・4・8、公約数は1・2・4)は3枚出しだったので、1枚少ない2枚を出して流す。" +
          "2枚は同じ数字でなくてもよく、それぞれが公約数であればよい(ここでは2と4)",
      },
    ],
  },
  {
    title: "場が流れたとき",
    body: "場が空に戻されたとき、新しいターンはその直前に場を流した人から始まります(続けて先出しできます)。",
  },
  {
    title: "終了条件",
    body:
      "誰かがあがった時点で、そのゲームは終了に向かいます。\n\n" +
      "あがった一手によって場にカードが残った場合(通常の2枚・3枚出しであがったとき)は、あがりから1秒後に、全員が最後の場のテーブルと互いに素な手札を捨て、それをもってゲームが終了します。\n\n" +
      "一方、あがった一手自体が場を空にした場合(3枚の互いに素な組であがった、または公約数出しであがった場合)は、捨てるべき「最後の場」が存在しないため、破棄は行われず、その時点で直ちにゲームが終了します。\n\n" +
      "また、先出し番の人が誰も2〜3枚の組を作れず一巡した場合など、誰もあがれない状態になった場合もその時点でゲームを終了します(この場合は勝者なし)。",
  },
  {
    title: "得点",
    body:
      "あがったプレイヤーは、あがれなかった各プレイヤーが最後に残した手札(該当する場合は互いに素な札を捨てた後)の数字の合計分だけ得点します。\n" +
      "あがれなかったプレイヤーは、それぞれ残り手札の合計分だけ失点します。\n" +
      "誰もあがれずに終了した場合、得点する者はおらず、各プレイヤーはそれぞれ残り手札の合計分だけ失点します。",
  },
  {
    title: "セット",
    body: "このゲームを3回行い、3ゲームの得点を通算した合計が最も高い人がセットの勝者です。",
  },
];

function ExampleRow({ example }: { example: Example }) {
  const theme = useTheme();
  return (
    <View style={styles.exampleBlock}>
      <View style={styles.exampleCardsRow}>
        {example.before && (
          <>
            {example.before.map((c, i) => (
              <CardFace key={`b${i}`} rank={c.rank} suit={c.suit} size="sm" />
            ))}
            <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>→</Text>
          </>
        )}
        {example.cards.map((c, i) => (
          <CardFace key={`c${i}`} rank={c.rank} suit={c.suit} size="sm" />
        ))}
      </View>
      <Text style={[styles.exampleCaption, { color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily }]}>
        {example.caption}
      </Text>
    </View>
  );
}

export function RulesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const section = SECTIONS[index];
  const isFirst = index === 0;
  const isLast = index === SECTIONS.length - 1;

  const handleClose = () => {
    setIndex(0);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.display.fontFamily }]}>
            ルール
          </Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={{ color: theme.colors.accentGold, fontFamily: theme.typography.body.fontFamily, fontSize: 23 }}>閉じる</Text>
          </Pressable>
        </View>

        <View style={styles.pageIndicatorRow}>
          {SECTIONS.map((s, i) => (
            <Pressable key={s.title} onPress={() => setIndex(i)} hitSlop={4} style={styles.dotTouchArea}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === index ? theme.colors.accentGold : theme.colors.border,
                    width: i === index ? 18 : 7,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text
            style={[styles.pageCounter, { color: theme.colors.textSecondary, fontFamily: theme.typography.numeral.fontFamily }]}
          >
            {index + 1} / {SECTIONS.length}
          </Text>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.accentGold, fontFamily: theme.typography.display.fontFamily }]}
          >
            {section.title}
          </Text>
          <Text style={[styles.sectionBody, { color: theme.colors.textPrimary, fontFamily: theme.typography.body.fontFamily }]}>
            {section.body}
          </Text>

          {section.examples?.map((ex, i) => (
            <ExampleRow key={i} example={ex} />
          ))}
        </ScrollView>

        <View style={styles.navRow}>
          <Pressable
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            style={[styles.navButton, { borderColor: theme.colors.border, opacity: isFirst ? 0.35 : 1 }]}
          >
            <Text style={{ color: theme.colors.textPrimary, fontFamily: theme.typography.body.fontFamily, fontSize: 21 }}>
              前へ
            </Text>
          </Pressable>
          <Pressable
            onPress={() => (isLast ? handleClose() : setIndex((i) => Math.min(SECTIONS.length - 1, i + 1)))}
            style={[styles.navButton, styles.navButtonPrimary, { backgroundColor: theme.colors.accentGold, borderRadius: theme.radius.control }]}
          >
            <Text style={{ color: theme.colors.onAccentGold, fontFamily: theme.typography.body.fontFamily, fontSize: 21 }}>
              {isLast ? "閉じる" : "次へ"}
            </Text>
          </Pressable>
        </View>
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
    marginBottom: 14,
  },
  title: {
    fontSize: 31,
  },
  pageIndicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  dotTouchArea: {
    padding: 4,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  pageCounter: {
    fontSize: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 25,
    marginBottom: 12,
  },
  sectionBody: {
    fontSize: 22,
    lineHeight: 29,
  },
  exampleBlock: {
    marginTop: 18,
  },
  exampleCardsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  arrow: {
    fontSize: 21,
    marginHorizontal: 4,
  },
  exampleCaption: {
    fontSize: 17,
    lineHeight: 20,
  },
  navRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 16,
  },
  navButton: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 13,
  },
  navButtonPrimary: {
    borderWidth: 0,
  },
});
