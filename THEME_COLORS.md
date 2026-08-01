# ゴールドバッハ - ダークモード対応カラーパレット

## 🎨 カラースキーム

### ライトモード（デイライト）
```
背景色:         #FAF6EE (温かみのある白)
フィールド:     #EFE6D3 (場の背景)
カード面:       #FFFDF8 (トランプ・テーマ非依存)
テキスト主:     #2A2420 (濃いグレー)
テキスト副:     #7A7166 (淡いグレー)
ゴールド強調:   #B8863B (メインアクセント)
ゴールド濃:     #8C6329 (強調用)
ティール:       #2F5D62 (互いに素・公約数強調)
枠線:           #E3D9C4 (薄い枠)
ゴールド上:     #FFFDF8 (ゴールド枠上のテキスト)
```

### ダークモード（ナイト）
```
背景色:         #16151A (シックな黒)
フィールド:     #1F1D22 (場の背景)
カード面:       #FFFDF8 (トランプ・テーマ非依存 ← 注目！)
テキスト主:     #EDE8DE (明るい灰)
テキスト副:     #9C978C (やや薄い灰)
ゴールド強調:   #D9AA4D (明度UP・黒地でも視認性確保)
ゴールド濃:     #C9962E (強調用)
ティール:       #5FA0A6 (互いに素・公約数強調・やや明るく)
枠線:           #332F38 (薄い枠)
ゴールド上:     #16151A (ゴールド枠上のテキスト・背景と同色)
```

## 🔄 テーマ切り替えの実装

### どのコンポーネントが対応しているか

✅ **完全対応**:
- HomeScreen（タイトル・ボタン・テキスト）
- GameScreen（全UI要素）
- SetSummaryScreen（背景・テキスト・ボタン）
- TopBar（スコア表示・タイトル）
- FieldArea（場の背景・カードスロット）
- ActionBar（ボタン背景・テキスト）
- RoundSummaryOverlay（結果表示）
- TrophyListModal（モーダル背景・テキスト）
- RulesModal（説明文）
- ColumnModal（コラム表示）

✅ **テーマ非依存（共通色）**:
- CardFace（`#FFFDF8`）
- CardBack（紺色）
- すべてのトランプカード

## 📱 React Native での検証方法

```typescript
import { useColorScheme } from "react-native";
import { useTheme } from "./src/ThemeContext";

// スマホの設定 → 表示/照度 → ダークモードをON/OFF

// コンポーネント内で自動対応
export function MyComponent() {
  const theme = useTheme();
  const scheme = useColorScheme(); // "light" or "dark" or null
  
  return (
    <View style={{ 
      backgroundColor: theme.colors.background // 自動切り替え
    }}>
      {/* ... */}
    </View>
  );
}
```

## 🛠️ Expo での確認

### ローカルテスト
```bash
# 開発サーバー起動
npx expo start

# スマホで Expo Go を開いてQRコード読み込み
# スマホの設定でダークモード ON/OFF → リアルタイムに色が切り替わる
```

### APK ビルド後
```bash
# ビルド完了後スマホにインストール
# スマホ設定 → 表示/照度 → ダークモード確認
```

## ⚠️ 注意事項

1. **アイコンはテーマに依存しない**
   - app.json の `backgroundColor` はライトモード基調で固定
   - ユーザーのダークモード設定に関わらずアイコンは同じ見た目

2. **トランプカードは両モード共通**
   - 理由: 実物のトランプらしい質感を保つため
   - `#FFFDF8` 固定で濃度調整なし

3. **システム設定に自動追従**
   - `app.json` の `"userInterfaceStyle": "automatic"`
   - ユーザーが設定アプリでダークモード変更 → アプリが自動リロード

