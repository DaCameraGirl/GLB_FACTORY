import { useState, useEffect, useCallback, useRef, Dispatch, SetStateAction } from "react";
import { AvatarConfig, HairStyle, BodyType, HeadShape, LogEntry } from "../types";
import { MutantSpecimen, MutationSummary, MutationRarity } from "../types/mutation";
import { playSynthSound } from "../utils/playSynthSound";

function calculateSlotMachineRarity(
  chaosIntensity: number,
  maxDeviation: number
): { rarity: MutationRarity; rarityColor: string } {
  const baseRoll = Math.random();
  const luckFactor = maxDeviation * 0.08 + chaosIntensity * 0.05;
  const roll = baseRoll + luckFactor;

  if (roll > 0.995) {
    return { rarity: "CHAOTIC-DIVINE", rarityColor: "text-fuchsia-600 font-extrabold animate-pulse" };
  }
  if (roll > 0.982) {
    return { rarity: "LEGENDARY", rarityColor: "text-amber-500 font-extrabold" };
  }
  if (roll > 0.925) {
    return { rarity: "ULTRA-RARE", rarityColor: "text-purple-600 font-bold" };
  }
  if (roll > 0.81) {
    return { rarity: "RARE", rarityColor: "text-blue-600 font-bold" };
  }
  if (roll > 0.52) {
    return { rarity: "UNCOMMON", rarityColor: "text-emerald-600 font-bold" };
  }
  return { rarity: "COMMON", rarityColor: "text-neutral-500 font-medium" };
}

