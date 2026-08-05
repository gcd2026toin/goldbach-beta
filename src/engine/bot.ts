import { Action, Card, GameState } from "./types";
import { getLegalActions, isTripleCoprimeReset } from "./rules";
import { countNonCoprimeRanks, countDistinctPrimeFactors, sum } from "./mathUtils";
import { applyAction, computeScores, forceSkipLead, resolveAgariDiscard } from "./engine";

// ゲームに登場する難易度。UI表示用のラベルは HomeScreen / OpponentRow 側で管理する。
// medium-strong / medium-lookahead / hard / hard-learned は実験・内部用で UI には出さない。
export type Difficulty = "easy" | "medium" | "hard";

// ============================================================
// 共通ユーティリティ
// ============================================================

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 「柔軟な数字」: 公約数出し・返し出しどちらにも使いやすい小さい数
const FLEXIBLE_RANKS = new Set([1, 2, 3, 4, 6]);

function handRanks(hand: Card[]): number[] {
  return hand.map((c) => c.rank);
}

function removeCards(hand: Card[], toRemove: Card[]): Card[] {
  const remaining = [...hand];
  for (const c of toRemove) {
    const idx = remaining.findIndex((h) => h.suit === c.suit && h.rank === c.rank);
    remaining.splice(idx, 1);
  }
  return remaining;
}

// ============================================================
// 評価関数群（初級・中級・上級が共有する補助関数）
// ============================================================

/**
 * 残り手札の「健全さ」評価。
 * - 0枚(あがり)は最高評価
 * - 1枚残りは先出し番で詰む主要因のため大きく減点
 * - 柔軟な小さい数字が残るほど加点
 * - 高ランク保持はステイルメイト時の失点につながるため軽く減点
 */
function evaluateHandQuality(hand: Card[]): number {
  if (hand.length === 0) return 10_000;

  let score = 0;
  if (hand.length === 1) score -= 300;

  const ranks = handRanks(hand);
  score += ranks.filter((r) => FLEXIBLE_RANKS.has(r)).length * 8;
  score -= sum(ranks) * 0.4;

  return score;
}

/**
 * あがる手の評価値。
 *
 * 場を流すあがり(公約数出し / 3枚互いに素)は破棄が発生せず、
 * 相手手札がまるごと得点になるため常に最も有利。
 * 通常のあがりはテーブルが合成数に近いほど相手手札が生き残りやすく得点が伸びる。
 */
function winBonus(action: Exclude<Action, { type: "pass" }>): number {
  const willResetField = action.type === "divisor" || isTripleCoprimeReset(action);
  if (willResetField) return 10_000 + 150;

  const table = sum(action.cards.map((c) => c.rank));
  const survivors = countNonCoprimeRanks(table);
  return 10_000 + survivors * 8; // 最大 104、上の +150 を超えない
}

/**
 * 順位に応じてあがり方の価値を変える（上級bot専用）。
 *
 * 手札枚数が少ない順を「暫定順位」として扱う。
 * - 1位: とにかくあがることを優先してリードを守る
 * - 2-3位: 場を流す or 素因数2種のテーブルであがることを等価に重視
 * - 4位(最下位): 場を流す or 素因数2種以下のテーブルであがることを等価に重視
 */
function winBonusRankAware(
  action: Exclude<Action, { type: "pass" }>,
  rank: number
): number {
  const willResetField = action.type === "divisor" || isTripleCoprimeReset(action);
  const table = sum(action.cards.map((c) => c.rank));
  const primeFactors = countDistinctPrimeFactors(table);
  const survivors = countNonCoprimeRanks(table);
  const baseSurvival = 10_000 + survivors * 8;

  if (willResetField) {
    return rank === 1 ? 10_000 + 250 : 10_000 + 150;
  }

  if (rank === 4) {
    return primeFactors <= 2 ? 10_000 + 150 : baseSurvival;
  }
  if (rank === 2 || rank === 3) {
    return primeFactors === 2 ? 10_000 + 150 : baseSurvival;
  }
  // 1位
  return baseSurvival + 50;
}

/**
 * ゲーム進行中の暫定順位を手札サイズで推定する。
 * 手札が少ないほど優位（1位）。
 */
function estimateRank(state: GameState, playerId: number): number {
  const mySize = state.players.find((p) => p.id === playerId)!.hand.length;
  let rank = 1;
  for (const p of state.players) {
    if (p.id !== playerId && p.hand.length < mySize) rank++;
  }
  return rank;
}

