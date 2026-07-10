import * as THREE from "three";
import { AtlasRegion } from "./textureAtlas";

function ensureUvAttribute(geometry: THREE.BufferGeometry) {
  const position = geometry.attributes.position;
  if (!position) return;
  if (geometry.attributes.uv) return;

  const bounds = new THREE.Box3();
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (let i = 0; i < position.count; i++) {
    min.x = Math.min(min.x, position.getX(i));
    min.y = Math.min(min.y, position.getY(i));
    min.z = Math.min(min.z, position.getZ(i));
    max.x = Math.max(max.x, position.getX(i));
    max.y = Math.max(max.y, position.getY(i));
    max.z = Math.max(max.z, position.getZ(i));
  }
  bounds.min.copy(min);
  bounds.max.copy(max);
  const size = bounds.getSize(new THREE.Vector3());
  const uvs: number[] = [];

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const u = size.x > 0 ? (x - bounds.min.x) / size.x : 0.5;
    const v = size.y > 0 ? (y - bounds.min.y) / size.y : 0.5;
    uvs.push(u, v);
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
}

export function mapGeometryUvsToAtlasRegion(
  geometry: THREE.BufferGeometry,
  region: AtlasRegion,
  options?: {
    flipY?: boolean;
    inset?: number;
  }
) {
  ensureUvAttribute(geometry);
  const uv = geometry.attributes.uv as THREE.BufferAttribute | undefined;
  if (!uv) return;

  const flipY = options?.flipY ?? false;
  const inset = options?.inset ?? 0.015;
  const innerX = region.x + region.width * inset;
  const innerY = region.y + region.height * inset;
  const innerWidth = region.width * (1 - inset * 2);
  const innerHeight = region.height * (1 - inset * 2);

  const remapped: number[] = [];
  for (let i = 0; i < uv.count; i++) {
    const originalU = uv.getX(i);
    const originalV = uv.getY(i);
    const mappedU = innerX + originalU * innerWidth;
    const mappedV = innerY + (flipY ? 1 - originalV : originalV) * innerHeight;
    remapped.push(mappedU, mappedV);
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(remapped, 2));
}
