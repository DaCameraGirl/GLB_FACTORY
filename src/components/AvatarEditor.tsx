import React from "react";
import {
  Palette,
  Settings,
  Layers,
  ListFilter,
  Flame,
  Cpu,
} from "lucide-react";
import { AvatarConfig, HairStyle, BodyType, HeadShape, LogEntry } from "../types";
import { COLOR_PALETTES, CREATURE_VARIANTS } from "../constants/presets";
import { playSynthSound } from "../utils/playSynthSound";
import genieMascotIcon from "../assets/genie-mascot.png";

export interface AvatarEditorProps {
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  editorTab: "parts" | "transforms" | "materials" | "scene" | "camera";
  handleTabSelection: (tab: "parts" | "transforms" | "materials" | "scene" | "camera") => void;
  handleResetDefaults: () => void;
  handleTakeSnap: () => void;
  addLog: (text: string, type?: LogEntry["type"]) => void;
}

export default function AvatarEditor({
  config,
  setConfig,
  editorTab,
  handleTabSelection,
  handleResetDefaults,
  handleTakeSnap,
  addLog,
}: AvatarEditorProps) {
  return (
            <section className="bg-white/40 border-2 border-[#141414] rounded-none p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]" id="customization-panel">
              <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-[#D4D3D0] flex items-center justify-between">
                <h2 className="font-serif text-[11px] italic text-[#141414]/80 uppercase font-bold tracking-wider flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" />
                  <span>03 // Blender-Style Workspace Control</span>
                </h2>
                <button
                  onClick={handleResetDefaults}
                  className="text-[9px] text-[#141414] font-bold font-mono uppercase bg-white/60 border border-[#141414] px-1.5 py-0.5 rounded-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white hover:translate-y-[1px] transition-all duration-200"
                >
                  Defaults
                </button>
              </div>

              {/* Blender Tabs Selector */}
              <div className="grid grid-cols-5 gap-1 bg-[#141414]/5 p-1 border-2 border-[#141414] font-mono text-[9px] font-bold">
                <button
                  onClick={() => handleTabSelection("parts")}
                  className={`py-1.5 px-0.5 uppercase text-center transition-all ${
                    editorTab === "parts"
                      ? "bg-[#141414] text-white"
                      : "bg-transparent text-[#141414]/70 hover:bg-[#141414]/10"
                  }`}
                >
                  Parts
                </button>
                <button
                  onClick={() => handleTabSelection("transforms")}
                  className={`py-1.5 px-0.5 uppercase text-center transition-all ${
                    editorTab === "transforms"
                      ? "bg-[#141414] text-white"
                      : "bg-transparent text-[#141414]/70 hover:bg-[#141414]/10"
                  }`}
                >
                  Transform
                </button>
                <button
                  onClick={() => handleTabSelection("materials")}
                  className={`py-1.5 px-0.5 uppercase text-center transition-all ${
                    editorTab === "materials"
                      ? "bg-[#141414] text-white"
                      : "bg-transparent text-[#141414]/70 hover:bg-[#141414]/10"
                  }`}
                >
                  Material
                </button>
                <button
                  onClick={() => handleTabSelection("scene")}
                  className={`py-1.5 px-0.5 uppercase text-center transition-all ${
                    editorTab === "scene"
                      ? "bg-[#141414] text-white"
                      : "bg-transparent text-[#141414]/70 hover:bg-[#141414]/10"
                  }`}
                >
                  Scene
                </button>
                <button
                  onClick={() => handleTabSelection("camera")}
                  className={`py-1.5 px-0.5 uppercase text-center transition-all ${
                    editorTab === "camera"
                      ? "bg-[#D946EF] text-white border-2 border-[#141414] shadow-[1px_1px_0px_0px_#141414]"
                      : "bg-transparent text-[#D946EF] hover:bg-[#D946EF]/10"
                  }`}
                >
                  📸 Snap
                </button>
              </div>

              {/* TAB CONTENT WRAPPERS */}
              {editorTab === "parts" && (
                <div className="space-y-4">

              {/* Head Shape / Mesh Style */}
              <div className="space-y-1.5 pb-2 border-b border-[#141414]/10">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">MESH STYLE / MODEL SHAPE</label>
                <select
                  value={config.creatureVariant && config.creatureVariant !== "none" ? config.creatureVariant : config.headShape}
                  onChange={(e) => {
                    const val = e.target.value;
                    const preset = CREATURE_VARIANTS[val];
                    if (preset) {
                      setConfig((prev) => ({
                        ...prev,
                        headShape: "organic-smooth",
                        creatureVariant: val as AvatarConfig["creatureVariant"],
                        skinColor: preset.skinColor,
                        hairColor: preset.hairColor,
                        hairStyle: preset.hairStyle || "none",
                        bodyType: preset.bodyType || prev.bodyType,
                        clothingColor: preset.clothingColor || prev.clothingColor,
                        pantsColor: preset.pantsColor || prev.pantsColor,
                        accessories: preset.accessories,
                      }));
                      addLog(`Mesh style set to ${preset.label.replace(/^\S+\s/, "").toUpperCase()}. Skin, colors, and accessories auto-equipped.`, "success");
                    } else {
                      setConfig((prev) => {
                        const wasCreature = prev.creatureVariant && prev.creatureVariant !== "none";
                        return {
                          ...prev,
                          headShape: val as HeadShape,
                          creatureVariant: "none",
                          ...(wasCreature
                            ? {
                                skinColor: "#e5a65d",
                                hairColor: "#211510",
                                hairStyle: "short" as const,
                                accessories: [],
                              }
                            : {}),
                        };
                      });
                    }
                  }}
                  className="w-full bg-white/70 border-2 border-[#141414] px-3 py-2 text-xs text-[#141414] font-mono font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_#141414]"
                >
                  <option value="organic-smooth">✪ ORGANIC HUMANOID (GAME-READY)</option>
                  <option value="rounded-cube">Rounded Cube (Smooth Voxel)</option>
                  <option value="cube">Classic Box (Retro Blocky)</option>
                  {Object.entries(CREATURE_VARIANTS).map(([key, preset]) => (
                    <option key={key} value={key}>{preset.label}</option>
                  ))}
                </select>
                {config.creatureVariant && config.creatureVariant !== "none" && (
                  <p className="text-[8px] text-[#141414]/60 italic">
                    Creature variants build on the Organic Humanoid mesh with matching skin, proportions, and accessories auto-equipped. Tweak any of it below.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Hair Style */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">HAIRSTYLE</label>
                  <select
                    value={config.hairStyle}
                    onChange={(e) => setConfig((prev) => ({ ...prev, hairStyle: e.target.value as HairStyle }))}
                    className="w-full bg-white/70 border-2 border-[#141414] px-3 py-2 rounded-none text-xs text-[#141414] font-mono focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_#141414]"
                  >
                    <option value="none">Bald / None</option>
                    <option value="short">Short Trim</option>
                    <option value="long">Long Flowing</option>
                    <option value="afro">Afro Puffy</option>
                    <option value="ponytail">Ponytail</option>
                    <option value="cap">Sport Cap</option>
                  </select>
                </div>

                {/* Body Proportions */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">BODY TYPE</label>
                  <select
                    value={config.bodyType}
                    onChange={(e) => setConfig((prev) => ({ ...prev, bodyType: e.target.value as BodyType }))}
                    className="w-full bg-white/70 border-2 border-[#141414] px-3 py-2 rounded-none text-xs text-[#141414] font-mono focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_#141414]"
                  >
                    <option value="normal">Normal Blocky</option>
                    <option value="chibi">Chibi Tiny</option>
                    <option value="tall">Tall Slim</option>
                    <option value="athletic">Athletic Wide</option>
                  </select>
                </div>
              </div>

              {/* Color selectors */}
              <div className="grid grid-cols-3 gap-3">
                {/* Skin Tone */}
                <div className="space-y-1.5 text-center">
                  <label className="font-mono text-[9px] text-[#141414]/80 font-bold block uppercase tracking-wider">Skin</label>
                  <div className="flex items-center justify-center gap-1.5 bg-white/60 border-2 border-[#141414] p-1.5 rounded-none shadow-[2px_2px_0px_0px_#141414]">
                    <input
                      type="color"
                      value={config.skinColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, skinColor: e.target.value }))}
                      className="w-5 h-5 cursor-pointer border border-[#141414]"
                    />
                    <span className="text-[10px] text-[#141414] font-mono uppercase font-bold">{config.skinColor.substring(1, 5)}</span>
                  </div>
                </div>

                {/* Hair Color */}
                <div className="space-y-1.5 text-center">
                  <label className="font-mono text-[9px] text-[#141414]/80 font-bold block uppercase tracking-wider">Hair</label>
                  <div className="flex items-center justify-center gap-1.5 bg-white/60 border-2 border-[#141414] p-1.5 rounded-none shadow-[2px_2px_0px_0px_#141414]">
                    <input
                      type="color"
                      value={config.hairColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, hairColor: e.target.value }))}
                      className="w-5 h-5 cursor-pointer border border-[#141414]"
                    />
                    <span className="text-[10px] text-[#141414] font-mono uppercase font-bold">{config.hairColor.substring(1, 5)}</span>
                  </div>
                </div>

                {/* Clothing Color */}
                <div className="space-y-1.5 text-center">
                  <label className="font-mono text-[9px] text-[#141414]/80 font-bold block uppercase tracking-wider">Clothing</label>
                  <div className="flex items-center justify-center gap-1.5 bg-white/60 border-2 border-[#141414] p-1.5 rounded-none shadow-[2px_2px_0px_0px_#141414]">
                    <input
                      type="color"
                      value={config.clothingColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, clothingColor: e.target.value }))}
                      className="w-5 h-5 cursor-pointer border border-[#141414]"
                    />
                    <span className="text-[10px] text-[#141414] font-mono uppercase font-bold">{config.clothingColor.substring(1, 5)}</span>
                  </div>
                </div>
              </div>

              {/* Advanced lower-body styling */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] text-[#141414]/80 font-bold block uppercase tracking-wider">Pants Color</label>
                  <div className="flex items-center gap-2 bg-white/60 border-2 border-[#141414] px-3 py-1.5 rounded-none shadow-[2px_2px_0px_0px_#141414]">
                    <input
                      type="color"
                      value={config.pantsColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, pantsColor: e.target.value }))}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="text-[10px] text-[#141414] font-mono uppercase font-bold">{config.pantsColor}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] text-[#141414]/80 font-bold block uppercase tracking-wider">Shoes Color</label>
                  <div className="flex items-center gap-2 bg-white/60 border-2 border-[#141414] px-3 py-1.5 rounded-none shadow-[2px_2px_0px_0px_#141414]">
                    <input
                      type="color"
                      value={config.shoesColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, shoesColor: e.target.value }))}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="text-[10px] text-[#141414] font-mono uppercase font-bold">{config.shoesColor}</span>
                  </div>
                </div>
              </div>

              {/* Additional custom styling parameters */}
              <div className="grid grid-cols-2 gap-4 border-t border-[#141414]/10 pt-3">
                {/* Clothing Style */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">CLOTHING STYLE</label>
                  <select
                    value={config.clothingStyle || "tshirt"}
                    onChange={(e) => setConfig((prev) => ({ ...prev, clothingStyle: e.target.value as any }))}
                    className="w-full bg-white/70 border-2 border-[#141414] px-3 py-2 rounded-none text-xs text-[#141414] font-mono focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_#141414]"
                  >
                    <option value="tshirt">T-Shirt / Base</option>
                    <option value="hoodie">Street Hoodie</option>
                    <option value="armor">Iron Chestplate</option>
                    <option value="dress">Elegant Dress</option>
                  </select>
                </div>

                {/* Detail Level / LOD */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">DETAIL LEVEL (LOD)</label>
                  <select
                    value={config.detailLevel || "medium"}
                    onChange={(e) => setConfig((prev) => ({ ...prev, detailLevel: e.target.value as any }))}
                    className="w-full bg-white/70 border-2 border-[#141414] px-3 py-2 rounded-none text-xs text-[#141414] font-mono focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_#141414]"
                  >
                    <option value="low">Low (Mobile Optimized)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Hero Poly)</option>
                  </select>
                </div>
              </div>

              {/* Facial expression select */}
              <div className="space-y-1.5 border-t border-[#141414]/10 pt-3">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">FACIAL EXPRESSION</label>
                <select
                  value={config.expression || "neutral"}
                  onChange={(e) => setConfig((prev) => ({ ...prev, expression: e.target.value as any }))}
                  className="w-full bg-white/70 border-2 border-[#141414] px-3 py-2 rounded-none text-xs text-[#141414] font-mono focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_#141414]"
                >
                  <option value="neutral">Neutral / Focus</option>
                  <option value="happy">Happy Smiley</option>
                  <option value="angry">Grumpy / Confused</option>
                  <option value="sad">Sad / Melancholy</option>
                  <option value="surprised">Surprised / Wide</option>
                </select>
              </div>

              {/* Accessories Checkboxes */}
              <div className="space-y-2 border-t border-[#141414]/10 pt-3">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">EQUIPPED ACCESSORIES</label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Glasses */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("glasses") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "glasses" as const] : cur.filter((x) => x !== "glasses");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span>Glasses</span>
                  </label>

                  {/* Headphones */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("headphones") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "headphones" as const] : cur.filter((x) => x !== "headphones");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span>Phones</span>
                  </label>

                  {/* Backpack */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("backpack") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "backpack" as const] : cur.filter((x) => x !== "backpack");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span>Backpack</span>
                  </label>

                  {/* Halo */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("halo") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "halo" as const] : cur.filter((x) => x !== "halo");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span className="text-[#b45309] font-bold">★ Halo</span>
                  </label>

                  {/* Crown */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("crown") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "crown" as const] : cur.filter((x) => x !== "crown");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span className="text-[#c2410c] font-bold">♛ Crown</span>
                  </label>

                  {/* Cat Ears */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("cat-ears") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "cat-ears" as const] : cur.filter((x) => x !== "cat-ears");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span className="text-[#db2777]">🐾 Ears</span>
                  </label>

                  {/* Wizard Hat */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200 col-span-3">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("wizard-hat") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "wizard-hat" as const] : cur.filter((x) => x !== "wizard-hat");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span className="text-[#1d4ed8] font-bold">🧙 Wizard Spellcaster Hat</span>
                  </label>

                  {/* Fins */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("fins") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "fins" as const] : cur.filter((x) => x !== "fins");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span className="text-[#0284c7]">🐟 Fins</span>
                  </label>

                  {/* Tail */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("tail") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "tail" as const] : cur.filter((x) => x !== "tail");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span>🦎 Tail</span>
                  </label>

                  {/* Snout */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("snout") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "snout" as const] : cur.filter((x) => x !== "snout");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span>🐽 Snout</span>
                  </label>

                  {/* Whiskers */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("whiskers") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "whiskers" as const] : cur.filter((x) => x !== "whiskers");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span>🐱 Whiskers</span>
                  </label>

                  {/* Mushroom Cap */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("mushroom-cap") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "mushroom-cap" as const] : cur.filter((x) => x !== "mushroom-cap");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span className="text-[#dc2626] font-bold">🍄 Mushroom Cap</span>
                  </label>

                  {/* Gun */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("gun") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "gun" as const] : cur.filter((x) => x !== "gun");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span>🔫 Blaster</span>
                  </label>

                  {/* Knife */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("knife") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "knife" as const] : cur.filter((x) => x !== "knife");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span>🗡️ Knife</span>
                  </label>

                  {/* Herb Pouch */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("herb-pouch") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "herb-pouch" as const] : cur.filter((x) => x !== "herb-pouch");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span>🌿 Herb Pouch</span>
                  </label>
                </div>
              </div>

              {/* Body Morph Target Sliders */}
              <div className="space-y-3 border-t border-[#141414]/10 pt-3">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">BODY MORPH INFLUENCES</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                      <span>SLENDER STYLE</span>
                      <span>{Math.round((config.morphSlender || 0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.morphSlender || 0}
                      onChange={(e) => setConfig((prev) => ({ ...prev, morphSlender: parseFloat(e.target.value) }))}
                      className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                      <span>BULK STYLE</span>
                      <span>{Math.round((config.morphBulk || 0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.morphBulk || 0}
                      onChange={(e) => setConfig((prev) => ({ ...prev, morphBulk: parseFloat(e.target.value) }))}
                      className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                    />
                  </div>
                </div>
              </div>

              {/* Retro Color Palette Scheme Repainter */}
              <div className="space-y-3 border-t border-[#141414]/10 pt-3">
                <div className="flex items-center gap-1.5">
                  <ListFilter className="w-3.5 h-3.5 text-[#141414]/75" />
                  <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">INSTANT RETRO PALETTES</label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {COLOR_PALETTES.map((palette) => (
                    <button
                      type="button"
                      key={palette.name}
                      onClick={() => {
                        setConfig((prev) => ({
                          ...prev,
                          skinColor: palette.skin,
                          hairColor: palette.hair,
                          clothingColor: palette.clothing,
                          pantsColor: palette.pants,
                          shoesColor: palette.shoes,
                        }));
                        addLog(`[PALETTE] Repainted character model with '${palette.name}' signature scheme.`, "info");
                        playSynthSound("coin");
                      }}
                      className="border-2 border-[#141414] bg-white/70 hover:bg-white p-1.5 text-[9px] font-mono font-bold text-center tracking-tight shadow-[2px_2px_0px_0px_#141414] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#141414] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                    >
                      <div className="truncate mb-1">{palette.name}</div>
                      <div className="flex items-center justify-center -space-x-1">
                        <span className="w-2.5 h-2.5 border border-black/10 inline-block" style={{ backgroundColor: palette.skin }} />
                        <span className="w-2.5 h-2.5 border border-black/10 inline-block" style={{ backgroundColor: palette.hair }} />
                        <span className="w-2.5 h-2.5 border border-black/10 inline-block" style={{ backgroundColor: palette.clothing }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
                </div>
              )}

              {/* TRANSFORMS TAB */}
              {editorTab === "transforms" && (
                <div className="space-y-4 text-[#141414] font-mono">
                  {/* Head Transforms */}
                  <div className="space-y-2 border-b border-[#141414]/10 pb-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">01 // HEAD TRANSFORM (LOCAL)</label>
                    <div className="grid grid-cols-1 gap-2 text-[9px]">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>SCALE (XYZ)</span>
                          <span>{config.headScaleX?.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.8"
                          step="0.05"
                          value={config.headScaleX || 1.0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setConfig((prev) => ({ ...prev, headScaleX: val, headScaleY: val, headScaleZ: val }));
                          }}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>OFFSET Y (HEIGHT)</span>
                          <span>{config.headTranslateY !== undefined ? (config.headTranslateY > 0 ? "+" : "") + config.headTranslateY.toFixed(2) : "0.00"}</span>
                        </div>
                        <input
                          type="range"
                          min="-0.5"
                          max="0.5"
                          step="0.05"
                          value={config.headTranslateY !== undefined ? config.headTranslateY : 0.0}
                          onChange={(e) => setConfig((prev) => ({ ...prev, headTranslateY: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>PITCH / TILT (ROTATE X)</span>
                          <span>{((config.headRotateX || 0) * (180 / Math.PI)).toFixed(0)}°</span>
                        </div>
                        <input
                          type="range"
                          min="-0.5"
                          max="0.5"
                          step="0.05"
                          value={config.headRotateX || 0}
                          onChange={(e) => setConfig((prev) => ({ ...prev, headRotateX: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Torso Transforms */}
                  <div className="space-y-2 border-b border-[#141414]/10 pb-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">02 // TORSO / CHEST EXPANSION</label>
                    <div className="grid grid-cols-1 gap-2 text-[9px]">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>TORSO WIDTH (SCALE X)</span>
                          <span>{config.torsoScaleX?.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.6"
                          max="1.6"
                          step="0.05"
                          value={config.torsoScaleX || 1.0}
                          onChange={(e) => setConfig((prev) => ({ ...prev, torsoScaleX: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>TORSO DEPTH (SCALE Z)</span>
                          <span>{config.torsoScaleZ?.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.6"
                          max="1.6"
                          step="0.05"
                          value={config.torsoScaleZ || 1.0}
                          onChange={(e) => setConfig((prev) => ({ ...prev, torsoScaleZ: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Limbs Transforms */}
                  <div className="space-y-2 border-b border-[#141414]/10 pb-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">03 // LIMB THICKNESS / SCALE</label>
                    <div className="grid grid-cols-2 gap-4 text-[9px]">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>ARM SCALE</span>
                          <span>{config.armScaleX?.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.05"
                          value={config.armScaleX || 1.0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setConfig((prev) => ({ ...prev, armScaleX: val, armScaleY: val, armScaleZ: val }));
                          }}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>LEG SCALE</span>
                          <span>{config.legScaleX?.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.05"
                          value={config.legScaleX || 1.0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setConfig((prev) => ({ ...prev, legScaleX: val, legScaleY: val, legScaleZ: val }));
                          }}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Armature Direct Bone Bindings */}
                  <div className="space-y-3 border-b border-[#141414]/10 pb-3 bg-neutral-100/40 p-2.5 border-2 border-dashed border-[#141414]/20">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-[10px] uppercase font-bold text-[#e11d48] flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 animate-pulse" />
                        <span>04 // ARMATURE BONE CONTROL</span>
                      </label>
                      <span className="text-[8px] px-1 bg-rose-100 text-rose-700 font-bold tracking-wider">BLENDER KILLER</span>
                    </div>

                    <p className="text-[8.5px] leading-relaxed text-neutral-600">
                      Direct manual inverse-kinematics-grade bone joint angle binders. Move individual rig sections instantly without standard Blender weight-painting fatigue.
                    </p>

                    <div className="space-y-2.5 text-[9px]">
                      {/* Head Yaw / Pitch */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>HEAD YAW (L/R)</span>
                            <span>{config.poseHeadYaw}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={config.poseHeadYaw !== undefined ? config.poseHeadYaw : 0}
                            onChange={(e) => {
                              setConfig((prev) => ({ ...prev, poseHeadYaw: parseInt(e.target.value) }));
                            }}
                            className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>HEAD PITCH (U/D)</span>
                            <span>{config.poseHeadPitch}°</span>
                          </div>
                          <input
                            type="range"
                            min="-90"
                            max="90"
                            step="5"
                            value={config.poseHeadPitch !== undefined ? config.poseHeadPitch : 0}
                            onChange={(e) => {
                              setConfig((prev) => ({ ...prev, poseHeadPitch: parseInt(e.target.value) }));
                            }}
                            className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                          />
                        </div>
                      </div>

                      {/* Left Arm Swing / Raise */}
                      <div className="grid grid-cols-2 gap-2 border-t border-[#141414]/5 pt-2">
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>L ARM ROTATION X</span>
                            <span>{config.poseLeftArmRotationX}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={config.poseLeftArmRotationX !== undefined ? config.poseLeftArmRotationX : 0}
                            onChange={(e) => {
                              setConfig((prev) => ({ ...prev, poseLeftArmRotationX: parseInt(e.target.value) }));
                            }}
                            className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>L ARM ROTATION Z</span>
                            <span>{config.poseLeftArmRotationZ}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={config.poseLeftArmRotationZ !== undefined ? config.poseLeftArmRotationZ : -5}
                            onChange={(e) => {
                              setConfig((prev) => ({ ...prev, poseLeftArmRotationZ: parseInt(e.target.value) }));
                            }}
                            className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                          />
                        </div>
                      </div>

                      {/* Right Arm Swing / Raise */}
                      <div className="grid grid-cols-2 gap-2 border-t border-[#141414]/5 pt-2">
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>R ARM ROTATION X</span>
                            <span>{config.poseRightArmRotationX}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={config.poseRightArmRotationX !== undefined ? config.poseRightArmRotationX : 0}
                            onChange={(e) => {
                              setConfig((prev) => ({ ...prev, poseRightArmRotationX: parseInt(e.target.value) }));
                            }}
                            className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>R ARM ROTATION Z</span>
                            <span>{config.poseRightArmRotationZ}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={config.poseRightArmRotationZ !== undefined ? config.poseRightArmRotationZ : 5}
                            onChange={(e) => {
                              setConfig((prev) => ({ ...prev, poseRightArmRotationZ: parseInt(e.target.value) }));
                            }}
                            className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                          />
                        </div>
                      </div>

                      {/* Legs rotation */}
                      <div className="grid grid-cols-2 gap-2 border-t border-[#141414]/5 pt-2">
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>L LEG ROTATION X</span>
                            <span>{config.poseLeftLegRotationX}°</span>
                          </div>
                          <input
                            type="range"
                            min="-90"
                            max="90"
                            step="5"
                            value={config.poseLeftLegRotationX !== undefined ? config.poseLeftLegRotationX : 0}
                            onChange={(e) => {
                              setConfig((prev) => ({ ...prev, poseLeftLegRotationX: parseInt(e.target.value) }));
                            }}
                            className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>R LEG ROTATION X</span>
                            <span>{config.poseRightLegRotationX}°</span>
                          </div>
                          <input
                            type="range"
                            min="-90"
                            max="90"
                            step="5"
                            value={config.poseRightLegRotationX !== undefined ? config.poseRightLegRotationX : 0}
                            onChange={(e) => {
                              setConfig((prev) => ({ ...prev, poseRightLegRotationX: parseInt(e.target.value) }));
                            }}
                            className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-[8.5px] border-t border-[#141414]/10 pt-2 text-[#e11d48] font-bold flex items-center justify-between">
                      <span>⚠️ TOGGLE 'CUSTOM' POSE IN BOTTOM TO PREVIEW</span>
                    </div>
                  </div>

                  {/* Reset Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        headScaleX: 1.0, headScaleY: 1.0, headScaleZ: 1.0,
                        headTranslateX: 0, headTranslateY: 0, headTranslateZ: 0,
                        headRotateX: 0, headRotateY: 0, headRotateZ: 0,
                        torsoScaleX: 1.0, torsoScaleY: 1.0, torsoScaleZ: 1.0,
                        torsoTranslateX: 0, torsoTranslateY: 0, torsoTranslateZ: 0,
                        armScaleX: 1.0, armScaleY: 1.0, armScaleZ: 1.0,
                        legScaleX: 1.0, legScaleY: 1.0, legScaleZ: 1.0,
                        poseHeadYaw: 0,
                        poseHeadPitch: 0,
                        poseLeftArmRotationX: 0,
                        poseLeftArmRotationZ: -5,
                        poseRightArmRotationX: 0,
                        poseRightArmRotationZ: 5,
                        poseLeftLegRotationX: 0,
                        poseRightLegRotationX: 0,
                      }));
                      addLog("Transform matrices and bone joint rotations reset to defaults.", "info");
                    }}
                    className="w-full py-2 border-2 border-[#141414] text-[10px] bg-white/50 hover:bg-white active:translate-y-0.5 transition font-bold shadow-[2px_2px_0px_0px_#141414] select-none"
                  >
                    RESET ARMATURE & MATRIX
                  </button>
                </div>
              )}

              {/* MATERIALS TAB */}
              {editorTab === "materials" && (
                <div className="space-y-4 text-[#141414] font-mono">
                  <div className="space-y-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">01 // GLTF SHADER PROPERTIES</label>
                    <div className="space-y-2">
                      <div className="space-y-1 text-[9px]">
                        <div className="flex justify-between font-bold">
                          <span>ROUGHNESS (MATTE vs SHINY)</span>
                          <span>{Math.round((config.materialRoughness ?? 0.8) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.05"
                          value={config.materialRoughness !== undefined ? config.materialRoughness : 0.8}
                          onChange={(e) => setConfig((prev) => ({ ...prev, materialRoughness: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>

                      <div className="space-y-1 text-[9px]">
                        <div className="flex justify-between font-bold">
                          <span>METALNESS (METALLIC REFLECT)</span>
                          <span>{Math.round((config.materialMetalness ?? 0.05) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.05"
                          value={config.materialMetalness !== undefined ? config.materialMetalness : 0.05}
                          onChange={(e) => setConfig((prev) => ({ ...prev, materialMetalness: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-[#141414]/10 pt-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">02 // EMISSIVE GLOW (GLOW IN DARK)</label>
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div className="space-y-1 text-[9px]">
                        <span className="font-bold uppercase text-[8px] text-[#141414]/70">GLOW COLOR</span>
                        <div className="flex items-center gap-2 bg-white/60 border-2 border-[#141414] p-1 shadow-[2px_2px_0px_0px_#141414]">
                          <input
                            type="color"
                            value={config.materialEmissive || "#000000"}
                            onChange={(e) => setConfig((prev) => ({ ...prev, materialEmissive: e.target.value }))}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="uppercase font-bold text-[9px]">{config.materialEmissive || "#000000"}</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[9px]">
                        <div className="flex justify-between font-bold">
                          <span>INTENSITY</span>
                          <span>{(config.materialEmissiveIntensity || 0).toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="2.0"
                          step="0.1"
                          value={config.materialEmissiveIntensity !== undefined ? config.materialEmissiveIntensity : 0.0}
                          onChange={(e) => setConfig((prev) => ({ ...prev, materialEmissiveIntensity: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-[#141414]/10 pt-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">03 // WIREFRAME RENDER OPTIONS</label>
                    <label className="flex items-center gap-2 cursor-pointer bg-white/50 border-2 border-[#141414] p-2 text-[10px] hover:bg-white select-none shadow-[2px_2px_0px_0px_#141414] transition-all">
                      <input
                        type="checkbox"
                        checked={!!config.wireframeMode}
                        onChange={(e) => setConfig((prev) => ({ ...prev, wireframeMode: e.target.checked }))}
                        className="accent-[#141414]"
                      />
                      <span className="font-bold">ENABLE WIREFRAME MODE (DEVELOPER PREVIEW)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* SCENE TAB */}
              {editorTab === "scene" && (
                <div className="space-y-4 text-[#141414] font-mono">
                  <div className="space-y-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">01 // CAMERA / VIEW ANGLE PRESETS</label>
                    <div className="grid grid-cols-2 gap-3 text-[9px]">
                      <div className="space-y-1">
                        <span className="font-bold text-[8px] text-[#141414]/70">ANGLE PRESET</span>
                        <select
                          value={config.cameraPreset || "front"}
                          onChange={(e) => setConfig((prev) => ({ ...prev, cameraPreset: e.target.value as any }))}
                          className="w-full bg-white/70 border-2 border-[#141414] px-1.5 py-1.5 text-[9px] font-mono font-bold focus:outline-none shadow-[2px_2px_0px_0px_#141414]"
                        >
                          <option value="front">✪ FRONT VIEW</option>
                          <option value="side">✪ SIDE VIEW (PROFILE)</option>
                          <option value="top">✪ TOP-DOWN VIEW</option>
                          <option value="isometric">✪ ISOMETRIC (3D ORTHO)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>FOV (CAMERA LENS)</span>
                          <span>{config.cameraFov || 45}°</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="80"
                          step="5"
                          value={config.cameraFov || 45}
                          onChange={(e) => setConfig((prev) => ({ ...prev, cameraFov: parseInt(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-[#141414]/10 pt-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">02 // LIGHTING & AMBIENT INTENSITIES</label>
                    <div className="space-y-2 text-[9px]">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>AMBIENT ILLUMINATION</span>
                          <span>{Math.round((config.ambientIntensity ?? 0.75) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="2.0"
                          step="0.05"
                          value={config.ambientIntensity !== undefined ? config.ambientIntensity : 0.75}
                          onChange={(e) => setConfig((prev) => ({ ...prev, ambientIntensity: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>SPOTLIGHT / KEY LIGHT INTENSITY</span>
                          <span>{Math.round((config.keyLightIntensity ?? 0.85) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="2.0"
                          step="0.05"
                          value={config.keyLightIntensity !== undefined ? config.keyLightIntensity : 0.85}
                          onChange={(e) => setConfig((prev) => ({ ...prev, keyLightIntensity: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-[8px] text-[#141414]/70 block">KEY LIGHT COLOR TEMP</span>
                        <div className="flex items-center gap-2 bg-white/60 border-2 border-[#141414] p-1 max-w-[150px] shadow-[2px_2px_0px_0px_#141414]">
                          <input
                            type="color"
                            value={config.keyLightColor || "#ffffff"}
                            onChange={(e) => setConfig((prev) => ({ ...prev, keyLightColor: e.target.value }))}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="uppercase font-bold text-[9px]">{config.keyLightColor || "#ffffff"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-[#141414]/10 pt-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">03 // RENDER VIEWPORT DECORATIONS</label>
                    <div className="grid grid-cols-1 gap-2">
                      <label className="flex items-center gap-2 cursor-pointer bg-white/50 border-2 border-[#141414] p-2 text-[10px] hover:bg-white select-none shadow-[2px_2px_0px_0px_#141414] transition-all">
                        <input
                          type="checkbox"
                          checked={config.showGrid !== false}
                          onChange={(e) => setConfig((prev) => ({ ...prev, showGrid: e.target.checked }))}
                          className="accent-[#141414]"
                        />
                        <span className="font-bold">SHOW GROUND COORDINATE GRID HELPER</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer bg-[#ffe4e6]/60 border-2 border-[#e11d48] p-2 text-[10px] hover:bg-[#ffe4e6] select-none shadow-[2px_2px_0px_0px_#e11d48] transition-all">
                        <input
                          type="checkbox"
                          checked={!!config.discoMode}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setConfig((prev) => ({ ...prev, discoMode: val }));
                            if (val) {
                              addLog("🕺 DISCO PARTY MODE ENGAGED! Lights cycle colors and orbit. Show us those voxel moves!", "success");
                              playSynthSound("disco");
                            } else {
                              addLog("Disco mode disengaged. Ambient workstation lighting restored.", "info");
                              playSynthSound("zap");
                            }
                          }}
                          className="accent-[#e11d48]"
                        />
                        <span className="font-bold text-[#e11d48] uppercase tracking-wider flex items-center gap-1.5">
                          <span>🕺 ACTIVE DISCO PARTY MODE (COLOR STROBES!)</span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-[#141414]/10 pt-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">04 // 2D VIEWPORT STYLE OVERLAYS (ESTHETIC FILTERS)</label>
                    <div className="grid grid-cols-3 gap-2 font-mono text-[9px] font-bold">
                      {(["none", "crt", "blueprint", "gameboy", "cyberpunk", "sketch"] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => {
                            setConfig((prev) => ({ ...prev, twoDStyleEffect: style }));
                            addLog(`Engaged 2D style effect: ${style.toUpperCase()}`, "info");
                          }}
                          className={`border-2 p-1.5 uppercase text-center transition-all cursor-pointer ${
                            (config.twoDStyleEffect || "none") === style
                              ? "bg-[#141414] text-white border-[#141414] shadow-[1px_1px_0px_0px_#141414]"
                              : "bg-white/50 text-[#141414] border-[#141414] hover:bg-white shadow-[2px_2px_0px_0px_#141414] active:translate-y-[1px]"
                          }`}
                        >
                          {style === "none" ? "None (Clean)" : style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SNAPCHAT CAMERA / SNAP STUDIO TAB */}
              {editorTab === "camera" && (
                <div className="space-y-4 text-[#141414] font-mono">
                  {/* Title Section */}
                  <div className="bg-[#D946EF]/10 border-2 border-[#D946EF] p-3 space-y-1.5 shadow-[2px_2px_0px_0px_#D946EF]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] text-[#D946EF] uppercase tracking-wider flex items-center gap-1">
                        <span>📸 SNAP SHUTTER STUDIO</span>
                      </span>
                      <span className="text-[8px] bg-[#D946EF] text-white px-1.5 py-0.5 rounded-none font-bold uppercase">LIVE VFX</span>
                    </div>
                    <p className="text-[9px] text-[#141414]/80 leading-normal">
                      Customize real camera presets, interactive Snapchat-style 3D lenses, color overlays, frames, and custom caption text. Bake your custom composite snap photo on click!
                    </p>
                  </div>

                  {/* 1. LENS SELECTOR */}
                  <div className="space-y-2 border-b border-[#141414]/10 pb-3">
                    <label className="text-[10px] uppercase font-bold text-[#141414]/85 block">01 // SELECT Interactive 3D LENS (PARTICLES)</label>
                    <div className="grid grid-cols-3 gap-2 text-[9px] font-bold">
                      {[
                        { id: "none", label: "🚫 None", desc: "Clean focus" },
                        { id: "heart-vfx", label: "💖 Love", desc: "Pulsing hearts" },
                        { id: "sparkle-vfx", label: "✨ Sparkles", desc: "Glowing gold starbox" },
                        { id: "code-vfx", label: "💚 Matrix", desc: "Falling green code" },
                        { id: "bubble-vfx", label: "🫧 Bubbles", desc: "Translucent bubbles" },
                        { id: "glow-vfx", label: "🟢 Fireflies", desc: "Enchanted floaters" },
                      ].map((lens) => (
                        <button
                          key={lens.id}
                          type="button"
                          onClick={() => {
                            setConfig((prev) => ({ ...prev, activeLens: lens.id as any }));
                            addLog(`Equipped 3D Snapchat Lens: ${lens.label.toUpperCase()}`, "success");
                            playSynthSound("jump");
                          }}
                          className={`border-2 p-1.5 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                            (config.activeLens || "none") === lens.id
                              ? "bg-[#D946EF] text-white border-[#141414] shadow-[1px_1px_0px_0px_#141414]"
                              : "bg-white/50 text-[#141414] border-[#141414] hover:bg-white shadow-[2px_2px_0px_0px_#141414] active:translate-y-[1px]"
                          }`}
                        >
                          <span>{lens.label}</span>
                          <span className="text-[7px] opacity-75 font-normal mt-0.5">{lens.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. BIG HEAD LENS SLIDER */}
                  <div className="space-y-1.5 border-b border-[#141414]/10 pb-3">
                    <div className="flex justify-between items-center font-bold">
                      <label className="text-[10px] uppercase font-bold text-[#141414]/85">02 // Snapchat Big Head Lens Factor</label>
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 border border-purple-300 font-mono">
                        {Math.round((config.bigHeadFactor || 0) * 100)}% scale
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={config.bigHeadFactor || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setConfig((prev) => ({ ...prev, bigHeadFactor: val }));
                        if (val > 0.5) {
                          playSynthSound("coin");
                        }
                      }}
                      className="w-full accent-[#D946EF] h-1.5 cursor-pointer bg-[#141414]/10"
                    />
                    <p className="text-[8px] text-[#141414]/60 italic">Drag to scale the character's head to goofy Snapchat bobble-head proportions dynamically!</p>
                  </div>

                  {/* 3. COLOR FILTER SELECTOR */}
                  <div className="space-y-2 border-b border-[#141414]/10 pb-3">
                    <label className="text-[10px] uppercase font-bold text-[#141414]/85 block">03 // VIEWPORT COLOR FILTER OVERLAY</label>
                    <div className="grid grid-cols-3 gap-2 text-[9px] font-bold">
                      {[
                        { id: "none", label: "Clean" },
                        { id: "retro", label: "📼 VHS Retro" },
                        { id: "cyber", label: "💜 Cyber Neon" },
                        { id: "sepia", label: "🎞️ Warm Sepia" },
                        { id: "pink-glow", label: "🌸 Pastel Pink" },
                        { id: "glitch", label: "⚡ Glitch Contrast" },
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => {
                            setConfig((prev) => ({ ...prev, colorFilterPreset: filter.id as any }));
                            addLog(`Applied color filter preset: ${filter.label}`, "info");
                          }}
                          className={`border-2 p-1.5 uppercase text-center transition-all cursor-pointer ${
                            (config.colorFilterPreset || "none") === filter.id
                              ? "bg-[#141414] text-white border-[#141414] shadow-[1px_1px_0px_0px_#141414]"
                              : "bg-white/50 text-[#141414] border-[#141414] hover:bg-white shadow-[2px_2px_0px_0px_#141414] active:translate-y-[1px]"
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. STORY FRAMES */}
                  <div className="space-y-2 border-b border-[#141414]/10 pb-3">
                    <label className="text-[10px] uppercase font-bold text-[#141414]/85 block">04 // PHOTO FRAME LAYOUT & OVERLAYS</label>
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-bold">
                      {[
                        { id: "none", label: "Clean Viewport" },
                        { id: "story", label: "📱 Snapchat Story (9:16)" },
                        { id: "polaroid", label: "📸 Polaroid Vintage (1:1)" },
                        { id: "cinematic", label: "🎬 Cinematic Widescreen (21:9)" },
                      ].map((frame) => (
                        <button
                          key={frame.id}
                          type="button"
                          onClick={() => {
                            setConfig((prev) => ({ ...prev, storyFrameStyle: frame.id as any }));
                            addLog(`Switched photo frame layout: ${frame.label}`, "success");
                            playSynthSound("zap");
                          }}
                          className={`border-2 p-1.5 text-center transition-all cursor-pointer ${
                            (config.storyFrameStyle || "none") === frame.id
                              ? "bg-[#D946EF] text-white border-[#141414] shadow-[1px_1px_0px_0px_#141414]"
                              : "bg-white/50 text-[#141414] border-[#141414] hover:bg-white shadow-[2px_2px_0px_0px_#141414] active:translate-y-[1px]"
                          }`}
                        >
                          {frame.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. CAPTION INPUT */}
                  <div className="space-y-2 border-b border-[#141414]/10 pb-3">
                    <label className="text-[10px] uppercase font-bold text-[#141414]/85 block">05 // Snapchat Overlay Caption text</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={40}
                        placeholder="Type standard snapchat caption..."
                        value={config.photoCaption || ""}
                        onChange={(e) => setConfig((prev) => ({ ...prev, photoCaption: e.target.value }))}
                        className="flex-1 bg-white border-2 border-[#141414] px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:border-[#D946EF] shadow-[2px_2px_0px_0px_#141414]"
                      />
                      {/* Fast emoji selector button */}
                      <select
                        value={config.photoCaptionEmoji || ""}
                        onChange={(e) => setConfig((prev) => ({ ...prev, photoCaptionEmoji: e.target.value }))}
                        className="bg-white border-2 border-[#141414] text-xs font-mono font-bold px-2 py-1 shadow-[2px_2px_0px_0px_#141414] focus:outline-none"
                      >
                        <option value="">No Emoji</option>
                        <option value="🔥">🔥 Hot</option>
                        <option value="👑">👑 Crown</option>
                        <option value="👽">👽 Alien</option>
                        <option value="💯">💯 Real</option>
                        <option value="✨">✨ Magic</option>
                        <option value="💀">💀 Ded</option>
                        <option value="GENIE_MASCOT">🧞 Genie Mascot</option>
                      </select>
                    </div>
                  </div>

                  {/* 6. BIG DOWNLOAD SNAP BUTTON */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleTakeSnap}
                      className="w-full py-3.5 px-4 font-mono text-sm font-black tracking-widest bg-gradient-to-r from-[#D946EF] via-[#FF007F] to-[#F59E0B] text-white border-3 border-[#141414] rounded-none hover:brightness-110 active:translate-y-[2px] shadow-[4px_4px_0px_0px_#141414] active:shadow-[1px_1px_0px_0px_#141414] flex items-center justify-center gap-2 uppercase cursor-pointer"
                    >
                      <span>📸 BAKE & TAKE PHOTO SNAP!</span>
                    </button>
                  </div>
                </div>
              )}
            </section>
  );
}
