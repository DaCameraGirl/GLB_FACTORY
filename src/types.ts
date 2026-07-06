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
  accessories?: ("glasses" | "backpack" | "headphones" | "halo" | "crown" | "cat-ears" | "wizard-hat")[];
  clothingStyle?: "tshirt" | "hoodie" | "armor" | "dress";
  expression?: "neutral" | "happy" | "angry" | "sad" | "surprised";
  morphSlender?: number; // 0 to 1
  morphBulk?: number; // 0 to 1
  animationMode?: "idle" | "walk" | "dance" | "zombie" | "spin" | "ninja";
  discoMode?: boolean;

  // Material parameters (Blender style overrides)
  materialRoughness?: number; // 0 to 1
  materialMetalness?: number; // 0 to 1
  wireframeMode?: boolean;
  materialEmissive?: string;
  materialEmissiveIntensity?: number;

  // Manual transform offsets (X, Y, Z sliders)
  headScaleX?: number;
  headScaleY?: number;
  headScaleZ?: number;
  headRotateX?: number; // radians
  headRotateY?: number; // radians
  headRotateZ?: number; // radians
  headTranslateX?: number;
  headTranslateY?: number;
  headTranslateZ?: number;

  torsoScaleX?: number;
  torsoScaleY?: number;
  torsoScaleZ?: number;
  torsoTranslateX?: number;
  torsoTranslateY?: number;
  torsoTranslateZ?: number;

  armScaleX?: number;
  armScaleY?: number;
  armScaleZ?: number;

  legScaleX?: number;
  legScaleY?: number;
  legScaleZ?: number;

  // Lighting & Viewport helpers (Blender Render Workspace)
  showGrid?: boolean;
  ambientIntensity?: number;
  keyLightIntensity?: number;
  keyLightColor?: string;
  cameraFov?: number;
  cameraPreset?: "front" | "side" | "top" | "isometric";
  twoDStyleEffect?: "none" | "crt" | "blueprint" | "gameboy" | "cyberpunk" | "sketch";

  // Manual Armature Bones Posing (Blender-killing armature controllers)
  poseHeadYaw?: number; // degrees -180 to 180
  poseHeadPitch?: number; // degrees -90 to 90
  poseLeftArmRotationX?: number; // degrees -180 to 180
  poseLeftArmRotationZ?: number; // degrees -180 to 180
  poseRightArmRotationX?: number; // degrees -180 to 180
  poseRightArmRotationZ?: number; // degrees -180 to 180
  poseLeftLegRotationX?: number; // degrees -90 to 90
  poseRightLegRotationX?: number; // degrees -90 to 90
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
