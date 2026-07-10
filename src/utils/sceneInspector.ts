import * as THREE from "three";

export interface SceneInspectionStats {
  nodeCount: number;
  groupCount: number;
  meshes: number;
  skinnedMeshes: number;
  bones: number;
  materials: number;
  triangles: number;
  vertices: number;
  projectedMeshes: number;
  projectedRegions: string[];
  meltMaterials: number;
  atlasReady: boolean;
}

const EMPTY_STATS: SceneInspectionStats = {
  nodeCount: 0,
  groupCount: 0,
  meshes: 0,
  skinnedMeshes: 0,
  bones: 0,
  materials: 0,
  triangles: 0,
  vertices: 0,
  projectedMeshes: 0,
  projectedRegions: [],
  meltMaterials: 0,
  atlasReady: false,
};

export function inspectSceneGraph(root: THREE.Group | null): SceneInspectionStats {
  if (!root) {
    return EMPTY_STATS;
  }

  const materialIds = new Set<string>();
  const projectedRegions = new Set<string>();
  let nodeCount = 0;
  let groupCount = 0;
  let meshes = 0;
  let skinnedMeshes = 0;
  let bones = 0;
  let triangles = 0;
  let vertices = 0;
  let projectedMeshes = 0;
  let meltMaterials = 0;

  root.traverse((node) => {
    nodeCount += 1;

    if (node instanceof THREE.Group) {
      groupCount += 1;
    }

    if (node instanceof THREE.Bone) {
      bones += 1;
    }

    if (!(node instanceof THREE.Mesh)) {
      return;
    }

    meshes += 1;
    if (node instanceof THREE.SkinnedMesh) {
      skinnedMeshes += 1;
    }

    const geometry = node.geometry;
    const positionAttr = geometry?.getAttribute("position");
    if (positionAttr) {
      vertices += positionAttr.count;
    }

    if (geometry?.index) {
      triangles += geometry.index.count / 3;
    } else if (positionAttr) {
      triangles += positionAttr.count / 3;
    }

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    let meshProjected = false;

    materials.forEach((material) => {
      if (!material) return;
      materialIds.add(material.uuid);
      if (material.userData?.isMeltMaterial) {
        meltMaterials += 1;
      }
      const regionKey = material.userData?.atlasRegionKey;
      if (typeof regionKey === "string") {
        projectedRegions.add(regionKey);
        meshProjected = true;
      }
    });

    if (typeof node.userData?.atlasRegionKey === "string") {
      projectedRegions.add(node.userData.atlasRegionKey);
      meshProjected = true;
    }

    if (meshProjected) {
      projectedMeshes += 1;
    }
  });

  const projectedMeshList = Array.isArray(root.userData?.projectedMeshes) ? root.userData.projectedMeshes.length : 0;

  return {
    nodeCount,
    groupCount,
    meshes,
    skinnedMeshes,
    bones,
    materials: materialIds.size,
    triangles: Math.round(triangles),
    vertices: Math.round(vertices),
    projectedMeshes: Math.max(projectedMeshes, projectedMeshList),
    projectedRegions: Array.from(projectedRegions),
    meltMaterials,
    atlasReady: !!root.userData?.atlasController,
  };
}
