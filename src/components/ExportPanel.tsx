import React from "react";
import { Download } from "lucide-react";

export interface ExportPanelProps {
  isSuccess: boolean;
  faceCanvas: HTMLCanvasElement | null;
  handleDownloadGLB: () => void;
  handleDownloadTexture: () => void;
}

export default function ExportPanel({
  isSuccess,
  faceCanvas,
  handleDownloadGLB,
  handleDownloadTexture,
}: ExportPanelProps) {
  return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="export-actions-panel">
                <button
                  type="button"
                  onClick={handleDownloadGLB}
                  disabled={!isSuccess}
                  className={`py-3 px-4 font-mono text-xs font-bold tracking-widest transition-all duration-300 flex items-center justify-center gap-2 select-none border-2 rounded-none uppercase ${
                    isSuccess
                      ? "bg-[#141414] text-[#E4E3E0] border-[#141414] hover:bg-black shadow-[3px_3px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#141414] cursor-pointer"
                      : "bg-[#D4D3D0] text-[#141414]/30 border-[#141414]/20 cursor-not-allowed shadow-none"
                  }`}
                  id="download-glb-button"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Final GLB</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTexture}
                  disabled={!faceCanvas}
                  className={`py-3 px-4 font-mono text-xs font-bold tracking-widest transition-all duration-300 flex items-center justify-center gap-2 select-none border-2 rounded-none uppercase ${
                    faceCanvas
                      ? "bg-transparent border-[#141414] text-[#141414] hover:bg-white shadow-[3px_3px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#141414] cursor-pointer"
                      : "bg-[#D4D3D0] text-[#141414]/30 border-[#141414]/20 cursor-not-allowed shadow-none"
                  }`}
                  id="download-texture-button"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Texture</span>
                </button>
              </div>
  );
}
