import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "goldbach:trophyState:v1";

export interface TrophyState {
  unlockedIds: string[];
  totalSetsPlayed: number;
  totalSetsWon: number;
  totalGamesWon: number;
}

const EMPTY_STATE: TrophyState = {
  unlockedIds: [],
  totalSetsPlayed: 0,
  totalSetsWon: 0,
  totalGamesWon: 0,
};

/**
 * @react-native-async-storage/async-storage はネイティブ(Android/iOS)では
 * ネイティブの永続ストレージを、Webではブラウザの localStorage を使う実装が
 * 標準で同梱されているため、コードを分岐させずにそのままAPK/Web両対応にできる。
 */
export async function loadTrophyState(): Promise<TrophyState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STATE };
    const parsed = JSON.parse(raw);
    return {
      unlockedIds: Array.isArray(parsed.unlockedIds) ? parsed.unlockedIds : [],
      totalSetsPlayed: typeof parsed.totalSetsPlayed === "number" ? parsed.totalSetsPlayed : 0,
      totalSetsWon: typeof parsed.totalSetsWon === "number" ? parsed.totalSetsWon : 0,
      totalGamesWon: typeof parsed.totalGamesWon === "number" ? parsed.totalGamesWon : 0,
    };
  } catch {
    return { ...EMPTY_STATE }; // 読み込みに失敗してもアプリは通常通り遊べるようにする
  }
}

export async function saveTrophyState(state: TrophyState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 保存に失敗してもゲーム進行自体には影響させない
  }
}
