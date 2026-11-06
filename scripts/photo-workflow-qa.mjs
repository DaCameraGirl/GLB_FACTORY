import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/GLB_FACTORY\//, '');
    const file = path.resolve(dist, relative || 'index.html');
    if (!file.startsWith(dist + path.sep)) { res.writeHead(404).end(); return; }
    const bytes = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(bytes);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page.setDefaultTimeout(30000);
  const errors = [], apiRequests = [], failedAssets = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('/api/')) apiRequests.push(request.url()); });
  page.on('response', response => { if (response.status() >= 400) failedAssets.push(response.url()); });
  const remote = process.argv[2];
  await page.goto(remote || `http://127.0.0.1:${server.address().port}/GLB_FACTORY/`, { waitUntil: 'domcontentloaded' });
  await page.locator('#mode-create-from-photo').click();
  const input = page.locator('#portrait-file-input');
  const build = page.locator('#build-avatar-button');
  assert.equal(await build.isDisabled(), true);
  await input.setInputFiles(path.join(root, 'src/assets/creatures/portrait-hero.png'));
  await page.waitForFunction(() => !document.querySelector('#build-avatar-button')?.disabled);
  await build.click();
  await page.waitForFunction(() => !document.querySelector('#build-avatar-button')?.disabled);
  await page.locator('#download-glb-button').waitFor({ state: 'visible' });
  const readDownload = async (selector) => {
    const pending = page.waitForEvent('download');
    await page.locator(selector).click();
    const download = await pending;
    const bytes = await fs.readFile(await download.path());
    assert.equal(bytes.readUInt32LE(0), 0x46546c67);
    assert.equal(bytes.readUInt32LE(4), 2);
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
    assert.ok(gltf.meshes.length > 0);
    assert.ok(gltf.images?.length > 0, 'photo texture included');
    for (const skin of gltf.skins || []) for (const joint of skin.joints) {
      assert.ok(Number.isInteger(joint) && gltf.nodes[joint], `invalid joint ${joint}`);
    }
    console.log(`PASS ${selector}: ${bytes.length} bytes, ${gltf.meshes.length} meshes, ${gltf.skins?.length || 0} skins`);
    return gltf;
  };
  const avatar = await readDownload('#download-glb-button');
  assert.ok(avatar.skins?.length > 0, 'organic avatar contains valid limb skeletons');
  await page.locator('#photo-sculpt-button').click();
  await readDownload('#photo-sculpt-download');
  if (!remote) {
    assert.deepEqual(apiRequests, [], 'static build must never call a backend');
    assert.deepEqual(failedAssets, [], 'all app assets should load');
    await input.setInputFiles({ name: 'retry.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
    await page.locator('#upload-panel [role=alert]').waitFor();
    assert.equal(await build.isDisabled(), true);
    assert.equal(await page.locator('#photo-sculpt-button').isDisabled(), true);
    await input.setInputFiles({ name: 'retry.png', mimeType: 'image/png', buffer: await fs.readFile(path.join(root, 'src/assets/creatures/portrait-hero.png')) });
    await page.waitForFunction(() => !document.querySelector('#build-avatar-button')?.disabled);
    assert.equal(await page.locator('#upload-panel [role=alert]').count(), 0);
    await build.click();
    await page.waitForFunction(() => !document.querySelector('#build-avatar-button')?.disabled);
    await readDownload('#download-glb-button');
    console.log('PASS corrupt image rejection, same-name retry, static offline workflow');
  }
  assert.deepEqual(errors, [], 'no uncaught browser errors');
  console.log('PASS photo to character and photo sculpt workflows');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
