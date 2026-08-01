import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { useGameSession, PlayerConfig } from "../src/state/useGameSession";
import { getLegalActions } from "../src/engine/rules";

let latestSession: ReturnType<typeof useGameSession> | null = null;

function Harness({ players }: { players: PlayerConfig[] }) {
  const session = useGameSession(players);
  latestSession = session;
  return null;
}

test("人間操作(カード選択→出す/パス)を直接叩いてクラッシュを再現する", () => {
  jest.useFakeTimers();
  const originalConsoleError = console.error;
  const errors: any[] = [];
  console.error = (...args: any[]) => {
    errors.push(args);
  };

  for (let trial = 0; trial < 30; trial++) {
    const players: PlayerConfig[] = [
      { id: 0, name: "あなた", isBot: false, difficulty: "easy" },
      { id: 1, name: "b1", isBot: true, difficulty: "easy" },
      { id: 2, name: "b2", isBot: true, difficulty: "medium" },
      { id: 3, name: "b3", isBot: true, difficulty: "hard" },
    ];

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<Harness players={players} />);
    });

    // 何ターンか進める。人間の番なら合法手を1つ選んで出す(またはpass)。bot番ならタイマーを進める。
    for (let step = 0; step < 30 && latestSession && !latestSession.state.finished; step++) {
      const session = latestSession;
      const isHuman = session.isHumanTurn;
      if (isHuman) {
        const legal = getLegalActions(session.state, 0);
        const nonPass = legal.find((a) => a.type !== "pass");
        try {
          if (nonPass && nonPass.type !== "pass") {
            act(() => {
              for (const c of nonPass.cards) {
                latestSession!.toggleCard(c);
              }
            });
            act(() => {
              latestSession!.playSelected();
            });
          } else {
            act(() => {
              latestSession!.pass();
            });
          }
        } catch (e) {
          console.log(`TRIAL ${trial} STEP ${step} THREW:`, e);
          errors.push([e]);
        }
      } else {
        act(() => {
          jest.advanceTimersByTime(700);
        });
      }
    }

    act(() => {
      renderer!.unmount();
    });
    latestSession = null;
  }

  console.error = originalConsoleError;
  if (errors.length > 0) {
    console.log("captured errors:", errors.length);
    for (const e of errors.slice(0, 10)) console.log(e);
  }
  expect(errors.length).toBe(0);
});
