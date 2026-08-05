import { useCallback, useEffect, useRef, useState } from "react";
import { countNonCoprimeRanks, isPrime } from "../engine/mathUtils";
import { TROPHY_DEFS, TrophyDef, getTrophyDef } from "./trophyDefinitions";
import { loadTrophyState, saveTrophyState, TrophyState } from "./trophyStore";
import { HUMAN_PLAYER_ID, PlayerConfig, WinMethod } from "../state/useGameSession";

const COMPOSITE_TABLE_SURVIVOR_THRESHOLD = 6; // 1〜13のうち何個が生き残ればテーブルが「合成数寄り」とみなすか
const THREE_SET_WINS_MILESTONE = 3;
const POINT_GETTER_THRESHOLD = 100;

interface GameEndInfo {
  winnerId: number | null;
  humanPassedThisGame: boolean;
  winMethod: WinMethod | null;
  gameIndex: number; // 0-indexed(0,1,2)
  cumulativeScoresAfterThisGame: Record<number, number>;
  humanHandAfterLength: number; // このゲーム終了時点での自分の最終的な手札枚数
  allHandLengthsAfter: Record<number, number>; // このゲーム終了時点での全員の最終的な手札枚数
  humanScoreThisGame: number; // このゲーム単体での自分の得点(あがれなかった場合は0以下)
}

interface SetEndInfo {
  cumulativeScores: Record<number, number>;
  gameWinners: (number | null)[];
  playerConfigs: PlayerConfig[];
}

export type TrophyEngine = ReturnType<typeof useTrophyEngine>;

