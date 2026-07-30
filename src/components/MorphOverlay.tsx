import React, { useEffect, useState } from "react";
import { Boxes, Download, Palette, ScanFace, Sparkles } from "lucide-react";
import glbLogo from "../assets/glb-logo.png";

const STAGES = [
  { label: "Scanning portrait", detail: "Face box · landmarks · crop", Icon: ScanFace, color: "#22d3ee" },
  { label: "Harvesting palette", detail: "Skin · hair · clothing colors", Icon: Palette, color: "#a855f7" },
  { label: "Building mesh", detail: "Procedural body · head · limbs", Icon: Boxes, color: "#84cc16" },
  { label: "Mapping face texture", detail: "Photo → UV · feather blend", Icon: Sparkles, color: "#f472b6" },
  { label: "Locking export-ready GLB", detail: "Materials · hierarchy · pose", Icon: Download, color: "#fbbf24" },
] as const;

interface MorphOverlayProps {
  active: boolean;
  characterName?: string;
}

/**
 * Full-screen “photo → 3D morph” theater while the avatar builds.
 * Makes the pipeline feel physical for demos / challenge judges.
 */
export default function MorphOverlay({ active, characterName }: MorphOverlayProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    setStep(0);
    const id = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, STAGES.length - 1));
    }, 700);
    return () => window.clearInterval(id);
  }, [active]);

  if (!active) return null;

  const stage = STAGES[step];
  const Icon = stage.Icon;

  return (
    <div className="morph-overlay" id="photo-to-3d-morph-overlay" role="status" aria-live="polite">
      <div className="morph-overlay-card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <img src={glbLogo} alt="" className="w-10 h-10 border border-lime-400/50 object-cover" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">
                Photo → 3D morph
              </p>
              <p className="text-[9px] text-white/55 uppercase">
                {characterName?.trim() || "Untitled"} // factory line
              </p>
            </div>
          </div>
          <span className="text-[9px] font-bold uppercase px-2 py-1 border border-fuchsia-400/50 text-fuchsia-200 bg-fuchsia-500/20">
            Live
          </span>
        </div>

        <div
          className="flex items-center gap-3 border-2 p-3 mb-4 transition-colors duration-300"
          style={{ borderColor: stage.color, background: `${stage.color}18` }}
        >
          <div
            className="w-12 h-12 flex items-center justify-center border-2 shrink-0"
            style={{ borderColor: stage.color, color: stage.color }}
          >
            <Icon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-wide" style={{ color: stage.color }}>
              {stage.label}
            </p>
            <p className="text-[10px] text-white/65 normal-case">{stage.detail}</p>
          </div>
        </div>

        <ol className="space-y-1.5 mb-2">
          {STAGES.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li
                key={s.label}
                className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-wide ${
                  current ? "text-white" : done ? "text-white/70" : "text-white/30"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: current || done ? s.color : "rgba(255,255,255,0.2)",
                    boxShadow: current ? `0 0 8px ${s.color}` : undefined,
                  }}
                />
                {s.label}
              </li>
            );
          })}
        </ol>

        <div className="morph-overlay-bar" aria-hidden>
          <span />
        </div>
        <p className="mt-3 text-center text-[9px] text-white/45 uppercase tracking-wider">
          Mapping portrait energy onto a poseable mesh…
        </p>
      </div>
    </div>
  );
}
