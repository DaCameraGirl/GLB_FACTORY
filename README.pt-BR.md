<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="GLB_FACTORY — Estúdio de Foto para Avatar 3D" width="100%"/>
</p>

# GLB_FACTORY

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-131a26?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-131a26?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-131a26?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-f59e0b?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-131a26?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-131a26?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/photo-to-glb-spin.svg" alt="Diagrama animado: uma foto de retrato vira um avatar 3D GLB giratório" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/GLB_FACTORY/"><img src="https://img.shields.io/badge/🌐_Demo_ao_vivo-f59e0b?style=for-the-badge" alt="Demo ao vivo"/></a>
  <img src="https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js"/>
  <img src="https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

**Um estúdio interativo de foto para avatar 3D.** Envie um retrato, deixe o app ler o rosto,
o tom de pele, o cabelo e as cores da roupa, e exporte um modelo **GLB** pronto para motores
de jogos, sem precisar de experiência em modelagem 3D.

App ao vivo: [dacameragirl.github.io/GLB_FACTORY](https://dacameragirl.github.io/GLB_FACTORY/)

---

## Principais funcionalidades

| Funcionalidade | O que faz |
|---|---|
| **Foto → avatar** | Envie um único retrato e receba um personagem 3D estilizado, pronto para jogos |
| **Extração de cor a partir do rosto** | Detecta tom de pele, cor do cabelo e da roupa direto da foto |
| **Recomendação de penteado** | Sugere um estilo de cabelo compatível com o que vê na imagem original |
| **Pré-visualização 3D ao vivo** | Gire, dê zoom e inspecione o avatar gerado em uma visualização Three.js antes de exportar |
| **Exportação GLB em um clique** | Baixe um arquivo `.glb` padrão pronto para motores de jogos e visualizadores 3D |
| **Funciona com ou sem servidor** | Análise completa via Gemini quando hospedado, fallback automático por canvas quando estático |

## Arquitetura de modo duplo

O GLB_FACTORY foi feito para rodar de duas formas diferentes dependendo de onde é implantado,
e escolhe a correta automaticamente:

1. **Modo com IA (hospedagem Node/Express)** — Em um ambiente completo, como
   desenvolvimento local ou um contêiner na nuvem, o app conversa com um proxy de backend
   ligado ao **Gemini 3.5 Flash**. O Gemini localiza automaticamente o rosto e extrai tom de
   pele, cor do cabelo, cor da roupa e um penteado recomendado com alta precisão visual.

2. **Modo estático de fallback (GitHub Pages)** — Sem backend disponível, o app detecta o
   ambiente estático e muda para **análise facial no lado do cliente**: um leve amostrador
   de canvas HTML5 lê os pixels do retrato diretamente no navegador e extrai as mesmas cores
   de pele, cabelo e roupa, sem nenhuma requisição de rede.

Mesma interface, mesmo resultado GLB, dois motores diferentes por trás, o que o ambiente de
implantação conseguir realmente rodar.

---

## Início rápido

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Para habilitar a análise com IA localmente, adicione uma chave do Gemini:

```env
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

Sem a chave, o app continua funcionando, apenas usando o analisador de fallback no lado do
cliente.

## Implantação no GitHub Pages

O repositório já vem com `.github/workflows/deploy.yml`, que constrói e publica o app
estático a cada push para `main`.

1. Acesse o repositório no GitHub, depois **Settings**.
2. Em **Code and automation → Pages**, defina **Source** como **GitHub Actions**.
3. Faça push para `main` e acompanhe o build na aba **Actions**.

---

## Tecnologias utilizadas

| Camada | Stack |
|---|---|
| Renderização 3D | **Three.js** — renderização WebGL e construção procedural da malha do avatar |
| Frontend | **React 19** + **Vite 6** — runtime e build da SPA |
| Estilo | **Tailwind CSS v4** |
| Ícones | **Lucide React** |
| Backend | **Express** + **Google GenAI SDK** — proxy da API do Gemini |

## Colaboradores

- Angela — direção de produto, testes
- Claude — implementação e fluxo de trabalho no GitHub

## Aviso legal

As fotos enviadas são processadas com o único propósito de gerar um avatar 3D. No modo com
IA, os dados da imagem são enviados à API do Gemini sob os termos do Google; no modo estático
de fallback, a análise acontece inteiramente no navegador e nada sai do dispositivo.
