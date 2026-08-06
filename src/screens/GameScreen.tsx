import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../ThemeContext";
import { TopBar } from "../components/TopBar";
import { OpponentRow } from "../components/OpponentRow";
import { FieldArea, PlayAnimationInfo } from "../components/FieldArea";
import { HandRow } from "../components/HandRow";
import { ActionBar } from "../components/ActionBar";
import { RoundSummaryOverlay } from "../components/RoundSummaryOverlay";
import { TrophyUnlockToast } from "../components/TrophyUnlockToast";
import { RulesModal } from "../components/RulesModal";
import { UserScoreDisplay } from "../components/UserScoreDisplay";
import { SetSummaryScreen } from "./SetSummaryScreen";
import { PlayerConfig, useGameSession, HUMAN_PLAYER_ID, GAMES_PER_SET } from "../state/useGameSession";
import { TrophyEngine } from "../trophies/useTrophyEngine";

interface GameScreenProps {
  players: PlayerConfig[];
  onExit: () => void;
  trophyEngine: TrophyEngine;
}

/**
 * 出した人の画面上の位置に応じて、カードが飛んでくる開始座標(中心からの相対値)を決める。
 * 自分(画面下)なら下から、botなら上から、複数botがいる場合は横方向もそれぞれの並び順に寄せる。
 */
function computeOrigin(playerId: number, bots: PlayerConfig[]): { originX: number; originY: number } {
  if (playerId === HUMAN_PLAYER_ID) {
    return { originX: 0, originY: 130 };
  }
  const index = bots.findIndex((b) => b.id === playerId);
  const count = bots.length;
  const spread = 100;
  const originX = count <= 1 ? 0 : (index - (count - 1) / 2) * (spread / Math.max(1, count - 1));
  return { originX, originY: -130 };
}

export function GameScreen({ players, onExit, trophyEngine }: GameScreenProps) {
  const theme = useTheme();
  const [rulesVisible, setRulesVisible] = React.useState(false);
  const isPaused = rulesVisible; // ルールモーダル表示中は試合を一時停止
  const session = useGameSession(players, isPaused);
  const bots = players.filter((p) => p.isBot);
  const human = session.state.players.find((p) => p.id === HUMAN_PLAYER_ID)!;
  const pendingAgariName = session.state.pendingAgari
    ? players.find((p) => p.id === session.state.pendingAgari!.playerId)?.name
    : null;

  const playAnimation: PlayAnimationInfo | null = session.playAnimation
    ? { nonce: session.playAnimation.nonce, ...computeOrigin(session.playAnimation.playerId, bots) }
    : null;

  const currentPlayerName = players.find((p) => p.id === session.state.currentPlayerId)?.name || "不明";

  // 1ゲームが終わった(結果が確定した)瞬間に1回だけトロフィー判定する
  const evaluatedGameRef = useRef<number>(-1);
  useEffect(() => {
    if (!session.roundSummary || !trophyEngine.isLoaded) return;
    if (evaluatedGameRef.current === session.roundSummary.gameIndex) return;
    evaluatedGameRef.current = session.roundSummary.gameIndex;
    trophyEngine.evaluateGameEnd({
      winnerId: session.roundSummary.winnerId,
      humanPassedThisGame: session.roundSummary.humanPassedThisGame,
      winMethod: session.roundSummary.winMethod,
      gameIndex: session.roundSummary.gameIndex,
      cumulativeScoresAfterThisGame: session.cumulativeScores,
      humanHandAfterLength: session.roundSummary.humanHandAfter.length,
      allHandLengthsAfter: session.roundSummary.allHandLengthsAfter,
      humanScoreThisGame: session.roundSummary.scoresThisGame[HUMAN_PLAYER_ID] ?? 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.roundSummary, trophyEngine.isLoaded]);

  // セットが終わった瞬間に1回だけセット単位のトロフィー判定をする
  const evaluatedSetRef = useRef(false);
  useEffect(() => {
    if (!session.setComplete || !trophyEngine.isLoaded || evaluatedSetRef.current) return;
    evaluatedSetRef.current = true;
    trophyEngine.evaluateSetEnd({
      cumulativeScores: session.cumulativeScores,
      gameWinners: session.gameWinners,
      playerConfigs: players,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.setComplete, trophyEngine.isLoaded]);

  if (session.setComplete) {
    return (
      <>
        <SetSummaryScreen players={players} cumulativeScores={session.cumulativeScores} onBackToHome={onExit} />
        <TrophyUnlockToast trophies={trophyEngine.newlyUnlocked} onDismiss={trophyEngine.dismissNewlyUnlocked} />
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TrophyUnlockToast trophies={trophyEngine.newlyUnlocked} onDismiss={trophyEngine.dismissNewlyUnlocked} />
      <View style={styles.topSection}>
        <TopBar gameIndex={session.gameIndex} onBack={onExit} />
        <OpponentRow bots={bots} state={session.state} cumulativeScores={session.cumulativeScores} forcedPassIds={session.forcedPassIds} />
      </View>

      <View style={styles.middleSection}>
        <FieldArea field={session.state.field} clearedSnapshot={session.clearedFieldSnapshot} playAnimation={playAnimation} onRulesPress={() => setRulesVisible(true)} />
        {pendingAgariName && (
          <Text
            style={[
              styles.agariBanner,
              { color: theme.colors.accentGold, fontFamily: theme.typography.body.fontFamily },
            ]}
          >
            {pendingAgariName}があがりました！カードを整理しています…
          </Text>
        )}
      </View>

      <UserScoreDisplay score={session.cumulativeScores[HUMAN_PLAYER_ID] ?? 0} />

      <View style={styles.bottomSection}>
        <HandRow hand={human.hand} selected={session.selected} onToggle={session.toggleCard} disabled={!session.isHumanTurn} />
        <ActionBar
          isMyTurn={session.isHumanTurn}
          canPlay={session.canPlaySelected}
          canPass={session.canPass}
          selectedCount={session.selected.length}
          onPlay={session.playSelected}
          onPass={session.pass}
          humanPassed={human.passed}
          humanPassWasForced={session.forcedPassIds.has(HUMAN_PLAYER_ID)}
          isForcedPassPending={session.isForcedPassPending}
          currentPlayerName={currentPlayerName}
        />
      </View>

      {session.roundSummary && (
        <RoundSummaryOverlay
          visible={!!session.roundSummary}
          winnerId={session.roundSummary.winnerId}
          scoresThisGame={session.roundSummary.scoresThisGame}
          players={players}
          gameIndex={session.gameIndex}
          gamesPerSet={GAMES_PER_SET}
          onNext={session.proceedToNextGame}
          finalTable={session.roundSummary.finalTable}
          humanHandBeforeDiscard={session.roundSummary.humanHandBeforeDiscard}
        />
      )}

      <RulesModal visible={rulesVisible} onClose={() => setRulesVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topSection: {
    // 高さは中身なりに固定。伸び縮みしない
  },
  middleSection: {
    flex: 1, // 上下の間の余白をここが吸収し、場を画面中央に据える
    justifyContent: "center",
  },
  bottomSection: {
    // 手札とアクションバーは下部に固定
  },
  agariBanner: {
    textAlign: "center",
    fontSize: 21,
    fontWeight: "600",
    marginTop: 6,
  },
});
