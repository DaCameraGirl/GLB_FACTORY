import * as THREE from "three";
import { AvatarConfig } from "../types";
import { AtlasRegion } from "../utils/textureAtlas";

export interface MeltSampleConfig {
  meltProgress: number;
  meltSpeed: number;
  noiseScale: number;
  dripLength: number;
  edgeSoftness: number;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function fract(value: number) {
  return value - Math.floor(value);
}

function hash2(x: number, y: number) {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function noise2(x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const xf = x - x0;
  const yf = y - y0;

  const h00 = hash2(x0, y0);
  const h10 = hash2(x0 + 1, y0);
  const h01 = hash2(x0, y0 + 1);
  const h11 = hash2(x0 + 1, y0 + 1);

  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(h00, h10, u), lerp(h01, h11, u), v);
}

function fbm(x: number, y: number, octaves = 4) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += noise2(x * frequency, y * frequency) * amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

export function sampleMeltLocalUv(
  localU: number,
  localV: number,
  timeSeconds: number,
  config: MeltSampleConfig
) {
  const melt = clamp01(config.meltProgress);
  const scale = Math.max(0.05, config.noiseScale);
  const speed = Math.max(0.01, config.meltSpeed);
  const drip = Math.max(0, config.dripLength);

  const n = fbm(localU * scale * 3 + 0.17, localV * scale * 3 - timeSeconds * speed * 0.15);
  const drift = melt * (0.05 + drip * 0.18 * n);
  const stretch = 1 + melt * (0.18 + n * 0.24);

  const sampleU = clamp01(0.5 + (localU - 0.5) / stretch);
  const sampleV = clamp01(localV - drift * Math.pow(1 - localV, 0.65));

  return { u: sampleU, v: sampleV, noise: n };
}

function resolveMaterialScalar(
  configValue: number | undefined,
  fallback: number | undefined,
  hardDefault: number
) {
  if (configValue !== undefined) return configValue;
  if (fallback !== undefined) return fallback;
  return hardDefault;
}

export function createMeltMaterial(params: {
  atlasTexture: THREE.Texture;
  region: AtlasRegion;
  config: AvatarConfig;
  baseColor: string;
  name: string;
  standardMaterialTemplate?: THREE.Material | null;
}) {
  const baseColor = new THREE.Color(params.baseColor);
  const template = params.standardMaterialTemplate as THREE.MeshStandardMaterial | null | undefined;
  const material = new THREE.ShaderMaterial({
    name: params.name,
    uniforms: {
      atlasMap: { value: params.atlasTexture },
      regionMin: { value: new THREE.Vector2(params.region.x, params.region.y) },
      regionSize: { value: new THREE.Vector2(params.region.width, params.region.height) },
      baseColor: { value: baseColor },
      time: { value: 0 },
      meltProgress: { value: params.config.meltProgress ?? 0 },
      meltSpeed: { value: params.config.meltSpeed ?? params.config.meltViscosity ?? 0.6 },
      noiseScale: { value: params.config.noiseScale ?? 1.4 },
      dripLength: { value: params.config.dripLength ?? 0.85 },
      edgeSoftness: { value: params.config.edgeSoftness ?? 0.18 },
      projectionOpacity: { value: params.config.projectionOpacity ?? 1 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D atlasMap;
      uniform vec2 regionMin;
      uniform vec2 regionSize;
      uniform vec3 baseColor;
      uniform float time;
      uniform float meltProgress;
      uniform float meltSpeed;
      uniform float noiseScale;
      uniform float dripLength;
      uniform float edgeSoftness;
      uniform float projectionOpacity;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbm(vec2 p) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 4; i++) {
          total += noise(p) * amplitude;
          amplitude *= 0.5;
          p *= 2.0;
        }
        return total;
      }

      void main() {
        vec2 localUv = (vUv - regionMin) / regionSize;
        localUv = clamp(localUv, 0.0, 1.0);

        float melt = clamp(meltProgress, 0.0, 1.0);
        float n = fbm(vec2(localUv.x * noiseScale * 3.0 + 0.17, localUv.y * noiseScale * 3.0 - time * max(meltSpeed, 0.01) * 0.15));
        float drift = melt * (0.05 + dripLength * 0.18 * n);
        float stretch = 1.0 + melt * (0.18 + n * 0.24);

        vec2 sampleLocalUv = vec2(
          clamp(0.5 + (localUv.x - 0.5) / stretch, 0.0, 1.0),
          clamp(localUv.y - drift * pow(1.0 - localUv.y, 0.65), 0.0, 1.0)
        );

        vec2 atlasUv = regionMin + sampleLocalUv * regionSize;
        vec4 atlasSample = texture2D(atlasMap, atlasUv);
        float dripMask = smoothstep(1.0 - edgeSoftness - drift, 1.0 - drift, localUv.y);
        vec3 composedColor = mix(baseColor, atlasSample.rgb, clamp(projectionOpacity * atlasSample.a, 0.0, 1.0));
        composedColor = mix(composedColor, atlasSample.rgb, dripMask * melt * 0.45);
        gl_FragColor = vec4(composedColor, 1.0);
      }
    `,
  });

  material.userData.isMeltMaterial = true;
  material.userData.atlasRegionKey = params.region.key;
  material.userData.exportMaterialParams = {
    roughness: resolveMaterialScalar(params.config.materialRoughness, template?.roughness, 0.75),
    metalness: resolveMaterialScalar(params.config.materialMetalness, template?.metalness, 0.05),
    emissive: params.config.materialEmissive || (template?.emissive ? `#${template.emissive.getHexString()}` : "#000000"),
    emissiveIntensity: resolveMaterialScalar(params.config.materialEmissiveIntensity, template?.emissiveIntensity, 0),
  };
  return material;
}

export function updateMeltMaterial(material: THREE.Material, config: AvatarConfig, timeSeconds: number) {
  if (!(material instanceof THREE.ShaderMaterial) || !material.userData.isMeltMaterial) return;
  material.uniforms.time.value = timeSeconds;
  material.uniforms.meltProgress.value = config.previewMelt ? config.meltProgress ?? 0 : 0;
  material.uniforms.meltSpeed.value = config.meltSpeed ?? config.meltViscosity ?? 0.6;
  material.uniforms.noiseScale.value = config.noiseScale ?? 1.4;
  material.uniforms.dripLength.value = config.dripLength ?? 0.85;
  material.uniforms.edgeSoftness.value = config.edgeSoftness ?? 0.18;
  material.uniforms.projectionOpacity.value = config.projectionOpacity ?? 1;
}
