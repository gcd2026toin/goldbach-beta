// 場に出した手が「どれくらい返されやすいか」を、相手の手札を覗くことなく
// 公開情報(ルールと52枚という母集団)だけから見積もるヒューリスティック。
// 上級botの「守りに強いリードを選ぶ」判断に使う。

const MAX_RANK = 13;
const MAX_COPIES = 4;

// key: `${size}-${sum}` -> そのsum/size条件を満たす組み合わせのmax値の一覧(降順ソート済み)
const comboMaxTable = new Map<string, number[]>();

function buildTable() {
  for (const size of [2, 3] as const) {
    const counts: Record<number, number> = {};
    for (let r = 1; r <= MAX_RANK; r++) counts[r] = 0;

    const results: { sum: number; max: number }[] = [];

    function backtrack(startRank: number, chosen: number[]) {
      if (chosen.length === size) {
        results.push({ sum: chosen.reduce((a, b) => a + b, 0), max: Math.max(...chosen) });
        return;
      }
      for (let r = startRank; r <= MAX_RANK; r++) {
        if (counts[r] >= MAX_COPIES) continue;
        counts[r]++;
        chosen.push(r);
        backtrack(r, chosen); // r以上のみ選び組み合わせの重複を回避、同ランク重複はcounts上限で制御
        chosen.pop();
        counts[r]--;
      }
    }
    backtrack(1, []);

    const bySum = new Map<number, number[]>();
    for (const { sum, max } of results) {
      if (!bySum.has(sum)) bySum.set(sum, []);
      bySum.get(sum)!.push(max);
    }
    for (const [sum, maxes] of bySum) {
      comboMaxTable.set(`${size}-${sum}`, maxes.sort((a, b) => b - a));
    }
  }
}

buildTable();

/**
 * table(合計値)・size(枚数)・score(現在の場のスコア)を与えると、
 * 理論上そのtableを維持しつつscoreを超える組み合わせが一般に何通り存在するかを返す。
 * 値が小さいほど「返されにくい(守りが堅い)」リード/ビートとみなせる。
 */
export function estimateCounterDifficulty(table: number, size: 2 | 3, score: number): number {
  const maxes = comboMaxTable.get(`${size}-${table}`);
  if (!maxes) return 0;
  // maxesは降順ソート済みなので、scoreを超える最初の位置までがカウント対象
  let count = 0;
  for (const m of maxes) {
    if (m > score) count++;
    else break;
  }
  return count;
}
