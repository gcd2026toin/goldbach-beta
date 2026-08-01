import { Action, Card, GameState } from "./types";
import { combinations, gcdArray, isPairwiseCoprime, max, sum } from "./mathUtils";

const TABLE_LIMIT = 23;

function ranksOf(cards: Card[]): number[] {
  return cards.map((c) => c.rank);
}

/** 場が空のときの先出し候補(2枚 or 3枚、テーブル23以下)を全列挙 */
function enumerateLeadActions(hand: Card[]): Action[] {
  const actions: Action[] = [];
  for (const size of [2, 3] as const) {
    for (const combo of combinations(hand, size)) {
      if (sum(ranksOf(combo)) <= TABLE_LIMIT) {
        actions.push({ type: "lead", cards: combo });
      }
    }
  }
  return actions;
}

/**
 * 場札と同テーブル・場札超えスコアの2or3枚を全列挙。
 * 原文ルール「場札と同じテーブルかつ場札を超えるスコアである、2枚または3枚のカードを出す」は
 * 出す枚数を場札の枚数に一致させる制約を課していないため、2枚・3枚を独立に候補として列挙する。
 */
function enumerateBeatActions(hand: Card[], field: GameState["field"]): Action[] {
  const actions: Action[] = [];
  if (field.table === null || field.score === null) return actions;

  for (const size of [2, 3] as const) {
    for (const combo of combinations(hand, size)) {
      const ranks = ranksOf(combo);
      const t = sum(ranks);
      const s = max(ranks);
      if (t === field.table && s > field.score && t <= TABLE_LIMIT) {
        actions.push({ type: "beat", cards: combo });
      }
    }
  }
  return actions;
}

/** 場札全ての公約数の札を(直前枚数-1)枚出す手を全列挙 */
function enumerateDivisorActions(hand: Card[], field: GameState["field"]): Action[] {
  const actions: Action[] = [];
  if (field.cards.length === 0) return actions;

  const d = gcdArray(ranksOf(field.cards));
  const neededCount = field.lastPlayCount - 1;
  if (neededCount <= 0) return actions;

  const candidates = hand.filter((c) => d % c.rank === 0);
  if (candidates.length < neededCount) return actions;

  for (const combo of combinations(candidates, neededCount)) {
    actions.push({ type: "divisor", cards: combo });
  }
  return actions;
}

/**
 * 指定プレイヤーの合法手を全て列挙する。
 * 場が空 → lead のみ(+ フォールバックとしてleadが1つも作れない場合は空配列、engine側で次者へ回す)
 * 場が空でない → beat / divisor / pass
 */
export function getLegalActions(state: GameState, playerId: number): Action[] {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error(`player ${playerId} not found`);
  if (state.finished || state.pendingAgari) return [];

  if (state.field.cards.length === 0) {
    return enumerateLeadActions(player.hand);
  }

  const actions: Action[] = [
    ...enumerateBeatActions(player.hand, state.field),
    ...enumerateDivisorActions(player.hand, state.field),
    { type: "pass" },
  ];
  return actions;
}

/** beatアクションが3枚出しで、かつどの2枚も互いに素なら場が流れる、という判定 */
export function isTripleCoprimeReset(action: Action): boolean {
  if (action.type !== "beat") return false;
  if (action.cards.length !== 3) return false;
  return isPairwiseCoprime(ranksOf(action.cards));
}

export { TABLE_LIMIT };
