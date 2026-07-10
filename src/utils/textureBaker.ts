import * as THREE from "three";
import { AvatarConfig } from "../types";
import { sampleMeltLocalUv } from "../shaders/meltMaterial";
import { ATLAS_REGIONS, ATLAS_SIZE, AtlasRegionKey, LiveTextureAtlasController, getAtlasRegionRect } from "./textureAtlas";

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function samplePixel(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number
) {
  const sx = Math.max(0, Math.min(width - 1, Math.round(x)));
  const sy = Math.max(0, Math.min(height - 1, Math.round(y)));
  const index = (sy * width + sx) * 4;
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3],
  };
}

function findRegionKeyByPixel(x: number, y: number): AtlasRegionKey | null {
  const normalizedX = x / ATLAS_SIZE;
  const normalizedY = y / ATLAS_SIZE;
  const keys = Object.keys(ATLAS_REGIONS) as AtlasRegionKey[];
  for (const key of keys) {
    const region = ATLAS_REGIONS[key];
    if (
      normalizedX >= region.x &&
      normalizedX <= region.x + region.width &&
      normalizedY >= region.y &&
      normalizedY <= region.y + region.height
    ) {
      return key;
    }
  }
  return null;
}

export function bakeMeltedAtlas(
  controller: LiveTextureAtlasController,
  config: AvatarConfig,
  timeSeconds = 0
) {
  const sourceCanvas = controller.canvas;
  const outputCanvas = controller.bakedCanvas;
  const outCtx = outputCanvas.getContext("2d");
  const srcCtx = sourceCanvas.getContext("2d");
  if (!outCtx || !srcCtx) {
    throw new Error("Unable to access atlas canvases for melt baking.");
  }

  const sourceImageData = srcCtx.getImageData(0, 0, ATLAS_SIZE, ATLAS_SIZE);
  const outputImageData = outCtx.createImageData(ATLAS_SIZE, ATLAS_SIZE);

  for (let y = 0; y < ATLAS_SIZE; y++) {
    for (let x = 0; x < ATLAS_SIZE; x++) {
      const regionKey = findRegionKeyByPixel(x, y);
      const index = (y * ATLAS_SIZE + x) * 4;

      if (!regionKey || !config.previewMelt || (config.meltProgress ?? 0) <= 0) {
        outputImageData.data[index] = sourceImageData.data[index];
        outputImageData.data[index + 1] = sourceImageData.data[index + 1];
        outputImageData.data[index + 2] = sourceImageData.data[index + 2];
        outputImageData.data[index + 3] = sourceImageData.data[index + 3];
        continue;
      }

      const region = getAtlasRegionRect(ATLAS_REGIONS[regionKey]);
      const localU = (x - region.x) / Math.max(1, region.width);
      const localV = (y - region.y) / Math.max(1, region.height);
      const melted = sampleMeltLocalUv(localU, localV, timeSeconds, {
        meltProgress: config.meltProgress ?? 0,
        meltSpeed: config.meltSpeed ?? config.meltViscosity ?? 0.6,
        noiseScale: config.noiseScale ?? 1.4,
        dripLength: config.dripLength ?? 0.85,
        edgeSoftness: config.edgeSoftness ?? 0.18,
      });

      const sampleX = region.x + melted.u * region.width;
      const sampleY = region.y + melted.v * region.height;
      const pixel = samplePixel(sourceImageData.data, ATLAS_SIZE, ATLAS_SIZE, sampleX, sampleY);
      const dripShade = 1 - (config.meltProgress ?? 0) * 0.08 * melted.noise;

      outputImageData.data[index] = clampByte(pixel.r * dripShade);
      outputImageData.data[index + 1] = clampByte(pixel.g * dripShade);
      outputImageData.data[index + 2] = clampByte(pixel.b * dripShade);
      outputImageData.data[index + 3] = pixel.a;
    }
  }

  outCtx.putImageData(outputImageData, 0, 0);
  const bakedTexture = new THREE.CanvasTexture(outputCanvas);
  bakedTexture.colorSpace = THREE.SRGBColorSpace;
  bakedTexture.wrapS = THREE.ClampToEdgeWrapping;
  bakedTexture.wrapT = THREE.ClampToEdgeWrapping;
  bakedTexture.needsUpdate = true;
  return { canvas: outputCanvas, texture: bakedTexture };
}
