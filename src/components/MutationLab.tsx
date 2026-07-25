import React from "react";
import { Sparkles, Sliders } from "lucide-react";
import { AvatarConfig } from "../types";
import { MutationSummary } from "../types/mutation";
import { playSynthSound } from "../utils/playSynthSound";
import { LogEntry } from "../types";

export interface MutationLabProps {
  config: AvatarConfig;
  chaosIntensity: number;
  setChaosIntensity: React.Dispatch<React.SetStateAction<number>>;
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
            <section className="bg-[#fcfbf9] border-2 border-[#141414] rounded-none p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden" id="interactive-qa-panel">
              {/* Retro decorative caution stripe corner background */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[repeating-linear-gradient(-45deg,#f3f4f6,#f3f4f6_6px,#e5e7eb_6px,#e5e7eb_12px)] opacity-30 pointer-events-none -z-10" />

              <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-[#D4D3D0] flex items-center justify-between">
                <h2 className="font-serif text-[11px] italic text-[#141414] uppercase font-bold tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#141414]" />
                  <span>07 // Procedural Chaos Mutation Lab</span>
                </h2>
                <span className="text-[7.5px] font-mono bg-[#ef4444] text-white px-2 py-0.5 uppercase font-bold tracking-widest animate-pulse">
                  live // genotype_mod
                </span>
              </div>

              <div className="space-y-3">
                <p className="font-mono text-[9px] text-[#141414]/80 uppercase leading-relaxed">
                  Supercharge your 3D pipeline with procedural automation. Tune the mutation amplitude generator, toggle the auto-loop sequencer, and decode unique skeletal genotypes.
                </p>

                {/* --- 🎚️ CHAOS INTENSITY & SEQUENCE SLIDERS --- */}
                <div className="bg-amber-50/60 border border-[#141414]/15 p-3 space-y-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,0.05)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#141414] flex items-center gap-1.5">
                      <Sliders className="w-3 h-3 text-[#b45309]" />
                      <span>Mutation Chaos Regulator Amplitude:</span>
                    </span>
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-[#141414] ${
                      chaosIntensity > 1.6
                        ? "bg-red-500 text-white animate-bounce"
                        : chaosIntensity > 1.1
                        ? "bg-amber-500 text-[#141414]"
                        : chaosIntensity > 0.5
                        ? "bg-blue-500 text-white"
                        : "bg-emerald-500 text-white"
                    }`}>
                      x{chaosIntensity.toFixed(2)} — {
                        chaosIntensity > 1.6
                          ? "💥 TOTAL MAYHEM (GLITCH OUT!)"
                          : chaosIntensity > 1.1
                          ? "🔥 WILD MUTANT / RARE GENES"
                          : chaosIntensity > 0.5
                          ? "🌀 STANDARD SANDBOX SKEW"
                          : "🍃 COHESIVE RETRO / BALANCED"
                      }
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.05"
                    value={chaosIntensity}
                    onChange={(e) => {
                      setChaosIntensity(parseFloat(e.target.value));
                      playSynthSound("zap");
                    }}
                    className="w-full h-1.5 bg-[#141414]/10 rounded-none appearance-none cursor-pointer accent-[#141414] border border-[#141414]/20"
                  />

                  {/* --- 🔄 AUTO-MUTATION CHRONO-LOOP TOGGLE --- */}
                  <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-[#141414]/10">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        {autoMutationActive && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${autoMutationActive ? "bg-rose-500" : "bg-gray-400"}`}></span>
                      </span>
                      <span className="text-[9px] font-mono text-[#141414]/75 uppercase">
                        Auto-Mutation Chrono-Loop (Rave Screensaver)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAutoMutationActive(!autoMutationActive);
                        playSynthSound(autoMutationActive ? "zap" : "coin");
                        addLog(
                          autoMutationActive
                            ? "🔄 [CHRONO-LOOP] Disengaged automated concept loop sequencer."
                            : "🔄 [CHRONO-LOOP] Engaged automated procedural loop. Cycling next generation every 2.2 seconds!",
                          autoMutationActive ? "info" : "success"
                        );
                      }}
                      className={`border-2 border-[#141414] text-[9px] font-mono font-bold py-1 px-3 uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        autoMutationActive
                          ? "bg-rose-100 text-rose-700 shadow-[2px_2px_0px_0px_rgba(225,29,72,1)] translate-x-[1px] translate-y-[1px]"
                          : "bg-white hover:bg-gray-50 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] active:translate-y-[2px] active:shadow-none"
                      }`}
                    >
                      {autoMutationActive ? "⏸️ STOP SEQUENCING" : "▶️ ACTIVATE AUTO-LOOP"}
                    </button>
                  </div>
                </div>

                {/* --- 🔬 DNA GENOTYPE READOUT PANEL --- */}
                <div className="bg-[#141414] text-[#39ff14] font-mono text-[9.5px] p-4 border-2 border-[#141414] space-y-2 relative shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
                  <div className="absolute top-2 right-2 text-[7px] text-[#39ff14]/40 uppercase tracking-widest select-none">
                    DNA_DECODER_v1.09
                  </div>
                  <div className="text-[8px] text-gray-400 border-b border-[#39ff14]/20 pb-1 uppercase tracking-widest font-bold">
                    📡 LAST MUTATION SEQUENCE RECORDED:
                  </div>

                  {lastMutationSummary ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
                      <div>
                        <span className="text-gray-400">CHARACTER ID:</span>{" "}
                        <span className="text-white font-bold">{lastMutationSummary.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">GENE RARITY Check:</span>{" "}
                        <span className={`text-sm uppercase ${lastMutationSummary.rarityColor}`}>
                          {lastMutationSummary.rarity}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">SKELETAL BUILD:</span>{" "}
                        <span className="text-[#00f0ff] font-semibold">{lastMutationSummary.buildType}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">SYMMETRY SKEW:</span>{" "}
                        <span className="text-amber-400">{lastMutationSummary.symmetrySkew}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">BIOLUMINESCENT:</span>{" "}
                        <span className={lastMutationSummary.mutatedGlow ? "text-[#39ff14] font-bold animate-pulse" : "text-gray-500"}>
                          {lastMutationSummary.mutatedGlow ? "YES (CYBER-GLOW)" : "NO (MATTE-VOXEL)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">SLOTS EQUIPPED:</span>{" "}
                        <span className="text-[#ff007f] font-bold">{lastMutationSummary.accessoryCount} ACCESSORIES</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[#39ff14]/60 italic py-2 text-center uppercase tracking-wide">
                      ⚡ [STANDBY] Click Mutation Button or engage Auto-Loop to map custom proportions.
                    </div>
                  )}

                  {/* Animated micro graph sequence decoder */}
                  <div className="pt-2 border-t border-[#39ff14]/15 flex items-center justify-between gap-2 text-[7.5px] text-[#39ff14]/75">
                    <span className="font-bold">DNA PATTERNS:</span>
                    <span className="tracking-widest overflow-hidden h-3 flex items-center">
                      {lastMutationSummary
                        ? Array.from({ length: 28 }).map((_, i) =>
                            ["A", "T", "C", "G", "-", "▪", "░", "█"][
                              Math.floor((Math.sin(i + Date.now()) + 1) * 4)
                            ]
                          ).join("")
                        : "C-A-T-G-T-A-C-G-A-A-T-T-C-G-G-C-C-T"}
                    </span>
                    <span className="text-gray-400">CHOSEN: {config.bodyType.toUpperCase()}</span>
                  </div>
                </div>

                {/* --- 🕹️ LAB COMMAND CONTROLS --- */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* 0. Guided Mutation Flow */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMutationFlow(true);
                      addLog("🎨 [GUIDED FLOW] Opened step-by-step character creation wizard.", "info");
                      playSynthSound("coin");
                    }}
                    className="border-2 border-[#141414] bg-gradient-to-br from-[#D946EF]/20 to-[#F59E0B]/20 hover:from-[#D946EF]/30 hover:to-[#F59E0B]/30 text-[10px] font-mono font-bold py-3 px-3 tracking-wider text-[#141414] border-[#141414] shadow-[3px_3px_0px_0px_#141414] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#141414] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer rounded-none uppercase flex flex-col items-center justify-center gap-1"
                  >
                    <span className="text-xs flex items-center gap-1">🎨 GUIDED CREATION WIZARD</span>
                    <span className="text-[8px] opacity-75 font-normal normal-case block">Step-by-step intentional design flow</span>
                  </button>

                  {/* 1. Bounce / Squish Physical Rig Test */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextTime = Date.now();
                      setBounceTime(nextTime);
                      addLog("🧪 [QA PHYSICS] Initiated rig drop test. Calculating gravity impact, local mass scale coefficients, and soft-body squash ratio.", "info");
                      playSynthSound("jump");
                      setTimeout(() => {
                        playSynthSound("boom");
                        addLog("🧪 [QA PHYSICS] Rig collision impact registered on ground grid. Decaying vibration harmonics stabilized.", "success");
                      }, 900);
                    }}
                    className="border-2 border-[#141414] bg-[#fffcf0] hover:bg-[#fff9db] text-[10px] font-mono font-bold py-3 px-3 tracking-wider text-[#92400e] border-[#92400e] shadow-[3px_3px_0px_0px_#92400e] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#92400e] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer rounded-none uppercase flex flex-col items-center justify-center gap-1"
                  >
                    <span className="text-xs flex items-center gap-1">🦘 PHYSICAL DROP & SQUISH TEST</span>
                    <span className="text-[8px] opacity-75 font-normal normal-case block">Trigger dynamic WebGL skeleton stretch-and-squash shock check</span>
                  </button>

                  {/* 2. Chaos Mutation Randomizer */}
                  <button
                    type="button"
                    onClick={handleChaosMutation}
                    className="border-2 border-[#141414] bg-[#f0fdf4] hover:bg-[#dcfce7] text-[10px] font-mono font-bold py-3 px-3 tracking-wider text-[#166534] border-[#166534] shadow-[3px_3px_0px_0px_#166534] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#166534] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer rounded-none uppercase flex flex-col items-center justify-center gap-1"
                  >
                    <span className="text-xs flex items-center gap-1">🌀 MUTATE SKELETAL DNA NOW</span>
                    <span className="text-[8px] opacity-75 font-normal normal-case block">Instantaneous procedurally calculated proportions & palettes</span>
                  </button>
                </div>
              </div>
            </section>
  );
}
