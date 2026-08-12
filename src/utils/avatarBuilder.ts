import * as THREE from "three";
import { AvatarConfig, HairStyle, BodyType, HeadShape } from "../types";

// ==========================================
// GEOMETRY REUSE CACHE
// ==========================================
const geometryCache = new Map<string, THREE.BufferGeometry>();

// Helper to calculate segments for detail levels (LOD)
function seg(detail: "low" | "medium" | "high" | number = "medium"): number {
  if (typeof detail === "number") return detail;
  if (detail === "low") return 12;
  if (detail === "high") return 32;
  return 20;
}

function getSphereGeometry(
  radius: number,
  detailLevel: "low" | "medium" | "high" | number,
  heightSeg?: "low" | "medium" | "high" | number,
  ...args: any[]
): THREE.SphereGeometry {
  const resolvedWidthSeg = seg(detailLevel);
  const resolvedHeightSeg = heightSeg !== undefined ? seg(heightSeg) : resolvedWidthSeg;
  
  const key = `sphere_${radius}_${resolvedWidthSeg}_${resolvedHeightSeg}_${args.join("_")}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.SphereGeometry(radius, resolvedWidthSeg, resolvedHeightSeg, ...args));
  }
  return geometryCache.get(key) as THREE.SphereGeometry;
}

function getCylinderGeometry(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  detailLevel: "low" | "medium" | "high" | number,
  ...args: any[]
): THREE.CylinderGeometry {
  const resolvedRadSeg = seg(detailLevel);
  const key = `cylinder_${radiusTop}_${radiusBottom}_${height}_${resolvedRadSeg}_${args.join("_")}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, resolvedRadSeg, ...args));
  }
  return geometryCache.get(key) as THREE.CylinderGeometry;
}

