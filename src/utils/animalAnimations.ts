import * as THREE from "three";

export type AnimalMotionRole = "body" | "head" | "leg" | "wing" | "tail" | "segment" | "tentacle" | "jaw" | "fin" | "claw";
export interface AnimalMotion {
  role: AnimalMotionRole;
  index?: number;
  side?: number;
}

export const ANIMAL_LOCOMOTION: Record<string, string> = {
  gator: "Walk", raccoon: "Walk", cat: "Walk", dog: "Walk", lizard: "Walk", possum: "Walk",
  tigerfish: "Swim", lionfish: "Swim", hammerhead: "Swim", octopus: "Swim",
  dragon: "Fly", bat: "Fly", crow: "Fly", spider: "Crawl", snake: "Slither", rat: "Walk",
  centipede: "Crawl", "biped-lizard": "Walk", toad: "Hop", scorpion: "Crawl", worm: "Slither", mantis: "Walk",
};

const TAU = Math.PI * 2;
const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

type RestTransform = { position: number[]; quaternion: number[]; scale: number[] };

/** Author real, loopable glTF node animations from each animal's articulated pivots. */
export function attachAnimalAnimations(group: THREE.Group, variant?: string): THREE.AnimationClip[] {
  if (!variant || !ANIMAL_LOCOMOTION[variant]) return group.animations;
  if (group.userData.animalAnimationVersion === 1 && group.animations.length === 2) return group.animations;
  const targets: { node: THREE.Object3D; motion: AnimalMotion; rest: RestTransform }[] = [];
  const names = new Set<string>();
  group.traverse((node) => {
    const motion = node.userData.animalMotion as AnimalMotion | undefined;
    if (!motion) return;
    const baseName = (node.name || `${variant}-${motion.role}`).replace(/[.\[\]:\/]/g, "-");
    let name = baseName;
    let suffix = 1;
    while (names.has(name)) name = `${baseName}-${suffix++}`;
    names.add(name);
    node.name = name;
    const rest = { position: node.position.toArray(), quaternion: node.quaternion.toArray(), scale: node.scale.toArray() };
    node.userData.animalRestTransform = rest;
    targets.push({ node, motion, rest });
  });
  if (!targets.length) return group.animations;

  const motionName = ANIMAL_LOCOMOTION[variant];
  const makeClip = (idle: boolean) => {
    const duration = idle ? 3.2 : motionName === "Fly" ? 1.15 : motionName === "Hop" ? 1.2 : motionName === "Slither" ? 2.4 : 1.6;
    const samples = Math.ceil(duration * 30);
    const times = Array.from({ length: samples + 1 }, (_, i) => i * duration / samples);
    const tracks: THREE.KeyframeTrack[] = [];
    for (const { node, motion, rest } of targets) {
      const qValues: number[] = [], pValues: number[] = [], sValues: number[] = [];
      const index = motion.index || 0;
      const side = motion.side ?? (index % 2 ? 1 : -1);
      // Diagonal pairs step together; arthropods use a traveling leg wave.
      const legPhase = motionName === "Crawl" ? index * Math.PI * 0.65 : (index === 0 || index === 3 ? 0 : Math.PI);
      for (let i = 0; i <= samples; i++) {
        // Repeat the first sample exactly at the seam.
        const phase = i === samples ? 0 : i / samples * TAU;
        const q = new THREE.Quaternion().fromArray(rest.quaternion);
        const position = new THREE.Vector3().fromArray(rest.position);
        const scale = new THREE.Vector3().fromArray(rest.scale);
        const rotate = (axis: THREE.Vector3, angle: number) => q.multiply(new THREE.Quaternion().setFromAxisAngle(axis, angle));
        switch (motion.role) {
          case "body":
            if (idle) scale.y *= 1 + Math.sin(phase) * 0.018;
            else if (motionName === "Hop") position.y += Math.max(0, Math.sin(phase)) * 0.28;
            else if (motionName === "Fly") position.y += (1 - Math.cos(phase)) * 0.055;
            else if (motionName === "Swim") { position.y += Math.sin(phase) * 0.025; rotate(Y, Math.sin(phase) * 0.035); }
            else if (motionName === "Slither") rotate(Y, Math.sin(phase) * 0.06);
            else position.y += (1 - Math.cos(phase * 2)) * 0.014;
            break;
          case "head":
            rotate(Y, Math.sin(phase) * (idle ? 0.07 : 0.025));
            rotate(X, Math.sin(phase * 2) * (idle ? 0.02 : 0.025));
            break;
          case "leg":
            if (!idle) {
              const swing = motionName === "Hop" ? Math.sin(phase) * 0.42 : Math.sin(phase + legPhase) * (motionName === "Fly" ? 0.08 : 0.38);
              rotate(X, swing);
              if (motionName === "Crawl") rotate(Y, Math.cos(phase + legPhase) * side * 0.16);
            } else rotate(X, Math.sin(phase + legPhase) * 0.015);
            break;
          case "wing":
            rotate(Z, side * Math.sin(phase) * (idle ? 0.07 : 0.68));
            rotate(X, Math.cos(phase) * (idle ? 0.015 : 0.12));
            break;
          case "tail":
            rotate(Y, Math.sin(phase + 0.7) * (idle ? 0.08 : motionName === "Swim" ? 0.28 : 0.14));
            break;
          case "segment":
            rotate(Y, Math.sin(phase - index * 0.52) * (idle ? 0.018 : motionName === "Slither" ? 0.12 : 0.055));
            if (variant === "worm") scale.z *= 1 + Math.sin(phase - index * 0.55) * (idle ? 0.012 : 0.04);
            break;
          case "tentacle":
            rotate(X, Math.sin(phase - index * 0.6) * (idle ? 0.06 : 0.2));
            rotate(Z, Math.cos(phase - index * 0.45) * (idle ? 0.04 : 0.12));
            break;
          case "jaw":
            rotate(X, (1 - Math.cos(phase)) * (idle ? 0.025 : 0.09));
            break;
          case "fin":
            rotate(Z, side * Math.sin(phase + index * 0.5) * (idle ? 0.045 : 0.24));
            break;
          case "claw":
            rotate(Y, side * (1 - Math.cos(phase + index * Math.PI)) * (idle ? 0.025 : 0.09));
            break;
        }
        q.toArray(qValues, qValues.length);
        position.toArray(pValues, pValues.length);
        scale.toArray(sValues, sValues.length);
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`, times, qValues));
      // Body bob and breathing are local to the body; the scene root stays stationary.
      if (motion.role === "body") tracks.push(new THREE.VectorKeyframeTrack(`${node.name}.position`, times, pValues));
      if (motion.role === "body" || variant === "worm" && motion.role === "segment") {
        tracks.push(new THREE.VectorKeyframeTrack(`${node.name}.scale`, times, sValues));
      }
    }
    return new THREE.AnimationClip(idle ? "Idle" : motionName, duration, tracks);
  };
  group.animations = [makeClip(true), makeClip(false)];
  group.userData.animalAnimationVersion = 1;
  group.userData.animalVariant = variant;
  group.userData.locomotionClip = motionName;
  return group.animations;
}

/** Use the authored rest pose as the default GLB pose, even during preview playback. */
export function restoreAnimalRestPose(group: THREE.Object3D) {
  group.traverse((node) => {
    const rest = node.userData.animalRestTransform as RestTransform | undefined;
    if (!rest) return;
    node.position.fromArray(rest.position);
    node.quaternion.fromArray(rest.quaternion);
    node.scale.fromArray(rest.scale);
  });
  group.updateMatrixWorld(true);
}
