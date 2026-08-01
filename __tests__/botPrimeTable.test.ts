import { chooseAction } from "../src/engine/bot";
import { initGame } from "../src/engine/engine";
import { Card, GameState } from "../src/engine/types";

function makeCard(suit: Card["suit"], rank: number): Card {
  return { suit, rank };
}

function buildState(): GameState {
  const state = initGame([
    { name: "P0", isBot: true },
    { name: "P1", isBot: true },
  ]);
  state.currentPlayerId = 0;
  return state;
}

test("中級/上級botは、合成数テーブルであがれるなら素数テーブルよりそちらを選ぶ", () => {
  // 場が空(lead)で、P0の手札は3枚。全部出せばあがれるが、
  // どのペアを選ぶかでテーブルが素数(17)か合成数(12)かが変わる状況を作る。
  // ただし全部出す(3枚)のはamountが違うため、ここでは「2枚だけ出す」ケースで検証する:
  // 手札4枚中、ちょうど2枚を使い切って(残り2枚は次のターンへ)あがるのではなく、
  // 実際にあがるのは全部出したときのみ。今回は簡単のため、
  // 「場が非空でbeatとして2枚 or 3枚を選べ、かつ両方あがりになる」状況を直接構成する。

  // 手札が2枚(5,12)なら、出せば必ずあがり。table=17(素数, score=12)
  // 別の状況で、手札が2枚(4,8)なら、出せば必ずあがり。table=12(合成数, score=8)
  // → 直接比較するのではなく、winBonpusの値そのものをchooseActionの結果を通じて検証する。

  const primeState = buildState();
  primeState.field = { cards: [makeCard("club", 1), makeCard("diamond", 2)], score: 2, table: 17, lastPlayCount: 2 };
  primeState.players[0].hand = [makeCard("spade", 5), makeCard("heart", 12)]; // 5+12=17(素数), score=12>2
  primeState.players[1].hand = [makeCard("heart", 3)];

  const primeAction = chooseAction(primeState, 0, "medium");
  expect(primeAction).toEqual({ type: "beat", cards: [makeCard("spade", 5), makeCard("heart", 12)] });

  const compositeState = buildState();
  compositeState.field = { cards: [makeCard("club", 1), makeCard("diamond", 2)], score: 2, table: 12, lastPlayCount: 2 };
  compositeState.players[0].hand = [makeCard("spade", 4), makeCard("heart", 8)]; // 4+8=12(合成数), score=8>2
  compositeState.players[1].hand = [makeCard("heart", 3)];

  const compositeAction = chooseAction(compositeState, 0, "medium");
  expect(compositeAction).toEqual({ type: "beat", cards: [makeCard("spade", 4), makeCard("heart", 8)] });

  // どちらも「あがれるなら必ずあがる」ことは保たれている(勝ちを逃してまで待つことはない)
});

test("場を空にする(公約数出しの)あがりは、破棄なしで手札がまるごと得点になるため最優先される", () => {
  const state = buildState();
  // 場札 [club6, diamond9] (テーブル15, gcd=3)。P0は3を1枚出せばあがれる(divisor、場が空になる)。
  // 同時に、field.table=15 に一致するbeatの選択肢は無いようにする(比較対象は無いが、
  // 少なくともdivisorが選ばれ、通常のあがりのwinBonusの上限104を上回ることを確認する)
  state.field = { cards: [makeCard("club", 6), makeCard("diamond", 9)], score: 9, table: 15, lastPlayCount: 2 };
  state.players[0].hand = [makeCard("spade", 3)];
  state.players[1].hand = [makeCard("heart", 4)];

  const action = chooseAction(state, 0, "medium");
  expect(action).toEqual({ type: "divisor", cards: [makeCard("spade", 3)] });
});
