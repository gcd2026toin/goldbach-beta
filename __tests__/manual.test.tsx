import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { GameScreenTestHarness } from "../testUtils/testHarness";
import { ThemeProvider } from "../src/ThemeContext";
import { PlayerConfig } from "../src/state/useGameSession";

const players: PlayerConfig[] = [
  { id: 0, name: "あなた", isBot: false, difficulty: "easy" },
  { id: 1, name: "b1", isBot: true, difficulty: "easy" },
  { id: 2, name: "b2", isBot: true, difficulty: "medium" },
  { id: 3, name: "b3", isBot: true, difficulty: "hard" },
];

test("raw react-test-renderer mount", () => {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider>
        <GameScreenTestHarness players={players} onExit={() => {}} />
      </ThemeProvider>
    );
  });
  console.log("mounted ok");

  // Pressableをすべて探して、テキストに"出す"を含むものを押してみる
  const root = renderer!.root;
  const pressables = root.findAllByProps({}).filter((n: any) => typeof n.props.onPress === "function");
  console.log("pressable count:", pressables.length);

  for (const p of pressables) {
    try {
      act(() => {
        p.props.onPress();
      });
    } catch (e) {
      console.log("PRESS THREW:", e);
    }
  }
  console.log("done pressing");
});