function getBoxGeometry(width: number, height: number, depth: number): THREE.BoxGeometry {
  const key = `box_${width}_${height}_${depth}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.BoxGeometry(width, height, depth));
  }
  return geometryCache.get(key) as THREE.BoxGeometry;
}

// ==========================================
// CONFIG VALIDATION
// ==========================================
export function validateAvatarConfig(config: AvatarConfig): AvatarConfig {
  const validated = { ...config };

  const validHeadShapes: HeadShape[] = ["cube", "rounded-cube", "organic-smooth"];
  const validHairStyles: HairStyle[] = ["none", "short", "long", "afro", "ponytail", "cap"];
  const validBodyTypes: BodyType[] = ["normal", "chibi", "tall", "athletic"];

  if (!validHeadShapes.includes(validated.headShape)) validated.headShape = "organic-smooth";
  // Force blank bald head - no hair ever (photo mapping needs clean face)
  validated.hairStyle = "none";
  if (!validBodyTypes.includes(validated.bodyType)) validated.bodyType = "normal";

  const validCreatureVariants = [
    "none", "gremlin", "monster", "gator", "raccoon", "cat", "dog", "lizard", "possum",
    "tigerfish", "lionfish", "clown", "dragon", "fairy", "hammerhead",
    "octopus", "spider", "snake", "bat", "crow", "rat", "centipede", "biped-lizard",
    "toad", "scorpion", "worm", "mantis",
  ];
  if (!validated.creatureVariant || !validCreatureVariants.includes(validated.creatureVariant)) {
    validated.creatureVariant = "none";
  }

  const hexRegex = /^#[0-9A-F]{6}$/i;
  if (!validated.skinColor || !hexRegex.test(validated.skinColor)) validated.skinColor = "#e5a65d";
  if (!validated.hairColor || !hexRegex.test(validated.hairColor)) validated.hairColor = "#211510";
  if (!validated.clothingColor || !hexRegex.test(validated.clothingColor)) validated.clothingColor = "#1e3a8a";
  if (!validated.pantsColor || !hexRegex.test(validated.pantsColor)) validated.pantsColor = "#111827";
  if (!validated.shoesColor || !hexRegex.test(validated.shoesColor)) validated.shoesColor = "#ffffff";

  if (!validated.detailLevel) validated.detailLevel = "medium";
  if (!validated.accessories) validated.accessories = [];
  if (!validated.clothingStyle) validated.clothingStyle = "tshirt";
  if (!validated.expression) validated.expression = "neutral";
  if (validated.morphSlender === undefined) validated.morphSlender = 0;
  if (validated.morphBulk === undefined) validated.morphBulk = 0;

  return validated;
}

// Helper to draw expressions on top of the face texture
function drawExpressionOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  expression: "neutral" | "happy" | "angry" | "sad" | "surprised"
) {
  ctx.strokeStyle = "#141414";
  ctx.lineWidth = width * 0.035;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const cx = width / 2;
  const cy = height / 2;

  if (expression === "happy") {
    // Rosy blushing cheeks
    ctx.fillStyle = "rgba(239, 68, 68, 0.45)";
    ctx.beginPath();
    ctx.arc(cx - width * 0.24, cy + height * 0.12, width * 0.09, 0, Math.PI * 2);
    ctx.arc(cx + width * 0.24, cy + height * 0.12, width * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Curved smiling eyebrows
    ctx.beginPath();
    ctx.arc(cx - width * 0.2, cy - height * 0.08, width * 0.08, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx + width * 0.2, cy - height * 0.08, width * 0.08, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();

    // Smiley upturned mouth
    ctx.fillStyle = "#141414";
    ctx.beginPath();
    ctx.arc(cx, cy + height * 0.12, width * 0.14, 0, Math.PI);
    ctx.fill();

  } else if (expression === "angry") {
    // Angry eyebrows angled down towards nose
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.28, cy - height * 0.14);
    ctx.lineTo(cx - width * 0.08, cy - height * 0.08);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + width * 0.28, cy - height * 0.14);
    ctx.lineTo(cx + width * 0.08, cy - height * 0.08);
    ctx.stroke();

    // Angry downturned mouth
    ctx.beginPath();
    ctx.arc(cx, cy + height * 0.24, width * 0.11, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

  } else if (expression === "sad") {
    // Sad eyebrows angled up inwards
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.28, cy - height * 0.08);
    ctx.lineTo(cx - width * 0.08, cy - height * 0.15);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + width * 0.28, cy - height * 0.08);
    ctx.lineTo(cx + width * 0.08, cy - height * 0.15);
    ctx.stroke();

    // Sad downturned curve
    ctx.beginPath();
    ctx.arc(cx, cy + height * 0.22, width * 0.12, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

  } else if (expression === "surprised") {
    // High-arched raised eyebrows
    ctx.beginPath();
    ctx.arc(cx - width * 0.2, cy - height * 0.14, width * 0.08, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx + width * 0.2, cy - height * 0.14, width * 0.08, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();

    // Open O mouth: a tall oval gasp, not a small dot
    ctx.fillStyle = "#141414";
    ctx.beginPath();
    ctx.ellipse(cx, cy + height * 0.15, width * 0.08, height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // Neutral soft straight lips
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.12, cy + height * 0.16);
    ctx.lineTo(cx + width * 0.12, cy + height * 0.16);
    ctx.stroke();
  }
}

// Front projection UVs for seamless head wrapping.
// Maps the face texture across the front hemisphere with a soft falloff
// to skin-colored texture corners on the sides/back (avoids hard sticker edge).
function applyFrontProjectionUVs(geometry: THREE.BufferGeometry) {
  const position = geometry.attributes.position;
  if (!position) return;
  const uvs: number[] = [];

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    const len = Math.sqrt(x * x + y * y + z * z);
    const nx = x / (len || 1);
    const ny = y / (len || 1);
    const nz = z / (len || 1);

    // Wider, softer front hemisphere (covers ~front 2/3 of skull before full skin)
    const blend = Math.max(0, Math.min(1, (nz + 0.25) / 0.95));
    // Smoothstep for less banding at the silhouette
    const t = blend * blend * (3 - 2 * blend);

    // Center face slightly high so eyes sit above equator of the sphere
    const uProj = 0.5 + nx * 0.38;
    const vProj = 0.48 + ny * 0.42;

    // Skin-colored border of the prepared texture (corners stay pure skin)
    const uSkin = 0.02;
    const vSkin = 0.02;

    const u = uProj * t + uSkin * (1 - t);
    const v = vProj * t + vSkin * (1 - t);

    uvs.push(u, v);
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
}

// Add Morph Targets to a BufferGeometry
function addMorphTargets(geometry: THREE.BufferGeometry, isSkull: boolean) {
  const positionAttr = geometry.attributes.position;
  if (!positionAttr) return;

  const slenderPositions: number[] = [];
  const bulkPositions: number[] = [];

  for (let i = 0; i < positionAttr.count; i++) {
    const x = positionAttr.getX(i);
    const y = positionAttr.getY(i);
    const z = positionAttr.getZ(i);

    if (isSkull) {
      // Slender morph (squashed along X and Z)
      slenderPositions.push(x * -0.15, 0, z * -0.12);
      // Bulk morph (inflated along X and Z)
      bulkPositions.push(x * 0.18, 0, z * 0.15);
    } else {
      // Torso morph
      slenderPositions.push(x * -0.22, 0, z * -0.22);
      bulkPositions.push(x * 0.28, 0, z * 0.28);
    }
  }

  geometry.morphAttributes.position = [];
  geometry.morphAttributes.position[0] = new THREE.Float32BufferAttribute(slenderPositions, 3);
  geometry.morphAttributes.position[1] = new THREE.Float32BufferAttribute(bulkPositions, 3);
}

// ==========================================
// MAIN BUILD AVATAR FUNCTION
// ==========================================
export function buildAvatar(
  rawConfig: AvatarConfig,
  faceTextureCanvas: HTMLCanvasElement | null
): THREE.Group {
  // Validate config first to ensure no broken configs or garbage values
  const config = validateAvatarConfig(rawConfig);

  const group = new THREE.Group();
  group.name = "avatar-root";

  // Dimensions based on body proportions
  let scaleY = 1.0;
  let scaleXZ = 1.0;
  let headSize = 1.0;
  let torsoHeight = 1.5;
  let torsoWidth = 1.2;
  let torsoDepth = 0.6;
  let limbWidth = 0.35;
  let limbLength = 1.3;

  switch (config.bodyType) {
    case "chibi":
      scaleY = 0.7;
      scaleXZ = 0.9;
      headSize = 1.3;
      torsoHeight = 1.0;
      limbLength = 0.8;
      break;
    case "tall":
      scaleY = 1.3;
      scaleXZ = 0.95;
      headSize = 0.9;
      torsoHeight = 1.8;
      limbLength = 1.6;
      break;
    case "athletic":
      scaleXZ = 1.1;
      torsoWidth = 1.4;
      headSize = 0.95;
      limbWidth = 0.4;
      break;
    case "normal":
    default:
      break;
  }

  const radialSeg = seg(config.detailLevel);

  // ==========================================
  // FACIAL GEOMETRY SCALE FACTORS (from photo detection)
  // ==========================================
  const faceShapeScales = {
    round: { x: 1.1, y: 0.95, z: 1.05 },
    oval: { x: 1.0, y: 1.05, z: 1.0 },
    square: { x: 1.05, y: 0.98, z: 1.0 },
    heart: { x: 1.0, y: 1.08, z: 0.95 },
    long: { x: 0.95, y: 1.15, z: 0.98 }
  };
  
  const noseSizeScales = {
    small: 0.75,
    medium: 1.0,
    large: 1.35
  };
  
  const noseWidthScales = {
    narrow: 0.8,
    medium: 1.0,
    wide: 1.3
  };
  
  const jawWidthScales = {
    narrow: 0.9,
    medium: 1.0,
    wide: 1.15
  };
  
  const chinShapeScales = {
    pointed: { y: 1.2, z: 0.85 },
    rounded: { y: 1.0, z: 1.0 },
    square: { y: 0.9, z: 1.1 },
    prominent: { y: 1.15, z: 1.25 }
  };

  // Apply detected facial geometry or use defaults (with fallback for unrecognized values)
  const faceScale = config.faceShape ? (faceShapeScales[config.faceShape] || faceShapeScales.oval) : { x: 1.0, y: 1.0, z: 1.0 };
  const noseScale = config.noseSize ? (noseSizeScales[config.noseSize] || 1.0) : 1.0;
  const noseWidthScale = config.noseWidth ? (noseWidthScales[config.noseWidth] || 1.0) : 1.0;
  const jawScale = config.jawWidth ? (jawWidthScales[config.jawWidth] || 1.0) : 1.0;
  const chinScale = config.chinShape ? (chinShapeScales[config.chinShape] || { y: 1.0, z: 1.0 }) : { y: 1.0, z: 1.0 };

  // Helper to dynamically inject Blender-style material adjustments
  const getMatParams = (baseRoughness: number, baseMetalness: number) => {
    return {
      roughness: config.materialRoughness !== undefined ? config.materialRoughness : baseRoughness,
      metalness: config.materialMetalness !== undefined ? config.materialMetalness : baseMetalness,
      wireframe: !!config.wireframeMode,
      emissive: new THREE.Color(config.materialEmissive || "#000000"),
      emissiveIntensity: config.materialEmissiveIntensity !== undefined ? config.materialEmissiveIntensity : 0,
    };
  };

  // Materials
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.skinColor),
    ...getMatParams(0.85, 0.05),
    name: "skin"
  });

  const hairMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.hairColor),
    ...getMatParams(0.9, 0.05),
    name: "hair"
  });

  const clothingMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.clothingColor),
    ...getMatParams(0.7, 0.08),
    name: "clothing"
  });

  const pantsMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.pantsColor),
    ...getMatParams(0.85, 0.05),
    name: "pants"
  });

  const shoesMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.shoesColor),
    ...getMatParams(0.6, 0.15),
    name: "shoes"
  });

  // Construct dynamic face texture with expressions
  let faceMaterial: THREE.Material;
  const expressionVal = config.expression || "neutral";

  // ==========================================
  // DUAL TEXTURE SYSTEM: Procedural 3D Face + Photo
  // Baked to a single canvas + MeshStandardMaterial so the head
  // receives the same scene lights as the body (no flat sticker shader).
  // ==========================================

  // 1. Procedural 3D face texture (pixel eyes + expression)
  const proceduralCanvas = document.createElement("canvas");
  proceduralCanvas.width = 256;
  proceduralCanvas.height = 256;
  const procCtx = proceduralCanvas.getContext("2d");

  const hasPhotoTexture = faceTextureCanvas !== null;

  if (procCtx) {
    procCtx.fillStyle = config.skinColor;
    procCtx.fillRect(0, 0, 256, 256);

    // Cartoon face — only when NO photo texture is mapped.
    // With a photo: blank skin base, photo is the face.
    if (!hasPhotoTexture) {
      // Eyes
      procCtx.fillStyle = "#141414";
      const eyeY = 105;
      const eyeLX = 86;
      const eyeRX = 170;
      const eyeR = 11;
      procCtx.beginPath();
      procCtx.arc(eyeLX, eyeY, eyeR, 0, Math.PI * 2);
      procCtx.arc(eyeRX, eyeY, eyeR, 0, Math.PI * 2);
      procCtx.fill();
      // Eye highlights
      procCtx.fillStyle = "#f5f5f0";
      procCtx.beginPath();
      procCtx.arc(eyeLX + 3, eyeY - 3, 3, 0, Math.PI * 2);
      procCtx.arc(eyeRX + 3, eyeY - 3, 3, 0, Math.PI * 2);
      procCtx.fill();
      // Mouth / expression
      drawExpressionOverlay(procCtx, 256, 256, expressionVal);
    }
  }

  // 2. Bake final face map: procedural <-> photo morph on canvas
  const morphProgress =
    config.photoMorphProgress !== undefined
      ? config.photoMorphProgress
      : faceTextureCanvas
        ? 1.0
        : 0.0;

  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = 256;
  faceCanvas.height = 256;
  const faceCtx = faceCanvas.getContext("2d");

  if (faceCtx) {
    // Always start with skin background base
    faceCtx.fillStyle = config.skinColor;
    faceCtx.fillRect(0, 0, 256, 256);

    if (hasPhotoTexture && faceTextureCanvas && morphProgress > 0) {
      try {
        if (morphProgress >= 0.999) {
          // Full photo: draw prepared photo face texture
          faceCtx.drawImage(faceTextureCanvas, 0, 0, 256, 256);
        } else {
          // Partial morph: draw procedural base then layer photo with alpha = morphProgress
          faceCtx.drawImage(proceduralCanvas, 0, 0, 256, 256);
          faceCtx.save();
          faceCtx.globalAlpha = morphProgress;
          faceCtx.drawImage(faceTextureCanvas, 0, 0, 256, 256);
          faceCtx.restore();
        }
      } catch (err) {
        console.warn("Could not draw faceTextureCanvas:", err);
      }
    } else {
      faceCtx.drawImage(proceduralCanvas, 0, 0, 256, 256);
    }
  }

  const faceMap = new THREE.CanvasTexture(faceCanvas);
  faceMap.colorSpace = THREE.SRGBColorSpace;
  faceMap.wrapS = THREE.ClampToEdgeWrapping;
  faceMap.wrapT = THREE.ClampToEdgeWrapping;
  faceMap.needsUpdate = true;

  faceMaterial = new THREE.MeshStandardMaterial({
    map: faceMap,
    ...getMatParams(0.75, 0.05),
    name: "face",
  });
  (faceMaterial as THREE.MeshStandardMaterial).userData = { morphProgress };

  // ==========================================
  // 1. TORSO & NECK (WITH CLOTHING VARIATIONS)
  // ==========================================
  let torso: THREE.Mesh;
  let neck: THREE.Mesh;

  if (config.headShape === "organic-smooth") {
    // Beautiful organic cylindrical chest
    const torsoGeo = getCylinderGeometry(torsoWidth / 2, torsoWidth / 2.3, torsoHeight, radialSeg).clone();
    addMorphTargets(torsoGeo, false);
    
    torso = new THREE.Mesh(torsoGeo, clothingMaterial);
    torso.name = "torso";
    torso.position.y = limbLength + torsoHeight / 2;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    // Apply morph target influences
    torso.morphTargetInfluences = [config.morphSlender || 0, config.morphBulk || 0];

    // Rounded shoulders/chest top cap
    const chestTopGeo = getSphereGeometry(torsoWidth / 2, radialSeg, radialSeg);
    const chestTop = new THREE.Mesh(chestTopGeo, clothingMaterial);
    chestTop.name = "chest-top";
    chestTop.position.y = torsoHeight / 2;
    chestTop.scale.set(1, 0.4, torsoDepth / torsoWidth);
    torso.add(chestTop);

    // Rounded bottom cap
    const pelvisGeo = getSphereGeometry(torsoWidth / 2.3, radialSeg, radialSeg);
    const pelvis = new THREE.Mesh(pelvisGeo, pantsMaterial);
    pelvis.name = "pelvis";
    pelvis.position.y = -torsoHeight / 2;
    pelvis.scale.set(1, 0.4, torsoDepth / torsoWidth);
    torso.add(pelvis);

    // Neck
    const neckGeo = getCylinderGeometry(0.18, 0.18, 0.25, radialSeg);
    neck = new THREE.Mesh(neckGeo, skinMaterial);
    neck.name = "neck";
    neck.position.y = torsoHeight / 2 + 0.125;
    neck.castShadow = true;
    torso.add(neck);

  } else {
    // Blocky cube torso
    const torsoGeo = getBoxGeometry(torsoWidth, torsoHeight, torsoDepth).clone();
    addMorphTargets(torsoGeo, false);

    torso = new THREE.Mesh(torsoGeo, clothingMaterial);
    torso.name = "torso";
    torso.position.y = limbLength + torsoHeight / 2;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    torso.morphTargetInfluences = [config.morphSlender || 0, config.morphBulk || 0];

    // Blocky neck
    const neckGeo = getBoxGeometry(0.3, 0.2, 0.3);
    neck = new THREE.Mesh(neckGeo, skinMaterial);
    neck.name = "neck";
    neck.position.y = torsoHeight / 2 + 0.1;
    torso.add(neck);
  }

  // ==========================================
  // APPLY CLOTHING STYLE EXTRAS
  // ==========================================
  const clothingStyle = config.clothingStyle || "tshirt";

  if (clothingStyle === "hoodie") {
    // Extruded hood on back
    const hoodGeo = config.headShape === "organic-smooth"
      ? getSphereGeometry(headSize * 0.45, radialSeg, radialSeg)
      : getBoxGeometry(headSize * 0.9, headSize * 0.9, headSize * 0.9);
    
    const hood = new THREE.Mesh(hoodGeo, clothingMaterial);
    hood.name = "hood";
    hood.position.set(0, torsoHeight / 2 - 0.05, -0.25);
    hood.castShadow = true;
    torso.add(hood);

  } else if (clothingStyle === "armor") {
    const armorMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#9ca3af"), // steel silver
      roughness: 0.15,
      metalness: 0.92,
      name: "armor"
    });

    // Chestplate overlay
    const chestPlateGeo = config.headShape === "organic-smooth"
      ? getCylinderGeometry(torsoWidth / 1.95, torsoWidth / 2.25, torsoHeight * 0.85, radialSeg)
      : getBoxGeometry(torsoWidth * 1.06, torsoHeight * 0.85, torsoDepth * 1.15);
    
    const chestPlate = new THREE.Mesh(chestPlateGeo, armorMaterial);
    chestPlate.name = "chestplate";
    chestPlate.position.set(0, 0.02, 0.01);
    chestPlate.castShadow = true;
    torso.add(chestPlate);

    // Shoulder Pauldrons
    const pauldronGeo = config.headShape === "organic-smooth"
      ? getSphereGeometry(0.24, radialSeg, radialSeg)
      : getBoxGeometry(0.42, 0.26, 0.42);

    const leftPauldron = new THREE.Mesh(pauldronGeo, armorMaterial);
    leftPauldron.name = "left-pauldron";
    leftPauldron.position.set(-torsoWidth / 2 - 0.05, torsoHeight / 2, 0);
    leftPauldron.castShadow = true;
    torso.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(pauldronGeo, armorMaterial);
    rightPauldron.name = "right-pauldron";
    rightPauldron.position.set(torsoWidth / 2 + 0.05, torsoHeight / 2, 0);
    rightPauldron.castShadow = true;
    torso.add(rightPauldron);

  } else if (clothingStyle === "dress") {
    // Flowing elegant dress skirt
    const skirtHeight = limbLength * 0.78;
    const skirtGeo = config.headShape === "organic-smooth"
      ? getCylinderGeometry(torsoWidth / 2, torsoWidth * 0.76, skirtHeight, radialSeg)
      : getBoxGeometry(torsoWidth * 1.12, skirtHeight, torsoDepth * 1.35);
    
    const skirt = new THREE.Mesh(skirtGeo, clothingMaterial);
    skirt.name = "skirt";
    skirt.position.set(0, -torsoHeight / 2 - skirtHeight / 2, 0);
    skirt.castShadow = true;
    skirt.receiveShadow = true;
    torso.add(skirt);
  }

  // ==========================================
  // 2. HEAD & SKULL (WITH MORPHS & COLLISION CLAMPS)
  // ==========================================
  const actualHeadSize = 0.95 * headSize;
  let head: THREE.Group | THREE.Mesh;

  if (config.headShape === "organic-smooth") {
    head = new THREE.Group() as any;
    head.name = "head";
    head.position.y = neck.position.y + actualHeadSize / 2 + 0.1;
    torso.add(head);

    const skullRadius = actualHeadSize * 0.48;

    // Single skull sphere with morph targets
    const skullGeo = getSphereGeometry(skullRadius, radialSeg, radialSeg).clone();
    applyFrontProjectionUVs(skullGeo);
    addMorphTargets(skullGeo, true);

    const skull = new THREE.Mesh(skullGeo, faceMaterial);
    skull.name = "skull";
    
    // Enhanced face mapping: apply detected facial proportions more accurately
    const baseScaleX = 1.0 * faceScale.x * jawScale;
    const baseScaleY = 1.15 * faceScale.y * chinScale.y;
    const baseScaleZ = 1.05 * faceScale.z * chinScale.z;
    
    skull.scale.set(baseScaleX, baseScaleY, baseScaleZ);
    skull.castShadow = true;
    skull.receiveShadow = true;
    head.add(skull);

    skull.morphTargetInfluences = [config.morphSlender || 0, config.morphBulk || 0];

  } else if (config.headShape === "rounded-cube") {
    head = new THREE.Group() as any;
    head.name = "head";
    head.position.y = neck.position.y + actualHeadSize / 2 + 0.1;
    torso.add(head);

    const skullRadius = actualHeadSize * 0.52;

    const skullGeo = getSphereGeometry(skullRadius, radialSeg, radialSeg).clone();
    applyFrontProjectionUVs(skullGeo);
    addMorphTargets(skullGeo, true);

    const skull = new THREE.Mesh(skullGeo, faceMaterial);
    skull.name = "skull";
    
    // Enhanced face mapping: apply detected facial proportions more accurately
    const baseScaleX = 1.04 * faceScale.x * jawScale;
    const baseScaleY = 0.96 * faceScale.y * chinScale.y;
    const baseScaleZ = 1.0 * faceScale.z * chinScale.z;
    
    skull.scale.set(baseScaleX, baseScaleY, baseScaleZ);
    skull.castShadow = true;
    skull.receiveShadow = true;
    head.add(skull);

    skull.morphTargetInfluences = [config.morphSlender || 0, config.morphBulk || 0];

  } else {
    // Retro box head
    const headGeo = getBoxGeometry(actualHeadSize, actualHeadSize, actualHeadSize).clone();
    addMorphTargets(headGeo, true);

    const headMaterials = [
      skinMaterial, // Right
      skinMaterial, // Left
      skinMaterial, // Top
      skinMaterial, // Bottom
      faceMaterial, // Front
      skinMaterial, // Back
    ];
    head = new THREE.Mesh(headGeo, headMaterials);
    head.name = "head";
    head.position.y = neck.position.y + actualHeadSize / 2 + 0.1;
    head.castShadow = true;
    head.receiveShadow = true;
    torso.add(head);

    (head as THREE.Mesh).morphTargetInfluences = [config.morphSlender || 0, config.morphBulk || 0];
  }

  // ==========================================
  // ADD NOSE, EARS, AND CHIN MESHES (LOD & BOUNDING BOX COMPLIANT)
  // ==========================================
  const isOrganicHead = config.headShape === "organic-smooth" || config.headShape === "rounded-cube";
  const skullRadiusVal = isOrganicHead 
    ? actualHeadSize * (config.headShape === "rounded-cube" ? 0.52 : 0.48)
    : actualHeadSize * 0.5;


  // 1. Nose — removed, blank face avatar (photo-only)

  // 2. Ears
  const ears = new THREE.Group();
  ears.name = "ears";
  
  const earGeo = isOrganicHead
    ? getSphereGeometry(0.07 * headSize, radialSeg, radialSeg)
    : getBoxGeometry(0.12 * headSize, 0.18 * headSize, 0.08 * headSize);
    
  const leftEar = new THREE.Mesh(earGeo, skinMaterial);
  leftEar.name = "left-ear";
  leftEar.position.set(-skullRadiusVal - (isOrganicHead ? 0.02 : 0.04) * headSize, 0, 0);
  leftEar.castShadow = true;
  ears.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMaterial);
  rightEar.name = "right-ear";
  rightEar.position.set(skullRadiusVal + (isOrganicHead ? 0.02 : 0.04) * headSize, 0, 0);
  rightEar.castShadow = true;
  ears.add(rightEar);
  
  head.add(ears);


  // 3. Chin — removed, blank face avatar (photo-only)

  // --- CREATURE VARIANT: EXTRA DISTINGUISHING HEAD DETAIL ---
  if (config.creatureVariant === "monster" && !hasPhotoTexture) {
    const wartMat = new THREE.MeshStandardMaterial({ color: 0x3f3f2e, roughness: 0.9, name: "monster-wart" });
    const wartSpots: [number, number, number, number][] = [
      [0.09, actualHeadSize * 0.32, actualHeadSize * 0.18, actualHeadSize * 0.32],
      [0.07, -actualHeadSize * 0.28, actualHeadSize * 0.05, actualHeadSize * 0.36],
      [0.06, actualHeadSize * 0.02, actualHeadSize * 0.4, actualHeadSize * 0.22],
    ];
    wartSpots.forEach(([radius, x, y, z], i) => {
      const wart = new THREE.Mesh(getSphereGeometry(radius, 8, 8), wartMat);
      wart.name = `monster-wart-${i}`;
      wart.position.set(x, y, z);
      wart.castShadow = true;
      head.add(wart);
    });

    const fangMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.3, name: "monster-fang" });
    const fangGeo = new THREE.ConeGeometry(actualHeadSize * 0.045, actualHeadSize * 0.15, 6);
    [-1, 1].forEach((side) => {
      const fang = new THREE.Mesh(fangGeo, fangMat);
      fang.name = `monster-fang-${side}`;
      fang.rotation.x = Math.PI;
      fang.position.set(side * actualHeadSize * 0.14, -actualHeadSize * 0.32, actualHeadSize * 0.42);
      fang.castShadow = true;
      head.add(fang);
    });
  }

  if (config.creatureVariant === "gremlin" && !hasPhotoTexture) {
    const eyeGlowMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      emissive: new THREE.Color(0xeab308),
      emissiveIntensity: 1.2,
      roughness: 0.3,
      name: "gremlin-eye-glow",
    });
    [-1, 1].forEach((side) => {
      const glow = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.05, 8, 8), eyeGlowMat);
      glow.name = `gremlin-eye-glow-${side}`;
      glow.position.set(side * actualHeadSize * 0.2, actualHeadSize * 0.05, actualHeadSize * 0.44);
      head.add(glow);
    });
  }

  if (config.creatureVariant === "raccoon" && !hasPhotoTexture) {
    // The bandit eye mask is what actually reads as "raccoon" rather than generic rodent.
    const maskMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7, name: "raccoon-mask" });
    [-1, 1].forEach((side) => {
      const mask = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.13, 10, 10), maskMat);
      mask.name = `raccoon-mask-${side}`;
      mask.scale.set(1.15, 0.7, 0.5);
      mask.position.set(side * actualHeadSize * 0.19, actualHeadSize * 0.04, actualHeadSize * 0.42);
      head.add(mask);
    });

    const muzzleMat = new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.6, name: "raccoon-muzzle" });
    const muzzle = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.16, 10, 10), muzzleMat);
    muzzle.name = "raccoon-muzzle";
    muzzle.scale.set(1.0, 0.75, 0.6);
    muzzle.position.set(0, -actualHeadSize * 0.14, actualHeadSize * 0.46);
    head.add(muzzle);
  }

  if (config.creatureVariant === "gator") {
    if (!hasPhotoTexture) {
      const jawMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#365314", roughness: 0.8, name: "gator-jaw" });
      const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.05, name: "gator-tooth" });
      const toothGeo = new THREE.ConeGeometry(actualHeadSize * 0.055, actualHeadSize * 0.17, 6);

      const upperJawBase = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.5, actualHeadSize * 0.22, actualHeadSize * 0.5), jawMat);
      upperJawBase.name = "gator-upper-jaw";
      upperJawBase.position.set(0, actualHeadSize * 0.02, actualHeadSize * 0.42);
      upperJawBase.castShadow = true;
      head.add(upperJawBase);

      const upperJawTip = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.24, actualHeadSize * 0.7, 4), jawMat);
      upperJawTip.name = "gator-upper-jaw-tip";
      upperJawTip.rotation.x = Math.PI / 2;
      upperJawTip.rotation.y = Math.PI / 4;
      upperJawTip.position.set(0, actualHeadSize * 0.02, actualHeadSize * 1.03);
      upperJawTip.castShadow = true;
      head.add(upperJawTip);

      for (let i = 0; i < 3; i++) {
        const toothZ = actualHeadSize * (0.42 + i * 0.28);
        const tooth = new THREE.Mesh(toothGeo, toothMat);
        tooth.name = `gator-upper-tooth-${i}`;
        tooth.rotation.x = Math.PI;
        tooth.position.set((i % 2 === 0 ? -1 : 1) * actualHeadSize * 0.15, -actualHeadSize * 0.12, toothZ);
        head.add(tooth);
      }

      const jawHingeY = -actualHeadSize * 0.07;
      const jawHingeZ = actualHeadSize * 0.19;
      const jawPivot = new THREE.Group();
      jawPivot.name = "gator-jaw-pivot";
      jawPivot.position.set(0, jawHingeY, jawHingeZ);
      head.add(jawPivot);

      const lowerJawBase = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.44, actualHeadSize * 0.13, actualHeadSize * 0.44), jawMat);
      lowerJawBase.name = "gator-lower-jaw";
      lowerJawBase.position.set(0, -actualHeadSize * 0.02, actualHeadSize * 0.22);
      lowerJawBase.castShadow = true;
      jawPivot.add(lowerJawBase);

      const lowerJawTip = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.2, actualHeadSize * 0.62, 4), jawMat);
      lowerJawTip.name = "gator-lower-jaw-tip";
      lowerJawTip.rotation.x = Math.PI / 2;
      lowerJawTip.rotation.y = Math.PI / 4;
      lowerJawTip.position.set(0, -actualHeadSize * 0.02, actualHeadSize * 0.75);
      lowerJawTip.castShadow = true;
      jawPivot.add(lowerJawTip);

      for (let i = 0; i < 3; i++) {
        const toothZ = actualHeadSize * (0.14 + i * 0.28);
        const tooth = new THREE.Mesh(toothGeo, toothMat);
        tooth.name = `gator-lower-tooth-${i}`;
        tooth.position.set((i % 2 === 0 ? 1 : -1) * actualHeadSize * 0.15, actualHeadSize * 0.03, toothZ);
        jawPivot.add(tooth);
      }

      const eyeRidgeMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#365314", roughness: 0.7, name: "gator-eye-ridge" });
      [-1, 1].forEach((side) => {
        const ridge = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.1, 8, 8), eyeRidgeMat);
        ridge.name = `gator-eye-ridge-${side}`;
        ridge.position.set(side * actualHeadSize * 0.2, actualHeadSize * 0.34, actualHeadSize * 0.22);
        head.add(ridge);
      });
    }

    // Long tail flowing out behind the body
    const gatorTailMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#365314", roughness: 0.75, name: "gator-tail" });
    const gatorTailGroup = new THREE.Group();
    gatorTailGroup.name = "gator-tail";
    let gatorTailRadius = torsoWidth * 0.22;
    let gatorTailZ = -torsoDepth * 0.55;
    let gatorTailY = -torsoHeight * 0.1;
    for (let i = 0; i < 8; i++) {
      const segLength = torsoHeight * 0.28;
      const nextRadius = gatorTailRadius * 0.78;
      const segGeo = getCylinderGeometry(gatorTailRadius, nextRadius, segLength, 8);
      const seg = new THREE.Mesh(segGeo, gatorTailMat);
      seg.rotation.x = -Math.PI / 2;
      seg.position.set(0, gatorTailY, gatorTailZ - segLength / 2);
      seg.castShadow = true;
      gatorTailGroup.add(seg);
      gatorTailZ -= segLength;
      gatorTailY -= segLength * 0.06;
      gatorTailRadius = nextRadius;
    }
    torso.add(gatorTailGroup);
  }

  if (config.creatureVariant === "tigerfish" || config.creatureVariant === "lionfish") {
    if (!hasPhotoTexture) {
      const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, name: "fish-eye-white" });
      const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0c0a09, roughness: 0.1, name: "fish-eye-pupil" });
      [-1, 1].forEach((side) => {
        const eyeWhite = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.15, 10, 10), eyeWhiteMat);
        eyeWhite.name = `fish-eye-${side}`;
        eyeWhite.position.set(side * actualHeadSize * 0.4, actualHeadSize * 0.06, actualHeadSize * 0.22);
        head.add(eyeWhite);

        const pupil = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.075, 8, 8), pupilMat);
        pupil.name = `fish-pupil-${side}`;
        pupil.position.set(side * actualHeadSize * 0.47, actualHeadSize * 0.06, actualHeadSize * 0.28);
        head.add(pupil);
      });

      const mouthMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.5, name: "fish-mouth" });
      const mouth = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.1, 10, 10), mouthMat);
      mouth.name = "fish-mouth";
      mouth.scale.set(1.3, 0.55, 0.6);
      mouth.position.set(0, -actualHeadSize * 0.24, actualHeadSize * 0.42);
      head.add(mouth);

      const gillMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.6, name: "fish-gill" });
      [-1, 1].forEach((side) => {
        for (let i = 0; i < 3; i++) {
          const gill = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.03, actualHeadSize * 0.16, actualHeadSize * 0.03), gillMat);
          gill.name = `fish-gill-${side}-${i}`;
          gill.rotation.z = side * 0.35;
          gill.position.set(side * actualHeadSize * 0.44, -actualHeadSize * (0.05 + i * 0.1), actualHeadSize * (0.05 - i * 0.06));
          head.add(gill);
        }
      });
    }

    const stripeColors = config.creatureVariant === "lionfish"
      ? ["#b91c1c", "#fef2f2", "#1c1917"]
      : ["#1c1917", "#1c1917", "#1c1917"];
    for (let i = 0; i < 4; i++) {
      const stripeMat = new THREE.MeshStandardMaterial({ color: stripeColors[i % stripeColors.length], roughness: 0.6, name: `stripe-band-${i}` });
      const stripeRadius = torsoWidth * (0.52 - i * 0.01);
      const stripeGeo = getCylinderGeometry(stripeRadius, stripeRadius, torsoHeight * 0.09, radialSeg);
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.name = `stripe-band-${i}`;
      stripe.position.set(0, torsoHeight * (0.32 - i * 0.24), 0);
      torso.add(stripe);
    }

    if (config.creatureVariant === "lionfish") {
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0xfca5a5, roughness: 0.3, name: "lionfish-spike" });
      const spikeGeo = new THREE.ConeGeometry(actualHeadSize * 0.025, actualHeadSize * 0.6, 6);
      for (let i = 0; i < 7; i++) {
        const t = i / 6;
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        spike.name = `lionfish-spike-${i}`;
        const angle = -Math.PI * 0.35 + t * Math.PI * 0.7;
        spike.position.set(Math.sin(angle) * actualHeadSize * 0.35, actualHeadSize * 0.55, -actualHeadSize * 0.15 + Math.cos(angle) * actualHeadSize * 0.1);
        spike.rotation.z = -angle * 0.6;
        spike.rotation.x = Math.PI * 0.08;
        head.add(spike);
      }
    }
  }

  if (config.creatureVariant === "dog") {
    if (!hasPhotoTexture) {
      const muzzleMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#92400e", roughness: 0.75, name: "dog-muzzle" });
      const muzzle = new THREE.Mesh(getCylinderGeometry(actualHeadSize * 0.14, actualHeadSize * 0.17, actualHeadSize * 0.36, radialSeg), muzzleMat);
      muzzle.name = "dog-muzzle";
      muzzle.rotation.x = Math.PI / 2;
      muzzle.position.set(0, -actualHeadSize * 0.1, actualHeadSize * 0.48);
      muzzle.castShadow = true;
      head.add(muzzle);

      const noseMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.3, name: "dog-nose" });
      const nose = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.075, 8, 8), noseMat);
      nose.name = "dog-nose";
      nose.position.set(0, -actualHeadSize * 0.1, actualHeadSize * 0.66);
      head.add(nose);
    }

    const earMat = new THREE.MeshStandardMaterial({ color: config.hairColor || "#451a03", roughness: 0.8, name: "dog-ear" });
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.16, 10, 10), earMat);
      ear.name = `dog-ear-${side}`;
      ear.scale.set(0.55, 1.3, 0.35);
      ear.rotation.z = side * 0.25;
      ear.position.set(side * actualHeadSize * 0.46, -actualHeadSize * 0.08, actualHeadSize * 0.05);
      ear.castShadow = true;
      head.add(ear);
    });
  }

  if (config.creatureVariant === "lizard") {
    if (!hasPhotoTexture) {
      const snoutMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#4d7c0f", roughness: 0.6, name: "lizard-snout" });
      const snout = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.4, actualHeadSize * 0.16, actualHeadSize * 0.42), snoutMat);
      snout.name = "lizard-snout";
      snout.position.set(0, -actualHeadSize * 0.08, actualHeadSize * 0.48);
      snout.castShadow = true;
      head.add(snout);

      const nostrilMat = new THREE.MeshStandardMaterial({ color: 0x14290a, roughness: 0.5, name: "lizard-nostril" });
      [-1, 1].forEach((side) => {
        const nostril = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.025, 6, 6), nostrilMat);
        nostril.name = `lizard-nostril-${side}`;
        nostril.position.set(side * actualHeadSize * 0.1, -actualHeadSize * 0.03, actualHeadSize * 0.68);
        head.add(nostril);
      });
    }

    const frillMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#4d7c0f", roughness: 0.6, name: "lizard-frill" });
    for (let i = 0; i < 3; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.05, actualHeadSize * 0.16, 4), frillMat);
      spike.name = `lizard-frill-${i}`;
      spike.position.set(0, actualHeadSize * 0.42, -actualHeadSize * (0.05 + i * 0.14));
      head.add(spike);
    }
  }

  if (config.creatureVariant === "possum") {
    if (!hasPhotoTexture) {
      // Furry grey/white possum snout — longer + pointier
      const snoutFur = new THREE.MeshStandardMaterial({ color: config.skinColor || "#9a9a9a", roughness: 0.85, name: "possum-fur" });
      const snout = new THREE.Mesh(getCylinderGeometry(actualHeadSize * 0.1, actualHeadSize * 0.18, actualHeadSize * 0.42, 8), snoutFur);
      snout.name = "possum-snout";
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, -actualHeadSize * 0.08, actualHeadSize * 0.52);
      snout.castShadow = true;
      head.add(snout);

      // Pink fleshy nose
      const noseMat = new THREE.MeshStandardMaterial({ color: 0xf9a8d4, roughness: 0.4, name: "possum-nose" });
      const nose = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.055, 8, 8), noseMat);
      nose.name = "possum-nose";
      nose.scale.set(1.3, 0.8, 0.9);
      nose.position.set(0, -actualHeadSize * 0.08, actualHeadSize * 0.72);
      head.add(nose);

      // BEADY BLACK EYES — tiny, shiny, dead stare 👀
      const eyeBlack = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.05, metalness: 0.3, name: "possum-eye" });
      const eyeShine = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0.8, name: "possum-eye-shine" });
      [-1, 1].forEach((side) => {
        const eye = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.055, 10, 10), eyeBlack);
        eye.name = `possum-eye-${side > 0 ? "right" : "left"}`;
        eye.position.set(side * actualHeadSize * 0.22, actualHeadSize * 0.08, actualHeadSize * 0.38);
        head.add(eye);
        // Tiny white glint — beady possum stare
        const glint = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.016, 6, 6), eyeShine);
        glint.name = `possum-eye-glint-${side > 0 ? "right" : "left"}`;
        glint.position.set(side * actualHeadSize * 0.23, actualHeadSize * 0.1, actualHeadSize * 0.42);
        head.add(glint);
      });

      // HISSSSS — deep open snarling mouth
      const mouthMat = new THREE.MeshStandardMaterial({ color: 0x1a0f15, roughness: 0.5, name: "possum-mouth" });
      const mouth = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.45, actualHeadSize * 0.12, actualHeadSize * 0.14), mouthMat);
      mouth.name = "possum-mouth";
      mouth.position.set(0, -actualHeadSize * 0.24, actualHeadSize * 0.54);
      head.add(mouth);

      // 50 TEETH — possums have FIFTY TEETH, more than any other North American mammal 🦷
      // NOW LONGER + SHARPER + HORRIFYING
      const toothMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.28, name: "possum-tooth" });
      // Upper needle teeth — 16 across — LONGER + SHARPER
      for (let i = 0; i < 16; i++) {
        const t = i / 15;
        const x = (t - 0.5) * actualHeadSize * 0.4;
        const zOffset = Math.sin(t * Math.PI) * actualHeadSize * 0.05;
        const len = actualHeadSize * (0.08 + Math.sin(t * Math.PI) * 0.035);
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.013, len, 4), toothMat);
        tooth.name = `possum-tooth-upper-${i}`;
        tooth.rotation.x = Math.PI - 0.18;
        tooth.position.set(x, -actualHeadSize * 0.19, actualHeadSize * 0.56 + zOffset);
        head.add(tooth);
      }
      // CHOMPING LOWER JAW — mouth opens and shuts
      const jawGroup = new THREE.Group();
      jawGroup.name = "possum-jaw";
      jawGroup.position.set(0, -actualHeadSize * 0.18, actualHeadSize * 0.28);
      head.add(jawGroup);
      // Lower needle teeth — 16 across — LONGER + SHARPER — ON THE JAW
      for (let i = 0; i < 16; i++) {
        const t = i / 15;
        const x = (t - 0.5) * actualHeadSize * 0.36;
        const zOffset = Math.sin(t * Math.PI) * actualHeadSize * 0.04;
        const len = actualHeadSize * (0.065 + Math.sin(t * Math.PI) * 0.025);
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.011, len, 4), toothMat);
        tooth.name = `possum-tooth-lower-${i}`;
        tooth.rotation.x = 0.15;
        tooth.position.set(x, -actualHeadSize * 0.08, actualHeadSize * 0.30 + zOffset);
        jawGroup.add(tooth);
      }
      // The FANGS — 4 big canines — NOW HUGE + RAZOR SHARP
      [[-1, -1], [1, -1]].forEach(([side], idx) => {
        const fang = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.026, actualHeadSize * 0.16, 5), toothMat);
        fang.name = `possum-fang-upper-${idx}`;
        fang.rotation.x = Math.PI - 0.22;
        fang.position.set(side * actualHeadSize * 0.15, -actualHeadSize * 0.17, actualHeadSize * 0.58);
        head.add(fang);
      });
      [[-1, 1], [1, 1]].forEach(([side], idx) => {
        const fang = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.022, actualHeadSize * 0.13, 5), toothMat);
        fang.name = `possum-fang-lower-${idx}`;
        fang.rotation.x = 0.18;
        fang.position.set(side * actualHeadSize * 0.13, -actualHeadSize * 0.08, actualHeadSize * 0.30);
        jawGroup.add(fang);
      });

      // Whiskers — long, twitchy
      const whiskerMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.6, name: "possum-whisker" });
      [-1, 1].forEach((side) => {
        for (let i = 0; i < 3; i++) {
          const whisker = new THREE.Mesh(getCylinderGeometry(0.002, 0.004, actualHeadSize * 0.35, 4), whiskerMat);
          whisker.name = `possum-whisker-${side}-${i}`;
          whisker.rotation.z = side * (Math.PI / 2 + 0.15 * i);
          whisker.rotation.x = 0.1 * i;
          whisker.position.set(side * actualHeadSize * 0.16, -actualHeadSize * (0.12 + i * 0.04), actualHeadSize * 0.58);
          head.add(whisker);
        }
      });
    }

    // Big round NAKED PINK EARS — classic possum
    const earMat = new THREE.MeshStandardMaterial({ color: 0xf9a8d4, roughness: 0.55, name: "possum-ear" });
    const earFurMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#9a9a9a", roughness: 0.85, name: "possum-ear-fur" });
    [-1, 1].forEach((side) => {
      // Ear back — furry grey
      const earBack = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.18, 10, 10), earFurMat);
      earBack.name = `possum-ear-back-${side > 0 ? "right" : "left"}`;
      earBack.scale.set(1.0, 1.3, 0.22);
      earBack.position.set(side * actualHeadSize * 0.4, actualHeadSize * 0.32, -actualHeadSize * 0.06);
      head.add(earBack);
      // Ear inner — naked pink
      const ear = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.14, 10, 10), earMat);
      ear.name = `possum-ear-${side > 0 ? "right" : "left"}`;
      ear.scale.set(1.0, 1.2, 0.15);
      ear.position.set(side * actualHeadSize * 0.4, actualHeadSize * 0.31, -actualHeadSize * 0.02);
      head.add(ear);
    });
  }

  if (config.creatureVariant === "clown" && !hasPhotoTexture) {
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25, emissive: new THREE.Color(0x7f1d1d), emissiveIntensity: 0.3, name: "clown-nose" });
    const nose = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.13, 12, 12), noseMat);
    nose.name = "clown-nose";
    nose.position.set(0, -actualHeadSize * 0.02, actualHeadSize * 0.46);
    nose.castShadow = true;
    head.add(nose);

    const grinMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.4, name: "clown-grin" });
    const grin = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.6, actualHeadSize * 0.08, actualHeadSize * 0.06), grinMat);
    grin.name = "clown-grin";
    grin.position.set(0, -actualHeadSize * 0.28, actualHeadSize * 0.42);
    grin.rotation.z = 0;
    head.add(grin);

    [-1, 1].forEach((side) => {
      const corner = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.14, actualHeadSize * 0.08, actualHeadSize * 0.06), grinMat);
      corner.name = `clown-grin-corner-${side}`;
      corner.rotation.z = -side * 0.6;
      corner.position.set(side * actualHeadSize * 0.32, -actualHeadSize * 0.2, actualHeadSize * 0.38);
      head.add(corner);
    });

    const fangMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.2, name: "clown-fang" });
    const fangGeo = new THREE.ConeGeometry(actualHeadSize * 0.03, actualHeadSize * 0.1, 6);
    [-1, 1].forEach((side) => {
      const fang = new THREE.Mesh(fangGeo, fangMat);
      fang.name = `clown-fang-${side}`;
      fang.rotation.x = Math.PI;
      fang.position.set(side * actualHeadSize * 0.22, -actualHeadSize * 0.22, actualHeadSize * 0.44);
      head.add(fang);
    });

    const eyeMakeupMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5, name: "clown-eye-makeup" });
    [-1, 1].forEach((side) => {
      const patch = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.13, 10, 10), eyeMakeupMat);
      patch.name = `clown-eye-makeup-${side}`;
      patch.scale.set(0.7, 1.3, 0.4);
      patch.rotation.z = side * 0.3;
      patch.position.set(side * actualHeadSize * 0.22, actualHeadSize * 0.08, actualHeadSize * 0.4);
      head.add(patch);
    });
  }

  if (config.creatureVariant === "dragon") {
    const scaleMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#3f6212", roughness: 0.65, name: "dragon-scale" });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.4, name: "dragon-horn" });

    // Horns on top of head stay
    const hornGeo = new THREE.ConeGeometry(actualHeadSize * 0.07, actualHeadSize * 0.4, 6);
    [-1, 1].forEach((side) => {
      const horn = new THREE.Mesh(hornGeo, hornMat);
      horn.name = `dragon-horn-${side}`;
      horn.position.set(side * actualHeadSize * 0.22, actualHeadSize * 0.42, -actualHeadSize * 0.05);
      horn.rotation.set(-Math.PI * 0.18, 0, side * Math.PI * 0.12);
      horn.castShadow = true;
      head.add(horn);
    });

    if (!hasPhotoTexture) {
      const embersMat = new THREE.MeshStandardMaterial({
        color: 0xff6b00,
        emissive: new THREE.Color(0xff4500),
        emissiveIntensity: 1.6,
        roughness: 0.3,
        name: "dragon-embers",
      });

      const snout = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.22, actualHeadSize * 0.55, 6), scaleMat);
      snout.name = "dragon-snout";
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, -actualHeadSize * 0.05, actualHeadSize * 0.62);
      snout.castShadow = true;
      head.add(snout);

      [-1, 1].forEach((side) => {
        const ember = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.035, 8, 8), embersMat);
        ember.name = `dragon-ember-${side}`;
        ember.position.set(side * actualHeadSize * 0.06, -actualHeadSize * 0.06, actualHeadSize * 0.88);
        head.add(ember);
      });

      const fangGeo = new THREE.ConeGeometry(actualHeadSize * 0.045, actualHeadSize * 0.16, 6);
      const fangMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.2, name: "dragon-fang" });
      [-1, 1].forEach((side) => {
        const fang = new THREE.Mesh(fangGeo, fangMat);
        fang.name = `dragon-fang-${side}`;
        fang.rotation.x = Math.PI;
        fang.position.set(side * actualHeadSize * 0.12, -actualHeadSize * 0.16, actualHeadSize * 0.7);
        head.add(fang);
      });

      const eyeGlowMat = new THREE.MeshStandardMaterial({
        color: 0xff4500,
        emissive: new THREE.Color(0xff4500),
        emissiveIntensity: 1.3,
        roughness: 0.3,
        name: "dragon-eye-glow",
      });
      [-1, 1].forEach((side) => {
        const glow = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.05, 8, 8), eyeGlowMat);
        glow.name = `dragon-eye-glow-${side}`;
        glow.position.set(side * actualHeadSize * 0.22, actualHeadSize * 0.08, actualHeadSize * 0.42);
        head.add(glow);
      });
    }

    const spikeMat = hornMat;
    const spikeCount = 6;
    for (let i = 0; i < spikeCount; i++) {
      const t = i / (spikeCount - 1);
      const spike = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.06, actualHeadSize * (0.22 - t * 0.1), 5), spikeMat);
      spike.name = `dragon-spine-spike-${i}`;
      spike.position.set(0, torsoHeight * (0.5 - t * 0.9), -torsoDepth * 0.42 + t * torsoDepth * 0.1);
      spike.rotation.x = -Math.PI * 0.12;
      spike.castShadow = true;
      torso.add(spike);
    }

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.5,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      name: "dragon-wing-material",
    });
    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(getBoxGeometry(torsoWidth * 1.9, torsoHeight * 0.65, 0.05), wingMat);
      wing.name = `dragon-wing-${side}`;
      wing.position.set(side * torsoWidth * 1.05, torsoHeight * 0.25, -torsoDepth * 0.6);
      wing.rotation.set(0.15, side * Math.PI * 0.22, side * Math.PI * 0.08);
      wing.castShadow = true;
      torso.add(wing);

      const wingTip = new THREE.Mesh(getBoxGeometry(torsoWidth * 1.2, torsoHeight * 0.4, 0.05), wingMat);
      wingTip.name = `dragon-wing-tip-${side}`;
      wingTip.position.set(side * torsoWidth * 1.5, -torsoHeight * 0.05, -torsoDepth * 0.7);
      wingTip.rotation.set(0.15, side * Math.PI * 0.3, side * Math.PI * 0.18);
      torso.add(wingTip);
    });

    const dragonTailGroup = new THREE.Group();
    dragonTailGroup.name = "dragon-tail";
    let dTailRadius = torsoWidth * 0.2;
    let dTailZ = -torsoDepth * 0.5;
    let dTailY = -torsoHeight * 0.1;
    for (let i = 0; i < 9; i++) {
      const segLength = torsoHeight * 0.26;
      const nextRadius = dTailRadius * 0.8;
      const seg = new THREE.Mesh(getCylinderGeometry(dTailRadius, nextRadius, segLength, 8), scaleMat);
      seg.rotation.x = -Math.PI / 2;
      seg.position.set(0, dTailY, dTailZ - segLength / 2);
      seg.castShadow = true;
      dragonTailGroup.add(seg);

      if (i % 2 === 0) {
        const tailSpike = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.04, actualHeadSize * 0.14, 5), hornMat);
        tailSpike.position.set(0, dTailRadius * 0.8, dTailZ);
        tailSpike.rotation.x = -Math.PI * 0.1;
        dragonTailGroup.add(tailSpike);
      }

      dTailZ -= segLength;
      dTailY -= segLength * 0.05;
      dTailRadius = nextRadius;
    }
    const tailSpade = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.12, actualHeadSize * 0.22, 4), hornMat);
    tailSpade.position.set(0, dTailY, dTailZ);
    tailSpade.rotation.x = Math.PI / 2;
    dragonTailGroup.add(tailSpade);
    torso.add(dragonTailGroup);
  }

  if (config.creatureVariant === "fairy") {
    const wickedMat = new THREE.MeshStandardMaterial({ color: 0x1e1030, roughness: 0.4, name: "fairy-wicked" });
    const skinTintMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#c4b5fd", roughness: 0.5, name: "fairy-skin" });

    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.08, actualHeadSize * 0.3, 6), skinTintMat);
      ear.name = `fairy-ear-${side}`;
      ear.position.set(side * actualHeadSize * 0.42, actualHeadSize * 0.18, -actualHeadSize * 0.02);
      ear.rotation.set(0, 0, side * Math.PI * 0.18);
      ear.castShadow = true;
      head.add(ear);
    });

    const thornCount = 7;
    for (let i = 0; i < thornCount; i++) {
      const angle = (i / thornCount) * Math.PI * 2;
      const thorn = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.025, actualHeadSize * 0.13, 5), wickedMat);
      thorn.name = `fairy-thorn-${i}`;
      thorn.position.set(Math.cos(angle) * actualHeadSize * 0.36, actualHeadSize * 0.44, Math.sin(angle) * actualHeadSize * 0.36);
      thorn.rotation.set(Math.cos(angle) * 0.4, 0, Math.sin(angle) * -0.4);
      head.add(thorn);
    }

    if (!hasPhotoTexture) {
      const eyeGlowMat = new THREE.MeshStandardMaterial({
        color: 0x9333ea,
        emissive: new THREE.Color(0x9333ea),
        emissiveIntensity: 1.4,
        roughness: 0.3,
        name: "fairy-eye-glow",
      });
      [-1, 1].forEach((side) => {
        const glow = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.045, 8, 8), eyeGlowMat);
        glow.name = `fairy-eye-glow-${side}`;
        glow.scale.set(1.0, 0.55, 1.0);
        glow.position.set(side * actualHeadSize * 0.19, actualHeadSize * 0.06, actualHeadSize * 0.44);
        head.add(glow);
      });

      const grin = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.32, actualHeadSize * 0.04, actualHeadSize * 0.04), wickedMat);
      grin.name = "fairy-grin";
      grin.position.set(0, -actualHeadSize * 0.22, actualHeadSize * 0.44);
      head.add(grin);
      const tinyFangGeo = new THREE.ConeGeometry(actualHeadSize * 0.02, actualHeadSize * 0.06, 5);
      [-1, 1].forEach((side) => {
        const fang = new THREE.Mesh(tinyFangGeo, wickedMat);
        fang.name = `fairy-fang-${side}`;
        fang.rotation.x = Math.PI;
        fang.position.set(side * actualHeadSize * 0.1, -actualHeadSize * 0.24, actualHeadSize * 0.45);
        head.add(fang);
      });
    }

    const fairyWingMat = new THREE.MeshStandardMaterial({
      color: 0x581c87,
      roughness: 0.15,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      name: "fairy-wing-material",
    });
    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(getBoxGeometry(torsoWidth * 0.9, torsoHeight * 0.6, 0.03), fairyWingMat);
      wing.name = `fairy-wing-${side}`;
      wing.position.set(side * torsoWidth * 0.55, torsoHeight * 0.35, -torsoDepth * 0.55);
      wing.rotation.set(0.2, side * Math.PI * 0.15, side * Math.PI * 0.35);
      torso.add(wing);

      const wingLower = new THREE.Mesh(getBoxGeometry(torsoWidth * 0.65, torsoHeight * 0.45, 0.03), fairyWingMat);
      wingLower.name = `fairy-wing-lower-${side}`;
      wingLower.position.set(side * torsoWidth * 0.65, torsoHeight * 0.0, -torsoDepth * 0.6);
      wingLower.rotation.set(0.2, side * Math.PI * 0.2, -side * Math.PI * 0.3);
      torso.add(wingLower);
    });
  }

  if (config.creatureVariant === "hammerhead") {
    const sharkSkinMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#57606f", roughness: 0.35, metalness: 0.1, name: "hammerhead-skin" });

    if (!hasPhotoTexture) {
      const hammerBar = new THREE.Mesh(getBoxGeometry(actualHeadSize * 1.5, actualHeadSize * 0.16, actualHeadSize * 0.32), sharkSkinMat);
      hammerBar.name = "hammerhead-bar";
      hammerBar.position.set(0, actualHeadSize * 0.08, actualHeadSize * 0.28);
      hammerBar.castShadow = true;
      head.add(hammerBar);

      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0c0a09, roughness: 0.2, name: "hammerhead-eye" });
      [-1, 1].forEach((side) => {
        const eye = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.055, 8, 8), eyeMat);
        eye.name = `hammerhead-eye-${side}`;
        eye.position.set(side * actualHeadSize * 0.72, actualHeadSize * 0.08, actualHeadSize * 0.4);
        head.add(eye);
      });

      const snout = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.24, actualHeadSize * 0.4, 6), sharkSkinMat);
      snout.name = "hammerhead-snout";
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, actualHeadSize * 0.02, actualHeadSize * 0.56);
      snout.castShadow = true;
      head.add(snout);

      const gillMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.6, name: "hammerhead-gill" });
      [-1, 1].forEach((side) => {
        for (let i = 0; i < 3; i++) {
          const gill = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.02, actualHeadSize * 0.12, actualHeadSize * 0.03), gillMat);
          gill.name = `hammerhead-gill-${side}-${i}`;
          gill.position.set(side * actualHeadSize * 0.34, -actualHeadSize * 0.05, actualHeadSize * (0.1 + i * 0.08));
          head.add(gill);
        }
      });
    }

    const dorsalFin = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.3, actualHeadSize * 0.65, 3), sharkSkinMat);
    dorsalFin.name = "hammerhead-dorsal-fin";
    dorsalFin.position.set(0, torsoHeight * 0.55, -torsoDepth * 0.35);
    dorsalFin.rotation.set(Math.PI * 0.05, Math.PI / 6, 0);
    dorsalFin.castShadow = true;
    torso.add(dorsalFin);

    const tailFinGroup = new THREE.Group();
    tailFinGroup.name = "hammerhead-tail-fin";
    const tailFinUpper = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.18, actualHeadSize * 0.5, 3), sharkSkinMat);
    tailFinUpper.position.set(0, torsoHeight * 0.15, -torsoDepth * 0.6);
    tailFinUpper.rotation.set(-Math.PI * 0.1, 0, Math.PI / 2);
    tailFinGroup.add(tailFinUpper);
    const tailFinLower = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.1, actualHeadSize * 0.26, 3), sharkSkinMat);
    tailFinLower.position.set(0, -torsoHeight * 0.05, -torsoDepth * 0.58);
    tailFinLower.rotation.set(Math.PI * 0.15, 0, Math.PI / 2);
    tailFinGroup.add(tailFinLower);
    torso.add(tailFinGroup);
  }

  if (config.creatureVariant === "octopus" && !hasPhotoTexture) {
    const inkMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#7c3aed", roughness: 0.55, name: "octopus-skin" });
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.12, 10, 10), new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, name: "octopus-eye" }));
      eye.name = `octopus-eye-${side}`;
      eye.position.set(side * actualHeadSize * 0.28, actualHeadSize * 0.05, actualHeadSize * 0.38);
      head.add(eye);
      const pupil = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.045, 8, 8), new THREE.MeshStandardMaterial({ color: 0x0c0a09, roughness: 0.2, name: "octopus-pupil" }));
      pupil.position.set(side * actualHeadSize * 0.28, actualHeadSize * 0.05, actualHeadSize * 0.48);
      head.add(pupil);
    });
    const siphon = new THREE.Mesh(getCylinderGeometry(actualHeadSize * 0.08, actualHeadSize * 0.12, actualHeadSize * 0.25, 8), inkMat);
    siphon.name = "octopus-siphon";
    siphon.rotation.x = Math.PI / 2;
    siphon.position.set(0, -actualHeadSize * 0.2, actualHeadSize * 0.35);
    head.add(siphon);
  }

  if (config.creatureVariant === "spider" && !hasPhotoTexture) {
    const chitin = new THREE.MeshStandardMaterial({ color: config.skinColor || "#1c1917", roughness: 0.45, name: "spider-chitin" });
    [-1, 1].forEach((side) => {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.05, actualHeadSize * 0.22, 6), chitin);
      fang.name = `spider-fang-${side}`;
      fang.rotation.x = Math.PI;
      fang.position.set(side * actualHeadSize * 0.12, -actualHeadSize * 0.25, actualHeadSize * 0.4);
      head.add(fang);
    });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: new THREE.Color(0x7f1d1d), emissiveIntensity: 0.6, roughness: 0.2, name: "spider-eye" });
    for (let i = 0; i < 6; i++) {
      const eye = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.04, 6, 6), eyeMat);
      eye.name = `spider-eye-${i}`;
      const col = (i % 3) - 1;
      const row = Math.floor(i / 3);
      eye.position.set(col * actualHeadSize * 0.12, actualHeadSize * (0.12 - row * 0.1), actualHeadSize * 0.46);
      head.add(eye);
    }
  }

  // === SERPENT / SEA DRAGON ===
  // Always render serpent features (even with photo - this is a creature morph, not a human face)
  if (config.creatureVariant === "snake") {
    const scaleMat = new THREE.MeshStandardMaterial({
      color: config.skinColor || "#1a6b3a",
      roughness: 0.35,
      metalness: 0.15,
      name: "serpent-scale",
    });

    // --- Elongated serpent snout / jaw ---
    const snoutUpper = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.24, actualHeadSize * 0.55, 8), scaleMat);
    snoutUpper.name = "serpent-snout-upper";
    snoutUpper.rotation.x = Math.PI / 2;
    snoutUpper.position.set(0, actualHeadSize * 0.02, actualHeadSize * 0.58);
    snoutUpper.castShadow = true;
    head.add(snoutUpper);

    const snoutLower = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.2, actualHeadSize * 0.45, 8), scaleMat);
    snoutLower.name = "serpent-snout-lower";
    snoutLower.rotation.x = Math.PI / 2;
    snoutLower.position.set(0, -actualHeadSize * 0.14, actualHeadSize * 0.52);
    snoutLower.castShadow = true;
    head.add(snoutLower);

    // --- Fangs ---
    const fangMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.15, metalness: 0.05, name: "serpent-fang" });
    const fangGeo = new THREE.ConeGeometry(actualHeadSize * 0.035, actualHeadSize * 0.16, 6);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([side, front], i) => {
      const fang = new THREE.Mesh(fangGeo, fangMat);
      fang.name = `serpent-fang-${i}`;
      fang.rotation.x = Math.PI;
      fang.position.set(side * actualHeadSize * 0.1, -actualHeadSize * 0.04, actualHeadSize * (0.58 + front * 0.08));
      fang.castShadow = true;
      head.add(fang);
    });

    // --- Reptilian eyes (glowing amber) ---
    const eyeGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      emissive: new THREE.Color(0xff6600),
      emissiveIntensity: 0.9,
      roughness: 0.1,
      name: "serpent-eye",
    });
    const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.05, name: "serpent-pupil" });
    [-1, 1].forEach((side) => {
      // Eye glow / iris
      const eye = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.075, 10, 10), eyeGlowMat);
      eye.name = `serpent-eye-${side}`;
      eye.position.set(side * actualHeadSize * 0.26, actualHeadSize * 0.1, actualHeadSize * 0.34);
      eye.castShadow = true;
      head.add(eye);
      // Slit pupil
      const pupil = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.012, actualHeadSize * 0.05, actualHeadSize * 0.04), eyePupilMat);
      pupil.name = `serpent-pupil-${side}`;
      pupil.position.set(side * actualHeadSize * 0.26, actualHeadSize * 0.1, actualHeadSize * 0.41);
      head.add(pupil);
      // Brow ridge / eye socket
      const browMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#1a6b3a", roughness: 0.5, name: "serpent-brow" });
      const brow = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.1, 8, 8), browMat);
      brow.name = `serpent-brow-${side}`;
      brow.scale.set(1.3, 0.45, 0.7);
      brow.position.set(side * actualHeadSize * 0.26, actualHeadSize * 0.18, actualHeadSize * 0.3);
      brow.castShadow = true;
      head.add(brow);
    });

    // --- Horns / antlers (eastern dragon style) ---
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.6, metalness: 0.1, name: "serpent-horn" });
    [-1, 1].forEach((side) => {
      // Main horn curving back
      const horn = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.045, actualHeadSize * 0.38, 6), hornMat);
      horn.name = `serpent-horn-${side}`;
      horn.position.set(side * actualHeadSize * 0.18, actualHeadSize * 0.38, -actualHeadSize * 0.08);
      horn.rotation.set(-Math.PI * 0.22, 0, side * Math.PI * 0.18);
      horn.castShadow = true;
      head.add(horn);
      // Secondary smaller horn / antler tine
      const horn2 = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.028, actualHeadSize * 0.22, 5), hornMat);
      horn2.name = `serpent-horn2-${side}`;
      horn2.position.set(side * actualHeadSize * 0.28, actualHeadSize * 0.22, actualHeadSize * 0.05);
      horn2.rotation.set(-Math.PI * 0.08, side * Math.PI * 0.3, side * Math.PI * 0.35);
      horn2.castShadow = true;
      head.add(horn2);
    });

    // --- Whiskers / barbels (eastern dragon) ---
    const whiskerMat = new THREE.MeshStandardMaterial({ color: 0xe8d5b7, roughness: 0.7, name: "serpent-whisker" });
    [-1, 1].forEach((side) => {
      // Long upper whisker
      const whisker = new THREE.Mesh(getCylinderGeometry(0.008, 0.003, actualHeadSize * 0.65, 6), whiskerMat);
      whisker.name = `serpent-whisker-upper-${side}`;
      whisker.position.set(side * actualHeadSize * 0.22, -actualHeadSize * 0.08, actualHeadSize * 0.45);
      whisker.rotation.set(Math.PI * 0.45, 0, side * Math.PI * 0.35);
      whisker.castShadow = true;
      head.add(whisker);
      // Lower barbel
      const barbel = new THREE.Mesh(getCylinderGeometry(0.006, 0.002, actualHeadSize * 0.4, 6), whiskerMat);
      barbel.name = `serpent-whisker-lower-${side}`;
      barbel.position.set(side * actualHeadSize * 0.14, -actualHeadSize * 0.22, actualHeadSize * 0.48);
      barbel.rotation.set(Math.PI * 0.65, 0, side * Math.PI * 0.15);
      barbel.castShadow = true;
      head.add(barbel);
    });

    // --- Nasal ridges / frills ---
    const ridgeMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#1a6b3a", roughness: 0.4, name: "serpent-ridge" });
    [-1, 1].forEach((side) => {
      const ridge = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.025, actualHeadSize * 0.18, 4), ridgeMat);
      ridge.name = `serpent-nasal-ridge-${side}`;
      ridge.position.set(side * actualHeadSize * 0.1, actualHeadSize * 0.14, actualHeadSize * 0.42);
      ridge.rotation.x = -Math.PI * 0.12;
      ridge.castShadow = true;
      head.add(ridge);
    });

    // --- Frilled cheek/jaw fins ---
    const finMat = new THREE.MeshStandardMaterial({
      color: config.skinColor || "#1a6b3a",
      roughness: 0.45,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      name: "serpent-fin",
    });
    [-1, 1].forEach((side) => {
      const cheekFin = new THREE.Mesh(getBoxGeometry(0.04, actualHeadSize * 0.22, actualHeadSize * 0.28), finMat);
      cheekFin.name = `serpent-cheek-fin-${side}`;
      cheekFin.position.set(side * (actualHeadSize * 0.44), -actualHeadSize * 0.05, -actualHeadSize * 0.08);
      cheekFin.rotation.set(0, side * Math.PI * 0.35, side * Math.PI * 0.08);
      cheekFin.castShadow = true;
      head.add(cheekFin);
    });

    // --- Forked tongue (animated / extended) ---
    const tongueMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: new THREE.Color(0x7f1d1d), emissiveIntensity: 0.3, roughness: 0.3, name: "serpent-tongue" });
    [-1, 1].forEach((side) => {
      const tine = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.022, actualHeadSize * 0.015, actualHeadSize * 0.28), tongueMat);
      tine.name = `serpent-tongue-${side}`;
      tine.position.set(side * actualHeadSize * 0.04, -actualHeadSize * 0.1, actualHeadSize * 0.72);
      tine.rotation.y = side * 0.35;
      head.add(tine);
    });
  }

  if (config.creatureVariant === "bat" || config.creatureVariant === "crow") {
    const darkMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#18181b", roughness: 0.55, name: "avian-dark" });
    if (!hasPhotoTexture) {
      const beak = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.1, actualHeadSize * 0.35, 5), darkMat);
      beak.name = `${config.creatureVariant}-beak`;
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, -actualHeadSize * 0.05, actualHeadSize * 0.55);
      head.add(beak);
    }
    if (config.creatureVariant === "bat") {
      [-1, 1].forEach((side) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.1, actualHeadSize * 0.32, 5), darkMat);
        ear.name = `bat-ear-${side}`;
        ear.position.set(side * actualHeadSize * 0.32, actualHeadSize * 0.35, 0);
        ear.rotation.z = side * 0.25;
        head.add(ear);
      });
    }
  }

  // MURDER CROW — glossy black corvid overhaul
  if (config.creatureVariant === "crow" && !hasPhotoTexture) {
    const crowBlack = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.25, metalness: 0.35, name: "crow-feather" });
    const beakMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35, metalness: 0.15, name: "crow-beak" });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.05, metalness: 0.1, name: "crow-eye" });

    // Remove the basic beak/ruff from the shared bat/crow block
    const oldBeak = head.getObjectByName("crow-beak");
    if (oldBeak) head.remove(oldBeak);
    const oldRuff = head.getObjectByName("crow-ruff");
    if (oldRuff) head.remove(oldRuff);

    // Heavy curved corvid beak
    const beakBase = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.14, actualHeadSize * 0.48, 6), beakMat);
    beakBase.name = "crow-beak";
    beakBase.rotation.x = Math.PI / 2;
    beakBase.position.set(0, -actualHeadSize * 0.06, actualHeadSize * 0.58);
    beakBase.castShadow = true;
    head.add(beakBase);

    // Beak hook tip
    const beakTip = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.045, actualHeadSize * 0.12, 5), beakMat);
    beakTip.name = "crow-beak-tip";
    beakTip.rotation.x = Math.PI / 2 + 0.35;
    beakTip.position.set(0, -actualHeadSize * 0.14, actualHeadSize * 0.78);
    head.add(beakTip);

    // Glossy black eyes — small, beady, murderous
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.065, 10, 10), eyeMat);
      eye.name = `crow-eye-${side > 0 ? "right" : "left"}`;
      eye.position.set(side * actualHeadSize * 0.22, actualHeadSize * 0.08, actualHeadSize * 0.42);
      head.add(eye);
      // eye glint
      const glint = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.018, 6, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, name: "crow-eye-glint" }));
      glint.position.set(side * actualHeadSize * 0.22 + side * 0.008, actualHeadSize * 0.095, actualHeadSize * 0.46);
      head.add(glint);
    });

    // Feathered crown / head tuft
    for (let i = 0; i < 5; i++) {
      const feather = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.06, actualHeadSize * 0.22, 0.015), crowBlack);
      feather.name = `crow-crest-${i}`;
      const angle = (i - 2) * 0.22;
      feather.position.set(Math.sin(angle) * actualHeadSize * 0.12, actualHeadSize * 0.42, -actualHeadSize * 0.08);
      feather.rotation.z = angle * 0.6;
      feather.rotation.x = -0.3;
      feather.castShadow = true;
      head.add(feather);
    }

    // Neck ruff — shaggy throat feathers
    for (let i = 0; i < 7; i++) {
      const ruffFeather = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.08, actualHeadSize * 0.18, 0.012), crowBlack);
      ruffFeather.name = `crow-ruff-${i}`;
      const angle = (i / 6 - 0.5) * Math.PI * 0.8;
      ruffFeather.position.set(Math.sin(angle) * actualHeadSize * 0.28, -actualHeadSize * 0.28, Math.cos(angle) * actualHeadSize * 0.18 + actualHeadSize * 0.05);
      ruffFeather.rotation.y = angle;
      ruffFeather.rotation.x = 0.5;
      head.add(ruffFeather);
    }
  }

  if (config.creatureVariant === "rat") {
    const fur = new THREE.MeshStandardMaterial({ color: config.skinColor || "#a8a29e", roughness: 0.85, name: "rat-fur" });
    if (!hasPhotoTexture) {
      const snout = new THREE.Mesh(getCylinderGeometry(actualHeadSize * 0.08, actualHeadSize * 0.16, actualHeadSize * 0.35, 8), fur);
      snout.name = "rat-snout";
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, -actualHeadSize * 0.05, actualHeadSize * 0.48);
      head.add(snout);
      const nose = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.05, 8, 8), new THREE.MeshStandardMaterial({ color: 0xf9a8d4, roughness: 0.4, name: "rat-nose" }));
      nose.position.set(0, -actualHeadSize * 0.05, actualHeadSize * 0.68);
      head.add(nose);
    }
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.16, 10, 10), fur);
      ear.name = `rat-ear-${side}`;
      ear.scale.set(1, 1, 0.25);
      ear.position.set(side * actualHeadSize * 0.38, actualHeadSize * 0.28, -actualHeadSize * 0.05);
      head.add(ear);
    });
  }

  if (config.creatureVariant === "centipede") {
    const chitin = new THREE.MeshStandardMaterial({ color: config.skinColor || "#854d0e", roughness: 0.5, name: "bug-chitin" });
    if (!hasPhotoTexture) {
      [-1, 1].forEach((side) => {
        const mand = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.06, actualHeadSize * 0.2, 5), chitin);
        mand.name = `bug-mandible-${side}`;
        mand.rotation.set(Math.PI * 0.6, 0, side * 0.5);
        mand.position.set(side * actualHeadSize * 0.15, -actualHeadSize * 0.22, actualHeadSize * 0.4);
        head.add(mand);
      });
      const compound = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.15, metalness: 0.4, name: "compound-eye" });
      [-1, 1].forEach((side) => {
        const eye = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.11, 10, 10), compound);
        eye.name = `bug-eye-${side}`;
        eye.position.set(side * actualHeadSize * 0.28, actualHeadSize * 0.08, actualHeadSize * 0.38);
        head.add(eye);
      });
    }
  }

  // --- EMPEROR SCORPION — BIG, MEAN, SHINY AND BRIGHT ---
  if (config.creatureVariant === "scorpion") {
    // Glossy obsidian carapace with amber highlights
    const carapaceMat = new THREE.MeshStandardMaterial({
      color: config.skinColor || "#0a0a0a",
      roughness: 0.12,
      metalness: 0.35,
      name: "scorpion-carapace",
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffae00,
      roughness: 0.15,
      metalness: 0.85,
      emissive: new THREE.Color(0xff6b00),
      emissiveIntensity: 0.35,
      name: "scorpion-gold",
    });

    // Armored carapace plates on the head
    const carapace = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.52, 14, 14), carapaceMat);
    carapace.name = "scorpion-carapace";
    carapace.scale.set(1.15, 0.75, 1.25);
    carapace.position.set(0, actualHeadSize * 0.08, actualHeadSize * 0.02);
    carapace.castShadow = true;
    carapace.receiveShadow = true;
    head.add(carapace);

    // Glowing BLUE predator eyes — cluster of 6 (scorpion eye layout)
    const eyeGlowMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: new THREE.Color(0x00d4ff),
      emissiveIntensity: 5.0,
      roughness: 0.05,
      metalness: 0.1,
      name: "scorpion-eye-glow",
    });
    // Main median eyes — BIG — pushed forward to sit ON carapace surface
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.09, 10, 10), eyeGlowMat);
      eye.name = `scorpion-eye-${side > 0 ? "right" : "left"}`;
      eye.position.set(side * actualHeadSize * 0.16, actualHeadSize * 0.18, actualHeadSize * 0.68);
      head.add(eye);
    });
    // Lateral eye cluster — 2 per side, smaller — pushed forward
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 2; i++) {
        const lateralEye = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.038, 8, 8), eyeGlowMat);
        lateralEye.name = `scorpion-lateral-eye-${side}-${i}`;
        lateralEye.position.set(
          side * actualHeadSize * (0.32 + i * 0.07),
          actualHeadSize * 0.06,
          actualHeadSize * (0.58 - i * 0.08)
        );
        head.add(lateralEye);
      }
    });

    // Massive chelicerae / fangs — dripping venom glow
    const fangVenomMat = new THREE.MeshStandardMaterial({
      color: 0xffae00,
      roughness: 0.1,
      metalness: 0.7,
      emissive: new THREE.Color(0xff6b00),
      emissiveIntensity: 0.8,
      name: "scorpion-fang-venom",
    });
    [-1, 1].forEach((side) => {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.1, actualHeadSize * 0.32, 6), carapaceMat);
      fang.name = `scorpion-fang-${side}`;
      fang.rotation.set(Math.PI * 0.72, 0, side * 0.35);
      fang.position.set(side * actualHeadSize * 0.14, -actualHeadSize * 0.22, actualHeadSize * 0.68);
      fang.castShadow = true;
      head.add(fang);
      // Venom drip tip — glowing
      const venomTip = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.045, 8, 8), fangVenomMat);
      venomTip.name = `scorpion-venom-tip-${side}`;
      venomTip.position.set(side * actualHeadSize * 0.14, -actualHeadSize * 0.36, actualHeadSize * 0.75);
      head.add(venomTip);
    });

    // Pedipalp bases — armored jaw plates
    [-1, 1].forEach((side) => {
      const jawPlate = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.18, actualHeadSize * 0.14, actualHeadSize * 0.22), carapaceMat);
      jawPlate.name = `scorpion-jaw-plate-${side}`;
      jawPlate.position.set(side * actualHeadSize * 0.26, -actualHeadSize * 0.08, actualHeadSize * 0.56);
      jawPlate.rotation.z = side * 0.22;
      jawPlate.castShadow = true;
      head.add(jawPlate);
    });

    // Crown spikes — menacing head crest
    for (let i = 0; i < 5; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.038, actualHeadSize * 0.18, 5), goldMat);
      spike.name = `scorpion-crown-spike-${i}`;
      const angle = ((i / 4) - 0.5) * 1.4;
      spike.position.set(
        Math.sin(angle) * actualHeadSize * 0.28,
        actualHeadSize * 0.48,
        actualHeadSize * (0.35 + Math.cos(angle) * 0.08)
      );
      spike.rotation.x = -0.2;
      spike.castShadow = true;
      head.add(spike);
    }
  }

  // --- PRAYING MANTIS HEAD - triangular insect head, big bulging eyes, antennae ---
  if (config.creatureVariant === "mantis" && !hasPhotoTexture) {
    const chitinMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#65a34a", roughness: 0.55, name: "mantis-chitin" });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0f0a, roughness: 0.08, metalness: 0.3, name: "mantis-eye" });
    const eyeShineMat = new THREE.MeshStandardMaterial({ color: 0x334233, roughness: 0.1, metalness: 0.6, name: "mantis-eye-shine" });

    const crown = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.72, actualHeadSize * 0.52, actualHeadSize * 0.36), chitinMat);
    crown.name = "mantis-head-crown";
    crown.position.set(0, actualHeadSize * 0.14, actualHeadSize * 0.08);
    crown.castShadow = true;
    crown.receiveShadow = true;
    head.add(crown);

    [-1, 1].forEach((side) => {
      const eyeBulb = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.22, 12, 12), eyeMat);
      eyeBulb.name = `mantis-eye-${side}`;
      eyeBulb.scale.set(0.75, 1.05, 0.9);
      eyeBulb.position.set(side * actualHeadSize * 0.34, actualHeadSize * 0.06, actualHeadSize * 0.28);
      eyeBulb.castShadow = true;
      head.add(eyeBulb);
      const pupil = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.06, 8, 8), eyeShineMat);
      pupil.name = `mantis-pupil-${side}`;
      pupil.position.set(side * actualHeadSize * 0.38, actualHeadSize * 0.06, actualHeadSize * 0.46);
      head.add(pupil);
    });

    const facePlate = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.18, actualHeadSize * 0.28, 3), chitinMat);
    facePlate.name = "mantis-face-plate";
    facePlate.rotation.x = Math.PI / 2;
    facePlate.position.set(0, actualHeadSize * 0.02, actualHeadSize * 0.38);
    facePlate.castShadow = true;
    head.add(facePlate);

    [-1, 1].forEach((side) => {
      const jaw = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.07, actualHeadSize * 0.16, 4), chitinMat);
      jaw.name = `mantis-mandible-${side}`;
      jaw.rotation.set(Math.PI * 0.55, 0, side * 0.35);
      jaw.position.set(side * actualHeadSize * 0.1, -actualHeadSize * 0.18, actualHeadSize * 0.42);
      jaw.castShadow = true;
      head.add(jaw);
    });

    [-1, 1].forEach((side) => {
      const antenna = new THREE.Group();
      antenna.name = `mantis-antenna-${side}`;
      const antMat = new THREE.MeshStandardMaterial({ color: 0x1a2514, roughness: 0.6, name: "mantis-antenna" });
      for (let i = 0; i < 3; i++) {
        const seg = new THREE.Mesh(getCylinderGeometry(0.012 - i * 0.003, 0.015 - i * 0.003, actualHeadSize * 0.32, 5), antMat);
        seg.position.y = i * actualHeadSize * 0.28;
        seg.rotation.z = side * (0.1 + i * 0.12);
        seg.rotation.x = -0.15 - i * 0.1;
        antenna.add(seg);
      }
      antenna.position.set(side * actualHeadSize * 0.12, actualHeadSize * 0.38, actualHeadSize * 0.08);
      antenna.rotation.z = side * 0.25;
      head.add(antenna);
    });

    const pronotum = new THREE.Mesh(getCylinderGeometry(actualHeadSize * 0.22, actualHeadSize * 0.28, actualHeadSize * 0.38, 8), chitinMat);
    pronotum.name = "mantis-pronotum";
    pronotum.rotation.x = Math.PI / 2.3;
    pronotum.position.set(0, -actualHeadSize * 0.18, -actualHeadSize * 0.12);
    pronotum.castShadow = true;
    head.add(pronotum);
  }

  if (config.creatureVariant === "toad") {
    const wartMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#3f6212", roughness: 0.9, name: "toad-skin" });
    if (!hasPhotoTexture) {
      [-1, 1].forEach((side) => {
        const bulb = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.16, 10, 10), wartMat);
        bulb.name = `toad-eye-bulb-${side}`;
        bulb.position.set(side * actualHeadSize * 0.22, actualHeadSize * 0.32, actualHeadSize * 0.2);
        head.add(bulb);
        const iris = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.07, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, name: "toad-iris" }));
        iris.position.set(side * actualHeadSize * 0.22, actualHeadSize * 0.36, actualHeadSize * 0.32);
        head.add(iris);
      });
      const mouth = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.55, actualHeadSize * 0.06, actualHeadSize * 0.08), new THREE.MeshStandardMaterial({ color: 0x1a2e05, roughness: 0.6, name: "toad-mouth" }));
      mouth.name = "toad-mouth";
      mouth.position.set(0, -actualHeadSize * 0.2, actualHeadSize * 0.42);
      head.add(mouth);
      for (let i = 0; i < 5; i++) {
        const wart = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.04, 6, 6), wartMat);
        wart.position.set((i - 2) * actualHeadSize * 0.1, actualHeadSize * 0.15, -actualHeadSize * 0.25);
        head.add(wart);
      }
    }
  }

  if (config.creatureVariant === "biped-lizard") {
    if (!hasPhotoTexture) {
      const snoutMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#4d7c0f", roughness: 0.6, name: "biped-lizard-snout" });
      const snout = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.4, actualHeadSize * 0.16, actualHeadSize * 0.48), snoutMat);
      snout.name = "biped-lizard-snout";
      snout.position.set(0, -actualHeadSize * 0.08, actualHeadSize * 0.5);
      head.add(snout);
      for (let i = 0; i < 4; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.045, actualHeadSize * 0.14, 4), snoutMat);
        spike.position.set(0, actualHeadSize * 0.42, -actualHeadSize * (0.0 + i * 0.12));
        head.add(spike);
      }
    }
  }

  if (config.creatureVariant === "worm" && !hasPhotoTexture) {
    const wet = new THREE.MeshStandardMaterial({ color: config.skinColor || "#fbcfe8", roughness: 0.25, name: "worm-skin" });
    const maw = new THREE.Mesh(getCylinderGeometry(actualHeadSize * 0.2, actualHeadSize * 0.28, actualHeadSize * 0.15, 12), new THREE.MeshStandardMaterial({ color: 0x4a044e, roughness: 0.5, name: "worm-maw" }));
    maw.name = "worm-maw";
    maw.rotation.x = Math.PI / 2;
    maw.position.set(0, 0, actualHeadSize * 0.42);
    head.add(maw);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.03, actualHeadSize * 0.08, 4), new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.2, name: "worm-tooth" }));
      tooth.position.set(Math.cos(a) * actualHeadSize * 0.18, Math.sin(a) * actualHeadSize * 0.18, actualHeadSize * 0.5);
      tooth.rotation.x = Math.PI / 2;
      head.add(tooth);
    }
    void wet;
  }

  // ==========================================
  // 3. HAIR — REMOVED, blank bald head for photo mapping
  // ==========================================

  // ==========================================
  // 4 ACCESSORIES. ACCESSORY SOCKETS & meshes
  // ==========================================
  const accessories = config.accessories || [];

  if (accessories.includes("glasses")) {
    const glasses = new THREE.Group();
    glasses.name = "glasses";
    glasses.position.set(0, 0, actualHeadSize * 0.35);

    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.1, metalness: 0.8, name: "glasses-frame" });
    const lensMaterial = new THREE.MeshStandardMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.65, roughness: 0.05, name: "glasses-lens" });

    const size = actualHeadSize * 0.22;
    const lensGeo = config.headShape === "organic-smooth" 
      ? getCylinderGeometry(size, size, 0.03, radialSeg) 
      : getBoxGeometry(size * 1.4, size * 1.1, 0.03);

    // Left Lens
    const leftLens = new THREE.Mesh(lensGeo, lensMaterial);
    leftLens.rotation.x = Math.PI / 2;
    leftLens.position.set(-actualHeadSize * 0.22, 0, 0);
    glasses.add(leftLens);

    // Left Frame Ring
    if (config.headShape === "organic-smooth") {
      const ringGeo = new THREE.TorusGeometry(size, 0.02, 8, 24);
      const leftRing = new THREE.Mesh(ringGeo, frameMaterial);
      leftRing.position.set(-actualHeadSize * 0.22, 0, 0.015);
      glasses.add(leftRing);
    }

    // Right Lens
    const rightLens = new THREE.Mesh(lensGeo, lensMaterial);
    rightLens.rotation.x = Math.PI / 2;
    rightLens.position.set(actualHeadSize * 0.22, 0, 0);
    glasses.add(rightLens);

    // Right Frame Ring
    if (config.headShape === "organic-smooth") {
      const ringGeo = new THREE.TorusGeometry(size, 0.02, 8, 24);
      const rightRing = new THREE.Mesh(ringGeo, frameMaterial);
      rightRing.position.set(actualHeadSize * 0.22, 0, 0.015);
      glasses.add(rightRing);
    }

    // Bridge
    const bridgeGeo = getBoxGeometry(actualHeadSize * 0.15, 0.03, 0.03);
    const bridge = new THREE.Mesh(bridgeGeo, frameMaterial);
    bridge.position.set(0, 0, 0.01);
    glasses.add(bridge);

    // Temple Arms
    const templeArmGeo = getBoxGeometry(0.03, 0.03, actualHeadSize * 0.7);
    
    const leftArm = new THREE.Mesh(templeArmGeo, frameMaterial);
    leftArm.position.set(-actualHeadSize * 0.33, 0, -actualHeadSize * 0.3);
    glasses.add(leftArm);

    const rightArm = new THREE.Mesh(templeArmGeo, frameMaterial);
    rightArm.position.set(actualHeadSize * 0.33, 0, -actualHeadSize * 0.3);
    glasses.add(rightArm);

    head.add(glasses);
  }

  if (accessories.includes("headphones")) {
    const headphones = new THREE.Group();
    headphones.name = "headphones";

    const hpMaterial = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.3, metalness: 0.5, name: "headphones" });

    // Cups
    const cupGeo = getCylinderGeometry(0.18, 0.18, 0.08, radialSeg);
    
    const leftCup = new THREE.Mesh(cupGeo, hpMaterial);
    leftCup.rotation.z = Math.PI / 2;
    leftCup.position.set(-actualHeadSize * 0.48, 0, 0);
    leftCup.castShadow = true;
    headphones.add(leftCup);

    const rightCup = new THREE.Mesh(cupGeo, hpMaterial);
    rightCup.rotation.z = -Math.PI / 2;
    rightCup.position.set(actualHeadSize * 0.48, 0, 0);
    rightCup.castShadow = true;
    headphones.add(rightCup);

    // Arch Band
    const bandGeo = getBoxGeometry(actualHeadSize * 0.96, 0.05, 0.08);
    const band = new THREE.Mesh(bandGeo, hpMaterial);
    band.position.set(0, actualHeadSize * 0.46, 0);
    headphones.add(band);

    head.add(headphones);
  }

  if (accessories.includes("backpack")) {
    const backpack = new THREE.Group();
    backpack.name = "backpack";

    const packMaterial = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8, name: "backpack" });
    const packGeo = getBoxGeometry(torsoWidth * 0.65, torsoHeight * 0.75, torsoDepth * 0.62);
    const packMesh = new THREE.Mesh(packGeo, packMaterial);
    packMesh.position.set(0, 0, -torsoDepth * 0.65);
    packMesh.castShadow = true;
    backpack.add(packMesh);

    // Straps
    const strapGeo = getBoxGeometry(0.06, torsoHeight * 0.82, torsoDepth * 0.3);
    
    const leftStrap = new THREE.Mesh(strapGeo, packMaterial);
    leftStrap.position.set(-torsoWidth * 0.24, 0.05, -torsoDepth * 0.25);
    backpack.add(leftStrap);

    const rightStrap = new THREE.Mesh(strapGeo, packMaterial);
    rightStrap.position.set(torsoWidth * 0.24, 0.05, -torsoDepth * 0.25);
    backpack.add(rightStrap);

    torso.add(backpack);
  }

  if (accessories.includes("halo")) {
    const halo = new THREE.Group();
    halo.name = "halo";
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0xfff3a1,
      roughness: 0.1,
      metalness: 0.1,
      emissive: new THREE.Color(0xfff3a1),
      emissiveIntensity: 1.5,
      name: "halo-material"
    });
    const ringGeo = new THREE.TorusGeometry(actualHeadSize * 0.42, 0.05, 8, 32);
    const ringMesh = new THREE.Mesh(ringGeo, haloMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.set(0, actualHeadSize * 0.72, 0);
    halo.add(ringMesh);
    head.add(halo);
  }

  if (accessories.includes("crown")) {
    const crown = new THREE.Group();
    crown.name = "crown";
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.15,
      metalness: 0.9,
      name: "crown-gold"
    });
    const gemRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.8, emissive: new THREE.Color(0xef4444), emissiveIntensity: 0.3 });
    const gemBlue = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.2, metalness: 0.8, emissive: new THREE.Color(0x3b82f6), emissiveIntensity: 0.3 });

    const baseGeo = getCylinderGeometry(actualHeadSize * 0.44, actualHeadSize * 0.44, 0.15, radialSeg);
    const baseMesh = new THREE.Mesh(baseGeo, goldMat);
    baseMesh.position.set(0, actualHeadSize * 0.52, 0);
    baseMesh.castShadow = true;
    crown.add(baseMesh);

    const peakGeo = getBoxGeometry(0.12, 0.16, 0.12);
    for (let i = 0; i < 4; i++) {
      const peak = new THREE.Mesh(peakGeo, goldMat);
      const angle = (i * Math.PI) / 2;
      const radius = actualHeadSize * 0.42;
      peak.position.set(Math.cos(angle) * radius, actualHeadSize * 0.62, Math.sin(angle) * radius);
      peak.rotation.y = -angle;
      peak.castShadow = true;
      crown.add(peak);

      const gemGeo = getBoxGeometry(0.06, 0.06, 0.06);
      const gem = new THREE.Mesh(gemGeo, i % 2 === 0 ? gemRed : gemBlue);
      gem.position.set(Math.cos(angle) * (radius + 0.03), actualHeadSize * 0.62, Math.sin(angle) * (radius + 0.03));
      gem.rotation.y = -angle;
      crown.add(gem);
    }
    head.add(crown);
  }

  if (accessories.includes("cat-ears")) {
    const ears = new THREE.Group();
    ears.name = "cat-ears";
    const outerMat = hairMaterial;
    const innerMat = new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.6, name: "ear-inner" });

    const earWidth = 0.16;
    const earHeight = 0.18;
    const earDepth = 0.16;

    const leftEarOuter = new THREE.Mesh(getBoxGeometry(earWidth, earHeight, earDepth), outerMat);
    leftEarOuter.position.set(-actualHeadSize * 0.36, actualHeadSize * 0.52, 0);
    leftEarOuter.rotation.z = Math.PI / 10;
    leftEarOuter.castShadow = true;
    ears.add(leftEarOuter);

    const leftEarInner = new THREE.Mesh(getBoxGeometry(earWidth * 0.7, earHeight * 0.7, 0.04), innerMat);
    leftEarInner.position.set(-actualHeadSize * 0.36, actualHeadSize * 0.52, earDepth * 0.4);
    leftEarInner.rotation.z = Math.PI / 10;
    ears.add(leftEarInner);

    const rightEarOuter = new THREE.Mesh(getBoxGeometry(earWidth, earHeight, earDepth), outerMat);
    rightEarOuter.position.set(actualHeadSize * 0.36, actualHeadSize * 0.52, 0);
    rightEarOuter.rotation.z = -Math.PI / 10;
    rightEarOuter.castShadow = true;
    ears.add(rightEarOuter);

    const rightEarInner = new THREE.Mesh(getBoxGeometry(earWidth * 0.7, earHeight * 0.7, 0.04), innerMat);
    rightEarInner.position.set(actualHeadSize * 0.36, actualHeadSize * 0.52, earDepth * 0.4);
    rightEarInner.rotation.z = -Math.PI / 10;
    ears.add(rightEarInner);

    head.add(ears);
  }

  if (accessories.includes("wizard-hat")) {
    const wizard = new THREE.Group();
    wizard.name = "wizard-hat";
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8, name: "wizard-felt" });
    const goldBandMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.8, name: "wizard-gold" });

    const brimGeo = getCylinderGeometry(actualHeadSize * 0.72, actualHeadSize * 0.72, 0.05, radialSeg);
    const brim = new THREE.Mesh(brimGeo, hatMat);
    brim.position.set(0, actualHeadSize * 0.48, 0);
    brim.rotation.x = Math.PI / 32;
    brim.castShadow = true;
    wizard.add(brim);

    const bandGeo = getCylinderGeometry(actualHeadSize * 0.46, actualHeadSize * 0.48, 0.08, radialSeg);
    const band = new THREE.Mesh(bandGeo, goldBandMat);
    band.position.set(0, actualHeadSize * 0.54, -0.01);
    band.rotation.x = Math.PI / 32;
    wizard.add(band);

    const coneGeo = getCylinderGeometry(0.02, actualHeadSize * 0.44, actualHeadSize * 0.95, radialSeg);
    const cone = new THREE.Mesh(coneGeo, hatMat);
    cone.position.set(0, actualHeadSize * 0.98, -0.08);
    cone.rotation.x = -Math.PI * 0.08;
    cone.castShadow = true;
    wizard.add(cone);

    head.add(wizard);
  }

  // --- EXTRA HIGHLY DETAILED ACCESSORIES ---
  if (accessories.includes("wings")) {
    const wings = new THREE.Group();
    wings.name = "wings";
    
    const wingsMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.materialEmissive || "#00f0ff"),
      roughness: 0.1,
      metalness: 0.1,
      emissive: new THREE.Color(config.materialEmissive || "#00f0ff"),
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      name: "wings-material"
    });
    
    const wingLeftGeo = getBoxGeometry(torsoWidth * 1.5, torsoHeight * 0.5, 0.04);
    const leftWing = new THREE.Mesh(wingLeftGeo, wingsMat);
    leftWing.position.set(-torsoWidth * 0.9, torsoHeight * 0.2, -torsoDepth * 0.65);
    leftWing.rotation.set(0.1, -Math.PI * 0.2, -Math.PI * 0.1);
    leftWing.castShadow = true;
    wings.add(leftWing);

    const featherL = new THREE.Mesh(getBoxGeometry(torsoWidth * 1.0, torsoHeight * 0.35, 0.04), wingsMat);
    featherL.position.set(-torsoWidth * 1.1, -torsoHeight * 0.1, -torsoDepth * 0.7);
    featherL.rotation.set(0.1, -Math.PI * 0.25, -Math.PI * 0.2);
    wings.add(featherL);

    const wingRightGeo = getBoxGeometry(torsoWidth * 1.5, torsoHeight * 0.5, 0.04);
    const rightWing = new THREE.Mesh(wingRightGeo, wingsMat);
    rightWing.position.set(torsoWidth * 0.9, torsoHeight * 0.2, -torsoDepth * 0.65);
    rightWing.rotation.set(0.1, Math.PI * 0.2, Math.PI * 0.1);
    rightWing.castShadow = true;
    wings.add(rightWing);

    const featherR = new THREE.Mesh(getBoxGeometry(torsoWidth * 1.0, torsoHeight * 0.35, 0.04), wingsMat);
    featherR.position.set(torsoWidth * 1.1, -torsoHeight * 0.1, -torsoDepth * 0.7);
    featherR.rotation.set(0.1, Math.PI * 0.25, Math.PI * 0.2);
    wings.add(featherR);
    
    torso.add(wings);
  }

  if (accessories.includes("horns")) {
    const horns = new THREE.Group();
    horns.name = "horns";
    
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.2,
      metalness: 0.7,
      name: "horn-material"
    });
    
    const hornLeftBase = new THREE.Mesh(getCylinderGeometry(0.08, 0.06, 0.35, 8), hornMat);
    hornLeftBase.position.set(-actualHeadSize * 0.35, actualHeadSize * 0.45, 0.1);
    hornLeftBase.rotation.set(Math.PI * 0.15, 0, Math.PI * 0.2);
    hornLeftBase.castShadow = true;
    horns.add(hornLeftBase);

    const hornLeftTip = new THREE.Mesh(getCylinderGeometry(0.06, 0.01, 0.25, 8), hornMat);
    hornLeftTip.position.set(-actualHeadSize * 0.42, actualHeadSize * 0.65, -0.05);
    hornLeftTip.rotation.set(-Math.PI * 0.1, 0, Math.PI * 0.35);
    hornLeftTip.castShadow = true;
    horns.add(hornLeftTip);

    const hornRightBase = new THREE.Mesh(getCylinderGeometry(0.08, 0.06, 0.35, 8), hornMat);
    hornRightBase.position.set(actualHeadSize * 0.35, actualHeadSize * 0.45, 0.1);
    hornRightBase.rotation.set(Math.PI * 0.15, 0, -Math.PI * 0.2);
    hornRightBase.castShadow = true;
    horns.add(hornRightBase);

    const hornRightTip = new THREE.Mesh(getCylinderGeometry(0.06, 0.01, 0.25, 8), hornMat);
    hornRightTip.position.set(actualHeadSize * 0.42, actualHeadSize * 0.65, -0.05);
    hornRightTip.rotation.set(-Math.PI * 0.1, 0, -Math.PI * 0.35);
    hornRightTip.castShadow = true;
    horns.add(hornRightTip);

    head.add(horns);
  }

  if (accessories.includes("cyber-visor")) {
    const visor = new THREE.Group();
    visor.name = "cyber-visor";
    
    const visorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.materialEmissive || "#00f0ff"),
      roughness: 0.05,
      metalness: 0.95,
      emissive: new THREE.Color(config.materialEmissive || "#00f0ff"),
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.85,
      name: "visor-neon"
    });
    
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, name: "visor-strap" });

    const shieldGeo = getBoxGeometry(actualHeadSize * 0.72, 0.18, 0.12);
    const shield = new THREE.Mesh(shieldGeo, visorMat);
    shield.position.set(0, actualHeadSize * 0.05, actualHeadSize * 0.44);
    shield.castShadow = true;
    visor.add(shield);

    const leftStrap = new THREE.Mesh(getBoxGeometry(0.04, 0.08, actualHeadSize * 0.45), bandMat);
    leftStrap.position.set(-actualHeadSize * 0.36, actualHeadSize * 0.05, actualHeadSize * 0.15);
    visor.add(leftStrap);

    const rightStrap = new THREE.Mesh(getBoxGeometry(0.04, 0.08, actualHeadSize * 0.45), bandMat);
    rightStrap.position.set(actualHeadSize * 0.36, actualHeadSize * 0.05, actualHeadSize * 0.15);
    visor.add(rightStrap);

    head.add(visor);
  }

  if (accessories.includes("cape")) {
    const cape = new THREE.Group();
    cape.name = "cape";
    
    const capeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.clothingColor || "#1e3a8a"),
      roughness: 0.85,
      side: THREE.DoubleSide,
      name: "cape-cloth"
    });
    
    const capeGeo = getBoxGeometry(torsoWidth * 1.15, torsoHeight * 1.35, 0.03);
    const capeMesh = new THREE.Mesh(capeGeo, capeMat);
    capeMesh.position.set(0, -torsoHeight * 0.22, -torsoDepth * 0.58);
    capeMesh.rotation.x = Math.PI * 0.06;
    capeMesh.castShadow = true;
    cape.add(capeMesh);
    
    const claspMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.15, metalness: 0.85, name: "clasp-gold" });
    const claspGeo = getSphereGeometry(0.08, 8, 8);
    
    const leftClasp = new THREE.Mesh(claspGeo, claspMat);
    leftClasp.position.set(-torsoWidth * 0.35, torsoHeight * 0.46, torsoDepth * 0.52);
    cape.add(leftClasp);

    const rightClasp = new THREE.Mesh(claspGeo, claspMat);
    rightClasp.position.set(torsoWidth * 0.35, torsoHeight * 0.46, torsoDepth * 0.52);
    cape.add(rightClasp);

    torso.add(cape);
  }

  // --- CREATURE / EXOTIC ANIMAL FEATURES ---
  if (accessories.includes("snout") && !hasPhotoTexture) {
    const snout = new THREE.Group();
    snout.name = "snout";
    const snoutMat = skinMaterial;

    const muzzleGeo = config.headShape === "organic-smooth"
      ? getCylinderGeometry(actualHeadSize * 0.22, actualHeadSize * 0.16, actualHeadSize * 0.4, radialSeg)
      : getBoxGeometry(actualHeadSize * 0.34, actualHeadSize * 0.24, actualHeadSize * 0.4);
    const muzzle = new THREE.Mesh(muzzleGeo, snoutMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, -actualHeadSize * 0.08, actualHeadSize * 0.52);
    muzzle.castShadow = true;
    snout.add(muzzle);

    const noseMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.4, name: "nose-tip" });
    const noseGeo = getSphereGeometry(actualHeadSize * 0.09, 8, 8);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, -actualHeadSize * 0.08, actualHeadSize * 0.72);
    snout.add(nose);

    head.add(snout);
  }

  if (accessories.includes("whiskers")) {
    const whiskers = new THREE.Group();
    whiskers.name = "whiskers";
    const whiskerMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.5, name: "whisker" });
    const whiskerGeo = getCylinderGeometry(0.008, 0.003, actualHeadSize * 0.5, 6);

    const snoutZ = accessories.includes("snout") ? actualHeadSize * 0.62 : actualHeadSize * 0.42;
    [-1, 1].forEach((side) => {
      [-1, 0, 1].forEach((row) => {
        const whisker = new THREE.Mesh(whiskerGeo, whiskerMat);
        whisker.position.set(side * actualHeadSize * 0.3, -actualHeadSize * 0.08 + row * 0.05, snoutZ);
        whisker.rotation.z = Math.PI / 2;
        whisker.rotation.y = side * (Math.PI / 2 - 0.35) + row * 0.12;
        whiskers.add(whisker);
      });
    });

    head.add(whiskers);
  }

  if (accessories.includes("mushroom-cap")) {
    const mushroom = new THREE.Group();
    mushroom.name = "mushroom-cap";
    const capMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6, name: "mushroom-cap-mat" });
    const spotMat = new THREE.MeshStandardMaterial({ color: 0xfefce8, roughness: 0.5, name: "mushroom-spot" });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xfefce8, roughness: 0.7, name: "mushroom-stem" });

    const stemGeo = getCylinderGeometry(actualHeadSize * 0.3, actualHeadSize * 0.34, actualHeadSize * 0.22, radialSeg);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(0, actualHeadSize * 0.42, 0);
    mushroom.add(stem);

    const capGeo = new THREE.SphereGeometry(actualHeadSize * 0.62, radialSeg, radialSeg, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, actualHeadSize * 0.5, 0);
    cap.castShadow = true;
    mushroom.add(cap);

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spotGeo = getSphereGeometry(actualHeadSize * 0.07, 8, 8);
      const spot = new THREE.Mesh(spotGeo, spotMat);
      const r = actualHeadSize * 0.4;
      spot.position.set(Math.cos(angle) * r, actualHeadSize * 0.68, Math.sin(angle) * r);
      mushroom.add(spot);
    }

    head.add(mushroom);
  }

  if (accessories.includes("fins")) {
    const fins = new THREE.Group();
    fins.name = "fins";
    const finMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      name: "fin-material",
    });

    const dorsalGeo = new THREE.ConeGeometry(actualHeadSize * 0.34, actualHeadSize * 0.7, 3);
    const dorsal = new THREE.Mesh(dorsalGeo, finMat);
    dorsal.position.set(0, torsoHeight * 0.55, -torsoDepth * 0.4);
    dorsal.rotation.set(Math.PI * 0.06, Math.PI / 6, 0);
    dorsal.castShadow = true;
    fins.add(dorsal);

    const sideFinGeo = getBoxGeometry(torsoWidth * 0.7, 0.03, torsoDepth * 0.55);
    const leftFin = new THREE.Mesh(sideFinGeo, finMat);
    leftFin.position.set(-torsoWidth * 0.7, torsoHeight * 0.05, 0);
    leftFin.rotation.z = Math.PI * 0.08;
    fins.add(leftFin);

    const rightFin = new THREE.Mesh(sideFinGeo, finMat);
    rightFin.position.set(torsoWidth * 0.7, torsoHeight * 0.05, 0);
    rightFin.rotation.z = -Math.PI * 0.08;
    fins.add(rightFin);

    torso.add(fins);
  }

  if (accessories.includes("tail")) {
    const tail = new THREE.Group();
    tail.name = "tail";
    const tailMat = skinMaterial;

    const segments = 5;
    let radius = torsoWidth * 0.18;
    let tailZ = -torsoDepth * 0.45;
    let tailY = -torsoHeight * 0.15;
    for (let i = 0; i < segments; i++) {
      const segLength = torsoHeight * 0.22;
      const nextRadius = radius * 0.82;
      const segGeo = getCylinderGeometry(radius, nextRadius, segLength, 8);
      const seg = new THREE.Mesh(segGeo, tailMat);
      seg.rotation.x = -Math.PI / 2;
      seg.position.set(0, tailY, tailZ - segLength / 2);
      seg.castShadow = true;
      tail.add(seg);
      tailZ -= segLength;
      tailY -= segLength * 0.08; // gentle downward droop as it extends
      radius = nextRadius;
    }

    torso.add(tail);
  }

  // ==========================================
  // 5. SKINNED MESH RIGGED LIMBS (SKELETON)
  // ==========================================
  const createSkinnedLimb = (
    isArm: boolean,
    isLeft: boolean
  ): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.name = `${isLeft ? "left" : "right"}-${isArm ? "arm" : "leg"}-pivot`;

    // A. BONE CHAINS
    const b0 = new THREE.Bone();
    b0.name = `${isLeft ? "left" : "right"}-${isArm ? "shoulder" : "hip"}-bone`;
    b0.position.set(0, 0, 0);

    const b1 = new THREE.Bone();
    b1.name = `${isLeft ? "left" : "right"}-${isArm ? "elbow" : "knee"}-bone`;
    b1.position.set(0, -limbLength * 0.5, 0);
    b0.add(b1);

    const b2 = new THREE.Bone();
    b2.name = `${isLeft ? "left" : "right"}-${isArm ? "wrist" : "ankle"}-bone`;
    b2.position.set(0, -limbLength * 0.5, 0);
    b1.add(b2);

    const bonesArray = [b0, b1, b2];
    const skeleton = new THREE.Skeleton(bonesArray);

    // B. SKINNED CYLINDER MESH
    const jointRadius = isArm ? 0.17 : 0.21;
    const limbMaterial = isArm ? clothingMaterial : pantsMaterial;

    const limbGeo = getCylinderGeometry(jointRadius, jointRadius * 0.72, limbLength, radialSeg, radialSeg).clone();
    limbGeo.translate(0, -limbLength / 2, 0);

    // Assign Vertex weights for seamless skeleton binding
    const positionAttr = limbGeo.attributes.position;
    const skinIndices: number[] = [];
    const skinWeights: number[] = [];

    for (let i = 0; i < positionAttr.count; i++) {
      const y = positionAttr.getY(i); // ranges from 0 down to -limbLength
      const pct = -y / limbLength; // normalized 0 to 1

      if (pct < 0.5) {
        const t = pct / 0.5; // weight transitions 0 to 1
        skinIndices.push(0, 1, 0, 0);
        skinWeights.push(1 - t, t, 0, 0);
      } else {
        const t = (pct - 0.5) / 0.5;
        skinIndices.push(1, 2, 0, 0);
        skinWeights.push(1 - t, t, 0, 0);
      }
    }

    limbGeo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
    limbGeo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));

    const skinnedMesh = new THREE.SkinnedMesh(limbGeo, limbMaterial);
    skinnedMesh.name = `${isLeft ? "left" : "right"}-${isArm ? "arm" : "leg"}-mesh`;
    skinnedMesh.castShadow = true;
    skinnedMesh.receiveShadow = true;
    skinnedMesh.add(b0); // root bone
    skinnedMesh.bind(skeleton);
    pivot.add(skinnedMesh);

    // C. ATTACHMENT SOCKET ENDS (Follow skeleton terminal bone b2)
    if (isArm) {
      const handGeo = getSphereGeometry(jointRadius * 0.85, radialSeg, radialSeg);
      const hand = new THREE.Mesh(handGeo, skinMaterial);
      hand.name = `${isLeft ? "left" : "right"}-hand`;
      hand.castShadow = true;
      b2.add(hand);
    } else {
      const shoeRadius = jointRadius * 0.95;
      const shoeGeo = getSphereGeometry(shoeRadius, radialSeg, radialSeg);
      const shoe = new THREE.Mesh(shoeGeo, shoesMaterial);
      shoe.name = `${isLeft ? "left" : "right"}-shoe`;
      shoe.position.set(0, 0, shoeRadius * 0.45);
      shoe.scale.set(1.0, 0.75, 1.55); // Elongated along Z
      shoe.castShadow = true;
      b2.add(shoe);
    }

    return pivot;
  };

  // Classic rigid blocky limb fallback
  const createClassicLimb = (
    isArm: boolean,
    isLeft: boolean
  ): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.name = `${isLeft ? "left" : "right"}-${isArm ? "arm" : "leg"}-classic`;

    const limbGeo = getBoxGeometry(limbWidth, limbLength, limbWidth);
    const limbMesh = new THREE.Mesh(limbGeo, isArm ? clothingMaterial : pantsMaterial);
    limbMesh.name = "limb";
    limbMesh.position.y = -limbLength / 2;
    limbMesh.castShadow = true;
    limbMesh.receiveShadow = true;
    pivot.add(limbMesh);

    if (isArm) {
      const handGeo = getBoxGeometry(limbWidth + 0.02, 0.2, limbWidth + 0.02);
      const hand = new THREE.Mesh(handGeo, skinMaterial);
      hand.name = "hand";
      hand.position.y = -limbLength / 2 - 0.1;
      limbMesh.add(hand);
    } else {
      const shoeGeo = getBoxGeometry(limbWidth + 0.04, 0.25, limbWidth * 1.3);
      const shoe = new THREE.Mesh(shoeGeo, shoesMaterial);
      shoe.name = "shoe";
      shoe.position.set(0, -limbLength / 2 - 0.125, limbWidth * 0.15);
      limbMesh.add(shoe);
    }

    return pivot;
  };

  // Build and mount limbs — humanoid OR true-animal body plan
  const isOrganic = config.headShape === "organic-smooth";
  const variant = config.creatureVariant || "none";

  /** Non-humanoid animals: replace arms/legs with tentacles, multi-legs, legless bodies, etc. */
  const TRUE_ANIMAL_PLANS = new Set([
    "octopus", "spider", "snake", "bat", "crow", "rat", "centipede",
    "biped-lizard", "toad", "scorpion", "worm", "mantis",
  ]);
  const usesAnimalBody = TRUE_ANIMAL_PLANS.has(variant);

  let leftArm: THREE.Group | null = null;
  let rightArm: THREE.Group | null = null;
  let leftLeg: THREE.Group | null = null;
  let rightLeg: THREE.Group | null = null;

  if (!usesAnimalBody) {
    leftArm = isOrganic ? createSkinnedLimb(true, true) : createClassicLimb(true, true);
    leftArm.name = "left-arm";
    leftArm.position.set(-torsoWidth / 2 - limbWidth / 2 - 0.05, torsoHeight / 2 - 0.1, 0);
    torso.add(leftArm);

    rightArm = isOrganic ? createSkinnedLimb(true, false) : createClassicLimb(true, false);
    rightArm.name = "right-arm";
    rightArm.position.set(torsoWidth / 2 + limbWidth / 2 + 0.05, torsoHeight / 2 - 0.1, 0);
    torso.add(rightArm);

    leftLeg = isOrganic ? createSkinnedLimb(false, true) : createClassicLimb(false, true);
    leftLeg.name = "left-leg";
    leftLeg.position.set(-torsoWidth / 4, -torsoHeight / 2, 0);
    torso.add(leftLeg);

    rightLeg = isOrganic ? createSkinnedLimb(false, false) : createClassicLimb(false, false);
    rightLeg.name = "right-leg";
    rightLeg.position.set(torsoWidth / 4, -torsoHeight / 2, 0);
    torso.add(rightLeg);
  } else {
    // ==========================================
    // TRUE ANIMAL BODY PLANS
    // ==========================================
    const animalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.skinColor),
      ...getMatParams(0.75, 0.05),
      name: "animal-body",
    });
    const animalDark = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.hairColor || "#1c1917"),
      roughness: 0.7,
      name: "animal-dark",
    });

    const makeSegmentedLimb = (
      name: string,
      segs: number,
      baseR: number,
      segLen: number,
      droop = 0.08
    ): THREE.Group => {
      const g = new THREE.Group();
      g.name = name;
      let r = baseR;
      let y = 0;
      for (let i = 0; i < segs; i++) {
        const nextR = r * 0.82;
        const seg = new THREE.Mesh(getCylinderGeometry(r, nextR, segLen, 8), animalMat);
        seg.position.y = y - segLen / 2;
        seg.castShadow = true;
        g.add(seg);
        y -= segLen;
        // slight forward curl for tentacles
        seg.rotation.x = droop;
        r = nextR;
      }
      return g;
    };

    if (variant === "octopus") {
      // 12 arms (weird on purpose — not biology-textbook accurate)
      const tentacleRoot = new THREE.Group();
      tentacleRoot.name = "octopus-tentacles";
      const armCount = 12;
      for (let i = 0; i < armCount; i++) {
        const angle = (i / armCount) * Math.PI * 2;
        const arm = makeSegmentedLimb(`octopus-arm-${i}`, 7, torsoWidth * 0.12, torsoHeight * 0.22, 0.12);
        arm.position.set(
          Math.cos(angle) * torsoWidth * 0.45,
          -torsoHeight * 0.35,
          Math.sin(angle) * torsoDepth * 0.45
        );
        arm.rotation.z = Math.cos(angle) * 0.4;
        arm.rotation.x = Math.sin(angle) * 0.35 + 0.5;
        tentacleRoot.add(arm);
        // sucker bumps on outer segs
        for (let s = 0; s < 3; s++) {
          const sucker = new THREE.Mesh(getSphereGeometry(0.04, 6, 6), animalDark);
          sucker.position.set(
            Math.cos(angle) * 0.08,
            -torsoHeight * 0.15 - s * 0.2,
            Math.sin(angle) * 0.08
          );
          arm.add(sucker);
        }
      }
      torso.add(tentacleRoot);
      // Soften torso into mantle
      torso.scale.set(1.15, 0.85, 1.15);
    } else if (variant === "spider") {
      const legRoot = new THREE.Group();
      legRoot.name = "spider-legs";
      for (let i = 0; i < 8; i++) {
        const side = i < 4 ? -1 : 1;
        const slot = i % 4;
        const leg = makeSegmentedLimb(`spider-leg-${i}`, 4, 0.08, limbLength * 0.45, 0.05);
        leg.position.set(side * torsoWidth * 0.55, -torsoHeight * 0.15, (slot - 1.5) * torsoDepth * 0.55);
        leg.rotation.z = side * (0.9 + slot * 0.08);
        leg.rotation.x = (slot - 1.5) * 0.15;
        legRoot.add(leg);
      }
      torso.add(legRoot);
      torso.scale.set(1.35, 0.7, 1.2);
      // Abdomen bulb behind
      const abdomen = new THREE.Mesh(getSphereGeometry(torsoWidth * 0.55, 12, 12), animalMat);
      abdomen.name = "spider-abdomen";
      abdomen.position.set(0, 0, -torsoDepth * 1.1);
      abdomen.scale.set(1.1, 0.9, 1.3);
      torso.add(abdomen);
    } else if (variant === "snake" || variant === "worm") {
      // === SERPENT BODY: sinuous segmented tail with dorsal fins ===
      const bodyTrail = new THREE.Group();
      bodyTrail.name = `${variant}-body-trail`;
      
      const isSerpent = variant === "snake";
      const scaleMatBody = new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.skinColor),
        roughness: 0.35,
        metalness: 0.08,
        name: "serpent-body",
      });
      const finMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.clothingColor || "#15803d"),
        roughness: 0.4,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        name: "serpent-fin",
      });
      
      let r = torsoWidth * 0.36;
      let z = -torsoDepth * 0.35;
      let y = -torsoHeight * 0.08;
      const segs = variant === "worm" ? 14 : 14;
      
      for (let i = 0; i < segs; i++) {
        const nextR = r * 0.88;
        const segLen = torsoHeight * 0.32;
        const waveX = Math.sin(i * 0.65) * 0.18;
        const waveY = Math.cos(i * 0.5) * 0.04;
        
        // Main body segment
        const seg = new THREE.Mesh(getCylinderGeometry(r, nextR, segLen, 12), isSerpent ? scaleMatBody : animalMat);
        seg.rotation.x = -Math.PI / 2;
        seg.position.set(waveX, y + waveY, z - segLen / 2);
        seg.castShadow = true;
        seg.receiveShadow = true;
        bodyTrail.add(seg);
        
        // Scale ridge rings (every segment for serpent, every other for worm)
        if (variant === "worm" && i % 2 === 0) {
          const ring = new THREE.Mesh(getCylinderGeometry(r * 1.08, r * 1.08, segLen * 0.15, 10), animalDark);
          ring.rotation.x = -Math.PI / 2;
          ring.position.copy(seg.position);
          bodyTrail.add(ring);
        } else if (isSerpent) {
          // Subtle scale ridge rings
          const ridge = new THREE.Mesh(getCylinderGeometry(r * 1.04, nextR * 1.04, segLen * 0.12, 12), scaleMatBody);
          ridge.rotation.x = -Math.PI / 2;
          ridge.position.copy(seg.position);
          bodyTrail.add(ridge);
        }
        
        // === DORSAL FIN CREST (serpent only) ===
        if (isSerpent && i < segs - 2) {
          const finHeight = r * (1.4 - i * 0.06);
          const finGeo = new THREE.ConeGeometry(r * 0.55, finHeight, 5);
          const fin = new THREE.Mesh(finGeo, finMat);
          fin.name = `serpent-dorsal-fin-${i}`;
          fin.position.set(waveX, y + waveY + r + finHeight * 0.35, z - segLen * 0.5);
          fin.rotation.x = -Math.PI * 0.12;
          fin.castShadow = true;
          bodyTrail.add(fin);
          
          // Side finlets every few segments
          if (i % 3 === 1) {
            [-1, 1].forEach((side) => {
              const sideFin = new THREE.Mesh(
                getBoxGeometry(0.03, r * 0.7, r * 0.5),
                finMat
              );
              sideFin.name = `serpent-side-fin-${i}-${side}`;
              sideFin.position.set(
                waveX + side * r * 0.85,
                y + waveY,
                z - segLen * 0.5
              );
              sideFin.rotation.set(0, 0, side * Math.PI * 0.25);
              sideFin.castShadow = true;
              bodyTrail.add(sideFin);
            });
          }
        }
        
        // === TAIL FIN FLUKE (last segment, serpent only) ===
        if (isSerpent && i === segs - 1) {
          const tailFinMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(config.clothingColor || "#15803d"),
            roughness: 0.4,
            transparent: true,
            opacity: 0.82,
            side: THREE.DoubleSide,
            name: "serpent-tail-fin",
          });
          // Forked tail fluke - left lobe
          const tailL = new THREE.Mesh(
            getBoxGeometry(r * 1.8, 0.035, r * 1.4),
            tailFinMat
          );
          tailL.name = "serpent-tail-fin-L";
          tailL.position.set(waveX - r * 0.5, y + waveY, z - segLen * 0.8);
          tailL.rotation.set(0, 0, Math.PI * 0.18);
          tailL.castShadow = true;
          bodyTrail.add(tailL);
          // Forked tail fluke - right lobe
          const tailR = new THREE.Mesh(
            getBoxGeometry(r * 1.8, 0.035, r * 1.4),
            tailFinMat
          );
          tailR.name = "serpent-tail-fin-R";
          tailR.position.set(waveX + r * 0.5, y + waveY, z - segLen * 0.8);
          tailR.rotation.set(0, 0, -Math.PI * 0.18);
          tailR.castShadow = true;
          bodyTrail.add(tailR);
          // Center tail spine
          const tailSpine = new THREE.Mesh(
            getCylinderGeometry(r * 0.35, 0.015, r * 1.8, 6),
            scaleMatBody
          );
          tailSpine.name = "serpent-tail-spine";
          tailSpine.rotation.x = -Math.PI / 2;
          tailSpine.position.set(waveX, y + waveY, z - segLen * 1.1);
          bodyTrail.add(tailSpine);
        }
        
        z -= segLen * 0.92;
        y -= segLen * 0.03;
        r = nextR;
      }
      torso.add(bodyTrail);
      // Serpent is longer / more sinuous
      torso.scale.set(isSerpent ? 0.78 : 0.85, 0.9, 1.4);
    } else if (variant === "bat") {
      // BAT — small biped legs + membrane wings
      leftLeg = isOrganic ? createSkinnedLimb(false, true) : createClassicLimb(false, true);
      leftLeg.name = "left-leg";
      leftLeg.scale.set(0.7, 0.75, 0.7);
      leftLeg.position.set(-torsoWidth * 0.2, -torsoHeight / 2, 0);
      torso.add(leftLeg);
      rightLeg = isOrganic ? createSkinnedLimb(false, false) : createClassicLimb(false, false);
      rightLeg.name = "right-leg";
      rightLeg.scale.set(0.7, 0.75, 0.7);
      rightLeg.position.set(torsoWidth * 0.2, -torsoHeight / 2, 0);
      torso.add(rightLeg);

      const wingMat = new THREE.MeshStandardMaterial({
        color: config.skinColor || "#18181b",
        roughness: 0.6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        name: "bat-wing",
      });
      [-1, 1].forEach((side) => {
        const wing = new THREE.Mesh(getBoxGeometry(torsoWidth * 1.6, torsoHeight * 0.08, torsoDepth * 1.4), wingMat);
        wing.name = `bat-wing-${side}`;
        wing.position.set(side * torsoWidth * 0.9, torsoHeight * 0.15, -torsoDepth * 0.2);
        wing.rotation.set(0.15, side * 0.35, side * 0.5);
        wing.castShadow = true;
        torso.add(wing);
        // Finger spars
        for (let f = 0; f < 3; f++) {
          const spar = new THREE.Mesh(getCylinderGeometry(0.02, 0.015, torsoWidth * 1.2, 5), animalDark);
          spar.rotation.z = side * (0.9 + f * 0.15);
          spar.position.set(side * torsoWidth * 0.5, torsoHeight * 0.2, -torsoDepth * (0.1 + f * 0.15));
          torso.add(spar);
        }
      });
      torso.scale.set(0.9, 0.95, 1.0);
    } else if (variant === "crow") {
      // MURDER CROW — glossy corvid with feathered wings, talons, tail fan
      const crowFeather = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.28, metalness: 0.4, name: "crow-feather" });
      const crowBeakMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35, metalness: 0.15, name: "crow-beak" });
      const crowTalMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.1, name: "crow-talon" });

      // Kill the default human arms/legs — crow gets its own
      leftArm = null as any;
      rightArm = null as any;
      leftLeg = null as any;
      rightLeg = null as any;

      // Feathered wings — layered primary feathers
      [-1, 1].forEach((side) => {
        const wingRoot = new THREE.Group();
        wingRoot.name = `crow-wing-${side > 0 ? "right" : "left"}`;

        // Upper arm / shoulder coverts
        const upperWing = new THREE.Mesh(getBoxGeometry(torsoWidth * 0.42, torsoHeight * 0.14, 0.06), crowFeather);
        upperWing.position.set(side * 0.12, 0, 0);
        upperWing.rotation.z = side * -0.35;
        upperWing.castShadow = true;
        wingRoot.add(upperWing);

        // Primary flight feathers — 6 long quills fanning out
        for (let f = 0; f < 6; f++) {
          const featherLen = 0.72 - f * 0.055;
          const feather = new THREE.Mesh(getBoxGeometry(0.065, featherLen, 0.012), crowFeather);
          feather.position.set(side * (0.32 + f * 0.09), -0.18 - f * 0.04, -0.02 + f * 0.015);
          feather.rotation.z = side * (-0.55 - f * 0.12);
          feather.rotation.y = f * 0.08;
          feather.castShadow = true;
          wingRoot.add(feather);
          // quill shaft
          const shaft = new THREE.Mesh(getCylinderGeometry(0.006, 0.003, featherLen * 0.88, 4), crowBeakMat);
          shaft.position.set(side * (0.32 + f * 0.09), -0.18 - f * 0.04, -0.012 + f * 0.015);
          shaft.rotation.z = side * (-0.55 - f * 0.12) + Math.PI / 2;
          wingRoot.add(shaft);
        }

        // Secondary coverts — shorter feathers along upper wing
        for (let c = 0; c < 4; c++) {
          const covert = new THREE.Mesh(getBoxGeometry(0.055, 0.28, 0.01), crowFeather);
          covert.position.set(side * (0.14 + c * 0.06), -0.06, 0.015);
          covert.rotation.z = side * (-0.28 - c * 0.06);
          wingRoot.add(covert);
        }

        wingRoot.position.set(side * torsoWidth * 0.52, torsoHeight * 0.18, -torsoDepth * 0.08);
        wingRoot.rotation.y = side * 0.15;
        torso.add(wingRoot);
      });

      // Bird legs — scaly, thin, with murder talons
      [-1, 1].forEach((side) => {
        const birdLeg = new THREE.Group();
        birdLeg.name = `crow-leg-${side > 0 ? "right" : "left"}`;

        // Tarsus — scaly bird shin
        const tarsus = new THREE.Mesh(getCylinderGeometry(0.032, 0.026, 0.52, 6), crowTalMat);
        tarsus.position.set(0, -0.26, 0.02);
        tarsus.castShadow = true;
        birdLeg.add(tarsus);

        // Toes — 3 forward, 1 back (zygodactyl-ish)
        const toePos: Array<[number, number, number, number]> = [
          [-0.055, -0.52, 0.045, -0.35],  // left toe
          [0,      -0.52, 0.065, 0     ],  // middle toe
          [ 0.055, -0.52, 0.045,  0.35],  // right toe
          [0,      -0.48, -0.045, Math.PI], // hallux (back toe)
        ];
        toePos.forEach(([tx, ty, tlen, trot], ti) => {
          const toe = new THREE.Mesh(getCylinderGeometry(0.014, 0.01, tlen, 4), crowTalMat);
          toe.position.set(tx, ty, ti === 3 ? -0.018 : 0.012);
          toe.rotation.x = Math.PI / 2;
          toe.rotation.y = trot;
          toe.castShadow = true;
          birdLeg.add(toe);
          // talon claw
          const talon = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.048, 4), crowBeakMat);
          const clawDir = ti === 3 ? -1 : 1;
          toePos[ti][1] = ty; // keep TS happy
          const cx = tx + Math.sin(trot) * tlen * 0.55;
          const cz = (ti === 3 ? -0.018 : 0.012) + Math.cos(trot) * tlen * 0.55;
          talon.position.set(cx, ty - 0.01, cz);
          talon.rotation.x = Math.PI / 2 + 0.4 * clawDir;
          talon.rotation.z = trot;
          birdLeg.add(talon);
        });

        birdLeg.position.set(side * torsoWidth * 0.22, -torsoHeight * 0.42, torsoDepth * 0.04);
        torso.add(birdLeg);
      });

      // Tail fan — spread crow tail feathers
      const tailFan = new THREE.Group();
      tailFan.name = "crow-tail";
      for (let t = 0; t < 7; t++) {
        const tailFeather = new THREE.Mesh(getBoxGeometry(0.058, 0.52, 0.011), crowFeather);
        const spread = (t - 3) * 0.18;
        tailFeather.position.set(spread * 0.38, -0.24, -0.02);
        tailFeather.rotation.z = spread * 0.22;
        tailFeather.rotation.x = Math.PI / 2 - 0.15;
        tailFeather.castShadow = true;
        tailFan.add(tailFeather);
      }
      tailFan.position.set(0, -torsoHeight * 0.38, -torsoDepth * 0.42);
      tailFan.rotation.x = 0.35;
      torso.add(tailFan);

      // Chest fluff — layered breast feathers
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const fluff = new THREE.Mesh(getBoxGeometry(0.11, 0.085, 0.01), crowFeather);
          fluff.position.set((c - 1) * 0.13, torsoHeight * (0.12 - r * 0.14), torsoDepth * 0.32);
          fluff.rotation.x = -0.25 - r * 0.08;
          torso.add(fluff);
        }
      }

      torso.scale.set(0.88, 1.05, 0.92);

    } else if (variant === "rat") {
      // Four short legs + long tail
      for (let i = 0; i < 4; i++) {
        const side = i < 2 ? -1 : 1;
        const front = i % 2 === 0 ? 1 : -1;
        const leg = makeSegmentedLimb(`rat-leg-${i}`, 3, 0.1, limbLength * 0.35, 0.02);
        leg.position.set(side * torsoWidth * 0.4, -torsoHeight * 0.4, front * torsoDepth * 0.35);
        leg.rotation.z = side * 0.25;
        torso.add(leg);
      }
      const tail = makeSegmentedLimb("rat-tail", 8, torsoWidth * 0.08, torsoHeight * 0.2, 0.06);
      tail.rotation.x = Math.PI / 2;
      tail.position.set(0, -torsoHeight * 0.2, -torsoDepth * 0.5);
      torso.add(tail);
      torso.scale.set(1.1, 0.75, 1.25);
    } else if (variant === "possum") {
      // GREASY TRASH GOBLIN BODY — hunched, mangy, NASTY + ARMORED SHELL
      const possumFur = new THREE.MeshStandardMaterial({ color: 0x7c7c7c, roughness: 0.92, name: "possum-body-fur" });
      const pinkSkin = new THREE.MeshStandardMaterial({ color: 0xf9a8d4, roughness: 0.55, name: "possum-pink-skin" });
      const clawMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.4, name: "possum-claw" });
      // BONEGNAW SHELL — mangy armored back plates, like a trash armadillo
      const shellMat = new THREE.MeshStandardMaterial({ color: 0x52453a, roughness: 0.85, metalness: 0.05, name: "possum-shell" });
      const shellRidgeMat = new THREE.MeshStandardMaterial({ color: 0x2d2419, roughness: 0.7, name: "possum-shell-ridge" });

      // Shell plates down the back — 5 segmented bony plates
      for (let s = 0; s < 5; s++) {
        const plate = new THREE.Mesh(getBoxGeometry(torsoWidth * (0.92 - s * 0.06), torsoHeight * 0.11, torsoDepth * 0.52), shellMat);
        plate.name = `possum-shell-${s}`;
        plate.position.set(0, torsoHeight * (0.32 - s * 0.16), -torsoDepth * (0.08 + s * 0.07));
        plate.rotation.x = 0.06 + s * 0.045;
        plate.castShadow = true;
        torso.add(plate);
        // Bony ridge spike on each plate — nasty
        const ridge = new THREE.Mesh(new THREE.ConeGeometry(torsoWidth * 0.05, torsoHeight * 0.09, 4), shellRidgeMat);
        ridge.name = `possum-shell-ridge-${s}`;
        ridge.position.set(0, torsoHeight * (0.38 - s * 0.16), -torsoDepth * (0.08 + s * 0.07));
        ridge.rotation.x = -0.25;
        torso.add(ridge);
        // Side spikes — flared
        [-1, 1].forEach(t => {
          const sideSpike = new THREE.Mesh(new THREE.ConeGeometry(torsoWidth * 0.032, torsoHeight * 0.07, 3), shellRidgeMat);
          sideSpike.name = `possum-shell-spike-${s}-${t > 0 ? 'r' : 'l'}`;
          sideSpike.position.set(t * torsoWidth * (0.42 - s * 0.025), torsoHeight * (0.3 - s * 0.16), -torsoDepth * (0.08 + s * 0.07));
          sideSpike.rotation.z = t * Math.PI / 2.5;
          torso.add(sideSpike);
        });
      }
      // Shell shoulder pauldrons
      [-1, 1].forEach(side => {
        const pauldron = new THREE.Mesh(getSphereGeometry(torsoWidth * 0.22, 8, 8), shellMat);
        pauldron.name = `possum-pauldron-${side > 0 ? 'right' : 'left'}`;
        pauldron.scale.set(1.4, 0.55, 1.1);
        pauldron.position.set(side * torsoWidth * 0.48, torsoHeight * 0.28, -torsoDepth * 0.02);
        pauldron.castShadow = true;
        torso.add(pauldron);
      });

      // CLAW HANDS — long creepy possum fingers with black needle claws
      const makePossumHand = (side: number) => {
        const hand = new THREE.Group();
        hand.name = `possum-hand-${side > 0 ? "right" : "left"}`;
        const palm = new THREE.Mesh(getSphereGeometry(0.06, 8, 8), pinkSkin);
        palm.scale.set(1.3, 0.7, 1.1);
        hand.add(palm);
        // 5 long spindly fingers + claws
        for (let f = 0; f < 5; f++) {
          const angle = ((f / 4) - 0.5) * 1.3;
          const finger = new THREE.Mesh(getCylinderGeometry(0.014, 0.01, 0.14, 5), pinkSkin);
          finger.position.set(Math.sin(angle) * 0.05, -0.07, Math.cos(angle) * 0.04);
          finger.rotation.x = 0.15;
          finger.rotation.z = angle * 0.4;
          hand.add(finger);
          // Black needle claw tip
          const claw = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.045, 4), clawMat);
          claw.position.set(Math.sin(angle) * 0.06, -0.14, Math.cos(angle) * 0.05);
          claw.rotation.x = Math.PI;
          hand.add(claw);
        }
        return hand;
      };
      const leftClaw = makePossumHand(-1);
      leftClaw.position.set(-torsoWidth * 0.58, torsoHeight * 0.08, torsoDepth * 0.15);
      leftClaw.rotation.z = -0.4;
      torso.add(leftClaw);
      const rightClaw = makePossumHand(1);
      rightClaw.position.set(torsoWidth * 0.58, torsoHeight * 0.08, torsoDepth * 0.15);
      rightClaw.rotation.z = 0.4;
      torso.add(rightClaw);

      // NAKED PINK RAT TAIL — UGLIER, LONGER, THICKER, NASTIER — THE POSSUM SPECIAL 🐀
      const tailSegs = 18;
      const possumTail = new THREE.Group();
      possumTail.name = "possum-tail";
      let tailR = torsoWidth * 0.075;
      let tailY = -torsoHeight * 0.28;
      let tailZ = -torsoDepth * 0.42;
      const wartMat = new THREE.MeshStandardMaterial({ color: 0xd47a9a, roughness: 0.65, name: "possum-tail-wart" });
      const soreMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.45, name: "possum-tail-sore" });
      for (let i = 0; i < tailSegs; i++) {
        const segLen = torsoHeight * 0.14;
        const nextR = tailR * 0.91;
        const seg = new THREE.Mesh(getCylinderGeometry(tailR, nextR, segLen, 6), pinkSkin);
        seg.rotation.x = Math.PI / 2 - 0.035 * i;
        seg.position.set(Math.sin(i * 0.45) * torsoWidth * 0.04, tailY, tailZ - segLen / 2);
        seg.castShadow = true;
        possumTail.add(seg);
        // Scaly ring bands — nasty & thick
        const ring = new THREE.Mesh(getCylinderGeometry(tailR * 1.18, tailR * 1.18, segLen * 0.22, 6), new THREE.MeshStandardMaterial({ color: 0xe4b4c8, roughness: 0.5, name: "possum-tail-ring" }));
        ring.rotation.x = Math.PI / 2 - 0.035 * i;
        ring.position.set(Math.sin(i * 0.45) * torsoWidth * 0.04, tailY, tailZ - segLen * 0.5);
        possumTail.add(ring);
        // UGLY WARTS — every few segments
        if (i % 3 === 1 && i > 2) {
          const wart = new THREE.Mesh(getSphereGeometry(tailR * 0.55, 5, 5), wartMat);
          wart.name = `possum-tail-wart-${i}`;
          wart.position.set(Math.sin(i * 0.45) * torsoWidth * 0.04 + tailR * 0.65, tailY, tailZ - segLen * 0.5);
          possumTail.add(wart);
        }
        // MANGE PATCHES / sores
        if (i % 4 === 2) {
          const sore = new THREE.Mesh(getSphereGeometry(tailR * 0.38, 5, 5), soreMat);
          sore.name = `possum-tail-sore-${i}`;
          sore.scale.set(1.4, 0.5, 1.0);
          sore.position.set(Math.sin(i * 0.45) * torsoWidth * 0.04 - tailR * 0.5, tailY, tailZ - segLen * 0.5);
          possumTail.add(sore);
        }
        tailZ -= segLen * 0.78;
        tailY -= segLen * 0.12;
        tailR = nextR;
      }
      possumTail.position.y = torsoHeight * -0.05;
      torso.add(possumTail);

      // Hunch that back — greasy trash goblin posture
      torso.scale.set(1.15, 0.88, 1.08);
      torso.rotation.x = 0.18;

      leftArm = null as any;
      rightArm = null as any;
    } else if (variant === "centipede") {
      const segs = 10;
      const trail = new THREE.Group();
      trail.name = "centipede-body";
      for (let i = 0; i < segs; i++) {
        const seg = new THREE.Mesh(getSphereGeometry(torsoWidth * 0.35, 10, 10), animalMat);
        seg.scale.set(1, 0.7, 1.1);
        seg.position.set(0, -torsoHeight * 0.1, -i * torsoDepth * 0.55);
        trail.add(seg);
        // pair of legs per segment
        [-1, 1].forEach((side) => {
          const leg = new THREE.Mesh(getCylinderGeometry(0.04, 0.03, limbLength * 0.5, 6), animalDark);
          leg.position.set(side * torsoWidth * 0.45, -torsoHeight * 0.35, -i * torsoDepth * 0.55);
          leg.rotation.z = side * 1.1;
          trail.add(leg);
        });
      }
      torso.add(trail);
      torso.scale.set(0.8, 0.7, 1.0);
    } else if (variant === "biped-lizard") {
      // TWO LEGS ONLY — no arms (as requested)
      leftLeg = isOrganic ? createSkinnedLimb(false, true) : createClassicLimb(false, true);
      leftLeg.name = "left-leg";
      leftLeg.position.set(-torsoWidth / 4, -torsoHeight / 2, 0);
      torso.add(leftLeg);
      rightLeg = isOrganic ? createSkinnedLimb(false, false) : createClassicLimb(false, false);
      rightLeg.name = "right-leg";
      rightLeg.position.set(torsoWidth / 4, -torsoHeight / 2, 0);
      torso.add(rightLeg);
      // Tiny T-rex-ish arm nubs (optional creepy)
      [-1, 1].forEach((side) => {
        const nub = new THREE.Mesh(getCylinderGeometry(0.06, 0.04, 0.25, 6), animalMat);
        nub.name = `biped-lizard-arm-nub-${side}`;
        nub.position.set(side * torsoWidth * 0.55, torsoHeight * 0.15, torsoDepth * 0.1);
        nub.rotation.z = side * 0.6;
        torso.add(nub);
      });
      // Long balance tail
      const tail = makeSegmentedLimb("biped-lizard-tail", 7, torsoWidth * 0.14, torsoHeight * 0.22, 0.05);
      tail.rotation.x = Math.PI / 2;
      tail.position.set(0, -torsoHeight * 0.15, -torsoDepth * 0.45);
      torso.add(tail);
    } else if (variant === "toad") {
      // Squat body, thick legs, short arms
      leftArm = makeSegmentedLimb("left-arm", 2, 0.14, limbLength * 0.35, 0.02);
      leftArm.position.set(-torsoWidth * 0.55, 0, torsoDepth * 0.2);
      leftArm.rotation.z = 0.8;
      torso.add(leftArm);
      rightArm = makeSegmentedLimb("right-arm", 2, 0.14, limbLength * 0.35, 0.02);
      rightArm.position.set(torsoWidth * 0.55, 0, torsoDepth * 0.2);
      rightArm.rotation.z = -0.8;
      torso.add(rightArm);
      leftLeg = makeSegmentedLimb("left-leg", 3, 0.18, limbLength * 0.4, 0.02);
      leftLeg.position.set(-torsoWidth * 0.35, -torsoHeight * 0.35, -torsoDepth * 0.1);
      torso.add(leftLeg);
      rightLeg = makeSegmentedLimb("right-leg", 3, 0.18, limbLength * 0.4, 0.02);
      rightLeg.position.set(torsoWidth * 0.35, -torsoHeight * 0.35, -torsoDepth * 0.1);
      torso.add(rightLeg);
      torso.scale.set(1.35, 0.65, 1.25);
    } else if (variant === "scorpion") {
      // EMPEROR SCORPION — BIG, MEAN, SHINY AND BRIGHT
      // Glossy obsidian carapace with molten gold accents — no fuzz, all shine
      const scorpChitin = new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.skinColor || "#0a0a0a"),
        roughness: 0.12,
        metalness: 0.45,
        name: "scorpion-chitin",
      });
      const scorpGold = new THREE.MeshStandardMaterial({
        color: 0xffae00,
        roughness: 0.15,
        metalness: 0.85,
        emissive: new THREE.Color(0xff6b00),
        emissiveIntensity: 0.55,
        name: "scorpion-gold",
      });
      const scorpVenom = new THREE.MeshStandardMaterial({
        color: 0xff0033,
        roughness: 0.08,
        metalness: 0.3,
        emissive: new THREE.Color(0xff0033),
        emissiveIntensity: 1.8,
        name: "scorpion-venom",
      });

      // 8 ARMORED LEGS — glossy, spiked, MEAN — BIGGER
      for (let i = 0; i < 8; i++) {
        const side = i < 4 ? -1 : 1;
        const slot = i % 4;
        const legGroup = new THREE.Group();
        legGroup.name = `scorpion-leg-${i}`;

        // Coxa — armored hip joint, bigger
        const coxaR = 0.075;
        const coxa = new THREE.Mesh(getCylinderGeometry(coxaR, coxaR * 0.88, 0.2, 8), scorpChitin);
        coxa.rotation.z = side * 0.5;
        coxa.castShadow = true;
        legGroup.add(coxa);
        // gold armor ring on coxa
        const coxaRing = new THREE.Mesh(getCylinderGeometry(coxaR * 1.15, coxaR * 1.15, 0.035, 8), scorpGold);
        coxaRing.rotation.z = side * 0.5;
        legGroup.add(coxaRing);

        // Femur — THICK armored upper leg
        const femurLen = 0.88;
        const femur = new THREE.Mesh(getCylinderGeometry(0.068, 0.05, femurLen, 8), scorpChitin);
        femur.position.set(side * 0.12, -0.4, 0);
        femur.rotation.z = side * 0.42;
        femur.castShadow = true;
        legGroup.add(femur);
        // Spikes along femur — mean
        for (let s = 0; s < 3; s++) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 5), scorpGold);
          spike.position.set(side * 0.045, -0.18 - s * 0.22, 0.038);
          spike.rotation.x = -Math.PI / 2;
          legGroup.add(spike);
        }

        // Tibia — BENT KNEE, armored, longer
        const tibiaLen = 0.78;
        const tibia = new THREE.Mesh(getCylinderGeometry(0.045, 0.03, tibiaLen, 6), scorpChitin);
        tibia.position.set(side * 0.26, -0.82, -0.02);
        tibia.rotation.z = side * -0.55;
        tibia.castShadow = true;
        legGroup.add(tibia);
        // Knee spike
        const kneeSpike = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.055, 5), scorpGold);
        kneeSpike.position.set(side * 0.22, -0.62, 0.03);
        kneeSpike.rotation.z = side * -0.55;
        legGroup.add(kneeSpike);

        // Tarsus — clawed foot, glossy
        const tarsusLen = 0.38;
        const tarsus = new THREE.Mesh(getCylinderGeometry(0.022, 0.014, tarsusLen, 5), scorpChitin);
        tarsus.position.set(side * 0.4, -1.22, 0.01);
        tarsus.rotation.z = side * -0.18;
        tarsus.castShadow = true;
        legGroup.add(tarsus);

        // GLOWING claw tip
        const clawTip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.075, 5), scorpVenom);
        clawTip.position.set(side * 0.41, -1.42, 0.015);
        clawTip.rotation.x = Math.PI;
        legGroup.add(clawTip);

        legGroup.position.set(side * torsoWidth * 0.55, -torsoHeight * 0.18, (slot - 1.5) * torsoDepth * 0.42);
        legGroup.rotation.z = side * 0.18;
        torso.add(legGroup);
      }

      // MASSIVE CRUSHING PINCERS — big, mean, shiny
      [-1, 1].forEach((side) => {
        const claw = new THREE.Group();
        claw.name = `scorpion-pincer-${side}`;

        // Pedipalp arm — THICK, armored, glossy
        const arm = new THREE.Mesh(getCylinderGeometry(0.14, 0.11, torsoWidth * 0.95, 8), scorpChitin);
        arm.rotation.z = side * Math.PI / 2;
        arm.castShadow = true;
        claw.add(arm);
        // Gold armor bands on arm
        for (let b = 0; b < 3; b++) {
          const band = new THREE.Mesh(getCylinderGeometry(0.145, 0.145, 0.03, 8), scorpGold);
          band.position.set(side * (0.15 + b * 0.22), 0, 0);
          band.rotation.z = Math.PI / 2;
          claw.add(band);
        }

        // MANUS — the big crushing claw base
        const manus = new THREE.Mesh(getSphereGeometry(0.18, 10, 10), scorpChitin);
        manus.name = `scorpion-manus-${side}`;
        manus.scale.set(1.4, 0.85, 1.1);
        manus.position.set(side * torsoWidth * 0.55, 0, torsoDepth * 0.38);
        manus.castShadow = true;
        claw.add(manus);

        // Fixed finger
        const fixedFinger = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.28, 5), scorpChitin);
        fixedFinger.position.set(side * torsoWidth * 0.55, 0, torsoDepth * 0.54);
        fixedFinger.rotation.x = Math.PI / 2;
        fixedFinger.castShadow = true;
        claw.add(fixedFinger);

        // Movable finger — BIGGER, with venom glow tip
        const moveFinger = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.26, 5), scorpChitin);
        moveFinger.position.set(side * (torsoWidth * 0.55 + 0.08), 0.06, torsoDepth * 0.52);
        moveFinger.rotation.set(Math.PI / 2, 0, side * -0.25);
        moveFinger.castShadow = true;
        claw.add(moveFinger);
        const pincerTip = new THREE.Mesh(getSphereGeometry(0.032, 8, 8), scorpVenom);
        pincerTip.position.set(side * (torsoWidth * 0.55 + 0.1), 0.08, torsoDepth * 0.64);
        claw.add(pincerTip);

        claw.position.set(side * torsoWidth * 0.55, torsoHeight * 0.12, torsoDepth * 0.28);
        claw.rotation.y = side * -0.15;
        torso.add(claw);
      });

      // CURVED TAIL — BIG, arched over the back, GLOWING STINGER
      const tailGroup = new THREE.Group();
      tailGroup.name = "scorpion-tail";
      let tailR = torsoWidth * 0.16;
      let tailZ = -torsoDepth * 0.42;
      let tailY = torsoHeight * 0.15;
      const tailSegs = 7;
      for (let i = 0; i < tailSegs; i++) {
        const segLen = torsoHeight * 0.26;
        const nextR = tailR * 0.84;
        const seg = new THREE.Mesh(getCylinderGeometry(tailR, nextR, segLen, 8), scorpChitin);
        seg.rotation.x = -Math.PI / 2 + 0.15 * i;
        seg.position.set(0, tailY, tailZ - segLen / 2);
        seg.castShadow = true;
        tailGroup.add(seg);
        // Gold armor ring per segment
        const ring = new THREE.Mesh(getCylinderGeometry(tailR * 1.08, tailR * 1.08, segLen * 0.14, 8), scorpGold);
        ring.rotation.x = -Math.PI / 2 + 0.15 * i;
        ring.position.set(0, tailY, tailZ - segLen * 0.5);
        tailGroup.add(ring);
        // Dorsal spine per segment
        const spine = new THREE.Mesh(new THREE.ConeGeometry(tailR * 0.28, tailR * 0.9, 5), scorpGold);
        spine.position.set(0, tailY + tailR * 0.85, tailZ - segLen * 0.5);
        spine.rotation.x = -0.15;
        tailGroup.add(spine);
        tailZ -= segLen * 0.82;
        tailY += segLen * (0.38 - i * 0.04); // arch over back
        tailR = nextR;
      }
      tailGroup.rotation.x = -0.3; // arch up and forward
      torso.add(tailGroup);

      // THE STINGER — BIG, GLOWING VENOM BARB
      const stingerBase = new THREE.Mesh(new THREE.ConeGeometry(tailR * 2.8, tailR * 3.5, 6), scorpVenom);
      stingerBase.name = "scorpion-stinger";
      stingerBase.position.set(0, tailY + tailR * 0.5, tailZ);
      stingerBase.rotation.x = Math.PI * 0.85;
      stingerBase.castShadow = true;
      tailGroup.add(stingerBase);
      // Venom glow core
      const venomCore = new THREE.Mesh(getSphereGeometry(tailR * 1.6, 10, 10), scorpVenom);
      venomCore.position.set(0, tailY + tailR * 0.5, tailZ);
      tailGroup.add(venomCore);
      // Dripping venom point
      const venomDrip = new THREE.Mesh(new THREE.ConeGeometry(tailR * 0.8, tailR * 1.8, 5), scorpVenom);
      venomDrip.position.set(0, tailY + tailR * 1.8, tailZ + tailR * 0.3);
      venomDrip.rotation.x = Math.PI;
      tailGroup.add(venomDrip);

      // Armored carapace plates along the back
      for (let p = 0; p < 5; p++) {
        const plate = new THREE.Mesh(getBoxGeometry(torsoWidth * (0.85 - p * 0.08), 0.045, torsoDepth * 0.22), scorpGold);
        plate.name = `scorpion-back-plate-${p}`;
        plate.position.set(0, torsoHeight * (0.32 - p * 0.12), -torsoDepth * (0.1 + p * 0.08));
        plate.rotation.x = 0.15 + p * 0.04;
        plate.castShadow = true;
        torso.add(plate);
      }

      // BIGGER — bulk up the whole scorpion
      torso.scale.set(1.55, 0.82, 1.55);
    } else if (variant === "mantis") {
      // PRAYING MANTIS - folded raptorial forelegs, elongated thorax/abdomen, wings
      const mantisChitin = new THREE.MeshStandardMaterial({ color: config.skinColor || "#65a34a", roughness: 0.55, name: "mantis-chitin" });
      const mantisDark = new THREE.MeshStandardMaterial({ color: 0x2d4a20, roughness: 0.5, name: "mantis-dark" });
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x7db55a, roughness: 0.6, transparent: true, opacity: 0.88, side: THREE.DoubleSide, name: "mantis-wing" });

      // Elongated pronotum / upper thorax plate
      const prothorax = new THREE.Mesh(getBoxGeometry(torsoWidth * 0.55, torsoHeight * 0.55, torsoDepth * 0.5), mantisChitin);
      prothorax.name = "mantis-prothorax";
      prothorax.position.set(0, torsoHeight * 0.35, torsoDepth * 0.05);
      prothorax.castShadow = true;
      torso.add(prothorax);

      // Raptorial forelegs - the iconic folded praying pose
      [-1, 1].forEach((side) => {
        const raptor = new THREE.Group();
        raptor.name = "mantis-raptor-" + (side > 0 ? "right" : "left");

        // Coxa - shoulder joint
        const coxa = new THREE.Mesh(getCylinderGeometry(0.11, 0.13, 0.22, 7), mantisChitin);
        coxa.rotation.z = side * 0.45;
        coxa.rotation.x = 0.3;
        raptor.add(coxa);

        // Femur - the thick spiked upper claw arm
        const femur = new THREE.Mesh(getBoxGeometry(0.12, 0.52, 0.14), mantisChitin);
        femur.position.set(0, -0.28, 0.06);
        femur.rotation.z = side * -0.15;
        femur.castShadow = true;
        raptor.add(femur);

        // Spiked teeth along the femur gripping edge
        for (let i = 0; i < 4; i++) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 4), mantisDark);
          spike.position.set(side * 0.01, -0.12 - i * 0.11, 0.1);
          spike.rotation.x = -Math.PI / 2.2;
          raptor.add(spike);
        }

        // Tibia - the folding blade / lower claw that snaps shut against the femur
        const tibia = new THREE.Mesh(getBoxGeometry(0.08, 0.44, 0.1), mantisDark);
        tibia.position.set(0, -0.58, 0.04);
        tibia.rotation.x = Math.PI * 0.75;
        tibia.castShadow = true;
        raptor.add(tibia);

        // Terminal claw / tarsus tip
        const clawTip = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.13, 5), mantisDark);
        clawTip.position.set(0, -0.82, 0.02);
        clawTip.rotation.x = Math.PI;
        raptor.add(clawTip);

        raptor.position.set(side * torsoWidth * 0.38, torsoHeight * 0.22, torsoDepth * 0.32);
        raptor.rotation.set(-0.25, side * 0.35, side * 0.15);
        torso.add(raptor);
      });

      // Walking legs - 4 rear legs, LONG & SPINY
      const walkLegPos: Array<[number, number, number]> = [
        [-1, 0.02, 0.08], [1, 0.02, 0.08],
        [-1, -0.28, -0.06], [1, -0.28, -0.06],
      ];
      walkLegPos.forEach(([side, yOff, zOff], i) => {
        const wleg = new THREE.Group();
        wleg.name = "mantis-walk-leg-" + i;

        // Coxa - short thick hip joint
        const coxa = new THREE.Mesh(getCylinderGeometry(0.05, 0.04, 0.18, 6), mantisChitin);
        coxa.rotation.z = side * 0.65;
        wleg.add(coxa);

        // Femur - LONG upper leg, thin
        const thighLen = 1.15;
        const thigh = new THREE.Mesh(getCylinderGeometry(0.042, 0.032, thighLen, 6), mantisChitin);
        thigh.position.set(side * 0.12, -thighLen * 0.5 - 0.06, -0.02);
        thigh.rotation.z = side * 0.28;
        thigh.castShadow = true;
        wleg.add(thigh);

        // Spines along femur
        for (let s = 0; s < 5; s++) {
          const spine = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.07, 4), mantisDark);
          spine.position.set(side * 0.035, -0.18 - s * 0.18, 0.032);
          spine.rotation.x = -Math.PI / 2.1;
          wleg.add(spine);
        }

        // Tibia - LONG lower leg, very thin
        const shinLen = 1.25;
        const shin = new THREE.Mesh(getCylinderGeometry(0.026, 0.018, shinLen, 5), mantisChitin);
        shin.position.set(side * 0.22, -thighLen - 0.45, -0.03);
        shin.rotation.z = side * -0.18;
        shin.castShadow = true;
        wleg.add(shin);

        // Spines along tibia
        for (let s = 0; s < 6; s++) {
          const spine = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.055, 4), mantisDark);
          spine.position.set(side * 0.018, -thighLen - 0.28 - s * 0.15, 0.022);
          spine.rotation.x = -Math.PI / 2.1;
          wleg.add(spine);
        }

        // Tarsus - long thin foot / claw tip
        const footLen = 0.38;
        const foot = new THREE.Mesh(getCylinderGeometry(0.014, 0.008, footLen, 4), mantisDark);
        foot.position.set(side * 0.28, -thighLen - shinLen - 0.38, 0.02);
        foot.rotation.z = side * -0.12;
        foot.castShadow = true;
        wleg.add(foot);

        // Tiny terminal claw
        const tarsalClaw = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.06, 4), mantisDark);
        tarsalClaw.position.set(side * 0.29, -thighLen - shinLen - footLen - 0.48, 0.03);
        tarsalClaw.rotation.x = Math.PI;
        wleg.add(tarsalClaw);

        wleg.position.set(side * torsoWidth * 0.32, torsoHeight * yOff, torsoDepth * zOff);
        torso.add(wleg);
      });

      // Elongated abdomen - tapered mantis tail
      const abdomenSegs = 4;
      for (let i = 0; i < abdomenSegs; i++) {
        const t = i / abdomenSegs;
        const w = torsoWidth * (0.48 - t * 0.28);
        const h = torsoHeight * (0.22 - t * 0.035);
        const seg = new THREE.Mesh(getBoxGeometry(w, h, torsoDepth * 0.58), mantisChitin);
        seg.name = "mantis-abdomen-" + i;
        seg.position.set(0, -torsoHeight * (0.18 + i * 0.22), -torsoDepth * (0.15 + i * 0.1));
        seg.castShadow = true;
        torso.add(seg);
      }

      // Leaf-like wings folded along the back
      [-0.5, 0.5].forEach((xOff, wi) => {
        const wing = new THREE.Mesh(getBoxGeometry(torsoWidth * 0.38, torsoHeight * 0.72, 0.022), wingMat);
        wing.name = "mantis-wing-" + wi;
        wing.position.set(xOff * torsoWidth * 0.28, torsoHeight * -0.05, -torsoDepth * 0.32);
        wing.rotation.y = xOff * 0.18;
        wing.rotation.z = xOff * 0.06;
        wing.castShadow = false;
        wing.receiveShadow = true;
        torso.add(wing);
        const vein = new THREE.Mesh(getBoxGeometry(0.018, torsoHeight * 0.62, 0.025), mantisDark);
        vein.position.set(xOff * torsoWidth * 0.28, torsoHeight * -0.05, -torsoDepth * 0.305);
        torso.add(vein);
      });

      leftArm = null as any;
      rightArm = null as any;
      leftLeg = null as any;
      rightLeg = null as any;

      torso.scale.set(0.92, 1.15, 0.92);
    }
  }

  // --- HAND-HELD & BELT ITEMS ---
  const rightHand = rightArm
    ? rightArm.getObjectByName(isOrganic ? "right-hand" : "hand") || rightArm.getObjectByName("right-hand")
    : null;

  if (accessories.includes("gun")) {
    const gunTarget = rightHand || rightArm || torso;
    if (gunTarget) {
    const gun = new THREE.Group();
    gun.name = "gun";
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.3, metalness: 0.8, name: "gun-metal" });
    const gunGlowMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.materialEmissive || "#00f0ff"),
      emissive: new THREE.Color(config.materialEmissive || "#00f0ff"),
      emissiveIntensity: 1.4,
      roughness: 0.2,
      name: "gun-glow",
    });

    const body = new THREE.Mesh(getBoxGeometry(0.12, 0.16, 0.32), gunMat);
    gun.add(body);

    const barrel = new THREE.Mesh(getCylinderGeometry(0.03, 0.03, 0.28, 8), gunMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, 0.28);
    gun.add(barrel);

    const grip = new THREE.Mesh(getBoxGeometry(0.09, 0.18, 0.1), gunMat);
    grip.position.set(0, -0.15, -0.08);
    grip.rotation.x = -0.25;
    gun.add(grip);

    const glowTip = new THREE.Mesh(getCylinderGeometry(0.035, 0.035, 0.03, 8), gunGlowMat);
    glowTip.rotation.x = Math.PI / 2;
    glowTip.position.set(0, 0.02, 0.42);
    gun.add(glowTip);

      gun.rotation.set(0, Math.PI / 2, 0);
      gunTarget.add(gun);
    }
  }

  if (accessories.includes("knife")) {
    const knifeTarget = rightHand || rightArm || torso;
    if (knifeTarget) {
    const knife = new THREE.Group();
    knife.name = "knife";
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.15, metalness: 0.9, name: "blade-steel" });
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7, name: "hilt-wood" });

    const bladeGeo = new THREE.ConeGeometry(0.05, 0.34, 4);
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.rotation.x = Math.PI;
    blade.position.set(0, 0.32, 0);
    knife.add(blade);

    const guard = new THREE.Mesh(getBoxGeometry(0.14, 0.03, 0.04), hiltMat);
    guard.position.set(0, 0.14, 0);
    knife.add(guard);

    const grip = new THREE.Mesh(getCylinderGeometry(0.025, 0.03, 0.16, 8), hiltMat);
    grip.position.set(0, 0.06, 0);
    knife.add(grip);

      knife.rotation.set(0, 0, Math.PI);
      knifeTarget.add(knife);
    }
  }

  if (accessories.includes("herb-pouch")) {
    const pouch = new THREE.Group();
    pouch.name = "herb-pouch";
    const pouchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85, name: "pouch-leather" });
    const herbMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.6, name: "herb-sprig" });

    const bagGeo = getBoxGeometry(torsoWidth * 0.3, torsoHeight * 0.24, torsoDepth * 0.28);
    const bag = new THREE.Mesh(bagGeo, pouchMat);
    bag.castShadow = true;
    pouch.add(bag);

    for (let i = 0; i < 3; i++) {
      const sprigGeo = new THREE.ConeGeometry(0.03, 0.14, 6);
      const sprig = new THREE.Mesh(sprigGeo, herbMat);
      sprig.position.set((i - 1) * 0.06, torsoHeight * 0.14, 0);
      sprig.rotation.z = (i - 1) * 0.3;
      pouch.add(sprig);
    }

    pouch.position.set(torsoWidth * 0.55, -torsoHeight * 0.15, torsoDepth * 0.3);
    torso.add(pouch);
  }

  // ==========================================
  // MANUAL BLENDER-STYLE PART TRANSFORMS
  // ==========================================
  if (torso) {
    torso.scale.x *= config.torsoScaleX !== undefined ? config.torsoScaleX : 1.0;
    torso.scale.y *= config.torsoScaleY !== undefined ? config.torsoScaleY : 1.0;
    torso.scale.z *= config.torsoScaleZ !== undefined ? config.torsoScaleZ : 1.0;
    torso.position.x += config.torsoTranslateX !== undefined ? config.torsoTranslateX : 0.0;
    torso.position.y += config.torsoTranslateY !== undefined ? config.torsoTranslateY : 0.0;
    torso.position.z += config.torsoTranslateZ !== undefined ? config.torsoTranslateZ : 0.0;
  }

  if (head) {
    head.scale.x *= config.headScaleX !== undefined ? config.headScaleX : 1.0;
    head.scale.y *= config.headScaleY !== undefined ? config.headScaleY : 1.0;
    head.scale.z *= config.headScaleZ !== undefined ? config.headScaleZ : 1.0;
    head.position.x += config.headTranslateX !== undefined ? config.headTranslateX : 0.0;
    head.position.y += config.headTranslateY !== undefined ? config.headTranslateY : 0.0;
    head.position.z += config.headTranslateZ !== undefined ? config.headTranslateZ : 0.0;

    // Rotation offsets
    head.rotation.x += config.headRotateX !== undefined ? config.headRotateX : 0.0;
    head.rotation.y += config.headRotateY !== undefined ? config.headRotateY : 0.0;
    head.rotation.z += config.headRotateZ !== undefined ? config.headRotateZ : 0.0;
  }

  const armScaleX = config.armScaleX !== undefined ? config.armScaleX : 1.0;
  const armScaleY = config.armScaleY !== undefined ? config.armScaleY : 1.0;
  const armScaleZ = config.armScaleZ !== undefined ? config.armScaleZ : 1.0;
  if (leftArm) leftArm.scale.set(armScaleX, armScaleY, armScaleZ);
  if (rightArm) rightArm.scale.set(armScaleX, armScaleY, armScaleZ);

  const legScaleX = config.legScaleX !== undefined ? config.legScaleX : 1.0;
  const legScaleY = config.legScaleY !== undefined ? config.legScaleY : 1.0;
  const legScaleZ = config.legScaleZ !== undefined ? config.legScaleZ : 1.0;
  if (leftLeg) leftLeg.scale.set(legScaleX, legScaleY, legScaleZ);
  if (rightLeg) rightLeg.scale.set(legScaleX, legScaleY, legScaleZ);

  // ==========================================
  // FINAL TRANSFORMS & COMPUTE BOUNDING BOXES
  // ==========================================
  group.scale.set(scaleXZ, scaleY, scaleXZ);
  group.position.y = 0;

  // COMPUTE BOUNDS: Recursively precompute bounding boxes/spheres on all meshes to prevent engine clipping
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.computeBoundingBox();
        child.geometry.computeBoundingSphere();
      }
    }
  });

  // ==========================================
  // COMPUTE KEY BOUNDING BOXES & PREVENT INTERSECTION AT EXTREME CONFIGURATIONS
  // ==========================================
  group.updateMatrixWorld(true);

  let skullMesh: THREE.Object3D | null = null;
  let hairGroupObj: THREE.Object3D | null = null;
  let noseMesh: THREE.Object3D | null = null;
  let earsObj: THREE.Object3D | null = null;
  let chinMesh: THREE.Object3D | null = null;

  group.traverse((child) => {
    if (child.name === "skull" || (child.name === "head" && child instanceof THREE.Mesh)) {
      skullMesh = child;
    } else if (child.name === "hairGroup") {
      hairGroupObj = child;
    } else if (child.name === "nose") {
      noseMesh = child;
    } else if (child.name === "ears") {
      earsObj = child;
    } else if (child.name === "chin") {
      chinMesh = child;
    }
  });

  const getCleanMeshWorldBox = (obj: THREE.Object3D): THREE.Box3 => {
    const box = new THREE.Box3();
    if (obj instanceof THREE.Mesh && obj.geometry) {
      if (!obj.geometry.boundingBox) {
        obj.geometry.computeBoundingBox();
      }
      box.copy(obj.geometry.boundingBox);
      box.applyMatrix4(obj.matrixWorld);
    } else {
      box.setFromObject(obj);
    }
    return box;
  };

  const skullBox = new THREE.Box3();
  const hairBox = new THREE.Box3();
  const noseBox = new THREE.Box3();
  const earsBox = new THREE.Box3();
  const chinBox = new THREE.Box3();

  const updateKeyBoxes = () => {
    group.updateMatrixWorld(true);
    if (skullMesh) skullBox.copy(getCleanMeshWorldBox(skullMesh));
    if (hairGroupObj) hairBox.copy(getCleanMeshWorldBox(hairGroupObj));
    if (noseMesh) noseBox.copy(getCleanMeshWorldBox(noseMesh));
    if (earsObj) earsBox.copy(getCleanMeshWorldBox(earsObj));
    if (chinMesh) chinBox.copy(getCleanMeshWorldBox(chinMesh));
  };

  updateKeyBoxes();

  // Intersection Prevention Logic (Collision Clamping for Extreme Configurations)
  let adjusted = false;

  // A. Ears vs Ears Collision (Happens if the head width scale X is tiny or squashed)
  if (earsObj) {
    const leftEarMesh = earsObj.getObjectByName("left-ear");
    const rightEarMesh = earsObj.getObjectByName("right-ear");
    if (leftEarMesh && rightEarMesh) {
      const leftEarBox = getCleanMeshWorldBox(leftEarMesh);
      const rightEarBox = getCleanMeshWorldBox(rightEarMesh);
      if (!leftEarBox.isEmpty() && !rightEarBox.isEmpty() && leftEarBox.intersectsBox(rightEarBox)) {
        const overlapX = leftEarBox.max.x - rightEarBox.min.x;
        if (overlapX > 0) {
          leftEarMesh.position.x -= (overlapX / 2) + 0.02 * headSize;
          rightEarMesh.position.x += (overlapX / 2) + 0.02 * headSize;
          adjusted = true;
        }
      }
    }
  }

  // B. Nose vs Skull Collision (Swallowed nose due to extreme skull width/depth squashing)
  if (noseMesh && skullMesh) {
    if (!noseBox.isEmpty() && !skullBox.isEmpty() && noseBox.max.z < skullBox.max.z + 0.01 * headSize) {
      const pushDistance = (skullBox.max.z - noseBox.max.z) + 0.03 * headSize;
      noseMesh.position.z += pushDistance;
      adjusted = true;
    }
  }

  // C. Chin vs Skull Collision (Swallowed chin due to extreme squashing or scaling)
  if (chinMesh && skullMesh) {
    if (!chinBox.isEmpty() && !skullBox.isEmpty() && chinBox.max.z < skullBox.max.z * 0.4) {
      chinMesh.position.z += 0.06 * headSize;
      chinMesh.position.y -= 0.03 * headSize;
      adjusted = true;
    }
  }

  // D. Hair vs Nose Collision (Fringe/hair swallowing the nose)
  if (hairGroupObj && noseMesh) {
    if (!hairBox.isEmpty() && !noseBox.isEmpty() && hairBox.intersectsBox(noseBox)) {
      hairGroupObj.position.y += 0.04 * headSize;
      hairGroupObj.position.z -= 0.03 * headSize;
      adjusted = true;
    }
  }

  // Re-update bounding boxes if adjustments were made
  if (adjusted) {
    updateKeyBoxes();
  }

  // Attach final precomputed key bounding boxes to userData for downstream verification / diagnostics
  group.userData.boundingBoxes = {
    skull: skullBox,
    hairGroup: hairBox,
    nose: noseBox,
    ears: earsBox,
    chin: chinBox
  };

  return group;
}
