import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const lines = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8").split(/\r?\n/);

function extract(start, end) {
  return lines.slice(start - 1, end).join("\n");
}

// --- presets ---
let presetsBody = extract(33, 352);
presetsBody = presetsBody
  .replace("interface PresetHero", "export interface PresetHero")
  .replace("interface CreatureVariantPreset", "export interface CreatureVariantPreset")
  .replace("const CREATURE_VARIANTS", "export const CREATURE_VARIANTS")
  .replace("const PRESET_HEROES", "export const PRESET_HEROES")
  .replace("const COLOR_PALETTES", "export const COLOR_PALETTES");

fs.writeFileSync(
  path.join(root, "src/constants/presets.ts"),
  `import { AvatarConfig, HairStyle, BodyType } from "../types";\n\n${presetsBody}\n`
);
console.log("wrote constants/presets.ts");

// --- JSX extracts (temporary intermediate files) ---
const outDir = path.join(root, "src/components/_extracts");
fs.mkdirSync(outDir, { recursive: true });

const sections = {
  photo: [2233, 2496],
  editor: [2587, 3938],
  exportPanel: [4066, 4096],
  mutationLab: [4286, 4491],
  specimenVault: [4496, 4756],
};

for (const [name, [start, end]] of Object.entries(sections)) {
  const body = extract(start, end);
  fs.writeFileSync(path.join(outDir, `${name}.jsxfrag`), body);
  console.log(`extract ${name}: ${body.split("\n").length} lines`);
}

console.log("done");
