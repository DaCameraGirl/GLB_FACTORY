import * as THREE from "three";
import { AvatarConfig, HairStyle, BodyType, HeadShape } from "../types";

// ==========================================
// GEOMETRY REUSE CACHE
// ==========================================
const geometryCache = new Map<string, THREE.BufferGeometry>();

function getSphereGeometry(radius: number, widthSeg: number, heightSeg: number, ...args: any[]): THREE.SphereGeometry {
  const key = `sphere_${radius}_${widthSeg}_${heightSeg}_${args.join("_")}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.SphereGeometry(radius, widthSeg, heightSeg, ...args));
  }
  return geometryCache.get(key) as THREE.SphereGeometry;
}

function getCylinderGeometry(radiusTop: number, radiusBottom: number, height: number, radSeg: number, ...args: any[]): THREE.CylinderGeometry {
  const key = `cylinder_${radiusTop}_${radiusBottom}_${height}_${radSeg}_${args.join("_")}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radSeg, ...args));
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

// Helper to calculate segments for detail levels (LOD)
function seg(detail: "low" | "medium" | "high" = "medium") {
  if (detail === "low") return 12;
  if (detail === "high") return 32;
  return 20;
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
  if (!validHairStyles.includes(validated.hairStyle)) validated.hairStyle = "short";
  if (!validBodyTypes.includes(validated.bodyType)) validated.bodyType = "normal";

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

    // Open O mouth
    ctx.fillStyle = "#141414";
    ctx.beginPath();
    ctx.arc(cx, cy + height * 0.14, width * 0.07, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // Neutral soft straight lips
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.12, cy + height * 0.16);
    ctx.lineTo(cx + width * 0.12, cy + height * 0.16);
    ctx.stroke();
  }
}

