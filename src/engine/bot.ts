import { Action, Card, GameState } from "./types";
import { getLegalActions, isTripleCoprimeReset } from "./rules";
import { countNonCoprimeRanks, sum } from "./mathUtils";
import { applyAction } from "./engine";

export type Difficulty = "easy" | "medium" | "hard";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 分割の良し悪しを測る際に「柔軟な数字(多くの約数出しに使える小さい数)」とみなすランク
const FLEXIBLE_RANKS = new Set([1, 2, 3, 4, 6]);

function handRanks(hand: Card[]): number[] {
  return hand.map((c) => c.rank);
}

/**
 * 残り手札そのものの「健全さ」を評価する。
 * - 0枚(あがり)は最高評価
 * - 1枚だけ残る形は、場が空のとき二度とリードできなくなるリスクがあるため大きく減点
 * - 柔軟な小さい数字を手元に残せているかを軽く評価
 * - 高いランクのカードを溜め込むと、ステイルメイト時の失点や身動きの取りにくさにつながるため軽く減点
 */
function evaluateHandQuality(hand: Card[]): number {
  if (hand.length === 0) return 10_000;

  let score = 0;
  if (hand.length === 1) score -= 300; // 先出し番で詰む主要因なので強めに回避

  const ranks = handRanks(hand);
  const flexibleCount = ranks.filter((r) => FLEXIBLE_RANKS.has(r)).length;
  score += flexibleCount * 8;
  score -= sum(ranks) * 0.4; // 高い数字を抱え込むほど減点(ステイルメイト時の失点回避、身動きのしやすさ)

  return score;
}

function removeCards(hand: Card[], toRemove: Card[]): Card[] {
  const remaining = [...hand];
  for (const c of toRemove) {
    const idx = remaining.findIndex((h) => h.suit === c.suit && h.rank === c.rank);
    remaining.splice(idx, 1);
  }
  return remaining;
}

/**
 * あがる手そのものの評価。
 *
 * 3枚の互いに素な組、または公約数出しであがった場合は場が空になり、
 * 「全員が最後の場のテーブルと互いに素な手札を捨てる」ルールが適用されない。
 * この場合、相手の手札は一切捨てられずそのまま得点対象になるため、
 * (部分的にしか得点にならない)通常のあがり方より常に有利、または同等になる。
 * そのため場を空にするあがり方には、破棄が発生するあがり方の最大値を上回る
 * 一律の高評価を与える。
 *
 * それ以外(通常の2枚・3枚出しであがった場合)は、あがりから1秒後に破棄が発生し、
 * 得点(=相手の生き残った手札の合計)がテーブルの数字の性質に左右される。
 * テーブルが(特に13より大きい)素数だと、ランク1〜13のほぼ全てがテーブルと互いに素になり、
 * 相手の手札がほぼ全て捨てられて得点がほぼ0になってしまう。
 * 逆にテーブルが約数を多く持つ(合成数寄りの)数字だと、相手の手札が生き残りやすく得点が伸びる。
 * この差を軽いボーナスとして反映し、素数テーブルでのあがりを避けるよう誘導する。
 */
function winBonus(action: Exclude<Action, { type: "pass" }>): number {
  const willResetField = action.type === "divisor" || isTripleCoprimeReset(action);
  if (willResetField) {
    // 破棄が一切発生せず相手の手札がまるごと得点になるため、常に最も有利
    return 10_000 + 150;
  }

  const table = sum(action.cards.map((c) => c.rank));
  const survivors = countNonCoprimeRanks(table); // 0〜13。大きいほど(合成数寄りほど)得点が伸びやすい
  return 10_000 + survivors * 8; // 最大でも104(=13*8)なので、上のresetボーナス(+150)を上回ることはない
}

/**
 * 中級bot向けのスコアリング。
 * 「出せるなら出す」だけの初級より一段賢く、以下を考慮する:
 * - あがれるなら必ずあがる
 * - 手札が1枚だけ残る手は避ける(可能なら)
 * - 多く出せる手・柔軟な数字を残す手を優先
 * - 3枚の互いに素出し(場が流れて連続手番になる)はボーナス
 */
function scoreActionMedium(hand: Card[], action: Action): number {
  if (action.type === "pass") return -1_000_000; // 選べる出し手があるなら最後の手段

  const handAfter = removeCards(hand, action.cards);

  if (handAfter.length === 0) {
    // あがる手。素数テーブルであがるべきかどうかも含めて評価する(winBonus参照)。
    return winBonus(action);
  }

  let score = evaluateHandQuality(handAfter);
  score += action.cards.length * 15; // 多く出せる手を優先(消化速度)

  if (isTripleCoprimeReset(action)) {
    score += 40; // 場が流れて連続手番になるボーナス
  }
  if (action.type === "divisor") {
    score += 10; // 場を流せる手も価値が高い
  }

  return score;
}

