# Art of Autonomous Pixels v1.1.7

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

1. **成長を観察**: ピクセルがグリッド上（デフォルト12×12、8/12/16/32に変更可）で自動的に成長・拡散します
2. **クリックして消去**: 任意のセルをクリックして消去し、新しい成長パターンのためのスペースを作成
3. **パレット変更**: パレットボタンから異なる配色スキームを選択
4. **グリッドサイズ調整**: サイズボタンをクリックしてグリッド寸法を変更（現在のパターンはリセット）
5. **リセット**: 「Reset」ボタンをクリックして、新しいランダムシード値で再スタート
6. **保存と共有**: 「Save Image」ボタンをクリックすると:
   - 現在のパターンをURLハッシュに符号化した共有可能なリンクを生成
   - アートワークにリンクするQRコード付きのPNG画像をダウンロード
   - ネイティブWeb Share API（モバイル）、クリップボード、またはソーシャルメディア（Twitter/X、LINE）で共有

## 🏗️ プロジェクト構造

```
Art-of-Autonomous-Cell/
├── index.html          # メインHTMLファイルとUIボタン
├── sketch.js           # p5.jsライフサイクル、シミュレーション定数、入力処理
├── grid.js             # Grid/Cellクラス、成長アルゴリズム、シリアライズ
├── palette.js          # パレットシステム、色変換、HSLユーティリティ
├── colorUtils.js       # 色変換ユーティリティ（HSL/RGB/HEX）
├── share.js            # マルチプラットフォーム共有、QR生成、Web Share API
├── ui.js               # ボタンセットアップとイベントリスナー
├── style.css           # スタイリング
├── jsconfig.json       # JavaScript設定
├── libraries/          # 外部ライブラリ
│   ├── p5.min.js       # p5.js v1.x（バニラJSモード）
│   └── p5.sound.min.js # p5.soundライブラリ
└── README.md           # このファイル
```

## 🔧 技術的詳細

### グリッドシステム
- 設定可能なグリッドサイズ: 8×8、12×12（デフォルト）、16×16、32×32
- 各セルは3ビット色インデックスを保存（0 = 空、1-7 = 色）
- スワップ・ポップ削除を使用した空セルの高速追跡（O(1)）
- 8方向隣接セル検出

### 成長アルゴリズム
- 追跡された空セルリストからランダムに選択
- セルに色付き隣接セルがある場合は5%の確率で変異した色を継承
- 動的成長タイミング: `UPDATE_INTERVAL / 空セル数`（セル数が少ないほど速く、完成時に遅くなる）
- すべてのセルが埋まると、中央領域が新しい色で再シード
- フレームレート非依存の固定ステップ更新

### 状態のシリアライズ
- コンパクトな3ビット形式: 1バイトあたり2セル（6ビット使用、2ビット未使用）
- バイナリ構造: 1バイト幅 + 1バイト高さ + パックされたセルデータ
- Base64url符号化（`+`を`-`に、`/`を`_`に置換、`=`を削除）
- URLハッシュに符号化；グリッドサイズ変更でリサイズがトリガー

### カラーパレット（全5種類）
- **Classic**: オリジナルの鮮やかな色
- **Glacier**: クールなブルーシフトトーン
- **Ember**: 暖かいオレンジ-レッドトーン  
- **Mono**: グレースケール版
- **Pastel**: 柔らかく明るい色
- パレット変換にはHSL色空間を使用（色相シフト、彩度、明度）

### 共有機能
- **ネイティブWeb Share API**: サポートするモバイルデバイスでは画像ファイルをアプリに直接共有
- **クリップボードフォールバック**: URLをクリップボードにコピーして貼り付け可能
- **ソーシャルメディアインテント**: Twitter/XおよびLINEへのプリセットテキスト付き直接共有
- **QRコード書き出し**: アートワークへのリンク付きQRコード埋め込みPNGをダウンロード

## 🎨 カスタマイズ

`sketch.js`の以下の定数を編集してください:

```javascript
const UPDATE_INTERVAL_CONSTANT = 500;  // 基本成長間隔（空セル数でスケーリング）
const GRID_COLUMNS = 12;               // デフォルトグリッド幅（8、16、32も可）
const GRID_ROWS = 12;                  // デフォルトグリッド高さ
const MUTATION_RATE = 0.05;            // 色変異確率（5%）
```

新しいパレットを追加するには、`palette.js`の`buildPaletteSets()`を編集:
```javascript
{ 
  id: 'mypalette',
  label: 'My Palette',
  colors: basePalette.map(hex => transformColor(hex))
}
```

カスタム色変換は`colorUtils.js`のHSL色空間を使用:
- `shiftHue(hex, degrees)` - 指定度数だけ色相を回転
- `toMonochrome(hex)` - グレースケールに変換
- `soften(hex)` - パステルカラー効果（彩度低下、明度上昇）

## 📦 依存関係

- [p5.js v1.x](https://p5js.org/) - クリエイティブコーディングライブラリ（バニラJSモード）
- [p5.sound](https://p5js.org/reference/#/libraries/p5.sound) - サウンドライブラリ
- [QRCode.js v1.0.0](https://github.com/davidshimjs/qrcodejs) - QRコード生成（CDN: cdnjs.cloudflare.com）

## 🌐 ブラウザ要件

- ES6互換のモダンブラウザ
- Web Share APIとクリップボードアクセス用のHTTPSまたはlocalhost
- Canvas API対応
- 画像書き出し用ネイティブFile API

## 🔄 永続化

- **URLハッシュ**: グリッド状態がURLフラグメントに保存され、ブックマーク・共有が容易
- **バックエンド不要**: 完全クライアント側；サーバーにデータ保存なし
- **再現可能**: 同じURLハッシュは常に同一のグリッド状態を読み込む

## 📝 ライセンス

このプロジェクトはオープンソースで、MITライセンスの下で利用可能です。

## 🤝 貢献

コントリビューション、問題の報告、機能リクエストを歓迎します！

## 👤 作者

- GitHub: [@Enomi-4mg](https://github.com/Enomi-4mg)

## 🙏 謝辞

- [p5.js](https://p5js.org/)で構築
- セルオートマトンと自律システムにインスパイア
- QRコード生成は[davidshimjs/qrcodejs](https://github.com/davidshimjs/qrcodejs)を使用
