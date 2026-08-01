import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { PLAY_SOUND_URI, SELECT_SOUND_URI } from "./soundData";

type SoundKey = "select" | "play";

const playerCache: Partial<Record<SoundKey, AudioPlayer>> = {};

function getPlayer(key: SoundKey): AudioPlayer | null {
  const cached = playerCache[key];
  if (cached) return cached;
  try {
    const source = key === "select" ? SELECT_SOUND_URI : PLAY_SOUND_URI;
    const player = createAudioPlayer(source);
    // 波形自体の振幅も抑えているが、端末側の音量差による歪みを避けるため
    // プレイヤーの再生音量にも安全マージンを持たせておく
    player.volume = 0.7;
    playerCache[key] = player;
    return player;
  } catch {
    return null; // 効果音が鳴らせなくてもゲーム進行には影響させない
  }
}

// 選択したタイミングで初めてプレイヤーを作ると、その1回目だけ再生が遅れて感じられるため、
// モジュール読み込み時にあらかじめ音声モードの設定とプレイヤーの生成を済ませておく。
setAudioModeAsync({ playsInSilentMode: true }).catch(() => {
  // 端末によっては失敗することがあるが、効果音が鳴らない程度なので無視してよい
});
getPlayer("select");
getPlayer("play");

/** 選択操作からの体感の遅延を減らすため、Promiseを待たずに即座に発音する */
function replay(key: SoundKey) {
  const player = getPlayer(key);
  if (!player) return;
  try {
    // 連続ですばやく選択したときに前の再生と重なって歪んだように聞こえるのを防ぐため、
    // 一度確実に止めてから頭出しし直す
    player.pause();
    player.seekTo(0); // 完了を待たずに即play()する(体感の遅延を減らすため)
    player.play();
  } catch {
    // 再生に失敗しても無視する
  }
}

/** カードを選択/選択解除したときの短いクリック音 */
export function playSelectSound() {
  replay("select");
}

/** 「出す」を実行したときの短いチャイム音 */
export function playConfirmSound() {
  replay("play");
}