// ============================================================
// 中級: ヒューリスティック + 1手先読み
// ============================================================

/**
 * 中級の基本スコアリング。
 * あがり・手札品質・枚数消化速度・場流しボーナスを加味する。
 */
function scoreActionMedium(hand: Card[], action: Action): number {
  if (action.type === "pass") return -1_000_000;

  const handAfter = removeCards(hand, action.cards);
  if (handAfter.length === 0) return winBonus(action);

  let score = evaluateHandQuality(handAfter);
  score += action.cards.length * 15;
  if (isTripleCoprimeReset(action)) score += 40;
  if (action.type === "divisor") score += 10;

  return score;
}

/**
 * 中級の実際の選択スコアリング。
 * scoreActionMedium に加え、次手番プレイヤーの最善応手を簡易推定して
 * 相手に有利になりすぎる手を微妙に抑制する（1段先読み）。
 */
function scoreActionMediumLookahead(
  state: GameState,
  playerId: number,
  action: Action
): number {
  const player = state.players.find((p) => p.id === playerId)!;
  const base = scoreActionMedium(player.hand, action);
  if (action.type === "pass") return base;

  const handAfter = removeCards(player.hand, action.cards);
  if (handAfter.length === 0) return base; // あがり手は先読み不要

  let afterState: GameState;
  try {
    afterState = applyAction(state, playerId, action).state;
  } catch {
    return base;
  }

  const nextId = afterState.currentPlayerId;
  if (afterState.finished || nextId === playerId) return base;

  const opponent = afterState.players.find((p) => p.id === nextId)!;
  const opponentLegal = getLegalActions(afterState, nextId);
  let opponentBest = -Infinity;
  for (const oa of opponentLegal) {
    const s = scoreActionMedium(opponent.hand, oa);
    if (s > opponentBest) opponentBest = s;
  }

  // 相手の最善手が高いほど微減（相手のあがり手を渡す手を避ける）
  return base - 0.04 * Math.max(0, opponentBest);
}

// ============================================================
// 上級: maxN多手先読み
// ============================================================

/**
 * 上級botはゲーム木探索(maxN法)を用いる。
 *
 * このゲームは GameState に全員の手札が含まれる完全情報ゲームなので、
 * 実際に手を進めて未来を検証するゲーム木探索が正確に機能する。
 * 2人以上に対応するため、各プレイヤーが「自分の評価値を最大化する」
 * 前提で全員を再帰的にシミュレートする maxN 法を採用する。
 *
 * ルートの候補手は中級スコアで TOP_N に絞ってから先読みし、
 * 探索が終端に達した場合は実際の得点を、深さ切れは手札品質を評価値とする。
 * あがり勝利のオフセットを大きく取ることで、深さによらず勝ち筋を見失わない。
 */

type ValueMap = Record<number, number>;

// あがり勝利は常に中間評価を圧倒する大きさ（winBonus の最大値 +150 と揃える）
const TERMINAL_WIN_OFFSET = 10_000 + 150;

// 上級の探索パラメータ
// ルート: TOP 10 候補を先読みし、各ノードで TOP 3 に絞って depth=6 まで展開
const HARD_ROOT_BRANCH = 10;
const HARD_BRANCH = 3;
const HARD_DEPTH = 6;

// パスの機会コスト（上級でも最後はシミュレートするが、積極的に出す方向に誘導）
const HARD_PASS_OPPORTUNITY_COST = 25;

/** 終端局面の実得点を各プレイヤーの評価値として返す */
function terminalValues(state: GameState): ValueMap {
  const scores = computeScores(state);
  const values: ValueMap = {};
  for (const p of state.players) {
    if (state.winnerId === p.id) {
      values[p.id] = TERMINAL_WIN_OFFSET + scores[p.id];
    } else if (state.winnerId === null) {
      values[p.id] = scores[p.id]; // ステイルメイト
    } else {
      values[p.id] = -TERMINAL_WIN_OFFSET + scores[p.id];
    }
  }
  return values;
}

/** 深さ切れ時の暫定評価。各プレイヤーの手札品質をそのまま評価値とする。 */
function leafValues(state: GameState): ValueMap {
  const values: ValueMap = {};
  for (const p of state.players) {
    values[p.id] = evaluateHandQuality(p.hand);
  }
  return values;
}

/**
 * maxN 多手先読み。
 * 各ノードでその手番プレイヤーが自分の評価値を最大化する手を選ぶ。
 */
