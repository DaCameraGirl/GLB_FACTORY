import {
  Camera,
  Cpu,
  Grid3X3,
  Image as ImageIcon,
  Layers3,
  ScanSearch,
  Sparkles,
  SunMedium,
} from "lucide-react";
import { AvatarConfig } from "../types";
import { SceneInspectionStats } from "../utils/sceneInspector";

interface ViewportTelemetryPanelProps {
  stats: SceneInspectionStats | null;
  config: AvatarConfig;
  brightnessLevel: "standard" | "low" | "high" | "overdrive";
  hasSourceImage: boolean;
  hasFaceTexture: boolean;
  onSetCameraPreset: (preset: NonNullable<AvatarConfig["cameraPreset"]>) => void;
  onToggleGrid: () => void;
  onCycleBrightness: () => void;
  onTakeSnap: () => void;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function estimateRigIntegrity(config: AvatarConfig) {
  const values = [
    config.headScaleX ?? 1,
    config.headScaleY ?? 1,
    config.headScaleZ ?? 1,
    config.torsoScaleX ?? 1,
    config.torsoScaleY ?? 1,
    config.torsoScaleZ ?? 1,
    config.armScaleX ?? 1,
    config.armScaleY ?? 1,
    config.armScaleZ ?? 1,
    config.legScaleX ?? 1,
    config.legScaleY ?? 1,
    config.legScaleZ ?? 1,
  ];

  const distortion = values.reduce((sum, value) => sum + Math.abs(1 - value), 0);
  return Math.max(58, Math.min(100, Math.round(100 - distortion * 26)));
}

export default function ViewportTelemetryPanel({
  stats,
  config,
  brightnessLevel,
  hasSourceImage,
  hasFaceTexture,
  onSetCameraPreset,
  onToggleGrid,
  onCycleBrightness,
  onTakeSnap,
}: ViewportTelemetryPanelProps) {
  const integrity = estimateRigIntegrity(config);
  const projectionTarget = config.projectionTarget || "face-only";
  const detailLabel = config.detailLevel.toUpperCase();
  const quickMetrics = [
    { label: "Triangles", value: stats ? formatCompact(stats.triangles) : "--" },
    { label: "Vertices", value: stats ? formatCompact(stats.vertices) : "--" },
    { label: "Meshes", value: stats ? String(stats.meshes) : "--" },
    { label: "Materials", value: stats ? String(stats.materials) : "--" },
    { label: "Skinned Limbs", value: stats ? String(stats.skinnedMeshes) : "--" },
    { label: "Bones", value: stats ? String(stats.bones) : "--" },
    { label: "Projected Meshes", value: stats ? String(stats.projectedMeshes) : "--" },
    { label: "Melt Shaders", value: stats ? String(stats.meltMaterials) : "--" },
  ];

  const cameraButtons: Array<{ id: NonNullable<AvatarConfig["cameraPreset"]>; label: string }> = [
    { id: "front", label: "Front" },
    { id: "side", label: "Side" },
    { id: "top", label: "Top" },
    { id: "isometric", label: "Iso" },
  ];

  const pipelineBadges = [
    `HEAD ${config.headShape.toUpperCase()}`,
    `BODY ${config.bodyType.toUpperCase()}`,
    `LOD ${detailLabel}`,
    `PROJECTION ${projectionTarget.toUpperCase()}`,
    `MELT ${config.previewMelt ? "LIVE" : "FROZEN"}`,
    `GRID ${config.showGrid !== false ? "ON" : "OFF"}`,
  ];

  return (
    <section className="bg-white/40 border-2 border-[#141414] rounded-none p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]" id="telemetry-panel">
      <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-[#D4D3D0] flex items-center justify-between gap-3">
        <h2 className="font-serif text-[11px] italic text-[#141414]/80 uppercase font-bold tracking-wider flex items-center gap-2">
          <ScanSearch className="w-3.5 h-3.5" />
          <span>06 // Live Inspection Telemetry</span>
        </h2>
        <div className="font-mono text-[8px] bg-emerald-500 text-[#141414] px-2 py-0.5 uppercase font-bold tracking-widest">
          {stats?.atlasReady ? "ATLAS PIPELINE LIVE" : "SCENE ANALYZING"}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-mono">
        {quickMetrics.map((metric) => (
          <div key={metric.label} className="bg-white/60 border border-[#141414]/15 p-2 shadow-[1px_1px_0px_0px_rgba(20,20,20,0.05)]">
            <div className="text-[8px] uppercase font-bold text-[#141414]/60">{metric.label}</div>
            <div className="mt-1 text-[14px] font-black text-[#141414]">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="space-y-3">
          <div className="bg-white/55 border border-[#141414]/15 p-3 shadow-[1px_1px_0px_0px_rgba(20,20,20,0.05)]">
            <div className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-wider text-[#141414]/75">
              <Layers3 className="w-3 h-3" />
              <span>Pipeline State</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {pipelineBadges.map((badge) => (
                <span key={badge} className="border border-[#141414] bg-white px-2 py-1 text-[9px] font-bold shadow-[1px_1px_0px_0px_rgba(20,20,20,0.08)]">
                  {badge}
                </span>
              ))}
            </div>
            <div className="mt-3 text-[9px] leading-relaxed text-[#141414]/70">
              Atlas regions:
              {" "}
              <span className="font-bold text-[#141414]">
                {stats?.projectedRegions.length ? stats.projectedRegions.join(", ").toUpperCase() : "HEAD, TORSO, LIMBS PREPENDING"}
              </span>
            </div>
          </div>

          <div className="bg-white/55 border border-[#141414]/15 p-3 shadow-[1px_1px_0px_0px_rgba(20,20,20,0.05)] space-y-3">
            <div className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-wider text-[#141414]/75">
              <Camera className="w-3 h-3" />
              <span>Viewport Quick Controls</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {cameraButtons.map((button) => (
                <button
                  key={button.id}
                  type="button"
                  onClick={() => onSetCameraPreset(button.id)}
                  className={`border-2 py-1.5 text-[9px] font-bold uppercase transition-all cursor-pointer ${
                    (config.cameraPreset || "front") === button.id
                      ? "bg-[#141414] text-white border-[#141414] shadow-[1px_1px_0px_0px_#141414]"
                      : "bg-white text-[#141414] border-[#141414] hover:bg-[#f4f4f0] shadow-[2px_2px_0px_0px_#141414] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#141414]"
                  }`}
                >
                  {button.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={onToggleGrid}
                className="border-2 border-[#141414] bg-white text-[#141414] hover:bg-[#f4f4f0] text-[9px] font-bold uppercase py-2 shadow-[2px_2px_0px_0px_#141414] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#141414] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Grid3X3 className="w-3 h-3" />
                <span>{config.showGrid !== false ? "Hide Grid" : "Show Grid"}</span>
              </button>
              <button
                type="button"
                onClick={onCycleBrightness}
                className="border-2 border-[#141414] bg-white text-[#141414] hover:bg-[#f4f4f0] text-[9px] font-bold uppercase py-2 shadow-[2px_2px_0px_0px_#141414] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#141414] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <SunMedium className="w-3 h-3" />
                <span>{brightnessLevel}</span>
              </button>
              <button
                type="button"
                onClick={onTakeSnap}
                className="border-2 border-[#141414] bg-[#141414] text-white hover:bg-black text-[9px] font-bold uppercase py-2 shadow-[2px_2px_0px_0px_#141414] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#141414] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ImageIcon className="w-3 h-3" />
                <span>Snap PNG</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white/55 border border-[#141414]/15 p-3 shadow-[1px_1px_0px_0px_rgba(20,20,20,0.05)]">
            <div className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-wider text-[#141414]/75">
              <Cpu className="w-3 h-3" />
              <span>Structural Integrity</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
              <span>Rig Stability</span>
              <span className={integrity >= 90 ? "text-emerald-600" : integrity >= 75 ? "text-amber-600" : "text-rose-600"}>
                {integrity}% {integrity >= 90 ? "PASS" : integrity >= 75 ? "TUNED" : "STRESSED"}
              </span>
            </div>
            <div className="mt-2 h-2 w-full bg-[#141414]/10 border border-[#141414]">
              <div
                className={`h-full ${integrity >= 90 ? "bg-emerald-500" : integrity >= 75 ? "bg-amber-500" : "bg-rose-500"}`}
                style={{ width: `${integrity}%` }}
              />
            </div>
            <p className="mt-2 text-[8.5px] leading-relaxed text-[#141414]/65">
              Computed from current scale offsets across head, torso, arms, and legs. This reflects runtime deformation pressure, not a fake preset score.
            </p>
          </div>

          <div className="bg-white/55 border border-[#141414]/15 p-3 shadow-[1px_1px_0px_0px_rgba(20,20,20,0.05)]">
            <div className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-wider text-[#141414]/75">
              <Sparkles className="w-3 h-3" />
              <span>Image Projection Health</span>
            </div>
            <div className="mt-3 space-y-2 text-[9px]">
              <div className="flex items-center justify-between">
                <span>Source Portrait</span>
                <span className={hasSourceImage ? "text-emerald-600 font-bold" : "text-[#141414]/45"}>{hasSourceImage ? "LINKED" : "NONE"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Face Texture Canvas</span>
                <span className={hasFaceTexture ? "text-emerald-600 font-bold" : "text-[#141414]/45"}>{hasFaceTexture ? "READY" : "IDLE"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Live Atlas</span>
                <span className={stats?.atlasReady ? "text-emerald-600 font-bold" : "text-[#141414]/45"}>{stats?.atlasReady ? "STREAMING" : "OFFLINE"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Preview Melt Shader</span>
                <span className={config.previewMelt ? "text-pink-600 font-bold" : "text-[#141414]/45"}>{config.previewMelt ? "ACTIVE" : "FROZEN"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Opacity / Progress</span>
                <span className="font-bold text-[#141414]">
                  {Math.round((config.projectionOpacity ?? 1) * 100)}% / {Math.round((config.meltProgress ?? 0) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
