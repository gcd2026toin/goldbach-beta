// 数論ユーティリティ

export function gcd2(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function gcdArray(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((acc, n) => gcd2(acc, n));
}

export function isCoprime(a: number, b: number): boolean {
  return gcd2(a, b) === 1;
}

/** 与えられた数の集合について、どの2つを取っても互いに素かを判定 */
export function isPairwiseCoprime(nums: number[]): boolean {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (!isCoprime(nums[i], nums[j])) return false;
    }
  }
  return true;
}

export function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

export function max(nums: number[]): number {
  return nums.reduce((a, b) => Math.max(a, b), -Infinity);
}

/** 配列から size 個を選ぶ組み合わせを全列挙する(添字ベース、重複カード区別のため元配列のindexで返す) */
export function combinations<T>(arr: T[], size: number): T[][] {
  const results: T[][] = [];
  const combo: T[] = [];

  function backtrack(start: number) {
    if (combo.length === size) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      backtrack(i + 1);
      combo.pop();
    }
  }

  backtrack(0);
  return results;
}

/**
 * ランク1〜13のうち、table と互いに素でない(=公約数を持つ)ものの個数を返す。
 * あがった際の「全員が最後の場のテーブルと互いに素な手札を捨てる」ルールにおいて、
 * この値が大きいほど(=table が合成数寄りであるほど)相手の手札が生き残りやすく、
 * あがったプレイヤーの得点が伸びやすい。逆に table が(特に13より大きい)素数だと
 * ほぼ全てのランクが互いに素になり、相手の手札がほぼ全て捨てられ得点が伸びない。
 */
export function countNonCoprimeRanks(table: number, maxRank: number = 13): number {
  let count = 0;
  for (let r = 1; r <= maxRank; r++) {
    if (!isCoprime(r, table)) count++;
  }
  return count;
}

/** nが素数かどうかを判定する(1以下はfalse) */
export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}
