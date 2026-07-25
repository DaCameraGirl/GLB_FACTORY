import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const appPath = path.join(root, "src/App.tsx");
let lines = fs.readFileSync(appPath, "utf8").split(/\r?\n/);

// Helper: replace inclusive 1-based line range with new lines array
function replaceRange(start, end, replacementLines) {
  lines = [...lines.slice(0, start - 1), ...replacementLines, ...lines.slice(end)];
}

// 1) Replace header imports + remove presets/synth (lines 1-461) with new imports
// Keep export default function App start at old 463
const newHeader = `import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  Trophy,
  Cpu,
  Gamepad2,
  Volume2,
  Layers,
  Flame,
} from "lucide-react";
import { AvatarConfig, DetectionResult, LogEntry, HairStyle } from "./types";
import { StudioMode } from "./types/mutation";
import ThreeCanvas from "./components/ThreeCanvas";
import StudioLogs from "./components/StudioLogs";
import MutationFlow from "./components/MutationFlow";
import ModeSelect from "./components/ModeSelect";
import PhotoPipeline from "./components/PhotoPipeline";
import AvatarEditor from "./components/AvatarEditor";
import MutationLab from "./components/MutationLab";
import SpecimenVault from "./components/SpecimenVault";
import Guidebook, { WikiTab } from "./components/Guidebook";
import ExportPanel from "./components/ExportPanel";
import { prepareFaceTexture } from "./utils/texturePreparer";
import { playSynthSound } from "./utils/playSynthSound";
import { PRESET_HEROES, PresetHero } from "./constants/presets";
import { useMutationEngine } from "./hooks/useMutationEngine";
import { useAvatarExport } from "./hooks/useAvatarExport";
import genieMascotIcon from "./assets/genie-mascot.png";
import * as THREE from "three";

// Re-export for any external importers that used App's synth helper
export { playSynthSound } from "./utils/playSynthSound";

export default function App() {`.split("\n");

// Find line with "export default function App"
const appStartIdx = lines.findIndex((l) => l.includes("export default function App"));
if (appStartIdx < 0) throw new Error("App start not found");
// Replace from line 1 through appStartIdx+1 (the opening brace line)
replaceRange(1, appStartIdx + 1, newHeader);

// 2) After App opens, inject studioMode state near top of state block.
// Find "Pipeline steps status"
const pipeIdx = lines.findIndex((l) => l.includes("Pipeline steps status"));
if (pipeIdx >= 0) {
  lines.splice(
    pipeIdx,
    0,
    `  // Product mode: landing select vs Create From Photo vs Mutation Lab`,
    `  const [studioMode, setStudioMode] = useState<StudioMode>("select");`,
    ``
  );
}

// 3) Remove mutation state block and replace with hook usage later.
// Find "// Irresistible Chaos Mutation states"
const mutStateStart = lines.findIndex((l) => l.includes("Irresistible Chaos Mutation states"));
const mutStateEnd = lines.findIndex((l, i) => i > mutStateStart && l.includes("Refs for Image element"));
if (mutStateStart < 0 || mutStateEnd < 0) throw new Error("mutation state block not found");

const mutationHookPlaceholder = [
  `  // Mutation engine (vault, chaos, breeding) — see hooks/useMutationEngine`,
  `  // Placeholder markers replaced after avatar/config state exists`,
  `  const __MUTATION_HOOK_PLACEHOLDER__ = true;`,
  ``,
];
replaceRange(mutStateStart + 1, mutStateEnd, mutationHookPlaceholder);

// 4) Remove calculateSlotMachineRarity through toggleParentSelection
const rarityStart = lines.findIndex((l) => l.includes("Slot Machine Probabilistic Rarity Engine"));
const textureStart = lines.findIndex((l) => l.includes("// 3. Texture computation"));
if (rarityStart < 0 || textureStart < 0) throw new Error("handlers block not found");

// Keep handleTabSelection - it's between rarity and guided mutation.
// Structure was:
// calculateSlotMachineRarity
// handleTabSelection  
// handleApplyGuidedMutation
// handleChaosMutation
// handleFuseGenomes
// toggleParentSelection
// // 3. Texture computation

const tabSelStart = lines.findIndex((l) => l.includes("Tab Selection with smooth scrolling"));
if (tabSelStart < 0) throw new Error("tab selection not found");

