import React from "react";
import { Upload, FlaskConical, ArrowRight, Sparkles } from "lucide-react";
import { StudioMode } from "../types/mutation";

interface ModeSelectProps {
  onSelect: (mode: Exclude<StudioMode, "select">) => void;
}

/**
 * First-screen product entry: two connected modes with an obvious starting route.
 */
export default function ModeSelect({ onSelect }: ModeSelectProps) {
  return (
    <section
      className="bg-white/50 border-2 border-[#141414] p-6 md:p-10 shadow-[6px_6px_0px_0px_rgba(20,20,20,0.15)] space-y-8"
      id="mode-select-panel"
    >
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-3 py-1 font-mono text-[10px] uppercase tracking-widest font-bold">
          <Sparkles className="w-3 h-3 text-amber-300" />
          GLB Factory // two studio modes
        </div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#141414] tracking-tight">
          Create from a photo, or mutate a whole lineage.
        </h2>
        <p className="font-mono text-[12px] text-[#141414]/70 leading-relaxed normal-case">
          Pick a route. Everything else — materials, poses, vault, export — unlocks after you start.
          Exports are customizable, poseable GLB characters with PBR materials and an organized mesh hierarchy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button
          type="button"
          onClick={() => onSelect("create")}
          className="group text-left border-2 border-[#141414] bg-white p-6 shadow-[4px_4px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#141414] transition-all cursor-pointer"
          id="mode-create-from-photo"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-12 h-12 border-2 border-[#141414] bg-sky-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-sky-800" />
            </div>
            <ArrowRight className="w-5 h-5 text-[#141414]/40 group-hover:text-[#141414] transition-colors" />
          </div>
          <h3 className="mt-5 font-mono text-sm font-bold uppercase tracking-wider text-[#141414]">
            Create From Photo
          </h3>
          <p className="mt-2 font-mono text-[11px] text-[#141414]/70 leading-relaxed normal-case">
            Upload a portrait → build avatar → customize parts, materials, and pose → export GLB.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["Portrait", "Face texture", "Customize", "Export"].map((step) => (
              <span
                key={step}
                className="text-[9px] font-mono font-bold uppercase bg-[#141414]/5 border border-[#141414]/20 px-2 py-0.5"
              >
                {step}
              </span>
            ))}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect("mutate")}
          className="group text-left border-2 border-[#141414] bg-[#fcfbf9] p-6 shadow-[4px_4px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#141414] transition-all cursor-pointer"
          id="mode-mutation-lab"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-12 h-12 border-2 border-[#141414] bg-emerald-100 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-emerald-800" />
            </div>
            <ArrowRight className="w-5 h-5 text-[#141414]/40 group-hover:text-[#141414] transition-colors" />
          </div>
          <h3 className="mt-5 font-mono text-sm font-bold uppercase tracking-wider text-[#141414]">
            Mutation Lab
          </h3>
          <p className="mt-2 font-mono text-[11px] text-[#141414]/70 leading-relaxed normal-case">
            Generate specimens → collect rare mutations → breed two parents → export offspring.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["Mutate", "Rarity", "Breed", "Export"].map((step) => (
              <span
                key={step}
                className="text-[9px] font-mono font-bold uppercase bg-emerald-50 border border-emerald-700/30 text-emerald-900 px-2 py-0.5"
              >
                {step}
              </span>
            ))}
          </div>
        </button>
      </div>

      <p className="text-center font-mono text-[10px] text-[#141414]/50 uppercase tracking-wide">
        You can switch modes anytime from the header.
      </p>
    </section>
  );
}
