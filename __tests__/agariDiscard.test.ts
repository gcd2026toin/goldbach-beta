import { applyAction, initGame, resolveAgariDiscard, computeScores } from "../src/engine/engine";
import { Card, GameState } from "../src/engine/types";

function makeCard(suit: Card["suit"], rank: number): Card {
  return { suit, rank };
}

function buildState(): GameState {
  const state = initGame([
    { name: "P0", isBot: false },
    { name: "P1", isBot: true },
  ]);
  state.currentPlayerId = 0;
  return state;
}

test("あがった直後はfinishedにならず、pendingAgariが立つ", () => {
  const state = buildState();
  // P0の手札を、出せば0枚になる2枚(9,1 -> テーブル10)に差し替える
  state.players[0].hand = [makeCard("spade", 9), makeCard("heart", 1)];
  state.players[1].hand = [makeCard("club", 3), makeCard("diamond", 4), makeCard("spade", 7)];

  const result = applyAction(state, 0, { type: "lead", cards: [makeCard("spade", 9), makeCard("heart", 1)] });

  expect(result.agari).toBe(true);
  expect(result.state.finished).toBe(false); // まだ終了していない
  expect(result.state.pendingAgari).toEqual({ playerId: 0, table: 10 });
});

test("resolveAgariDiscardで、テーブルと互いに素な手札だけが捨てられて終了する", () => {
  const state = buildState();
  state.players[0].hand = [makeCard("spade", 9), makeCard("heart", 1)];
  // テーブルは 9+1=10。10と互いに素なランクは 1,3,7,9,11,13 など(gcd=1)。
  // 10と互いに素でない(=公約数を持つ)のは 2,4,5,6,8,10,12 など。
  state.players[1].hand = [
    makeCard("club", 3), // gcd(3,10)=1 → 互いに素 → 捨てられる
    makeCard("diamond", 4), // gcd(4,10)=2 → 互いに素でない → 残る
    makeCard("spade", 5), // gcd(5,10)=5 → 互いに素でない → 残る
    makeCard("heart", 7), // gcd(7,10)=1 → 互いに素 → 捨てられる
  ];

  const leadResult = applyAction(state, 0, { type: "lead", cards: [makeCard("spade", 9), makeCard("heart", 1)] });
  const finalState = resolveAgariDiscard(leadResult.state);

  expect(finalState.finished).toBe(true);
  expect(finalState.winnerId).toBe(0);
  expect(finalState.pendingAgari).toBeNull();

  const p1Ranks = finalState.players[1].hand.map((c) => c.rank).sort();
  expect(p1Ranks).toEqual([4, 5]); // 3と7が捨てられ、4と5だけ残る

  const scores = computeScores(finalState);
  expect(scores[0]).toBe(9); // P1の残り(4+5=9)を得点
  expect(scores[1]).toBe(-9);
});

test("divisor出しであがった場合、場が空になるため破棄は発生せず直ちに終了する", () => {
  const state = buildState();
  // 場札 [club6, diamond9] (テーブル15, gcd=3) に対し、P0が3を1枚出してあがる(手札は3のみ)
  state.field = { cards: [makeCard("club", 6), makeCard("diamond", 9)], score: 9, table: 15, lastPlayCount: 2 };
  state.players[0].hand = [makeCard("spade", 3)];
  state.players[1].hand = [makeCard("heart", 2), makeCard("diamond", 5)];

  const result = applyAction(state, 0, { type: "divisor", cards: [makeCard("spade", 3)] });

  // divisor出しは常に場を空にするため、pendingAgariを経由せず直ちに終了する
  expect(result.state.pendingAgari).toBeNull();
  expect(result.state.finished).toBe(true);
  expect(result.state.winnerId).toBe(0);
  expect(result.fieldWasReset).toBe(true);

  // 破棄が発生しないため、P1の手札はそのまま残る
  const p1Ranks = result.state.players[1].hand.map((c) => c.rank).sort();
  expect(p1Ranks).toEqual([2, 5]);

  // 場が流れた要因手として、出した公約数札(3)がスナップショットに残る
  expect(result.state.lastClearedField.map((c) => c.rank)).toEqual([3]);
});

test("3枚の互いに素な組であがった場合も、場が空になるため破棄は発生せず直ちに終了する", () => {
  const state = buildState();
  state.field = { cards: [makeCard("club", 1), makeCard("diamond", 2)], score: 2, table: 10, lastPlayCount: 2 };
  // 1,4,5 → table=10(場と一致)、score=5(>2)、かつ互いに素な3枚
  state.players[0].hand = [makeCard("spade", 1), makeCard("heart", 4), makeCard("club", 5)];
  state.players[1].hand = [makeCard("heart", 6)];

  const result = applyAction(state, 0, {
    type: "beat",
    cards: [makeCard("spade", 1), makeCard("heart", 4), makeCard("club", 5)],
  });

  expect(result.state.pendingAgari).toBeNull();
  expect(result.state.finished).toBe(true);
  expect(result.state.winnerId).toBe(0);
  expect(result.fieldWasReset).toBe(true);
  expect(result.state.players[1].hand.map((c) => c.rank)).toEqual([6]); // 破棄されず残る
  expect(result.state.lastClearedField.map((c) => c.rank).sort()).toEqual([1, 4, 5]);
});