// Remove rarity engine only (until Tab Selection)
replaceRange(rarityStart + 1, tabSelStart, []);

// Re-find after previous edits
const applyGuided = lines.findIndex((l) => l.includes("const handleApplyGuidedMutation"));
const texComp = lines.findIndex((l) => l.includes("// 3. Texture computation"));
if (applyGuided < 0 || texComp < 0) throw new Error("guided/texture markers lost");
replaceRange(applyGuided + 1, texComp, [
  `  // Mutation handlers live in useMutationEngine (wired below after config state)`,
  ``,
]);

// 5) Remove handleDownloadGLB and handleDownloadTexture - replace with hook call later
const dlGlb = lines.findIndex((l) => l.includes("// 6. Download GLB"));
const cycleBright = lines.findIndex((l) => l.includes("const handleCycleBrightness"));
if (dlGlb >= 0 && cycleBright >= 0) {
  replaceRange(dlGlb + 1, cycleBright, [
    `  // Export handlers from useAvatarExport (wired below)`,
    ``,
  ]);
}

// 6) Remove localStorage save for vault (now in hook)
const vaultSave = lines.findIndex((l) => l.includes("Save mutationVault entries to localStorage"));
if (vaultSave >= 0) {
  // remove until next useEffect or "// 4. File"
  let end = vaultSave + 1;
  while (end < lines.length && !lines[end].includes("// 4. File upload")) end++;
  replaceRange(vaultSave + 1, end, []);
}

// 7) Remove auto-mutation effect that calls handleChaosMutation - will re-add after hook
const autoMut = lines.findIndex((l) => l.includes("Auto-Mutation Chrono-Loop interval trigger"));
if (autoMut >= 0) {
  let end = autoMut + 1;
  while (end < lines.length && !lines[end].includes("useEffect(() => {") && !lines[end].includes("// 4. File") && !lines[end].includes("Save mutationVault")) {
    // find closing of this useEffect - look for }, [autoMutationActive
    end++;
    if (lines[end]?.includes("autoMutationActive, chaosIntensity")) {
      end += 2; // include closing });
      break;
    }
    if (end > autoMut + 30) break;
  }
  // safer: find from autoMut to line with "}, [autoMutationActive, chaosIntensity]);"
  const endLine = lines.findIndex(
    (l, i) => i > autoMut && l.includes("[autoMutationActive, chaosIntensity]")
  );
  if (endLine >= 0) {
    replaceRange(autoMut + 1, endLine + 2, [
      `  // Auto-mutation loop re-attached after mutation hook wire-up`,
      ``,
    ]);
  }
}

// 8) Wire hooks after addLog and config exist.
// Find addLog function end, then after config/characterName are defined inject hook.
// Better: replace the placeholder.
const ph = lines.findIndex((l) => l.includes("__MUTATION_HOOK_PLACEHOLDER__"));
if (ph < 0) throw new Error("placeholder missing");

// We need hooks AFTER config, setConfig, characterName, addLog, faceCanvas, avatarGroupRef exist.
// So remove placeholder here and inject after addLog definition.
replaceRange(ph + 1, ph + 2, []); // remove placeholder line only, keep comments? 

// Find "const addLog ="
const addLogIdx = lines.findIndex((l) => l.includes("const addLog = "));
// Find end of addLog - next non-empty after closing };
let addLogEnd = addLogIdx;
for (let i = addLogIdx; i < addLogIdx + 20; i++) {
  if (lines[i]?.trim() === "};") {
    addLogEnd = i;
    break;
  }
}

const hookWire = [
  ``,
  `  const {`,
  `    chaosIntensity,`,
  `    setChaosIntensity,`,
  `    autoMutationActive,`,
  `    setAutoMutationActive,`,
  `    showMutationFlow,`,
  `    setShowMutationFlow,`,
  `    lastMutationSummary,`,
  `    mutationVault,`,
  `    setMutationVault,`,
  `    splicerParents,`,
  `    setSplicerParents,`,
  `    handleApplyGuidedMutation,`,
  `    handleChaosMutation,`,
  `    handleFuseGenomes,`,
  `    toggleParentSelection,`,
  `  } = useMutationEngine(config, setConfig, setCharacterName, addLog);`,
  ``,
  `  const { handleDownloadGLB, handleDownloadTexture } = useAvatarExport(`,
  `    avatarGroupRef,`,
  `    faceCanvas,`,
  `    characterName,`,
  `    addLog`,
  `  );`,
  ``,
  `  // Auto-Mutation Chrono-Loop`,
  `  useEffect(() => {`,
  `    if (!autoMutationActive) return;`,
  `    handleChaosMutation();`,
  `    const interval = setInterval(() => {`,
  `      handleChaosMutation();`,
  `    }, 2200);`,
  `    return () => clearInterval(interval);`,
  `  }, [autoMutationActive, chaosIntensity, handleChaosMutation]);`,
  ``,
];

