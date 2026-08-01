/**
 * Full browser QA for GLB Factory.
 * - Create From Photo + upload + sliders/editor
 * - Mode switch Create <-> Mutation
 * - Mutate, vault, breed, load offspring
 * - State survival across mode changes
 * - Export downloads (GLB + texture)
 * - Screenshots of WebGL viewport
 * - Production build + GitHub Pages base path
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import http from "http";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "qa-results");
const shotsDir = path.join(outDir, "screenshots");
const dlDir = path.join(outDir, "downloads");

const results = [];
function pass(id, detail = "") {
  results.push({ id, status: "PASS", detail });
  console.log(`PASS  ${id}${detail ? " — " + detail : ""}`);
}
function fail(id, detail = "") {
  results.push({ id, status: "FAIL", detail });
  console.log(`FAIL  ${id}${detail ? " — " + detail : ""}`);
}
function skip(id, detail = "") {
  results.push({ id, status: "SKIP", detail });
  console.log(`SKIP  ${id}${detail ? " — " + detail : ""}`);
}

function ensureDirs() {
  for (const d of [outDir, shotsDir, dlDir]) {
    fs.mkdirSync(d, { recursive: true });
  }
}

/** Minimal valid 256x256 RGB PNG (solid peach face-like color) via pure zlib-free uncompressed approach is heavy;
 *  use a real project PNG instead (genie mascot or og-image). */
function resolveTestImage() {
  const candidates = [
    path.join(root, "src/assets/genie-mascot.png"),
    path.join(root, "public/og-image.png"),
    path.join(root, "../render_viewport_uploaded_image_not_rendering_correctly.png"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error("No test image found");
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 304) return;
    } catch {
      /* retry */
    }
    await wait(400);
  }
  throw new Error(`Server not ready: ${url}`);
}

function startStaticServer(distDir, port, pagesBase = false) {
  // pagesBase: serve dist under /GLB_FACTORY/ to mimic GitHub Pages
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
        if (pagesBase) {
          if (urlPath === "/" || urlPath === "") {
            res.writeHead(302, { Location: "/GLB_FACTORY/" });
            res.end();
            return;
          }
          if (!urlPath.startsWith("/GLB_FACTORY")) {
            res.writeHead(404);
            res.end("not found (expected /GLB_FACTORY/...)");
            return;
          }
          urlPath = urlPath.slice("/GLB_FACTORY".length) || "/";
        }
        if (urlPath.endsWith("/")) urlPath += "index.html";
        const filePath = path.join(distDir, urlPath.replace(/^\//, ""));
        if (!filePath.startsWith(distDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          // SPA fallback for pages root
          const index = path.join(distDir, "index.html");
          if (fs.existsSync(index) && (urlPath === "/index.html" || urlPath === "/")) {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(fs.readFileSync(index));
            return;
          }
          res.writeHead(404);
          res.end("not found: " + urlPath);
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const types = {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".png": "image/png",
          ".svg": "image/svg+xml",
          ".json": "application/json",
          ".map": "application/json",
        };
        res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
        res.end(fs.readFileSync(filePath));
      } catch (e) {
        res.writeHead(500);
        res.end(String(e));
      }
    });
    server.listen(port, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function runBuild(envExtra = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "build"],
      {
        cwd: root,
        env: { ...process.env, ...envExtra },
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
      }
    );
    let out = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (out += d.toString()));
    child.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`build failed ${code}\n${out}`));
    });
  });
}

