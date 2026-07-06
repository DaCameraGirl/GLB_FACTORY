export type HairStyle = "none" | "short" | "long" | "afro" | "ponytail" | "cap";
export type BodyType = "normal" | "chibi" | "tall" | "athletic";
export type HeadShape = "cube" | "rounded-cube" | "organic-smooth";

export interface AvatarConfig {
  name: string;
  skinColor: string;
  hairColor: string;
  clothingColor: string;
  pantsColor: string;
  shoesColor: string;
  hairStyle: HairStyle;
  bodyType: BodyType;
  headShape: HeadShape;
  featherEdges: boolean;
  featherRadius: number; // 0 to 100
  cropX: number; // percentage offset
  cropY: number; // percentage offset
  cropScale: number; // magnification
  detailLevel?: "low" | "medium" | "high";
  accessories?: ("glasses" | "backpack" | "headphones")[];
  clothingStyle?: "tshirt" | "hoodie" | "armor" | "dress";
  expression?: "neutral" | "happy" | "angry" | "sad" | "surprised";
  morphSlender?: number; // 0 to 1
  morphBulk?: number; // 0 to 1
}

export interface DetectionResult {
  face_box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] (0-100)
  skin_tone: string;
  hair_color: string;
  clothing_color: string;
  gender_style: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  text: string;
  type: "info" | "success" | "warning" | "error";
}
