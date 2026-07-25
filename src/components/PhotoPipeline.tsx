import React from "react";
import { Upload, Sparkles, RefreshCw, User, Sliders } from "lucide-react";
import { AvatarConfig } from "../types";

export interface PhotoPipelineProps {
  characterName: string;
  setCharacterName: (name: string) => void;
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  sourceImage: string | null;
  faceBox: [number, number, number, number] | null;
  setFaceBox: React.Dispatch<React.SetStateAction<[number, number, number, number] | null>>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  isDraggingFile: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBuildAvatar: () => void;
  isProcessing: boolean;
  updateFaceTexture: () => void;
  faceCanvas: HTMLCanvasElement | null;
}

export default function PhotoPipeline({
  characterName,
  setCharacterName,
  config,
  setConfig,
  sourceImage,
  faceBox,
  setFaceBox,
  imageRef,
  isDraggingFile,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileChange,
  handleBuildAvatar,
  isProcessing,
  updateFaceTexture,
  faceCanvas,
}: PhotoPipelineProps) {
  return (
    <>
            <section className="bg-white/40 border-2 border-[#141414] rounded-none p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]" id="upload-panel">
              <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-[#D4D3D0]">
                <h2 className="font-serif text-[11px] italic text-[#141414]/80 uppercase font-bold tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>01 // Character Identity & Portrait</span>
                </h2>
              </div>

              {/* Character Name Input */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">CHARACTER NAME</label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => {
                    setCharacterName(e.target.value);
                    setConfig((prev) => ({ ...prev, name: e.target.value }));
                  }}
                  className="w-full bg-white/70 border-2 border-[#141414] px-3 py-2 rounded-none text-xs text-[#141414] focus:outline-none focus:bg-white font-mono tracking-wide shadow-[2px_2px_0px_0px_#141414]"
                  placeholder="Enter name (e.g., Chase)"
                />
              </div>

              {/* Portrait Upload Box */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">SOURCE PORTRAIT</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative overflow-hidden rounded-none shadow-[2px_2px_0px_0px_#141414] ${
                    isDraggingFile
                      ? "border-[#141414] bg-[#141414]/5"
                      : "border-[#141414]/60 hover:border-[#141414] bg-white/40 hover:bg-white/60"
                  }`}
                  id="drag-drop-zone"
                >
                  <input
                    type="file"
                    id="portrait-file-input"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  />

                  {sourceImage ? (
                    <div className="relative w-full aspect-square max-w-[180px] border-4 border-double border-[#141414] overflow-hidden group animate-melt shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)] bg-gradient-to-br from-[#D946EF]/20 via-transparent to-[#F59E0B]/20 p-2 flex items-center justify-center">
                      <div className="w-full h-full overflow-hidden animate-melt border border-[#141414] relative bg-white/60">
                        <img
                          ref={imageRef}
                          src={sourceImage}
                          alt="Portrait source"
                          className="w-full h-full object-cover"
                          onLoad={() => {
                            // Automatically set a full-bounding box if none is set
                            if (!faceBox) {
                              setFaceBox([10, 10, 90, 90]);
                            } else {
                              updateFaceTexture();
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-white/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 z-10">
                          <span className="text-[10px] bg-[#141414] text-white font-mono px-2 py-1 rounded-none uppercase font-bold tracking-wider">
                            Replace Photo
                          </span>
                        </div>

                        {/* Display Face Bounding Box Overlay if available */}
                        {faceBox && (
                          <div
                            className="absolute border-2 border-dashed border-[#141414] pointer-events-none z-10"
                            style={{
                              top: `${faceBox[0]}%`,
                              left: `${faceBox[1]}%`,
                              width: `${faceBox[3] - faceBox[1]}%`,
                              height: `${faceBox[2] - faceBox[0]}%`,
                            }}
                            id="detected-face-box-overlay"
                          >
                            <span className="absolute -top-5 left-0 bg-[#141414] text-white text-[9px] font-mono font-bold px-1 rounded-none uppercase">
                              FACE_BOX
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-none bg-[#D4D3D0] border border-[#141414] flex items-center justify-center mx-auto text-[#141414]">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#141414] uppercase tracking-wide">Drag & drop portrait photo</p>
                        <p className="text-[10px] text-[#141414]/60 font-mono mt-1 uppercase">or click to browse local filesystem</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Big Core Trigger Button */}
              <button
                type="button"
                onClick={handleBuildAvatar}
                disabled={isProcessing || !sourceImage}
                className={`w-full py-3 px-4 font-mono text-xs tracking-wider font-bold transition-all duration-300 flex items-center justify-center gap-2 uppercase select-none rounded-none border-2 border-[#141414] ${
                  !sourceImage
                    ? "bg-[#D4D3D0] text-[#141414]/30 cursor-not-allowed border-[#141414]/40 shadow-none"
                    : isProcessing
                    ? "bg-[#D4D3D0] text-[#141414]/60 cursor-wait shadow-none animate-pulse"
                    : "bg-[#141414] text-[#E4E3E0] hover:bg-black hover:translate-x-[2px] hover:translate-y-[2px] shadow-[3px_3px_0px_0px_#141414] hover:shadow-[1px_1px_0px_0px_#141414] cursor-pointer"
                }`}
                id="build-avatar-button"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Portrait...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Build 3D Avatar</span>
                  </>
                )}
              </button>
            </section>

            {/* INTERACTIVE CROP & BLENDING (If image loaded) */}
            {sourceImage && faceBox && (
              <section className="bg-white/40 border-2 border-[#141414] rounded-none p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]" id="crop-tuning-panel">
                <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-[#D4D3D0] flex items-center justify-between">
                  <h2 className="font-serif text-[11px] italic text-[#141414]/80 uppercase font-bold tracking-wider flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>02 // Fine-Tune Face Texture</span>
                  </h2>
                  <button
                    onClick={() => {
                      setConfig((p) => ({ ...p, cropX: 0, cropY: 0, cropScale: 1.0, featherRadius: 85 }));
                    }}
                    className="text-[9px] text-[#141414] font-bold font-mono uppercase bg-white/60 border border-[#141414] px-1.5 py-0.5 rounded-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white hover:translate-y-[1px] transition-all duration-200"
                  >
                    Reset
                  </button>
                </div>

                {/* Feather toggle */}
                <div className="flex items-center justify-between py-1 bg-white/50 px-3 rounded-none border border-[#141414] shadow-[1px_1px_0px_0px_#141414]">
                  <div className="space-y-0.5">
                    <span className="text-xs text-[#141414] font-bold font-mono uppercase text-[10px]">Feather Edges</span>
                    <p className="text-[10px] text-[#141414]/60">Smoothly blend photo border into skin</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.featherEdges}
                    onChange={(e) => setConfig((prev) => ({ ...prev, featherEdges: e.target.checked }))}
                    className="w-4 h-4 accent-[#141414] cursor-pointer"
                  />
                </div>

                {config.featherEdges && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                        <span>FEATHER RADIUS</span>
                        <span>{config.featherRadius}%</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="100"
                        value={config.featherRadius}
                        onChange={(e) => setConfig((prev) => ({ ...prev, featherRadius: parseInt(e.target.value) }))}
                        className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                        <span>PHOTO MORPH</span>
                        <span>{Math.round((config.photoMorphProgress !== undefined ? config.photoMorphProgress : 1.0) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(config.photoMorphProgress !== undefined ? config.photoMorphProgress : 1.0) * 100}
                        onChange={(e) => setConfig((prev) => ({ ...prev, photoMorphProgress: parseInt(e.target.value) / 100 }))}
                        className="w-full accent-[#D946EF] h-1.5 cursor-pointer bg-[#141414]/10"
                      />
                      <p className="text-[9px] text-[#141414]/60 font-mono">
                        0% = Full 3D features • 100% = Full photo texture
                      </p>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                      <span>CROP SCALE</span>
                      <span>{config.cropScale.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="2.0"
                      step="0.05"
                      value={config.cropScale}
                      onChange={(e) => setConfig((prev) => ({ ...prev, cropScale: parseFloat(e.target.value) }))}
                      className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                      <span>SHIFT HORIZ.</span>
                      <span>{config.cropX > 0 ? `+${config.cropX}` : config.cropX}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={config.cropX}
                      onChange={(e) => setConfig((prev) => ({ ...prev, cropX: parseInt(e.target.value) }))}
                      className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                    <span>SHIFT VERT.</span>
                    <span>{config.cropY > 0 ? `+${config.cropY}` : config.cropY}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={config.cropY}
                    onChange={(e) => setConfig((prev) => ({ ...prev, cropY: parseInt(e.target.value) }))}
                    className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                  />
                </div>

                {/* Face Texture Preview Thumbnail */}
                {faceCanvas && (
                  <div className="flex items-center gap-4 p-2.5 rounded-none bg-white/50 border border-[#141414] shadow-[1px_1px_0px_0px_#141414]">
                    <div className="w-12 h-12 rounded-none overflow-hidden bg-slate-950 border border-[#141414] shrink-0">
                      <img
                        src={faceCanvas.toDataURL()}
                        alt="Processed face"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-[#141414] font-mono uppercase text-[10px] block">Blended Head Texture</span>
                      <span className="text-[9px] text-[#141414]/60 font-mono">256x256 PNG map (front face)</span>
                    </div>
                  </div>
                )}
              </section>
            )}
    </>
  );
}
