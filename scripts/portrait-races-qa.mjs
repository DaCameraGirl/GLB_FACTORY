import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' };
const server = http.createServer(async (req, res) => {
  try {
    const relative = new URL(req.url, 'http://localhost').pathname.replace(/^\/GLB_FACTORY\//, '');
    const file = path.resolve(dist, relative || 'index.html');
    if (!file.startsWith(dist + path.sep)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.setDefaultTimeout(90000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Third-party fonts and runtime telemetry are unnecessary for these checks.
  await page.route('https://**/*', route => route.abort());
  const url = `http://127.0.0.1:${server.address().port}/GLB_FACTORY/`;
  const portrait = path.join(root, 'src/assets/creatures/portrait-hero.png');
  const open = async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('#mode-create-from-photo').click();
    await page.locator('#portrait-file-input').setInputFiles(portrait);
    await page.waitForFunction(() => !document.querySelector('#build-avatar-button')?.disabled);
  };
  await page.route('**/mediapipe/face_landmarker.task', route => route.abort());
  await open();
  await page.locator('#build-avatar-button').click();
  await page.locator('#portrait-upload-error').waitFor();
  assert.match(await page.locator('#portrait-upload-error').innerText(), /model could not load/);
  assert.equal(await page.locator('#download-glb-button').isDisabled(), true);
  await page.unroute('**/mediapipe/face_landmarker.task');
  await page.locator('#build-avatar-button').click();
  await page.waitForFunction(() => !document.querySelector('#download-glb-button')?.disabled);
  await page.locator('#fitted-face-panel').waitFor();
  console.log('PASS model load failure is visible and retry produces an exportable fitted face');
  const previewPath = process.env.PORTRAIT_QA_PREVIEW;
  if (previewPath) {
    await page.locator('[id="3d-preview-canvas-container"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: previewPath });
  }

  for (const selection of ['cat', 'cube']) {
    let release, markRequested;
    const held = new Promise(resolve => { release = resolve; });
    const requested = new Promise(resolve => { markRequested = resolve; });
    await page.route('**/mediapipe/face_landmarker.task', async route => { markRequested(); await held; await route.continue(); });
    await open();
    await page.locator('#build-avatar-button').click();
    await requested;
    await page.locator('#mesh-style-select').selectOption(selection);
    await page.waitForFunction(() => !document.querySelector('#build-avatar-button')?.disabled);
    const finished = page.waitForResponse(response => response.url().includes('/mediapipe/face_landmarker.task'));
    release();
    await finished;
    // Wait for the cached model to finish its abandoned inference, then prove the newer choice wins.
    await page.waitForTimeout(3000);
    assert.equal(await page.locator('#mesh-style-select').inputValue(), selection);
    assert.equal(await page.locator('#fitted-face-panel').count(), 0);
    await page.unroute('**/mediapipe/face_landmarker.task');
    console.log(`PASS ${selection} selection cancels a pending fit without being overwritten`);
  }
  await page.locator('#mesh-style-select').selectOption('cat');
  await page.waitForFunction(() => !document.querySelector('#download-glb-button')?.disabled);
  await page.locator('#portrait-file-input').setInputFiles(portrait);
  await page.waitForFunction(() => !document.querySelector('#build-avatar-button')?.disabled);
  assert.equal(await page.locator('#download-glb-button').isDisabled(), true, 'upload invalidates prior animal export');
  await page.locator('#build-avatar-button').click();
  await page.waitForFunction(() => !document.querySelector('#download-glb-button')?.disabled);
  await page.locator('#fitted-face-panel').waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS animal-to-portrait upload readiness and refit; no uncaught errors');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
