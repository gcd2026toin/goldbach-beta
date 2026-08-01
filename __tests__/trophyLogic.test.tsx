import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { useTrophyEngine, TrophyEngine } from "../src/trophies/useTrophyEngine";
import { PlayerConfig, HUMAN_PLAYER_ID } from "../src/state/useGameSession";

let latest: TrophyEngine | null = null;

function Harness() {
  latest = useTrophyEngine();
  return null;
}

async function mountAndWaitForLoad() {
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<Harness />);
    await Promise.resolve();
    await Promise.resolve();
  });
  return renderer!;
}

function makePlayers(difficulties: ("easy" | "medium" | "hard")[]): PlayerConfig[] {
  return [
    { id: 0, name: "あなた", isBot: false, difficulty: "easy" },
    ...difficulties.map((d, i) => ({ id: i + 1, name: `b${i + 1}`, isBot: true, difficulty: d })),
  ];
}

test("タダ乗り: 手札が0になったのが自分だけなら解除される", async () => {
  await mountAndWaitForLoad();

  act(() => {
    latest!.evaluateGameEnd({
      winnerId: 1, // botが勝者
      humanPassedThisGame: false,
      winMethod: null,
      gameIndex: 0,
      cumulativeScoresAfterThisGame: { 0: -5, 1: 10, 2: -3, 3: -2 },
      humanHandAfterLength: 0,
      allHandLengthsAfter: { 0: 0, 1: 0, 2: 3, 3: 2 }, // 1(勝者)以外で0枚は自分だけ
    });
  });

  expect(latest!.unlockedIds).toContain("free_ride");
});

test("タダ乗り: 自分以外にも手札が0になったプレイヤーがいれば解除されない", async () => {
  await mountAndWaitForLoad();

  act(() => {
    latest!.evaluateGameEnd({
      winnerId: 1,
      humanPassedThisGame: false,
      winMethod: null,
      gameIndex: 0,
      cumulativeScoresAfterThisGame: { 0: -5, 1: 10, 2: -3, 3: -2 },
      humanHandAfterLength: 0,
      allHandLengthsAfter: { 0: 0, 1: 0, 2: 0, 3: 2 }, // 2番も0枚になっている
    });
  });

  expect(latest!.unlockedIds).not.toContain("free_ride");
});

test("タダ乗り: 自分の手札が残っていれば解除されない", async () => {
  await mountAndWaitForLoad();

  act(() => {
    latest!.evaluateGameEnd({
      winnerId: 1,
      humanPassedThisGame: false,
      winMethod: null,
      gameIndex: 0,
      cumulativeScoresAfterThisGame: { 0: -5, 1: 10, 2: -3, 3: -2 },
      humanHandAfterLength: 3,
      allHandLengthsAfter: { 0: 3, 1: 0, 2: 2, 3: 1 },
    });
  });

  expect(latest!.unlockedIds).not.toContain("free_ride");
});

test("上級討伐: 上級bot3体全員が揃ったセット制覇でのみ解除される", async () => {
  await mountAndWaitForLoad();

  act(() => {
    latest!.evaluateSetEnd({
      cumulativeScores: { 0: 30, 1: 10, 2: 5, 3: 0 },
      gameWinners: [0, 1, 0],
      playerConfigs: makePlayers(["easy", "medium", "hard"]),
    });
  });
  expect(latest!.unlockedIds).not.toContain("beat_hard_bot");
  expect(latest!.unlockedIds).toContain("set_win");

  act(() => {
    latest!.evaluateSetEnd({
      cumulativeScores: { 0: 30, 1: 10, 2: 5, 3: 0 },
      gameWinners: [0, 1, 0],
      playerConfigs: makePlayers(["hard", "hard", "hard"]),
    });
  });
  expect(latest!.unlockedIds).toContain("beat_hard_bot");
});

