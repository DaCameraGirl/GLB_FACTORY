import * as THREE from "three";
import { HEAD_PROJECTION_PRESETS } from "../config/headProjectionPresets";
import { AvatarConfig, ProjectionTarget } from "../types";

export type AtlasRegionKey = "head" | "torso" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg";

export interface AtlasRegion {
  key: AtlasRegionKey;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LiveTextureAtlasController {
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  bakedCanvas: HTMLCanvasElement;
  setSourceImageUrl: (sourceImageUrl: string | null) => void;
  update: (config: AvatarConfig, faceCanvas: HTMLCanvasElement | null, timeSeconds?: number) => void;
  dispose: () => void;
}

export const ATLAS_SIZE = 1024;

export const ATLAS_REGIONS: Record<AtlasRegionKey, AtlasRegion> = {
  head: { key: "head", x: 0, y: 0, width: 0.5, height: 0.5 },
  torso: { key: "torso", x: 0.5, y: 0, width: 0.5, height: 0.5 },
  leftArm: { key: "leftArm", x: 0, y: 0.5, width: 0.25, height: 0.25 },
  rightArm: { key: "rightArm", x: 0.25, y: 0.5, width: 0.25, height: 0.25 },
  leftLeg: { key: "leftLeg", x: 0.5, y: 0.5, width: 0.25, height: 0.5 },
  rightLeg: { key: "rightLeg", x: 0.75, y: 0.5, width: 0.25, height: 0.5 },
};

const IMAGE_TARGETS: Record<ProjectionTarget, AtlasRegionKey[]> = {
  "face-only": [],
  head: ["head"],
  "upper-body": ["head", "torso", "leftArm", "rightArm"],
  "full-body": ["head", "torso", "leftArm", "rightArm", "leftLeg", "rightLeg"],
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function getAtlasRegionRect(region: AtlasRegion): PixelRect {
  return {
    x: Math.round(region.x * ATLAS_SIZE),
    y: Math.round(region.y * ATLAS_SIZE),
    width: Math.round(region.width * ATLAS_SIZE),
    height: Math.round(region.height * ATLAS_SIZE),
  };
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBackdrop(ctx: CanvasRenderingContext2D, rect: PixelRect, colorHex: string) {
  ctx.save();
  ctx.fillStyle = colorHex;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = "#141414";
  ctx.lineWidth = 2;
  for (let x = rect.x; x < rect.x + rect.width; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, rect.y);
    ctx.lineTo(x, rect.y + rect.height);
    ctx.stroke();
  }
  for (let y = rect.y; y < rect.y + rect.height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function getPartBaseColor(config: AvatarConfig, key: AtlasRegionKey) {
  if (key === "head") return config.skinColor;
  if (key === "torso") return config.clothingColor;
  if (key === "leftArm" || key === "rightArm") return config.clothingColor;
  return config.pantsColor;
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  rect: PixelRect,
  scaleX: number,
  scaleY: number,
  offsetX: number,
  offsetY: number,
  opacity: number
) {
  const width = (image as any).width || rect.width;
  const height = (image as any).height || rect.height;
  if (!width || !height) return;

  const fitScale = Math.max(rect.width / width, rect.height / height);
  const drawWidth = width * fitScale * scaleX;
  const drawHeight = height * fitScale * scaleY;
  const x = rect.x + (rect.width - drawWidth) / 2 + offsetX * rect.width;
  const y = rect.y + (rect.height - drawHeight) / 2 + offsetY * rect.height;

  ctx.save();
  ctx.globalAlpha = clamp01(opacity);
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
  ctx.restore();
}

function drawMaskedImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  regionRect: PixelRect,
  maskRect: PixelRect,
  radius: number,
  scaleX: number,
  scaleY: number,
  offsetX: number,
  offsetY: number,
  opacity: number
) {
  ctx.save();
  roundedRect(ctx, maskRect.x, maskRect.y, maskRect.width, maskRect.height, radius);
  ctx.clip();
  drawImageCover(ctx, image, regionRect, scaleX, scaleY, offsetX, offsetY, opacity);
  ctx.restore();
}

function buildStaticSignature(
  config: AvatarConfig,
  faceCanvas: HTMLCanvasElement | null,
  sourceImageUrl: string | null
) {
  return JSON.stringify({
    headShape: config.headShape,
    projectionTarget: config.projectionTarget || "face-only",
    projectionScaleX: config.projectionScaleX ?? 1,
    projectionScaleY: config.projectionScaleY ?? 1,
    projectionOffsetX: config.projectionOffsetX ?? 0,
    projectionOffsetY: config.projectionOffsetY ?? 0,
    projectionOpacity: config.projectionOpacity ?? 1,
    skinColor: config.skinColor,
    clothingColor: config.clothingColor,
    pantsColor: config.pantsColor,
    faceCanvasWidth: faceCanvas?.width ?? 0,
    faceCanvasHeight: faceCanvas?.height ?? 0,
    hasSource: !!sourceImageUrl,
  });
}

export function createLiveTextureAtlas(sourceImageUrl: string | null): LiveTextureAtlasController {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable for live texture atlas.");
  }

  const bakedCanvas = document.createElement("canvas");
  bakedCanvas.width = ATLAS_SIZE;
  bakedCanvas.height = ATLAS_SIZE;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  let currentSourceImageUrl: string | null = null;
  let sourceImage: HTMLImageElement | null = null;
  let pendingSourceImage = false;
  let staticSignature = "";
  let animatedFrame = -1;

  const loadSourceImage = (nextUrl: string | null) => {
    currentSourceImageUrl = nextUrl;
    sourceImage = null;
    pendingSourceImage = false;
    if (!nextUrl) return;

    pendingSourceImage = true;
    const img = new Image();
    img.onload = () => {
      if (currentSourceImageUrl === nextUrl) {
        sourceImage = img;
        pendingSourceImage = false;
        staticSignature = "";
      }
    };
    img.onerror = () => {
      if (currentSourceImageUrl === nextUrl) {
        sourceImage = null;
        pendingSourceImage = false;
      }
    };
    img.src = nextUrl;
  };

  loadSourceImage(sourceImageUrl);

  return {
    canvas,
    texture,
    bakedCanvas,
    setSourceImageUrl(nextUrl) {
      if (nextUrl === currentSourceImageUrl) return;
      loadSourceImage(nextUrl);
    },
    update(config, faceCanvas, timeSeconds = 0) {
      const nextStaticSignature = buildStaticSignature(config, faceCanvas, currentSourceImageUrl);
      const shouldAnimate = !!config.previewMelt && (config.meltProgress ?? 0) > 0;
      const nextAnimatedFrame = shouldAnimate ? Math.floor(timeSeconds * Math.max(8, (config.meltSpeed ?? 1) * 18)) : -1;

      if (
        nextStaticSignature === staticSignature &&
        nextAnimatedFrame === animatedFrame &&
        !(pendingSourceImage && !sourceImage)
      ) {
        return;
      }

      staticSignature = nextStaticSignature;
      animatedFrame = nextAnimatedFrame;

      ctx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);

      const projectionTarget = config.projectionTarget || "face-only";
      const projectedTargets = new Set(IMAGE_TARGETS[projectionTarget]);
      const projectionOpacity = config.projectionOpacity ?? 1;
      const previewPhase = shouldAnimate ? Math.sin(timeSeconds * Math.max(0.5, config.meltSpeed ?? 1.2)) * 0.012 : 0;
      const manualScaleX = Math.max(0.2, config.projectionScaleX ?? 1);
      const manualScaleY = Math.max(0.2, config.projectionScaleY ?? 1);
      const manualOffsetX = (config.projectionOffsetX ?? 0) + previewPhase;
      const manualOffsetY = (config.projectionOffsetY ?? 0) + previewPhase * 0.5;

      (Object.keys(ATLAS_REGIONS) as AtlasRegionKey[]).forEach((key) => {
        const region = ATLAS_REGIONS[key];
        const rect = getAtlasRegionRect(region);
        drawBackdrop(ctx, rect, getPartBaseColor(config, key));

        if (sourceImage && projectedTargets.has(key)) {
          drawImageCover(
            ctx,
            sourceImage,
            rect,
            manualScaleX,
            manualScaleY,
            manualOffsetX,
            manualOffsetY,
            projectionOpacity
          );
        }

        ctx.save();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(20,20,20,0.3)";
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        ctx.restore();
      });

      const headRect = getAtlasRegionRect(ATLAS_REGIONS.head);
      const preset = HEAD_PROJECTION_PRESETS[config.headShape];
      const mask = preset.projectionMaskBounds;
      const maskRect: PixelRect = {
        x: headRect.x + Math.round(mask.x * headRect.width),
        y: headRect.y + Math.round(mask.y * headRect.height),
        width: Math.round(mask.width * headRect.width),
        height: Math.round(mask.height * headRect.height),
      };
      const maskRadius = Math.round(mask.radius * Math.min(maskRect.width, maskRect.height));

      if (sourceImage && projectionTarget !== "face-only") {
        drawMaskedImage(
          ctx,
          sourceImage,
          headRect,
          maskRect,
          maskRadius,
          manualScaleX * 0.95,
          manualScaleY * 0.95,
          manualOffsetX + preset.faceOffsetX * 0.35,
          manualOffsetY + preset.faceOffsetY * 0.35,
          Math.max(0.5, projectionOpacity)
        );
      }

      if (faceCanvas) {
        drawMaskedImage(
          ctx,
          faceCanvas,
          headRect,
          maskRect,
          maskRadius,
          manualScaleX * preset.faceScaleX,
          manualScaleY * preset.faceScaleY,
          manualOffsetX + preset.faceOffsetX,
          manualOffsetY + preset.faceOffsetY,
          Math.max(0.72, projectionOpacity)
        );
      }

      texture.needsUpdate = true;
    },
    dispose() {
      texture.dispose();
      sourceImage = null;
    },
  };
}