export function useTrophyEngine() {
  const [trophyState, setTrophyState] = useState<TrophyState | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<TrophyDef[]>([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadTrophyState().then((s) => {
      setTrophyState(s);
      loadedRef.current = true;
    });
  }, []);

  const unlock = useCallback((ids: string[], base: TrophyState): TrophyState => {
    const newIds = ids.filter((id) => !base.unlockedIds.includes(id));
    if (newIds.length === 0) return base;
    const next: TrophyState = { ...base, unlockedIds: [...base.unlockedIds, ...newIds] };
    const defs = newIds.map(getTrophyDef).filter((d): d is TrophyDef => !!d);
    if (defs.length > 0) {
      setNewlyUnlocked((prev) => [...prev, ...defs]);
    }
    return next;
  }, []);

  // 「逃げるが勝ち」判定用: 2ゲーム目終了時点で自分が同率含め1位だったかを、
  // セットをまたいでも正しく最新の状態を参照できるようrefで保持する。
  const tiedOrFirstAfterGame2Ref = useRef(false);
  // 「起死回生」判定用: セット中のいずれかのゲームを終えた時点で最下位(同率含め)だったか。
  const wasLastPlaceAtSomePointRef = useRef(false);

  const evaluateGameEnd = useCallback(
    (info: GameEndInfo) => {
      setTrophyState((prevState) => {
        if (!prevState) return prevState;
        let next = { ...prevState };
        const toUnlock: string[] = [];

        if (info.winnerId === HUMAN_PLAYER_ID) {
          next = { ...next, totalGamesWon: next.totalGamesWon + 1 };
          toUnlock.push("first_win");
          if (!info.humanPassedThisGame) toUnlock.push("no_pass_win");
          if (info.humanScoreThisGame >= POINT_GETTER_THRESHOLD) toUnlock.push("point_getter");

          if (info.winMethod) {
            if (info.winMethod.actionType === "beat" && info.winMethod.fieldWasReset) {
              toUnlock.push("coprime_finish");
            }
            if (info.winMethod.actionType === "divisor") {
              toUnlock.push("divisor_finish");
            }
            if (!info.winMethod.fieldWasReset) {
              const survivors = countNonCoprimeRanks(info.winMethod.table);
              if (survivors >= COMPOSITE_TABLE_SURVIVOR_THRESHOLD) {
                toUnlock.push("composite_table_finish");
              }
              // 逃げるが勝ち: 2ゲーム目終了時点で同率含め1位だった状態から、
              // 3ゲーム目(最終ゲーム)を素数のテーブルであがって終える
              if (info.gameIndex === 2 && tiedOrFirstAfterGame2Ref.current && isPrime(info.winMethod.table)) {
                toUnlock.push("escape_win");
              }
            }
          }
        } else if (info.winnerId !== null) {
          // タダ乗り: 自分があがったのではなく、他の誰かのあがりによって
          // 自分の手札が(破棄ルールで)全て無くなった。
          // ただし、手札を全て失ったのが自分だけであることが条件
          // (勝者以外に、自分と同じく0枚になったプレイヤーがいないこと)。
          const othersAlsoWipedOut = Object.entries(info.allHandLengthsAfter).some(
            ([pid, len]) => Number(pid) !== HUMAN_PLAYER_ID && Number(pid) !== info.winnerId && len === 0
          );
          if (info.humanHandAfterLength === 0 && !othersAlsoWipedOut) {
            toUnlock.push("free_ride");
          }
        }

        // 2ゲーム目が終わった時点の順位を、3ゲーム目終了時の判定のために記録しておく
        if (info.gameIndex === 1) {
          const humanScore = info.cumulativeScoresAfterThisGame[HUMAN_PLAYER_ID] ?? 0;
          tiedOrFirstAfterGame2Ref.current = Object.entries(info.cumulativeScoresAfterThisGame).every(
            ([pid, score]) => Number(pid) === HUMAN_PLAYER_ID || score <= humanScore
          );
        }

        // セットの最初のゲームが終わったタイミングで、このセット用のフラグをリセットしてから判定する
        if (info.gameIndex === 0) {
          wasLastPlaceAtSomePointRef.current = false;
        }
        {
          const humanScore = info.cumulativeScoresAfterThisGame[HUMAN_PLAYER_ID] ?? 0;
          const isLastOrTied = Object.entries(info.cumulativeScoresAfterThisGame).every(
            ([pid, score]) => Number(pid) === HUMAN_PLAYER_ID || score >= humanScore
          );
          if (isLastOrTied) wasLastPlaceAtSomePointRef.current = true;
        }

        // setStateの更新関数はReactの仕様上、開発モードなどで複数回呼ばれることがあるため、
        // 副作用(永続化)はここでは行わず、状態の計算だけを行う純粋な関数にする。
        // 実際の保存は下のuseEffect(trophyStateの変化を監視)側でまとめて行う。
        return unlock(toUnlock, next);
      });
    },
    [unlock]
  );

  const evaluateSetEnd = useCallback(
    (info: SetEndInfo) => {
      setTrophyState((prevState) => {
        if (!prevState) return prevState;
        let next = { ...prevState, totalSetsPlayed: prevState.totalSetsPlayed + 1 };
        const toUnlock: string[] = [];

        const humanScore = info.cumulativeScores[HUMAN_PLAYER_ID] ?? 0;
        const isHumanTopScore = Object.entries(info.cumulativeScores).every(
          ([pid, score]) => Number(pid) === HUMAN_PLAYER_ID || score < humanScore
        );
        const wonSet = isHumanTopScore;

        if (wonSet) {
          next = { ...next, totalSetsWon: next.totalSetsWon + 1 };
          toUnlock.push("set_win");
          const bots = info.playerConfigs.filter((p) => p.isBot);
          const allThreeHard = bots.length === 3 && bots.every((p) => p.difficulty === "hard");
          if (allThreeHard) toUnlock.push("beat_hard_bot");
          // 起死回生: セット中のいずれかのゲームを終えた時点で最下位(同率含め)だったのに、
          // 最終的にそのセットを制した
          if (wasLastPlaceAtSomePointRef.current) toUnlock.push("comeback_win");
        }

        const wonAllGames = info.gameWinners.length > 0 && info.gameWinners.every((w) => w === HUMAN_PLAYER_ID);
        if (wonAllGames) toUnlock.push("perfect_set");

        if (next.totalSetsWon >= THREE_SET_WINS_MILESTONE) toUnlock.push("triple_sets");

        return unlock(toUnlock, next);
      });
    },
    [unlock]
  );

  // trophyStateが変化するたびに(evaluateGameEnd/evaluateSetEndどちらの結果でも)必ず保存する。
  // 初回ロード直後(loadTrophyStateの結果をそのままセットしただけ)のときは
  // 書き込む必要が無いので、ロード完了より後の変化のときだけ保存する。
  const isFirstStateRef = useRef(true);
  useEffect(() => {
    if (!trophyState) return;
    if (isFirstStateRef.current) {
      isFirstStateRef.current = false;
      return;
    }
    saveTrophyState(trophyState);
  }, [trophyState]);

  const dismissNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

  return {
    isLoaded: trophyState !== null,
    unlockedIds: trophyState?.unlockedIds ?? [],
    totalSetsPlayed: trophyState?.totalSetsPlayed ?? 0,
    totalSetsWon: trophyState?.totalSetsWon ?? 0,
    totalGamesWon: trophyState?.totalGamesWon ?? 0,
    allTrophies: TROPHY_DEFS,
    newlyUnlocked,
    dismissNewlyUnlocked,
    evaluateGameEnd,
    evaluateSetEnd,
  };
}
