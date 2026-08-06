import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyAction, computeScores, forceSkipLead, initGame, resolveAgariDiscard } from "../engine/engine";
import { getLegalActions } from "../engine/rules";
import { chooseAction, Difficulty } from "../engine/bot";
import { Action, Card, GameState } from "../engine/types";
import { playConfirmSound, playSelectSound } from "../audio/soundManager";

export const GAMES_PER_SET = 3;
export const HUMAN_PLAYER_ID = 0;

export interface PlayerConfig {
  id: number;
  name: string;
  isBot: boolean;
  difficulty: Difficulty; // 人間プレイヤーの場合は使用しない
}

export interface WinMethod {
  actionType: "lead" | "beat" | "divisor";
  fieldWasReset: boolean; // true: 3枚の互いに素な組 or 公約数出し(破棄なしで即終了)
  table: number; // fieldWasResetがfalseのときのみ意味を持つ(破棄の基準になったテーブル)
}

interface RoundSummary {
  gameIndex: number; // 0-indexed
  winnerId: number | null; // null = デッドロック
  scoresThisGame: Record<number, number>;
  humanPassedThisGame: boolean;
  winMethod: WinMethod | null; // winnerIdが人間のときのみ値を持つ
  finalTable: number | null; // 破棄ルールの基準になった最後のテーブル(破棄が発生した場合のみ)
  humanHandBeforeDiscard: Card[] | null; // 破棄が発生する直前の自分の手札(発生した場合のみ)
  humanHandAfter: Card[]; // このゲーム終了時点での自分の最終的な手札
  allHandLengthsAfter: Record<number, number>; // このゲーム終了時点での全員の最終的な手札枚数
}

const BOT_THINK_DELAY_MS = 3000; // 直前のプレイヤーの行動を受けてからbotが行動するまでの間
const HUMAN_AUTO_PASS_DELAY_MS = 50; // パス以外に手がないときは、ほぼ即時に自動パスする
const FORCE_SKIP_DELAY_MS = 300; // 場が空でリードすら作れない特殊ケース(演出上の間のみ)
const AGARI_DISCARD_DELAY_MS = 1000; // あがりが発生してから、互いに素な手札を全員が捨てるまでの間
const RESULT_REVEAL_DELAY_MS = 2000; // あがりが発生してから、結果(リザルト)を表示するまでの間
const CLEARED_FIELD_DISPLAY_MS = 1300; // 場が流れた直後、直前の手を表示し続ける時間
const PASS_DISPLAY_DELAY_MS = 800; // パス状態を画面に表示し続ける時間（スキップが見える）

function cardKey(c: Card): string {
  return `${c.suit}-${c.rank}`;
}

function findMatchingAction(legal: Action[], selected: Card[]): Action | undefined {
  if (selected.length === 0) return undefined;
  const selectedKeys = selected.map(cardKey).sort();
  return legal.find((a) => {
    if (a.type === "pass") return false;
    if (a.cards.length !== selected.length) return false;
    const keys = a.cards.map(cardKey).sort();
    return keys.every((k, i) => k === selectedKeys[i]);
  });
}

