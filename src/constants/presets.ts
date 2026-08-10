import { AvatarConfig, HairStyle, BodyType } from "../types";

// ==========================================
// 🌟 PREMIUM ENTERPRISE HERO GALLERY PRESETS
// ==========================================
export interface PresetHero {
  name: string;
  emoji: string;
  badge: string;
  config: Partial<AvatarConfig>;
}

export interface CreatureVariantPreset {
  label: string;
  skinColor: string;
  hairColor: string;
  bodyType?: BodyType;
  hairStyle?: HairStyle;
  clothingColor?: string;
  pantsColor?: string;
  accessories: NonNullable<AvatarConfig["accessories"]>;
}

export const CREATURE_VARIANTS: Record<string, CreatureVariantPreset> = {
  gremlin: { label: "🧌 Gremlin (Creature)", skinColor: "#3f6212", hairColor: "#1a2e05", accessories: ["horns", "tail", "cat-ears"] },
  monster: { label: "👹 Monster (Chaotic)", skinColor: "#57534e", hairColor: "#1c1917", bodyType: "athletic", accessories: ["horns", "tail", "snout"] },
  gator: { label: "🐊 Alligator", skinColor: "#365314", hairColor: "#1a2e05", accessories: [] },
  raccoon: { label: "🦝 Raccoon", skinColor: "#78716c", hairColor: "#1c1917", accessories: ["tail", "whiskers", "cat-ears"] },
  cat: { label: "🐱 Cat", skinColor: "#ea9a3e", hairColor: "#78350f", accessories: ["cat-ears", "tail", "whiskers"] },
  dog: { label: "🐶 Dog", skinColor: "#92400e", hairColor: "#451a03", accessories: ["tail"] },
  lizard: { label: "🦎 Lizard", skinColor: "#4d7c0f", hairColor: "#1a2e05", accessories: ["tail"] },
  possum: { label: "🐀 Possum", skinColor: "#d6d3d1", hairColor: "#57534e", accessories: ["tail", "whiskers"] },
  tigerfish: { label: "🐠 Tiger Fish", skinColor: "#ea580c", hairColor: "#1c1917", accessories: ["fins", "tail"] },
  lionfish: { label: "🦁🐟 Lionfish", skinColor: "#fde68a", hairColor: "#b91c1c", accessories: ["fins"] },
  clown: {
    label: "🤡 Evil Clown",
    skinColor: "#f5f5f4",
    hairColor: "#16a34a",
    hairStyle: "afro",
    clothingColor: "#7f1d1d",
    pantsColor: "#111827",
    accessories: [],
  },
  dragon: {
    label: "🐉 Dragon",
    skinColor: "#3f6212",
    hairColor: "#1c1917",
    bodyType: "athletic",
    hairStyle: "none",
    accessories: [],
  },
  fairy: {
    label: "🧚 Dark Fairy",
    skinColor: "#c4b5fd",
    hairColor: "#581c87",
    clothingColor: "#1e1030",
    accessories: [],
  },
  hammerhead: {
    label: "🔨🦈 Hammerhead Shark",
    skinColor: "#57606f",
    hairColor: "#27272a",
    hairStyle: "none",
    accessories: [],
  },
  // --- True animals & weird fauna (non-humanoid body plans) ---
  octopus: {
    label: "🐙 Twelve-Arm Octopus (Weird)",
    skinColor: "#7c3aed",
    hairColor: "#4c1d95",
    hairStyle: "none",
    clothingColor: "#5b21b6",
    pantsColor: "#4c1d95",
    accessories: [],
  },
  spider: {
    label: "🕷️ Giant Spider",
    skinColor: "#1c1917",
    hairColor: "#0c0a09",
    hairStyle: "none",
    clothingColor: "#292524",
    pantsColor: "#1c1917",
    accessories: [],
  },
  snake: {
    label: "🐍 Serpent",
    skinColor: "#1a4d2e",
    hairColor: "#0d3b1e",
    hairStyle: "none",
    clothingColor: "#2d8a4e",
    pantsColor: "#0f2818",
    accessories: [],
  },
  bat: {
    label: "🦇 Cave Bat",
    skinColor: "#44403c",
    hairColor: "#1c1917",
    hairStyle: "none",
    clothingColor: "#292524",
    pantsColor: "#1c1917",
    accessories: [],
  },
  crow: {
    label: "🐦‍⬛ Murder Crow",
    skinColor: "#18181b",
    hairColor: "#09090b",
    hairStyle: "none",
    clothingColor: "#27272a",
    pantsColor: "#18181b",
    accessories: [],
  },
  rat: {
    label: "🐀 Plague Rat",
    skinColor: "#a8a29e",
    hairColor: "#57534e",
    hairStyle: "none",
    clothingColor: "#78716c",
    pantsColor: "#57534e",
    accessories: ["whiskers"],
  },
  centipede: {
    label: "🐛 Centipede Horror",
    skinColor: "#854d0e",
    hairColor: "#422006",
    hairStyle: "none",
    clothingColor: "#a16207",
    pantsColor: "#713f12",
    accessories: [],
  },
  "biped-lizard": {
    label: "🦎 Two-Leg Lizard (Biped)",
    skinColor: "#4d7c0f",
    hairColor: "#1a2e05",
    hairStyle: "none",
    clothingColor: "#3f6212",
    pantsColor: "#365314",
    bodyType: "athletic",
    accessories: ["tail"],
  },
  toad: {
    label: "🐸 Swamp Toad",
    skinColor: "#3f6212",
    hairColor: "#1a2e05",
    hairStyle: "none",
    clothingColor: "#4d7c0f",
    pantsColor: "#365314",
    bodyType: "chibi",
    accessories: [],
  },
  scorpion: {
    label: "🦂 Emperor Scorpion",
    skinColor: "#0a0a0a",
    hairColor: "#ffae00",
    hairStyle: "none",
    clothingColor: "#1a1a1a",
    pantsColor: "#0a0a0a",
    materialEmissive: "#ff0033",
    accessories: [],
  },
  worm: {
    label: "🪱 Grave Worm",
    skinColor: "#fbcfe8",
    hairColor: "#9d174d",
    hairStyle: "none",
    clothingColor: "#f9a8d4",
    pantsColor: "#db2777",
    accessories: [],
  },
  mantis: {
    label: "🦗 Praying Mantis",
    skinColor: "#65a30d",
    hairColor: "#3f6212",
    hairStyle: "none",
    clothingColor: "#4d7c0f",
    pantsColor: "#365314",
    bodyType: "tall",
    accessories: [],
  },
};

