<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="GLB_FACTORY — 3D 写真からアバターへのスタジオ" width="100%"/>
</p>

# GLB_FACTORY

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-131a26?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-131a26?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-131a26?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-131a26?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-131a26?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-f59e0b?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/photo-to-glb-spin.svg" alt="アニメーション図解：ポートレート写真が回転する3D GLBアバターに変わる" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/GLB_FACTORY/"><img src="https://img.shields.io/badge/🌐_ライブデモ-f59e0b?style=for-the-badge" alt="ライブデモ"/></a>
  <img src="https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js"/>
  <img src="https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

**インタラクティブな3D写真アバタースタジオ。** ポートレート写真をアップロードすると、アプリが
顔・肌の色・髪・服の色を読み取り、3Dモデリングの経験がなくても、ゲームエンジンでそのまま使える
**GLB** モデルを書き出せます。

ライブアプリ: [dacameragirl.github.io/GLB_FACTORY](https://dacameragirl.github.io/GLB_FACTORY/)

---

## 主な機能

| 機能 | 内容 |
|---|---|
| **写真 → アバター** | ポートレート写真を1枚アップロードするだけで、ゲームに使える3Dキャラクターを生成 |
| **顔認識による色抽出** | 写真から直接、肌の色・髪の色・服の色を検出 |
| **ヘアスタイルの提案** | 元画像に合わせたヘアスタイルを提案 |
| **リアルタイム3Dプレビュー** | 書き出す前にThree.jsビューポートで回転・ズームして確認 |
| **ワンクリックGLBエクスポート** | ゲームエンジンや3Dビューアで使える標準の `.glb` ファイルをダウンロード |
| **サーバーの有無を問わず動作** | ホスティング時はGeminiによるフル解析、静的環境では自動でキャンバス解析にフォールバック |

## デュアルモード・アーキテクチャ

GLB_FACTORYはデプロイ先に応じて2通りの動作モードを持ち、自動的に適切な方を選択します。

1. **AI駆動モード（Node/Expressホスティング）** — ローカル開発やクラウドコンテナのような
   フルスタック環境では、アプリは **Gemini 3.5 Flash** に接続されたバックエンドプロキシと
   通信します。Geminiが顔の位置を自動検出し、肌の色・髪の色・服の色・おすすめのヘアスタイル
   を高い視覚的精度で抽出します。

2. **静的フォールバックモード（GitHub Pages）** — バックエンドが利用できない場合、アプリは
   静的環境を検出して**クライアント側の顔解析**に切り替わります。軽量なHTML5キャンバス
   サンプラーがブラウザ内で直接ポートレートのピクセルデータを読み取り、ネットワーク通信なしで
   同じ肌・髪・服の色を抽出します。

同じUI、同じGLB出力、裏側で動くエンジンだけが異なり、デプロイ環境が実際に動かせる方が
自動的に選ばれます。

---

## クイックスタート

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

ローカルでAI解析を有効にするには、Geminiのキーを追加します。

```env
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

キーがなくてもアプリは動作し、クライアント側のフォールバック解析が使われます。

## GitHub Pagesへのデプロイ

リポジトリには `.github/workflows/deploy.yml` が含まれており、`main` へのpushのたびに
静的アプリをビルド・公開します。

1. GitHub上のリポジトリを開き、**Settings** へ。
2. **Code and automation → Pages** で **Source** を **GitHub Actions** に設定。
3. `main` にpushし、**Actions** タブでビルドの進行を確認。

---

## 使用技術

| レイヤー | スタック |
|---|---|
| 3Dレンダリング | **Three.js** — WebGLレンダリングとアバターメッシュのプロシージャル生成 |
| フロントエンド | **React 19** + **Vite 6** — SPAランタイムとビルド |
| スタイリング | **Tailwind CSS v4** |
| アイコン | **Lucide React** |
| バックエンド | **Express** + **Google GenAI SDK** — Gemini APIプロキシ |

## コントリビューター

- Angela — プロダクトの方向性、テスト
- Claude — 実装とGitHubワークフロー

## 法的事項

アップロードされた写真は3Dアバター生成の目的にのみ使用されます。AI駆動モードでは、画像データは
Googleの規約のもとGemini APIに送信されます。静的フォールバックモードでは解析はすべてブラウザ内
で完結し、データが端末の外に出ることはありません。
