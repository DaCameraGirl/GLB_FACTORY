import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export interface ExportValidationReport {
  parses: boolean;
  texturedMeshesRetainUvs: boolean;
  bakedTextureExists: boolean;
  meshCount: number;
  materialCount: number;
  texturedMeshCount: number;
  issues: string[];
}

export async function validateExportedGLB(
  arrayBuffer: ArrayBuffer,
  bakedTextureCanvas: HTMLCanvasElement | null
): Promise<ExportValidationReport> {
  const loader = new GLTFLoader();

  return new Promise((resolve) => {
    loader.parse(
      arrayBuffer,
      "",
      (gltf) => {
        let meshCount = 0;
        let materialCount = 0;
        let texturedMeshCount = 0;
        let texturedMeshesRetainUvs = true;
        const materialSet = new Set<THREE.Material>();

        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshCount += 1;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material) => {
              if (material) materialSet.add(material);
              const typedMaterial = material as THREE.MeshStandardMaterial | null;
              if (typedMaterial?.map) {
                texturedMeshCount += 1;
                if (!child.geometry?.attributes?.uv) {
                  texturedMeshesRetainUvs = false;
                }
              }
            });
          }
        });

        materialCount = materialSet.size;

        const issues: string[] = [];
        if (!texturedMeshesRetainUvs) issues.push("One or more textured meshes lost UV coordinates.");
        if (!bakedTextureCanvas || bakedTextureCanvas.width === 0 || bakedTextureCanvas.height === 0) {
          issues.push("Baked texture canvas missing or empty.");
        }
        if (meshCount === 0) issues.push("No meshes were found in the exported GLB.");
        if (materialCount === 0) issues.push("No materials were found in the exported GLB.");

        resolve({
          parses: true,
          texturedMeshesRetainUvs,
          bakedTextureExists: !!bakedTextureCanvas && bakedTextureCanvas.width > 0 && bakedTextureCanvas.height > 0,
          meshCount,
          materialCount,
          texturedMeshCount,
          issues,
        });
      },
      (error) => {
        resolve({
          parses: false,
          texturedMeshesRetainUvs: false,
          bakedTextureExists: !!bakedTextureCanvas && bakedTextureCanvas.width > 0 && bakedTextureCanvas.height > 0,
          meshCount: 0,
          materialCount: 0,
          texturedMeshCount: 0,
          issues: [error instanceof Error ? error.message : "GLB parse failed during export validation."],
        });
      }
    );
  });
}
