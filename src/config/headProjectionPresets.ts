import { HeadShape } from "../types";

export interface ProjectionMaskBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

export interface HeadProjectionPreset {
  faceScaleX: number;
  faceScaleY: number;
  faceOffsetX: number;
  faceOffsetY: number;
  eyeLineTarget: number;
  chinTarget: number;
  projectionMaskBounds: ProjectionMaskBounds;
}

export const HEAD_PROJECTION_PRESETS: Record<HeadShape, HeadProjectionPreset> = {
  cube: {
    faceScaleX: 0.78,
    faceScaleY: 0.9,
    faceOffsetX: 0,
    faceOffsetY: 0.01,
    eyeLineTarget: 0.38,
    chinTarget: 0.76,
    projectionMaskBounds: { x: 0.16, y: 0.14, width: 0.68, height: 0.72, radius: 0.04 },
  },
  "rounded-cube": {
    faceScaleX: 0.82,
    faceScaleY: 0.92,
    faceOffsetX: 0,
    faceOffsetY: 0.02,
    eyeLineTarget: 0.39,
    chinTarget: 0.78,
    projectionMaskBounds: { x: 0.12, y: 0.12, width: 0.76, height: 0.76, radius: 0.12 },
  },
  "organic-smooth": {
    faceScaleX: 0.84,
    faceScaleY: 0.96,
    faceOffsetX: 0,
    faceOffsetY: 0.01,
    eyeLineTarget: 0.38,
    chinTarget: 0.8,
    projectionMaskBounds: { x: 0.1, y: 0.1, width: 0.8, height: 0.8, radius: 0.24 },
  },
  "bean-soft": {
    faceScaleX: 0.76,
    faceScaleY: 1.02,
    faceOffsetX: 0,
    faceOffsetY: 0.02,
    eyeLineTarget: 0.36,
    chinTarget: 0.81,
    projectionMaskBounds: { x: 0.16, y: 0.08, width: 0.68, height: 0.84, radius: 0.28 },
  },
  "pumpkin-round": {
    faceScaleX: 0.88,
    faceScaleY: 0.92,
    faceOffsetX: 0,
    faceOffsetY: 0.015,
    eyeLineTarget: 0.4,
    chinTarget: 0.79,
    projectionMaskBounds: { x: 0.08, y: 0.1, width: 0.84, height: 0.78, radius: 0.3 },
  },
  "hero-angular": {
    faceScaleX: 0.8,
    faceScaleY: 0.94,
    faceOffsetX: 0,
    faceOffsetY: 0,
    eyeLineTarget: 0.38,
    chinTarget: 0.8,
    projectionMaskBounds: { x: 0.13, y: 0.11, width: 0.74, height: 0.8, radius: 0.14 },
  },
};
