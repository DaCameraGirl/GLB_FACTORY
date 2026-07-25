import { useCallback, RefObject } from "react";
import * as THREE from "three";
import { LogEntry } from "../types";
import { exportToGLB } from "../utils/glbExporter";

/**
 * GLB / texture download helpers.
 * Exports are poseable mesh hierarchies with PBR materials — not skinned AnimationClip rigs.
 */
export function useAvatarExport(
  avatarGroupRef: RefObject<THREE.Group | null>,
  faceCanvas: HTMLCanvasElement | null,
  characterName: string,
  addLog: (text: string, type?: LogEntry["type"]) => void
) {
  const handleDownloadGLB = useCallback(async () => {
    if (!avatarGroupRef.current) {
      addLog("No active 3D avatar model found to export.", "error");
      return;
    }

    try {
      addLog(`Packaging model and exporting GLB...`, "info");
      const blob = await exportToGLB(avatarGroupRef.current, characterName);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(characterName || "specimen").toLowerCase().replace(/\s+/g, "_")}.glb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addLog(
        `GLB exported and downloaded as ${(characterName || "specimen").toLowerCase().replace(/\s+/g, "_")}.glb!`,
        "success"
      );
    } catch (err: any) {
      addLog(`Export failed: ${err.message}`, "error");
    }
  }, [avatarGroupRef, characterName, addLog]);

  const handleDownloadTexture = useCallback(() => {
    if (!faceCanvas) {
      addLog("No computed face texture available.", "error");
      return;
    }

    try {
      const link = document.createElement("a");
      link.download = `${(characterName || "specimen").toLowerCase()}_face_texture.png`;
      link.href = faceCanvas.toDataURL("image/png");
      link.click();
      addLog("Face texture downloaded as PNG.", "success");
    } catch (err: any) {
      addLog(`Texture download failed: ${err.message}`, "error");
    }
  }, [faceCanvas, characterName, addLog]);

  return { handleDownloadGLB, handleDownloadTexture };
}
