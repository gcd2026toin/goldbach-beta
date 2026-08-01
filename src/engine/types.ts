// トランプゲーム ルールエンジン - 型定義

export type Suit = "spade" | "heart" | "diamond" | "club";

export interface Card {
  suit: Suit;
  rank: number; // 1-13 (A=1, J=11, Q=12, K=13)
}

/** 場の状態。cards が空配列のとき「場が空」を意味する。 */
export interface FieldState {
  cards: Card[];
  score: number | null; // 場札のスコア(最大値)。場が空なら null
  table: number | null; // 場札のテーブル(総和)。場が空なら null
  lastPlayCount: number; // 直前に成立した「出す」行為の枚数(2 or 3)。公約数出しの必要枚数計算に使う
}

export interface PlayerState {
  id: number;
  name: string;
  hand: Card[];
  passed: boolean; // パス状態か(新しいターンが始まるまで出せない)
  isBot: boolean;
}

export interface GameState {
  players: PlayerState[];
  turnOrder: number[]; // 時計回りのプレイヤーid順
  field: FieldState;
  currentPlayerId: number;
  finished: boolean;
  winnerId: number | null; // あがったプレイヤー。誰もあがれずに終了した場合は null (ステイルメイト)
  consecutiveLeadFailures: number; // 場が空の状態で先出しできない人が何人連続したか(一周=全員失敗でステイルメイト終了)
  /**
   * あがりが発生した直後、まだ「全員が最後の場のテーブルと互いに素な手札を捨てる」処理を
   * 済ませていない状態を表す。null でなければゲームはまだ finished になっていない。
   * UI側で一定時間待ってから resolveAgariDiscard を呼び、処理を完了させる想定。
   */
  pendingAgari: { playerId: number; table: number } | null;
  /** 場が流れた直後、直前まで場にあった手を一瞬表示するためのスナップショット */
  lastClearedField: Card[];
  log: string[]; // デバッグ・リプレイ用の行動ログ
}

// ---- プレイヤーが選べる行動 ----

export type Action =
  | { type: "lead"; cards: Card[] } // 場が空のときに2or3枚出す
  | { type: "beat"; cards: Card[] } // 場札と同テーブル・高スコアの2or3枚を出す
  | { type: "divisor"; cards: Card[] } // 場札全ての公約数札を(直前枚数-1)枚出す
  | { type: "pass" }; // 自由パス

export interface ApplyResult {
  state: GameState;
  fieldWasReset: boolean; // このアクションで場が流れたか(=同一人物が続けて先出しする)
  agari: boolean; // このアクションであがったか
}
