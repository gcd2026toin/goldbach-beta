import { Action, ApplyResult, Card, FieldState, GameState, PlayerState, Suit } from "./types";
import { getLegalActions, isTripleCoprimeReset } from "./rules";
import { isCoprime, max, sum } from "./mathUtils";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** できるだけ均等に配る(52枚をplayerCountで割った余りは先頭から1枚ずつ多く配る) */
export function dealCards(playerCount: number): Card[][] {
  const deck = shuffle(createDeck());
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  deck.forEach((card, i) => {
    hands[i % playerCount].push(card);
  });
  return hands;
}

export function initGame(
  playerNames: { name: string; isBot: boolean }[],
  startPlayerId: number = 0
): GameState {
  const hands = dealCards(playerNames.length);
  const players: PlayerState[] = playerNames.map((p, i) => ({
    id: i,
    name: p.name,
    isBot: p.isBot,
    hand: hands[i],
    passed: false,
  }));

  const emptyField: FieldState = { cards: [], score: null, table: null, lastPlayCount: 0 };

  return {
    players,
    turnOrder: players.map((p) => p.id),
    field: emptyField,
    currentPlayerId: startPlayerId,
    finished: false,
    winnerId: null,
    consecutiveLeadFailures: 0,
    pendingAgari: null,
    lastClearedField: [],
    log: [],
  };
}

function removeCardsFromHand(hand: Card[], cardsToRemove: Card[]): Card[] {
  const remaining = [...hand];
  for (const c of cardsToRemove) {
    const idx = remaining.findIndex((h) => h.suit === c.suit && h.rank === c.rank);
    if (idx === -1) throw new Error("手札にないカードが指定されました");
    remaining.splice(idx, 1);
  }
  return remaining;
}

function nextActivePlayerId(state: GameState, fromId: number): number {
  const order = state.turnOrder;
  const startIdx = order.indexOf(fromId);
  for (let step = 1; step <= order.length; step++) {
    const candidateId = order[(startIdx + step) % order.length];
    const candidate = state.players.find((p) => p.id === candidateId)!;
    if (!candidate.passed) return candidateId;
  }
  // 全員passedの理論上あり得ないケース(最低1人は非pass状態が保証されるはず)
  return fromId;
}

function countNonPassed(state: GameState): number {
  return state.players.filter((p) => !p.passed).length;
}

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

export function applyAction(state: GameState, playerId: number, action: Action): ApplyResult {
  if (state.finished) throw new Error("ゲームは既に終了しています");
  if (state.pendingAgari) throw new Error("あがり後の破棄処理待ちです");
  if (state.currentPlayerId !== playerId) throw new Error("このプレイヤーの手番ではありません");

  const legal = getLegalActions(state, playerId);
  const isLegal = legal.some((a) => JSON.stringify(a) === JSON.stringify(action));
  if (!isLegal) throw new Error("不正な手です: " + JSON.stringify(action));

  const next = cloneState(state);
  const player = next.players.find((p) => p.id === playerId)!;

  let fieldWasReset = false;
  let agari = false;

  if (action.type === "pass") {
    player.passed = true;
    next.log.push(`P${playerId}: パス`);

    if (countNonPassed(next) === 1) {
      // 残り1人 → 場が流れ、その人から新しいターン
      const remainingId = next.players.find((p) => !p.passed)!.id;
      resetField(next); // 全員パスには「要因手」が無いので、直前の場をそのまま表示用に残す
      next.players.forEach((p) => (p.passed = false));
      next.currentPlayerId = remainingId;
      fieldWasReset = true;
      next.log.push(`場が流れました。P${remainingId}から新しいターン`);
    } else {
      next.currentPlayerId = nextActivePlayerId(next, playerId);
    }

    return { state: next, fieldWasReset, agari };
  }

  // lead / beat / divisor は共通してカードを手札から場に出す
  const ranks = action.cards.map((c) => c.rank);
  player.hand = removeCardsFromHand(player.hand, action.cards);
  next.log.push(`P${playerId}: ${action.type} [${ranks.join(",")}]`);

  if (action.type === "lead") {
    next.field = { cards: action.cards, score: max(ranks), table: sum(ranks), lastPlayCount: action.cards.length };
    next.players.forEach((p) => (p.passed = false));
    next.consecutiveLeadFailures = 0; // 先出しに成功したので連続失敗の連鎖は途切れる
  } else if (action.type === "beat") {
    next.field = { cards: action.cards, score: max(ranks), table: sum(ranks), lastPlayCount: action.cards.length };
    if (isTripleCoprimeReset(action)) {
      resetField(next, action.cards); // 場を流した要因手(この3枚)をスナップショットに残す
      fieldWasReset = true;
    }
  } else if (action.type === "divisor") {
    resetField(next, action.cards); // 場を流した要因手(出した公約数札)をスナップショットに残す
    fieldWasReset = true;
  }

  // あがり判定(このプレイヤーの手番終了時点で手札0)
  if (player.hand.length === 0) {
    agari = true;
    if (fieldWasReset) {
      // あがりの一手自体(3枚の互いに素な組、または公約数出し)が場を空にした場合、
      // 「最後の場のテーブル」が存在しないため、互いに素な手札の破棄ルールは適用されない。
      // この場合は待ち状態を経由せず、直ちにゲームを終了する。
      next.finished = true;
      next.winnerId = playerId;
      next.log.push(`P${playerId} があがりました。場が空のため破棄なしでゲーム終了。`);
      return { state: next, fieldWasReset, agari };
    }

    // 場にカードが残った状態であがった場合のみ、「全員が最後の場のテーブルと互いに素な
    // 手札を捨てる」処理待ちの状態にする。実際の終了(finished=true)は
    // resolveAgariDiscard が呼ばれた時点。
    const finalTable = sum(ranks);
    next.pendingAgari = { playerId, table: finalTable };
    next.log.push(`P${playerId} があがりました。テーブル${finalTable}と互いに素な手札の破棄待ち。`);
    return { state: next, fieldWasReset, agari };
  }

  if (fieldWasReset) {
    // 場を流した本人が続けて新しいターンの先出しを行う
    next.players.forEach((p) => (p.passed = false));
    next.currentPlayerId = playerId;
  } else {
    next.currentPlayerId = nextActivePlayerId(next, playerId);
  }

  return { state: next, fieldWasReset, agari };
}