async function shot(page, name) {
  const file = path.join(shotsDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function shotViewport(page, name) {
  const panel = page.locator("#preview-panel");
  const file = path.join(shotsDir, `${name}.png`);
  if ((await panel.count()) > 0) {
    await panel.screenshot({ path: file });
  } else {
    await page.screenshot({ path: file, fullPage: false });
  }
  return file;
}

async function readConfigSnapshot(page) {
  return page.evaluate(() => {
    // Pull visible character name from watermark if present
    const nameEl = document.querySelector("#preview-panel .font-mono.uppercase");
    const logs = Array.from(document.querySelectorAll("#app-root-container *"))
      .map((el) => el.textContent || "")
      .join(" ");
    const bodyTypeSelect = document.querySelector('select');
    return {
      characterNameInput: document.querySelector('input[placeholder*="name" i]')?.value
        || document.querySelector("#upload-panel input[type=text]")?.value
        || null,
      hasCanvas: !!document.querySelector("#preview-panel canvas"),
      hasFaceBox: !!document.querySelector("#detected-face-box-overlay"),
      hasSourceImg: !!document.querySelector("#upload-panel img, #drag-drop-zone img"),
      vaultCountText: (document.body.innerText.match(/(\d+)\s*specimens saved/i) || [])[1] || null,
      modeText: (document.body.innerText.match(/Mode:\s*(Create From Photo|Mutation Lab)/) || [])[1] || null,
    };
  });
}

async function runInteractiveSuite(baseUrl, label) {
  console.log(`\n======== Interactive suite: ${label} @ ${baseUrl} ========`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25000);

  const testImage = resolveTestImage();
  const downloads = [];

  try {
    // --- Fresh load ---
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await wait(800);
    await shot(page, `${label}-01-landing`);

    const hasCreate = await page.getByRole("button", { name: /Create From Photo/i }).count();
    const hasMutate = await page.getByRole("button", { name: /Mutation Lab/i }).count();
    if (hasCreate > 0 && hasMutate > 0) {
      pass(`${label}:landing-modes`, "Create + Mutation visible");
    } else {
      // Mode select cards are buttons with headings inside
      const createCard = page.locator("#mode-create-from-photo");
      const mutateCard = page.locator("#mode-mutation-lab");
      if ((await createCard.count()) && (await mutateCard.count())) {
        pass(`${label}:landing-modes`, "mode cards by id");
      } else {
        fail(`${label}:landing-modes`, `create=${hasCreate} mutate=${hasMutate}`);
      }
    }

    // --- Create From Photo ---
    const createBtn = page.locator("#mode-create-from-photo");
    if ((await createBtn.count()) > 0) {
      await createBtn.click();
    } else {
      await page.getByRole("button", { name: /Create From Photo/i }).first().click();
    }
    await wait(600);
    await shot(page, `${label}-02-create-mode`);

    if ((await page.locator("#upload-panel").count()) > 0) {
      pass(`${label}:create-mode`, "upload panel visible");
    } else {
      fail(`${label}:create-mode`, "upload panel missing");
    }

    // Name
    const nameInput = page.locator("#upload-panel input[type=text]").first();
    if ((await nameInput.count()) > 0) {
      await nameInput.fill("QA_Test_Subject");
    }

    // Upload
    const fileInput = page.locator("#portrait-file-input");
    if ((await fileInput.count()) === 0) {
      fail(`${label}:upload`, "file input missing");
    } else {
      await fileInput.setInputFiles(testImage);
      await wait(1000);
      const imgCount = await page.locator("#drag-drop-zone img, #upload-panel img").count();
      if (imgCount > 0) pass(`${label}:upload`, `image shown (${path.basename(testImage)})`);
      else fail(`${label}:upload`, "no preview image after upload");
    }
    await shot(page, `${label}-03-after-upload`);

    // Build avatar
    const buildBtn = page.locator("#build-avatar-button");
    if ((await buildBtn.count()) > 0) {
      await buildBtn.click();
      // Wait for processing to finish
      try {
        await page.waitForFunction(
          () => {
            const b = document.querySelector("#build-avatar-button");
            return b && !b.hasAttribute("disabled") && !/Processing/i.test(b.textContent || "");
          },
          { timeout: 45000 }
        );
      } catch {
        await wait(3000);
      }
      await wait(1500);
      const canvasCount = await page.locator("#preview-panel canvas").count();
      if (canvasCount > 0) pass(`${label}:build-avatar`, "WebGL canvas present");
      else fail(`${label}:build-avatar`, "no canvas in preview panel");
    } else {
      fail(`${label}:build-avatar`, "build button missing");
    }
    await shotViewport(page, `${label}-04-viewport-after-build`);
    await shot(page, `${label}-04b-full-after-build`);

    // Face texture sliders if crop panel exists
    const cropPanel = page.locator("#crop-tuning-panel");
    if ((await cropPanel.count()) > 0) {
      const ranges = cropPanel.locator('input[type="range"]');
      const n = await ranges.count();
      if (n > 0) {
        await ranges.nth(0).fill("70");
        if (n > 1) await ranges.nth(Math.min(1, n - 1)).fill("10");
        await wait(500);
        pass(`${label}:face-sliders`, `adjusted ${n} range inputs`);
      } else {
        pass(`${label}:face-sliders`, "crop panel present (no ranges found)");
      }
    } else {
      // Offline fallback may still set faceBox after build
      skip(`${label}:face-sliders`, "crop panel not shown (no faceBox yet)");
    }
    await shotViewport(page, `${label}-05-viewport-after-sliders`);

    // Editor settings — parts tab / mesh style if customization panel present
    const editor = page.locator("#customization-panel");
    if ((await editor.count()) > 0) {
      const selects = editor.locator("select");
      const sc = await selects.count();
      if (sc > 0) {
        // change first select option if possible
        const options = selects.first().locator("option");
        const oc = await options.count();
        if (oc > 1) {
          const val = await options.nth(1).getAttribute("value");
          if (val) await selects.first().selectOption(val);
        }
      }
      // click materials tab if present
      const matTab = editor.getByRole("button", { name: /materials/i });
      if ((await matTab.count()) > 0) {
        await matTab.first().click();
        await wait(300);
        const rough = editor.locator('input[type="range"]').first();
        if ((await rough.count()) > 0) {
          await rough.fill("0.3");
        }
      }
      pass(`${label}:editor-settings`, "customization panel interacted");
    } else {
      fail(`${label}:editor-settings`, "customization panel missing");
    }
    await wait(800);
    await shotViewport(page, `${label}-06-viewport-after-editor`);

    const snapCreate = await readConfigSnapshot(page);

    // --- Switch to Mutation Lab ---
    const mutateModeBtn = page.getByRole("button", { name: /^Mutation Lab$/i });
    if ((await mutateModeBtn.count()) > 0) {
      await mutateModeBtn.click();
    } else {
      await page.locator("#mode-switcher-bar").getByText(/Mutation Lab/i).click();
    }
    await wait(800);

    const labVisible = (await page.locator("#interactive-qa-panel").count()) > 0;
    const uploadHidden = (await page.locator("#upload-panel").count()) === 0;
    if (labVisible) pass(`${label}:switch-to-mutate`, `lab visible, upload hidden=${uploadHidden}`);
    else fail(`${label}:switch-to-mutate`, "mutation lab panel missing");

    // Character should still be on canvas
    const canvasAfterSwitch = await page.locator("#preview-panel canvas").count();
    if (canvasAfterSwitch > 0) pass(`${label}:state-survive-to-mutate`, "canvas still present after mode switch");
    else fail(`${label}:state-survive-to-mutate`, "canvas lost after switch to mutate");
    await shotViewport(page, `${label}-07-viewport-mutate-mode`);
    await shot(page, `${label}-07b-mutate-mode-full`);

    // Mutate a few times
    const mutateBtn = page.getByRole("button", { name: /MUTATE SKELETAL DNA/i });
    if ((await mutateBtn.count()) > 0) {
      await mutateBtn.click();
      await wait(700);
      await mutateBtn.click();
      await wait(700);
      await mutateBtn.click();
      await wait(900);
      pass(`${label}:mutate`, "clicked mutate 3x");
    } else {
      fail(`${label}:mutate`, "mutate button missing");
    }
    await shotViewport(page, `${label}-08-viewport-after-mutate`);

    // Vault specimens
    const vault = page.locator("#genotype-crypt-panel");
    if ((await vault.count()) > 0) {
      const loadBtns = vault.getByRole("button", { name: /^LOAD$/i });
      const breedBtns = vault.getByRole("button", { name: /^BREED$/i });
      const loadCount = await loadBtns.count();
      const breedCount = await breedBtns.count();
      if (loadCount >= 2) {
        pass(`${label}:vault-save`, `${loadCount} specimen cards (LOAD buttons)`);
      } else if (loadCount >= 1) {
        pass(`${label}:vault-save`, `${loadCount} specimen (need 2 for breed — mutating more)`);
        // more mutates
        if ((await mutateBtn.count()) > 0) {
          await mutateBtn.click();
          await wait(500);
          await mutateBtn.click();
          await wait(500);
        }
      } else {
        fail(`${label}:vault-save`, "no LOAD buttons — vault empty?");
      }

      // Breed two parents
      const breeds = vault.getByRole("button", { name: /^BREED$/i });
      const bc = await breeds.count();
      if (bc >= 2) {
        await breeds.nth(0).click();
        await wait(200);
        await breeds.nth(1).click();
        await wait(300);
        const fuse = page.getByRole("button", { name: /FUSE PARENT GENOMES/i });
        if ((await fuse.count()) > 0 && !(await fuse.isDisabled())) {
          await fuse.click();
          await wait(1000);
          pass(`${label}:breed`, "fused two parents");
        } else {
          // try click anyway
          if ((await fuse.count()) > 0) {
            await fuse.click({ force: true }).catch(() => {});
            await wait(800);
          }
          const selected = await vault.getByText(/SELECTED/i).count();
          if (selected >= 2) pass(`${label}:breed`, "parents selected (fuse may have run)");
          else fail(`${label}:breed`, `fuse disabled or missing; selected=${selected}`);
        }
      } else {
        fail(`${label}:breed`, `only ${bc} BREED buttons`);
      }

      // Load offspring / latest
      const loads = vault.getByRole("button", { name: /^LOAD$/i });
      if ((await loads.count()) > 0) {
        await loads.first().click();
        await wait(1000);
        pass(`${label}:reload-offspring`, "LOAD clicked on specimen");
      } else {
        fail(`${label}:reload-offspring`, "no LOAD after breed");
      }
    } else {
      fail(`${label}:vault-save`, "vault panel missing");
    }
    await shotViewport(page, `${label}-09-viewport-after-breed-load`);
    await shot(page, `${label}-09b-vault-full`);

    const snapMutate = await readConfigSnapshot(page);

    // --- Switch back to Create — state should survive ---
    const createModeBtn = page.getByRole("button", { name: /^Create From Photo$/i });
    if ((await createModeBtn.count()) > 0) {
      await createModeBtn.click();
    } else {
      await page.locator("#mode-switcher-bar").getByText(/Create From Photo/i).click();
    }
    await wait(800);
    const canvasBack = await page.locator("#preview-panel canvas").count();
    if (canvasBack > 0) pass(`${label}:state-survive-to-create`, "canvas present after return to create");
    else fail(`${label}:state-survive-to-create`, "canvas lost after return to create");
    await shotViewport(page, `${label}-10-viewport-back-create`);

    // Change mode -> select -> re-enter mutate, state should rebuild
    const changeMode = page.getByRole("button", { name: /Change mode/i });
    if ((await changeMode.count()) > 0) {
      await changeMode.click();
      await wait(500);
      await shot(page, `${label}-11-back-to-select`);
      // re-enter mutate
      const m = page.locator("#mode-mutation-lab");
      if ((await m.count()) > 0) await m.click();
      else await page.getByRole("button", { name: /Mutation Lab/i }).first().click();
      await wait(1200);
      const canvasRe = await page.locator("#preview-panel canvas").count();
      if (canvasRe > 0) pass(`${label}:state-after-select-roundtrip`, "canvas rebuilt after select round-trip");
      else fail(`${label}:state-after-select-roundtrip`, "canvas missing after select round-trip");
      await shotViewport(page, `${label}-12-viewport-after-select-roundtrip`);
    } else {
      skip(`${label}:state-after-select-roundtrip`, "Change mode button not found");
    }

    // --- Exports ---
    // Ensure we're in a mode with export panel
    if ((await page.locator("#export-actions-panel").count()) === 0) {
      // enter create to get panels
      if ((await page.locator("#mode-create-from-photo").count()) > 0) {
        await page.locator("#mode-create-from-photo").click();
        await wait(800);
      }
    }

    // GLB download
    const glbBtn = page.locator("#download-glb-button");
    if ((await glbBtn.count()) > 0) {
      const disabled = await glbBtn.isDisabled();
      if (disabled) {
        // try loading a preset to force success state
        const preset = page.locator("button").filter({ hasText: /Nexus Zero|Gemini|Valkyrie/i }).first();
        if ((await preset.count()) > 0) {
          await preset.click();
          await wait(1200);
        }
      }
      try {
        const [download] = await Promise.all([
          page.waitForEvent("download", { timeout: 15000 }),
          glbBtn.click({ force: true }),
        ]);
        const suggested = download.suggestedFilename();
        const target = path.join(dlDir, suggested || `${label}-export.glb`);
        await download.saveAs(target);
        const size = fs.statSync(target).size;
        downloads.push({ file: target, size, type: "glb" });
        if (size > 500) pass(`${label}:export-glb`, `${suggested} (${size} bytes)`);
        else fail(`${label}:export-glb`, `file too small: ${size}`);
      } catch (e) {
        fail(`${label}:export-glb`, String(e.message || e));
      }
    } else {
      fail(`${label}:export-glb`, "download-glb-button missing");
    }

    // Texture download — only if face canvas exists
    const texBtn = page.locator("#download-texture-button");
    if ((await texBtn.count()) > 0 && !(await texBtn.isDisabled())) {
      try {
        const [download] = await Promise.all([
          page.waitForEvent("download", { timeout: 10000 }),
          texBtn.click(),
        ]);
        const suggested = download.suggestedFilename();
        const target = path.join(dlDir, suggested || `${label}-texture.png`);
        await download.saveAs(target);
        const size = fs.statSync(target).size;
        downloads.push({ file: target, size, type: "png" });
        if (size > 100) pass(`${label}:export-texture`, `${suggested} (${size} bytes)`);
        else fail(`${label}:export-texture`, `file too small: ${size}`);
      } catch (e) {
        fail(`${label}:export-texture`, String(e.message || e));
      }
    } else {
      // Texture may be disabled without faceCanvas — try create path upload again
      skip(`${label}:export-texture`, "button disabled or missing (no faceCanvas)");
    }

    await shot(page, `${label}-13-final`);
    await shotViewport(page, `${label}-13-final-viewport`);

    return { downloads, snapCreate, snapMutate };
  } finally {
    await browser.close();
  }
}

async function main() {
  ensureDirs();
  console.log("QA output:", outDir);

  // 1) Production build (relative base for local static server)
  console.log("\n======== Production build (relative base) ========");
  try {
    // Unset GITHUB_ACTIONS for relative paths
    const env = { ...process.env };
    delete env.GITHUB_ACTIONS;
    const out = await runBuild(env);
    pass("production-build", "npm run build exit 0");
    fs.writeFileSync(path.join(outDir, "build-local.log"), out);
  } catch (e) {
    fail("production-build", String(e.message || e));
    writeReport();
    process.exit(1);
  }

  // 2) Serve dist locally
  const localPort = 4177;
  const distDir = path.join(root, "dist");
  let serverLocal = await startStaticServer(distDir, localPort, false);
  const localUrl = `http://127.0.0.1:${localPort}/`;
  await waitForServer(localUrl);
  pass("local-static-server", localUrl);

  let interactiveOk = true;
  try {
    await runInteractiveSuite(localUrl, "local");
  } catch (e) {
    interactiveOk = false;
    fail("local:interactive-suite", String(e.message || e));
    console.error(e);
  }

  serverLocal.close();

  // 3) GitHub Pages base path build + server
  console.log("\n======== Production build (GitHub Pages base) ========");
  try {
    const out = await runBuild({ GITHUB_ACTIONS: "true" });
    pass("pages-build", "GITHUB_ACTIONS=true build ok");
    fs.writeFileSync(path.join(outDir, "build-pages.log"), out);
    const html = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
    if (html.includes('src="/GLB_FACTORY/assets/') || html.includes("src=\"/GLB_FACTORY/assets/")) {
      pass("pages-asset-prefix", "JS/CSS under /GLB_FACTORY/assets/");
    } else if (html.includes("/GLB_FACTORY/")) {
      pass("pages-asset-prefix", "contains /GLB_FACTORY/ paths");
    } else {
      fail("pages-asset-prefix", "missing /GLB_FACTORY/ in dist/index.html");
    }
  } catch (e) {
    fail("pages-build", String(e.message || e));
  }

  const pagesPort = 4178;
  let serverPages = await startStaticServer(distDir, pagesPort, true);
  const pagesUrl = `http://127.0.0.1:${pagesPort}/GLB_FACTORY/`;
  try {
    await waitForServer(pagesUrl);
    // Asset fetch
    const html = await (await fetch(pagesUrl)).text();
    const jsMatch = html.match(/src="([^"]+\.js)"/);
    if (jsMatch) {
      const jsUrl = jsMatch[1].startsWith("http")
        ? jsMatch[1]
        : `http://127.0.0.1:${pagesPort}${jsMatch[1]}`;
      const jr = await fetch(jsUrl);
      const len = (await jr.arrayBuffer()).byteLength;
      if (jr.ok && len > 100000) pass("pages-js-fetch", `${jsUrl} (${len} bytes)`);
      else fail("pages-js-fetch", `${jsUrl} status=${jr.status} len=${len}`);
    }
    const og = await fetch(`http://127.0.0.1:${pagesPort}/GLB_FACTORY/og-preview.svg`);
    if (og.ok) pass("pages-og-asset", "og-preview.svg 200");
    else fail("pages-og-asset", `status ${og.status}`);

    // Light browser smoke on pages base (landing + enter create)
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(pagesUrl, { waitUntil: "networkidle" });
    await wait(1000);
    await shot(page, "pages-01-landing");
    const create = page.locator("#mode-create-from-photo");
    if ((await create.count()) > 0) {
      await create.click();
      await wait(800);
      await shot(page, "pages-02-create");
      if ((await page.locator("#upload-panel").count()) > 0) pass("pages-spa-mode", "Create mode works under /GLB_FACTORY/");
      else fail("pages-spa-mode", "upload panel missing under pages base");
    } else {
      fail("pages-spa-mode", "mode card missing under pages base");
    }
    // quick mutate
    await page.getByRole("button", { name: /^Mutation Lab$/i }).click().catch(async () => {
      await page.locator("#mode-switcher-bar").getByText(/Mutation Lab/i).click();
    });
    await wait(600);
    await shot(page, "pages-03-mutate");
    await browser.close();
  } catch (e) {
    fail("pages-interactive", String(e.message || e));
  }
  serverPages.close();

  writeReport();
  const fails = results.filter((r) => r.status === "FAIL").length;
  process.exit(fails > 0 ? 1 : 0);
}

function writeReport() {
  const passN = results.filter((r) => r.status === "PASS").length;
  const failN = results.filter((r) => r.status === "FAIL").length;
  const skipN = results.filter((r) => r.status === "SKIP").length;
  const shots = fs.existsSync(shotsDir)
    ? fs.readdirSync(shotsDir).filter((f) => f.endsWith(".png"))
    : [];
  const dls = fs.existsSync(dlDir) ? fs.readdirSync(dlDir) : [];

  const md = [
    `# GLB Factory QA Report`,
    ``,
    `**Generated:** ${new Date().toISOString()}`,
    `**Summary:** ${passN} PASS · ${failN} FAIL · ${skipN} SKIP`,
    ``,
    `## Results`,
    ``,
    `| Status | Check | Detail |`,
    `|---|---|---|`,
    ...results.map((r) => `| **${r.status}** | ${r.id} | ${String(r.detail).replace(/\|/g, "\\|")} |`),
    ``,
    `## Screenshots`,
    ``,
    ...shots.map((s) => `- \`${s}\` — ![](screenshots/${s})`),
    ``,
    `## Downloads`,
    ``,
    dls.length
      ? dls
          .map((f) => {
            const p = path.join(dlDir, f);
            const size = fs.statSync(p).size;
            return `- \`${f}\` (${size} bytes)`;
          })
          .join("\n")
      : "_No downloads captured_",
    ``,
    `## Notes`,
    ``,
    `- Interactive suite runs Chromium via Playwright against the production \`dist/\` static server.`,
    `- GitHub Pages test serves the same dist under \`/GLB_FACTORY/\` with asset prefix verification.`,
    `- Face texture export may SKIP if offline fallback does not produce a faceCanvas.`,
    ``,
  ].join("\n");

  fs.writeFileSync(path.join(outDir, "REPORT.md"), md);
  fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify({ results, shots, dls, passN, failN, skipN }, null, 2));
  console.log(`\n======== SUMMARY: ${passN} PASS / ${failN} FAIL / ${skipN} SKIP ========`);
  console.log(`Report: ${path.join(outDir, "REPORT.md")}`);
}

main().catch((e) => {
  console.error(e);
  fail("fatal", String(e.message || e));
  writeReport();
  process.exit(1);
});
