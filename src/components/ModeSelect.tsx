import React from "react";
import { Upload, FlaskConical, ArrowRight } from "lucide-react";
import { StudioMode } from "../types/mutation";
import glbBanner from "../assets/glb-banner.png";
import glbLogo from "../assets/glb-logo.png";
import portraitHero from "../assets/creatures/portrait-hero.png";
import creatorHero from "../assets/creatures/creator-hero.png";
import mutationLineup from "../assets/creatures/mutation-lineup.png";
import spec1 from "../assets/creatures/spec-1.png";
import spec2 from "../assets/creatures/spec-2.png";
import spec3 from "../assets/creatures/spec-3.png";
import spec4 from "../assets/creatures/spec-4.png";
import spec5 from "../assets/creatures/spec-5.png";

interface ModeSelectProps {
  onSelect: (mode: Exclude<StudioMode, "select">) => void;
}

const SPECS = [
  { src: spec1, name: "Blob" },
  { src: spec2, name: "Horns" },
  { src: spec3, name: "Robot" },
  { src: spec4, name: "Beast" },
  { src: spec5, name: "Bird" },
];

/**
 * Cinematic factory entry — banner + real art, no sterile white, no grey turntables.
 */
export default function ModeSelect({ onSelect }: ModeSelectProps) {
  return (
    <section
      className="relative overflow-hidden border border-fuchsia-500/40"
      id="mode-select-panel"
      style={{
        boxShadow:
          "0 0 80px rgba(168,85,247,0.35), 0 0 40px rgba(34,211,238,0.15)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 0%, rgba(168,85,247,0.45), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 50%, rgba(34,211,238,0.25), transparent 50%), #05030a",
        }}
      />
      <div className="absolute inset-0 mode-select-grid opacity-30 pointer-events-none" />

      <div className="relative z-10">
        {/* Full-bleed banner — the product */}
        <div className="relative">
          <img
            src={glbBanner}
            alt="GLB_FACTORY — Photo to 3D · Mutate · Customize · Export"
            className="w-full h-auto block"
            id="mode-select-banner"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#05030a] via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-lime-400" />
        </div>

        <div className="px-4 md:px-8 pb-8 pt-5 space-y-6">
          {/* Brand row */}
          <div className="flex flex-wrap items-end justify-between gap-4 mt-4 md:mt-6 relative z-10">
            <div className="flex items-center gap-3">
              <img
                src={glbLogo}
                alt=""
                className="w-16 h-16 md:w-20 md:h-20 border-2 border-lime-400 object-cover shadow-[0_0_30px_rgba(132,204,22,0.6)] bg-black"
              />
              <div>
                <h2 className="font-mono text-2xl md:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                  GLB_FACTORY
                </h2>
                <p className="font-mono text-[11px] md:text-xs text-lime-300 uppercase tracking-[0.2em] font-bold">
                  Photo → 3D character · mutate · export .glb
                </p>
              </div>
            </div>
            <p className="font-mono text-[10px] text-fuchsia-200/80 uppercase tracking-wider max-w-xs text-right hidden sm:block">
              Your portrait becomes a poseable mesh.
              <br />
              Then the lab makes monsters.
            </p>
          </div>

          {/* Specimen wall — banner monsters, not grey floor gifs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
                Mutation lab // specimens
              </p>
              <p className="font-mono text-[9px] text-white/40 uppercase">
                Build · breed · export
              </p>
            </div>
            <div className="grid grid-cols-5 gap-2 md:gap-3">
              {SPECS.map((s) => (
                <div
                  key={s.name}
                  className="relative aspect-square border border-fuchsia-400/50 bg-black overflow-hidden group"
                  style={{ boxShadow: "0 0 20px rgba(168,85,247,0.25)" }}
                >
                  <img
                    src={s.src}
                    alt={s.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1 left-1 right-1 font-mono text-[8px] md:text-[10px] font-bold uppercase text-white/90 tracking-wide">
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Photo → 3D story strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
            <div className="border border-cyan-400/40 bg-black/60 overflow-hidden relative min-h-[140px]">
              <img src={portraitHero} alt="Upload photo" className="w-full h-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-mono text-[9px] font-black text-cyan-300 uppercase tracking-widest">01 · Photo in</p>
                <p className="font-mono text-[10px] text-white/70 normal-case">Face + colors from your portrait</p>
              </div>
            </div>
            <div className="border border-fuchsia-400/40 bg-black/60 overflow-hidden relative min-h-[140px]">
              <img src={creatorHero} alt="Build avatar" className="w-full h-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-mono text-[9px] font-black text-fuchsia-300 uppercase tracking-widest">02 · Morph to mesh</p>
                <p className="font-mono text-[10px] text-white/70 normal-case">Texture mapped · poseable body</p>
              </div>
            </div>
            <div className="border border-lime-400/40 bg-black/60 overflow-hidden relative min-h-[140px]">
              <img src={mutationLineup} alt="Mutation lab monsters" className="w-full h-full object-cover opacity-95" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-mono text-[9px] font-black text-lime-300 uppercase tracking-widest">03 · Mutate & ship</p>
                <p className="font-mono text-[10px] text-white/70 normal-case">Creatures · hybrids · .glb export</p>
              </div>
            </div>
          </div>

          {/* Two mode doors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => onSelect("create")}
              className="group relative text-left border-2 border-cyan-400 overflow-hidden min-h-[200px] cursor-pointer transition-transform hover:translate-y-[-2px]"
              id="mode-create-from-photo"
              style={{ boxShadow: "0 0 40px rgba(34,211,238,0.25), 6px 6px 0 #22d3ee" }}
            >
              <img
                src={creatorHero}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#041018]/95 via-[#041018]/80 to-transparent" />
              <div className="relative p-5 md:p-6 h-full flex flex-col justify-between">
                <div className="w-12 h-12 border-2 border-cyan-300 bg-cyan-500/20 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-cyan-200" />
                </div>
                <div>
                  <h3 className="font-mono text-lg md:text-xl font-black uppercase tracking-wide text-cyan-200">
                    Create From Photo
                  </h3>
                  <p className="mt-1 font-mono text-[11px] text-white/70 normal-case max-w-xs leading-relaxed">
                    Drop a portrait. Face texture + palette land on a 3D body you can customize and export.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] font-black uppercase text-cyan-300">
                    Start morph <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelect("mutate")}
              className="group relative text-left border-2 border-lime-400 overflow-hidden min-h-[200px] cursor-pointer transition-transform hover:translate-y-[-2px]"
              id="mode-mutation-lab"
              style={{ boxShadow: "0 0 40px rgba(132,204,22,0.25), 6px 6px 0 #84cc16" }}
            >
              <img
                src={mutationLineup}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a1408]/95 via-[#0a1408]/75 to-transparent" />
              <div className="relative p-5 md:p-6 h-full flex flex-col justify-between">
                <div className="w-12 h-12 border-2 border-lime-300 bg-lime-500/20 flex items-center justify-center">
                  <FlaskConical className="w-6 h-6 text-lime-200" />
                </div>
                <div>
                  <h3 className="font-mono text-lg md:text-xl font-black uppercase tracking-wide text-lime-200">
                    Mutation Lab
                  </h3>
                  <p className="mt-1 font-mono text-[11px] text-white/70 normal-case max-w-xs leading-relaxed">
                    Spawn rare specimens, chaos DNA, breed hybrids — then export the offspring as GLB.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] font-black uppercase text-lime-300">
                    Enter the tank <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
