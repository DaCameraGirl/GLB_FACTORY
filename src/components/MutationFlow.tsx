import React, { useState } from "react";
import { AvatarConfig, HairStyle, BodyType, HeadShape } from "../types";
import { ArrowRight, ArrowLeft, CheckCircle, Sparkles, Palette, User, Sliders } from "lucide-react";

interface MutationFlowProps {
  currentConfig: AvatarConfig;
  onApplyMutation: (config: Partial<AvatarConfig>, name: string) => void;
  onClose: () => void;
}

interface ColorPalette {
  name: string;
  skin: string;
  hair: string;
  clothing: string;
  pants: string;
  shoes: string;
}

const COLOR_PALETTES: ColorPalette[] = [
  {
    name: "PICO-8",
    skin: "#ffccaa",
    hair: "#5f574f",
    clothing: "#ff004d",
    pants: "#29adff",
    shoes: "#ffa300"
  },
  {
    name: "Cyber Neon",
    skin: "#00f0ff",
    hair: "#ff007f",
    clothing: "#120e2e",
    pants: "#000000",
    shoes: "#00f0ff"
  },
  {
    name: "Minty Pastel",
    skin: "#ffeedd",
    hair: "#a7f3d0",
    clothing: "#f472b6",
    pants: "#818cf8",
    shoes: "#ffffff"
  },
  {
    name: "Mecha Gold",
    skin: "#ffd27d",
    hair: "#2b1d0c",
    clothing: "#b45309",
    pants: "#7c2d12",
    shoes: "#f59e0b"
  },
  {
    name: "Monochrome Steel",
    skin: "#d1d5db",
    hair: "#1f2937",
    clothing: "#4b5563",
    pants: "#111827",
    shoes: "#9ca3af"
  },
  {
    name: "Natural Tones",
    skin: "#e5a65d",
    hair: "#211510",
    clothing: "#1e3a8a",
    pants: "#111827",
    shoes: "#ffffff"
  }
];