test("逃げるが勝ち: 2ゲーム目終了時に同率含め1位、かつ3ゲーム目を素数テーブルであがると解除される", async () => {
  await mountAndWaitForLoad();

  act(() => {
    latest!.evaluateGameEnd({
      winnerId: 1,
      humanPassedThisGame: false,
      winMethod: null,
      gameIndex: 0,
      cumulativeScoresAfterThisGame: { 0: 0, 1: 5, 2: 0, 3: 0 },
      humanHandAfterLength: 2,
      allHandLengthsAfter: { 0: 2, 1: 0, 2: 3, 3: 4 },
    });
  });

  act(() => {
    latest!.evaluateGameEnd({
      winnerId: null,
      humanPassedThisGame: false,
      winMethod: null,
      gameIndex: 1,
      cumulativeScoresAfterThisGame: { 0: 10, 1: 5, 2: 10, 3: 3 },
      humanHandAfterLength: 4,
      allHandLengthsAfter: { 0: 4, 1: 5, 2: 3, 3: 2 },
    });
  });

  act(() => {
    latest!.evaluateGameEnd({
      winnerId: HUMAN_PLAYER_ID,
      humanPassedThisGame: false,
      winMethod: { actionType: "lead", fieldWasReset: false, table: 7 },
      gameIndex: 2,
      cumulativeScoresAfterThisGame: { 0: 10, 1: 5, 2: 10, 3: 3 },
      humanHandAfterLength: 0,
      allHandLengthsAfter: { 0: 0, 1: 3, 2: 2, 3: 1 },
    });
  });

  expect(latest!.unlockedIds).toContain("escape_win");
});

test("逃げるが勝ち: 3ゲーム目が素数テーブルでなければ解除されない", async () => {
  await mountAndWaitForLoad();

  act(() => {
    latest!.evaluateGameEnd({
      winnerId: null,
      humanPassedThisGame: false,
      winMethod: null,
      gameIndex: 1,
      cumulativeScoresAfterThisGame: { 0: 10, 1: 5 },
      humanHandAfterLength: 4,
      allHandLengthsAfter: { 0: 4, 1: 3 },
    });
  });

  act(() => {
    latest!.evaluateGameEnd({
      winnerId: HUMAN_PLAYER_ID,
      humanPassedThisGame: false,
      winMethod: { actionType: "lead", fieldWasReset: false, table: 10 }, // 10は合成数
      gameIndex: 2,
      cumulativeScoresAfterThisGame: { 0: 20, 1: 5 },
      humanHandAfterLength: 0,
      allHandLengthsAfter: { 0: 0, 1: 3 },
    });
  });

  expect(latest!.unlockedIds).not.toContain("escape_win");
});

test("起死回生: セット中に一度でも最下位(同率含め)になり、最終的にセットを制すると解除される", async () => {
  await mountAndWaitForLoad();

  act(() => {
    latest!.evaluateGameEnd({
      winnerId: 1,
      humanPassedThisGame: false,
      winMethod: null,
      gameIndex: 0,
      cumulativeScoresAfterThisGame: { 0: -10, 1: 10, 2: 5, 3: 3 },
      humanHandAfterLength: 3,
      allHandLengthsAfter: { 0: 3, 1: 0, 2: 4, 3: 2 },
    });
  });

  act(() => {
    latest!.evaluateGameEnd({
      winnerId: HUMAN_PLAYER_ID,
      humanPassedThisGame: false,
      winMethod: { actionType: "divisor", fieldWasReset: true, table: 0 },
      gameIndex: 1,
      cumulativeScoresAfterThisGame: { 0: 20, 1: 10, 2: 5, 3: 3 },
      humanHandAfterLength: 0,
      allHandLengthsAfter: { 0: 0, 1: 3, 2: 4, 3: 2 },
    });
  });
  act(() => {
    latest!.evaluateGameEnd({
      winnerId: HUMAN_PLAYER_ID,
      humanPassedThisGame: false,
      winMethod: { actionType: "divisor", fieldWasReset: true, table: 0 },
      gameIndex: 2,
      cumulativeScoresAfterThisGame: { 0: 30, 1: 10, 2: 5, 3: 3 },
      humanHandAfterLength: 0,
      allHandLengthsAfter: { 0: 0, 1: 3, 2: 4, 3: 2 },
    });
  });

  act(() => {
    latest!.evaluateSetEnd({
      cumulativeScores: { 0: 30, 1: 10, 2: 5, 3: 3 },
      gameWinners: [1, HUMAN_PLAYER_ID, HUMAN_PLAYER_ID],
      playerConfigs: makePlayers(["easy", "medium", "hard"]),
    });
  });

  expect(latest!.unlockedIds).toContain("comeback_win");
});

