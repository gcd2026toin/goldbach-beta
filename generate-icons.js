#!/usr/bin/env node

/**
 * ゴールドバッハ - アイコン生成スクリプト
 * 
 * 1枚の画像から必要な全サイズのアイコンを自動生成します。
 * 
 * 使用方法:
 *   npx node generate-icons.js path/to/your/icon.png
 * 
 * 必要なライブラリ:
 *   npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// エラーハンドリング
if (!process.argv[2]) {
  console.error('❌ 使用方法: npx node generate-icons.js path/to/your/icon.png');
  console.error('例: npx node generate-icons.js my-icon.png');
  process.exit(1);
}

const inputPath = process.argv[2];
const outputDir = path.join(__dirname, 'assets');

// 入力ファイル確認
if (!fs.existsSync(inputPath)) {
  console.error(`❌ ファイルが見つかりません: ${inputPath}`);
  process.exit(1);
}

// 出力ディレクトリ作成
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 生成対象のアイコン
const icons = [
  {
    name: 'icon.png',
    size: 1024,
    description: '全プラットフォーム共通アイコン'
  },
  {
    name: 'android-icon-foreground.png',
    size: 1024,
    description: 'Android 適応型アイコン（前景）'
  },
  {
    name: 'android-icon-background.png',
    size: 1024,
    description: 'Android 適応型アイコン（背景）- 生成しません'
  },
  {
    name: 'android-icon-monochrome.png',
    size: 1024,
    description: 'Android 適応型アイコン（モノクロ）'
  },
  {
    name: 'favicon.png',
    size: 192,
    description: 'Web用ファビコン'
  },
  {
    name: 'splash-icon.png',
    size: 1024,
    description: 'スプラッシュスクリーン'
  }
];

async function generateIcons() {
  console.log('🎨 アイコン生成を開始します...\n');
  
  try {
    // 入力画像を読み込む
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`📸 入力画像: ${path.basename(inputPath)}`);
    console.log(`   サイズ: ${metadata.width}×${metadata.height}px\n`);
    
    // 各アイコンを生成
    for (const icon of icons) {
      // android-icon-background は背景色のため生成しない
      if (icon.name === 'android-icon-background.png') {
        console.log(`⏭️  ${icon.name}`);
        console.log(`   → スキップ（背景色は別途作成が必要）\n`);
        continue;
      }
      
      const outputPath = path.join(outputDir, icon.name);
      
      // サイズ変更
      await sharp(inputPath)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toFile(outputPath);
      
      // ファイルサイズ取得
      const stats = fs.statSync(outputPath);
      const sizeMB = (stats.size / 1024).toFixed(1);
      
      console.log(`✅ ${icon.name}`);
      console.log(`   ${icon.size}×${icon.size}px (${sizeMB}KB)`);
      console.log(`   説明: ${icon.description}\n`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 アイコン生成完了！\n');
    
    console.log('📝 次のステップ:');
    console.log('1. android-icon-background.png を手動で作成');
    console.log('   推奨色: #FAF6EE（温白）1024×1024px の単色背景');
    console.log('   または既存の assets/android-icon-background.png をそのまま使用\n');
    
    console.log('2. ローカルテスト:');
    console.log('   npx expo start\n');
    
    console.log('3. GitHub にプッシュ & Cloudflare でデプロイ\n');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(error.message);
    process.exit(1);
  }
}

// 実行
generateIcons();
