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
  if (!validHairStyles.includes(validated.hairStyle)) validated.hairStyle = "short";
  if (!validBodyTypes.includes(validated.bodyType)) validated.bodyType = "normal";

  const validCreatureVariants = ["none", "gremlin", "monster", "gator", "raccoon", "cat", "dog", "lizard", "possum", "tigerfish", "lionfish", "clown", "dragon", "fairy", "hammerhead"];
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
  // ==========================================
  
  // 1. Create procedural 3D face texture (with eyes, nose, mouth)
  const proceduralCanvas = document.createElement("canvas");
  proceduralCanvas.width = 256;
  proceduralCanvas.height = 256;
  const procCtx = proceduralCanvas.getContext("2d");
  
  if (procCtx) {
    // Draw solid skin-colored backing
    procCtx.fillStyle = config.skinColor;
    procCtx.fillRect(0, 0, 256, 256);

    // Draw baseline pixel art cute eyes
    procCtx.fillStyle = "#141414";
    procCtx.fillRect(60, 90, 32, 32);
    procCtx.fillRect(164, 90, 32, 32);

    // Eye highlights
    procCtx.fillStyle = "#ffffff";
    procCtx.fillRect(60, 90, 12, 12);
    procCtx.fillRect(164, 90, 12, 12);
    
    // Overlay expression shapes
    drawExpressionOverlay(procCtx, 256, 256, expressionVal);
  }
  
  const proceduralTexture = new THREE.CanvasTexture(proceduralCanvas);
  proceduralTexture.colorSpace = THREE.SRGBColorSpace;
  proceduralTexture.wrapS = THREE.ClampToEdgeWrapping;
  proceduralTexture.wrapT = THREE.ClampToEdgeWrapping;

  // 2. Create photo texture (if available)
  let photoTexture: THREE.Texture | null = null;
  
  if (faceTextureCanvas) {
    const photoCanvas = document.createElement("canvas");
    photoCanvas.width = 256;
    photoCanvas.height = 256;
    const photoCtx = photoCanvas.getContext("2d");
    
    if (photoCtx) {
      try {
        // Draw the photo
        photoCtx.drawImage(faceTextureCanvas, 0, 0, 256, 256);
        
        // Apply radial gradient mask for smooth edge blending
        const gradient = photoCtx.createRadialGradient(128, 128, 80, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.85, 'rgba(0,0,0,0.3)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
        
        photoCtx.globalCompositeOperation = 'destination-out';
        photoCtx.fillStyle = gradient;
        photoCtx.fillRect(0, 0, 256, 256);
        photoCtx.globalCompositeOperation = 'source-over';
        
        // Blend edges with skin color
        photoCtx.globalCompositeOperation = 'destination-over';
        photoCtx.fillStyle = config.skinColor;
        photoCtx.fillRect(0, 0, 256, 256);
        photoCtx.globalCompositeOperation = 'source-over';
        
        photoTexture = new THREE.CanvasTexture(photoCanvas);
        photoTexture.colorSpace = THREE.SRGBColorSpace;
        photoTexture.wrapS = THREE.ClampToEdgeWrapping;
        photoTexture.wrapT = THREE.ClampToEdgeWrapping;
      } catch (err) {
        console.warn("Could not draw faceTextureCanvas:", err);
      }
    }
  }

  // 3. Create morphing shader material
  const morphProgress = config.photoMorphProgress !== undefined ? config.photoMorphProgress : (photoTexture ? 1.0 : 0.0);
  
  if (photoTexture) {
    // Custom shader material for smooth morph transition
    faceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        proceduralMap: { value: proceduralTexture },
        photoMap: { value: photoTexture },
        morphProgress: { value: morphProgress },
        roughness: { value: config.materialRoughness !== undefined ? config.materialRoughness : 0.75 },
        metalness: { value: config.materialMetalness !== undefined ? config.materialMetalness : 0.05 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D proceduralMap;
        uniform sampler2D photoMap;
        uniform float morphProgress;
        uniform float roughness;
        uniform float metalness;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          // Sample both textures
          vec4 proceduralColor = texture2D(proceduralMap, vUv);
          vec4 photoColor = texture2D(photoMap, vUv);
          
          // Smooth morph between them
          vec4 finalColor = mix(proceduralColor, photoColor, morphProgress);
          
          // Basic lighting (simplified PBR)
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          
          // Ambient
          vec3 ambient = finalColor.rgb * 0.3;
          
          // Diffuse (simple directional light)
          vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
          float diff = max(dot(normal, lightDir), 0.0);
          vec3 diffuse = finalColor.rgb * diff * 0.7;
          
          gl_FragColor = vec4(ambient + diffuse, finalColor.a);
        }
      `,
      lights: false,
    });
    
    // Store morph progress for animation updates
    (faceMaterial as any).userData = { morphProgress };
  } else {
    // No photo - use standard material with procedural texture
    faceMaterial = new THREE.MeshStandardMaterial({
      map: proceduralTexture,
      ...getMatParams(0.75, 0.05),
      name: "face"
    });
  }

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

  // 1. Nose
  // Hide the nose completely when a photo is uploaded to avoid clashing with the real nose
  const hasPhotoTexture = faceTextureCanvas !== null;
  
  if (!hasPhotoTexture) {
    const noseGeo = isOrganicHead
      ? getSphereGeometry(0.032 * headSize, radialSeg, radialSeg)
      : getBoxGeometry(0.12 * headSize, 0.12 * headSize, 0.12 * headSize);
    const nose = new THREE.Mesh(noseGeo, skinMaterial);
    nose.name = "nose";
    nose.position.set(0, -0.05 * headSize, isOrganicHead ? skullRadiusVal * 0.86 : skullRadiusVal);
    nose.scale.set(noseWidthScale, noseScale, noseScale);
    nose.castShadow = true;
    head.add(nose);
  }

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

  // 3. Chin
  const chinGeo = isOrganicHead
    ? getSphereGeometry(0.11 * headSize, radialSeg, radialSeg)
    : getBoxGeometry(0.24 * headSize, 0.12 * headSize, 0.18 * headSize);
  const chin = new THREE.Mesh(chinGeo, skinMaterial);
  chin.name = "chin";
  chin.position.set(0, -skullRadiusVal * 0.8, skullRadiusVal * 0.35);
  chin.scale.set(1.0, chinScale.y, chinScale.z);
  chin.castShadow = true;
  head.add(chin);

  // --- CREATURE VARIANT: EXTRA DISTINGUISHING HEAD DETAIL ---
  if (config.creatureVariant === "monster") {
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

  if (config.creatureVariant === "gremlin") {
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

  if (config.creatureVariant === "raccoon") {
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
    // A long jaw tapering to a point, with big bright teeth, is what actually reads as
    // "alligator" instead of a round green blob with a wide flat bill.
    // The lower jaw hangs off a named hinge pivot so ThreeCanvas can animate it open/shut.
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

    // Upper teeth: fixed to the skull, hanging down along the jaw's underside
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

    // Lower teeth: attached to the moving jaw pivot, pointing up
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

    // Long tail flowing out behind the body, not hanging straight down under it
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
      gatorTailY -= segLength * 0.06; // gentle downward droop as it extends
      gatorTailRadius = nextRadius;
    }
    torso.add(gatorTailGroup);
  }

  if (config.creatureVariant === "tigerfish" || config.creatureVariant === "lionfish") {
    // Bulging fish eyes on the sides of the head, not human eyes on the front
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

    // Small round pouty fish mouth instead of a human mouth
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.5, name: "fish-mouth" });
    const mouth = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.1, 10, 10), mouthMat);
    mouth.name = "fish-mouth";
    mouth.scale.set(1.3, 0.55, 0.6);
    mouth.position.set(0, -actualHeadSize * 0.24, actualHeadSize * 0.42);
    head.add(mouth);

    // Gill slits
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

    // Banded stripes wrapping the torso: orange/black for Tiger Fish, red/white for Lionfish
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
      // Long venomous spike rays fanning out from the shoulders and head
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

    // Floppy ears: droopy teardrop shapes, not the pointy cat-ears
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
    // A flat wedge-shaped snout reads as reptilian; a round nub reads as a pig
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

    // Frill ridge spikes down the back of the head
    const frillMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#4d7c0f", roughness: 0.6, name: "lizard-frill" });
    for (let i = 0; i < 3; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.05, actualHeadSize * 0.16, 4), frillMat);
      spike.name = `lizard-frill-${i}`;
      spike.position.set(0, actualHeadSize * 0.42, -actualHeadSize * (0.05 + i * 0.14));
      head.add(spike);
    }
  }

  if (config.creatureVariant === "possum") {
    const snoutMat = new THREE.MeshStandardMaterial({ color: 0xf5d0c5, roughness: 0.6, name: "possum-snout" });
    const snout = new THREE.Mesh(getCylinderGeometry(actualHeadSize * 0.08, actualHeadSize * 0.15, actualHeadSize * 0.3, radialSeg), snoutMat);
    snout.name = "possum-snout";
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -actualHeadSize * 0.06, actualHeadSize * 0.46);
    snout.castShadow = true;
    head.add(snout);

    const noseMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.3, name: "possum-nose" });
    const nose = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.05, 8, 8), noseMat);
    nose.name = "possum-nose";
    nose.position.set(0, -actualHeadSize * 0.06, actualHeadSize * 0.6);
    head.add(nose);

    const earMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.6, name: "possum-ear" });
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.14, 10, 10), earMat);
      ear.name = `possum-ear-${side}`;
      ear.scale.set(1.0, 1.0, 0.3);
      ear.position.set(side * actualHeadSize * 0.4, actualHeadSize * 0.3, -actualHeadSize * 0.05);
      head.add(ear);
    });
  }

  if (config.creatureVariant === "clown") {
    // Big red ball nose
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25, emissive: new THREE.Color(0x7f1d1d), emissiveIntensity: 0.3, name: "clown-nose" });
    const nose = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.13, 12, 12), noseMat);
    nose.name = "clown-nose";
    nose.position.set(0, -actualHeadSize * 0.02, actualHeadSize * 0.46);
    nose.castShadow = true;
    head.add(nose);

    // Wide unsettling painted grin, stretched ear to ear, with sharp teeth peeking through
    const grinMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.4, name: "clown-grin" });
    const grin = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.6, actualHeadSize * 0.08, actualHeadSize * 0.06), grinMat);
    grin.name = "clown-grin";
    grin.position.set(0, -actualHeadSize * 0.28, actualHeadSize * 0.42);
    grin.rotation.z = 0;
    head.add(grin);

    // Upturned grin corners for a manic look
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

    // Dark sunken eye makeup, diamond-shaped
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
    const embersMat = new THREE.MeshStandardMaterial({
      color: 0xff6b00,
      emissive: new THREE.Color(0xff4500),
      emissiveIntensity: 1.6,
      roughness: 0.3,
      name: "dragon-embers",
    });

    // Curved back-swept horns
    const hornGeo = new THREE.ConeGeometry(actualHeadSize * 0.07, actualHeadSize * 0.4, 6);
    [-1, 1].forEach((side) => {
      const horn = new THREE.Mesh(hornGeo, hornMat);
      horn.name = `dragon-horn-${side}`;
      horn.position.set(side * actualHeadSize * 0.22, actualHeadSize * 0.42, -actualHeadSize * 0.05);
      horn.rotation.set(-Math.PI * 0.18, 0, side * Math.PI * 0.12);
      horn.castShadow = true;
      head.add(horn);
    });

    // Elongated reptilian snout
    const snout = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.22, actualHeadSize * 0.55, 6), scaleMat);
    snout.name = "dragon-snout";
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -actualHeadSize * 0.05, actualHeadSize * 0.62);
    snout.castShadow = true;
    head.add(snout);

    // Glowing ember nostril/mouth hint
    [-1, 1].forEach((side) => {
      const ember = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.035, 8, 8), embersMat);
      ember.name = `dragon-ember-${side}`;
      ember.position.set(side * actualHeadSize * 0.06, -actualHeadSize * 0.06, actualHeadSize * 0.88);
      head.add(ember);
    });

    // Fangs
    const fangGeo = new THREE.ConeGeometry(actualHeadSize * 0.045, actualHeadSize * 0.16, 6);
    const fangMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.2, name: "dragon-fang" });
    [-1, 1].forEach((side) => {
      const fang = new THREE.Mesh(fangGeo, fangMat);
      fang.name = `dragon-fang-${side}`;
      fang.rotation.x = Math.PI;
      fang.position.set(side * actualHeadSize * 0.12, -actualHeadSize * 0.16, actualHeadSize * 0.7);
      head.add(fang);
    });

    // Glowing eyes
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

    // Spine spikes down the back
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

    // Large leathery wings, built into the creature (not the generic wings accessory)
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

    // Long spiked tail
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
    // Tail spade at the very tip
    const tailSpade = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.12, actualHeadSize * 0.22, 4), hornMat);
    tailSpade.position.set(0, dTailY, dTailZ);
    tailSpade.rotation.x = Math.PI / 2;
    dragonTailGroup.add(tailSpade);
    torso.add(dragonTailGroup);
  }

  if (config.creatureVariant === "fairy") {
    const wickedMat = new THREE.MeshStandardMaterial({ color: 0x1e1030, roughness: 0.4, name: "fairy-wicked" });
    const skinTintMat = new THREE.MeshStandardMaterial({ color: config.skinColor || "#c4b5fd", roughness: 0.5, name: "fairy-skin" });

    // Tall pointed ears
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.08, actualHeadSize * 0.3, 6), skinTintMat);
      ear.name = `fairy-ear-${side}`;
      ear.position.set(side * actualHeadSize * 0.42, actualHeadSize * 0.18, -actualHeadSize * 0.02);
      ear.rotation.set(0, 0, side * Math.PI * 0.18);
      ear.castShadow = true;
      head.add(ear);
    });

    // Thorn crown
    const thornCount = 7;
    for (let i = 0; i < thornCount; i++) {
      const angle = (i / thornCount) * Math.PI * 2;
      const thorn = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.025, actualHeadSize * 0.13, 5), wickedMat);
      thorn.name = `fairy-thorn-${i}`;
      thorn.position.set(Math.cos(angle) * actualHeadSize * 0.36, actualHeadSize * 0.44, Math.sin(angle) * actualHeadSize * 0.36);
      thorn.rotation.set(Math.cos(angle) * 0.4, 0, Math.sin(angle) * -0.4);
      head.add(thorn);
    }

    // Glowing malicious eyes
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

    // Wicked thin grin with tiny fangs
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

    // Small tattered translucent wings, built into the creature
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

    // The wide flat hammer bar is what actually reads as "hammerhead" - without it
    // this is just a generic shark, so it gets real width, not a subtle bump.
    const hammerBar = new THREE.Mesh(getBoxGeometry(actualHeadSize * 1.5, actualHeadSize * 0.16, actualHeadSize * 0.32), sharkSkinMat);
    hammerBar.name = "hammerhead-bar";
    hammerBar.position.set(0, actualHeadSize * 0.08, actualHeadSize * 0.28);
    hammerBar.castShadow = true;
    head.add(hammerBar);

    // Eyes at the very ends of the hammer, not on the front of the face
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0c0a09, roughness: 0.2, name: "hammerhead-eye" });
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(getSphereGeometry(actualHeadSize * 0.055, 8, 8), eyeMat);
      eye.name = `hammerhead-eye-${side}`;
      eye.position.set(side * actualHeadSize * 0.72, actualHeadSize * 0.08, actualHeadSize * 0.4);
      head.add(eye);
    });

    // Tapered snout leading off the front of the bar
    const snout = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.24, actualHeadSize * 0.4, 6), sharkSkinMat);
    snout.name = "hammerhead-snout";
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, actualHeadSize * 0.02, actualHeadSize * 0.56);
    snout.castShadow = true;
    head.add(snout);

    // Gill slits
    const gillMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.6, name: "hammerhead-gill" });
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 3; i++) {
        const gill = new THREE.Mesh(getBoxGeometry(actualHeadSize * 0.02, actualHeadSize * 0.12, actualHeadSize * 0.03), gillMat);
        gill.name = `hammerhead-gill-${side}-${i}`;
        gill.position.set(side * actualHeadSize * 0.34, -actualHeadSize * 0.05, actualHeadSize * (0.1 + i * 0.08));
        head.add(gill);
      }
    });

    // Dorsal fin
    const dorsalFin = new THREE.Mesh(new THREE.ConeGeometry(actualHeadSize * 0.3, actualHeadSize * 0.65, 3), sharkSkinMat);
    dorsalFin.name = "hammerhead-dorsal-fin";
    dorsalFin.position.set(0, torsoHeight * 0.55, -torsoDepth * 0.35);
    dorsalFin.rotation.set(Math.PI * 0.05, Math.PI / 6, 0);
    dorsalFin.castShadow = true;
    torso.add(dorsalFin);

    // Tail fin
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
        // Big rounded puff, flattened slightly front-to-back and shifted up/back so it
        // frames the face instead of swallowing it.
        const afroScaleMultiplier = config.headShape === "organic-smooth" ? 1.45 : 1.55;
        const hairGeo = getSphereGeometry(skullRadius * afroScaleMultiplier, radialSeg, radialSeg);
        const hair = new THREE.Mesh(hairGeo, hairMaterial);
        hair.name = "hair-afro";
        hair.scale.set(1.0, 1.0, 0.82);
        hair.position.set(0, skullRadius * 0.32, -skullRadius * 0.22);
        hair.castShadow = true;
        hairGroup.add(hair);

      } else if (config.hairStyle === "ponytail") {
        const capGeo = getSphereGeometry(skullRadius * 1.05, radialSeg, radialSeg);
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
        const capDomeGeo = getSphereGeometry(skullRadius * 1.07, radialSeg, radialSeg);
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
        const hairGeo = getBoxGeometry(actualHeadSize * 1.55, actualHeadSize * 1.5, actualHeadSize * 1.3);
        const hair = new THREE.Mesh(hairGeo, hairMaterial);
        hair.name = "hair-block-afro";
        hair.position.set(0, actualHeadSize * 0.35, -actualHeadSize * 0.15);
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
  if (accessories.includes("snout")) {
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
    let prevRadius = torsoWidth * 0.18;
    let anchor = new THREE.Vector3(0, -torsoHeight * 0.3, -torsoDepth * 0.45);
    for (let i = 0; i < segments; i++) {
      const segLength = torsoHeight * 0.22;
      const radius = prevRadius * 0.82;
      const segGeo = getCylinderGeometry(prevRadius, radius, segLength, 8);
      const seg = new THREE.Mesh(segGeo, tailMat);
      seg.position.set(anchor.x, anchor.y - segLength * 0.5, anchor.z - i * 0.02);
      seg.rotation.x = Math.PI / 2 + i * 0.12;
      seg.castShadow = true;
      tail.add(seg);
      anchor = anchor.clone().setY(anchor.y - segLength);
      prevRadius = radius;
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

  // --- HAND-HELD & BELT ITEMS ---
  const rightHand = rightArm.getObjectByName(isOrganic ? "right-hand" : "hand");

  if (accessories.includes("gun")) {
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
    (rightHand || rightArm).add(gun);
  }

  if (accessories.includes("knife")) {
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
    (rightHand || rightArm).add(knife);
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
