export interface TrophyDef {
  id: string;
  title: string;
  description: string;
  /** true の場合、獲得するまでタイトル・条件を伏せて表示する(獲得条件を推測させる隠しトロフィー) */
  hidden?: boolean;
}

/**
 * このゲームの数論的な特徴(互いに素・公約数・素数テーブルなど)に紐づけた実績。
 * 判定に必要な情報はすべて既存のゲーム進行の中で取得できるものだけを選んでいる
 * (新たに複雑な追跡の仕組みを増やさずに済むようにするため)。
 */
export const TROPHY_DEFS: TrophyDef[] = [
  {
    id: "first_win",
    title: "はじめの一歩",
    description: "初めて1ゲームに勝利する",
  },
  {
    id: "set_win",
    title: "覇者",
    description: "1セット(3ゲーム)を制する",
  },
  {
    id: "perfect_set",
    title: "全勝セット",
    description: "1セット中の3ゲームすべてに勝利する",
  },
  {
    id: "composite_table_finish",
    title: "合成数の学者",
    description: "約数の多いテーブルであがり、高得点を得る",
  },
  {
    id: "divisor_finish",
    title: "ディバイザー",
    description: "公約数出しであがって勝利する",
  },
  {
    id: "coprime_finish",
    title: "アンチディバイザー",
    description: "3枚の互いに素な組であがって勝利する",
  },
  {
    id: "five_sets",
    title: "常連プレイヤー",
    description: "累計3セット勝利する",
  },
  {
    id: "beat_hard_bot",
    title: "上級討伐",
    description: "上級bot3体を相手にセットを制する",
  },
  {
    id: "point_getter",
    title: "ポイントゲッター",
    description: "1ゲームで100点以上を獲得する",
  },
  {
    id: "no_pass_win",
    title: "見敵必殺",
    description: "一度もパスせずに1ゲームに勝利する",
    hidden: true,
  },
  {
    id: "escape_win",
    title: "逃げるが勝ち",
    description: "2ゲーム目終了時点で同率含め1位につけ、3ゲーム目は素数のテーブルであがってセットを終える",
    hidden: true,
  },
  {
    id: "free_ride",
    title: "タダ乗り",
    description: "あるゲームで、手札を全て捨てたプレイヤーが自分だけである",
    hidden: true,
  },
  {
    id: "comeback_win",
    title: "起死回生",
    description: "1セット中のあるゲームを終えて最下位(同率含め)でありながら、そのセットを制する",
    hidden: true,
  },
];

export function getTrophyDef(id: string): TrophyDef | undefined {
  return TROPHY_DEFS.find((t) => t.id === id);
}
