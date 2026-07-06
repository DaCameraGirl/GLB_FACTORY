<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="GLB_FACTORY — Studio Photo-vers-Avatar 3D" width="100%"/>
</p>

# GLB_FACTORY

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-131a26?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-f59e0b?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-131a26?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-131a26?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-131a26?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-131a26?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/photo-to-glb-spin.svg" alt="Diagramme animé : une photo de portrait devient un avatar 3D GLB en rotation" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/GLB_FACTORY/"><img src="https://img.shields.io/badge/🌐_Démo_en_direct-f59e0b?style=for-the-badge" alt="Démo en direct"/></a>
  <img src="https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js"/>
  <img src="https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

**Un studio interactif de photo vers avatar 3D.** Chargez un portrait, laissez l'application
lire le visage, le teint, la couleur des cheveux et de la tenue, puis exportez un modèle
**GLB** complet, prêt pour le jeu vidéo, sans aucune expérience en modélisation 3D.

Application en ligne : [dacameragirl.github.io/GLB_FACTORY](https://dacameragirl.github.io/GLB_FACTORY/)

---

## Fonctionnalités principales

| Fonctionnalité | Ce qu'elle fait |
|---|---|
| **Photo → avatar** | Chargez un simple portrait et obtenez un personnage 3D stylisé, prêt pour le jeu |
| **Extraction des couleurs à partir du visage** | Détecte le teint, la couleur des cheveux et de la tenue à partir de la photo |
| **Recommandation de coiffure** | Suggère un style de coiffure adapté à ce qu'elle détecte sur l'image source |
| **Aperçu 3D en direct** | Faites pivoter, zoomez et inspectez l'avatar généré dans une vue Three.js avant export |
| **Export GLB en un clic** | Téléchargez un fichier `.glb` standard prêt pour moteurs de jeu et visionneuses 3D |
| **Fonctionne avec ou sans serveur** | Analyse complète via Gemini si hébergé, repli automatique par canvas si statique |

## Architecture à double mode

GLB_FACTORY est conçu pour fonctionner de deux façons différentes selon l'endroit où il est
déployé, et choisit automatiquement la bonne :

1. **Mode IA (hébergement Node/Express)** — Sur un environnement complet comme le
   développement local ou un conteneur cloud, l'application communique avec un proxy backend
   relié à **Gemini 3.5 Flash**. Gemini localise automatiquement le visage et en extrait le
   teint, la couleur des cheveux, la couleur de la tenue et une coiffure recommandée avec une
   grande précision visuelle.

2. **Mode de repli statique (GitHub Pages)** — Sans backend disponible, l'application
   détecte l'environnement statique et bascule vers une **analyse faciale côté client** :
   un échantillonneur canvas HTML5 léger lit les pixels du portrait directement dans le
   navigateur et extrait les mêmes couleurs, sans aucune requête réseau.

Même interface, même résultat GLB, deux moteurs différents en coulisses, selon ce que
l'environnement de déploiement peut réellement exécuter.

---

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

Pour activer l'analyse IA en local, ajoutez une clé Gemini :

```env
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

Sans clé, l'application fonctionne quand même : elle utilise simplement l'analyseur de
repli côté client.

## Déploiement sur GitHub Pages

Le dépôt inclut `.github/workflows/deploy.yml`, qui construit et publie l'application
statique à chaque push sur `main`.

1. Allez sur le dépôt GitHub, puis **Settings**.
2. Sous **Code and automation → Pages**, choisissez **GitHub Actions** comme **Source**.
3. Poussez sur `main` et suivez la construction dans l'onglet **Actions**.

---

## Technologies utilisées

| Couche | Stack |
|---|---|
| Rendu 3D | **Three.js** — rendu WebGL et construction procédurale du maillage de l'avatar |
| Frontend | **React 19** + **Vite 6** — runtime et build de la SPA |
| Style | **Tailwind CSS v4** |
| Icônes | **Lucide React** |
| Backend | **Express** + **Google GenAI SDK** — proxy vers l'API Gemini |

## Contributeurs

- Angela — direction produit, tests
- Claude — implémentation et workflow GitHub

## Mentions légales

Les photos envoyées sont traitées dans le seul but de générer un avatar 3D. En mode IA, les
données de l'image sont envoyées à l'API Gemini selon les conditions de Google ; en mode de
repli statique, l'analyse se fait entièrement dans le navigateur et rien ne quitte l'appareil.