// Problem: faceCanvas and avatarGroupRef may be declared AFTER addLog currently.
// Original order: config, faceCanvas, logs, addLog, mutation state, refs, addLog...
// Looking at original:
// config state
// bounceTime, faceBox, faceCanvas, logs, autoRotate, mutation..., refs, addLog

// So addLog is AFTER faceCanvas and avatarGroupRef. Good - inject after addLog.

replaceRange(addLogEnd + 2, addLogEnd + 1, hookWire); // insert after addLogEnd+1 by replacing empty

// Fix: replaceRange with start > end won't work. Use splice.
// Re-read addLogEnd after previous ops
const addLogIdx2 = lines.findIndex((l) => l.includes("const addLog = "));
let addLogEnd2 = addLogIdx2;
for (let i = addLogIdx2; i < addLogIdx2 + 20; i++) {
  if (lines[i]?.trim() === "};") {
    addLogEnd2 = i;
    break;
  }
}
// Check if hooks already inserted
if (!lines.some((l) => l.includes("useMutationEngine(config"))) {
  lines.splice(addLogEnd2 + 1, 0, ...hookWire);
}

// Remove leftover placeholder comments if any
lines = lines.filter(
  (l) =>
    !l.includes("__MUTATION_HOOK_PLACEHOLDER__") &&
    !l.includes("Placeholder markers replaced")
);

// 9) Fix wikiTab type to WikiTab
lines = lines.map((l) =>
  l.includes('useState<"quickstart" | "texturing" | "rigging" | "shading" | "export">')
    ? l.replace(
        'useState<"quickstart" | "texturing" | "rigging" | "shading" | "export">("quickstart")',
        'useState<WikiTab>("quickstart")'
      )
    : l
);

// 10) JSX replacements — work from bottom to top so line numbers remain valid for earlier sections

function findLine(substr, from = 0) {
  return lines.findIndex((l, i) => i >= from && l.includes(substr));
}

// Guidebook section
{
  const start = findLine('id="documentation-section"');
  // section starts a few lines before with comment
  let s = start;
  while (s > 0 && !lines[s].includes("Studio guidebook")) s--;
  const end = findLine("</section>", start);
  // need the documentation section's closing - first </section> after start might be wrong if nested
  // Original guidebook has one outer section - find matching by walking
  let depth = 0;
  let e = start;
  for (; e < lines.length; e++) {
    if (lines[e].includes("<section")) depth++;
    if (lines[e].includes("</section>")) {
      depth--;
      if (depth === 0) break;
    }
  }
  replaceRange(s + 1, e + 1, [
    `        <Guidebook wikiTab={wikiTab} setWikiTab={setWikiTab} />`,
  ]);
}

// Specimen vault
{
  const start = findLine('id="genotype-crypt-panel"');
  let s = start;
  while (s > 0 && !lines[s].includes("GENOTYPE CRYPT")) s--;
  let depth = 0;
  let e = start;
  for (; e < lines.length; e++) {
    if (lines[e].includes("<section")) depth++;
    if (lines[e].includes("</section>")) {
      depth--;
      if (depth === 0) break;
    }
  }
  replaceRange(s + 1, e + 1, [
    `            <SpecimenVault`,
    `              mutationVault={mutationVault}`,
    `              setMutationVault={setMutationVault}`,
    `              splicerParents={splicerParents}`,
    `              setSplicerParents={setSplicerParents}`,
    `              handleFuseGenomes={handleFuseGenomes}`,
    `              toggleParentSelection={toggleParentSelection}`,
    `              setConfig={setConfig}`,
    `              setCharacterName={setCharacterName}`,
    `              addLog={addLog}`,
    `            />`,
  ]);
}

