# ゴールドバッハ - Claude 開発者向けコンテキスト

## プロジェクト概要

**ゴールドバッハ** (Goldbach Card Game) は、数論（素数・互いに素性・最大公約数）をテーマにしたカードゲームです。

- **言語**: TypeScript + React Native + Expo
- **プラットフォーム**: Web版（Cloudflare Pages でのデプロイ）
- **機能**: 3段階 AI、トロフィーシステム、ダークモード対応
- **用途**: 高校文化祭での配布・展示

## 技術スタック

```
React Native (Expo)
├── Web: React Native Web + Expo Web
├── UI: React Hooks + Context (theme)
├── ゲームエンジン: 数論ルール実装
├── AI: 難度別ボット戦略
└── 永続化: AsyncStorage
```

## アーキテクチャ

```
src/
├── screens/          # UI画面
├── components/       # 再利用可能UI
├── engine/          # ゲームルール・AI
├── trophies/        # トロフィーシステム
├── audio/           # 効果音（Base64）
└── theme.ts / ThemeContext.tsx  # ダークモード対応
```

## 開発コマンド

```bash
npm install                 # 依存関係インストール
npx expo start             # ローカル開発（QRコード表示）
npx expo start --web       # ブラウザテスト
npm run build:web          # Web版ビルド
npm test                   # テスト実行
```

## 設定ファイル

- `app.json` - Expo アプリ設定（userInterfaceStyle: "automatic"）
- `tsconfig.json` - TypeScript 設定
- `package.json` - 依存関係・スクリプト
- `.gitignore` - Git 除外設定（dist/, build/ など）

## ドキュメント

開発補助ドキュメント：
- `SETUP.md` - セットアップと動作確認手順
- `ICON_AND_THEME_GUIDE.md` - UI カスタマイズガイド
- `THEME_COLORS.md` - ダークモード色詳細
- `@AGENTS.md` - AI エージェント向けコンテキスト

## 注意事項

### APK / EAS Build について

現在、APK（Android ネイティブアプリ）の生成は非サポートです。Web版のみのデプロイです。

- ビルドコマンド: `npm run build:web` のみ
- デプロイ: `dist/` ディレクトリを Cloudflare Pages にプッシュ
- 環境: Node.js 18+, npm 9+, Expo CLI

### 開発時の便利なTips

1. ダークモード検証: スマホ設定で直接切り替え → リアルタイム反映
2. テーマカラー調整: `src/theme.ts` で定義（再読み込みで反映）
3. AI 難度テスト: HomeScreen で難度変更 → 即座にテスト可能

## 最新の修正内容

- Bot 難度の画面遷移時持ち越し
- ダークモード自動対応
- トロフィーシステム完成
- Web 版ビルド最適化

---

**最終更新**: 2026年8月3日
**ターゲット**: Expo 57.x / React Native 0.86 / TypeScript 6.0