export const PRESET_HEROES: PresetHero[] = [
  {
    name: "Nexus Zero",
    emoji: "🥷",
    badge: "CYBERPUNK NINJA",
    config: {
      skinColor: "#2d3748",
      hairColor: "#000000",
      clothingColor: "#0f172a",
      pantsColor: "#000000",
      shoesColor: "#10b981",
      hairStyle: "none",
      bodyType: "athletic",
      headShape: "cube",
      accessories: ["halo"],
      materialRoughness: 0.2,
      materialMetalness: 0.8,
      materialEmissive: "#00f0ff",
      materialEmissiveIntensity: 1.5,
      twoDStyleEffect: "cyberpunk",
    }
  },
  {
    name: "Gemini Spellcaster",
    emoji: "🧙‍♂️",
    badge: "GEMINI WIZARD",
    config: {
      skinColor: "#ffd59a",
      hairColor: "#eaeaea",
      clothingColor: "#1d4ed8",
      pantsColor: "#0f172a",
      shoesColor: "#000000",
      hairStyle: "long",
      bodyType: "tall",
      headShape: "organic-smooth",
      accessories: ["wizard-hat", "glasses"],
      materialRoughness: 0.8,
      materialMetalness: 0.0,
      materialEmissive: "#3b82f6",
      materialEmissiveIntensity: 0.8,
      twoDStyleEffect: "blueprint",
    }
  },
  {
    name: "Princess Voxia",
    emoji: "👑",
    badge: "ROYAL MECHA",
    config: {
      skinColor: "#f3cbc0",
      hairColor: "#b45309",
      clothingColor: "#db2777",
      pantsColor: "#9d174d",
      shoesColor: "#ffffff",
      hairStyle: "ponytail",
      bodyType: "normal",
      headShape: "rounded-cube",
      accessories: ["crown"],
      materialRoughness: 0.1,
      materialMetalness: 0.95,
      materialEmissive: "#ff007f",
      materialEmissiveIntensity: 0.5,
      twoDStyleEffect: "crt",
    }
  },
  {
    name: "NekoChibi Gamer",
    emoji: "🐾",
    badge: "CHIBI STREAMER",
    config: {
      skinColor: "#ffeedd",
      hairColor: "#db2777",
      clothingColor: "#111827",
      pantsColor: "#374151",
      shoesColor: "#ffffff",
      hairStyle: "long",
      bodyType: "chibi",
      headShape: "organic-smooth",
      accessories: ["cat-ears", "headphones"],
      materialRoughness: 0.6,
      materialMetalness: 0.1,
      materialEmissive: "#db2777",
      materialEmissiveIntensity: 0.4,
      twoDStyleEffect: "none",
    }
  },
  {
    name: "The Golden Android",
    emoji: "🤖",
    badge: "ENTERPRISE SPEC",
    config: {
      skinColor: "#f59e0b",
      hairColor: "#000000",
      clothingColor: "#1e293b",
      pantsColor: "#0f172a",
      shoesColor: "#f59e0b",
      hairStyle: "none",
      bodyType: "athletic",
      headShape: "rounded-cube",
      accessories: ["halo"],
      materialRoughness: 0.05,
      materialMetalness: 0.98,
      materialEmissive: "#f59e0b",
      materialEmissiveIntensity: 1.2,
      twoDStyleEffect: "none",
    }
  },
  {
    name: "Astral Valkyrie",
    emoji: "🛡️",
    badge: "VALKYRIE LEGEND",
    config: {
      skinColor: "#fde047",
      hairColor: "#ffffff",
      clothingColor: "#ffffff",
      pantsColor: "#111827",
      shoesColor: "#facc15",
      hairStyle: "ponytail",
      bodyType: "athletic",
      headShape: "organic-smooth",
      accessories: ["crown", "wings", "halo"],
      materialRoughness: 0.1,
      materialMetalness: 0.9,
      materialEmissive: "#fbbf24",
      materialEmissiveIntensity: 1.4,
      twoDStyleEffect: "none",
    }
  },
  {
    name: "Deep Sea Explorer",
    emoji: "🦑",
    badge: "SUB-AQUA EXPLORER",
    config: {
      skinColor: "#22d3ee",
      hairColor: "#0e7490",
      clothingColor: "#083344",
      pantsColor: "#0f172a",
      shoesColor: "#22d3ee",
      hairStyle: "none",
      bodyType: "normal",
      headShape: "rounded-cube",
      accessories: ["headphones", "glasses", "backpack"],
      materialRoughness: 0.2,
      materialMetalness: 0.85,
      materialEmissive: "#06b6d4",
      materialEmissiveIntensity: 1.0,
      twoDStyleEffect: "none",
    }
  },
  {
    name: "Dread Warlord",
    emoji: "👿",
    badge: "HELL KNIGHT",
    config: {
      skinColor: "#f87171",
      hairColor: "#7f1d1d",
      clothingColor: "#111827",
      pantsColor: "#000000",
      shoesColor: "#7f1d1d",
      hairStyle: "none",
      bodyType: "athletic",
      headShape: "cube",
      accessories: ["horns", "cape", "cyber-visor"],
      materialRoughness: 0.3,
      materialMetalness: 0.75,
      materialEmissive: "#ef4444",
      materialEmissiveIntensity: 1.6,
      twoDStyleEffect: "crt",
    }
  },
  {
    name: "Steampunk Aviator",
    emoji: "⚙️",
    badge: "STEAM ADVENTURER",
    config: {
      skinColor: "#fed7aa",
      hairColor: "#7c2d12",
      clothingColor: "#78350f",
      pantsColor: "#451a03",
      shoesColor: "#78350f",
      hairStyle: "cap",
      bodyType: "tall",
      headShape: "organic-smooth",
      accessories: ["glasses", "backpack"],
      materialRoughness: 0.55,
      materialMetalness: 0.4,
      materialEmissive: "#ea580c",
      materialEmissiveIntensity: 0.5,
      twoDStyleEffect: "none",
    }
  },
  {
    name: "Cosmic Void-Walk",
    emoji: "🌌",
    badge: "VOID ANOMALY",
    config: {
      skinColor: "#581c87",
      hairColor: "#a855f7",
      clothingColor: "#120e2e",
      pantsColor: "#020617",
      shoesColor: "#d946ef",
      hairStyle: "none",
      bodyType: "chibi",
      headShape: "organic-smooth",
      accessories: ["cat-ears", "wings", "halo"],
      materialRoughness: 0.1,
      materialMetalness: 0.95,
      materialEmissive: "#d946ef",
      materialEmissiveIntensity: 1.2,
      twoDStyleEffect: "cyberpunk",
    }
  }
];

export const COLOR_PALETTES = [
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
  }
];
