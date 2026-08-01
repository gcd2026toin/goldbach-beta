import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { GameScreenTestHarness } from "../testUtils/testHarness";
import { ThemeProvider } from "../src/ThemeContext";
import { PlayerConfig } from "../src/state/useGameSession";

test("全員botでセットを何度も自動進行させ、非同期エラーを洗い出す", () => {
  jest.useFakeTimers();
  const originalConsoleError = console.error;
  const errors: any[] = [];
  console.error = (...args: any[]) => {
    errors.push(args);
    originalConsoleError(...args);
  };

  for (let trial = 0; trial < 10; trial++) {
    const players: PlayerConfig[] = [
      { id: 0, name: "あなた", isBot: true, difficulty: "easy" }, // ストレステスト用に全員bot化
      { id: 1, name: "b1", isBot: true, difficulty: "medium" },
      { id: 2, name: "b2", isBot: true, difficulty: "hard" },
      { id: 3, name: "b3", isBot: true, difficulty: "easy" },
    ];

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider>
          <GameScreenTestHarness players={players} onExit={() => {}} />
        </ThemeProvider>
      );
    });

    // 3ゲーム分、十分な回数タイマーを進めて自動進行させる
    for (let i = 0; i < 400; i++) {
      act(() => {
        jest.advanceTimersByTime(600);
      });
    }

    act(() => {
      renderer!.unmount();
    });
  }

  console.error = originalConsoleError;
  if (errors.length > 0) {
    console.log("captured console.error calls:", errors.length);
    for (const e of errors.slice(0, 5)) console.log(e);
  }
  expect(errors.length).toBe(0);
});