export function useGameSession(playerConfigs: PlayerConfig[], isPaused: boolean = false) {
  const [gameIndex, setGameIndex] = useState(0);
  const [state, setState] = useState<GameState>(() =>
    initGame(
      playerConfigs.map((p) => ({ name: p.name, isBot: p.isBot })),
      0
    )
  );
  const [cumulativeScores, setCumulativeScores] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    playerConfigs.forEach((p) => (init[p.id] = 0));
    return init;
  });
  const [selected, setSelected] = useState<Card[]>([]);
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);
  const [setComplete, setSetComplete] = useState(false);
  const [clearedFieldSnapshot, setClearedFieldSnapshot] = useState<Card[] | null>(null);
  const [playAnimation, setPlayAnimation] = useState<{ playerId: number; nonce: number } | null>(null);
  const [forcedPassIds, setForcedPassIds] = useState<Set<number>>(new Set());
  const [humanPassedThisGame, setHumanPassedThisGame] = useState(false);
  const [gameWinners, setGameWinners] = useState<(number | null)[]>([]);
  const playAnimNonceRef = useRef(0);
  const winMethodRef = useRef<WinMethod | null>(null);
  const discardInfoRef = useRef<{ table: number; humanHandBefore: Card[] } | null>(null);

  const processingRef = useRef(false);
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
      if (resultRevealTimerRef.current) clearTimeout(resultRevealTimerRef.current);
    };
  }, []);

  // 新しいターンが始まって全員のpassedが解除されたら、強制パスの記録もクリアする
  useEffect(() => {
    if (state.players.every((p) => !p.passed)) {
      setForcedPassIds((prev) => (prev.size === 0 ? prev : new Set()));
    }
  }, [state]);

  const legalActions = useMemo(() => getLegalActions(state, state.currentPlayerId), [state]);
  const hasNonPassOption = useMemo(() => legalActions.some((a) => a.type !== "pass"), [legalActions]);
  const isHumanCurrent = playerConfigs[state.currentPlayerId]?.isBot === false && !state.finished && !state.pendingAgari;
  // パス以外に選べる手が無いときは、一瞬でも手札選択画面を見せず即座に自動パス扱いにする
  const isHumanTurn = isHumanCurrent && hasNonPassOption;
  const isForcedPassPending = isHumanCurrent && !hasNonPassOption && legalActions.length > 0;

  const matchingAction = useMemo(() => findMatchingAction(legalActions, selected), [legalActions, selected]);
  const canPass = legalActions.some((a) => a.type === "pass");

  const toggleCard = useCallback((card: Card) => {
    playSelectSound();
    setSelected((prev) => {
      const exists = prev.find((c) => cardKey(c) === cardKey(card));
      if (exists) return prev.filter((c) => cardKey(c) !== cardKey(card));
      return [...prev, card];
    });
  }, []);

  const finalizeGameIfNeeded = useCallback(
    (finishedState: GameState) => {
      if (!finishedState.finished) return;
      const scores = computeScores(finishedState);
      setCumulativeScores((prev) => {
        const next = { ...prev };
        for (const [pid, s] of Object.entries(scores)) {
          next[Number(pid)] = (next[Number(pid)] ?? 0) + s;
        }
        return next;
      });
      setGameWinners((prev) => [...prev, finishedState.winnerId]);
      setRoundSummary({
        gameIndex,
        winnerId: finishedState.winnerId,
        scoresThisGame: scores,
        humanPassedThisGame,
        winMethod: finishedState.winnerId === HUMAN_PLAYER_ID ? winMethodRef.current : null,
        finalTable: discardInfoRef.current?.table ?? null,
        humanHandBeforeDiscard: discardInfoRef.current?.humanHandBefore ?? null,
        humanHandAfter: finishedState.players.find((p) => p.id === HUMAN_PLAYER_ID)?.hand ?? [],
        allHandLengthsAfter: Object.fromEntries(finishedState.players.map((p) => [p.id, p.hand.length])),
      });
    },
    [gameIndex, humanPassedThisGame]
  );

  // あがりが発生してから一定時間後に結果(リザルト)を表示する。
  // デッドロック終了(誰もあがれない)にはこの遅延を適用せず即時表示する。
  const scheduleFinalize = useCallback(
    (finishedState: GameState, delayMs: number) => {
      if (!finishedState.finished) return;
      if (resultRevealTimerRef.current) clearTimeout(resultRevealTimerRef.current);
      resultRevealTimerRef.current = setTimeout(() => {
        finalizeGameIfNeeded(finishedState);
      }, delayMs);
    },
    [finalizeGameIfNeeded]
  );

  // 場にカードを出す(lead/beat/divisor)たびに、誰が出したかを記録し、
  // その方向からカードが飛んでくるアニメーションのきっかけにする
  const triggerPlayAnimation = useCallback((playerId: number) => {
    playAnimNonceRef.current += 1;
    setPlayAnimation({ playerId, nonce: playAnimNonceRef.current });
  }, []);

  // 場が流れた直後、直前まで場にあった手を少しの間表示し続けるための演出トリガー
  const flashClearedField = useCallback((cards: Card[]) => {
    if (cards.length === 0) return;
    if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    setClearedFieldSnapshot(cards);
    snapshotTimerRef.current = setTimeout(() => {
      setClearedFieldSnapshot(null);
    }, CLEARED_FIELD_DISPLAY_MS);
  }, []);

  // 場が空でリードすら作れない特殊ケース、あがり後の破棄待ち、bot自動着手、
  // および人間の自動パスをまとめて処理する
  useEffect(() => {
    if (isPaused) {
      // 一時停止中はタイマーをクリア。再開時に正常に動作するよう状態をリセット
      processingRef.current = false;
      return;
    }
    if (state.finished || processingRef.current) return;

    if (state.pendingAgari) {
      // 「ある人があがったとき、全ての人が最後の場のテーブルと互いに素なカードを捨てる」
      // をあがりから1秒後に実行する。結果表示自体はあがりから合計2秒になるようさらに待つ。
      processingRef.current = true;
      const timer = setTimeout(() => {
        const humanHandBefore = state.players.find((p) => p.id === HUMAN_PLAYER_ID)?.hand ?? [];
        discardInfoRef.current = { table: state.pendingAgari!.table, humanHandBefore };
        const next = resolveAgariDiscard(state);
        setState(next);
        scheduleFinalize(next, RESULT_REVEAL_DELAY_MS - AGARI_DISCARD_DELAY_MS);
        processingRef.current = false;
      }, AGARI_DISCARD_DELAY_MS);
      return () => clearTimeout(timer);
    }

    if (legalActions.length === 0) {
      // 誰の手番でも選択の余地がないので自動でスキップする
      processingRef.current = true;
      const timer = setTimeout(() => {
        const next = forceSkipLead(state);
        setState(next);
        finalizeGameIfNeeded(next); // デッドロック終了はあがりではないため遅延しない
        processingRef.current = false;
      }, FORCE_SKIP_DELAY_MS);
      return () => clearTimeout(timer);
    }

    const config = playerConfigs[state.currentPlayerId];

    if (config?.isBot) {
      processingRef.current = true;
      const timer = setTimeout(() => {
        const action = chooseAction(state, state.currentPlayerId, config.difficulty);
        if (action === null) {
          const next = forceSkipLead(state);
          setState(next);
          finalizeGameIfNeeded(next); // デッドロック終了はあがりではないため遅延しない
          processingRef.current = false;
        } else {
          const result = applyAction(state, state.currentPlayerId, action);
          if (action.type === "pass") {
            setForcedPassIds((prev) => new Set(prev).add(state.currentPlayerId));
            // パス状態を一定時間表示してから次の手番へ
            setTimeout(() => {
              setState(result.state);
              setSelected([]);
              scheduleFinalize(result.state, RESULT_REVEAL_DELAY_MS);
              processingRef.current = false;
            }, PASS_DISPLAY_DELAY_MS);
          } else {
            triggerPlayAnimation(state.currentPlayerId);
            if (result.fieldWasReset) flashClearedField(result.state.lastClearedField);
            setState(result.state);
            setSelected([]);
            scheduleFinalize(result.state, RESULT_REVEAL_DELAY_MS);
            processingRef.current = false;
          }
        }
      }, BOT_THINK_DELAY_MS);
      return () => clearTimeout(timer);
    }

    // 人間の手番だが、パス以外に選べる手が一つも無い場合は自動でパスする
    if (!hasNonPassOption) {
      processingRef.current = true;
      const timer = setTimeout(() => {
        const result = applyAction(state, state.currentPlayerId, { type: "pass" });
        setForcedPassIds((prev) => new Set(prev).add(HUMAN_PLAYER_ID));
        setHumanPassedThisGame(true);
        
        // パス状態を一定時間表示してから次の手番へ
        setTimeout(() => {
          setState(result.state);
          setSelected([]);
          finalizeGameIfNeeded(result.state);
          processingRef.current = false;
        }, PASS_DISPLAY_DELAY_MS);
      }, HUMAN_AUTO_PASS_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [state, legalActions, hasNonPassOption, isPaused, playerConfigs, finalizeGameIfNeeded, scheduleFinalize, flashClearedField, triggerPlayAnimation]);

  const playSelected = useCallback(() => {
    if (!matchingAction) return;
    playConfirmSound();
    const result = applyAction(state, HUMAN_PLAYER_ID, matchingAction);
    triggerPlayAnimation(HUMAN_PLAYER_ID);
    if (result.agari && matchingAction.type !== "pass") {
      winMethodRef.current = {
        actionType: matchingAction.type,
        fieldWasReset: result.fieldWasReset,
        table: matchingAction.cards.reduce((s, c) => s + c.rank, 0),
      };
    }
    if (result.fieldWasReset) flashClearedField(result.state.lastClearedField);
    setState(result.state);
    setSelected([]);
    scheduleFinalize(result.state, RESULT_REVEAL_DELAY_MS); // あがりが発生していれば2秒後に結果表示
  }, [matchingAction, state, scheduleFinalize, flashClearedField, triggerPlayAnimation]);

  const pass = useCallback(() => {
    if (!canPass) return;
    const result = applyAction(state, HUMAN_PLAYER_ID, { type: "pass" });
    setHumanPassedThisGame(true);
    if (result.fieldWasReset) flashClearedField(result.state.lastClearedField);
    setState(result.state);
    setSelected([]);
    finalizeGameIfNeeded(result.state);
  }, [canPass, state, finalizeGameIfNeeded, flashClearedField]);

  const proceedToNextGame = useCallback(() => {
    setRoundSummary(null);
    setClearedFieldSnapshot(null);
    setHumanPassedThisGame(false);
    winMethodRef.current = null;
    discardInfoRef.current = null;
    const nextIndex = gameIndex + 1;
    if (nextIndex >= GAMES_PER_SET) {
      setSetComplete(true);
      return;
    }
    setGameIndex(nextIndex);
    setSelected([]);
    const startPlayerId = nextIndex % playerConfigs.length;
    setState(
      initGame(
        playerConfigs.map((p) => ({ name: p.name, isBot: p.isBot })),
        startPlayerId
      )
    );
  }, [gameIndex, playerConfigs]);

  return {
    state,
    gameIndex, // 0-indexed。表示は+1する
    isHumanTurn,
    isForcedPassPending,
    selected,
    toggleCard,
    matchingAction,
    canPlaySelected: !!matchingAction,
    canPass,
    playSelected,
    pass,
    cumulativeScores,
    roundSummary,
    proceedToNextGame,
    setComplete,
    clearedFieldSnapshot,
    playAnimation,
    forcedPassIds,
    gameWinners,
  };
}