function maxN(
  state: GameState,
  depth: number,
  branch: number
): ValueMap {
  if (state.finished) return terminalValues(state);
  if (state.pendingAgari) {
    // あがり後の破棄は確定的で選択の余地がないため深さを消費しない
    return maxN(resolveAgariDiscard(state), depth, branch);
  }
  if (depth <= 0) return leafValues(state);

  const mover = state.currentPlayerId;
  const player = state.players.find((p) => p.id === mover)!;
  const legal = getLegalActions(state, mover);

  if (legal.length === 0) {
    return maxN(forceSkipLead(state), depth - 1, branch);
  }

  // 中級スコアで候補を branch 本に絞ってから展開（計算量制御）
  const ranked = legal
    .map((a) => ({ action: a, score: scoreActionMedium(player.hand, a) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, branch);

  let best: ValueMap | null = null;
  let bestForMover = -Infinity;
  for (const { action } of ranked) {
    const child = applyAction(state, mover, action).state;
    const childValues = maxN(child, depth - 1, branch);
    if (childValues[mover] > bestForMover) {
      bestForMover = childValues[mover];
      best = childValues;
    }
  }
  return best!;
}

// ============================================================
// 公開 API: chooseAction
// ============================================================

/**
 * 指定した難易度でプレイヤーの手を決定して返す。
 *
 * - easy  : 合法手からランダムに選ぶ（パスは最後の手段）
 * - medium: ヒューリスティック + 1手先読みで最善手を選ぶ
 * - hard  : maxN多手先読み(depth=6) + 順位対応あがり戦略で最善手を選ぶ
 */
export function chooseAction(
  state: GameState,
  playerId: number,
  difficulty: Difficulty = "easy"
): Action | null {
  const legal = getLegalActions(state, playerId);
  if (legal.length === 0) return null;

  const player = state.players.find((p) => p.id === playerId)!;

  // ── 初級 ──────────────────────────────────────────────
  if (difficulty === "easy") {
    const nonPass = legal.filter((a) => a.type !== "pass");
    if (nonPass.length > 0) return pickRandom(nonPass);
    return legal.find((a) => a.type === "pass") ?? null;
  }

  // ── 中級 ──────────────────────────────────────────────
  if (difficulty === "medium") {
    let best: Action | null = null;
    let bestScore = -Infinity;
    for (const action of legal) {
      let s: number;
      try {
        s = scoreActionMediumLookahead(state, playerId, action);
      } catch {
        s = scoreActionMedium(player.hand, action);
      }
      if (s > bestScore) {
        bestScore = s;
        best = action;
      }
    }
    return best;
  }

  // ── 上級 ──────────────────────────────────────────────
  if (difficulty === "hard") {
    const rank = estimateRank(state, playerId);
    const nonPassLegal = legal.filter((a) => a.type !== "pass");

    // 中級スコアで上位 HARD_ROOT_BRANCH 本に絞ってから先読み評価
    const candidates = nonPassLegal
      .map((a) => ({ action: a, score: scoreActionMedium(player.hand, a) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, HARD_ROOT_BRANCH);

    let best: Action | null = null;
    let bestScore = -Infinity;
    for (const { action } of candidates) {
      let s: number;
      try {
        const handAfter = removeCards(player.hand, action.cards);
        if (handAfter.length === 0) {
          // あがり手: 順位対応ボーナスで直接評価（先読み不要）
          s = winBonusRankAware(
            action as Exclude<Action, { type: "pass" }>,
            rank
          );
        } else {
          // 通常手: maxN で depth-1 まで先読み
          const child = applyAction(state, playerId, action).state;
          s = maxN(child, HARD_DEPTH - 1, HARD_BRANCH)[playerId];
        }
      } catch {
        s = scoreActionMedium(player.hand, action);
      }
      if (s > bestScore) {
        bestScore = s;
        best = action;
      }
    }

    // 能動的パス: パスした後の先読み評価が最善手を上回る場合のみパスする
    const canPass = legal.some((a) => a.type === "pass");
    if (canPass) {
      let passScore: number;
      try {
        const passChild = applyAction(state, playerId, { type: "pass" }).state;
        passScore =
          maxN(passChild, HARD_DEPTH - 1, HARD_BRANCH)[playerId] -
          HARD_PASS_OPPORTUNITY_COST;
      } catch {
        passScore = evaluateHandQuality(player.hand) - HARD_PASS_OPPORTUNITY_COST;
      }
      if (best === null || passScore > bestScore) return { type: "pass" };
    }

    return best;
  }

  return null;
}
