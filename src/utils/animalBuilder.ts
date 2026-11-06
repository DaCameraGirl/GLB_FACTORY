import * as THREE from 'three';
import { AvatarConfig } from '../types';
import { attachAnimalAnimations } from './animalAnimations';

/** Species with a complete animal body, independent of portrait/humanoid geometry. */
export const ANIMAL_VARIANTS = new Set([
  'gator', 'raccoon', 'cat', 'dog', 'lizard', 'possum', 'tigerfish', 'lionfish',
  'dragon', 'hammerhead', 'octopus', 'spider', 'snake', 'bat', 'crow', 'rat',
  'centipede', 'biped-lizard', 'toad', 'scorpion', 'worm', 'mantis',
]);

type Point = [number, number, number];
type Role = 'body' | 'head' | 'leg' | 'wing' | 'tail' | 'segment' | 'tentacle' | 'jaw' | 'fin' | 'claw';

/** Closed, volumetric species geometry with explicit connected animation pivots. */
export function buildAnimal(config: AvatarConfig): THREE.Group {
  const species = config.creatureVariant!;
  const root = new THREE.Group();
  root.name = 'avatar-root';
  root.userData.animalVariant = species;
  root.userData.bodyPlan = 'animal';
  const detail = config.detailLevel === 'high' ? 24 : config.detailLevel === 'low' ? 12 : 18;
  let serial = 0;
  const mat = (color: THREE.ColorRepresentation, label: string, roughness = 0.72) => new THREE.MeshStandardMaterial({
    name: `${species}-${label}`, color,
    roughness: config.materialRoughness ?? roughness,
    metalness: config.materialMetalness ?? 0.02,
    wireframe: Boolean(config.wireframeMode),
    emissive: config.materialEmissive || '#000000',
    emissiveIntensity: config.materialEmissiveIntensity ?? 0,
  });
  const skin = mat(config.skinColor, 'skin');
  const dark = mat(config.hairColor, 'markings');
  const accent = mat(config.clothingColor, 'accent');
  const belly = mat(new THREE.Color(config.skinColor).lerp(new THREE.Color('#fff4da'), 0.62), 'belly');
  const black = mat('#10131a', 'eyes', 0.2);
  const white = mat('#fff9e5', 'ivory', 0.3);
  const pink = mat('#dba39e', 'inner-ear');
  const amber = mat('#e9bb47', 'iris', 0.25);
  const body = new THREE.Group(); body.name = `${species}-body`; body.userData.animalMotion = { role: 'body' }; root.add(body);
  const pivot = (parent: THREE.Object3D, name: string, position: Point, role?: Role, index = 0, side = 0) => {
    const p = new THREE.Group(); p.name = `${species}-${name}`; p.position.set(...position);
    if (role) p.userData.animalMotion = { role, index, side };
    parent.add(p); return p;
  };
  const mesh = (parent: THREE.Object3D, name: string, geometry: THREE.BufferGeometry, material: THREE.Material, position: Point = [0, 0, 0]) => {
    const m = new THREE.Mesh(geometry, material); m.name = `${species}-${name}-${serial++}`;
    m.position.set(...position); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const oval = (parent: THREE.Object3D, name: string, p: Point, r: Point, material = skin) => {
    const m = mesh(parent, name, new THREE.SphereGeometry(1, detail, Math.max(8, detail / 2)), material, p);
    m.scale.set(...r); return m;
  };
  const rod = (parent: THREE.Object3D, name: string, a: Point, b: Point, r0: number, r1: number, material = skin) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), delta = vb.clone().sub(va);
    const m = mesh(parent, name, new THREE.CylinderGeometry(r1, r0, delta.length(), Math.max(8, detail / 2)), material);
    m.position.copy(va.add(vb).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return m;
  };
  const spike = (parent: THREE.Object3D, name: string, a: Point, b: Point, r: number, material = dark) => rod(parent, name, a, b, r, 0.006, material);
  const plate = (parent: THREE.Object3D, name: string, points: [number, number][], thickness: number, material = skin) => {
    const shape = new THREE.Shape(); shape.moveTo(...points[0]); points.slice(1).forEach(p => shape.lineTo(...p)); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelSize: thickness * 0.3, bevelThickness: thickness * 0.3, bevelSegments: 1, steps: 1 });
    geometry.translate(0, 0, -thickness / 2); return mesh(parent, name, geometry, material);
  };
  const eye = (parent: THREE.Object3D, p: Point, radius: number, side = 0, iris = amber) => {
    oval(parent, 'eye-globe', p, [radius, radius, radius], iris);
    const forward: Point = side ? [side * radius * 0.65, 0, radius * 0.42] : [0, 0, radius * 0.76];
    oval(parent, 'pupil', [p[0] + forward[0], p[1] + forward[1], p[2] + forward[2]], [radius * 0.46, radius * 0.64, radius * 0.38], black);
    oval(parent, 'eye-highlight', [p[0] + forward[0] - radius * 0.11, p[1] + radius * 0.22, p[2] + forward[2] + radius * 0.28], [radius * 0.15, radius * 0.15, radius * 0.15], white);
  };
  const chain = (parent: THREE.Object3D, name: string, points: Point[], radius: number, material: THREE.MeshStandardMaterial, role: Role = 'tail', index = 0) => {
    const start = pivot(parent, name, points[0], role, index);
    let current = start;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      const delta: Point = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const r0 = radius * (1 - i / (points.length - 0.3)), r1 = radius * (1 - (i + 1) / (points.length - 0.3));
      current.userData.animalRadius = r0;
      rod(current, `${name}-surface`, [0, 0, 0], delta, r0, r1, material);
      oval(current, `${name}-joint`, [0, 0, 0], [r0, r0, r0], material);
      current = pivot(current, `${name}-segment-${i + 1}`, delta, role === 'tentacle' ? 'tentacle' : 'segment', index + i + 1);
      current.userData.animalRadius = r1;
    }
    return start;
  };
  const toes = (parent: THREE.Object3D, p: Point, side: number, count = 3, spread = 0.07, material = dark) => {
    for (let t = 0; t < count; t++) {
      const x = (t - (count - 1) / 2) * spread;
      rod(parent, 'toe', [p[0] + x * 0.35, p[1], p[2]], [p[0] + x, p[1] - 0.015, p[2] + 0.15], 0.025, 0.014, material);
      spike(parent, 'claw', [p[0] + x, p[1] - 0.015, p[2] + 0.15], [p[0] + x, p[1] - 0.04, p[2] + 0.21], 0.015, white);
    }
  };
  const leg = (parent: THREE.Object3D, i: number, origin: Point, knee: Point, foot: Point, radius: number, material = skin, clawed = false) => {
    const side = origin[0] < 0 ? -1 : 1;
    const p = pivot(parent, `leg-${i}`, origin, 'leg', i, side);
    rod(p, 'upper-leg', [0, 0, 0], knee, radius, radius * 0.7, material);
    oval(p, 'knee', knee, [radius * 0.75, radius * 0.75, radius * 0.75], material);
    rod(p, 'lower-leg', knee, foot, radius * 0.65, radius * 0.45, material);
    oval(p, 'paw', [foot[0], foot[1], foot[2] + radius * 0.5], [radius * 0.8, radius * 0.4, radius * 1.2], material);
    if (clawed) toes(p, foot, side, 3, radius * 0.5, material);
    return p;
  };
  let head: THREE.Group;
  const whiskers = (parent: THREE.Object3D, width: number, z: number) => {
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) rod(parent, 'whisker', [side * 0.12, -0.12 + i * 0.04, z], [side * width, -0.18 + i * 0.1, z + 0.06], 0.007, 0.003, white);
  };
  const membraneWing = (parent: THREE.Object3D, side: number, origin: Point, size: number, material: THREE.MeshStandardMaterial) => {
    const wing = pivot(parent, `wing-${side}`, origin, 'wing', side === -1 ? 0 : 1, side);
    const contour = new THREE.Shape();
    contour.moveTo(0, 0);
    contour.quadraticCurveTo(side * size * 0.15, size * 0.48, side * size * 0.42, size * 0.42);
    contour.lineTo(side * size, size * 0.28);
    contour.quadraticCurveTo(side * size * 0.72, size * 0.06, side * size * 0.55, -size * 0.4);
    contour.quadraticCurveTo(side * size * 0.36, -size * 0.03, side * size * 0.17, -size * 0.46);
    contour.quadraticCurveTo(side * size * 0.1, -size * 0.15, 0, -size * 0.17);
    contour.closePath();
    const membrane = new THREE.ExtrudeGeometry(contour, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1, curveSegments: 10, steps: 1 });
    membrane.translate(0, 0, -0.0175);
    mesh(wing, 'wing-membrane', membrane, material);
    const elbow: Point = [side * size * 0.42, size * 0.42, 0];
    rod(wing, 'wing-arm', [0, 0, 0], elbow, 0.055, 0.035, skin);
    for (const end of [[side * size, size * 0.28, 0], [side * size * 0.55, -size * 0.4, 0], [side * size * 0.17, -size * 0.46, 0]] as Point[]) rod(wing, 'wing-finger', elbow, end, 0.032, 0.008, skin);
    return wing;
  };

  if (['cat', 'dog', 'raccoon', 'possum', 'rat'].includes(species)) {
    const small = species === 'rat', canine = species === 'dog', possum = species === 'possum';
    const height = small || possum ? 0.58 : 0.86;
    const width = canine ? 0.4 : 0.36, length = possum ? 0.88 : 0.75;
    oval(body, 'ribcage', [0, height, 0], [width, 0.38, length]);
    oval(body, 'chest', [0, height + 0.04, 0.5], [width * 0.95, 0.43, 0.4]);
    oval(body, 'belly-fur', [0, height - 0.2, 0.12], [width * 0.86, 0.22, length * 0.8], belly);
    for (let i = 0; i < 4; i++) {
      const side = i % 2 ? 1 : -1, front = i < 2;
      const h = height - 0.16;
      leg(body, i, [side * width * 0.75, h, front ? 0.48 : -0.48], [side * 0.04, -h * 0.48, front ? -0.02 : 0.14], [side * 0.03, -h + 0.09, 0.03], small ? 0.075 : 0.12, skin, possum || small);
    }
    head = pivot(body, 'head', [0, height + 0.4, 0.78], 'head');
    oval(head, 'cranium', [0, 0, 0], [small ? 0.28 : 0.35, 0.32, 0.34]);
    if (possum || small) {
      oval(head, 'pale-cheek', [0, -0.03, 0.16], [0.28, 0.24, 0.28], possum ? belly : skin);
      rod(head, 'tapered-muzzle', [0, -0.1, 0.18], [0, -0.14, 0.57], 0.21, 0.075, belly);
      oval(head, 'nose', [0, -0.13, 0.58], [0.08, 0.055, 0.06], pink);
    } else {
      oval(head, 'muzzle', [0, -0.13, canine ? 0.35 : 0.27], [0.23, 0.15, canine ? 0.28 : 0.15], belly);
      oval(head, 'nose', [0, -0.08, canine ? 0.59 : 0.41], [0.1, 0.075, 0.06], black);
    }
    for (const side of [-1, 1]) {
      if (species === 'raccoon') oval(head, 'mask', [side * 0.2, 0.04, 0.26], [0.17, 0.105, 0.06], black);
      eye(head, [side * 0.2, 0.06, 0.29], 0.065);
      if (canine) {
        const ear = oval(head, 'floppy-ear', [side * 0.32, -0.03, -0.04], [0.12, 0.35, 0.16], dark); ear.rotation.z = side * -0.22;
      } else if (species === 'cat') {
        const ear = plate(head, 'pointed-ear', [[side * 0.14, 0.2], [side * 0.35, 0.52], [side * 0.4, 0.16]], 0.12, skin); ear.position.z = -0.04;
        const inset = plate(head, 'ear-interior', [[side * 0.2, 0.23], [side * 0.34, 0.43], [side * 0.35, 0.22]], 0.015, pink); inset.position.z = 0.035;
      } else {
        oval(head, 'rounded-ear', [side * 0.27, 0.27, -0.06], [0.17, 0.18, 0.07], possum ? dark : skin);
        oval(head, 'ear-interior', [side * 0.27, 0.28, 0.005], [0.115, 0.125, 0.02], pink);
      }
    }
    if (!canine) whiskers(head, 0.6, small || possum ? 0.4 : 0.3);
    const tailLength = species === 'cat' ? 1.2 : species === 'raccoon' ? 1.0 : possum || small ? 1.65 : 0.85;
    const tailPoints: Point[] = Array.from({ length: 10 }, (_, i) => [Math.sin(i * 0.25) * 0.13, height + (canine || species === 'cat' ? Math.sin(i / 9 * Math.PI * 0.8) * 0.45 : -i * 0.025), -length + 0.1 - i / 9 * tailLength]);
    const tail = chain(body, 'tail', tailPoints, possum || small ? 0.075 : species === 'raccoon' ? 0.2 : 0.1, possum || small ? pink : skin);
    if (species === 'raccoon') tail.traverse(o => { if (o instanceof THREE.Mesh && o.name.includes('surface') && Number(o.name.split('-').at(-1)) % 4 < 2) o.material = dark; });
    if (species === 'cat') for (let i = 0; i < 4; i++) oval(body, 'tabby-stripe', [0, height + 0.33, 0.4 - i * 0.28], [width * 0.91, 0.055, 0.035], dark);
    if (possum) for (let i = 0; i < 9; i++) oval(body, 'mottled-fur', [Math.sin(i * 2.4) * width * 0.7, height + 0.32, 0.55 - i * 0.14], [0.11, 0.055, 0.14], i % 2 ? dark : belly);
  } else if (['gator', 'lizard', 'biped-lizard', 'toad', 'dragon'].includes(species)) {
    const gator = species === 'gator', toad = species === 'toad', dragon = species === 'dragon', biped = species === 'biped-lizard';
    const y = toad ? 0.45 : biped ? 0.95 : dragon ? 0.9 : 0.5;
    const width = toad ? 0.68 : dragon ? 0.55 : 0.4, length = gator ? 1.12 : toad ? 0.55 : 0.9;
    oval(body, 'trunk', [0, y, 0], [width, toad ? 0.42 : 0.38, length]);
    oval(body, 'belly', [0, y - 0.22, 0.12], [width * 0.9, 0.18, length * 0.9], belly);
    const totalLegs = biped ? 2 : 4;
    for (let i = 0; i < totalLegs; i++) {
      const side = i % 2 ? 1 : -1, front = !biped && i < 2;
      const h = y - 0.12;
      leg(body, i, [side * width * 0.7, h, front ? length * 0.6 : -length * 0.55], [side * (toad ? 0.34 : 0.22), -h * 0.38, front ? 0.08 : 0.2], [side * 0.31, -h + 0.07, 0.18], toad && !front ? 0.22 : dragon ? 0.18 : 0.1, skin, true);
    }
    head = pivot(body, 'head', [0, y + (dragon || biped ? 0.5 : 0.2), length * 0.8], 'head');
    oval(head, 'cranium', [0, 0, 0], [toad ? 0.55 : 0.36, toad ? 0.25 : 0.29, 0.4]);
    if (toad) {
      oval(head, 'wide-mouth', [0, -0.1, 0.27], [0.49, 0.035, 0.13], dark);
      for (const side of [-1, 1]) { oval(head, 'eye-bump', [side * 0.36, 0.2, 0.12], [0.18, 0.19, 0.17]); eye(head, [side * 0.37, 0.25, 0.25], 0.11); }
      for (let i = 0; i < 18; i++) oval(body, 'wart', [Math.sin(i * 2.4) * width * 0.8, y + 0.3 + Math.cos(i * 2.4) * 0.03, Math.cos(i * 1.9) * 0.4], [0.065, 0.045, 0.065], dark);
    } else {
      const snoutLength = gator ? 0.9 : dragon ? 0.55 : 0.4;
      oval(head, 'upper-snout', [0, -0.05, snoutLength * 0.58], [gator ? 0.3 : 0.24, gator ? 0.12 : 0.18, snoutLength * 0.65]);
      const jaw = pivot(head, 'jaw', [0, -0.16, 0.05], 'jaw');
      oval(jaw, 'lower-jaw', [0, -0.035, snoutLength * 0.57], [gator ? 0.28 : 0.22, 0.075, snoutLength * 0.65], belly);
      for (const side of [-1, 1]) {
        eye(head, [side * 0.29, 0.16, 0.14], 0.085, side);
        for (let t = 0; t < (gator ? 7 : 3); t++) spike(jaw, 'tooth', [side * (gator ? 0.23 : 0.18), 0.015, 0.2 + t * snoutLength / (gator ? 8 : 4)], [side * (gator ? 0.23 : 0.18), 0.095, 0.2 + t * snoutLength / (gator ? 8 : 4)], 0.028, white);
        oval(head, 'nostril', [side * 0.12, 0.05, snoutLength * 1.12], [0.035, 0.025, 0.03], black);
        if (dragon) spike(head, 'horn', [side * 0.24, 0.17, -0.12], [side * 0.38, 0.65, -0.35], 0.1, white);
      }
      const tailPoints: Point[] = Array.from({ length: 12 }, (_, i) => [Math.sin(i * 0.25) * 0.14, y - i * 0.025, -length * 0.65 - i * (dragon ? 0.2 : gator ? 0.18 : 0.16)]);
      chain(body, 'tail', tailPoints, dragon ? 0.3 : 0.23, skin);
      for (let i = 0; i < 9; i++) {
        const z = 0.55 - i * 0.23;
        if (gator) for (const side of [-1, 1]) spike(body, 'dorsal-scute', [side * 0.16, y + 0.31, z], [side * 0.16, y + 0.45, z - 0.05], 0.085, dark);
        else spike(body, 'dorsal-crest', [0, y + 0.3, z], [0, y + (dragon ? 0.6 : 0.45), z - 0.08], 0.07, dark);
      }
      if (dragon) for (const side of [-1, 1]) membraneWing(body, side, [side * 0.38, y + 0.25, 0.04], 1.5, accent);
    }
  } else if (['tigerfish', 'lionfish', 'hammerhead'].includes(species)) {
    const shark = species === 'hammerhead', lion = species === 'lionfish';
    const y = 0.95, length = shark ? 1.4 : 0.95;
    oval(body, 'fusiform-body', [0, y, 0], [shark ? 0.4 : 0.4, shark ? 0.4 : 0.58, length]);
    oval(body, 'pale-belly', [0, y - 0.22, 0.05], [0.35, 0.2, length * 0.88], belly);
    head = pivot(body, 'head', [0, y, length * 0.75], 'head');
    oval(head, 'face', [0, 0, 0], [shark ? 0.36 : 0.33, shark ? 0.28 : 0.4, 0.42]);
    if (shark) {
      oval(head, 'hammer-bar', [0, 0.05, 0.21], [1.0, 0.14, 0.2]);
      for (const side of [-1, 1]) eye(head, [side * 0.94, 0.06, 0.28], 0.07, side);
    } else {
      for (const side of [-1, 1]) eye(head, [side * 0.3, 0.12, 0.16], 0.1, side);
      oval(head, 'mouth', [0, -0.06, 0.39], [0.16, 0.11, 0.055], dark);
      for (let i = 0; i < 5; i++) {
        const band = mesh(body, 'stripe', new THREE.TorusGeometry(0.44, 0.035, 6, detail), i % 2 && lion ? white : dark, [0, y, -0.65 + i * 0.29]);
        const taper = Math.sqrt(1 - ((-0.65 + i * 0.29) / length) ** 2);
        band.scale.set(0.4 / 0.44 * taper, 0.58 / 0.44 * taper, 1);
      }
    }
    for (const side of [-1, 1]) {
      const fin = pivot(body, `fin-${side}`, [side * 0.28, y - 0.12, 0.4], 'fin', side === -1 ? 0 : 1, side);
      const span = lion ? 0.95 : shark ? 0.9 : 0.55;
      const f = plate(fin, 'pectoral-fin', [[0, 0], [side * span, -0.25], [side * span * 0.75, -0.5], [0, -0.14]], 0.035, lion ? accent : skin); f.rotation.x = -0.55;
      for (let g = 0; g < 4; g++) {
        const gill = oval(body, 'gill', [side * 0.36, y, 0.45 - g * 0.085], [0.016, 0.2, 0.018], dark); gill.rotation.x = 0.12;
      }
      if (lion) for (let i = 0; i < 8; i++) {
        const angle = -0.5 + i * 0.18;
        spike(fin, 'pectoral-ray', [0, 0, 0], [side * (0.65 + Math.sin(i * 0.6) * 0.2), -0.15 - i * 0.05, Math.sin(angle) * 0.6], 0.025, i % 2 ? white : dark);
      }
    }
    const dorsal = pivot(body, 'dorsal-fin', [0, y + (shark ? 0.32 : 0.5), 0.1], 'fin', 2);
    const dorsalMesh = plate(dorsal, 'dorsal-surface', [[-0.4, 0], [0.05, shark ? 0.8 : 0.55], [0.42, 0]], 0.04, dark); dorsalMesh.rotation.y = Math.PI / 2;
    if (lion) for (let i = 0; i < 11; i++) spike(body, 'venom-spine', [0, y + 0.42, 0.65 - i * 0.13], [0, y + 0.9 + Math.sin(i / 10 * Math.PI) * 0.25, 0.65 - i * 0.17], 0.035, i % 2 ? white : accent);
    const tail = pivot(body, 'tail', [0, y, -length * 0.84], 'tail');
    rod(tail, 'tail-stalk', [0, 0, 0], [0, 0, -0.52], 0.2, 0.1);
    const tailFin = plate(tail, 'tail-fluke', [[0, 0], [-0.4, shark ? 0.8 : 0.55], [-0.52, 0.2], [-0.38, 0], [-0.52, -0.2], [-0.35, shark ? -0.52 : -0.55]], 0.04, accent); tailFin.rotation.y = -Math.PI / 2; tailFin.position.z = -0.4;
  } else if (species === 'bat' || species === 'crow') {
    const crow = species === 'crow';
    oval(body, 'breast', [0, 1, 0], [0.3, 0.5, 0.34]);
    oval(body, 'belly', [0, 0.95, 0.18], [0.25, 0.35, 0.19], crow ? dark : belly);
    head = pivot(body, 'head', [0, 1.56, 0.12], 'head');
    oval(head, 'cranium', [0, 0, 0], [0.27, 0.28, 0.3]);
    for (const side of [-1, 1]) eye(head, [side * 0.19, 0.04, 0.23], 0.065, side, crow ? black : amber);
    if (crow) {
      spike(head, 'beak', [0, -0.03, 0.24], [0, -0.06, 0.7], 0.13, dark);
      for (const side of [-1, 1]) {
        const wing = pivot(body, `wing-${side}`, [side * 0.24, 1.25, 0], 'wing', side === -1 ? 0 : 1, side);
        oval(wing, 'wing-coverts', [side * 0.4, -0.02, -0.05], [0.5, 0.2, 0.13], skin);
        for (let i = 0; i < 9; i++) {
          const feather = oval(wing, 'flight-feather', [side * (0.36 + i * 0.1), -0.24 - i * 0.025, -0.06 + i * 0.025], [0.1, 0.42 - i * 0.018, 0.035], i % 2 ? dark : skin); feather.rotation.z = side * (0.22 + i * 0.08);
        }
      }
      const tail = pivot(body, 'tail', [0, 0.68, -0.28], 'tail');
      for (let i = 0; i < 7; i++) { const feather = oval(tail, 'tail-feather', [(i - 3) * 0.075, -0.18, -0.22], [0.075, 0.08, 0.4], i % 2 ? dark : skin); feather.rotation.y = (i - 3) * -0.12; }
    } else {
      for (const side of [-1, 1]) {
        const ear = plate(head, 'ear', [[side * 0.12, 0.1], [side * 0.22, 0.65], [side * 0.39, 0.14]], 0.09, skin); ear.position.z = -0.05;
        const earIn = plate(head, 'ear-inside', [[side * 0.17, 0.18], [side * 0.23, 0.52], [side * 0.32, 0.19]], 0.015, pink); earIn.position.z = 0.01;
        membraneWing(body, side, [side * 0.2, 1.25, 0], 1.35, dark);
        spike(head, 'fang', [side * 0.08, -0.14, 0.28], [side * 0.07, -0.27, 0.3], 0.035, white);
      }
      oval(head, 'nose', [0, -0.07, 0.3], [0.11, 0.075, 0.05], pink);
    }
    for (let i = 0; i < 2; i++) { const side = i ? 1 : -1; leg(body, i, [side * 0.16, 0.64, 0], [side * 0.03, -0.19, -0.08], [side * 0.02, -0.4, 0.06], 0.05, dark, true); }
  } else if (species === 'octopus') {
    oval(body, 'mantle', [0, 1.1, -0.08], [0.65, 0.8, 0.55]);
    head = pivot(body, 'head', [0, 0.85, 0.22], 'head');
    oval(head, 'face', [0, 0, 0], [0.51, 0.4, 0.36]);
    for (const side of [-1, 1]) eye(head, [side * 0.36, 0.05, 0.27], 0.14, side);
    for (let i = 0; i < 12; i++) {
      const angle = i / 12 * Math.PI * 2;
      const points: Point[] = Array.from({ length: 9 }, (_, j) => {
        const reach = 0.34 + j * 0.15;
        return [Math.cos(angle) * reach, 0.5 - Math.sin(j / 8 * Math.PI) * 0.28 + Math.max(0, j - 5) * 0.055, Math.sin(angle) * reach];
      });
      const arm = chain(body, `arm-${i}`, points, 0.15, skin, 'tentacle', i * 9);
      arm.traverse(o => { if (o instanceof THREE.Group) { const r = o.userData.animalRadius || 0.025; oval(o, 'sucker', [0, -r * 0.8, 0], [r * 0.5, r * 0.22, r * 0.5], belly); } });
    }
  } else if (species === 'snake' || species === 'worm') {
    const worm = species === 'worm';
    const points: Point[] = Array.from({ length: 17 }, (_, i) => [Math.sin(i * 0.6) * 0.32, 0.32 + Math.cos(i * 0.4) * 0.025, 0.65 - i * 0.22]);
    const trail = chain(body, 'body-trail', points, worm ? 0.24 : 0.26, skin, 'tail');
    trail.traverse(o => {
      if (!(o instanceof THREE.Group)) return;
      const r = o.userData.animalRadius || 0.015;
      if (worm) mesh(o, 'body-ring', new THREE.TorusGeometry(r * 0.96, r * 0.09, 6, detail), dark);
      else oval(o, 'dorsal-marking', [0, r * 0.93, 0], [r * 0.48, r * 0.07, r * 0.45], dark);
    });
    head = pivot(body, 'head', [0, 0.36, 0.82], 'head');
    oval(head, 'head-volume', [0, 0, 0], [worm ? 0.23 : 0.31, 0.21, 0.42]);
    for (const side of [-1, 1]) eye(head, [side * (worm ? 0.14 : 0.25), 0.1, 0.21], worm ? 0.04 : 0.065, side);
    const jaw = pivot(head, 'jaw', [0, -0.12, 0.06], 'jaw'); oval(jaw, 'lower-mouth', [0, -0.025, 0.2], [0.24, 0.05, 0.22], belly);
    if (!worm) {
      const tongue = pivot(jaw, 'tongue', [0, 0, 0.35]);
      rod(tongue, 'tongue-base', [0, 0, 0], [0, 0, 0.22], 0.017, 0.012, pink);
      for (const side of [-1, 1]) rod(tongue, 'tongue-fork', [0, 0, 0.2], [side * 0.065, 0.015, 0.32], 0.011, 0.004, pink);

    }
  } else if (['spider', 'scorpion', 'centipede', 'mantis'].includes(species)) {
    const scorpion = species === 'scorpion', centipede = species === 'centipede', mantis = species === 'mantis';
    const chitin = scorpion ? mat(config.skinColor, 'polished-chitin', 0.2) : skin;
    const gold = scorpion ? mat('#e7b244', 'gold-armor', 0.3) : dark;
    const y = mantis ? 1.1 : 0.6;
    oval(body, 'thorax', [0, y, 0.2], [mantis ? 0.22 : 0.43, mantis ? 0.48 : 0.25, mantis ? 0.35 : 0.52], chitin);
    if (!centipede) oval(body, 'abdomen', [0, mantis ? 0.85 : y + 0.04, mantis ? -0.55 : -0.62], [mantis ? 0.28 : scorpion ? 0.43 : 0.64, mantis ? 0.25 : 0.4, mantis ? 0.75 : 0.7], chitin);
    head = pivot(body, 'head', [0, mantis ? 1.67 : y + 0.05, mantis ? 0.45 : 0.69], 'head');
    oval(head, 'head-shell', [0, 0, 0], [mantis ? 0.34 : 0.3, 0.2, 0.23], chitin);
    if (scorpion) {
      // Keep the Emperor's original blue eye cluster independent of body emission.
      const eyeGlow = new THREE.MeshStandardMaterial({
        name: 'scorpion-eye-glow', color: 0x00f0ff, emissive: 0x00d4ff,
        emissiveIntensity: 5, roughness: 0.05, metalness: 0.1,
        wireframe: Boolean(config.wireframeMode),
      });
      for (const side of [-1, 1]) {
        oval(head, `eye-${side < 0 ? 'left' : 'right'}`, [side * 0.09, 0.105, 0.184], [0.047, 0.047, 0.035], eyeGlow);
        oval(head, `lateral-eye-${side}-0`, [side * 0.205, 0.055, 0.154], [0.025, 0.025, 0.024], eyeGlow);
        oval(head, `lateral-eye-${side}-1`, [side * 0.259, 0.045, 0.1], [0.021, 0.021, 0.021], eyeGlow);
      }
    } else {
      const eyes = !mantis && !centipede ? 8 : 2;
      for (let i = 0; i < eyes; i++) {
        const side = i % 2 ? 1 : -1, row = Math.floor(i / 2);
        eye(head, [side * (mantis ? 0.29 : 0.1 + row * 0.045), 0.08 - row * 0.045, 0.2 - row * 0.012], mantis ? 0.12 : 0.045, mantis ? side : 0);
      }
    }
    for (const side of [-1, 1]) {
      spike(head, 'mandible', [side * 0.11, -0.08, 0.16], [side * 0.07, -0.23, 0.33], 0.06, gold);
      if (mantis || centipede) { rod(head, 'antenna', [side * 0.15, 0.16, 0], [side * 0.3, 0.6, 0.15], 0.018, 0.008, dark); }
    }
    const rows = centipede ? 10 : mantis ? 2 : 4;
    for (let row = 0; row < rows; row++) {
      let parent: THREE.Object3D = body;
      const z = centipede ? 0.35 - row * 0.34 : 0.4 - row * 0.29;
      if (centipede) {
        const segment = pivot(body, `body-segment-${row}`, [0, y, z], 'segment', row);
        oval(segment, 'body-shell', [0, 0, 0], [0.34, 0.23, 0.25], row % 2 ? accent : skin);
        parent = segment;
      }
      for (const side of [-1, 1]) {
        const origin: Point = [side * (mantis ? 0.17 : 0.3), centipede ? -0.05 : y - 0.03, centipede ? 0 : z];
        const reach = mantis ? 0.68 : scorpion ? 0.7 : centipede ? 0.45 : 0.9;
        const lift = mantis ? -0.25 : 0.17;
        leg(parent, row * 2 + (side > 0 ? 1 : 0), origin, [side * reach * 0.6, lift, (row / rows - 0.5) * 0.3], [side * reach, -(centipede ? y - 0.13 : y - 0.1), (row / rows - 0.5) * 0.55], mantis ? 0.045 : 0.055, chitin);
      }
    }
    if (scorpion) {
      for (let i = 0; i < 5; i++) oval(body, 'back-plate', [0, y + 0.35, 0.15 - i * 0.22], [0.39 - i * 0.025, 0.055, 0.09], gold);
      for (const side of [-1, 1]) {
        const claw = pivot(body, `claw-${side}`, [side * 0.3, y, 0.55], 'claw', side < 0 ? 0 : 1, side);
        rod(claw, 'claw-arm', [0, 0, 0], [side * 0.4, 0, 0.55], 0.11, 0.14, chitin);
        oval(claw, 'pincer-palm', [side * 0.4, 0, 0.65], [0.21, 0.14, 0.24], chitin);
        spike(claw, 'fixed-pincer', [side * 0.27, 0, 0.73], [side * 0.31, 0, 1.02], 0.085, gold);
        const finger = pivot(claw, `pincer-${side}`, [side * 0.54, 0, 0.74], 'jaw');
        spike(finger, 'moving-pincer', [0, 0, 0], [-side * 0.18, 0, 0.28], 0.075, gold);
      }
      const tailPoints: Point[] = [[0, y + 0.1, -1.05], [0, y + 0.25, -1.35], [0, y + 0.55, -1.5], [0, y + 0.88, -1.45], [0, y + 1.1, -1.2], [0, y + 1.18, -0.85], [0, y + 1.03, -0.58]];
      const tail = chain(body, 'tail', tailPoints, 0.18, chitin);
      let tip: THREE.Object3D = tail; while (tip.children.some(o => o instanceof THREE.Group)) tip = tip.children.find(o => o instanceof THREE.Group)!;
      oval(tip, 'venom-bulb', [0, -0.02, 0.02], [0.13, 0.16, 0.14], gold);
      spike(tip, 'stinger', [0, -0.1, 0.08], [0, -0.35, 0.16], 0.075, gold);
    }
    if (mantis) {
      for (const side of [-1, 1]) {
        const raptor = pivot(body, `claw-${side}`, [side * 0.17, 1.34, 0.42], 'claw', side < 0 ? 0 : 1, side);
        rod(raptor, 'raptorial-femur', [0, 0, 0], [side * 0.13, -0.43, 0.3], 0.09, 0.07);
        rod(raptor, 'folded-tibia', [side * 0.13, -0.43, 0.3], [side * 0.12, -0.08, 0.47], 0.055, 0.018, dark);
        for (let i = 0; i < 5; i++) spike(raptor, 'gripping-spine', [side * 0.1, -0.12 - i * 0.055, 0.17 + i * 0.035], [side * 0.1, -0.14 - i * 0.055, 0.28 + i * 0.035], 0.02, dark);
        const wing = pivot(body, `wing-${side}`, [side * 0.12, 1.05, -0.2], 'wing', side < 0 ? 0 : 1, side);
        oval(wing, 'leaf-wing', [side * 0.05, 0, -0.47], [0.19, 0.06, 0.66], accent);
        rod(wing, 'wing-vein', [0, 0.055, 0], [side * 0.06, 0.055, -1], 0.014, 0.005, dark);
      }
    }
  } else {
    throw new Error(`Unsupported animal: ${species}`);
  }

  // Shared customization operates on animal parts without creating human limbs/clothes.
  head!.scale.multiply(new THREE.Vector3(config.headScaleX ?? 1, config.headScaleY ?? 1, config.headScaleZ ?? 1));
  head!.rotation.set(config.headRotateX ?? 0, config.headRotateY ?? 0, config.headRotateZ ?? 0);
  head!.position.add(new THREE.Vector3(config.headTranslateX ?? 0, config.headTranslateY ?? 0, config.headTranslateZ ?? 0));
  const accessories = config.accessories || [];
  if (accessories.includes('crown')) {
    mesh(head!, 'crown-band', new THREE.TorusGeometry(0.28, 0.035, 6, detail), mat('#eab94e', 'crown'), [0, 0.28, 0]).rotation.x = Math.PI / 2;
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; spike(head!, 'crown-point', [Math.cos(a) * 0.26, 0.25, Math.sin(a) * 0.26], [Math.cos(a) * 0.28, 0.48, Math.sin(a) * 0.28], 0.055, mat('#eab94e', 'crown-point')); }
  }
  if (accessories.includes('halo')) { const halo = mesh(head!, 'halo', new THREE.TorusGeometry(0.38, 0.025, 8, detail), mat('#fff1a3', 'halo'), [0, 0.62, 0]); halo.rotation.x = Math.PI / 2; }
  if (accessories.includes('horns') && species !== 'dragon') for (const side of [-1, 1]) spike(head!, 'accessory-horn', [side * 0.24, 0.2, -0.08], [side * 0.33, 0.62, -0.15], 0.09, white);
  if (accessories.includes('glasses')) for (const side of [-1, 1]) mesh(head!, 'glasses', new THREE.TorusGeometry(0.13, 0.018, 6, detail), dark, [side * 0.18, 0.06, 0.37]);
  const typeScale = config.bodyType === 'chibi' ? new THREE.Vector3(0.95, 0.8, 0.95) : config.bodyType === 'tall' ? new THREE.Vector3(0.95, 1.15, 1) : config.bodyType === 'athletic' ? new THREE.Vector3(1.1, 1.04, 1.08) : new THREE.Vector3(1, 1, 1);
  body.scale.copy(typeScale).multiply(new THREE.Vector3(config.torsoScaleX ?? 1, config.torsoScaleY ?? 1, config.torsoScaleZ ?? 1));
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  body.position.y = -bounds.min.y + 0.025;
  body.position.add(new THREE.Vector3(config.torsoTranslateX ?? 0, config.torsoTranslateY ?? 0, config.torsoTranslateZ ?? 0));
  root.updateMatrixWorld(true);
  root.userData.boundingBoxes = { animal: new THREE.Box3().setFromObject(root) };
  attachAnimalAnimations(root, species);
  return root;
}