// Mutation lab
{
  const start = findLine('id="interactive-qa-panel"');
  let s = start;
  while (s > 0 && !lines[s].includes("INTERACTIVE RIG QA")) s--;
  let depth = 0;
  let e = start;
  for (; e < lines.length; e++) {
    if (lines[e].includes("<section")) depth++;
    if (lines[e].includes("</section>")) {
      depth--;
      if (depth === 0) break;
    }
  }
  replaceRange(s + 1, e + 1, [
    `            <MutationLab`,
    `              config={config}`,
    `              chaosIntensity={chaosIntensity}`,
    `              setChaosIntensity={setChaosIntensity}`,
    `              autoMutationActive={autoMutationActive}`,
    `              setAutoMutationActive={setAutoMutationActive}`,
    `              lastMutationSummary={lastMutationSummary}`,
    `              handleChaosMutation={handleChaosMutation}`,
    `              setShowMutationFlow={setShowMutationFlow}`,
    `              setBounceTime={setBounceTime}`,
    `              addLog={addLog}`,
    `            />`,
  ]);
}

// Export panel
{
  const start = findLine('id="export-actions-panel"');
  let s = start;
  while (s > 0 && !lines[s].includes("ACTION EXPORTS PANEL")) s--;
  // ends at closing </div> of export-actions-panel - the grid itself
  // find matching from the grid div
  let depth = 0;
  let e = start;
  for (; e < lines.length; e++) {
    const open = (lines[e].match(/<div/g) || []).length;
    const close = (lines[e].match(/<\/div>/g) || []).length;
    depth += open - close;
    if (e > start && depth <= 0) break;
  }
  replaceRange(s + 1, e + 1, [
    `              <ExportPanel`,
    `                isSuccess={isSuccess}`,
    `                faceCanvas={faceCanvas}`,
    `                handleDownloadGLB={handleDownloadGLB}`,
    `                handleDownloadTexture={handleDownloadTexture}`,
    `              />`,
  ]);
}

// Avatar editor customization panel
{
  const start = findLine('id="customization-panel"');
  let s = start;
  while (s > 0 && !lines[s].includes("AVATAR STYLE CUSTOMIZATION")) s--;
  let depth = 0;
  let e = start;
  for (; e < lines.length; e++) {
    if (lines[e].includes("<section")) depth++;
    if (lines[e].includes("</section>")) {
      depth--;
      if (depth === 0) break;
    }
  }
  replaceRange(s + 1, e + 1, [
    `            <AvatarEditor`,
    `              config={config}`,
    `              setConfig={setConfig}`,
    `              editorTab={editorTab}`,
    `              handleTabSelection={handleTabSelection}`,
    `              handleResetDefaults={handleResetDefaults}`,
    `              handleTakeSnap={handleTakeSnap}`,
    `            />`,
  ]);
}

// Photo pipeline: upload-panel through crop-tuning-panel (before meltdown)
{
  const start = findLine('id="upload-panel"');
  let s = start;
  while (s > 0 && !lines[s].includes("CHARACTER IDENTITY")) s--;
  // crop panel ends before meltdown
  const melt = findLine('id="meltdown-factory-panel"', start);
  // walk back to end of crop section
  let e = melt - 1;
  while (e > start && lines[e].trim() === "") e--;
  // e should be on </section> of crop
  replaceRange(s + 1, e + 1, [
    `            <PhotoPipeline`,
    `              characterName={characterName}`,
    `              setCharacterName={setCharacterName}`,
    `              config={config}`,
    `              setConfig={setConfig}`,
    `              sourceImage={sourceImage}`,
    `              faceBox={faceBox}`,
    `              setFaceBox={setFaceBox}`,
    `              imageRef={imageRef}`,
    `              isDraggingFile={isDraggingFile}`,
    `              handleDragOver={handleDragOver}`,
    `              handleDragLeave={handleDragLeave}`,
    `              handleDrop={handleDrop}`,
    `              handleFileChange={handleFileChange}`,
    `              handleBuildAvatar={handleBuildAvatar}`,
    `              isProcessing={isProcessing}`,
    `              updateFaceTexture={updateFaceTexture}`,
    `              faceCanvas={faceCanvas}`,
    `            />`,
  ]);
}

// 11) Header title + mode switcher
{
  const h1 = findLine("Photo-to-GLB-Auto");
  if (h1 >= 0) {
    lines[h1] = lines[h1].replace("Photo-to-GLB-Auto", "GLB Factory");
  }
}

