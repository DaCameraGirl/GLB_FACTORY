<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="GLB_FACTORY — 3D 照片转头像工作室" width="100%"/>
</p>

# GLB_FACTORY

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-131a26?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-131a26?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-131a26?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-131a26?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-f59e0b?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-131a26?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/photo-to-glb-spin.svg" alt="动画示意图：一张肖像照片变成旋转的 3D GLB 头像" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/GLB_FACTORY/"><img src="https://img.shields.io/badge/🌐_在线演示-f59e0b?style=for-the-badge" alt="在线演示"/></a>
  <img src="https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js"/>
  <img src="https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

**一个交互式的 3D 照片转头像工作室。** 上传一张肖像照片，让应用识别面部、肤色、发色和服装颜色，
然后导出一个可直接用于游戏引擎的完整 **GLB** 模型，完全不需要 3D 建模经验。

在线体验：[dacameragirl.github.io/GLB_FACTORY](https://dacameragirl.github.io/GLB_FACTORY/)

---

## 主要功能

| 功能 | 作用 |
|---|---|
| **照片 → 头像** | 上传一张肖像照片，即可获得可用于游戏的方块风格 3D 角色 |
| **基于面部的颜色提取** | 直接从照片中识别肤色、发色和服装颜色 |
| **发型推荐** | 根据原始图片推荐合适的发型 |
| **实时 3D 预览** | 导出前可在 Three.js 视口中旋转、缩放并查看生成的头像 |
| **一键导出 GLB** | 下载标准的 `.glb` 文件，可用于游戏引擎和 3D 查看器 |
| **有服务器或无服务器均可运行** | 有服务器时使用 Gemini 完整分析，静态环境下自动切换到画布分析 |

## 双模式架构

GLB_FACTORY 会根据部署环境以两种不同方式运行，并自动选择合适的一种：

1. **AI 驱动模式（Node/Express 托管）** — 在本地开发或云容器等完整环境中，应用会与连接
   **Gemini 3.5 Flash** 的后端代理通信。Gemini 会自动定位面部区域，并以很高的视觉精度
   提取肤色、发色、服装颜色以及推荐的发型。

2. **静态回退模式（GitHub Pages）** — 当没有可用的后端时，应用会检测到静态环境并切换到
   **客户端面部分析**：一个轻量的 HTML5 画布采样器直接在浏览器中读取肖像的像素数据，
   在零网络请求的情况下提取相同的肤色、发色和服装颜色。

界面相同，GLB 输出结果相同，底层引擎不同，取决于部署环境实际能运行哪一种。

---

## 快速开始

```bash
npm install
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

如需在本地启用 AI 分析，请添加 Gemini 密钥：

```env
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

没有密钥应用依然可以运行，只是会使用客户端回退分析器。

## 部署到 GitHub Pages

仓库已包含 `.github/workflows/deploy.yml`，每次推送到 `main` 分支都会自动构建并发布静态应用。

1. 前往 GitHub 上的仓库，然后打开 **Settings**。
2. 在 **Code and automation → Pages** 中，将 **Source** 设置为 **GitHub Actions**。
3. 推送到 `main` 分支，并在 **Actions** 标签页查看构建进度。

---

## 使用的技术

| 层级 | 技术栈 |
|---|---|
| 3D 渲染 | **Three.js** — WebGL 渲染与程序化头像网格构建 |
| 前端 | **React 19** + **Vite 6** — SPA 运行时与构建工具 |
| 样式 | **Tailwind CSS v4** |
| 图标 | **Lucide React** |
| 后端 | **Express** + **Google GenAI SDK** — Gemini API 代理 |

## 贡献者

- Angela — 产品方向、测试
- Claude — 实现与 GitHub 工作流

## 法律声明

上传的照片仅用于生成 3D 头像。在 AI 驱动模式下，图像数据会按照 Google 的条款发送至 Gemini API；
在静态回退模式下，分析完全在浏览器中进行，任何数据都不会离开设备。
