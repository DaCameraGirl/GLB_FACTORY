<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="GLB_FACTORY — 3D Photo-to-Avatar Studio" width="100%"/>
</p>

# GLB_FACTORY

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-f59e0b?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-131a26?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-131a26?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-131a26?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-131a26?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-131a26?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-131a26?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/photo-to-glb-spin.svg" alt="Animated diagram: a portrait photo turns into a spinning 3D GLB avatar" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/GLB_FACTORY/"><img src="https://img.shields.io/badge/🌐_Live_Demo-f59e0b?style=for-the-badge" alt="Live demo"/></a>
  <img src="https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js"/>
  <img src="https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

**An interactive 3D Photo-to-Avatar Studio.** Upload a portrait, let the app read the face,
skin tone, hair, and outfit colors, then export a fully rigged, game-ready **GLB** model —
no 3D modeling experience required.

Live app: [dacameragirl.github.io/GLB_FACTORY](https://dacameragirl.github.io/GLB_FACTORY/)

---

## Product highlights

| Feature | What it does |
|---|---|
| **Photo → avatar** | Upload a single portrait and get a blocky, game-ready 3D character back |
| **Face-aware color extraction** | Detects skin tone, hair color, and clothing color straight from the photo |
| **Hairstyle recommendation** | Suggests a fitting hairstyle type based on what it sees in the source image |
| **Live 3D preview** | Rotate, zoom, and inspect the generated avatar in a Three.js viewport before exporting |
| **One-click GLB export** | Download a standard `.glb` file ready for game engines and 3D viewers |
| **Works with or without a server** | Full Gemini-powered analysis when hosted, automatic canvas-based fallback when static |

## Dual-mode architecture

GLB_FACTORY is built to run two different ways depending on where it's deployed, and it
picks the right one automatically:

1. **AI-powered mode (Node/Express hosting)** — On a full-stack environment like local
   dev or a container host, the app talks to a backend proxy wired to **Gemini 3.5 Flash**.
   Gemini locates the face bounding box and reads skin tone, hair color, clothing color, and
   a recommended hairstyle with high visual precision.

2. **Static fallback mode (GitHub Pages)** — With no backend available, the app detects the
   static environment and switches to **client-side face analysis**: a lightweight HTML5
   canvas sampler reads the portrait's pixel data directly in the browser and extracts the
   same skin, hair, and clothing colors with zero network requests.

Same UI, same GLB output, two different engines under the hood, whichever one the
deployment target can actually run.

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To enable AI-powered analysis locally, add a Gemini key:

```env
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

Without a key, the app still runs, it just uses the client-side fallback analyzer.

## Deploying to GitHub Pages

The repo ships with `.github/workflows/deploy.yml`, which builds and publishes the static
app on every push to `main`.

1. Go to the repo on GitHub, then **Settings**.
2. Under **Code and automation → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` and watch the build under the **Actions** tab.

---

## Technologies used

| Layer | Stack |
|---|---|
| 3D rendering | **Three.js** — WebGL rendering and procedural avatar mesh construction |
| Frontend | **React 19** + **Vite 6** — SPA runtime and build |
| Styling | **Tailwind CSS v4** |
| Icons | **Lucide React** |
| Backend | **Express** + **Google GenAI SDK** — Gemini API proxy |

## Contributors

- Angela — product direction, testing
- Claude — implementation and GitHub workflow

## Legal

Uploaded photos are processed for the sole purpose of generating a 3D avatar. In AI-powered
mode, image data is sent to the Gemini API under Google's terms; in static fallback mode,
analysis happens entirely in the browser and nothing leaves the device.
