# GLB Factory QA Report

**Generated:** 2026-08-01T15:40:14.323Z
**Summary:** 23 PASS · 0 FAIL · 0 SKIP

## Results

| Status | Check | Detail |
|---|---|---|
| **PASS** | production-build | npm run build exit 0 |
| **PASS** | local-static-server | http://127.0.0.1:4177/ |
| **PASS** | local:landing-modes | Create + Mutation visible |
| **PASS** | local:create-mode | upload panel visible |
| **PASS** | local:upload | image shown (genie-mascot.png) |
| **PASS** | local:build-avatar | WebGL canvas present |
| **PASS** | local:face-sliders | adjusted 5 range inputs |
| **PASS** | local:editor-settings | customization panel interacted |
| **PASS** | local:switch-to-mutate | lab visible, upload hidden=true |
| **PASS** | local:state-survive-to-mutate | canvas still present after mode switch |
| **PASS** | local:mutate | clicked mutate 3x |
| **PASS** | local:vault-save | 3 specimen cards (LOAD buttons) |
| **PASS** | local:breed | fused two parents |
| **PASS** | local:reload-offspring | LOAD clicked on specimen |
| **PASS** | local:state-survive-to-create | canvas present after return to create |
| **PASS** | local:state-after-select-roundtrip | canvas rebuilt after select round-trip |
| **PASS** | local:export-glb | giga_rig.glb (50840 bytes) |
| **PASS** | local:export-texture | giga_rig_face_texture.png (30175 bytes) |
| **PASS** | pages-build | GITHUB_ACTIONS=true build ok |
| **PASS** | pages-asset-prefix | JS/CSS under /GLB_FACTORY/assets/ |
| **PASS** | pages-js-fetch | http://127.0.0.1:4178/GLB_FACTORY/assets/index-eG_xYLiI.js (1132059 bytes) |
| **PASS** | pages-og-asset | og-preview.svg 200 |
| **PASS** | pages-spa-mode | Create mode works under /GLB_FACTORY/ |

## Screenshots

- `local-01-landing.png` — ![](screenshots/local-01-landing.png)
- `local-02-create-mode.png` — ![](screenshots/local-02-create-mode.png)
- `local-03-after-upload.png` — ![](screenshots/local-03-after-upload.png)
- `local-04-viewport-after-build.png` — ![](screenshots/local-04-viewport-after-build.png)
- `local-04b-full-after-build.png` — ![](screenshots/local-04b-full-after-build.png)
- `local-05-viewport-after-sliders.png` — ![](screenshots/local-05-viewport-after-sliders.png)
- `local-06-viewport-after-editor.png` — ![](screenshots/local-06-viewport-after-editor.png)
- `local-07-viewport-mutate-mode.png` — ![](screenshots/local-07-viewport-mutate-mode.png)
- `local-07b-mutate-mode-full.png` — ![](screenshots/local-07b-mutate-mode-full.png)
- `local-08-viewport-after-mutate.png` — ![](screenshots/local-08-viewport-after-mutate.png)
- `local-09-viewport-after-breed-load.png` — ![](screenshots/local-09-viewport-after-breed-load.png)
- `local-09b-vault-full.png` — ![](screenshots/local-09b-vault-full.png)
- `local-10-viewport-back-create.png` — ![](screenshots/local-10-viewport-back-create.png)
- `local-11-back-to-select.png` — ![](screenshots/local-11-back-to-select.png)
- `local-12-viewport-after-select-roundtrip.png` — ![](screenshots/local-12-viewport-after-select-roundtrip.png)
- `local-13-final-viewport.png` — ![](screenshots/local-13-final-viewport.png)
- `local-13-final.png` — ![](screenshots/local-13-final.png)
- `pages-01-landing.png` — ![](screenshots/pages-01-landing.png)
- `pages-02-create.png` — ![](screenshots/pages-02-create.png)
- `pages-03-mutate.png` — ![](screenshots/pages-03-mutate.png)

## Downloads

- `giga_rig.glb` (50840 bytes)
- `giga_rig_face_texture.png` (30175 bytes)
- `hyper_spark.glb` (136332 bytes)
- `hyper_spark_face_texture.png` (54278 bytes)
- `turbo_pulse.glb` (135744 bytes)
- `turbo_pulse_face_texture.png` (75724 bytes)
- `voxel_zone.glb` (401552 bytes)
- `voxel_zone_face_texture.png` (53369 bytes)

## Notes

- Interactive suite runs Chromium via Playwright against the production `dist/` static server.
- GitHub Pages test serves the same dist under `/GLB_FACTORY/` with asset prefix verification.
- Face texture export may SKIP if offline fallback does not produce a faceCanvas.
