# GLB_FACTORY 🎨🤖

Welcome to **GLB_FACTORY**! This application is an interactive **3D Photo-to-Avatar Studio**. It allows users to upload a portrait photo and automatically generate, customize, and export fully functional 3D blocky models in standard **GLB** format, ready for game engines or 3D viewports.

View the application live on GitHub Pages: [dacameragirl.github.io/GLB_FACTORY/](https://dacameragirl.github.io/GLB_FACTORY/)

---

## 🚀 Dual-Mode Architecture

This application is built with a highly resilient **hybrid architecture**:

1. **AI-Powered Mode (Cloud Hosting)**:
   - When running on a full-stack Node/Express container environment (like local development or Cloud Run), the app communicates with a backend proxy connected to the **Gemini 3.5 Flash** API.
   - Gemini automatically locates the face bounding box, extracts skin tones, hair colors, clothing colors, and recommends fitting hairstyle types with high visual precision.

2. **Static Fallback Mode (GitHub Pages)**:
   - When deployed statically on **GitHub Pages**, where no custom backend server runs, the app **automatically detects the environment** and switches to **Client-Side Face Analysis**.
   - It utilizes a lightweight HTML5 canvas sampler to analyze the pixel data of the loaded portrait, extracting the representative skin, hair, and clothing colors directly in the browser with zero external network requests!

---

## ⚡ GitHub Pages Deployment

The repository is equipped with an automated GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and publishes the application dynamically on every commit to the `main` branch.

### How to Activate GitHub Pages in Your Repository:
1. Go to your repository on GitHub: `https://github.com/DaCameraGirl/GLB_FACTORY`.
2. Click on the **Settings** tab.
3. In the left sidebar, navigate to **Pages** under the *Code and automation* section.
4. Under **Build and deployment**:
   - For **Source**, select **GitHub Actions** from the dropdown.
5. Once selected, your automated workflow will automatically build and publish the static app.
6. The deployment progress can be monitored under the **Actions** tab.

---

## 🛠️ Local Development

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run
1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (optional for Gemini server features):
   Create a `.env.local` or `.env` file in the root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Start the developmental server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Technologies Used
- **Three.js** (WebGL 3D Rendering & Procedural Avatar Mesh Construction)
- **React 19** + **Vite 6** (Modern SPA runtime & high-speed builder)
- **Tailwind CSS v4** (Modern utility-first responsive layout styling)
- **Lucide React** (Premium, lightweight icon pairings)
- **Express + Google GenAI SDK** (Lightweight backend proxy handling Gemini API orchestration)
