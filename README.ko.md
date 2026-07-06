<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="GLB_FACTORY — 3D 사진-아바타 스튜디오" width="100%"/>
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
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-f59e0b?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-131a26?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/photo-to-glb-spin.svg" alt="애니메이션 다이어그램: 인물 사진이 회전하는 3D GLB 아바타로 바뀌는 모습" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/GLB_FACTORY/"><img src="https://img.shields.io/badge/🌐_라이브_데모-f59e0b?style=for-the-badge" alt="라이브 데모"/></a>
  <img src="https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js"/>
  <img src="https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

**인터랙티브한 3D 사진-아바타 스튜디오.** 인물 사진을 업로드하면 앱이 얼굴, 피부톤, 머리색,
옷 색상을 읽어들여 3D 모델링 경험이 없어도 게임 엔진에 바로 쓸 수 있는 완전한 **GLB** 모델을
내보냅니다.

라이브 앱: [dacameragirl.github.io/GLB_FACTORY](https://dacameragirl.github.io/GLB_FACTORY/)

---

## 주요 기능

| 기능 | 설명 |
|---|---|
| **사진 → 아바타** | 인물 사진 한 장만 업로드하면 게임에 바로 쓸 수 있는 3D 캐릭터 생성 |
| **얼굴 기반 색상 추출** | 사진에서 피부톤, 머리색, 옷 색상을 직접 감지 |
| **헤어스타일 추천** | 원본 이미지에 맞는 헤어스타일 제안 |
| **실시간 3D 미리보기** | 내보내기 전에 Three.js 뷰포트에서 회전, 확대하며 확인 |
| **원클릭 GLB 내보내기** | 게임 엔진과 3D 뷰어에서 바로 쓸 수 있는 표준 `.glb` 파일 다운로드 |
| **서버 유무와 관계없이 동작** | 호스팅 환경에서는 Gemini로 전체 분석, 정적 환경에서는 캔버스 분석으로 자동 전환 |

## 듀얼 모드 아키텍처

GLB_FACTORY는 배포 환경에 따라 두 가지 방식으로 동작하며, 알맞은 방식을 자동으로 선택합니다.

1. **AI 기반 모드 (Node/Express 호스팅)** — 로컬 개발이나 클라우드 컨테이너처럼 완전한
   환경에서는 **Gemini 3.5 Flash**에 연결된 백엔드 프록시와 통신합니다. Gemini가 얼굴 위치를
   자동으로 찾아내고, 피부톤·머리색·옷 색상과 추천 헤어스타일을 높은 정확도로 추출합니다.

2. **정적 폴백 모드 (GitHub Pages)** — 백엔드를 사용할 수 없을 때, 앱은 정적 환경을 감지해
   **클라이언트 측 얼굴 분석**으로 전환합니다. 가벼운 HTML5 캔버스 샘플러가 브라우저 안에서
   직접 인물 사진의 픽셀 데이터를 읽어, 네트워크 요청 없이 동일한 피부·머리·옷 색상을 추출합니다.

동일한 UI, 동일한 GLB 결과물, 배포 환경이 실제로 실행할 수 있는 쪽에 따라 내부 엔진만 다르게
동작합니다.

---

## 빠른 시작

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 여세요.

로컬에서 AI 분석을 활성화하려면 Gemini 키를 추가하세요.

```env
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

키가 없어도 앱은 정상 동작하며, 클라이언트 측 폴백 분석기를 사용합니다.

## GitHub Pages 배포

이 저장소에는 `.github/workflows/deploy.yml` 이 포함되어 있어, `main` 에 push할 때마다
정적 앱을 빌드하고 배포합니다.

1. GitHub 저장소로 이동한 다음 **Settings** 를 엽니다.
2. **Code and automation → Pages** 에서 **Source** 를 **GitHub Actions** 로 설정합니다.
3. `main` 에 push하고 **Actions** 탭에서 빌드 진행 상황을 확인합니다.

---

## 사용 기술

| 레이어 | 스택 |
|---|---|
| 3D 렌더링 | **Three.js** — WebGL 렌더링과 아바타 메시의 절차적 생성 |
| 프론트엔드 | **React 19** + **Vite 6** — SPA 런타임과 빌드 |
| 스타일링 | **Tailwind CSS v4** |
| 아이콘 | **Lucide React** |
| 백엔드 | **Express** + **Google GenAI SDK** — Gemini API 프록시 |

## 기여자

- Angela — 제품 방향, 테스트
- Claude — 구현 및 GitHub 워크플로

## 법적 고지

업로드된 사진은 오직 3D 아바타 생성 목적으로만 처리됩니다. AI 기반 모드에서는 이미지 데이터가
Google의 약관에 따라 Gemini API로 전송됩니다. 정적 폴백 모드에서는 분석이 전적으로 브라우저
안에서 이루어지며, 어떤 데이터도 기기 밖으로 나가지 않습니다.
