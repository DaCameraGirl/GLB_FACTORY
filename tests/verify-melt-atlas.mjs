import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHAPES = [
  { value: "cube", file: "cube-head.png" },
  { value: "rounded-cube", file: "rounded-head.png" },
  { value: "organic-smooth", file: "organic-head.png" },
  { value: "bean-soft", file: "new-shape-head.png" },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });
  const assetPath = path.join(__dirname, "assets", "melt-test.svg");
  const resultsDir = path.join(__dirname, "..", "test-results");

  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await page.locator('input[type="file"]').setInputFiles(assetPath);
  await page.getByRole("button", { name: /build 3d avatar/i }).click();
  await page.waitForTimeout(1800);

  await page.getByRole("button", { name: /full body/i }).click();
  await page.getByRole("button", { name: /preview melt/i }).click();

  const previewContainer = page.locator("#3d-preview-canvas-container");
  const headShapeSelect = page.locator("#customization-panel select").first();

  for (const shape of SHAPES) {
    await headShapeSelect.selectOption(shape.value);
    await page.waitForTimeout(500);
    await previewContainer.screenshot({ path: path.join(resultsDir, shape.file) });
  }

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export final glb/i }).click();
  const download = await downloadPromise;
  await download.saveAs(path.join(resultsDir, "live-melt-export.glb"));

  await browser.close();
  console.log(`verified:${SHAPES.map((shape) => shape.value).join(",")}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