/**
 * 場を空に戻す。causingHand を渡した場合はそれを「場が流れた要因手」として
 * スナップショットに残す(例: 互いに素な3枚出し、公約数出し)。
 * 渡さない場合は現在の場札をそのまま残す(例: 全員パスによる流れ)。
 */
function resetField(state: GameState, causingHand?: Card[]) {
  state.lastClearedField = causingHand ?? state.field.cards;
  state.field = { cards: [], score: null, table: null, lastPlayCount: 0 };
  state.consecutiveLeadFailures = 0; // 場が流れて新しいターンが始まるので連鎖はリセット
}

/**
 * 「ある人があがったとき、全ての人が最後の場のテーブルと互いに素なカードを捨てる」を実行し、
 * ゲームを正式に終了させる。UI側で(あがりから1秒などの)一定時間待ってから呼ぶ想定。
 */
export function resolveAgariDiscard(state: GameState): GameState {
  if (!state.pendingAgari) {
    throw new Error("あがり待ち状態ではありません");
  }
  const { playerId, table } = state.pendingAgari;
  const next = cloneState(state);

  for (const p of next.players) {
    p.hand = p.hand.filter((c) => !isCoprime(c.rank, table));
  }

  next.pendingAgari = null;
  next.finished = true;
  next.winnerId = playerId;
  next.log.push(`テーブル${table}と互いに素な手札を全員が捨てました。ゲーム終了。`);
  return next;
}

/**
 * 場が空(先出し番)なのに2or3枚でテーブル23以下を作れない場合、何も出さずに次の人へ手番を回す。
 * 全員が連続でこれに該当した(=一周して誰も先出しできなかった)場合、
 * 「誰もあがれなくなったとき、その時点でゲームを終了する」の運用上の判定として、
 * ステイルメイト(勝者なし)でゲームを終了する。
 */
export function forceSkipLead(state: GameState): GameState {
  const next = cloneState(state);
  next.log.push(`P${state.currentPlayerId}: 先出し不能のため強制スキップ`);
  next.consecutiveLeadFailures += 1;

  if (next.consecutiveLeadFailures >= next.players.length) {
    next.finished = true;
    next.winnerId = null; // 誰もあがれないまま終了(ステイルメイト)
    next.log.push("全員が先出し不能で一周 → 誰もあがれないためゲーム終了(勝者なし)");
    return next;
  }

  const order = next.turnOrder;
  const idx = order.indexOf(state.currentPlayerId);
  next.currentPlayerId = order[(idx + 1) % order.length];
  return next;
}

/**
 * ゲーム終了後の得点計算。
 * - あがったプレイヤーがいる場合: あがったプレイヤーは他者の失点合計を得点する。
 * - 誰もあがれずステイルメイト終了した場合: 勝者はいないため、各プレイヤーは自分の残り手札分だけ失点する
 *   (この場合の得点計算はルール文面に明記が無いための暫定解釈)。
 */
export function computeScores(state: GameState): Record<number, number> {
  if (!state.finished) {
    throw new Error("ゲームが終了していません");
  }

  const scores: Record<number, number> = {};

  if (state.winnerId === null) {
    // ステイルメイト: 各自の残り手札分だけ失点、得点する者はいない
    for (const p of state.players) {
      scores[p.id] = -sum(p.hand.map((c) => c.rank));
    }
    return scores;
  }

  let winnerGain = 0;
  for (const p of state.players) {
    if (p.id === state.winnerId) continue;
    const loss = sum(p.hand.map((c) => c.rank));
    scores[p.id] = -loss;
    winnerGain += loss;
  }
  scores[state.winnerId] = winnerGain;
  return scores;
}

export { getLegalActions };

