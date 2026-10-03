# solruna terrace — Web

横浜「solruna terrace」公式サイト。昼はグリークヨーグルトカフェ、夜はカラオケバー。
構成・演出は参考サイト（mrblack-case.dolganev.com）をベースに、昼→夜の暗転ストーリーに再構成しています。

## 開発

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ に静的ファイル出力（どこにでも置ける相対パス）
```

## 技術
- Vite + 素のHTML/CSS/JS
- GSAP ScrollTrigger（パララックス・スタックカード・ギャラリー）
- Lenis（スムーススクロール）
- Three.js（手続き生成の 3D ヨーグルトボウル / カクテル。`src/three/`）

## ページ構成（昼 → 夜）
| # | セクション | 参考サイトの対応箇所 |
|---|---|---|
| 1 | Hero（巨大ロゴ＋3Dボウル） | Hero |
| 2 | 数字で見る solruna（背景が生成り→オリーブ） | Business in exact figures |
| 3 | ヨーグルトのこだわり5つ（3D中央固定） | We set the whole thing up |
| 4 | Cafe / Transition / Bar の重なるカード（ここで暗転） | Formats |
| 5 | NIGHT：バーの魅力5つ（左写真固定） | Partnership |
| 6 | solrunaを、ポケットに（SNS・予約） | Your business, in your pocket |
| 7 | 利用シーンカード | Benefits |
| 8 | 重なるギャラリー | Sticky gallery |
| 9 | FAQ | FAQ |
| 10 | 予約・貸切フォーム（3Dカクテル） | CTA form |

## 写真の差し替え
`public/images/` の同名ファイルを上書きするだけで反映されます（現在はダミー画像）。

| ファイル | 用途 |
|---|---|
| cafe-interior.jpg | 昼の店内（Cafeカード・ギャラリー） |
| yogurt-bowl.jpg | ヨーグルトボウル |
| yogurt-base / fruits / granola / honey / custom.jpg | こだわり5項目 |
| dusk-yokohama.jpg / lighting.jpg | Transitionカード |
| bar-interior.jpg / karaoke-mic.jpg | Barカード |
| night-bar.jpg / cocktail.jpg | NIGHTセクション |
| pet / party / yokohama-night.jpg | 利用シーンカード |

## TODO
- フォーム送信先（Formspree 等）の接続 — `src/main.js`
- 住所・電話・SNSリンク・数値（たんぱく質量など）の確定
