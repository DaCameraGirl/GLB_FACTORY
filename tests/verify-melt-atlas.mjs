import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

if (!globalThis.self) {
  globalThis.self = globalThis;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetPath = path.join(__dirname, "assets", "melt-test.png");

const SHAPES = [
  { value: "cube", label: "cube" },
  { value: "rounded-cube", label: "rounded" },
  { value: "organic-smooth", label: "organic" },
  { value: "bean-soft", label: "bean-soft" },
];

const modeLabels = [
  { id: "face-only", button: /face only/i },
  { id: "head", button: /^head$/i },
  { id: "upper-body", button: /upper body/i },
  { id: "full-body", button: /full body/i },
];

function screenshotChanged(a, b) {
  return !a.equals(b);
}

function hashBuffer(buffer) {
  return crypto.createHash("sha1").update(buffer).digest("hex");
}

async function installDownloadCapture(page) {
  await page.addInitScript(() => {
    if (window.__codexDownloadCaptureInstalled) return;
    window.__codexDownloadCaptureInstalled = true;
    window.__codexDownloads = [];

    const captureLink = (anchor) => {
      if (!anchor?.download || !anchor?.href) return;
      const href = anchor.href;
      const download = anchor.download;
      const entry = { download, href, ready: false, size: 0, mimeType: "", base64: "" };
      window.__codexDownloads.push(entry);

      const finish = (blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = typeof reader.result === "string" ? reader.result : "";
          entry.base64 = result.includes(",") ? result.split(",")[1] : result;
          entry.size = blob.size;
          entry.mimeType = blob.type;
          entry.ready = true;
        };
        reader.readAsDataURL(blob);
      };

      if (href.startsWith("blob:") || href.startsWith("data:")) {
        fetch(href).then((response) => response.blob()).then(finish).catch((error) => {
          entry.error = String(error);
          entry.ready = true;
        });
      } else {
        entry.ready = true;
      }
    };

    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function patchedAppendChild(node) {
      if (node instanceof HTMLAnchorElement) {
        captureLink(node);
      }
      return originalAppendChild.call(this, node);
    };

    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function patchedClick() {
      captureLink(this);
      return originalClick.call(this);
    };

    const originalRevokeObjectURL = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = function patchedRevokeObjectURL(url) {
      setTimeout(() => originalRevokeObjectURL(url), 2000);
    };
  });
}

async function waitForCapturedDownload(page, beforeCount) {
  await page.waitForFunction(
    (expectedCount) => (window.__codexDownloads?.length || 0) > expectedCount,
    beforeCount,
    { timeout: 30000 }
  );
  const download = await page.waitForFunction(
    () => {
      const list = window.__codexDownloads || [];
      const last = list[list.length - 1];
      return last && last.ready ? last : null;
    },
    undefined,
    { timeout: 30000 }
  );
  return await download.jsonValue();
}

async function setRangeByIndex(page, index, value) {
  const slider = page.locator("#meltdown-factory-panel input[type='range']").nth(index);
  await slider.evaluate((node, nextValue) => {
    node.value = String(nextValue);
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await page.waitForTimeout(220);
}

async function parseExportedGlb(glbPath) {
  const buffer = await fs.readFile(glbPath);
  return await parseExportedGlbBuffer(buffer);
}

async function parseExportedGlbBuffer(buffer) {
  const loader = new GLTFLoader();

  return await new Promise((resolve) => {
    loader.parse(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      "",
      (gltf) => {
        let meshCount = 0;
        let materialCount = 0;
        let uvPresent = true;
        let bakedTextureAttached = false;
        const materialSet = new Set();

        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshCount += 1;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material) => {
              if (material) materialSet.add(material.uuid);
              if (!child.geometry?.attributes?.uv) uvPresent = false;
              if (material && "map" in material && material.map) bakedTextureAttached = true;
            });
          }
        });

        materialCount = materialSet.size;

        resolve({
          parses: true,
          sceneNonEmpty: gltf.scene.children.length > 0,
          meshCount,
          materialCount,
          uvPresent,
          bakedTextureAttached,
        });
      },
      (error) => {
        resolve({
          parses: false,
          sceneNonEmpty: false,
          meshCount: 0,
          materialCount: 0,
          uvPresent: false,
          bakedTextureAttached: false,
          error: error?.message || String(error),
        });
      }
    );
  });
}

