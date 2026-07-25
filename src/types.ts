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
  creatureVariant?: "none" | "gremlin" | "monster" | "gator" | "raccoon" | "cat" | "dog" | "lizard" | "possum" | "tigerfish" | "lionfish" | "clown" | "dragon" | "fairy" | "hammerhead";
  featherEdges: boolean;
  featherRadius: number; // 0 to 100
  cropX: number; // percentage offset
  cropY: number; // percentage offset
  cropScale: number; // magnification
  detailLevel: "low" | "medium" | "high";
  accessories?: ("glasses" | "backpack" | "headphones" | "halo" | "crown" | "cat-ears" | "wizard-hat" | "wings" | "horns" | "cyber-visor" | "cape" | "fins" | "tail" | "snout" | "whiskers" | "mushroom-cap" | "gun" | "knife" | "herb-pouch")[];
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
  cameraPreset?: "front" | "side" | "top" | "isometric" | "close-up" | "three-quarter" | "low-angle" | "high-angle" | "back" | "profile-left" | "profile-right";
  twoDStyleEffect?: "none" | "crt" | "blueprint" | "gameboy" | "cyberpunk" | "sketch";
  
  // Postprocessing & Camera Effects
  toneMappingExposure?: number; // 0.1 to 3.0, default 1.0
  dofEnabled?: boolean; // default false
  dofFocusDistance?: number; // 0.0 to 1.0, default 0.0
  dofBokehScale?: number; // 0.0 to 5.0, default 2.0

  // Snapchat Lenses & Camera Studio settings
  activeLens?: "none" | "heart-vfx" | "sparkle-vfx" | "code-vfx" | "bubble-vfx" | "fireflies-vfx" | "glow-vfx";
  photoCaption?: string;
  photoCaptionEmoji?: string;
  storyFrameStyle?: "none" | "story" | "polaroid" | "cinematic";
  bigHeadFactor?: number; // 0 to 1
  colorFilterPreset?: "none" | "retro" | "cyber" | "sepia" | "pink-glow" | "glitch";

  // Manual Armature Bones Posing (Blender-killing armature controllers)
  poseHeadYaw?: number; // degrees -180 to 180
  poseHeadPitch?: number; // degrees -90 to 90
  poseLeftArmRotationX?: number; // degrees -180 to 180
  poseLeftArmRotationZ?: number; // degrees -180 to 180
  poseRightArmRotationX?: number; // degrees -180 to 180
  poseRightArmRotationZ?: number; // degrees -180 to 180
  poseLeftLegRotationX?: number; // degrees -90 to 90
  poseRightLegRotationX?: number; // degrees -90 to 90

  // Meltdown Factory features
  isMelting?: boolean;
  meltProgress?: number; // 0 to 1
  meltPreset?: "slime" | "gold" | "acid" | "lava";
  meltViscosity?: number; // 0.1 to 1.0

  // Facial geometry adjustments (from photo detection)
  faceShape?: "round" | "oval" | "square" | "heart" | "long";
  noseSize?: "small" | "medium" | "large";
  noseWidth?: "narrow" | "medium" | "wide";
  jawWidth?: "narrow" | "medium" | "wide";
  chinShape?: "pointed" | "rounded" | "square" | "prominent";
  
  // Photo morph transition effect (0 = full 3D features, 1 = full photo texture)
  photoMorphProgress?: number; // 0 to 1
}

export interface DetectionResult {
  face_box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] (0-100)
  skin_tone: string;
  hair_color: string;
  clothing_color: string;
  gender_style: string;
  face_shape?: "round" | "oval" | "square" | "heart" | "long";
  nose_size?: "small" | "medium" | "large";
  nose_width?: "narrow" | "medium" | "wide";
  jaw_width?: "narrow" | "medium" | "wide";
  chin_shape?: "pointed" | "rounded" | "square" | "prominent";
}

export interface LogEntry {
  id: string;
  timestamp: string;
  text: string;
  type: "info" | "success" | "warning" | "error";
}
