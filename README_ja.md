# Art of Autonomous Pixels

ピクセルが自律的に成長・進化して独自のパターンを作り出す、インタラクティブなジェネラティブアートプロジェクトです。p5.jsで構築されています。

[English README](README.md)

## 🎨 特徴

- **自律的な成長**: ピクセルが隣接する色を継承しながら、空きスペースへ自律的に拡大
- **インタラクティブキャンバス**: クリックでセルを消去し、成長パターンに影響を与える
- **複数のパレット**: 5種類の配色（Classic、Glacier、Ember、Mono、Pastel）から選択可能
- **状態の永続化**: URLハッシュを通じてアートワークを保存・共有
- **画像エクスポート**: QRコード付きのPNG画像としてダウンロード可能

## 🚀 使い始める

### 必要要件

- モダンなウェブブラウザ
- ローカルウェブサーバー（オプション、ローカル開発用）

### インストール

1. このリポジトリをクローン:
```bash
git clone https://github.com/Enomi-4mg/Art-of-Autonomous-Cell.git
cd Art-of-Autonomous-Cell
```

2. `index.html`をウェブブラウザで開くか、ローカルサーバーで配信:
```bash
# Pythonを使用
python -m http.server 8000

# Node.js (http-server) を使用
npx http-server
```

3. ブラウザで `http://localhost:8000` にアクセス

## 🎮 使い方

1. **成長を観察**: ピクセルが10×10のグリッド上で自動的に成長・拡散します
2. **クリックして消去**: 任意のセルをクリックして消去し、新しい成長パターンのためのスペースを作成
3. **パレット変更**: 左パネルから異なる配色スキームを選択
4. **リセット**: 「Reset」ボタンをクリックして、新しいランダムパターンで再スタート
5. **保存と共有**: 「Save Image」ボタンをクリックすると:
   - 現在のパターンを含む共有可能なURLを生成
   - アートワークを指すQRコード付きのPNG画像をダウンロード

## 🏗️ プロジェクト構造

```
Art-of-Autonomous-Cell/
├── index.html          # メインHTMLファイル
├── sketch.js           # p5.jsスケッチとシミュレーションロジック
├── style.css           # スタイリング
├── jsconfig.json       # JavaScript設定
├── libraries/          # 外部ライブラリ
│   ├── p5.min.js
│   └── p5.sound.min.js
└── README.md           # このファイル
```

## 🔧 技術的詳細

### グリッドシステム
- 10×10セルグリッド（`GRID_COLUMNS`と`GRID_ROWS`で設定可能）
- 各セルは色インデックスを保存（0 = 空、1-16 = 各種色）

### 成長アルゴリズム
- 100msごとに、ランダムな空セルが成長を試みる
- セルに色付きの隣接セルがある場合、そのうちの1つの色を継承
- すべてのセルが空の場合、中央セルがランダムな色でシード

### 状態のシリアライズ
- グリッド状態は17進数の文字列としてエンコード
- 各文字は1つのセルの色インデックスを表す
- 状態はURLハッシュに保存され、簡単に共有可能

### カラーパレット
- **Classic**: オリジナルの鮮やかな色
- **Glacier**: クールなブルーシフトトーン
- **Ember**: 暖かいオレンジ-レッドトーン
- **Mono**: グレースケール版
- **Pastel**: 柔らかく明るい色

## 🎨 カスタマイズ

`sketch.js`の以下の定数を変更できます:

```javascript
const CANVAS_SIZE = 400;           // キャンバスサイズ
const GRID_COLUMNS = 10;           // 列数
const GRID_ROWS = 10;              // 行数
const UPDATE_STEP_MS = 100;        // 成長速度（ミリ秒）
const colorPalette = [...];        // カスタムカラーパレット
```

## 📦 依存関係

- [p5.js](https://p5js.org/) - クリエイティブコーディングライブラリ
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) - QRコード生成

## 📝 ライセンス

このプロジェクトはオープンソースで、MITライセンスの下で利用可能です。

## 🤝 貢献

コントリビューション、問題の報告、機能リクエストを歓迎します！

## 👤 作者

Enomi-4mg
- GitHub: [@Enomi-4mg](https://github.com/Enomi-4mg)

## 🙏 謝辞

- [p5.js](https://p5js.org/)で構築
- セルオートマトンとジェネラティブアートにインスパイア
