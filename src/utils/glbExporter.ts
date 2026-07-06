import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

/**
 * Exports a Three.js Group/Mesh to a GLB (Binary glTF) file.
 * Returns a Promise that resolves to a Blob containing the binary data.
 */
export function exportToGLB(group: THREE.Group, characterName: string = "avatar"): Promise<Blob> {
  // --- EXPORT SANITY CHECKS ---
  if (!group || group.children.length === 0) {
    return Promise.reject(new Error("Export failed: The avatar group contains no children meshes."));
  }

  let meshCount = 0;
  let hasBrokenMaterial = false;
  let missingUVs = false;

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshCount++;
      if (!child.material) {
        hasBrokenMaterial = true;
      } else {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of materials) {
          if (!mat) {
            hasBrokenMaterial = true;
          }
          // Textured meshes must possess UV coordinates
          if (mat && (mat as any).map && child.geometry && !child.geometry.attributes.uv) {
            missingUVs = true;
          }
        }
      }
    }
  });

  if (meshCount === 0) {
    return Promise.reject(new Error("Export failed: No valid 3D meshes found inside the avatar hierarchy."));
  }
  if (hasBrokenMaterial) {
    return Promise.reject(new Error("Export failed: One or more meshes are missing valid material definitions."));
  }
  if (missingUVs) {
    return Promise.reject(new Error("Export failed: Textured meshes are missing UV coordinate attributes."));
  }
  // -----------------------------

  return new Promise((resolve, reject) => {
    // Create a temporary parent scene to export to avoid exporting root transforms incorrectly
    const tempScene = new THREE.Scene();
    
    // Add some ambient lighting so materials export with base color/roughness definitions correctly
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    tempScene.add(ambientLight);
    
    // Clone the avatar group so we do not modify the original rendering group
    const clonedGroup = group.clone();
    
    // Reset position for exporting (centered on ground at 0, 0, 0)
    clonedGroup.position.set(0, 0, 0);
    clonedGroup.rotation.set(0, 0, 0);
    tempScene.add(clonedGroup);

    const exporter = new GLTFExporter();
    
    exporter.parse(
      tempScene,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) {
          const blob = new Blob([gltf], { type: "model/gltf-binary" });
          resolve(blob);
        } else {
          // If returned as JSON (should not happen with binary: true)
          const output = JSON.stringify(gltf, null, 2);
          const blob = new Blob([output], { type: "model/gltf+json" });
          resolve(blob);
        }
      },
      (error) => {
        console.error("Error parsing glTF:", error);
        reject(error);
      },
      {
        binary: true,
        animations: [],
        includeCustomExtensions: false,
      }
    );
  });
}
