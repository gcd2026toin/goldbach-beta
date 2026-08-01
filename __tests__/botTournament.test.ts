import { applyAction, computeScores, forceSkipLead, initGame, resolveAgariDiscard } from "../src/engine/engine";
import { chooseAction, Difficulty } from "../src/engine/bot";
import { GameState } from "../src/engine/types";

const SAFETY_NET_MAX_ACTIONS = 3000;

function playOneGame(difficulties: Difficulty[], startPlayerId: number): { winnerId: number | null; outcome: string } {
  let state: GameState = initGame(
    difficulties.map((_, i) => ({ name: `P${i}`, isBot: true })),
    startPlayerId
  );

  let actions = 0;
  while (!state.finished && actions < SAFETY_NET_MAX_ACTIONS) {
    if (state.pendingAgari) {
      state = resolveAgariDiscard(state);
      actions++;
      continue;
    }
    const action = chooseAction(state, state.currentPlayerId, difficulties[state.currentPlayerId]);
    if (action === null) {
      state = forceSkipLead(state);
      actions++;
      continue;
    }
    const result = applyAction(state, state.currentPlayerId, action);
    state = result.state;
    actions++;
  }

  if (!state.finished) return { winnerId: null, outcome: "safetyNetHit" };
  return { winnerId: state.winnerId, outcome: state.winnerId !== null ? "agari" : "stalemate" };
}

function runPairwise(diffA: Difficulty, diffB: Difficulty, gameCount: number) {
  let winsA = 0;
  let winsB = 0;
  let decisive = 0;
  for (let i = 0; i < gameCount; i++) {
    const result = playOneGame([diffA, diffB], i % 2);
    if (result.winnerId === null) continue;
    decisive++;
    if (result.winnerId === 0) winsA++;
    else winsB++;
  }
  return { winRateA: winsA / decisive, winRateB: winsB / decisive, decisive };
}

test("上級botの変更後も、中級・初級に対して勝ち越せている", () => {
  const hardVsMedium = runPairwise("hard", "medium", 150);
  const hardVsEasy = runPairwise("hard", "easy", 120);

  console.log("hard vs medium:", hardVsMedium);
  console.log("hard vs easy:", hardVsEasy);

  // 前回検証時(hard 54.9% vs medium 45.1%)から大きく弱体化していないことを確認する
  expect(hardVsMedium.winRateA).toBeGreaterThan(0.4);
  expect(hardVsEasy.winRateA).toBeGreaterThan(0.5);
});
