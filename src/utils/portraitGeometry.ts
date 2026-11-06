import * as THREE from 'three';
import { FACE_OVAL, FACE_TRIANGLES } from './portraitTopology';

export interface PortraitGeometryInput {
  landmarks: { x: number; y: number; z: number }[];
  imageAspect: number;
}

export interface FittedPortraitGeometry {
  geometry: THREE.BufferGeometry;
  earAnchors: [THREE.Vector3, THREE.Vector3];
  faceVertexCount: number;
}

/**
 * Fit the detected MediaPipe front surface, then seal its boundary with an
 * explicitly estimated back. This retains the model's nose/cheek/jaw depth;
 * it does not derive geometry from photo brightness or paste onto a sphere.
 *
 * The detector's x/z use image-width units; y is converted to the same units.
 * A landmark-derived local frame removes the photographed head's rigid pose.
 * Original-image UVs remain attached to their detected facial vertices.
 */
export function createPortraitGeometry(input: PortraitGeometryInput, headSize = 1): FittedPortraitGeometry {
  if (!Number.isFinite(input.imageAspect) || input.imageAspect <= 0 ||
      !Number.isFinite(headSize) || headSize <= 0 || input.landmarks.length < 468) {
    throw new Error('The fitted face needs 468 landmarks and valid image dimensions.');
  }
  const landmarks = input.landmarks.slice(0, 468);
  if (landmarks.some(p => ![p.x, p.y, p.z].every(Number.isFinite))) {
    throw new Error('The fitted face contains invalid landmark coordinates.');
  }
  const raw = landmarks.map(p => new THREE.Vector3(p.x, -p.y / input.imageAspect, -p.z));
  const right = raw[263].clone().sub(raw[33]);
  const upHint = raw[10].clone().sub(raw[152]);
  const forward = new THREE.Vector3().crossVectors(right, upHint);
  if (right.lengthSq() < 1e-10 || upHint.lengthSq() < 1e-10 || forward.lengthSq() < 1e-12) {
    throw new Error('The face landmarks are too small or degenerate to fit.');
  }
  right.normalize(); forward.normalize();
  const up = new THREE.Vector3().crossVectors(forward, right).normalize();
  const center = raw[10].clone().add(raw[152]).multiplyScalar(0.5);
  const local = raw.map(p => {
    const d = p.clone().sub(center);
    return new THREE.Vector3(d.dot(right), d.dot(up), d.dot(forward));
  });
  const faceHeight = local[10].y - local[152].y;
  if (faceHeight < 1e-5) throw new Error('The face landmarks do not form a usable upright face.');
  const scale = headSize * 1.1 / faceHeight;
  local.forEach(p => p.multiplyScalar(scale));
  const boundaryDepth = FACE_OVAL.reduce((sum, i) => sum + local[i].z, 0) / FACE_OVAL.length;
  const depthOffset = headSize * 0.12 - boundaryDepth;
  local.forEach(p => { p.z += depthOffset; });

  const positions: number[] = local.flatMap(p => p.toArray());
  const uv: number[] = landmarks.flatMap(p => [p.x, 1 - p.y]);
  const front = Array.from(FACE_TRIANGLES);
  // The canonical topology's winding is preserved as a whole. Check its
  // orientation in the detector coordinate convention before closing the cap.
  let signedArea = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i < front.length; i += 3) {
    a.subVectors(local[front[i + 1]], local[front[i]]);
    b.subVectors(local[front[i + 2]], local[front[i]]);
    signedArea += a.cross(b).z;
  }
  const boundary = Array.from(FACE_OVAL);
  if (signedArea < 0) {
    for (let i = 0; i < front.length; i += 3) [front[i + 1], front[i + 2]] = [front[i + 2], front[i + 1]];
    boundary.reverse();
  }

  const frontBox = new THREE.Box3().setFromPoints(local);
  const faceWidth = frontBox.max.x - frontBox.min.x;
  const estimatedDepth = Math.max(faceWidth * 0.67, headSize * 0.38);
  const averageZ = headSize * 0.12;
  const crownY = headSize * 0.08;
  const back: number[] = [];
  let previous = boundary;
  const rings = 8;
  for (let ring = 1; ring <= rings; ring++) {
    const t = ring / (rings + 1), angle = t * Math.PI / 2;
    const radius = Math.cos(angle);
    const current: number[] = [];
    for (const i of boundary) {
      const edge = local[i];
      current.push(positions.length / 3);
      positions.push(
        edge.x * radius * (1 + 0.06 * Math.sin(Math.PI * t)),
        crownY + (edge.y - crownY) * radius + headSize * 0.14 * Math.sin(Math.PI * t),
        averageZ + (edge.z - averageZ) * radius - estimatedDepth * Math.sin(angle),
      );
      uv.push(0, 0); // back uses the separate untextured skin material
    }
    for (let i = 0; i < boundary.length; i++) {
      const n = (i + 1) % boundary.length;
      back.push(previous[i], current[i], previous[n], previous[n], current[i], current[n]);
    }
    previous = current;
  }
  const pole = positions.length / 3;
  positions.push(0, crownY, averageZ - estimatedDepth); uv.push(0, 0);
  for (let i = 0; i < boundary.length; i++) back.push(previous[i], pole, previous[(i + 1) % boundary.length]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex([...front, ...back]);
  geometry.addGroup(0, front.length, 0);
  geometry.addGroup(front.length, back.length, 1);
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  geometry.userData = {
    portraitFit: 'MediaPipe 468 detected facial landmarks',
    frontVertexCount: 468,
    backOfHead: 'Estimated; not observed in the source portrait',
  };
  const left = local[234].clone(), rightEar = local[454].clone();
  left.x -= headSize * 0.035; rightEar.x += headSize * 0.035;
  left.z -= headSize * 0.1; rightEar.z -= headSize * 0.1;
  return { geometry, earAnchors: [left, rightEar], faceVertexCount: 468 };
}

/** Release only per-fit resources; the original avatar builder also uses cached meshes. */
export function disposePortraitResources(group: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  group.traverse(child => {
    if (!(child instanceof THREE.Mesh) || !child.userData.portraitGeometryOwned) return;
    geometries.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      materials.add(material);
      const map = (material as THREE.MeshStandardMaterial).map;
      if (map) textures.add(map);
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
}
