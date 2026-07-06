<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="GLB_FACTORY — Estudio de Foto a Avatar 3D" width="100%"/>
</p>

# GLB_FACTORY

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-f59e0b?style=for-the-badge" alt="Español"/></a>
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
  <img src="docs/assets/photo-to-glb-spin.svg" alt="Diagrama animado: una foto de retrato se convierte en un avatar 3D GLB giratorio" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/GLB_FACTORY/"><img src="https://img.shields.io/badge/🌐_Demo_en_vivo-f59e0b?style=for-the-badge" alt="Demo en vivo"/></a>
  <img src="https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js"/>
  <img src="https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

**Un estudio interactivo de foto a avatar 3D.** Sube un retrato, deja que la app detecte el
rostro, el tono de piel, el cabello y los colores de la ropa, y exporta un modelo **GLB**
completamente listo para usar en videojuegos, sin necesidad de experiencia en modelado 3D.

App en vivo: [dacameragirl.github.io/GLB_FACTORY](https://dacameragirl.github.io/GLB_FACTORY/)

---

## Funciones principales

| Función | Qué hace |
|---|---|
| **Foto → avatar** | Sube un solo retrato y obtén un personaje 3D estilizado, listo para juegos |
| **Extracción de color a partir del rostro** | Detecta el tono de piel, el color del cabello y de la ropa desde la foto |
| **Recomendación de peinado** | Sugiere un estilo de cabello acorde a lo que ve en la imagen original |
| **Vista previa 3D en vivo** | Rota, acerca e inspecciona el avatar generado en un visor Three.js antes de exportar |
| **Exportación GLB con un clic** | Descarga un archivo `.glb` estándar listo para motores de juego y visores 3D |
| **Funciona con o sin servidor** | Análisis completo con Gemini si hay servidor, o alternativa por canvas si es estático |

## Arquitectura de doble modo

GLB_FACTORY está diseñado para funcionar de dos formas distintas según dónde se despliegue,
y elige la correcta automáticamente:

1. **Modo con IA (alojamiento Node/Express)** — En un entorno completo como desarrollo
   local o un contenedor en la nube, la app habla con un proxy de backend conectado a
   **Gemini 3.5 Flash**. Gemini ubica el rostro automáticamente y extrae el tono de piel,
   color de cabello, color de ropa y un estilo de peinado recomendado con alta precisión.

2. **Modo estático de respaldo (GitHub Pages)** — Sin backend disponible, la app detecta
   el entorno estático y cambia a **análisis facial del lado del cliente**: un ligero
   muestreador de canvas HTML5 lee los píxeles del retrato directamente en el navegador y
   extrae los mismos colores de piel, cabello y ropa sin ninguna solicitud de red.

Misma interfaz, mismo resultado GLB, dos motores distintos por debajo, el que el entorno de
despliegue pueda ejecutar realmente.

---

## Inicio rápido

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

Para habilitar el análisis con IA en local, agrega una clave de Gemini:

```env
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

Sin la clave, la app sigue funcionando: simplemente usa el analizador de respaldo del lado
del cliente.

## Despliegue en GitHub Pages

El repositorio incluye `.github/workflows/deploy.yml`, que construye y publica la app
estática en cada push a `main`.

1. Ve al repositorio en GitHub, luego **Settings**.
2. En **Code and automation → Pages**, elige **GitHub Actions** como **Source**.
3. Haz push a `main` y observa la compilación en la pestaña **Actions**.

---

## Tecnologías utilizadas

| Capa | Stack |
|---|---|
| Renderizado 3D | **Three.js** — renderizado WebGL y construcción procedural de la malla del avatar |
| Frontend | **React 19** + **Vite 6** — runtime de la SPA y compilación |
| Estilos | **Tailwind CSS v4** |
| Iconos | **Lucide React** |
| Backend | **Express** + **Google GenAI SDK** — proxy de la API de Gemini |

## Colaboradores

- Angela — dirección de producto, pruebas
- Claude — implementación y flujo de trabajo en GitHub

## Aviso legal

Las fotos subidas se procesan con el único fin de generar un avatar 3D. En modo con IA, los
datos de la imagen se envían a la API de Gemini bajo los términos de Google; en modo estático
de respaldo, el análisis ocurre completamente en el navegador y nada sale del dispositivo.
