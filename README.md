[README.md](https://github.com/user-attachments/files/30680917/README.md)
# ゴールドバッハ

数論をテーマにした1人用カードゲームです。ジョーカーを抜いた52枚のトランプを使い、互いに素・公約数・テーブルといった数論的な概念がゲームのルールに組み込まれています。

ブラウザで動作します。

---

## ゲームの概要

1人のプレイヤーと3体のボット（b1・b2・b3）が3ゲームを1セットとして対戦します。

### 用語

| 用語 | 意味 |
|------|------|
| テーブル | 出したカードの数字の総和 |
| スコア | 出したカードの数字の最大値 |
| あがり | 手札を全てなくすこと |

### 出し方

場が空のとき、ターンを始める人が **2枚または3枚** を出します。テーブルが23以下であることが条件です。
もしどうしようもなく出せない場合は、かつその時に限り強制的にパスとなり、手番を次プレイヤーに回します。
場に札があるとき、次の3つのいずれかを選びます。

**① 上乗せ** — 場と同じテーブルで、場より高いスコアになる2枚または3枚を出します。3枚出したカードがどの2枚を取っても互いに素であれば、場が空になり
ます。

**② 公約数出し** — 場札の数字すべての公約数である数字のカードを、直前の枚数より1枚少なく出します。場は空になります。

**③ パス** — 何も出さず手番を終えます。

パスした状態では、次に場が空になるまでカードを出せません。

### あがりと得点

手札を全てなくすとあがりです。残りのプレイヤーは、最後に場に出されたテーブルと互いに素でない手札を捨てます。あがれなかった各プレイヤーが残した手札の数字の合計だけ失点し、あがったプレイヤーは他プレイヤーの失点の合計だけ得点します。
どのプレイヤーも残り手札が1枚になるなど、誰もあがれない場合はそのゲームをデッドロック（引き分け）とし、各プレイヤーが残した手札の数字の合計だけ失点にします。


---

## bot性能
本ゲームでは3段階の強さのbotを用意しています。
- **初級** - 手番ごとに合法手があればそのうちランダムに1つを実行し、なければただパスをする。ゲームルールを理解してまもないニュービーが対象。
- **中級** - 1手に出す札の多さやターン奪取の可否、残す手札の質や次の手番プレイヤーの最善手にあがり手をすべて評価し、能動的なパスも視野に入れて評価値の最も高い選択を採る。ルールに馴れて駆け引きを楽しむいっぱしのプレイヤーが対象。
-**上級** - 中級と同様の観点で評価された上位10パターンの候補手について、maxN法を用いて6手先までシミュレーションする。この上で、自分の暫定順位によって目指すあがり方を動的に変える。セットを俯瞰し大局的な勝ちをつかむ強者が対象。

## 記録
勝利したゲーム・セット数が記録されます。
さらに、達成した実績に応じてトロフィーが表示されます。勝利回数やゲーム・セット内での立ち回り、あがり方に応じて13種を実装しました。
ブラウザページのキャッシュが保存される限り、これらの情報は保持されます。

---

## 開発

### 必要な環境

- Node.js 18 以上
- npm

### ローカルで動かす

```bash
git clone https://github.com/gcd2026toin/goldbach-cardgame.git
cd goldbach-cardgame
npm install
npx expo start --web
```

ブラウザが自動で開きます。

### Web版をビルドする

```bash
npm run build:web
```

`dist/` に出力されます。Cloudflare Pages などの静的ホスティングにそのままデプロイできます。

### テストを実行する

```bash
npm test
```

###対応ブラウザ

以下のブラウザでの正常な動作を確認しています。
Google Chrome, Safari, Saumsung Browser, Microsoft Edge, Yahoo! Japan


ただしSamsung Browserダークモードにおいて、一部のボタンが深い赤色を呈し視認性が悪くなります。現在修正を検討中です。

---

## プロジェクト構成

```
goldbach-cardgame/
├── App.tsx                    # ルートコンポーネント。ナビゲーションと難度設定の状態管理
├── index.ts                   # Expo エントリポイント
├── app.json                   # Expo 設定（アプリ名・バージョン・ダークモード）
├── icon.png                   # アプリアイコン
├── package.json               # 依存関係・スクリプト定義
├── tsconfig.json              # TypeScript 設定
│
├── assets/
│   └── favicon.png            # ブラウザタブ用ファビコン
│
├── __mocks__/
│   └── expo-audio.js          # テスト用モック
│
├── __tests__/
│   ├── agariDiscard.test.ts   # あがり時の捨て牌ロジック
│   ├── botPrimeTable.test.ts  # ボットの素数テーブル判定
│   ├── botTournament.test.ts  # ボット同士の対戦シミュレーション
│   ├── humanInteraction.test.tsx
│   ├── manual.test.tsx        # 手動シナリオ
│   ├── stress.test.tsx        # ストレステスト
│   └── trophyLogic.test.tsx   # トロフィー解除条件
│
├── src/
│   ├── ThemeContext.tsx        # ダークモードのコンテキスト
│   ├── theme.ts               # ライト/ダーク両モードのカラーパレット
│   │
│   ├── engine/
│   │   ├── types.ts           # ゲームの型定義
│   │   ├── mathUtils.ts       # GCD・素数判定・互いに素判定
│   │   ├── rules.ts           # カード出しの合法手判定
│   │   ├── engine.ts          # ゲーム進行・ターン管理・勝敗判定
│   │   ├── bot.ts             # ボットAIの行動選択
│   │   └── counterHeuristic.ts
│   │
│   ├── screens/
│   │   ├── HomeScreen.tsx     # タイトル・難度設定画面
│   │   ├── GameScreen.tsx     # ゲームプレイ画面
│   │   └── SetSummaryScreen.tsx
│   │
│   ├── components/
│   │   ├── ActionBar.tsx      # カード選択・出す操作
│   │   ├── FieldArea.tsx      # 場（フィールド）の表示
│   │   ├── HandRow.tsx        # プレイヤー手札の表示
│   │   ├── OpponentRow.tsx    # 対戦相手の手札枚数表示
│   │   ├── TopBar.tsx         # スコア・ゲーム進捗
│   │   ├── RoundSummaryOverlay.tsx
│   │   ├── RulesModal.tsx     # ルール説明モーダル
│   │   ├── ColumnModal.tsx    # 数論コラムのモーダル
│   │   ├── TrophyListModal.tsx
│   │   └── TrophyUnlockToast.tsx
│   │
│   ├── cards/
│   │   ├── CardFace.tsx       # カード表面（スート・数字）
│   │   └── CardBack.tsx       # カード裏面
│   │
│   ├── audio/
│   │   ├── soundData.ts       # Base64エンコードされた効果音データ
│   │   └── soundManager.ts    # 効果音の再生管理
│   │
│   ├── trophies/
│   │   ├── trophyDefinitions.ts  # トロフィーの定義・解除条件
│   │   ├── trophyStore.ts        # AsyncStorage による永続化
│   │   └── useTrophyEngine.ts    # トロフィー判定 Hook
│   │
│   ├── state/
│   │   └── useGameSession.ts  # セッション状態管理 Hook
│   │
│   └── content/
│       └── columnContent.ts   # コラム記事のテキストコンテンツ
│
├── CLAUDE.md                  # Claude Code 向けプロジェクトコンテキスト
├── SETUP.md                   # セットアップ手順
├── ICON_AND_THEME_GUIDE.md    # アイコン・テーマカスタマイズガイド
├── THEME_COLORS.md            # ダークモードのカラーパレット詳細
└── LICENSE
```

---

## ライセンス

[MIT](./LICENSE)