export function useMutationEngine(
  config: AvatarConfig,
  setConfig: Dispatch<SetStateAction<AvatarConfig>>,
  setCharacterName: (name: string) => void,
  addLog: (text: string, type?: LogEntry["type"]) => void
) {
  const [chaosIntensity, setChaosIntensity] = useState(0.85);
  const [autoMutationActive, setAutoMutationActive] = useState(false);
  const [showMutationFlow, setShowMutationFlow] = useState(false);
  const [lastMutationSummary, setLastMutationSummary] = useState<MutationSummary | null>(null);
  const [splicerParents, setSplicerParents] = useState<string[]>([]);

  // Auto-mutation loop calls handleChaosMutation on an interval; reading config
  // through a ref (instead of the useCallback dep) keeps that callback's identity
  // stable across mutations so the interval isn't torn down/restarted every tick.
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const [mutationVault, setMutationVault] = useState<MutantSpecimen[]>(() => {
    try {
      const saved = localStorage.getItem("glb_factory_mutants");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("glb_factory_mutants", JSON.stringify(mutationVault));
    } catch (err) {
      console.warn("Could not save to localStorage:", err);
    }
  }, [mutationVault]);

  const handleApplyGuidedMutation = useCallback(
    (mutationConfig: Partial<AvatarConfig>, name: string) => {
      setCharacterName(name);
      setConfig((prev) => ({ ...prev, ...mutationConfig }));

      const maxDeviation = Math.max(
        Math.abs(1.0 - (mutationConfig.headScaleX || 1.0)),
        Math.abs(1.0 - (mutationConfig.torsoScaleX || 1.0)),
        Math.abs(1.0 - (mutationConfig.armScaleX || 1.0))
      );

      const { rarity, rarityColor } = calculateSlotMachineRarity(chaosIntensity, maxDeviation);

      const buildType =
        mutationConfig.bodyType === "chibi"
          ? "Guided Chibi Design"
          : mutationConfig.bodyType === "tall"
            ? "Guided Tall Build"
            : mutationConfig.bodyType === "athletic"
              ? "Guided Athletic Frame"
              : "Guided Standard Build";

      const summary: MutationSummary = {
        name,
        rarity,
        rarityColor,
        buildType,
        mutatedGlow: mutationConfig.materialEmissive !== "#000000",
        accessoryCount: mutationConfig.accessories?.length || 0,
        symmetrySkew: "Balanced Guided Design",
      };

      setLastMutationSummary(summary);

      const vaultSpecimen: MutantSpecimen = {
        id: Math.random().toString(),
        config: { ...config, ...mutationConfig, name } as AvatarConfig,
        ...summary,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMutationVault((prev) => {
        const filtered = prev.filter((item) => item.name !== name);
        return [vaultSpecimen, ...filtered].slice(0, 40);
      });

      addLog(`[GUIDED FLOW] Created custom character '${name}' with intentional design choices.`, "success");
      playSynthSound("disco");
    },
    [chaosIntensity, config, setConfig, setCharacterName, addLog]
  );

  const handleChaosMutation = useCallback(() => {
    const prefixes = [
      "Mega", "Giga", "Cyber", "Voxel", "Byte", "Chibi", "Retro", "Mecha", "Pixel", "Spell",
      "Nexus", "Turbo", "Stellar", "Quantum", "Hyper", "Vectr", "Alpha", "Slayer", "Neon",
      "Cosmic", "Glitch", "Overlord", "Pico", "Spectre", "Buster",
    ];
    const suffixes = [
      "Bot", "Spell", "Tron", "Zero", "Wand", "Doge", "Rig", "Forge", "Pico", "Star", "Zone",
      "Nova", "Prism", "Scythe", "Dox", "Matrix", "Chrono", "Spark", "Vibe", "Voxel", "Ghost",
      "Nexus", "Glitch", "Pulse",
    ];
    const randomName =
      prefixes[Math.floor(Math.random() * prefixes.length)] +
      "_" +
      suffixes[Math.floor(Math.random() * suffixes.length)];
    setCharacterName(randomName);

    const standardSkins = ["#ffd59a", "#ffd27d", "#e5a65d", "#b45309", "#ffd8b3"];
    const cyberSkins = ["#2d3748", "#00f0ff", "#00ff66", "#ef4444", "#a855f7", "#ff007f", "#ffff00", "#111827"];
    const skinColors = chaosIntensity > 1.2 ? [...standardSkins, ...cyberSkins] : standardSkins;
    const hairColors = ["#111827", "#1e293b", "#3b82f6", "#b45309", "#eaeaea", "#000000", "#ef4444", "#a855f7", "#10b981", "#db2777"];
    const clothingColors = ["#1e3a8a", "#db2777", "#10b981", "#120e2e", "#4b5563", "#7c2d12", "#4f46e5", "#b91c1c", "#f59e0b", "#06b6d4"];
    const pantsColors = ["#111827", "#0f172a", "#000000", "#1e293b", "#374151", "#7c2d12", "#3b82f6", "#10b981"];
    const shoesColors = ["#ffffff", "#000000", "#f59e0b", "#10b981", "#db2777", "#ef4444", "#06b6d4"];
    const hairStyles: HairStyle[] = ["none", "short", "long", "afro", "ponytail", "cap"];
    const bodyTypes: BodyType[] = ["normal", "chibi", "athletic", "tall"];
    const headShapes: HeadShape[] = ["cube", "rounded-cube", "organic-smooth"];
    const accessoryPool = ["none", "crown", "wizard-hat", "halo", "glasses", "backpack", "headphones", "cat-ears"];

    const chosenSkin = skinColors[Math.floor(Math.random() * skinColors.length)];
    const chosenHair = hairColors[Math.floor(Math.random() * hairColors.length)];
    const chosenClothing = clothingColors[Math.floor(Math.random() * clothingColors.length)];
    const chosenPants = pantsColors[Math.floor(Math.random() * pantsColors.length)];
    const chosenShoes = shoesColors[Math.floor(Math.random() * shoesColors.length)];
    const chosenHairStyle = hairStyles[Math.floor(Math.random() * hairStyles.length)];
    const chosenBodyType = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
    const chosenHeadShape = headShapes[Math.floor(Math.random() * headShapes.length)];

    const chosenAccessories: ("glasses" | "backpack" | "headphones" | "halo" | "crown" | "cat-ears" | "wizard-hat")[] = [];
    const maxAccessories = chaosIntensity > 1.3 ? 3 : chaosIntensity > 0.6 ? 2 : 1;
    const shuffledAccs = [...accessoryPool].filter((x) => x !== "none").sort(() => 0.5 - Math.random());
    const accCount = Math.floor(Math.random() * (maxAccessories + 1));
    for (let i = 0; i < Math.min(accCount, shuffledAccs.length); i++) {
      chosenAccessories.push(shuffledAccs[i] as any);
    }

    const getScaledScale = (baseMin: number, baseMax: number) => {
      const minOffset = (1.0 - baseMin) * chaosIntensity;
      const maxOffset = (baseMax - 1.0) * chaosIntensity;
      const min = 1.0 - minOffset;
      const max = 1.0 + maxOffset;
      return Math.round((min + Math.random() * (max - min)) * 100) / 100;
    };

    const headScaleX = getScaledScale(0.75, 1.35);
    const headScaleY = getScaledScale(0.75, 1.35);
    const headScaleZ = getScaledScale(0.75, 1.35);
    const torsoScaleX = getScaledScale(0.75, 1.35);
    const torsoScaleZ = getScaledScale(0.75, 1.35);
    const armScaleX = getScaledScale(0.7, 1.35);
    const armScaleY = getScaledScale(0.7, 1.35);
    const armScaleZ = getScaledScale(0.7, 1.35);
    const legScaleX = getScaledScale(0.7, 1.35);
    const legScaleY = getScaledScale(0.7, 1.35);
    const legScaleZ = getScaledScale(0.7, 1.35);

    const materialRoughness = Math.round((0.05 + Math.random() * 0.9) * 100) / 100;
    const materialMetalness = Math.round(Math.random() * 0.95 * 100) / 100;
    const emissiveOdds = chaosIntensity > 1.2 ? 0.8 : 0.4;
    const isEmissive = Math.random() < emissiveOdds;
    const emissiveColors = ["#00f0ff", "#ff007f", "#39ff14", "#ffff00", "#ff4500", "#9400d3"];
    const materialEmissive = isEmissive
      ? emissiveColors[Math.floor(Math.random() * emissiveColors.length)]
      : "#000000";
    const materialEmissiveIntensity = isEmissive
      ? Math.round((0.5 + Math.random() * (1.5 * chaosIntensity)) * 100) / 100
      : 0;

    const mutatedConfig: AvatarConfig = {
      ...configRef.current,
      name: randomName,
      skinColor: chosenSkin,
      hairColor: chosenHair,
      clothingColor: chosenClothing,
      pantsColor: chosenPants,
      shoesColor: chosenShoes,
      hairStyle: chosenHairStyle,
      bodyType: chosenBodyType,
      headShape: chosenHeadShape,
      accessories: chosenAccessories,
      headScaleX,
      headScaleY,
      headScaleZ,
      torsoScaleX,
      torsoScaleZ,
      armScaleX,
      armScaleY,
      armScaleZ,
      legScaleX,
      legScaleY,
      legScaleZ,
      materialRoughness,
      materialMetalness,
      materialEmissive,
      materialEmissiveIntensity,
    };

    setConfig(mutatedConfig);

    const deviations = [
      Math.abs(1.0 - headScaleX),
      Math.abs(1.0 - headScaleY),
      Math.abs(1.0 - headScaleZ),
      Math.abs(1.0 - armScaleY),
      Math.abs(1.0 - legScaleY),
      Math.abs(1.0 - torsoScaleX),
    ];
    const maxDeviation = Math.max(...deviations);
    const { rarity, rarityColor } = calculateSlotMachineRarity(chaosIntensity, maxDeviation);

    let buildType = "Symmetric Normal";
    if (chosenBodyType === "chibi") {
      buildType = headScaleY > 1.15 ? "Bobblehead Chibi" : "Minikin Pocket-Size";
    } else if (chosenBodyType === "tall") {
      buildType = legScaleY > 1.2 ? "Colossus Giant" : "Slender Stickman";
    } else {
      if (torsoScaleX > 1.25) buildType = "Muscular Tank";
      else if (armScaleY > 1.25) buildType = "Gorilla Fighter";
      else if (maxDeviation > 0.5) buildType = "Glitch Mutant";
    }

    const armXDev = Math.abs(armScaleX - 1.0);
    const legXDev = Math.abs(legScaleX - 1.0);
    const symmetrySkew = armXDev + legXDev > 0.4 ? "Unbalanced Skeletal Warp" : "Balanced Bone Symmetry";

    const summary: MutationSummary = {
      name: randomName,
      rarity,
      rarityColor,
      buildType,
      mutatedGlow: isEmissive,
      accessoryCount: chosenAccessories.length,
      symmetrySkew,
    };

    setLastMutationSummary(summary);

    const vaultSpecimen: MutantSpecimen = {
      id: Math.random().toString(),
      config: mutatedConfig,
      ...summary,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMutationVault((prev) => {
      const filtered = prev.filter((item) => item.name !== randomName);
      return [vaultSpecimen, ...filtered].slice(0, 40);
    });

    addLog(
      `[MUTATION] Procedural Chaos Engine spawned '${randomName}' (Rarity: ${rarity}, Build: ${buildType}).`,
      "success"
    );

    if (rarity === "CHAOTIC-DIVINE" || rarity === "LEGENDARY") playSynthSound("disco");
    else if (rarity === "ULTRA-RARE" || rarity === "RARE") playSynthSound("coin");
    else playSynthSound("arp");
  }, [chaosIntensity, setConfig, setCharacterName, addLog]);

  const handleFuseGenomes = useCallback(() => {
    if (splicerParents.length !== 2) {
      addLog(
        "🧬 [GENOME SPLICER] Please select exactly 2 parent genotypes in the Vault to initiate splicing.",
        "error"
      );
      return;
    }

    const parentA = mutationVault.find((m) => m.id === splicerParents[0]);
    const parentB = mutationVault.find((m) => m.id === splicerParents[1]);

    if (!parentA || !parentB) {
      addLog("🧬 [GENOME SPLICER] Parent specimens could not be located in database.", "error");
      return;
    }

    const splitA = parentA.name.split("_");
    const splitB = parentB.name.split("_");
    const parentAPrefix = splitA[0] || parentA.name;
    const parentBSuffix = splitB[1] || splitB[0] || "Hybrid";
    const childName = `${parentAPrefix}_${parentBSuffix}`;
    setCharacterName(childName);

    const chooseOne = <T,>(a: T, b: T): T => (Math.random() > 0.5 ? a : b);
    const blendValue = (a: number = 1.0, b: number = 1.0, variation: number = 0.05) => {
      const base = (a + b) / 2;
      const offset = (Math.random() * 2 - 1) * variation;
      return Math.round(Math.max(0.4, Math.min(2.0, base + offset)) * 100) / 100;
    };

    const mergedAccessories: ("glasses" | "backpack" | "headphones" | "halo" | "crown" | "cat-ears" | "wizard-hat")[] = [];
    const allAccs = Array.from(
      new Set([...(parentA.config.accessories || []), ...(parentB.config.accessories || [])])
    );
    allAccs.sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(allAccs.length, 3); i++) {
      mergedAccessories.push(allAccs[i] as any);
    }

    const headScaleX = blendValue(parentA.config.headScaleX, parentB.config.headScaleX);
    const headScaleY = blendValue(parentA.config.headScaleY, parentB.config.headScaleY);
    const headScaleZ = blendValue(parentA.config.headScaleZ, parentB.config.headScaleZ);
    const torsoScaleX = blendValue(parentA.config.torsoScaleX, parentB.config.torsoScaleX);
    const torsoScaleZ = blendValue(parentA.config.torsoScaleZ, parentB.config.torsoScaleZ);
    const armScaleX = blendValue(parentA.config.armScaleX, parentB.config.armScaleX);
    const armScaleY = blendValue(parentA.config.armScaleY, parentB.config.armScaleY);
    const armScaleZ = blendValue(parentA.config.armScaleZ, parentB.config.armScaleZ);
    const legScaleX = blendValue(parentA.config.legScaleX, parentB.config.legScaleX);
    const legScaleY = blendValue(parentA.config.legScaleY, parentB.config.legScaleY);
    const legScaleZ = blendValue(parentA.config.legScaleZ, parentB.config.legScaleZ);
    const materialRoughness = blendValue(parentA.config.materialRoughness, parentB.config.materialRoughness);
    const materialMetalness = blendValue(parentA.config.materialMetalness, parentB.config.materialMetalness);

    const isEmissive =
      parentA.config.materialEmissive !== "#000000" ||
      parentB.config.materialEmissive !== "#000000" ||
      Math.random() < 0.35;
    const parentEmissive =
      parentA.config.materialEmissive !== "#000000"
        ? parentA.config.materialEmissive
        : parentB.config.materialEmissive;
    const childEmissive = isEmissive
      ? parentEmissive && parentEmissive !== "#000000"
        ? parentEmissive
        : "#39ff14"
      : "#000000";
    const childEmissiveIntensity = isEmissive
      ? blendValue(parentA.config.materialEmissiveIntensity || 0, parentB.config.materialEmissiveIntensity || 0, 0.2)
      : 0;

    const childBodyType = chooseOne(parentA.config.bodyType, parentB.config.bodyType);

    const childConfig: AvatarConfig = {
      ...config,
      name: childName,
      skinColor: chooseOne(parentA.config.skinColor, parentB.config.skinColor),
      hairColor: chooseOne(parentA.config.hairColor, parentB.config.hairColor),
      clothingColor: chooseOne(parentA.config.clothingColor, parentB.config.clothingColor),
      pantsColor: chooseOne(parentA.config.pantsColor, parentB.config.pantsColor),
      shoesColor: chooseOne(parentA.config.shoesColor, parentB.config.shoesColor),
      hairStyle: chooseOne(parentA.config.hairStyle, parentB.config.hairStyle),
      bodyType: childBodyType,
      headShape: chooseOne(parentA.config.headShape, parentB.config.headShape),
      accessories: mergedAccessories,
      headScaleX,
      headScaleY,
      headScaleZ,
      torsoScaleX,
      torsoScaleZ,
      armScaleX,
      armScaleY,
      armScaleZ,
      legScaleX,
      legScaleY,
      legScaleZ,
      materialRoughness,
      materialMetalness,
      materialEmissive: childEmissive,
      materialEmissiveIntensity: childEmissiveIntensity,
    };

    setConfig(childConfig);

    const maxDeviation = Math.max(
      Math.abs(1.0 - headScaleX),
      Math.abs(1.0 - headScaleY),
      Math.abs(1.0 - headScaleZ),
      Math.abs(1.0 - armScaleY),
      Math.abs(1.0 - legScaleY),
      Math.abs(1.0 - torsoScaleX)
    );
    const { rarity, rarityColor } = calculateSlotMachineRarity(chaosIntensity, maxDeviation);
    const buildType = `Spliced ${childBodyType === "chibi" ? "Minikin" : childBodyType === "tall" ? "Titan" : "Hybrid"}`;
    const symmetrySkew =
      Math.abs(armScaleX - 1.0) + Math.abs(legScaleX - 1.0) > 0.4
        ? "Unbalanced Skeletal Warp"
        : "Balanced Bone Symmetry";

    const childMutant: MutantSpecimen = {
      id: Math.random().toString(),
      config: childConfig,
      name: childName,
      rarity,
      rarityColor,
      buildType,
      mutatedGlow: isEmissive,
      accessoryCount: mergedAccessories.length,
      symmetrySkew,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMutationVault((prev) => {
      const filtered = prev.filter((item) => item.name !== childName);
      return [childMutant, ...filtered].slice(0, 40);
    });
    setLastMutationSummary(childMutant);
    setSplicerParents([]);

    addLog(
      `🧬 [GENOME SPLICER] Spiced & spliced! Offspring '${childName}' synthesized successfully. Added to genotype crypt!`,
      "success"
    );
    playSynthSound("disco");
  }, [splicerParents, mutationVault, config, chaosIntensity, setConfig, setCharacterName, addLog]);

  const toggleParentSelection = useCallback(
    (id: string) => {
      setSplicerParents((prev) => {
        if (prev.includes(id)) {
          playSynthSound("zap");
          return prev.filter((x) => x !== id);
        }
        if (prev.length >= 2) {
          playSynthSound("zap");
          addLog(
            "🧬 [GENOME SPLICER] Maximum parent selection reached (2). Deselect a parent before selecting another.",
            "info"
          );
          return prev;
        }
        playSynthSound("coin");
        return [...prev, id];
      });
    },
    [addLog]
  );

  return {
    chaosIntensity,
    setChaosIntensity,
    autoMutationActive,
    setAutoMutationActive,
    showMutationFlow,
    setShowMutationFlow,
    lastMutationSummary,
    mutationVault,
    setMutationVault,
    splicerParents,
    setSplicerParents,
    handleApplyGuidedMutation,
    handleChaosMutation,
    handleFuseGenomes,
    toggleParentSelection,
  };
}
