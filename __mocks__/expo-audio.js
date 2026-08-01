// jest実行環境にはexpo-audioのネイティブモジュールが存在しないため、
// テストに必要な最小限のインターフェースだけを持つモックを提供する。

class MockAudioPlayer {
  play() {}
  pause() {}
  replace() {}
  async seekTo() {}
  remove() {}
}

function createAudioPlayer() {
  return new MockAudioPlayer();
}

async function setAudioModeAsync() {
  return undefined;
}

module.exports = {
  AudioPlayer: MockAudioPlayer,
  createAudioPlayer,
  setAudioModeAsync,
};
