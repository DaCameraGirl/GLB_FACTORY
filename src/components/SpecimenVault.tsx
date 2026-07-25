import React from "react";
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
            <section className="bg-[#fcfbf9] border-2 border-[#141414] rounded-none p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden" id="genotype-crypt-panel">
              {/* Retro decorative caution stripe corner background */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[repeating-linear-gradient(-45deg,#f0fdf4,#f0fdf4_6px,#dcfce7_6px,#dcfce7_12px)] opacity-20 pointer-events-none -z-10" />

              <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-[#b8c9b8] flex items-center justify-between">
                <h2 className="font-serif text-[11px] italic text-[#113011] uppercase font-bold tracking-wider flex items-center gap-2">
                  <span>🧬 08 // Genotype Crypt & Breeder Vault</span>
                </h2>
                <div className="flex items-center gap-1">
                  <span className="text-[7.5px] font-mono bg-[#113011] text-[#dcfce7] px-2 py-0.5 uppercase font-bold tracking-widest">
                    stable // {mutationVault.length} specimens saved
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-mono text-[9px] text-[#141414]/80 uppercase leading-relaxed">
                  Every mutation is automatically added as a unique genomic specimen. Pick any two specimens to splice their DNA, or load a previous configuration directly onto the 3D canvas rig.
                </p>

                {/* --- 🧬 SPLICER BREEDING TANK --- */}
                <div className="bg-[#113011] text-[#dcfce7] p-4 border-2 border-[#141414] space-y-3 relative shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                  <div className="absolute top-2 right-2 text-[7px] text-[#dcfce7]/40 uppercase tracking-widest font-bold">
                    BIOLOGICAL_SPLICER_v3.2
                  </div>
                  <h3 className="font-serif text-xs italic font-bold text-white border-b border-[#dcfce7]/20 pb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <span>🧬 GENETIC BREEDING & FUSION TANK</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Parent A Selection */}
                    <div className="bg-black/40 border border-[#dcfce7]/20 p-2.5 flex flex-col justify-between min-h-[70px]">
                      <div className="text-[7.5px] text-[#dcfce7]/60 font-mono uppercase font-bold tracking-wider">
                        🧬 GENETIC PARENT A (MATERNAL SKEW)
                      </div>
                      {splicerParents[0] ? (
                        (() => {
                          const parent = mutationVault.find(m => m.id === splicerParents[0]);
                          if (!parent) return <span className="text-[9px] text-red-400">Specimen lost!</span>;
                          return (
                            <div className="flex items-center justify-between gap-1.5 pt-1">
                              <div>
                                <div className="text-[11px] font-bold text-white font-mono">{parent.name}</div>
                                <div className={`text-[8px] uppercase ${parent.rarityColor}`}>{parent.rarity}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSplicerParents(prev => prev.filter(x => x !== splicerParents[0]));
                                  playSynthSound("zap");
                                }}
                                className="text-[8px] bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 px-1.5 py-0.5 font-mono uppercase cursor-pointer"
                              >
                                DESELECT
                              </button>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-[9px] text-[#dcfce7]/40 italic pt-1 flex items-center gap-1">
                          <span>[VACANT SLOT]</span>
                          <span className="text-[8px] font-mono normal-case">(Click BREED on a card below)</span>
                        </div>
                      )}
                    </div>

                    {/* Parent B Selection */}
                    <div className="bg-black/40 border border-[#dcfce7]/20 p-2.5 flex flex-col justify-between min-h-[70px]">
                      <div className="text-[7.5px] text-[#dcfce7]/60 font-mono uppercase font-bold tracking-wider">
                        🧬 GENETIC PARENT B (PATERNAL SKEW)
                      </div>
                      {splicerParents[1] ? (
                        (() => {
                          const parent = mutationVault.find(m => m.id === splicerParents[1]);
                          if (!parent) return <span className="text-[9px] text-red-400">Specimen lost!</span>;
                          return (
                            <div className="flex items-center justify-between gap-1.5 pt-1">
                              <div>
                                <div className="text-[11px] font-bold text-white font-mono">{parent.name}</div>
                                <div className={`text-[8px] uppercase ${parent.rarityColor}`}>{parent.rarity}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSplicerParents(prev => prev.filter(x => x !== splicerParents[1]));
                                  playSynthSound("zap");
                                }}
                                className="text-[8px] bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 px-1.5 py-0.5 font-mono uppercase cursor-pointer"
                              >
                                DESELECT
                              </button>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-[9px] text-[#dcfce7]/40 italic pt-1 flex items-center gap-1">
                          <span>[VACANT SLOT]</span>
                          <span className="text-[8px] font-mono normal-case">(Click BREED on a card below)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Splice Command Button */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-[8px] text-[#dcfce7]/70 font-mono max-w-sm leading-normal">
                      {splicerParents.length === 2 
                        ? "⚡ Parent codes aligned. Ready to cross-breed scale matrices, clothing genes, and hair styles!"
                        : "🧬 Select exactly TWO genotypes from the list below by clicking 'BREED' to unlock the breeding button."}
                    </div>
                    <button
                      type="button"
                      disabled={splicerParents.length !== 2}
                      onClick={handleFuseGenomes}
                      className={`border-2 text-[10px] font-mono font-bold py-2 px-3 tracking-wider uppercase transition-all duration-150 ${
                        splicerParents.length === 2
                          ? "bg-[#39ff14] text-black border-black shadow-[3px_3px_0px_0px_rgba(255,255,255,0.9)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.9)] active:translate-y-[3px] active:shadow-none cursor-pointer"
                          : "bg-gray-850 text-gray-500 border-gray-900 shadow-none cursor-not-allowed opacity-50"
                      }`}
                    >
                      🧬 FUSE PARENT GENOMES
                    </button>
                  </div>
                </div>

                {/* --- Horizontal Scroll Specimen stable gallery --- */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase text-[#141414] flex items-center gap-1.5">
                      <span>👥 SPECIMEN ARCHIVE (GENOMIC CRYPT):</span>
                    </span>
                    {mutationVault.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to purge the genotype archive? This cannot be undone.")) {
                            setMutationVault([]);
                            setSplicerParents([]);
                            playSynthSound("boom");
                            addLog("🧬 [MUTANT CRYPT] Purged all genomic data. Empty database initialized.", "info");
                          }
                        }}
                        className="text-[8px] text-red-600 font-mono uppercase hover:underline cursor-pointer"
                      >
                        Purge All Genotypes
                      </button>
                    )}
                  </div>

                  {mutationVault.length === 0 ? (
                    <div className="border-2 border-dashed border-[#141414]/20 p-8 text-center text-[#141414]/50 font-mono text-[10px] uppercase">
                      No mutant specimens recorded yet. Click the "Mutate" button above to generate and collect your first specimen!
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                      {mutationVault.map((specimen) => {
                        const isSelectedAsParent = splicerParents.includes(specimen.id);
                        const parentIndex = splicerParents.indexOf(specimen.id);
                        
                        return (
                          <div
                            key={specimen.id}
                            className={`snap-start shrink-0 w-[170px] border-2 bg-white flex flex-col justify-between p-3 relative shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] ${
                              isSelectedAsParent 
                                ? "border-emerald-500 ring-2 ring-emerald-400 ring-offset-1" 
                                : "border-[#141414]"
                            }`}
                          >
                            {isSelectedAsParent && (
                              <div className="absolute -top-2.5 -left-1 bg-emerald-500 text-white border border-black font-mono text-[7px] font-bold px-1.5 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
                                PARENT {parentIndex === 0 ? "A" : "B"}
                              </div>
                            )}

                            <div>
                              <div className="flex items-start justify-between gap-1 border-b border-gray-100 pb-1 mb-1.5">
                                <span className="font-mono font-bold text-[10.5px] truncate text-[#141414]">
                                  {specimen.name}
                                </span>
                                <span className="font-mono text-[7px] text-gray-400 shrink-0 select-none">
                                  {specimen.timestamp}
                                </span>
                              </div>

                              <div className="space-y-1 text-[8.5px] font-mono uppercase text-[#141414]/75">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Rarity:</span>
                                  <span className={`font-bold ${specimen.rarityColor}`}>{specimen.rarity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Build:</span>
                                  <span className="text-gray-900 font-semibold truncate max-w-[90px]">{specimen.buildType}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Skelet:</span>
                                  <span className="text-[#3b82f6]">{specimen.config.bodyType}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Glow:</span>
                                  <span className={specimen.mutatedGlow ? "text-[#39ff14] font-bold" : "text-gray-400"}>
                                    {specimen.mutatedGlow ? "YES" : "NO"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Specimen Card Actions */}
                            <div className="grid grid-cols-3 gap-1 mt-3 pt-2 border-t border-gray-100">
                              {/* Clone / Load */}
                              <button
                                type="button"
                                onClick={() => {
                                  setConfig(specimen.config);
                                  setCharacterName(specimen.name);
                                  playSynthSound("coin");
                                  addLog(`👤 [GENOME] Loaded specimen '${specimen.name}' to the active WebGL canvas.`, "info");
                                }}
                                className="border border-[#141414] bg-sky-50 hover:bg-sky-100 text-[8px] font-mono font-bold py-1 px-1 cursor-pointer hover:translate-y-[0.5px] transition-all text-sky-800 uppercase text-center"
                                title="Load skeleton to active workspace"
                              >
                                LOAD
                              </button>

                              {/* Breed Selection Toggle */}
                              <button
                                type="button"
                                onClick={() => {
                                  toggleParentSelection(specimen.id);
                                }}
                                className={`border border-[#141414] text-[8px] font-mono font-bold py-1 px-1 cursor-pointer transition-all uppercase text-center ${
                                  isSelectedAsParent 
                                    ? "bg-emerald-500 text-white" 
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {isSelectedAsParent ? "SELECTED" : "BREED"}
                              </button>

                              {/* Delete individual specimen */}
                              <button
                                type="button"
                                onClick={() => {
                                  setMutationVault(prev => prev.filter(m => m.id !== specimen.id));
                                  setSplicerParents(prev => prev.filter(x => x !== specimen.id));
                                  playSynthSound("boom");
                                  addLog(`🗑️ [MUTANT CRYPT] Purged genotype of '${specimen.name}' from index archive.`, "info");
                                }}
                                className="border border-red-200 bg-red-50 hover:bg-red-100 text-[8px] font-mono font-bold py-1 px-1 cursor-pointer text-red-600 uppercase text-center"
                                title="Erase genetic data"
                              >
                                PURGE
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
  );
}
