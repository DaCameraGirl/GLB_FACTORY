import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import * as THREE from 'three';
import { createPortraitGeometry } from '../src/utils/portraitGeometry.ts';
import { exportToGLB } from '../src/utils/glbExporter.ts';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// The same licensed canonical topology fixture used by MediaPipe, with a known
// non-flat nose and jaw. Browser QA separately exercises real detected portraits.
const canonical = fs.readFileSync(new URL('../public/mediapipe/canonical_face_model.obj', import.meta.url), 'utf8')
  .split(/\r?\n/).filter(line => line.startsWith('v '))
  .map(line => new THREE.Vector3(...line.split(/\s+/).slice(1).map(Number)));
function photo(aspect = 1, rotation = new THREE.Quaternion()) {
  return {
    imageAspect: aspect,
    landmarks: canonical.map(vertex => {
      const p = vertex.clone().multiplyScalar(0.025).applyQuaternion(rotation);
      return { x: 0.5 + p.x, y: 0.5 - p.y * aspect, z: -p.z };
    }),
  };
}

test('fitted head is a sealed oriented volume with the detected source-photo UVs', () => {
  const input = photo();
  const { geometry } = createPortraitGeometry(input);
  const index = geometry.index, position = geometry.attributes.position, uv = geometry.attributes.uv;
  assert.equal(geometry.userData.frontVertexCount, 468);
  assert.equal(geometry.groups[0].count, 898 * 3);
  assert.equal(geometry.groups[0].materialIndex, 0);
  assert.equal(geometry.groups[1].materialIndex, 1, 'estimated back uses skin, not stretched portrait pixels');
  const edges = new Map();
  let volume = 0;
  for (let i = 0; i < index.count; i += 3) {
    const ids = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    const points = ids.map(id => new THREE.Vector3().fromBufferAttribute(position, id));
    assert.ok(ids.every(id => Number.isInteger(id) && id >= 0 && id < position.count));
    assert.ok(points.every(p => p.toArray().every(Number.isFinite)));
    const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
    assert.ok(normal.lengthSq() > 1e-15, 'no collapsed faces');
    volume += points[0].dot(points[1].clone().cross(points[2])) / 6;
    for (let k = 0; k < 3; k++) {
      const a = ids[k], b = ids[(k + 1) % 3], key = [a, b].sort((x, y) => x - y).join(',');
      const entry = edges.get(key) || { uses: 0, orientation: 0 };
      entry.uses++; entry.orientation += a < b ? 1 : -1; edges.set(key, entry);
    }
  }
  assert.ok(volume > 0.1, 'head has outward orientation and real volume');
  for (const edge of edges.values()) assert.deepEqual(edge, { uses: 2, orientation: 0 }, 'every edge seals with an oppositely wound neighbour');
  for (let i = 0; i < 468; i++) {
    assert.ok(Math.abs(uv.getX(i) - input.landmarks[i].x) < 1e-6);
    assert.ok(Math.abs(uv.getY(i) - (1 - input.landmarks[i].y)) < 1e-6);
  }
  geometry.dispose();
});

test('detected depth changes facial vertices while portrait pose and aspect do not change neutral shape', () => {
  const base = createPortraitGeometry(photo());
  const rotated = createPortraitGeometry(photo(0.72, new THREE.Quaternion().setFromEuler(new THREE.Euler(0.15, 0.28, -0.2))));
  const p = base.geometry.attributes.position, q = rotated.geometry.attributes.position;
  assert.equal(p.count, q.count);
  for (let i = 0; i < p.count; i++) {
    assert.ok(new THREE.Vector3().fromBufferAttribute(p, i).distanceTo(new THREE.Vector3().fromBufferAttribute(q, i)) < 1e-5, 'photo roll/yaw/pitch normalize to the same head');
  }
  const deeperNose = photo(); deeperNose.landmarks[1].z -= 0.04;
  const fitted = createPortraitGeometry(deeperNose);
  assert.ok(fitted.geometry.attributes.position.getZ(1) - p.getZ(1) > 0.08, 'nose depth is actual geometry, not texture opacity');
  assert.equal(fitted.geometry.attributes.position.getZ(10), p.getZ(10), 'unmodified forehead is preserved');
  base.geometry.dispose(); rotated.geometry.dispose(); fitted.geometry.dispose();
});

test('invalid and degenerate detection results fail explicitly', () => {
  assert.throws(() => createPortraitGeometry({ imageAspect: 1, landmarks: [] }), /468/);
  const broken = photo(); broken.landmarks[1].z = NaN;
  assert.throws(() => createPortraitGeometry(broken), /invalid/);
  assert.throws(() => createPortraitGeometry({ imageAspect: 1, landmarks: Array.from({ length: 468 }, () => ({ x: 0.5, y: 0.5, z: 0 })) }), /degenerate/);
});

test('fitted facial depth and estimated cap survive actual GLB export and reload', async (t) => {
  const originalReader = globalThis.FileReader;
  globalThis.FileReader = class {
    result = null;
    onloadend = null;
    readAsArrayBuffer(blob) {
      void blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); });
    }
  };
  t.after(() => {
    if (originalReader === undefined) delete globalThis.FileReader;
    else globalThis.FileReader = originalReader;
  });
  const { geometry } = createPortraitGeometry(photo());
  const root = new THREE.Group(); root.name = 'avatar-root';
  const head = new THREE.Group(); head.name = 'head'; root.add(head);
  const materials = [new THREE.MeshStandardMaterial({ name: 'face' }), new THREE.MeshStandardMaterial({ name: 'skin' })];
  const skull = new THREE.Mesh(geometry, materials); skull.name = 'skull'; head.add(skull);
  const bytes = await (await exportToGLB(root, 'portrait-fit')).arrayBuffer();
  const reloaded = await new GLTFLoader().parseAsync(bytes, '');
  const reloadedHead = reloaded.scene.getObjectByName('head');
  assert.ok(reloadedHead, 'head hierarchy retained for the game loader');
  const originalPositions = geometry.attributes.position;
  let verified = 0;
  reloadedHead.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const positions = object.geometry.attributes.position;
    assert.equal(positions.count, originalPositions.count);
    for (let i = 0; i < positions.count; i++) {
      assert.ok(new THREE.Vector3().fromBufferAttribute(positions, i).distanceTo(new THREE.Vector3().fromBufferAttribute(originalPositions, i)) < 1e-6);
    }
    const noseDepth = positions.getZ(1);
    const cheekDepth = (positions.getZ(234) + positions.getZ(454)) / 2;
    assert.ok(noseDepth - cheekDepth > 0.1, 'loaded head retains a projecting 3D nose');
    verified++;
  });
  assert.ok(verified >= 1, 'fitted geometry included in the exported file');
  geometry.dispose(); materials.forEach(material => material.dispose());
});