export default function MutationFlow({ currentConfig, onApplyMutation, onClose }: MutationFlowProps) {
  const [step, setStep] = useState(1);
  const [characterName, setCharacterName] = useState("");
  
  // Step 1: Body & Head
  const [bodyType, setBodyType] = useState<BodyType>(currentConfig.bodyType || "normal");
  const [headShape, setHeadShape] = useState<HeadShape>(currentConfig.headShape || "organic-smooth");
  
  // Step 2: Colors
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null);
  const [skinColor, setSkinColor] = useState(currentConfig.skinColor);
  const [hairColor, setHairColor] = useState(currentConfig.hairColor);
  const [clothingColor, setClothingColor] = useState(currentConfig.clothingColor);
  const [pantsColor, setPantsColor] = useState(currentConfig.pantsColor);
  const [shoesColor, setShoesColor] = useState(currentConfig.shoesColor);
  
  // Step 3: Style
  const [hairStyle, setHairStyle] = useState<HairStyle>(currentConfig.hairStyle || "short");
  const [accessories, setAccessories] = useState<Array<"glasses" | "backpack" | "headphones" | "halo" | "crown" | "cat-ears" | "wizard-hat">>(
    currentConfig.accessories || []
  );
  
  // Step 4: Proportions
  const [headScale, setHeadScale] = useState(1.0);
  const [torsoWidth, setTorsoWidth] = useState(1.0);
  const [limbThickness, setLimbThickness] = useState(1.0);
  
  // Step 5: Materials
  const [materialRoughness, setMaterialRoughness] = useState(currentConfig.materialRoughness || 0.8);
  const [materialMetalness, setMaterialMetalness] = useState(currentConfig.materialMetalness || 0.05);
  const [enableGlow, setEnableGlow] = useState(false);
  const [glowColor, setGlowColor] = useState("#00f0ff");
  const [glowIntensity, setGlowIntensity] = useState(1.0);

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleApplyPalette = (palette: ColorPalette) => {
    setSelectedPalette(palette);
    setSkinColor(palette.skin);
    setHairColor(palette.hair);
    setClothingColor(palette.clothing);
    setPantsColor(palette.pants);
    setShoesColor(palette.shoes);
  };

  const toggleAccessory = (accessory: typeof accessories[number]) => {
    if (accessories.includes(accessory)) {
      setAccessories(accessories.filter(a => a !== accessory));
    } else {
      setAccessories([...accessories, accessory]);
    }
  };

  const handleFinish = () => {
    const finalName = characterName || `Custom_${Date.now().toString(36)}`;
    
    const mutationConfig: Partial<AvatarConfig> = {
      name: finalName,
      bodyType,
      headShape,
      skinColor,
      hairColor,
      clothingColor,
      pantsColor,
      shoesColor,
      hairStyle,
      accessories,
      headScaleX: headScale,
      headScaleY: headScale,
      headScaleZ: headScale,
      torsoScaleX: torsoWidth,
      torsoScaleZ: torsoWidth,
      armScaleX: limbThickness,
      armScaleY: limbThickness,
      armScaleZ: limbThickness,
      legScaleX: limbThickness,
      legScaleY: limbThickness,
      legScaleZ: limbThickness,
      materialRoughness,
      materialMetalness,
      materialEmissive: enableGlow ? glowColor : "#000000",
      materialEmissiveIntensity: enableGlow ? glowIntensity : 0,
    };

    onApplyMutation(mutationConfig, finalName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#E4E3E0] border-4 border-[#141414] rounded-none shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#141414] text-[#E4E3E0] p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E4E3E0] text-[#141414] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider">Guided Mutation Flow</h2>
              <p className="text-[10px] opacity-70 font-mono">Step {step} of {totalSteps} — Choose Your Vibes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#E4E3E0] hover:text-white text-xl font-bold px-2"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-[#D4D3D0] p-4 border-b-2 border-[#141414]">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 mx-1 border-2 border-[#141414] transition-all ${
                  s <= step ? "bg-[#141414]" : "bg-white"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] font-mono font-bold uppercase text-[#141414]/60">
            <span className={step === 1 ? "text-[#141414]" : ""}>Body</span>
            <span className={step === 2 ? "text-[#141414]" : ""}>Colors</span>
            <span className={step === 3 ? "text-[#141414]" : ""}>Style</span>
            <span className={step === 4 ? "text-[#141414]" : ""}>Proportions</span>
            <span className={step === 5 ? "text-[#141414]" : ""}>Materials</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* STEP 1: BODY & HEAD */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h3 className="font-mono text-sm font-bold uppercase text-[#141414] flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Step 1: Choose Body Structure</span>
                </h3>
                <p className="text-xs text-[#141414]/70 font-mono">
                  Select the base mesh topology and proportions for your character.
                </p>
              </div>

              {/* Character Name */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">Character Name (Optional)</label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="e.g., Cyber_Knight"
                  className="w-full bg-white border-2 border-[#141414] px-3 py-2 rounded-none text-xs text-[#141414] focus:outline-none font-mono tracking-wide shadow-[2px_2px_0px_0px_#141414]"
                />
              </div>

              {/* Body Type */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">Body Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["normal", "chibi", "tall", "athletic"] as BodyType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setBodyType(type)}
                      className={`border-2 p-4 text-left transition-all cursor-pointer rounded-none ${
                        bodyType === type
                          ? "bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-none"
                          : "bg-white text-[#141414] border-[#141414] hover:bg-white/80 shadow-[3px_3px_0px_0px_#141414]"
                      }`}
                    >
                      <div className="text-xs font-bold uppercase font-mono">{type}</div>
                      <div className={`text-[10px] mt-1 ${bodyType === type ? "text-[#E4E3E0]/70" : "text-[#141414]/60"}`}>
                        {type === "normal" && "Standard blocky proportions"}
                        {type === "chibi" && "Cute miniature style"}
                        {type === "tall" && "Elongated slim build"}
                        {type === "athletic" && "Wide muscular frame"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Head Shape */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">Head Shape</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["organic-smooth", "rounded-cube", "cube"] as HeadShape[]).map((shape) => (
                    <button
                      key={shape}
                      onClick={() => setHeadShape(shape)}
                      className={`border-2 p-3 text-center transition-all cursor-pointer rounded-none ${
                        headShape === shape
                          ? "bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-none"
                          : "bg-white text-[#141414] border-[#141414] hover:bg-white/80 shadow-[2px_2px_0px_0px_#141414]"
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase font-mono">
                        {shape === "organic-smooth" && "Organic"}
                        {shape === "rounded-cube" && "Rounded"}
                        {shape === "cube" && "Blocky"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLORS */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h3 className="font-mono text-sm font-bold uppercase text-[#141414] flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <span>Step 2: Choose Color Palette</span>
                </h3>
                <p className="text-xs text-[#141414]/70 font-mono">
                  Pick a preset palette or customize individual colors.
                </p>
              </div>

              {/* Palette Presets */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">Quick Palettes</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {COLOR_PALETTES.map((palette) => (
                    <button
                      key={palette.name}
                      onClick={() => handleApplyPalette(palette)}
                      className={`border-2 p-3 text-left transition-all cursor-pointer rounded-none ${
                        selectedPalette?.name === palette.name
                          ? "bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-none"
                          : "bg-white text-[#141414] border-[#141414] hover:bg-white/80 shadow-[2px_2px_0px_0px_#141414]"
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase font-mono mb-2">{palette.name}</div>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 border border-[#141414]" style={{ backgroundColor: palette.skin }} />
                        <div className="w-4 h-4 border border-[#141414]" style={{ backgroundColor: palette.hair }} />
                        <div className="w-4 h-4 border border-[#141414]" style={{ backgroundColor: palette.clothing }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="space-y-3 border-t-2 border-[#141414]/20 pt-4">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">Custom Colors</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Skin", value: skinColor, setter: setSkinColor },
                    { label: "Hair", value: hairColor, setter: setHairColor },
                    { label: "Clothing", value: clothingColor, setter: setClothingColor },
                    { label: "Pants", value: pantsColor, setter: setPantsColor },
                    { label: "Shoes", value: shoesColor, setter: setShoesColor },
                  ].map((color) => (
                    <div key={color.label} className="space-y-1">
                      <label className="font-mono text-[9px] text-[#141414]/70 font-bold uppercase">{color.label}</label>
                      <div className="flex items-center gap-2 bg-white border-2 border-[#141414] p-2 shadow-[2px_2px_0px_0px_#141414]">
                        <input
                          type="color"
                          value={color.value}
                          onChange={(e) => color.setter(e.target.value)}
                          className="w-6 h-6 cursor-pointer border border-[#141414]"
                        />
                        <span className="text-[10px] font-mono uppercase font-bold">{color.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: STYLE */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h3 className="font-mono text-sm font-bold uppercase text-[#141414] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Step 3: Hair & Accessories</span>
                </h3>
                <p className="text-xs text-[#141414]/70 font-mono">
                  Add personality with hairstyles and equipment.
                </p>
              </div>

              {/* Hair Style */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">Hairstyle</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["none", "short", "long", "afro", "ponytail", "cap"] as HairStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => setHairStyle(style)}
                      className={`border-2 p-3 text-center transition-all cursor-pointer rounded-none ${
                        hairStyle === style
                          ? "bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-none"
                          : "bg-white text-[#141414] border-[#141414] hover:bg-white/80 shadow-[2px_2px_0px_0px_#141414]"
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase font-mono">{style}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accessories */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">Accessories (Select Multiple)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "glasses", label: "👓 Glasses" },
                    { id: "headphones", label: "🎧 Headphones" },
                    { id: "backpack", label: "🎒 Backpack" },
                    { id: "halo", label: "⭐ Halo" },
                    { id: "crown", label: "👑 Crown" },
                    { id: "cat-ears", label: "🐱 Cat Ears" },
                    { id: "wizard-hat", label: "🧙 Wizard Hat" },
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => toggleAccessory(acc.id as any)}
                      className={`border-2 p-2 text-left transition-all cursor-pointer rounded-none text-xs font-mono ${
                        accessories.includes(acc.id as any)
                          ? "bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-none"
                          : "bg-white text-[#141414] border-[#141414] hover:bg-white/80 shadow-[2px_2px_0px_0px_#141414]"
                      }`}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PROPORTIONS */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h3 className="font-mono text-sm font-bold uppercase text-[#141414] flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span>Step 4: Fine-Tune Proportions</span>
                </h3>
                <p className="text-xs text-[#141414]/70 font-mono">
                  Adjust scale factors for unique body proportions.
                </p>
              </div>

              <div className="space-y-4">
                {/* Head Scale */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                    <span>HEAD SIZE</span>
                    <span>{headScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.6"
                    step="0.05"
                    value={headScale}
                    onChange={(e) => setHeadScale(parseFloat(e.target.value))}
                    className="w-full accent-[#141414] h-2 cursor-pointer bg-[#141414]/10"
                  />
                </div>

                {/* Torso Width */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                    <span>TORSO WIDTH</span>
                    <span>{torsoWidth.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.6"
                    step="0.05"
                    value={torsoWidth}
                    onChange={(e) => setTorsoWidth(parseFloat(e.target.value))}
                    className="w-full accent-[#141414] h-2 cursor-pointer bg-[#141414]/10"
                  />
                </div>

                {/* Limb Thickness */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                    <span>LIMB THICKNESS</span>
                    <span>{limbThickness.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.6"
                    step="0.05"
                    value={limbThickness}
                    onChange={(e) => setLimbThickness(parseFloat(e.target.value))}
                    className="w-full accent-[#141414] h-2 cursor-pointer bg-[#141414]/10"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-300 p-3 rounded-none">
                <p className="text-[10px] font-mono text-blue-800">
                  💡 <strong>TIP:</strong> Extreme values create unique mutant styles. Try 1.5x head with 0.7x limbs for a bobblehead look!
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: MATERIALS */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h3 className="font-mono text-sm font-bold uppercase text-[#141414] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Step 5: Material Properties</span>
                </h3>
                <p className="text-xs text-[#141414]/70 font-mono">
                  Set surface finish and optional glow effects.
                </p>
              </div>

              <div className="space-y-4">
                {/* Roughness */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                    <span>ROUGHNESS (Matte vs Shiny)</span>
                    <span>{Math.round(materialRoughness * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={materialRoughness}
                    onChange={(e) => setMaterialRoughness(parseFloat(e.target.value))}
                    className="w-full accent-[#141414] h-2 cursor-pointer bg-[#141414]/10"
                  />
                </div>

                {/* Metalness */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                    <span>METALNESS (Metallic Reflection)</span>
                    <span>{Math.round(materialMetalness * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={materialMetalness}
                    onChange={(e) => setMaterialMetalness(parseFloat(e.target.value))}
                    className="w-full accent-[#141414] h-2 cursor-pointer bg-[#141414]/10"
                  />
                </div>

                {/* Emissive Glow */}
                <div className="space-y-3 border-t-2 border-[#141414]/20 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableGlow}
                      onChange={(e) => setEnableGlow(e.target.checked)}
                      className="accent-[#141414] w-4 h-4"
                    />
                    <span className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">
                      Enable Cyber Glow (Emissive)
                    </span>
                  </label>

                  {enableGlow && (
                    <div className="space-y-3 pl-6">
                      <div className="space-y-2">
                        <label className="font-mono text-[9px] text-[#141414]/70 font-bold uppercase">Glow Color</label>
                        <div className="flex items-center gap-2 bg-white border-2 border-[#141414] p-2 shadow-[2px_2px_0px_0px_#141414]">
                          <input
                            type="color"
                            value={glowColor}
                            onChange={(e) => setGlowColor(e.target.value)}
                            className="w-6 h-6 cursor-pointer border border-[#141414]"
                          />
                          <span className="text-[10px] font-mono uppercase font-bold">{glowColor}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                          <span>GLOW INTENSITY</span>
                          <span>{glowIntensity.toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="2.0"
                          step="0.1"
                          value={glowIntensity}
                          onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
                          className="w-full accent-[#141414] h-2 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-300 p-3 rounded-none">
                <p className="text-[10px] font-mono text-green-800">
                  ✅ <strong>READY:</strong> Review your choices and click "Create Character" to apply!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-[#D4D3D0] p-4 border-t-2 border-[#141414] flex items-center justify-between sticky bottom-0">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase border-2 border-[#141414] transition-all ${
              step === 1
                ? "bg-white/50 text-[#141414]/30 cursor-not-allowed"
                : "bg-white text-[#141414] hover:bg-white/80 shadow-[2px_2px_0px_0px_#141414] cursor-pointer"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] hover:bg-black shadow-[2px_2px_0px_0px_#141414] cursor-pointer transition-all"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-2 font-mono text-xs font-bold uppercase bg-emerald-500 text-white border-2 border-[#141414] hover:bg-emerald-600 shadow-[3px_3px_0px_0px_#141414] cursor-pointer transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Create Character</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