/**
 * 上級bot専用の追加ボーナス。1は「どんな数とも互いに素でない」(＝どんな数の約数にもなり得る)
 * 最も柔軟な公約数札であるため、中級までの一般的な柔軟札ボーナスに加えて、
 * 上級botだけは1を手放すことに特に慎重になるよう追加の温存ボーナスを与える。
 */
function extraOnePreservationBonus(handAfter: Card[]): number {
  const oneCount = handAfter.filter((c) => c.rank === 1).length;
  return oneCount * 16;
}

// 上級botが「出せる手はあるが、あえて温存するために能動的にパスする」かどうかを判断する際の
// 基準値。この値が大きいほど積極的に手を出すようになり、小さいほどパスを選びやすくなる。
const HARD_PASS_OPPORTUNITY_COST = 25;

/**
 * 上級bot向け。中級の評価に加えて、その手を出した直後に
 * 「次に手番が回る相手が最善手を指したらどうなるか」を実際にシミュレートし、
 * 相手に有利な状況(特に相手があがれてしまう手)を避けるよう1手先読みする。
 * 候補を絞ってから先読みすることで計算量を抑える。
 */
function scoreActionHardWithLookahead(state: GameState, playerId: number, action: Action): number {
  const player = state.players.find((p) => p.id === playerId)!;
  let baseScore = scoreActionMedium(player.hand, action); // あがる手ならwinBonusが既に反映されている
  if (action.type === "pass") return baseScore;

  const handAfter = removeCards(player.hand, action.cards);
  if (handAfter.length > 0) {
    // あがる手には影響させず、通常の手出しにのみ1温存ボーナスを加える
    baseScore += extraOnePreservationBonus(handAfter);
  }

  let afterState: GameState;
  try {
    afterState = applyAction(state, playerId, action).state;
  } catch {
    return baseScore; // 万一適用できなければ先読みせず通常評価にフォールバック
  }

  const nextPlayerId = afterState.currentPlayerId;
  if (afterState.finished || nextPlayerId === playerId) {
    // ゲームが終了した(=あがった)、または場が流れて自分がそのまま続投する場合は
    // 相手の先読みは不要(baseScoreがwinBonus等を通じて既に妥当な評価をしている)
    return baseScore;
  }

  const opponent = afterState.players.find((p) => p.id === nextPlayerId)!;
  const opponentLegal = getLegalActions(afterState, nextPlayerId);
  let opponentBest = -Infinity;
  for (const oa of opponentLegal) {
    const s = scoreActionMedium(opponent.hand, oa);
    if (s > opponentBest) opponentBest = s;
  }
  // 相手があがれる(10000点级)場合は極めて重く減点。それ以外は緩やかなtie-break。
  const LAMBDA = 0.06;
  return baseScore - LAMBDA * Math.max(0, opponentBest);
}

/**
 * 指定した強さでプレイヤーの手を選ぶ。
 * - easy: 出せる手があればランダムに選ぶ(旧来の単純戦略)
 * - medium: ヒューリスティックで最も評価の高い手を選ぶ
 * - hard: mediumで上位候補を絞った上で、相手の最善応手を1手先読みして選ぶ
 */
export function chooseAction(state: GameState, playerId: number, difficulty: Difficulty = "easy"): Action | null {
  const legal = getLegalActions(state, playerId);
  if (legal.length === 0) return null; // 場が空でリードすら作れない特殊ケース

  const player = state.players.find((p) => p.id === playerId)!;

  if (difficulty === "easy") {
    const nonPass = legal.filter((a) => a.type !== "pass");
    if (nonPass.length > 0) return pickRandom(nonPass);
    return legal.find((a) => a.type === "pass") ?? null;
  }

  if (difficulty === "medium") {
    let best: Action | null = null;
    let bestScore = -Infinity;
    for (const action of legal) {
      const s = scoreActionMedium(player.hand, action);
      if (s > bestScore) {
        bestScore = s;
        best = action;
      }
    }
    return best;
  }

  // hard: まずmediumスコアで上位候補に絞り、その候補だけ1手先読みする(計算量を抑えるため)
  const TOP_K = 6;
  const nonPassLegal = legal.filter((a) => a.type !== "pass");
  const rankedByMedium = nonPassLegal
    .map((action) => ({ action, medium: scoreActionMedium(player.hand, action) }))
    .sort((a, b) => b.medium - a.medium)
    .slice(0, TOP_K);

  let best: Action | null = null;
  let bestScore = -Infinity;
  for (const { action } of rankedByMedium) {
    const s = scoreActionHardWithLookahead(state, playerId, action);
    if (s > bestScore) {
      bestScore = s;
      best = action;
    }
  }

  // 能動的なパス: 出せる手はあっても、そのどれもが「今は温存して手番を送る」ことに劣らない場合、
  // あえてパスして柔軟な札(特に1)を使わずに済ませる選択も検討する。
  const canPass = legal.some((a) => a.type === "pass");
  if (canPass) {
    const passScore = evaluateHandQuality(player.hand) - HARD_PASS_OPPORTUNITY_COST;
    if (best === null || passScore > bestScore) {
      return { type: "pass" };
    }
  }

  return best;
}