async function verifyExportedGlbInBrowser(page, buffer) {
  const byteArray = Array.from(buffer);
  return await page.evaluate(async ({ bytes }) => {
    const THREE = await import("https://esm.sh/three@0.185.1");
    const { GLTFLoader } = await import("https://esm.sh/three@0.185.1/examples/jsm/loaders/GLTFLoader.js");

    const loader = new GLTFLoader();
    const arrayBuffer = new Uint8Array(bytes).buffer;

    return await new Promise((resolve) => {
      loader.parse(
        arrayBuffer,
        "",
        (gltf) => {
          let meshCount = 0;
          let materialCount = 0;
          let uvPresent = true;
          let bakedTextureAttached = false;
          const materialSet = new Set();

          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              meshCount += 1;
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((material) => {
                if (material) materialSet.add(material.uuid);
                if (!child.geometry?.attributes?.uv) uvPresent = false;
                if (material?.map) bakedTextureAttached = true;
              });
            }
          });

          const materialCountValue = materialSet.size;

          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
          renderer.setSize(256, 256, false);
          const scene = new THREE.Scene();
          scene.background = new THREE.Color("#cccccc");
          scene.add(new THREE.AmbientLight(0xffffff, 1.2));
          const dir = new THREE.DirectionalLight(0xffffff, 1.3);
          dir.position.set(2, 3, 4);
          scene.add(dir);
          scene.add(gltf.scene);

          const bounds = new THREE.Box3().setFromObject(gltf.scene);
          const center = bounds.getCenter(new THREE.Vector3());
          const size = bounds.getSize(new THREE.Vector3());
          const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
          const maxDim = Math.max(size.x, size.y, size.z, 1);
          camera.position.copy(center).add(new THREE.Vector3(maxDim * 1.2, maxDim * 0.8, maxDim * 1.4));
          camera.lookAt(center);
          renderer.render(scene, camera);
          const renderDataUrl = canvas.toDataURL("image/png");
          renderer.dispose();

          resolve({
            parses: true,
            sceneNonEmpty: gltf.scene.children.length > 0,
            meshCount,
            materialCount: materialCountValue,
            uvPresent,
            bakedTextureAttached,
            renderHash: renderDataUrl.slice(0, 120),
          });
        },
        (error) => {
          resolve({
            parses: false,
            sceneNonEmpty: false,
            meshCount: 0,
            materialCount: 0,
            uvPresent: false,
            bakedTextureAttached: false,
            error: error?.message || String(error),
          });
        }
      );
    });
  }, { bytes: byteArray });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });
  await installDownloadCapture(page);
  const preview = page.locator('[id="3d-preview-canvas-container"]');
  const report = {
    upload: false,
    modes: {},
    controls: {},
    shaderLiveUpdate: {},
    shapes: [],
    exports: [],
    logs: [],
  };

  page.on("console", (msg) => {
    report.logs.push(`${msg.type()}: ${msg.text()}`);
  });

  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await page.locator("input[type='file']").first().setInputFiles(assetPath);
  await page.getByRole("button", { name: /build 3d avatar/i }).click();
  await page.waitForTimeout(2200);
  report.upload = true;

  await page.locator("#customization-panel select").first().selectOption("cube");
  await page.waitForTimeout(450);

  for (const mode of modeLabels) {
    await page.getByRole("button", { name: mode.button }).click();
    await page.waitForTimeout(320);
    const image = await preview.screenshot();
    report.modes[mode.id] = { hash: hashBuffer(image), bytes: image.length };
  }

  await page.getByRole("button", { name: /face only/i }).click();
  await page.waitForTimeout(150);
  const faceOnlyBuffer = Buffer.from(await preview.screenshot());
  await page.getByRole("button", { name: /^head$/i }).click();
  await page.waitForTimeout(150);
  const headBuffer = Buffer.from(await preview.screenshot());
  await page.getByRole("button", { name: /upper body/i }).click();
  await page.waitForTimeout(150);
  const upperBodyBuffer = Buffer.from(await preview.screenshot());
  await page.getByRole("button", { name: /full body/i }).click();
  await page.waitForTimeout(150);
  const fullBodyBuffer = Buffer.from(await preview.screenshot());
  report.modes.faceOnlyDiffersFromHead = screenshotChanged(faceOnlyBuffer, headBuffer);
  report.modes.headDiffersFromUpperBody = screenshotChanged(headBuffer, upperBodyBuffer);
  report.modes.upperBodyDiffersFromFullBody = screenshotChanged(upperBodyBuffer, fullBodyBuffer);

  await page.getByRole("button", { name: /full body/i }).click();
  await page.waitForTimeout(240);

  const basePlacement = await preview.screenshot();
  await setRangeByIndex(page, 0, 1.4);
  await setRangeByIndex(page, 1, 0.7);
  const scaledPlacement = await preview.screenshot();
  await setRangeByIndex(page, 2, 0.18);
  await setRangeByIndex(page, 3, -0.16);
  const offsetPlacement = await preview.screenshot();
  report.controls.scaleChangesPlacement = screenshotChanged(basePlacement, scaledPlacement);
  report.controls.offsetChangesPlacement = screenshotChanged(scaledPlacement, offsetPlacement);

  await page.getByRole("button", { name: /preview melt/i }).click();
  await page.waitForTimeout(200);
  const shaderBase = await preview.screenshot();
  await setRangeByIndex(page, 4, 0.82);
  const progressShot = await preview.screenshot();
  await setRangeByIndex(page, 6, 2.3);
  const speedShot = await preview.screenshot();
  await setRangeByIndex(page, 7, 3.1);
  const noiseShot = await preview.screenshot();
  await setRangeByIndex(page, 8, 1.55);
  const dripShot = await preview.screenshot();
  await setRangeByIndex(page, 9, 0.34);
  const edgeShot = await preview.screenshot();
  await setRangeByIndex(page, 5, 0.42);
  const opacityShot = await preview.screenshot();

  report.shaderLiveUpdate = {
    meltProgressChanged: screenshotChanged(shaderBase, progressShot),
    meltSpeedChanged: screenshotChanged(progressShot, speedShot),
    noiseScaleChanged: screenshotChanged(speedShot, noiseShot),
    dripLengthChanged: screenshotChanged(noiseShot, dripShot),
    edgeSoftnessChanged: screenshotChanged(dripShot, edgeShot),
    projectionOpacityChanged: screenshotChanged(edgeShot, opacityShot),
    textureItselfMoves: screenshotChanged(shaderBase, dripShot),
  };

  const headShapeSelect = page.locator("#customization-panel select").first();
  const nameInput = page.getByPlaceholder(/enter name/i);

  for (const shape of SHAPES) {
    await headShapeSelect.selectOption(shape.value);
    await page.waitForTimeout(600);
    await nameInput.fill(`Melt ${shape.label}`);
    await page.waitForTimeout(150);
    const viewportShot = await preview.screenshot();

    const meltFrameCount = await page.evaluate(() => window.__codexDownloads.length);
    await page.getByRole("button", { name: /export current melt frame/i }).click();
    const meltFrame = await waitForCapturedDownload(page, meltFrameCount);

    const glbCount = await page.evaluate(() => window.__codexDownloads.length);
    await page.getByRole("button", { name: /export final glb/i }).click();
    const glb = await waitForCapturedDownload(page, glbCount);
    const glbBuffer = Buffer.from(glb.base64, "base64");

    const exportReport = await parseExportedGlbBuffer(glbBuffer);
    const browserReloadReport = await verifyExportedGlbInBrowser(page, glbBuffer);
    report.shapes.push(shape.label);
    report.exports.push({
      shape: shape.label,
      viewportHash: hashBuffer(viewportShot),
      meltFrameSuggestedName: meltFrame.download,
      meltFrameBytes: meltFrame.size,
      meltFrameMimeType: meltFrame.mimeType,
      glbSuggestedName: glb.download,
      glbBytes: glb.size,
      ...exportReport,
      browserReload: browserReloadReport,
    });
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
