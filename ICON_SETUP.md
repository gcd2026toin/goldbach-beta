# ゴールドバッハ - アイコンセットアップガイド

## 📦 アイコン設定の流れ

### 1. ユーザー提供画像の配置

以下のファイルを `assets/` フォルダに配置してください。推奨サイズはすべて **1024×1024px**です。

| ファイル名 | 用途 | 背景色 | 備考 |
|-----------|------|-------|------|
| `icon.png` | アプリアイコン（共通） | 問わない | すべてのプラットフォームで使用 |
| `android-icon-foreground.png` | Android 適応型アイコン前景 | 透明 | Androidのマスク内に収まるようにデザイン |
| `android-icon-background.png` | Android 適応型アイコン背景 | 単色 | デフォルト: `#FAF6EE`（ライトモード） |
| `android-icon-monochrome.png` | Android モノクロ（オプション） | 透明 | グレースケール版 |
| `favicon.png` | Web用アイコン | 問わない | 192×192px 推奨 |

### 2. 現在のアイコン設定内容

**app.json の重要な設定：**
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

**設定の意味：**
- `"userInterfaceStyle": "automatic"` → システムダークモード設定に自動追従
- `"backgroundColor": "#FAF6EE"` → Android適応型アイコンの背景色（ライトモード基調）

### 3. ダークモード対応の考え方

#### **UIテーマ（自動対応）**
- **ライトモード**: `#FAF6EE` 背景 + `#2A2420` テキスト
- **ダークモード**: `#16151A` 背景 + `#EDE8DE` テキスト
- トランプカードは両モード共通で `#FFFDF8`（温白）

#### **アイコン（固定設計）**
- アイコンはシステム設定に依存せず **固定の見た目** を保つ
- Android適応型アイコンの背景色は `#FAF6EE` で固定
- ユーザーがダークモードでも、アイコンは同じ見た目

### 4. アイコン生成のヒント

#### **前景画像の作成ポイント**
1. **透明背景** で作成（PNG推奨）
2. **中央揃え** にデザイン（1024×1024のうち約666×666の安全エリア内）
3. **金色×黒** のゴールドバッハロゴ推奨
   - 金色: `#B8863B` (ライトモード用) または `#D9AA4D` (コントラスト重視)
   - 黒: `#2A2420` または `#16151A`

#### **背景画像の作成ポイント**
1. **単色無地** で OK（テクスチャ不要）
2. デフォルト: `#FAF6EE` (温かみのある白)
3. または白系統ならなんでもOK

#### **モノクロ版の作成ポイント**
1. **グレースケール** のみ使用
2. 背景は完全透明
3. ロゴ部分は黒(`#000000`) または濃いグレー

### 5. ビルド・確認方法

```bash
# APKビルド（EAS Build使用）
eas build --platform android --profile preview

# ローカルテスト（Expoプレビューアプリ）
npx expo start
# スマホでExpo GoアプリをスキャンしてQRコード読み込み
```

### 6. トラブルシューティング

**Q: ダークモードで背景色がおかしい**
- A: `app.json` の `android.adaptiveIcon.backgroundColor` がライトモード基調です。
  システムダークモード時もこの色は変わりません（意図的な設計）

**Q: アイコンがぼやける**
- A: ソースは最低でも **1024×1024px** 必要です

**Q: Androidで他の色の背景に見える**
- A: ホームスクリーン設定で壁紙に応じた配色が自動適用される場合があります。
  これはAndroid標準機能なので、フォアグラウンド画像を高コントラストにしてください。

