import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const extracts = path.join(root, "src/components/_extracts");

function readFrag(name) {
  return fs.readFileSync(path.join(extracts, name), "utf8");
}

// ---- PhotoPipeline ----
{
  const body = readFrag("photo.jsxfrag");
  const content = `import React from "react";
import { Upload, Sparkles, RefreshCw, User, Sliders } from "lucide-react";
import { AvatarConfig } from "../types";

export interface PhotoPipelineProps {
  characterName: string;
  setCharacterName: (name: string) => void;
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  sourceImage: string | null;
  faceBox: [number, number, number, number] | null;
  setFaceBox: React.Dispatch<React.SetStateAction<[number, number, number, number] | null>>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  isDraggingFile: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBuildAvatar: () => void;
  isProcessing: boolean;
  updateFaceTexture: () => void;
  faceCanvas: HTMLCanvasElement | null;
}

export default function PhotoPipeline({
  characterName,
  setCharacterName,
  config,
  setConfig,
  sourceImage,
  faceBox,
  setFaceBox,
  imageRef,
  isDraggingFile,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileChange,
  handleBuildAvatar,
  isProcessing,
  updateFaceTexture,
  faceCanvas,
}: PhotoPipelineProps) {
  return (
    <>
${body}
    </>
  );
}
`;
  fs.writeFileSync(path.join(root, "src/components/PhotoPipeline.tsx"), content);
  console.log("PhotoPipeline.tsx");
}

// ---- AvatarEditor ----
{
  const body = readFrag("editor.jsxfrag");
  const content = `import React from "react";
import {
  Palette,
  Settings,
  Layers,
  ListFilter,
  Flame,
} from "lucide-react";
import { AvatarConfig } from "../types";
import { COLOR_PALETTES, CREATURE_VARIANTS } from "../constants/presets";
import genieMascotIcon from "../assets/genie-mascot.png";

export interface AvatarEditorProps {
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  editorTab: "parts" | "transforms" | "materials" | "scene" | "camera";
  handleTabSelection: (tab: "parts" | "transforms" | "materials" | "scene" | "camera") => void;
  handleResetDefaults: () => void;
  handleTakeSnap: () => void;
}

export default function AvatarEditor({
  config,
  setConfig,
  editorTab,
  handleTabSelection,
  handleResetDefaults,
  handleTakeSnap,
}: AvatarEditorProps) {
  return (
${body}
  );
}
`;
  fs.writeFileSync(path.join(root, "src/components/AvatarEditor.tsx"), content);
  console.log("AvatarEditor.tsx");
}

// ---- ExportPanel ----
{
  const body = readFrag("exportPanel.jsxfrag");
  const content = `import React from "react";
import { Download } from "lucide-react";

export interface ExportPanelProps {
  isSuccess: boolean;
  faceCanvas: HTMLCanvasElement | null;
  handleDownloadGLB: () => void;
  handleDownloadTexture: () => void;
}

export default function ExportPanel({
  isSuccess,
  faceCanvas,
  handleDownloadGLB,
  handleDownloadTexture,
}: ExportPanelProps) {
  return (
${body}
  );
}
`;
  fs.writeFileSync(path.join(root, "src/components/ExportPanel.tsx"), content);
  console.log("ExportPanel.tsx");
}

// ---- MutationLab ----
{
  const body = readFrag("mutationLab.jsxfrag");
  const content = `import React from "react";
import { Sparkles, Sliders } from "lucide-react";
import { AvatarConfig } from "../types";
import { MutationSummary } from "../types/mutation";
import { playSynthSound } from "../utils/playSynthSound";
import { LogEntry } from "../types";

export interface MutationLabProps {
  config: AvatarConfig;
  chaosIntensity: number;
  setChaosIntensity: (v: number) => void;
  autoMutationActive: boolean;
  setAutoMutationActive: React.Dispatch<React.SetStateAction<boolean>>;
  lastMutationSummary: MutationSummary | null;
  handleChaosMutation: () => void;
  setShowMutationFlow: (v: boolean) => void;
  setBounceTime: (v: number) => void;
  addLog: (text: string, type?: LogEntry["type"]) => void;
}

export default function MutationLab({
  config,
  chaosIntensity,
  setChaosIntensity,
  autoMutationActive,
  setAutoMutationActive,
  lastMutationSummary,
  handleChaosMutation,
  setShowMutationFlow,
  setBounceTime,
  addLog,
}: MutationLabProps) {
  return (
${body}
  );
}
`;
  fs.writeFileSync(path.join(root, "src/components/MutationLab.tsx"), content);
  console.log("MutationLab.tsx");
}

// ---- SpecimenVault ----
{
  const body = readFrag("specimenVault.jsxfrag");
  const content = `import React from "react";
import { AvatarConfig } from "../types";
import { MutantSpecimen } from "../types/mutation";
import { playSynthSound } from "../utils/playSynthSound";
import { LogEntry } from "../types";

export interface SpecimenVaultProps {
  mutationVault: MutantSpecimen[];
  setMutationVault: React.Dispatch<React.SetStateAction<MutantSpecimen[]>>;
  splicerParents: string[];
  setSplicerParents: React.Dispatch<React.SetStateAction<string[]>>;
  handleFuseGenomes: () => void;
  toggleParentSelection: (id: string) => void;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  setCharacterName: (name: string) => void;
  addLog: (text: string, type?: LogEntry["type"]) => void;
}

export default function SpecimenVault({
  mutationVault,
  setMutationVault,
  splicerParents,
  setSplicerParents,
  handleFuseGenomes,
  toggleParentSelection,
  setConfig,
  setCharacterName,
  addLog,
}: SpecimenVaultProps) {
  return (
${body}
  );
}
`;
  fs.writeFileSync(path.join(root, "src/components/SpecimenVault.tsx"), content);
  console.log("SpecimenVault.tsx");
}

console.log("wrap done");
