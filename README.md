<div align="center">

# 🧬 GLB_FACTORY

### *3D Avatar Studio with Genetic Mutation Engine*

[![Beta](https://img.shields.io/badge/status-BETA-orange?style=for-the-badge)](https://dacameragirl.github.io/GLB_FACTORY/)
[![Live Demo](https://img.shields.io/badge/🎮_LIVE_DEMO-4CAF50?style=for-the-badge)](https://dacameragirl.github.io/GLB_FACTORY/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)

**Upload a portrait. Generate a 3D avatar. Mutate its DNA. Export as GLB.**

[🚀 Try Live Demo](https://dacameragirl.github.io/GLB_FACTORY/) • [📖 Documentation](#-features) • [🐛 Report Bug](https://github.com/DaCameraGirl/GLB_FACTORY/issues) • [💡 Request Feature](https://github.com/DaCameraGirl/GLB_FACTORY/issues)

---

</div>

## 🎯 What Makes This Special?

<table>
<tr>
<td width="50%">

### 🧬 **Genetic Mutation System**
The only GLB creator with a **procedural chaos engine**:
- 🎲 Random DNA generation with chaos intensity slider
- 🔬 Breed TWO parent avatars to create hybrid offspring
- 💾 Persistent specimen vault (40 slots)
- 🏆 Rarity tiers: Common → Legendary → Chaotic-Divine
- 🎮 Auto-mutation loop (rave screensaver mode!)

</td>
<td width="50%">

### 🎨 **AI-Powered Face Detection**
Upload a photo and watch the magic:
- 🤖 Gemini AI detects face, colors, features
- 🎭 Real-time texture mapping with feather blending
- 🔄 Portrait rotation (0°, 90°, 180°, 270°)
- 📐 Precise crop controls with live preview
- 🌈 Automatic color palette extraction

</td>
</tr>
</table>

---

## ⚡ Quick Start

```bash
# Clone the repo
git clone https://github.com/DaCameraGirl/GLB_FACTORY.git

# Install dependencies
cd GLB_FACTORY
npm install

# Add your Gemini API key (optional - works without it!)
echo "VITE_GEMINI_API_KEY=your_key_here" > .env.local

# Start development server
npm run dev
```

**🌐 Or just visit:** [dacameragirl.github.io/GLB_FACTORY](https://dacameragirl.github.io/GLB_FACTORY/)

---

## 🎮 Features That Don't Exist Anywhere Else

### 🧬 Biological Splicer v3.2
<details>
<summary><b>Click to see the mutation madness</b></summary>

```
🧬 GENETIC BREEDING & FUSION TANK

Parent A (Maternal)  +  Parent B (Paternal)  =  Hybrid Offspring
   ┌─────────┐            ┌─────────┐            ┌─────────┐
   │ Chibi   │            │ Athletic│            │ Balanced│
   │ Pink    │      +     │ Gold    │     →      │ Coral   │
   │ Glow ON │            │ Glow OFF│            │ Glow ON │
   └─────────┘            └─────────┘            └─────────┘
```

**How it works:**
1. Click "🌀 MUTATE SKELETAL DNA NOW" to generate random avatars
2. Click "BREED" on TWO specimens to select parents
3. Click "🧬 FUSE PARENT GENOMES" to create hybrid
4. New offspring inherits traits from both parents!

**Rarity System:**
- 🟢 COMMON (70% chance)
- 🔵 RARE (20% chance)
- 🟣 LEGENDARY (8% chance)
- ⚡ CHAOTIC-DIVINE (2% chance) - *flashing rainbow glow*

</details>

### 🎨 Real-Time Face Texture Mapping
<details>
<summary><b>See how your photo becomes 3D</b></summary>

**Upload → Detect → Map → Render**

1. **Upload Portrait**: Drag & drop or click to browse
2. **AI Detection**: Gemini finds face, extracts colors
3. **Texture Mapping**: Photo wraps onto 3D head mesh
4. **Fine-Tune**: Adjust feather, crop, rotation, scale

**Advanced Controls:**
- 🎚️ Feather Radius: Smooth edge blending (30-100%)
- 📏 Crop Scale: Zoom in/out (0.4x - 2.0x)
- ↔️ Shift Horizontal: Center eyes (-50% to +50%)
- ↕️ Shift Vertical: Adjust face position
- 🔄 Rotation: Fix sideways photos (0°, 90°, 180°, 270°)

</details>

### 🦴 Physical Drop & Squish Test
<details>
<summary><b>Watch your avatar bounce!</b></summary>

**Enterprise-grade QA physics simulation:**
- 🎯 Gravity impact calculation
- 📊 Mass scale coefficients
- 🎪 Soft-body squash ratio
- 🔊 8-bit collision sound effects

```
[QA PHYSICS] Initiated rig drop test...
[QA PHYSICS] Calculating gravity impact...
[QA PHYSICS] Rig collision impact registered!
[QA PHYSICS] Decaying vibration harmonics stabilized.
```

</details>

### 🎭 2D Style Overlays
<details>
<summary><b>Instant post-processing effects</b></summary>

Toggle between visual styles in real-time:
- 🎮 **Retro CRT**: Scanlines + phosphor glow
- 🌃 **Cyberpunk**: Cyan/magenta HUD overlay
- 📐 **Blueprint**: Technical schematic lines
- 🎨 **Sketch**: Charcoal pencil outlines
- 👾 **Gameboy**: Monochrome LCD dither

*No render wait. No node setup. Just click.*

</details>

---

## 🏗️ Tech Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 19 • Three.js • Vite 6 • TypeScript |
| **Styling** | Tailwind CSS v4 • Lucide Icons |
| **AI/ML** | Google Gemini 3.5 Flash API |
| **3D Engine** | WebGL 2.0 • Procedural Mesh Generation |
| **Audio** | Web Audio API • Retro Synth Engine |
| **Export** | GLB/GLTF 2.0 Standard Format |

</div>

---

## 📊 Comparison: GLB_FACTORY vs Others

| Feature | GLB_FACTORY | ReadyPlayerMe | Avaturn | VRoid Studio |
|---------|-------------|---------------|---------|--------------|
| **Genetic Mutation** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **DNA Breeding** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **AI Face Detection** | ✅ Gemini | ✅ Custom | ✅ Custom | ❌ No |
| **Real-time Preview** | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Limited |
| **Procedural Generation** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Free & Open Source** | ✅ MIT | ⚠️ Freemium | ❌ Paid | ✅ Free |
| **Web-Based** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Desktop |
| **Rarity System** | ✅ Yes | ❌ No | ❌ No | ❌ No |

---

## 🎯 Use Cases

<table>
<tr>
<td width="33%">

### 🎮 Game Development
- NPCs with unique genetics
- Player avatar customization
- Procedural character generation
- Rapid prototyping

</td>
<td width="33%">

### 🎨 Creative Projects
- 3D art experiments
- Animation characters
- VR/AR avatars
- Social media profiles

</td>
<td width="33%">

### 🧪 Research & Education
- Genetic algorithm demos
- 3D modeling tutorials
- WebGL learning projects
- AI integration examples

</td>
</tr>
</table>

---

## 🚀 Deployment

### GitHub Pages (Current)
Already live at [dacameragirl.github.io/GLB_FACTORY](https://dacameragirl.github.io/GLB_FACTORY/)

### Other Options
```bash
# Netlify
netlify deploy --prod --dir=dist

# Vercel
vercel --prod

# Docker
docker build -t glb-factory .
docker run -p 8080:80 glb-factory
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## 🤝 Contributing

We're actively developing and **welcome contributions**!

### Ways to Contribute:
- 🐛 Report bugs via [GitHub Issues](https://github.com/DaCameraGirl/GLB_FACTORY/issues)
- 💡 Suggest features in [Discussions](https://github.com/DaCameraGirl/GLB_FACTORY/discussions)
- 🔧 Submit pull requests (see [CONTRIBUTING.md](CONTRIBUTING.md))
- ⭐ Star the repo to show support!

### Quick Contribution Guide:
```bash
# Fork & clone
git clone https://github.com/YOUR_USERNAME/GLB_FACTORY.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes & test
npm test

# Commit with conventional commits
git commit -m "feat: add amazing feature"

# Push & create PR
git push origin feature/amazing-feature
```

---

## 📖 Documentation

- **[API Documentation](#-api-documentation)** - Backend endpoints
- **[Architecture](#-architecture)** - System design
- **[Troubleshooting](#-troubleshooting)** - Common issues
- **[Browser Compatibility](#-browser-compatibility)** - Supported browsers
- **[Security](#-security-best-practices)** - Best practices

---

## 🎓 Learning Resources

**New to Three.js?**
- [Three.js Journey](https://threejs-journey.com/)
- [Three.js Fundamentals](https://threejs.org/manual/)

**Want to understand the mutation system?**
- Check out `src/utils/mutationEngine.ts`
- Read the genetic algorithm comments

**Interested in AI integration?**
- See `src/server/index.ts` for Gemini API usage
- Review `src/utils/faceAnalyzer.ts` for fallback logic

---

## 🏆 Roadmap

### ✅ Completed (v1.0)
- [x] AI face detection with Gemini
- [x] Genetic mutation system
- [x] DNA breeding/splicing
- [x] Portrait rotation control
- [x] Sticky viewport panels
- [x] Feather radius improvements
- [x] Production deployment

### 🚧 In Progress (v1.1)
- [ ] Animation system (walk, dance, idle)
- [ ] More hairstyle options
- [ ] Clothing customization
- [ ] Accessory marketplace

### 🔮 Future (v2.0)
- [ ] Multiplayer avatar gallery
- [ ] NFT minting integration
- [ ] VRM format export
- [ ] Mobile app (React Native)

---

## 📊 Stats

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/DaCameraGirl/GLB_FACTORY?style=social)
![GitHub forks](https://img.shields.io/github/forks/DaCameraGirl/GLB_FACTORY?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/DaCameraGirl/GLB_FACTORY?style=social)

**Built in 2 days. Shipped to production. Open source forever.**

</div>

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) for details.

**TL;DR:** You can use this commercially, modify it, distribute it, and use it privately. Just include the license and copyright notice.

---

## 🙏 Acknowledgments

- **Three.js** - Amazing 3D rendering library
- **Google Gemini** - Powerful AI capabilities
- **React Team** - Best UI framework
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **All Contributors** - You make this possible! ❤️

---

## 💬 Community

<div align="center">

[![GitHub Discussions](https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github)](https://github.com/DaCameraGirl/GLB_FACTORY/discussions)
[![Issues](https://img.shields.io/badge/GitHub-Issues-red?style=for-the-badge&logo=github)](https://github.com/DaCameraGirl/GLB_FACTORY/issues)

**Join the conversation! Share your creations! Report bugs! Request features!**

</div>

---

## 🎨 Gallery

*Coming soon: Showcase of community-created avatars!*

Want your avatar featured? Share it in [Discussions](https://github.com/DaCameraGirl/GLB_FACTORY/discussions)!

---

<div align="center">

### 🚀 Ready to Create?

**[Launch GLB_FACTORY →](https://dacameragirl.github.io/GLB_FACTORY/)**

---

**Made with 🧬 and ❤️ by [DaCameraGirl](https://github.com/DaCameraGirl)**

*Star ⭐ this repo if you find it useful!*

</div>