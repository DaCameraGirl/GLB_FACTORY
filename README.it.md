<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="GLB_FACTORY — Studio Foto-ad-Avatar 3D" width="100%"/>
</p>

# GLB_FACTORY

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-131a26?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-131a26?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-131a26?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-131a26?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-131a26?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-131a26?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-f59e0b?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/photo-to-glb-spin.svg" alt="Diagramma animato: una foto ritratto diventa un avatar 3D GLB rotante" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/GLB_FACTORY/"><img src="https://img.shields.io/badge/🌐_Demo_live-f59e0b?style=for-the-badge" alt="Demo live"/></a>
  <img src="https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js"/>
  <img src="https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

**Uno studio interattivo per trasformare foto in avatar 3D.** Carica un ritratto, lascia che
l'app legga viso, incarnato, colore dei capelli e dell'abbigliamento, ed esporta un modello
**GLB** pronto per motori di gioco, senza alcuna esperienza di modellazione 3D.

App live: [dacameragirl.github.io/GLB_FACTORY](https://dacameragirl.github.io/GLB_FACTORY/)

---

## Funzionalità principali

| Funzionalità | Cosa fa |
|---|---|
| **Foto → avatar** | Carica un singolo ritratto e ottieni un personaggio 3D stilizzato, pronto per i giochi |
| **Estrazione colore basata sul viso** | Rileva incarnato, colore dei capelli e dell'abbigliamento direttamente dalla foto |
| **Consiglio di acconciatura** | Suggerisce uno stile di capelli adatto in base all'immagine originale |
| **Anteprima 3D live** | Ruota, ingrandisci e ispeziona l'avatar generato in una vista Three.js prima di esportare |
| **Esportazione GLB in un clic** | Scarica un file `.glb` standard pronto per motori di gioco e visualizzatori 3D |
| **Funziona con o senza server** | Analisi completa con Gemini se ospitato, fallback automatico via canvas se statico |

## Architettura a doppia modalità

GLB_FACTORY è progettato per funzionare in due modi diversi a seconda di dove viene
distribuito, e sceglie automaticamente quello giusto:

1. **Modalità con IA (hosting Node/Express)** — In un ambiente completo come lo sviluppo
   locale o un container cloud, l'app comunica con un proxy backend collegato a
   **Gemini 3.5 Flash**. Gemini localizza automaticamente il viso ed estrae incarnato,
   colore dei capelli, colore dell'abbigliamento e un'acconciatura consigliata con alta
   precisione visiva.

2. **Modalità di fallback statico (GitHub Pages)** — Senza un backend disponibile, l'app
   rileva l'ambiente statico e passa all'**analisi del viso lato client**: un leggero
   campionatore canvas HTML5 legge i pixel del ritratto direttamente nel browser ed estrae
   gli stessi colori, senza alcuna richiesta di rete.

Stessa interfaccia, stesso risultato GLB, due motori diversi dietro le quinte, a seconda di
cosa l'ambiente di distribuzione può effettivamente eseguire.

---

## Avvio rapido

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

Per abilitare l'analisi con IA in locale, aggiungi una chiave Gemini:

```env
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

Senza chiave, l'app funziona comunque: usa semplicemente l'analizzatore di fallback lato
client.

## Distribuzione su GitHub Pages

Il repository include `.github/workflows/deploy.yml`, che costruisce e pubblica l'app
statica a ogni push su `main`.

1. Vai al repository su GitHub, poi **Settings**.
2. In **Code and automation → Pages**, imposta **Source** su **GitHub Actions**.
3. Fai push su `main` e segui la build nella scheda **Actions**.

---

## Tecnologie utilizzate

| Livello | Stack |
|---|---|
| Rendering 3D | **Three.js** — rendering WebGL e costruzione procedurale della mesh dell'avatar |
| Frontend | **React 19** + **Vite 6** — runtime e build della SPA |
| Stile | **Tailwind CSS v4** |
| Icone | **Lucide React** |
| Backend | **Express** + **Google GenAI SDK** — proxy per l'API Gemini |

## Collaboratori

- Angela — direzione di prodotto, test
- Claude — implementazione e workflow GitHub

## Note legali

Le foto caricate vengono elaborate al solo scopo di generare un avatar 3D. In modalità con
IA, i dati dell'immagine vengono inviati all'API Gemini secondo i termini di Google; in
modalità di fallback statico, l'analisi avviene interamente nel browser e nessun dato lascia
il dispositivo.