// Front projection UVs for seamless head wrapping
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

    const blend = Math.max(0, Math.min(1, (nz - 0.05) / 0.15));

    const uProj = 0.5 + nx * 0.48;
    const vProj = 0.44 + ny * 0.48;

    const u = uProj * blend + 0.01 * (1 - blend);
    const v = vProj * blend + 0.01 * (1 - blend);

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

  // Draw face onto a high-quality Canvas
  const expressionCanvas = document.createElement("canvas");
  expressionCanvas.width = 256;
  expressionCanvas.height = 256;
  const ctx = expressionCanvas.getContext("2d");

  if (ctx) {
    if (faceTextureCanvas) {
      // Draw uploaded/analyzed portrait first
      ctx.drawImage(faceTextureCanvas, 0, 0, 256, 256);
    } else {
      // Draw generic solid skin-colored backing
      ctx.fillStyle = config.skinColor;
      ctx.fillRect(0, 0, 256, 256);

      // Draw baseline pixel art cute eyes
      ctx.fillStyle = "#141414";
      ctx.fillRect(60, 90, 32, 32);
      ctx.fillRect(164, 90, 32, 32);

      // Eye highlights
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(60, 90, 12, 12);
      ctx.fillRect(164, 90, 12, 12);
    }

    // Overlay expression shapes on top
    drawExpressionOverlay(ctx, 256, 256, expressionVal);
  }

  const faceTexture = new THREE.CanvasTexture(expressionCanvas);
  faceTexture.colorSpace = THREE.SRGBColorSpace;
  faceTexture.wrapS = THREE.ClampToEdgeWrapping;
  faceTexture.wrapT = THREE.ClampToEdgeWrapping;

  faceMaterial = new THREE.MeshStandardMaterial({
    map: faceTexture,
    ...getMatParams(0.75, 0.05),
    name: "face"
  });

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
    const chestTopGeo = getSphereGeometry(torsoWidth / 2, radialSeg, 16);
    const chestTop = new THREE.Mesh(chestTopGeo, clothingMaterial);
    chestTop.name = "chest-top";
    chestTop.position.y = torsoHeight / 2;
    chestTop.scale.set(1, 0.4, torsoDepth / torsoWidth);
    torso.add(chestTop);

    // Rounded bottom cap
    const pelvisGeo = getSphereGeometry(torsoWidth / 2.3, radialSeg, 16);
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
    skull.scale.set(1.0, 1.15, 1.05);
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
    skull.scale.set(1.04, 0.96, 1.0);
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
  // 3. HAIR STYLE (WITH COLLISION CLAMP INORGANICS)
  // ==========================================
  const hairGroup = new THREE.Group();
  hairGroup.name = "hairGroup";
  head.add(hairGroup);

  if (config.hairStyle !== "none") {
    if (config.headShape === "organic-smooth" || config.headShape === "rounded-cube") {
      const skullRadius = actualHeadSize * (config.headShape === "rounded-cube" ? 0.52 : 0.48);

      if (config.hairStyle === "short") {
        const hairGeo = getSphereGeometry(skullRadius * 1.05, radialSeg, radialSeg);
        const hair = new THREE.Mesh(hairGeo, hairMaterial);
        hair.name = "hair-short";
        hair.rotation.x = -Math.PI * 0.06;
        hair.castShadow = true;
        hairGroup.add(hair);

      } else if (config.hairStyle === "long") {
        const hairGeo = getSphereGeometry(skullRadius * 1.06, radialSeg, radialSeg);
        const hair = new THREE.Mesh(hairGeo, hairMaterial);
        hair.name = "hair-long";
        hair.scale.set(1.02, 1.35, 1.08);
        hair.position.set(0, -skullRadius * 0.25, -skullRadius * 0.05);
        hair.castShadow = true;
        hairGroup.add(hair);

      } else if (config.hairStyle === "afro") {
        // COLLISION CLAMP: organic-smooth caps afro scale to prevent swallowing face
        const afroScaleMultiplier = config.headShape === "organic-smooth" ? 1.12 : 1.25;
        const hairGeo = getSphereGeometry(skullRadius * afroScaleMultiplier, radialSeg, radialSeg);
        const hair = new THREE.Mesh(hairGeo, hairMaterial);
        hair.name = "hair-afro";
        hair.position.set(0, skullRadius * 0.24, -skullRadius * 0.05);
        hair.castShadow = true;
        hairGroup.add(hair);

      } else if (config.hairStyle === "ponytail") {
        const capGeo = getSphereGeometry(skullRadius * 1.05, radialSeg, 16);
        const cap = new THREE.Mesh(capGeo, hairMaterial);
        cap.name = "hair-ponytail-cap";
        cap.rotation.x = -Math.PI * 0.06;
        cap.castShadow = true;
        hairGroup.add(cap);

        const tailGeo = getCylinderGeometry(0.08, 0.16, actualHeadSize * 0.8, radialSeg);
        const tail = new THREE.Mesh(tailGeo, hairMaterial);
        tail.name = "hair-ponytail-tail";
        tail.position.set(0, -actualHeadSize * 0.25, -skullRadius * 1.15);
        tail.rotation.x = Math.PI * 0.12;
        tail.castShadow = true;
        hairGroup.add(tail);

      } else if (config.hairStyle === "cap") {
        const capDomeGeo = getSphereGeometry(skullRadius * 1.07, radialSeg, 16);
        const capDome = new THREE.Mesh(capDomeGeo, clothingMaterial);
        capDome.name = "cap-dome";
        capDome.position.y = 0.02;
        capDome.castShadow = true;
        hairGroup.add(capDome);

        const capBillGeo = getBoxGeometry(actualHeadSize * 0.75, 0.03, actualHeadSize * 0.45);
        const capBill = new THREE.Mesh(capBillGeo, clothingMaterial);
        capBill.name = "cap-bill";
        capBill.position.set(0, actualHeadSize * 0.14, skullRadius * 1.1);
        capBill.rotation.x = Math.PI * 0.05;
        capBill.castShadow = true;
        hairGroup.add(capBill);
      }
    } else {
      // Boxy voxel hairstyles
      if (config.hairStyle === "short") {
        const hairGeo = getBoxGeometry(actualHeadSize + 0.04, actualHeadSize * 0.55, actualHeadSize + 0.04);
        const hair = new THREE.Mesh(hairGeo, hairMaterial);
        hair.name = "hair-block-short";
        hair.position.set(0, actualHeadSize * 0.25, -actualHeadSize * 0.05);
        hair.castShadow = true;
        hairGroup.add(hair);

      } else if (config.hairStyle === "long") {
        const hairGeo = getBoxGeometry(actualHeadSize + 0.04, actualHeadSize * 1.1, actualHeadSize + 0.04);
        const hair = new THREE.Mesh(hairGeo, hairMaterial);
        hair.name = "hair-block-long";
        hair.position.set(0, -actualHeadSize * 0.05, -actualHeadSize * 0.05);
        hair.castShadow = true;
        hairGroup.add(hair);

      } else if (config.hairStyle === "afro") {
        const hairGeo = getBoxGeometry(actualHeadSize * 1.25, actualHeadSize * 1.2, actualHeadSize * 1.15);
        const hair = new THREE.Mesh(hairGeo, hairMaterial);
        hair.name = "hair-block-afro";
        hair.position.set(0, actualHeadSize * 0.2, -actualHeadSize * 0.05);
        hair.castShadow = true;
        hairGroup.add(hair);

      } else if (config.hairStyle === "ponytail") {
        const capGeo = getBoxGeometry(actualHeadSize + 0.04, actualHeadSize * 0.55, actualHeadSize + 0.04);
        const cap = new THREE.Mesh(capGeo, hairMaterial);
        cap.name = "hair-block-ponytail-cap";
        cap.position.set(0, actualHeadSize * 0.25, -actualHeadSize * 0.05);
        cap.castShadow = true;
        hairGroup.add(cap);

        const tailGeo = getBoxGeometry(0.2, 0.55, 0.2);
        const tail = new THREE.Mesh(tailGeo, hairMaterial);
        tail.name = "hair-block-ponytail-tail";
        tail.position.set(0, -0.15, -actualHeadSize / 2 - 0.15);
        tail.rotation.x = Math.PI / 12;
        tail.castShadow = true;
        hairGroup.add(tail);

      } else if (config.hairStyle === "cap") {
        const capBaseGeo = getBoxGeometry(actualHeadSize + 0.06, 0.3, actualHeadSize + 0.06);
        const capBase = new THREE.Mesh(capBaseGeo, clothingMaterial);
        capBase.name = "cap-block-base";
        capBase.position.y = actualHeadSize / 2 + 0.08;
        capBase.castShadow = true;
        hairGroup.add(capBase);

        const capBillGeo = getBoxGeometry(actualHeadSize - 0.08, 0.04, 0.44);
        const capBill = new THREE.Mesh(capBillGeo, clothingMaterial);
        capBill.name = "cap-block-bill";
        capBill.position.set(0, actualHeadSize / 2 - 0.02, actualHeadSize / 2 + 0.16);
        capBill.castShadow = true;
        hairGroup.add(capBill);
      }
    }
  }

  // ==========================================
  // 4. ACCESSORY SOCKETS & meshes
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
      ? getCylinderGeometry(size, size, 0.03, 16) 
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
    const cupGeo = getCylinderGeometry(0.18, 0.18, 0.08, 16);
    
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

    const limbGeo = getCylinderGeometry(jointRadius, jointRadius * 0.72, limbLength, radialSeg, 16).clone();
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

  // Build and mount limbs
  const isOrganic = config.headShape === "organic-smooth";

  const leftArm = isOrganic ? createSkinnedLimb(true, true) : createClassicLimb(true, true);
  leftArm.name = "left-arm";
  leftArm.position.set(-torsoWidth / 2 - limbWidth / 2 - 0.05, torsoHeight / 2 - 0.1, 0);
  torso.add(leftArm);

  const rightArm = isOrganic ? createSkinnedLimb(true, false) : createClassicLimb(true, false);
  rightArm.name = "right-arm";
  rightArm.position.set(torsoWidth / 2 + limbWidth / 2 + 0.05, torsoHeight / 2 - 0.1, 0);
  torso.add(rightArm);

  const leftLeg = isOrganic ? createSkinnedLimb(false, true) : createClassicLimb(false, true);
  leftLeg.name = "left-leg";
  leftLeg.position.set(-torsoWidth / 4, -torsoHeight / 2, 0);
  torso.add(leftLeg);

  const rightLeg = isOrganic ? createSkinnedLimb(false, false) : createClassicLimb(false, false);
  rightLeg.name = "right-leg";
  rightLeg.position.set(torsoWidth / 4, -torsoHeight / 2, 0);
  torso.add(rightLeg);

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

  return group;
}
