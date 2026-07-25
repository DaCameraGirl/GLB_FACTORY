import { AvatarConfig } from "../types";

export type MutationRarity =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "ULTRA-RARE"
  | "LEGENDARY"
  | "CHAOTIC-DIVINE";

export interface MutationSummary {
  name: string;
  rarity: MutationRarity;
  rarityColor: string;
  buildType: string;
  mutatedGlow: boolean;
  accessoryCount: number;
  symmetrySkew: string;
}

export interface MutantSpecimen extends MutationSummary {
  id: string;
  config: AvatarConfig;
  timestamp: string;
}

export type StudioMode = "select" | "create" | "mutate";
