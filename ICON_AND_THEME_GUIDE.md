# ゴールドバッハ - アイコン＆ダークモード完全ガイド

## 📋 概要

このガイドは以下を説明します：
1. **ユーザー提供画像をアプリアイコンに設定する方法**
2. **スマホのダークモード設定に自動対応するUI色設定**
3. **トランプカードは両モード共通で変えない理由と実装**

---

## 🎯 やることリスト（優先度順）

### ステップ 1: ユーザー画像を用意
**状態**: ⏳ 待機中（あなたが画像を提供する）

必要なファイル（サイズ: 1024×1024 px）:
- `icon.png` - 全プラットフォーム共通アイコン（背景あり）
- `android-icon-foreground.png` - Android前景（背景なし・透明）
- `android-icon-background.png` - Android背景（単色・`#FAF6EE` 推奨）
- `android-icon-monochrome.png` - モノクロ版（背景なし・グレースケール）
- `favicon.png` - Web用（192×192 px 以上）

### ステップ 2: app.json 設定
**状態**: ✅ 完了（既に修正済み）

変更内容:
- `"userInterfaceStyle": "automatic"` ← ダークモード自動対応
- `"android.adaptiveIcon.backgroundColor": "#FAF6EE"` ← 背景色固定

### ステップ 3: ダークモード対応
**状態**: ✅ 完了（既に実装済み）

実装済み機能:
- `theme.ts` - ライト/ダーク両カラーパレット完成
- 全UIコンポーネント - テーマ対応
- トランプカード - 両モード共通色

### ステップ 4: ビルド & テスト
**状態**: 🚀 すぐ実行可能

手順:
```bash
# ローカルテスト
npx expo start

# APK ビルド
eas build --platform android

# スマホ設定でダークモード ON/OFF → 色が自動切り替わる
```

---

## 🖼️ アイコン配置の詳細

### 必要なファイル構成

```
assets/
├── icon.png                        (1024×1024, 背景あり)
├── android-icon-foreground.png     (1024×1024, 透明背景)
├── android-icon-background.png     (1024×1024, 単色)
├── android-icon-monochrome.png     (1024×1024, グレースケール・透明)
├── favicon.png                     (192×192 以上)
└── splash-icon.png                 (1024×1024)
```

### 各ファイルの役割

| ファイル | 用途 | 背景 | Android適応型 | 優先度 |
|---------|------|------|---------|--------|
| icon.png | 全プラットフォーム | 不透明 | × | ⭐⭐⭐ |
| android-icon-foreground.png | ロゴ層 | 透明 | ✓ | ⭐⭐⭐ |
| android-icon-background.png | 背景層 | 単色 | ✓ | ⭐⭐⭐ |
| android-icon-monochrome.png | グレースケール | 透明 | ✓ | ⭐⭐ |
| favicon.png | Web用 | 不透明 | × | ⭐ |
| splash-icon.png | スプラッシュ | 不透明 | × | ⭐ |

### 配置手順

1. **画像ファイルをダウンロード** (あなたが用意)
2. **`assets/` フォルダに配置**
   ```bash
   cp my-icon.png ./assets/icon.png
   cp my-foreground.png ./assets/android-icon-foreground.png
   # ... 他のファイルも同様
   ```
3. **app.json を確認** (既に設定済み)
4. **ビルドして確認**

---

## 🎨 ダークモード対応の詳細

### カラーパレット

#### ライトモード（デイライト）
```
背景:         #FAF6EE (温かみのある白)
フィールド:   #EFE6D3
テキスト:     #2A2420 (濃いグレー)
アクセント:   #B8863B (ゴールド)
枠線:         #E3D9C4
```

#### ダークモード（ナイト）
```
背景:         #16151A (シックな黒)
フィールド:   #1F1D22
テキスト:     #EDE8DE (明るい灰)
アクセント:   #D9AA4D (明度UP・視認性確保)
枠線:         #332F38
```

### 共通色（両モード共通・変えない）
```
トランプカード面: #FFFDF8 (温白)
トランプ裏面:     紺色
```

### なぜトランプは変えないのか？

実物のトランプは黒背景でも白背景でも同じ見た目（温白）です。ゴールドバッハは「実物のトランプらしい質感」を両テーマで統一する設計なので、カード色は固定です。

---

## 📱 スマホでの確認方法

