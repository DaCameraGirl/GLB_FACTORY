import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { AvatarConfig } from "../types";
import { validateExportedGLB, ExportValidationReport } from "./exportValidator";
import { bakeMeltedAtlas } from "./textureBaker";
import { LiveTextureAtlasController } from "./textureAtlas";

export interface ExportToGLBResult {
  blob: Blob;
  validation: ExportValidationReport;
}

function createStandardExportMaterial(
  sourceMaterial: THREE.Material | null | undefined,
  bakedTexture: THREE.Texture
) {
  const material = sourceMaterial as THREE.MeshStandardMaterial | null | undefined;
  const exportParams = sourceMaterial?.userData?.exportMaterialParams || {};
  return new THREE.MeshStandardMaterial({
    map: bakedTexture,
    color: 0xffffff,
    roughness: exportParams.roughness ?? material?.roughness ?? 0.75,
    metalness: exportParams.metalness ?? material?.metalness ?? 0.05,
    emissive: new THREE.Color(exportParams.emissive || "#000000"),
    emissiveIntensity: exportParams.emissiveIntensity ?? material?.emissiveIntensity ?? 0,
    transparent: false,
  });
}

function applyBakedAtlasToClone(
  originalGroup: THREE.Group,
  clonedGroup: THREE.Group,
  bakedTexture: THREE.Texture
) {
  const originalMeshes: THREE.Mesh[] = [];
  const clonedMeshes: THREE.Mesh[] = [];

  originalGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) originalMeshes.push(child);
  });
  clonedGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) clonedMeshes.push(child);
  });

  for (let i = 0; i < Math.min(originalMeshes.length, clonedMeshes.length); i++) {
    const originalMesh = originalMeshes[i];
    const cloneMesh = clonedMeshes[i];
    if (!originalMesh.userData.useBakedAtlas) continue;

    const materials = Array.isArray(cloneMesh.material) ? cloneMesh.material : [cloneMesh.material];
    const originalMaterials = Array.isArray(originalMesh.material) ? originalMesh.material : [originalMesh.material];
    const replacement = materials.map((_, materialIndex) =>
      createStandardExportMaterial(originalMaterials[materialIndex] || originalMaterials[0], bakedTexture)
    );
    cloneMesh.material = replacement.length === 1 ? replacement[0] : replacement;
  }
}

async function serializeSceneToBlob(tempScene: THREE.Scene) {
  return new Promise<Blob>((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      tempScene,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) {
          resolve(new Blob([gltf], { type: "model/gltf-binary" }));
        } else {
          resolve(new Blob([JSON.stringify(gltf, null, 2)], { type: "model/gltf+json" }));
        }
      },
      (error) => reject(error),
      {
        binary: true,
        animations: [],
        includeCustomExtensions: false,
      }
    );
  });
}

/**
 * Exports the current avatar to GLB, baking the live melt atlas first when available.
 */
export async function exportToGLB(
  group: THREE.Group,
  characterName: string = "avatar",
  config?: AvatarConfig
): Promise<ExportToGLBResult> {
  if (!group || group.children.length === 0) {
    throw new Error("Export failed: The avatar group contains no children meshes.");
  }

  let meshCount = 0;
  let hasBrokenMaterial = false;

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshCount++;
      if (!child.material) {
        hasBrokenMaterial = true;
      }
    }
  });

  if (meshCount === 0) {
    throw new Error("Export failed: No valid 3D meshes found inside the avatar hierarchy.");
  }
  if (hasBrokenMaterial) {
    throw new Error("Export failed: One or more meshes are missing valid material definitions.");
  }

  const atlasController = group.userData.atlasController as LiveTextureAtlasController | undefined;
  const shouldBakeAtlas = !!atlasController && !!config;
  const bakedResult = shouldBakeAtlas
    ? bakeMeltedAtlas(atlasController, config as AvatarConfig, performance.now() / 1000)
    : null;

  const tempScene = new THREE.Scene();
  tempScene.name = `${characterName}-export-scene`;
  tempScene.add(new THREE.AmbientLight(0xffffff, 1.0));

  const clonedGroup = group.clone(true);
  clonedGroup.position.set(0, 0, 0);
  clonedGroup.rotation.set(0, 0, 0);

  if (bakedResult) {
    applyBakedAtlasToClone(group, clonedGroup, bakedResult.texture);
  }

  tempScene.add(clonedGroup);

  const blob = await serializeSceneToBlob(tempScene);
  const arrayBuffer = await blob.arrayBuffer();
  const validation = await validateExportedGLB(arrayBuffer, bakedResult?.canvas || null);

  return {
    blob,
    validation,
  };
}
