import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { exportToGLB } from '../src/utils/glbExporter.ts';

// GLTFExporter needs only this browser API when exporting untextured fixtures.
class BlobReader {
  result = null;
  onloadend = null;
  readAsArrayBuffer(blob) {
    void blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
}

async function readGLB(group) {
  const blob = await exportToGLB(group, 'test-character');
  const bytes = await blob.arrayBuffer();
  const view = new DataView(bytes);
  assert.equal(view.getUint32(0, true), 0x46546c67, 'GLB header');
  assert.equal(view.getUint32(4, true), 2, 'glTF version');
  assert.equal(view.getUint32(8, true), bytes.byteLength, 'complete binary file');
  assert.equal(view.getUint32(16, true), 0x4e4f534a, 'JSON first chunk');
  return JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, view.getUint32(12, true))));
}

test('exported skinned limbs reference bones inside the GLB and preserve the live rig', async (t) => {
  const originalReader = globalThis.FileReader;
  globalThis.FileReader = BlobReader;
  t.after(() => {
    if (originalReader === undefined) delete globalThis.FileReader;
    else globalThis.FileReader = originalReader;
  });
  const group = new THREE.Group();
  group.position.set(2, 3, 4);
  group.rotation.y = 0.6;
  const geometry = new THREE.BoxGeometry(0.3, 1, 0.3);
  const count = geometry.attributes.position.count;
  const weights = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) weights[i * 4] = 1;
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(count * 4), 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));

  const limb = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial());
  limb.name = 'left-arm-mesh';
  const shoulder = new THREE.Bone(); shoulder.name = 'left-shoulder-bone';
  const elbow = new THREE.Bone(); elbow.name = 'left-elbow-bone'; elbow.position.y = -0.5;
  const wrist = new THREE.Bone(); wrist.name = 'left-wrist-bone'; wrist.position.y = -0.5;
  shoulder.add(elbow); elbow.add(wrist); limb.add(shoulder);
  const skeleton = new THREE.Skeleton([shoulder, elbow, wrist]);
  limb.bind(skeleton);
  group.add(limb);
  elbow.rotation.z = 0.3;
  group.updateMatrixWorld(true);

  const gltf = await readGLB(group);
  assert.equal(gltf.skins.length, 1);
  const skin = gltf.skins[0];
  assert.deepEqual(skin.joints.map((index) => {
    assert.ok(Number.isInteger(index) && index >= 0 && index < gltf.nodes.length,
      `skin joint must reference an exported node, got ${index}`);
    return gltf.nodes[index].name;
  }), [shoulder.name, elbow.name, wrist.name]);
  assert.equal(skin.skeleton, skin.joints[0]);
  const exportedLimb = gltf.nodes.find((node) => node.name === limb.name);
  assert.equal(exportedLimb.skin, 0);
  const attributes = gltf.meshes[exportedLimb.mesh].primitives[0].attributes;
  assert.ok(Number.isInteger(attributes.JOINTS_0));
  assert.ok(Number.isInteger(attributes.WEIGHTS_0));
  assert.equal(gltf.accessors[skin.inverseBindMatrices].count, 3);
  assert.equal(limb.skeleton, skeleton);
  assert.equal(limb.skeleton.bones[0], shoulder);
  assert.equal(shoulder.parent, limb);
  assert.deepEqual(group.position.toArray(), [2, 3, 4]);
  assert.equal(group.rotation.y, 0.6);
  assert.equal(elbow.rotation.z, 0.3);
  geometry.dispose();
  limb.material.dispose();
});