### ローカルテスト（開発中）

```bash
# Expoサーバー起動
cd goldbach-app
npx expo start

# スマホで Expo Go アプリを開く
# QRコードをスキャン → アプリ起動

# スマホ設定で ダークモード ON/OFF
# → リアルタイムに色が切り替わる
```

### APK インストール後

```bash
# ビルド（EAS Build）
eas build --platform android --profile preview

# ビルド完了後、APKをスマホにインストール

# スマホ設定 → 表示/照度 → ダークモード確認
```

### 確認チェックリスト

- [ ] **ライトモード**
  - [ ] 背景が温かみのある白 (`#FAF6EE`)
  - [ ] テキストが濃いグレー (`#2A2420`)
  - [ ] ゴールドボタンが `#B8863B`
  - [ ] トランプが温白 (`#FFFDF8`)

- [ ] **ダークモード**
  - [ ] 背景がシックな黒 (`#16151A`)
  - [ ] テキストが明るい灰 (`#EDE8DE`)
  - [ ] ゴールドボタンが `#D9AA4D`（明るく見える）
  - [ ] トランプが同じ温白 (`#FFFDF8`）← **変わらない**

---

## 🔧 実装の詳細

### app.json（修正済み）

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#FAF6EE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      }
    }
  }
}
```

**重要な設定の意味:**
- `"automatic"` → システム設定に自動追従（ユーザーがダークモード ON/OFF で自動切り替え）
- `backgroundColor` → Android適応型アイコンの背景（ライトモード基調で固定）

### ThemeContext.tsx（既に実装済み）

```typescript
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme(); // "light" or "dark" or null
  const mode: ThemeMode = scheme === "dark" ? "dark" : "light";
  const theme = getTheme(mode);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
```

**仕組み:**
1. `useColorScheme()` がシステムのダークモード設定を取得
2. ✅ なら `"dark"` → ダークテーマを適用
3. ❌ なら `"light"` → ライトテーマを適用

### すべてのコンポーネント（既に対応）

```typescript
// どのコンポーネントでも自動切り替え
const theme = useTheme();

<View style={{ backgroundColor: theme.colors.background }}>
  {/* 背景色が自動で切り替わる */}
</View>
```

---

## ⚠️ よくある質問

### Q1: アイコンもダークモードで色が変わる？
**A**: いいえ。アイコンはシステム設定に依存しない設計です。
- ユーザーがダークモード ON → アイコンは同じ見た目（ライトモード基調のまま）
- これは意図的な設計（実物のトランプも、どんな環境でも同じ見た目）

### Q2: トランプカードのみ両モード共通？
**A**: はい。理由:
- 実物のトランプは白背景でも黒背景でも温白色
- ゲーム性を損なわないため

### Q3: 背景色を変えたい
**A**: `src/theme.ts` を修正：
```typescript
dark: {
  background: "#1A1A1A", // ここを変更
  // ... 他の色
}
```

### Q4: ダークモード時、アイコンが見えない
**A**: `android-icon-foreground.png` の高コントラストを確認：
- 前景色は十分な濃さ（黒系）
- フォアグラウンドとバックグラウンドの色差を確認

---

## 📚 参考ドキュメント

各ドキュメントで詳細を解説しています：

- **`ICON_SETUP.md`** - アイコン設定の詳細手順
- **`THEME_COLORS.md`** - ダークモード対応のカラー説明
- **`ASSETS_README.md`** - assets フォルダのファイル配置ガイド

---

## 🚀 最終チェックリスト

- [ ] ユーザー画像を5ファイル用意（1024×1024 × 4 + 192×192 × 1）
- [ ] `assets/` フォルダに配置
- [ ] `app.json` 確認（修正版使用）
- [ ] ローカルテスト: `npx expo start` で ライト/ダーク両方確認
- [ ] APK ビルド: `eas build --platform android`
- [ ] スマホにインストール
- [ ] ダークモード ON/OFF で色が切り替わることを確認
- [ ] トランプカードが両モード同じ色なことを確認
- [ ] 高校文化祭で頒布！

---

**修正日**: 2026年7月29日
**修正内容**: 
- app.json ダークモード対応（userInterfaceStyle: automatic）
- theme.ts にダーク色パレット実装済み（既に完成）
- 全UIコンポーネントがテーマ対応済み