test("起死回生: 一度も最下位にならなければ解除されない", async () => {
  await mountAndWaitForLoad();

  act(() => {
    latest!.evaluateGameEnd({
      winnerId: HUMAN_PLAYER_ID,
      humanPassedThisGame: false,
      winMethod: { actionType: "divisor", fieldWasReset: true, table: 0 },
      gameIndex: 0,
      cumulativeScoresAfterThisGame: { 0: 10, 1: 3, 2: 2, 3: 1 },
      humanHandAfterLength: 0,
      allHandLengthsAfter: { 0: 0, 1: 3, 2: 2, 3: 4 },
    });
  });

  act(() => {
    latest!.evaluateSetEnd({
      cumulativeScores: { 0: 10, 1: 3, 2: 2, 3: 1 },
      gameWinners: [HUMAN_PLAYER_ID],
      playerConfigs: makePlayers(["easy", "medium", "hard"]),
    });
  });

  expect(latest!.unlockedIds).not.toContain("comeback_win");
});

test("ポイントゲッター: 1ゲームで100点以上獲得すると解除される", async () => {
  await mountAndWaitForLoad();

  act(() => {
    latest!.evaluateGameEnd({
      winnerId: HUMAN_PLAYER_ID,
      humanPassedThisGame: false,
      winMethod: { actionType: "divisor", fieldWasReset: true, table: 0 },
      gameIndex: 0,
      cumulativeScoresAfterThisGame: { 0: 120, 1: -60, 2: -40, 3: -20 },
      humanHandAfterLength: 0,
      allHandLengthsAfter: { 0: 0, 1: 6, 2: 4, 3: 2 },
      humanScoreThisGame: 120,
    });
  });

  expect(latest!.unlockedIds).toContain("point_getter");
});

test("ポイントゲッター: 100点未満なら解除されない", async () => {
  await mountAndWaitForLoad();

  act(() => {
    latest!.evaluateGameEnd({
      winnerId: HUMAN_PLAYER_ID,
      humanPassedThisGame: false,
      winMethod: { actionType: "divisor", fieldWasReset: true, table: 0 },
      gameIndex: 0,
      cumulativeScoresAfterThisGame: { 0: 40, 1: -20, 2: -15, 3: -5 },
      humanHandAfterLength: 0,
      allHandLengthsAfter: { 0: 0, 1: 2, 2: 1, 3: 1 },
      humanScoreThisGame: 40,
    });
  });

  expect(latest!.unlockedIds).not.toContain("point_getter");
});

test("常連プレイヤー: 累計3セット勝利で解除される(プレイ回数ではなく勝利数が基準)", async () => {
  await mountAndWaitForLoad();

  const players = makePlayers(["easy", "medium", "hard"]);

  // 1勝目・2勝目ではまだ解除されない
  for (let i = 0; i < 2; i++) {
    act(() => {
      latest!.evaluateSetEnd({
        cumulativeScores: { 0: 20, 1: 5, 2: 3, 3: 1 },
        gameWinners: [HUMAN_PLAYER_ID],
        playerConfigs: players,
      });
    });
  }
  expect(latest!.unlockedIds).not.toContain("five_sets");

  // 3セット目に負けても(プレイ回数は増えるが勝利数は増えない)まだ解除されない
  act(() => {
    latest!.evaluateSetEnd({
      cumulativeScores: { 0: 1, 1: 20, 2: 3, 3: 1 },
      gameWinners: [1],
      playerConfigs: players,
    });
  });
  expect(latest!.unlockedIds).not.toContain("five_sets");

  // 3勝目で解除される
  act(() => {
    latest!.evaluateSetEnd({
      cumulativeScores: { 0: 20, 1: 5, 2: 3, 3: 1 },
      gameWinners: [HUMAN_PLAYER_ID],
      playerConfigs: players,
    });
  });
  expect(latest!.unlockedIds).toContain("five_sets");
});