// Inject mode switch + ModeSelect after pipeline status bar
{
  const pipeBar = findLine('id="pipeline-status-bar"');
  if (pipeBar >= 0) {
    // close of pipeline status is first </div> that closes the grid - find after pipeBar
    let depth = 0;
    let e = pipeBar;
    for (; e < lines.length; e++) {
      const open = (lines[e].match(/<div/g) || []).length;
      const close = (lines[e].match(/<\/div>/g) || []).length;
      depth += open - close;
      if (e > pipeBar && depth <= 0) break;
    }
    // Insert mode chrome after pipeline bar
    const chrome = [
      ``,
      `        {/* Mode switcher — always visible once a mode is chosen */}`,
      `        {studioMode !== "select" && (`,
      `          <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-[#141414] bg-white/60 p-2 font-mono text-[10px] uppercase font-bold" id="mode-switcher-bar">`,
      `            <div className="flex items-center gap-2">`,
      `              <span className="bg-[#141414] text-white px-2 py-1">`,
      `                Mode: {studioMode === "create" ? "Create From Photo" : "Mutation Lab"}`,
      `              </span>`,
      `              <button`,
      `                type="button"`,
      `                onClick={() => setStudioMode("select")}`,
      `                className="border border-[#141414] px-2 py-1 hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"`,
      `              >`,
      `                Change mode`,
      `              </button>`,
      `            </div>`,
      `            <div className="flex gap-2">`,
      `              <button`,
      `                type="button"`,
      `                onClick={() => setStudioMode("create")}`,
      `                className={\`border border-[#141414] px-2 py-1 cursor-pointer \${studioMode === "create" ? "bg-sky-200" : "bg-white hover:bg-sky-50"}\`}`,
      `              >`,
      `                Create From Photo`,
      `              </button>`,
      `              <button`,
      `                type="button"`,
      `                onClick={() => setStudioMode("mutate")}`,
      `                className={\`border border-[#141414] px-2 py-1 cursor-pointer \${studioMode === "mutate" ? "bg-emerald-200" : "bg-white hover:bg-emerald-50"}\`}`,
      `              >`,
      `                Mutation Lab`,
      `              </button>`,
      `            </div>`,
      `          </div>`,
      `        )}`,
      ``,
      `        {studioMode === "select" && (`,
      `          <ModeSelect onSelect={(mode) => setStudioMode(mode)} />`,
      `        )}`,
      ``,
    ];
    lines.splice(e + 1, 0, ...chrome);
  }
}

// Wrap main studio grid when mode is not select - find hero gallery and wrap through logs?
// Simpler: hide hero + grid when select mode via conditional
{
  const hero = findLine("PREMIUM ENTERPRISE HERO GALLERY");
  if (hero >= 0) {
    // find start of section comment
    let s = hero;
    while (s > 0 && !lines[s].includes("========")) s--;
    lines.splice(s, 0, `        {studioMode !== "select" && (`, `        <>`);
  }
  // before Guidebook, close the fragment - Guidebook should show always or only in mode?
  // Show guidebook always is fine. Close before Guidebook.
  const gb = findLine("<Guidebook");
  if (gb >= 0) {
    lines.splice(gb, 0, `        </>`, `        )}`);
  }
}

// Mode-specific visibility for photo vs mutation panels via comments - optional
// When mutate mode: still show editor/viewport but photo optional. Keep all panels for now once mode entered.

// Footer copy
lines = lines.map((l) =>
  l.includes("Photo to GLB Studio")
    ? l.replace("Photo to GLB Studio", "GLB Factory")
    : l
);

// Remove stale "Mutation handlers live" comment noise if handleTabSelection left orphaned wrongly
// Ensure handleTabSelection still exists
if (!lines.some((l) => l.includes("const handleTabSelection"))) {
  console.warn("WARN: handleTabSelection missing — reinserting");
  const hookLine = lines.findIndex((l) => l.includes("useMutationEngine"));
  lines.splice(
    hookLine,
    0,
    `  const handleTabSelection = (tab: "parts" | "transforms" | "materials" | "scene" | "camera") => {`,
    `    setEditorTab(tab);`,
    `  };`,
    ``
  );
}

fs.writeFileSync(appPath, lines.join("\n"));
console.log("App.tsx rewritten. lines:", lines.length);
