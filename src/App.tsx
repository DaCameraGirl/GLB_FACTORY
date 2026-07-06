import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Download,
  Sparkles,
  RefreshCw,
  Sliders,
  User,
  Palette,
  Layers,
  Settings,
  ArrowRight,
  RotateCcw,
  Undo2,
  CheckCircle,
} from "lucide-react";
import { AvatarConfig, DetectionResult, LogEntry, HairStyle, BodyType, HeadShape } from "./types";
import ThreeCanvas from "./components/ThreeCanvas";
import StudioLogs from "./components/StudioLogs";
import { prepareFaceTexture } from "./utils/texturePreparer";
import { exportToGLB } from "./utils/glbExporter";
import * as THREE from "three";

export default function App() {
  // 1. App State
  const [characterName, setCharacterName] = useState("Chase");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Pipeline steps status
  const [currentStep, setCurrentStep] = useState<"upload" | "texture" | "mesh" | "glb" | "ready">("upload");

  // Avatar Configuration
  const [config, setConfig] = useState<AvatarConfig>({
    name: "Chase",
    skinColor: "#e5a65d",
    hairColor: "#211510",
    clothingColor: "#1e3a8a",
    pantsColor: "#111827",
    shoesColor: "#ffffff",
    hairStyle: "short",
    bodyType: "normal",
    headShape: "organic-smooth",
    featherEdges: true,
    featherRadius: 85,
    cropX: 0,
    cropY: 0,
    cropScale: 1.0,
  });

  // Bounding box returned from Gemini
  const [faceBox, setFaceBox] = useState<[number, number, number, number] | null>(null);

  // Computed face texture canvas
  const [faceCanvas, setFaceCanvas] = useState<HTMLCanvasElement | null>(null);

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "init",
      timestamp: new Date().toLocaleTimeString(),
      text: "Studio initialized and ready.",
      type: "info",
    },
  ]);

  // Visual parameters
  const [autoRotate, setAutoRotate] = useState(true);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Refs for Image element and exported group
  const imageRef = useRef<HTMLImageElement | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);

  // 2. Logging helper
  const addLog = (text: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        text,
        type,
      },
    ]);
  };

  // 3. Texture computation
  const updateFaceTexture = () => {
    if (!imageRef.current || !faceBox) {
      setFaceCanvas(null);
      return;
    }

    try {
      const canvas = prepareFaceTexture(
        imageRef.current,
        faceBox,
        config.skinColor,
        config.featherEdges,
        config.featherRadius,
        config.cropX,
        config.cropY,
        config.cropScale
      );
      setFaceCanvas(canvas);
    } catch (err: any) {
      console.error("Error creating face texture:", err);
      addLog(`Error preparing texture: ${err.message}`, "error");
    }
  };

  // Re-run texture builder if dependencies change
  useEffect(() => {
    if (sourceImage && faceBox) {
      updateFaceTexture();
    }
  }, [
    config.skinColor,
    config.featherEdges,
    config.featherRadius,
    config.cropX,
    config.cropY,
    config.cropScale,
    faceBox,
    sourceImage,
  ]);

  // 4. File upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      addLog("Unsupported file type. Please upload a JPG or PNG image.", "error");
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
      // Reset crops and box
      setFaceBox(null);
      setFaceCanvas(null);
      setIsSuccess(false);
      setCurrentStep("texture");
      addLog(`Loaded image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, "success");
      addLog("Ready to build. Click 'BUILD AVATAR' to let Gemini auto-detect the face features.", "info");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Helper for static/client-side fallback face and color analysis
  const analyzeColorsClientSide = (img: HTMLImageElement): { skin_tone: string; hair_color: string; clothing_color: string; gender_style: HairStyle } => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return { skin_tone: "#e5a65d", hair_color: "#211510", clothing_color: "#1e3a8a", gender_style: "short" };
      }
      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);

      const rgbToHex = (r: number, g: number, b: number) => {
        return "#" + [r, g, b].map(x => {
          const hex = Math.max(0, Math.min(255, x)).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        }).join("");
      };

      // Sample Skin: Center of the image (50, 50)
      const skinPixel = ctx.getImageData(50, 50, 1, 1).data;
      const skin_tone = rgbToHex(skinPixel[0], skinPixel[1], skinPixel[2]);

      // Sample Hair: Upper part of the image (50, 20)
      const hairPixel = ctx.getImageData(50, 20, 1, 1).data;
      const hair_color = rgbToHex(hairPixel[0], hairPixel[1], hairPixel[2]);

      // Sample Clothing: Bottom part of the image (50, 85)
      const clothingPixel = ctx.getImageData(50, 85, 1, 1).data;
      const clothing_color = rgbToHex(clothingPixel[0], clothingPixel[1], clothingPixel[2]);

      return {
        skin_tone,
        hair_color,
        clothing_color,
        gender_style: "short",
      };
    } catch (e) {
      console.warn("Could not read image pixels client-side, defaulting to standard colors.", e);
      return {
        skin_tone: "#e5a65d",
        hair_color: "#211510",
        clothing_color: "#1e3a8a",
        gender_style: "short",
      };
    }
  };

  // 5. Trigger Face Detection API using server-side Gemini 3.5 Flash
  const handleBuildAvatar = async () => {
    if (!sourceImage) {
      addLog("Please upload a photo first.", "warning");
      return;
    }

    setIsProcessing(true);
    setIsSuccess(false);
    setCurrentStep("texture");
    addLog(`Running face-detection and feature extraction on ${characterName}...`, "info");

    try {
      const response = await fetch("/api/crop-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: sourceImage,
          mimeType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to process image");
      }

      const result: DetectionResult = await response.json();

      if (!result.face_box || result.face_box.length !== 4) {
        throw new Error("Invalid face bounding box returned from Gemini.");
      }

      addLog("Face bounding box detected successfully.", "success");
      addLog(`Extracted features - Skin: ${result.skin_tone}, Hair: ${result.hair_color}, Clothes: ${result.clothing_color}`, "info");

      // Apply detected values
      setFaceBox(result.face_box);
      setConfig((prev) => ({
        ...prev,
        skinColor: result.skin_tone || prev.skinColor,
        hairColor: result.hair_color || prev.hairColor,
        clothingColor: result.clothing_color || prev.clothingColor,
        hairStyle: (result.gender_style as HairStyle) || prev.hairStyle,
        cropX: 0,
        cropY: 0,
        cropScale: 1.0,
      }));

      setCurrentStep("mesh");
      addLog("Constructing 3D avatar meshes...", "info");

      // Small artificial delay to show transition animation beautifully
      setTimeout(() => {
        setCurrentStep("glb");
        setIsSuccess(true);
        setIsProcessing(false);
        addLog(`Avatar mesh created and rendered. Ready to export!`, "success");
      }, 1000);
    } catch (err: any) {
      addLog(`Backend analysis unavailable (${err.message}).`, "warning");
      addLog("Switching to offline Client-Side Face Analysis Fallback...", "info");

      try {
        if (!imageRef.current) {
          throw new Error("Source image element not loaded.");
        }

        // Run client-side color pixel analysis
        const result = analyzeColorsClientSide(imageRef.current);

        addLog("Local color sampler analysis complete!", "success");
        addLog(`Extracted local features - Skin: ${result.skin_tone}, Hair: ${result.hair_color}, Clothes: ${result.clothing_color}`, "info");

        // Default crop box (centered)
        const localBox: [number, number, number, number] = [20, 20, 80, 80];
        setFaceBox(localBox);
        setConfig((prev) => ({
          ...prev,
          skinColor: result.skin_tone,
          hairColor: result.hair_color,
          clothingColor: result.clothing_color,
          hairStyle: result.gender_style,
          cropX: 0,
          cropY: 0,
          cropScale: 1.0,
        }));

        setCurrentStep("mesh");
        addLog("Constructing 3D avatar meshes...", "info");

        setTimeout(() => {
          setCurrentStep("glb");
          setIsSuccess(true);
          setIsProcessing(false);
          addLog(`Avatar mesh created and rendered via local fallback. Ready to export!`, "success");
        }, 1000);
      } catch (localErr: any) {
        setIsProcessing(false);
        addLog(`Local analysis failed: ${localErr.message}`, "error");
      }
    }
  };

  // 6. Download GLB
  const handleDownloadGLB = async () => {
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
      link.download = `${characterName.toLowerCase().replace(/\s+/g, "_")}.glb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addLog(`GLB exported and downloaded as ${characterName.toLowerCase().replace(/\s+/g, "_")}.glb!`, "success");
    } catch (err: any) {
      addLog(`Export failed: ${err.message}`, "error");
    }
  };

  // 7. Download Texture
  const handleDownloadTexture = () => {
    if (!faceCanvas) {
      addLog("No computed face texture available.", "error");
      return;
    }

    try {
      const url = faceCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${characterName.toLowerCase()}_face_texture.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addLog("Face texture downloaded as PNG.", "success");
    } catch (err: any) {
      addLog(`Texture download failed: ${err.message}`, "error");
    }
  };

  // Reset configuration to defaults
  const handleResetDefaults = () => {
    setConfig({
      name: "Chase",
      skinColor: "#e5a65d",
      hairColor: "#211510",
      clothingColor: "#1e3a8a",
      pantsColor: "#111827",
      shoesColor: "#ffffff",
      hairStyle: "short",
      bodyType: "normal",
      headShape: "organic-smooth",
      featherEdges: true,
      featherRadius: 85,
      cropX: 0,
      cropY: 0,
      cropScale: 1.0,
    });
    addLog("Customizer configurations reset to defaults.", "info");
  };

  return (
    <div className="min-h-screen border-[12px] md:border-[16px] border-[#141414] bg-[#E4E3E0] text-[#141414] flex flex-col font-sans selection:bg-[#141414] selection:text-[#E4E3E0]" id="app-root-container">
      {/* HEADER BAR */}
      <header className="flex flex-col sm:flex-row shrink-0 items-center justify-between border-b-2 border-[#141414] bg-[#141414] px-6 py-3 text-[#E4E3E0] sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-none bg-[#E4E3E0] flex items-center justify-center text-[#141414] font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-mono text-sm font-bold tracking-widest uppercase flex items-center gap-2 text-white">
              Photo-to-GLB-Auto
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
            </h1>
            <p className="font-mono text-[9px] opacity-70">v1.0.0-RELEASE // {typeof window !== "undefined" ? window.location.hostname.toUpperCase() : "LOCALHOST"}</p>
          </div>
        </div>

        {/* Quick Stats/Indicators */}
        <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-tighter text-white">
          <div className="flex gap-3">
            <span>CPU: 42%</span>
            <span>MEM: 1.2GB</span>
            <span>GPU: THREE.JS</span>
          </div>
          <div className="border-l border-[#E4E3E0]/20 pl-4 opacity-75">
            ENGINE // GEMINI_3.5_FLASH
          </div>
        </div>
      </header>

      {/* CORE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* PIPELINE STUDIO STATUS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#D4D3D0] border-2 border-[#141414] p-2 rounded-none text-center text-xs font-mono select-none" id="pipeline-status-bar">
          <div
            className={`py-2 px-3 rounded-none flex items-center justify-center gap-2 transition-all duration-300 border ${
              sourceImage
                ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                : "bg-transparent text-[#141414]/40 border-transparent"
            }`}
          >
            <span className="w-5 h-5 rounded-none border border-current flex items-center justify-center text-[10px] font-bold">01</span>
            <span className="font-bold tracking-wider">PORTRAIT</span>
          </div>
          <div
            className={`py-2 px-3 rounded-none flex items-center justify-center gap-2 transition-all duration-300 border ${
              currentStep === "texture" || currentStep === "mesh" || currentStep === "glb" || currentStep === "ready"
                ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                : "bg-transparent text-[#141414]/40 border-transparent"
            }`}
          >
            <span className="w-5 h-5 rounded-none border border-current flex items-center justify-center text-[10px] font-bold">02</span>
            <span className="font-bold tracking-wider">FACE_TEX</span>
          </div>
          <div
            className={`py-2 px-3 rounded-none flex items-center justify-center gap-2 transition-all duration-300 border ${
              currentStep === "mesh" || currentStep === "glb" || currentStep === "ready"
                ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                : "bg-transparent text-[#141414]/40 border-transparent"
            }`}
          >
            <span className="w-5 h-5 rounded-none border border-current flex items-center justify-center text-[10px] font-bold">03</span>
            <span className="font-bold tracking-wider">AVATAR_MSH</span>
          </div>
          <div
            className={`py-2 px-3 rounded-none flex items-center justify-center gap-2 transition-all duration-300 border ${
              currentStep === "glb" || currentStep === "ready"
                ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                : "bg-transparent text-[#141414]/40 border-transparent"
            }`}
          >
            <span className="w-5 h-5 rounded-none border border-current flex items-center justify-center text-[10px] font-bold">04</span>
            <span className="font-bold tracking-wider">EXPORT</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT PANEL: CONFIGURATION AND INPUTS (LG: 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* CHARACTER IDENTITY & PHOTO UPLOAD */}
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
                    <div className="relative w-full aspect-square max-w-[180px] rounded-none border border-[#141414] overflow-hidden group">
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
                      <div className="absolute inset-0 bg-white/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <span className="text-[10px] bg-[#141414] text-white font-mono px-2 py-1 rounded-none uppercase font-bold tracking-wider">
                          Replace Photo
                        </span>
                      </div>

                      {/* Display Face Bounding Box Overlay if available */}
                      {faceBox && (
                        <div
                          className="absolute border-2 border-dashed border-[#141414] pointer-events-none"
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

            {/* AVATAR STYLE CUSTOMIZATION PANEL */}
            <section className="bg-white/40 border-2 border-[#141414] rounded-none p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]" id="customization-panel">
              <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-[#D4D3D0] flex items-center justify-between">
                <h2 className="font-serif text-[11px] italic text-[#141414]/80 uppercase font-bold tracking-wider flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" />
                  <span>03 // 3D Avatar Styling Parameters</span>
                </h2>
                <button
                  onClick={handleResetDefaults}
                  className="text-[9px] text-[#141414] font-bold font-mono uppercase bg-white/60 border border-[#141414] px-1.5 py-0.5 rounded-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white hover:translate-y-[1px] transition-all duration-200"
                >
                  Defaults
                </button>
              </div>

              {/* Head Shape / Mesh Style */}
              <div className="space-y-1.5 pb-2 border-b border-[#141414]/10">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">MESH STYLE / MODEL SHAPE</label>
                <select
                  value={config.headShape}
                  onChange={(e) => setConfig((prev) => ({ ...prev, headShape: e.target.value as HeadShape }))}
                  className="w-full bg-white/70 border-2 border-[#141414] px-3 py-2 text-xs text-[#141414] font-mono font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_#141414]"
                >
                  <option value="organic-smooth">✪ ORGANIC HUMANOID (GAME-READY)</option>
                  <option value="rounded-cube">Rounded Cube (Smooth Voxel)</option>
                  <option value="cube">Classic Box (Retro Blocky)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Hair Style */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">HAIRSTYLE</label>
                  <select
                    value={config.hairStyle}
                    onChange={(e) => setConfig((prev) => ({ ...prev, hairStyle: e.target.value as HairStyle }))}
                    className="w-full bg-white/70 border-2 border-[#141414] px-3 py-2 rounded-none text-xs text-[#141414] font-mono focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_#141414]"
                  >
                    <option value="none">Bald / None</option>
                    <option value="short">Short Trim</option>
                    <option value="long">Long Flowing</option>
                    <option value="afro">Afro Puffy</option>
                    <option value="ponytail">Ponytail</option>
                    <option value="cap">Sport Cap</option>
                  </select>
                </div>

                {/* Body Proportions */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">BODY TYPE</label>
                  <select
                    value={config.bodyType}
                    onChange={(e) => setConfig((prev) => ({ ...prev, bodyType: e.target.value as BodyType }))}
                    className="w-full bg-white/70 border-2 border-[#141414] px-3 py-2 rounded-none text-xs text-[#141414] font-mono focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_#141414]"
                  >
                    <option value="normal">Normal Blocky</option>
                    <option value="chibi">Chibi Tiny</option>
                    <option value="tall">Tall Slim</option>
                    <option value="athletic">Athletic Wide</option>
                  </select>
                </div>
              </div>

              {/* Color selectors */}
              <div className="grid grid-cols-3 gap-3">
                {/* Skin Tone */}
                <div className="space-y-1.5 text-center">
                  <label className="font-mono text-[9px] text-[#141414]/80 font-bold block uppercase tracking-wider">Skin</label>
                  <div className="flex items-center justify-center gap-1.5 bg-white/60 border-2 border-[#141414] p-1.5 rounded-none shadow-[2px_2px_0px_0px_#141414]">
                    <input
                      type="color"
                      value={config.skinColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, skinColor: e.target.value }))}
                      className="w-5 h-5 cursor-pointer border border-[#141414]"
                    />
                    <span className="text-[10px] text-[#141414] font-mono uppercase font-bold">{config.skinColor.substring(1, 5)}</span>
                  </div>
                </div>

                {/* Hair Color */}
                <div className="space-y-1.5 text-center">
                  <label className="font-mono text-[9px] text-[#141414]/80 font-bold block uppercase tracking-wider">Hair</label>
                  <div className="flex items-center justify-center gap-1.5 bg-white/60 border-2 border-[#141414] p-1.5 rounded-none shadow-[2px_2px_0px_0px_#141414]">
                    <input
                      type="color"
                      value={config.hairColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, hairColor: e.target.value }))}
                      className="w-5 h-5 cursor-pointer border border-[#141414]"
                    />
                    <span className="text-[10px] text-[#141414] font-mono uppercase font-bold">{config.hairColor.substring(1, 5)}</span>
                  </div>
                </div>

                {/* Clothing Color */}
                <div className="space-y-1.5 text-center">
                  <label className="font-mono text-[9px] text-[#141414]/80 font-bold block uppercase tracking-wider">Clothing</label>
                  <div className="flex items-center justify-center gap-1.5 bg-white/60 border-2 border-[#141414] p-1.5 rounded-none shadow-[2px_2px_0px_0px_#141414]">
                    <input
                      type="color"
                      value={config.clothingColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, clothingColor: e.target.value }))}
                      className="w-5 h-5 cursor-pointer border border-[#141414]"
                    />
                    <span className="text-[10px] text-[#141414] font-mono uppercase font-bold">{config.clothingColor.substring(1, 5)}</span>
                  </div>
                </div>
              </div>

              {/* Advanced lower-body styling */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] text-[#141414]/80 font-bold block uppercase tracking-wider">Pants Color</label>
                  <div className="flex items-center gap-2 bg-white/60 border-2 border-[#141414] px-3 py-1.5 rounded-none shadow-[2px_2px_0px_0px_#141414]">
                    <input
                      type="color"
                      value={config.pantsColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, pantsColor: e.target.value }))}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="text-[10px] text-[#141414] font-mono uppercase font-bold">{config.pantsColor}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] text-[#141414]/80 font-bold block uppercase tracking-wider">Shoes Color</label>
                  <div className="flex items-center gap-2 bg-white/60 border-2 border-[#141414] px-3 py-1.5 rounded-none shadow-[2px_2px_0px_0px_#141414]">
                    <input
                      type="color"
                      value={config.shoesColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, shoesColor: e.target.value }))}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="text-[10px] text-[#141414] font-mono uppercase font-bold">{config.shoesColor}</span>
                  </div>
                </div>
              </div>

              {/* Additional custom styling parameters */}
              <div className="grid grid-cols-2 gap-4 border-t border-[#141414]/10 pt-3">
                {/* Clothing Style */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">CLOTHING STYLE</label>
                  <select
                    value={config.clothingStyle || "tshirt"}
                    onChange={(e) => setConfig((prev) => ({ ...prev, clothingStyle: e.target.value as any }))}
                    className="w-full bg-white/70 border-2 border-[#141414] px-3 py-2 rounded-none text-xs text-[#141414] font-mono focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_#141414]"
                  >
                    <option value="tshirt">T-Shirt / Base</option>
                    <option value="hoodie">Street Hoodie</option>
                    <option value="armor">Iron Chestplate</option>
                    <option value="dress">Elegant Dress</option>
                  </select>
                </div>

                {/* Detail Level / LOD */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">DETAIL LEVEL (LOD)</label>
                  <select
                    value={config.detailLevel || "medium"}
                    onChange={(e) => setConfig((prev) => ({ ...prev, detailLevel: e.target.value as any }))}
                    className="w-full bg-white/70 border-2 border-[#141414] px-3 py-2 rounded-none text-xs text-[#141414] font-mono focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_#141414]"
                  >
                    <option value="low">Low (Mobile Optimized)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Hero Poly)</option>
                  </select>
                </div>
              </div>

              {/* Facial expression select */}
              <div className="space-y-1.5 border-t border-[#141414]/10 pt-3">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">FACIAL EXPRESSION</label>
                <select
                  value={config.expression || "neutral"}
                  onChange={(e) => setConfig((prev) => ({ ...prev, expression: e.target.value as any }))}
                  className="w-full bg-white/70 border-2 border-[#141414] px-3 py-2 rounded-none text-xs text-[#141414] font-mono focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_#141414]"
                >
                  <option value="neutral">Neutral / Focus</option>
                  <option value="happy">Happy Smiley</option>
                  <option value="angry">Grumpy / Confused</option>
                  <option value="sad">Sad / Melancholy</option>
                  <option value="surprised">Surprised / Wide</option>
                </select>
              </div>

              {/* Accessories Checkboxes */}
              <div className="space-y-2 border-t border-[#141414]/10 pt-3">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">EQUIPPED ACCESSORIES</label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Glasses */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("glasses") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "glasses" as const] : cur.filter((x) => x !== "glasses");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span>Glasses</span>
                  </label>

                  {/* Headphones */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("headphones") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "headphones" as const] : cur.filter((x) => x !== "headphones");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span>Headphones</span>
                  </label>

                  {/* Backpack */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("backpack") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "backpack" as const] : cur.filter((x) => x !== "backpack");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span>Backpack</span>
                  </label>
                </div>
              </div>

              {/* Body Morph Target Sliders */}
              <div className="space-y-3 border-t border-[#141414]/10 pt-3">
                <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">BODY MORPH INFLUENCES</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                      <span>SLENDER STYLE</span>
                      <span>{Math.round((config.morphSlender || 0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.morphSlender || 0}
                      onChange={(e) => setConfig((prev) => ({ ...prev, morphSlender: parseFloat(e.target.value) }))}
                      className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                      <span>BULK STYLE</span>
                      <span>{Math.round((config.morphBulk || 0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.morphBulk || 0}
                      onChange={(e) => setConfig((prev) => ({ ...prev, morphBulk: parseFloat(e.target.value) }))}
                      className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT PANEL: LIVE 3D PREVIEW AND EXPORT TERMINAL (LG: 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 3D PREVIEW BLOCK */}
            <section className="bg-white/40 border-2 border-[#141414] rounded-none p-5 space-y-4 relative shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]" id="preview-panel">
              <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-[#D4D3D0] flex items-center justify-between">
                <h2 className="font-serif text-[11px] italic text-[#141414]/80 uppercase font-bold tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>04 // 3D Render Viewport</span>
                </h2>

                <div className="flex items-center gap-4 text-[10px] font-mono text-[#141414]">
                  {/* Auto rotate checkbox */}
                  <label className="flex items-center gap-1.5 cursor-pointer text-[#141414]/80 hover:text-[#141414] font-bold uppercase select-none">
                    <input
                      type="checkbox"
                      checked={autoRotate}
                      onChange={(e) => setAutoRotate(e.target.checked)}
                      className="accent-[#141414]"
                    />
                    <span>Auto Rotate</span>
                  </label>
                </div>
              </div>

              {/* Interactive ThreeJS View */}
              <div className="relative">
                <ThreeCanvas
                  config={config}
                  faceCanvas={faceCanvas}
                  autoRotate={autoRotate}
                  onSceneReady={(group) => {
                    avatarGroupRef.current = group;
                  }}
                />

                {/* Overlaid watermark / name */}
                <div className="absolute bottom-4 right-4 bg-white/90 border border-[#141414] px-3 py-1.5 rounded-none z-10 text-right select-none shadow-[2px_2px_0px_0px_#141414]">
                  <span className="text-[9px] text-[#141414]/60 block font-mono font-bold">NAME</span>
                  <span className="text-xs font-bold text-[#141414] tracking-wider font-mono uppercase">{characterName}</span>
                </div>
              </div>

              {/* ACTION EXPORTS PANEL */}
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
            </section>

            {/* LOGS TERMINAL */}
            <StudioLogs logs={logs} />
          </div>
        </div>

        {/* DETAILED EXPLANATION GRID */}
        <section className="bg-[#D4D3D0]/30 border-2 border-[#141414] rounded-none p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]" id="documentation-section">
          <h3 className="font-serif text-xs italic text-[#141414] font-bold uppercase tracking-wider mb-4 border-b border-[#141414]/30 pb-2">Technical Engine Architecture & Pipeline Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] leading-relaxed text-[#141414]/80 font-mono">
            <div className="space-y-2">
              <h4 className="font-bold text-[#141414] flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>[FIX_SYS_01] SMOOTH_BLENDING_ENGINE</span>
              </h4>
              <p className="normal-case">
                Resolves the "flat photo look" via an active HTML5 Canvas blending and feathering engine:
              </p>
              <ul className="list-disc pl-4 space-y-1 normal-case">
                <li>
                  <strong>Automorphic skin color matching:</strong> Fills empty margins with matching pigment color to form unified base head UV texture maps.
                </li>
                <li>
                  <strong>Feathered opacity gradients:</strong> Multi-pass radial gradient masks smooth the boundary edges between user portrait and base mesh.
                </li>
                <li>
                  <strong>Manual telemetry adjustment:</strong> Direct control parameters for translation scale, shifts, and radius.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#141414] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>[API_SYS_02] FULLSTACK_COORDINATION</span>
              </h4>
              <p className="normal-case">
                Secure backend pipeline proxying requests to Gemini 3.5 Flash for auto-localization:
              </p>
              <ul className="list-disc pl-4 space-y-1 normal-case">
                <li>
                  <strong>Bounding box localization:</strong> Gemini automatically parses and extracts face pixel coordinates.
                </li>
                <li>
                  <strong>Feature vector estimation:</strong> Color pickers auto-populate with hex estimations of skin tones, clothing style, and hair styles.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t-2 border-[#141414] bg-[#D4D3D0] text-center py-4 text-[10px] text-[#141414]/60 font-mono mt-auto select-none" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 uppercase tracking-tight">
          <span>DISK_WRITES: 124.5MB // UPTIME: 00:14:22</span>
          <span>© 2026 Photo to GLB Studio // DACAMERAGIRL // REPO_FIX_01</span>
        </div>
      </footer>
    </div>
  );
}
