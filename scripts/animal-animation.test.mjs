import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildAvatar } from '../src/utils/avatarBuilder.ts';
import { exportToGLB } from '../src/utils/glbExporter.ts';
import { ANIMAL_LOCOMOTION, restoreAnimalRestPose } from '../src/utils/animalAnimations.ts';
import { CREATURE_VARIANTS } from '../src/constants/presets.ts';

class BlobReader {
  result = null;
  onloadend = null;
  readAsArrayBuffer(blob) { void blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
}
function snapshot(group) {
  const values = [];
  group.traverse(node => values.push(...node.position.toArray(), ...node.quaternion.toArray(), ...node.scale.toArray()));
  return values;
}
function assertMotion(root, clip, label) {
  const mixer = new THREE.AnimationMixer(root);
  mixer.clipAction(clip).play();
  mixer.setTime(0);
  const before = snapshot(root);
  mixer.setTime(clip.duration * 0.27);
  const after = snapshot(root);
  assert.ok(after.some((value, i) => Math.abs(value - before[i]) > 0.01), `${label}: no articulated movement`);
  assert.ok(after.every(Number.isFinite), `${label}: finite transforms`);
  mixer.stopAllAction();
  mixer.uncacheRoot(root);
}
function dispose(root) {
  const geometries = new Set(), materials = new Set();
  root.traverse(node => {
    if (!node.isMesh) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

test('every animal exports real looping Idle and locomotion clips with moving nodes after GLB reload', async t => {
  const original = globalThis.FileReader;
  globalThis.FileReader = BlobReader;
  t.after(() => { if (original === undefined) delete globalThis.FileReader; else globalThis.FileReader = original; });
  for (const [variant, locomotion] of Object.entries(ANIMAL_LOCOMOTION)) {
    await t.test(variant, async () => {
      const group = buildAvatar({
        name: variant, skinColor: '#7c6d54', hairColor: '#2c2418', clothingColor: '#596847', pantsColor: '#29382f',
        shoesColor: '#222222', hairStyle: 'none', bodyType: 'normal', headShape: 'organic-smooth',
        featherEdges: true, featherRadius: 20, cropX: 0, cropY: 0, cropScale: 1, detailLevel: 'medium',
        ...CREATURE_VARIANTS[variant], creatureVariant: variant,
      }, null);
      assert.equal(group.userData.bodyPlan, 'animal');
      assert.deepEqual(group.animations.map(clip => clip.name), ['Idle', locomotion]);
      for (const clip of group.animations) {
        assert.ok(clip.duration > 0 && clip.tracks.length >= 2);
        for (const track of clip.tracks) {
          assert.ok(Array.from(track.values).every(Number.isFinite));
          const stride = track.getValueSize();
          for (let i = 0; i < stride; i++) assert.ok(Math.abs(track.values[i] - track.values[track.values.length - stride + i]) < 1e-5,
            `${variant} ${track.name}: loop seam`);
        }
        assertMotion(group, clip, `${variant}/${clip.name}`);
      }
      restoreAnimalRestPose(group);
      // Export while preview is in motion; it must not mutate the live model.
      const liveMixer = new THREE.AnimationMixer(group);
      liveMixer.clipAction(group.animations[1]).play();
      liveMixer.setTime(0.43);
      const liveBefore = snapshot(group);
      const blob = await exportToGLB(group, variant);
      assert.deepEqual(snapshot(group), liveBefore);
      const bytes = await blob.arrayBuffer();
      const view = new DataView(bytes);
      assert.equal(view.getUint32(0, true), 0x46546c67);
      const gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, view.getUint32(12, true))));
      assert.deepEqual(gltf.animations.map(a => a.name), ['Idle', locomotion]);
      for (const clip of gltf.animations) for (const channel of clip.channels) {
        assert.ok(Number.isInteger(channel.target.node) && gltf.nodes[channel.target.node]);
        assert.ok(['translation', 'rotation', 'scale'].includes(channel.target.path));
      }
      const loaded = await new GLTFLoader().parseAsync(bytes, '');
      for (const clip of loaded.animations) assertMotion(loaded.scene, clip, `${variant}/reloaded/${clip.name}`);
      liveMixer.stopAllAction(); liveMixer.uncacheRoot(group);
      dispose(group); dispose(loaded.scene);
    });
  }
});
