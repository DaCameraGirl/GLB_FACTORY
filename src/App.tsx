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

  // Blender-style Workspace active tab
  const [editorTab, setEditorTab] = useState<"parts" | "transforms" | "materials" | "scene">("parts");

  // Interactive 3D Step-by-Step Directives guide stage
  const [guideStage, setGuideStage] = useState<number>(0);

  // BettiN2Win-Style Interactive Documentation & Wiki Active Tab
  const [wikiTab, setWikiTab] = useState<"quickstart" | "texturing" | "rigging" | "shading" | "export">("quickstart");

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

    // Material default parameters
    materialRoughness: 0.8,
    materialMetalness: 0.05,
    wireframeMode: false,
    materialEmissive: "#000000",
    materialEmissiveIntensity: 0.0,

    // Transform default parameters (relative modifications)
    headScaleX: 1.0,
    headScaleY: 1.0,
    headScaleZ: 1.0,
    headRotateX: 0.0,
    headRotateY: 0.0,
    headRotateZ: 0.0,
    headTranslateX: 0.0,
    headTranslateY: 0.0,
    headTranslateZ: 0.0,

    torsoScaleX: 1.0,
    torsoScaleY: 1.0,
    torsoScaleZ: 1.0,
    torsoTranslateX: 0.0,
    torsoTranslateY: 0.0,
    torsoTranslateZ: 0.0,

    armScaleX: 1.0,
    armScaleY: 1.0,
    armScaleZ: 1.0,

    legScaleX: 1.0,
    legScaleY: 1.0,
    legScaleZ: 1.0,

    // Scene & Viewport defaults
    showGrid: true,
    ambientIntensity: 0.75,
    keyLightIntensity: 0.85,
    keyLightColor: "#ffffff",
    cameraFov: 45,
    cameraPreset: "front",
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

      // Material overrides
      materialRoughness: 0.8,
      materialMetalness: 0.05,
      wireframeMode: false,
      materialEmissive: "#000000",
      materialEmissiveIntensity: 0.0,

      // Transform parameters
      headScaleX: 1.0,
      headScaleY: 1.0,
      headScaleZ: 1.0,
      headRotateX: 0.0,
      headRotateY: 0.0,
      headRotateZ: 0.0,
      headTranslateX: 0.0,
      headTranslateY: 0.0,
      headTranslateZ: 0.0,

      torsoScaleX: 1.0,
      torsoScaleY: 1.0,
      torsoScaleZ: 1.0,
      torsoTranslateX: 0.0,
      torsoTranslateY: 0.0,
      torsoTranslateZ: 0.0,

      armScaleX: 1.0,
      armScaleY: 1.0,
      armScaleZ: 1.0,

      legScaleX: 1.0,
      legScaleY: 1.0,
      legScaleZ: 1.0,

      // Scene & Viewport presets
      showGrid: true,
      ambientIntensity: 0.75,
      keyLightIntensity: 0.85,
      keyLightColor: "#ffffff",
      cameraFov: 45,
      cameraPreset: "front",
    });
    setEditorTab("parts");
    addLog("Customizer configurations and workspace tabs reset to defaults.", "info");
  };

  // Interactive 3D Step-by-Step Guide Stages Definition
  const guideStages = [
    {
      title: "01 // Portrait Selection & Calibration",
      description: "Directives on selecting the ideal portrait to generate a high-quality, distortion-free 3D asset.",
      directives: [
        "Use a front-facing, neutral photo with clear, sharp lighting.",
        "Ensure there are no heavy side shadows, face coverings, or steep head tilts.",
        "Once uploaded, the system automatically analyzes features.",
      ],
      tip: "💡 PRO TIP: Diffused natural lighting works best to prevent harsh nose shadows.",
      actionText: "Open Upload Area",
      action: () => {
        const el = document.getElementById("upload-panel");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    },
    {
      title: "02 // Texture Mapping & Boundary Blending",
      description: "How to perfectly position and feather the face photo onto the 3D skull mesh.",
      directives: [
        "Enable 'Feather Edges' to smoothly blend photo borders into the skin pigment.",
        "Adjust 'Shift Horizontal' and 'Shift Vertical' so eyes align with the 3D sockets.",
        "Tweak 'Crop Scale' to zoom the facial texture map to cover the frontal hemisphere.",
      ],
      tip: "💡 PRO TIP: Set feather radius to 85% to achieve a seamless, seam-free scalp texture transition.",
      actionText: "Align Face Crop",
      action: () => {
        const el = document.getElementById("crop-tuning-panel");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    },
    {
      title: "03 // Mesh Sculpting & Proportional Scaling",
      description: "Molding the individual body part scales and shapes to fit the desired aesthetic.",
      directives: [
        "Select head shapes (Organic Smooth vs Retro Boxy Cube) for target stylization.",
        "Go to '3D TRANSFORM' tab to scale head size, shoulder width, or leg lengths.",
        "Adjust Slender vs Bulk morph targets to widen chest volume or slim down bones.",
      ],
      tip: "💡 PRO TIP: For cute chibi designs, set Head Size to 1.3x and scale torso Y to 0.7x.",
      actionText: "Open 3D Transform Tab",
      action: () => {
        setEditorTab("transforms");
        const el = document.getElementById("customization-panel");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    },
    {
      title: "04 // Shaders, Materials & Cyber Emissive Glow",
      description: "Tuning reflection properties, wireframes, and sci-fi glowing sub-modules.",
      directives: [
        "Go to 'MATERIALS' tab to adjust surface shine (Matte vs Metallic).",
        "Lower 'Roughness' (0.2) and increase 'Metalness' (0.9) to render hard robotic shells.",
        "Activate 'Wireframe Mode' to analyze real-time quad/triangle grid topologies.",
        "Select an Emissive color and raise glow intensity to add futuristic laser accents.",
      ],
      tip: "💡 PRO TIP: Emissive cyan or neon green looks spectacular on dark metallic skins.",
      actionText: "Open Shaders Tab",
      action: () => {
        setEditorTab("materials");
        const el = document.getElementById("customization-panel");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    },
    {
      title: "05 // Lighting Rig & WebGL Production Export",
      description: "Setting up studio lighting and exporting a game-ready asset.",
      directives: [
        "Go to 'SCENE' tab to choose camera presets: Front, Side, Top, or Isometric.",
        "Toggle 'Show Grid' to visualize ground shadow planes.",
        "Tweak Ambient and Key spotlight intensities for ideal three-point contrast.",
        "Click 'Export Final GLB' to download a clean, production-ready 3D asset.",
      ],
      tip: "💡 PRO TIP: GLB files are highly optimized binary glTFs, ready for direct load into Unity or Blender.",
      actionText: "Open Scene Tab",
      action: () => {
        setEditorTab("scene");
        const el = document.getElementById("customization-panel");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
  ];

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
            {/* 🎓 STEP-BY-STEP STUDIO DIRECTIVES & GUIDE */}
            <section className="bg-[#141414] border-2 border-[#141414] rounded-none p-5 text-[#E4E3E0] space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)] font-mono" id="directives-guide-panel">
              <div className="flex items-center justify-between border-b border-white/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#E4E3E0] text-[#141414] flex items-center justify-center font-mono font-bold text-xs">🎓</div>
                  <h2 className="font-serif text-[11px] italic font-bold tracking-wider uppercase text-white">
                    3D Studio Perfection Guide
                  </h2>
                </div>
                <div className="font-mono text-[9px] bg-white/10 px-2.5 py-0.5 border border-white/20 text-white font-bold">
                  STAGE {guideStage + 1} OF 5
                </div>
              </div>

              {/* Guide Contents */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span>✦</span>
                  <span>{guideStages[guideStage].title}</span>
                </h3>
                <p className="text-[11px] font-mono text-white/80 leading-relaxed normal-case">
                  {guideStages[guideStage].description}
                </p>

                {/* Directives list */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-none space-y-2">
                  <span className="text-[9px] font-bold tracking-widest text-[#E4E3E0]/60 uppercase block text-white">DIRECTIVES FOR PERFECTION:</span>
                  <ul className="space-y-2 text-[10px] font-mono leading-relaxed list-none text-white/90">
                    {guideStages[guideStage].directives.map((dir, i) => (
                      <li key={i} className="flex gap-2 normal-case">
                        <span className="text-yellow-400 shrink-0">✔</span>
                        <span>{dir}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tip box */}
                <div className="text-[10px] font-mono italic text-blue-300 bg-blue-950/40 border border-blue-900/30 p-2.5 normal-case">
                  {guideStages[guideStage].tip}
                </div>
              </div>

              {/* Guide Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-white/15">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setGuideStage(prev => Math.max(0, prev - 1))}
                    disabled={guideStage === 0}
                    className={`px-2.5 py-1 text-[10px] font-mono font-bold border transition-all ${
                      guideStage === 0
                        ? "text-white/30 border-white/10 cursor-not-allowed"
                        : "text-white border-white/40 hover:bg-white hover:text-[#141414] cursor-pointer"
                    }`}
                  >
                    ◄ Prev
                  </button>
                  <button
                    onClick={() => setGuideStage(prev => Math.min(4, prev + 1))}
                    disabled={guideStage === 4}
                    className={`px-2.5 py-1 text-[10px] font-mono font-bold border transition-all ${
                      guideStage === 4
                        ? "text-white/30 border-white/10 cursor-not-allowed"
                        : "text-white border-white/40 hover:bg-white hover:text-[#141414] cursor-pointer"
                    }`}
                  >
                    Next ►
                  </button>
                </div>

                {/* Guide stage direct alignment actions */}
                <button
                  onClick={guideStages[guideStage].action}
                  className="bg-yellow-400 hover:bg-yellow-300 text-[#141414] px-2.5 py-1 text-[9px] font-mono font-bold border border-yellow-400 shadow-[1px_1px_0px_0px_rgba(255,255,255,0.4)] hover:translate-y-[1px] transition-all"
                >
                  {guideStages[guideStage].actionText}
                </button>
              </div>
            </section>

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

            {/* AVATAR STYLE CUSTOMIZATION PANEL - BLENDER WORKSPACE */}
            <section className="bg-white/40 border-2 border-[#141414] rounded-none p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]" id="customization-panel">
              <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-[#D4D3D0] flex items-center justify-between">
                <h2 className="font-serif text-[11px] italic text-[#141414]/80 uppercase font-bold tracking-wider flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" />
                  <span>03 // Blender-Style Workspace Control</span>
                </h2>
                <button
                  onClick={handleResetDefaults}
                  className="text-[9px] text-[#141414] font-bold font-mono uppercase bg-white/60 border border-[#141414] px-1.5 py-0.5 rounded-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white hover:translate-y-[1px] transition-all duration-200"
                >
                  Defaults
                </button>
              </div>

              {/* Blender Tabs Selector */}
              <div className="grid grid-cols-4 gap-1 bg-[#141414]/5 p-1 border-2 border-[#141414] font-mono text-[9px] font-bold">
                <button
                  onClick={() => setEditorTab("parts")}
                  className={`py-1.5 px-1 uppercase text-center transition-all ${
                    editorTab === "parts"
                      ? "bg-[#141414] text-white"
                      : "bg-transparent text-[#141414]/70 hover:bg-[#141414]/10"
                  }`}
                >
                  Parts
                </button>
                <button
                  onClick={() => setEditorTab("transforms")}
                  className={`py-1.5 px-1 uppercase text-center transition-all ${
                    editorTab === "transforms"
                      ? "bg-[#141414] text-white"
                      : "bg-transparent text-[#141414]/70 hover:bg-[#141414]/10"
                  }`}
                >
                  Transform
                </button>
                <button
                  onClick={() => setEditorTab("materials")}
                  className={`py-1.5 px-1 uppercase text-center transition-all ${
                    editorTab === "materials"
                      ? "bg-[#141414] text-white"
                      : "bg-transparent text-[#141414]/70 hover:bg-[#141414]/10"
                  }`}
                >
                  Material
                </button>
                <button
                  onClick={() => setEditorTab("scene")}
                  className={`py-1.5 px-1 uppercase text-center transition-all ${
                    editorTab === "scene"
                      ? "bg-[#141414] text-white"
                      : "bg-transparent text-[#141414]/70 hover:bg-[#141414]/10"
                  }`}
                >
                  Scene
                </button>
              </div>

              {/* TAB CONTENT WRAPPERS */}
              {editorTab === "parts" && (
                <div className="space-y-4">

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
                    <span>Phones</span>
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

                  {/* Halo */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("halo") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "halo" as const] : cur.filter((x) => x !== "halo");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span className="text-[#b45309] font-bold">★ Halo</span>
                  </label>

                  {/* Crown */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("crown") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "crown" as const] : cur.filter((x) => x !== "crown");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span className="text-[#c2410c] font-bold">♛ Crown</span>
                  </label>

                  {/* Cat Ears */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("cat-ears") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "cat-ears" as const] : cur.filter((x) => x !== "cat-ears");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span className="text-[#db2777]">🐾 Ears</span>
                  </label>

                  {/* Wizard Hat */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white/50 border-2 border-[#141414] px-2 py-1.5 text-xs font-mono select-none shadow-[1px_1px_0px_0px_#141414] hover:bg-white transition-all duration-200 col-span-3">
                    <input
                      type="checkbox"
                      checked={config.accessories?.includes("wizard-hat") || false}
                      onChange={(e) => {
                        const cur = config.accessories || [];
                        const next = e.target.checked ? [...cur, "wizard-hat" as const] : cur.filter((x) => x !== "wizard-hat");
                        setConfig((prev) => ({ ...prev, accessories: next }));
                      }}
                      className="accent-[#141414]"
                    />
                    <span className="text-[#1d4ed8] font-bold">🧙 Wizard Spellcaster Hat</span>
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
                </div>
              )}

              {/* TRANSFORMS TAB */}
              {editorTab === "transforms" && (
                <div className="space-y-4 text-[#141414] font-mono">
                  {/* Head Transforms */}
                  <div className="space-y-2 border-b border-[#141414]/10 pb-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">01 // HEAD TRANSFORM (LOCAL)</label>
                    <div className="grid grid-cols-1 gap-2 text-[9px]">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>SCALE (XYZ)</span>
                          <span>{config.headScaleX?.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.8"
                          step="0.05"
                          value={config.headScaleX || 1.0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setConfig((prev) => ({ ...prev, headScaleX: val, headScaleY: val, headScaleZ: val }));
                          }}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>OFFSET Y (HEIGHT)</span>
                          <span>{config.headTranslateY !== undefined ? (config.headTranslateY > 0 ? "+" : "") + config.headTranslateY.toFixed(2) : "0.00"}</span>
                        </div>
                        <input
                          type="range"
                          min="-0.5"
                          max="0.5"
                          step="0.05"
                          value={config.headTranslateY !== undefined ? config.headTranslateY : 0.0}
                          onChange={(e) => setConfig((prev) => ({ ...prev, headTranslateY: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>PITCH / TILT (ROTATE X)</span>
                          <span>{((config.headRotateX || 0) * (180 / Math.PI)).toFixed(0)}°</span>
                        </div>
                        <input
                          type="range"
                          min="-0.5"
                          max="0.5"
                          step="0.05"
                          value={config.headRotateX || 0}
                          onChange={(e) => setConfig((prev) => ({ ...prev, headRotateX: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Torso Transforms */}
                  <div className="space-y-2 border-b border-[#141414]/10 pb-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">02 // TORSO / CHEST EXPANSION</label>
                    <div className="grid grid-cols-1 gap-2 text-[9px]">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>TORSO WIDTH (SCALE X)</span>
                          <span>{config.torsoScaleX?.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.6"
                          max="1.6"
                          step="0.05"
                          value={config.torsoScaleX || 1.0}
                          onChange={(e) => setConfig((prev) => ({ ...prev, torsoScaleX: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>TORSO DEPTH (SCALE Z)</span>
                          <span>{config.torsoScaleZ?.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.6"
                          max="1.6"
                          step="0.05"
                          value={config.torsoScaleZ || 1.0}
                          onChange={(e) => setConfig((prev) => ({ ...prev, torsoScaleZ: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Limbs Transforms */}
                  <div className="space-y-2 border-b border-[#141414]/10 pb-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">03 // LIMB THICKNESS / SCALE</label>
                    <div className="grid grid-cols-2 gap-4 text-[9px]">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>ARM SCALE</span>
                          <span>{config.armScaleX?.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.05"
                          value={config.armScaleX || 1.0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setConfig((prev) => ({ ...prev, armScaleX: val, armScaleY: val, armScaleZ: val }));
                          }}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>LEG SCALE</span>
                          <span>{config.legScaleX?.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.05"
                          value={config.legScaleX || 1.0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setConfig((prev) => ({ ...prev, legScaleX: val, legScaleY: val, legScaleZ: val }));
                          }}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reset Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        headScaleX: 1.0, headScaleY: 1.0, headScaleZ: 1.0,
                        headTranslateX: 0, headTranslateY: 0, headTranslateZ: 0,
                        headRotateX: 0, headRotateY: 0, headRotateZ: 0,
                        torsoScaleX: 1.0, torsoScaleY: 1.0, torsoScaleZ: 1.0,
                        torsoTranslateX: 0, torsoTranslateY: 0, torsoTranslateZ: 0,
                        armScaleX: 1.0, armScaleY: 1.0, armScaleZ: 1.0,
                        legScaleX: 1.0, legScaleY: 1.0, legScaleZ: 1.0,
                      }));
                      addLog("Transform matrices reset to defaults.", "info");
                    }}
                    className="w-full py-2 border-2 border-[#141414] text-[10px] bg-white/50 hover:bg-white active:translate-y-0.5 transition font-bold shadow-[2px_2px_0px_0px_#141414] select-none"
                  >
                    RESET TRANSFORM MATRIX
                  </button>
                </div>
              )}

              {/* MATERIALS TAB */}
              {editorTab === "materials" && (
                <div className="space-y-4 text-[#141414] font-mono">
                  <div className="space-y-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">01 // GLTF SHADER PROPERTIES</label>
                    <div className="space-y-2">
                      <div className="space-y-1 text-[9px]">
                        <div className="flex justify-between font-bold">
                          <span>ROUGHNESS (MATTE vs SHINY)</span>
                          <span>{Math.round((config.materialRoughness ?? 0.8) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.05"
                          value={config.materialRoughness !== undefined ? config.materialRoughness : 0.8}
                          onChange={(e) => setConfig((prev) => ({ ...prev, materialRoughness: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>

                      <div className="space-y-1 text-[9px]">
                        <div className="flex justify-between font-bold">
                          <span>METALNESS (METALLIC REFLECT)</span>
                          <span>{Math.round((config.materialMetalness ?? 0.05) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.05"
                          value={config.materialMetalness !== undefined ? config.materialMetalness : 0.05}
                          onChange={(e) => setConfig((prev) => ({ ...prev, materialMetalness: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-[#141414]/10 pt-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">02 // EMISSIVE GLOW (GLOW IN DARK)</label>
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div className="space-y-1 text-[9px]">
                        <span className="font-bold uppercase text-[8px] text-[#141414]/70">GLOW COLOR</span>
                        <div className="flex items-center gap-2 bg-white/60 border-2 border-[#141414] p-1 shadow-[2px_2px_0px_0px_#141414]">
                          <input
                            type="color"
                            value={config.materialEmissive || "#000000"}
                            onChange={(e) => setConfig((prev) => ({ ...prev, materialEmissive: e.target.value }))}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="uppercase font-bold text-[9px]">{config.materialEmissive || "#000000"}</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[9px]">
                        <div className="flex justify-between font-bold">
                          <span>INTENSITY</span>
                          <span>{(config.materialEmissiveIntensity || 0).toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="2.0"
                          step="0.1"
                          value={config.materialEmissiveIntensity !== undefined ? config.materialEmissiveIntensity : 0.0}
                          onChange={(e) => setConfig((prev) => ({ ...prev, materialEmissiveIntensity: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-[#141414]/10 pt-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">03 // WIREFRAME RENDER OPTIONS</label>
                    <label className="flex items-center gap-2 cursor-pointer bg-white/50 border-2 border-[#141414] p-2 text-[10px] hover:bg-white select-none shadow-[2px_2px_0px_0px_#141414] transition-all">
                      <input
                        type="checkbox"
                        checked={!!config.wireframeMode}
                        onChange={(e) => setConfig((prev) => ({ ...prev, wireframeMode: e.target.checked }))}
                        className="accent-[#141414]"
                      />
                      <span className="font-bold">ENABLE WIREFRAME MODE (DEVELOPER PREVIEW)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* SCENE TAB */}
              {editorTab === "scene" && (
                <div className="space-y-4 text-[#141414] font-mono">
                  <div className="space-y-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">01 // CAMERA / VIEW ANGLE PRESETS</label>
                    <div className="grid grid-cols-2 gap-3 text-[9px]">
                      <div className="space-y-1">
                        <span className="font-bold text-[8px] text-[#141414]/70">ANGLE PRESET</span>
                        <select
                          value={config.cameraPreset || "front"}
                          onChange={(e) => setConfig((prev) => ({ ...prev, cameraPreset: e.target.value as any }))}
                          className="w-full bg-white/70 border-2 border-[#141414] px-1.5 py-1.5 text-[9px] font-mono font-bold focus:outline-none shadow-[2px_2px_0px_0px_#141414]"
                        >
                          <option value="front">✪ FRONT VIEW</option>
                          <option value="side">✪ SIDE VIEW (PROFILE)</option>
                          <option value="top">✪ TOP-DOWN VIEW</option>
                          <option value="isometric">✪ ISOMETRIC (3D ORTHO)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>FOV (CAMERA LENS)</span>
                          <span>{config.cameraFov || 45}°</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="80"
                          step="5"
                          value={config.cameraFov || 45}
                          onChange={(e) => setConfig((prev) => ({ ...prev, cameraFov: parseInt(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-[#141414]/10 pt-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">02 // LIGHTING & AMBIENT INTENSITIES</label>
                    <div className="space-y-2 text-[9px]">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>AMBIENT ILLUMINATION</span>
                          <span>{Math.round((config.ambientIntensity ?? 0.75) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="2.0"
                          step="0.05"
                          value={config.ambientIntensity !== undefined ? config.ambientIntensity : 0.75}
                          onChange={(e) => setConfig((prev) => ({ ...prev, ambientIntensity: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>SPOTLIGHT / KEY LIGHT INTENSITY</span>
                          <span>{Math.round((config.keyLightIntensity ?? 0.85) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="2.0"
                          step="0.05"
                          value={config.keyLightIntensity !== undefined ? config.keyLightIntensity : 0.85}
                          onChange={(e) => setConfig((prev) => ({ ...prev, keyLightIntensity: parseFloat(e.target.value) }))}
                          className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-[8px] text-[#141414]/70 block">KEY LIGHT COLOR TEMP</span>
                        <div className="flex items-center gap-2 bg-white/60 border-2 border-[#141414] p-1 max-w-[150px] shadow-[2px_2px_0px_0px_#141414]">
                          <input
                            type="color"
                            value={config.keyLightColor || "#ffffff"}
                            onChange={(e) => setConfig((prev) => ({ ...prev, keyLightColor: e.target.value }))}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="uppercase font-bold text-[9px]">{config.keyLightColor || "#ffffff"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-[#141414]/10 pt-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">03 // RENDER VIEWPORT DECORATIONS</label>
                    <div className="grid grid-cols-1 gap-2">
                      <label className="flex items-center gap-2 cursor-pointer bg-white/50 border-2 border-[#141414] p-2 text-[10px] hover:bg-white select-none shadow-[2px_2px_0px_0px_#141414] transition-all">
                        <input
                          type="checkbox"
                          checked={config.showGrid !== false}
                          onChange={(e) => setConfig((prev) => ({ ...prev, showGrid: e.target.checked }))}
                          className="accent-[#141414]"
                        />
                        <span className="font-bold">SHOW GROUND COORDINATE GRID HELPER</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer bg-[#ffe4e6]/60 border-2 border-[#e11d48] p-2 text-[10px] hover:bg-[#ffe4e6] select-none shadow-[2px_2px_0px_0px_#e11d48] transition-all">
                        <input
                          type="checkbox"
                          checked={!!config.discoMode}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setConfig((prev) => ({ ...prev, discoMode: val }));
                            if (val) {
                              addLog("🕺 DISCO PARTY MODE ENGAGED! Lights cycle colors and orbit. Show us those voxel moves!", "success");
                            } else {
                              addLog("Disco mode disengaged. Ambient workstation lighting restored.", "info");
                            }
                          }}
                          className="accent-[#e11d48]"
                        />
                        <span className="font-bold text-[#e11d48] uppercase tracking-wider flex items-center gap-1.5">
                          <span>🕺 ACTIVE DISCO PARTY MODE (COLOR STROBES!)</span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-[#141414]/10 pt-3">
                    <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85 block">04 // 2D VIEWPORT STYLE OVERLAYS (ESTHETIC FILTERS)</label>
                    <div className="grid grid-cols-3 gap-2 font-mono text-[9px] font-bold">
                      {(["none", "crt", "blueprint", "gameboy", "cyberpunk", "sketch"] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => {
                            setConfig((prev) => ({ ...prev, twoDStyleEffect: style }));
                            addLog(`Engaged 2D style effect: ${style.toUpperCase()}`, "info");
                          }}
                          className={`border-2 p-1.5 uppercase text-center transition-all cursor-pointer ${
                            (config.twoDStyleEffect || "none") === style
                              ? "bg-[#141414] text-white border-[#141414] shadow-[1px_1px_0px_0px_#141414]"
                              : "bg-white/50 text-[#141414] border-[#141414] hover:bg-white shadow-[2px_2px_0px_0px_#141414] active:translate-y-[1px]"
                          }`}
                        >
                          {style === "none" ? "None (Clean)" : style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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

        {/* 📖 BettiN2Win Masterclass: Ultimate Voxel-Rig Pipeline & Multi-Framework Guidebook */}
        <section className="bg-white/95 border-2 border-[#141414] rounded-none p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)] text-[#141414] space-y-4" id="documentation-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#141414] pb-3 gap-2">
            <h3 className="font-serif text-[12px] text-[#141414] font-bold uppercase tracking-wide flex items-center gap-2">
              <span className="text-base">📖</span>
              <span>BettiN2Win Masterclass: Ultimate Voxel-Rig Pipeline & Multi-Framework Guidebook</span>
            </h3>
            <span className="font-mono text-[9px] bg-yellow-400 border border-[#141414] px-2 py-0.5 font-bold uppercase tracking-widest shadow-[1px_1px_0px_0px_#141414] shrink-0">
              DEVELOPER_EDITION // ONLINE_WIKI
            </span>
          </div>

          <p className="text-[11px] font-mono leading-relaxed normal-case text-gray-700">
            Welcome to the masterclass manual! Inspired by the high-fidelity verbose structures of the Bettin2Win repositories, we have built a fully detailed step-by-step documentation system explaining our mathematical, canvas, shader, and external engine translation systems. Toggle the folders below to explore.
          </p>

          {/* Interactive Documentation Sub-Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-[#141414]/5 border-2 border-[#141414] font-mono text-[9px] font-bold select-none">
            {(["quickstart", "texturing", "rigging", "shading", "export"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setWikiTab(tab)}
                className={`py-2 px-1 text-center transition-all cursor-pointer border ${
                  wikiTab === tab
                    ? "bg-[#141414] text-white border-[#141414]"
                    : "bg-white hover:bg-[#141414]/10 text-[#141414] border-transparent"
                }`}
              >
                {tab === "quickstart" && "🚀 10s Quickstart"}
                {tab === "texturing" && "🧠 2D Canvas Math"}
                {tab === "rigging" && "🧱 Voxel Assembly"}
                {tab === "shading" && "✨ Shaders & Shading"}
                {tab === "export" && "🎮 Engine Export"}
              </button>
            ))}
          </div>

          {/* TAB CONTENTS (Ultra-Verbose, Technical, Detailed Explanations!) */}
          <div className="bg-[#141414]/5 border-2 border-[#141414] p-5 font-mono text-xs text-gray-800 leading-relaxed shadow-[inner_2px_2px_4px_rgba(0,0,0,0.05)]">
            
            {/* QUICKSTART TAB */}
            {wikiTab === "quickstart" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2">
                  <span className="font-bold uppercase text-[10px] text-gray-950 tracking-wider">[01 / 🚀 FIVE-STEP AVATAR CREATION WALKTHROUGH]</span>
                  <span className="text-[9px] bg-green-200 text-green-800 px-2 py-0.5 rounded font-bold uppercase shrink-0">BEGINNER FRIENDLY</span>
                </div>
                <p className="normal-case">
                  Follow these step-by-step procedural instructions to generate, fine-tune, style, and retrieve a rigged, production-ready voxel character:
                </p>
                <div className="space-y-3 pl-2 border-l-2 border-yellow-500">
                  <div className="space-y-1">
                    <span className="font-bold text-gray-950 block">1. INITIAL PORTRAIT ACQUISITION & PHOTOGRAPHY RULES</span>
                    <p className="normal-case pl-3 text-[11px] text-gray-700">
                      Drag and drop any front-facing portrait photo into the Drag & Drop Zone. For optimal results, ensure the camera is at eye-level, the subject is facing straight forward, and has flat, uniform lighting. Shadows on half the face can affect color-picker calculations!
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-gray-950 block">2. PIPELINE TRIGGERING (GEMINI AI DETECTOR)</span>
                    <p className="normal-case pl-3 text-[11px] text-gray-700">
                      Click <strong className="text-gray-950">"Build 3D Avatar"</strong>. This activates our server-side secure proxy pipeline. The Gemini vision model analyzes your photo, locates the exact bounding coordinates of the face, and automatically detects dominant skin-tone, hair-style, and clothing pigment hashes.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-gray-950 block">3. TEXTURE TUNING & SEAMLESS CANVAS FEATHERING</span>
                    <p className="normal-case pl-3 text-[11px] text-gray-700">
                      Check the <strong className="text-gray-950">"02 // Fine-Tune Face Texture"</strong> panel. Enable "Feather Edges" to allow our canvas shader helper to blend the edges of your photo into the synthetic skin. Use "Shift Horizontal/Vertical" and "Crop Scale" to center the eyes within the 3D model sockets perfectly!
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-gray-950 block">4. PARTS SELECTION AND CUSTOM TRANSFORM OVERRIDES</span>
                    <p className="normal-case pl-3 text-[11px] text-gray-700">
                      Access the tabbed workspace. Equip custom voxel parts (Hairstyles, Body Proportions), toggle custom 3D mesh transforms (head scale, arm offsets, leg morphing), or slide roughness/metalness parameters to achieve custom plastic, matte, or futuristic chrome textures.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-gray-950 block">5. RETRIEVAL AND RETARGETING (EXPORT)</span>
                    <p className="normal-case pl-3 text-[11px] text-gray-700">
                      Click <strong className="text-gray-950">"Export Final GLB"</strong> to retrieve a single, highly compressed 3D GLB model containing animations, PBR materials, skin weighting, and structural bone rigs ready to be integrated into any 3D workflow!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2D CANVAS MATH & ALIGNMENT TAB */}
            {wikiTab === "texturing" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2">
                  <span className="font-bold uppercase text-[10px] text-gray-950 tracking-wider">[02 / 🧠 MATHEMATICAL FRONT FACE UV TEXTURE GENERATION]</span>
                  <span className="text-[9px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-bold uppercase shrink-0">ADVANCED CANVAS MATH</span>
                </div>
                <p className="normal-case">
                  This engine maps flat 2D portrait pixels onto a custom 3D sphere/cube topology using an HTML5 canvas processing model:
                </p>
                <div className="space-y-2.5">
                  <div className="bg-white border border-[#141414]/20 p-3 rounded text-[11px] font-mono leading-relaxed space-y-1">
                    <span className="font-bold text-[#141414] block">How coordinates are resolved:</span>
                    <p className="normal-case text-gray-700">
                      Gemini returns face coordinate boundaries normalized on a 0-100% grid: <code className="bg-gray-100 text-[#141414] px-1 font-bold">[ymin, xmin, ymax, xmax]</code>. We read this data and extract a crop box around the facial region.
                    </p>
                    <p className="normal-case text-gray-700">
                      Using the Canvas 2D rendering context, we draw the face into a fixed 256x256 pixel texture map, applying horizontal (<code className="bg-gray-100 text-[#141414] px-1 font-bold">cropX</code>) and vertical (<code className="bg-gray-100 text-[#141414] px-1 font-bold">cropY</code>) translation matrices alongside magnification multipliers (<code className="bg-gray-100 text-[#141414] px-1 font-bold">cropScale</code>).
                    </p>
                  </div>

                  <div className="bg-white border border-[#141414]/20 p-3 rounded text-[11px] font-mono leading-relaxed space-y-1">
                    <span className="font-bold text-[#141414] block">Seamless Edge Feathering Algorithm:</span>
                    <p className="normal-case text-gray-700">
                      To prevent jarring straight boundaries, we generate a secondary transparent radial canvas mask. We fill the canvas perimeter with the solid, computer-generated skin pigment matching the computed <code className="bg-gray-100 text-[#141414] px-1 font-bold">skinColor</code>, and overlay the photograph with an inverse gradient transparency envelope. The feathering radius governs the blur slope. This results in a seamless transition!
                    </p>
                  </div>

                  <div className="bg-white border border-[#141414]/20 p-3 rounded text-[11px] font-mono leading-relaxed space-y-1">
                    <span className="font-bold text-[#141414] block">2D Esthetic Overlay Filters:</span>
                    <p className="normal-case text-gray-700">
                      To expand the styling options beyond raw 3D meshes, you can toggle active 2D Style Overlays on the scene container. These overlays utilize high-performance CSS grid patterns and mix-blend CSS overlays to simulate physical phosphor masks (CRT), dot-matrix sub-pixels (GameBoy), vector crosshairs (Cyberpunk), and pencil/graphite textures (Sketch) in real time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VOXEL ASSEMBLY TAB */}
            {wikiTab === "rigging" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2">
                  <span className="font-bold uppercase text-[10px] text-gray-950 tracking-wider">[03 / 🧱 VOXEL GRAPH RIGGING & ROTATIONAL MATRICES]</span>
                  <span className="text-[9px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded font-bold uppercase shrink-0">HIERARCHICAL RIGGING</span>
                </div>
                <p className="normal-case">
                  Voxel character rigs are represented as a joint-hierarchy of connected meshes inside a 3D scenegraph context:
                </p>
                <div className="space-y-3 text-[11px] text-gray-700">
                  <p className="normal-case">
                    The model root container is a single <code className="bg-gray-100 text-[#141414] px-1 font-bold">THREE.Group</code> representing the character bounds. All parts are parented hierarchically, meaning translation and rotation applied to the parent automatically offsets children:
                  </p>
                  <div className="bg-white border border-[#141414]/20 p-3 rounded font-mono leading-relaxed">
                    <strong className="text-gray-900 uppercase block mb-1 font-bold">CHARACTER RIG SCENEGRAPH ARB:</strong>
                    <div className="space-y-0.5 text-[10px] font-mono text-gray-600 pl-2">
                      <div>📁 [ROOT CONTAINER // Group]</div>
                      <div className="pl-4">├── 📁 [PELVIS // joint]</div>
                      <div className="pl-8">├── 📁 [TORSO // joint & mesh]</div>
                      <div className="pl-12">├── 📁 [HEAD // joint & mesh] (Dynamic frontal face mapped)</div>
                      <div className="pl-16">│   ├── 📁 [HAIR // mesh attachment]</div>
                      <div className="pl-16">│   └── 📁 [GLASSES / ACCESSORIES // attachment]</div>
                      <div className="pl-12">├── 📁 [LEFT_ARM // joint] & 📁 [RIGHT_ARM // joint]</div>
                      <div className="pl-12">└── 📁 [LEFT_LEG // joint] & 📁 [RIGHT_LEG // joint]</div>
                    </div>
                  </div>
                  <p className="normal-case">
                    <strong>Pose Animations:</strong> Every frame inside our <code className="bg-gray-100 text-[#141414] px-1 font-bold">requestAnimationFrame</code> loop, we calculate time offsets to feed sine-wave equations. For example, during a <code className="bg-gray-100 text-[#141414] px-1 font-bold">walk</code> cycle, we rotate the left/right legs with opposite sine angles, sway the arms, and dip the pelvis height to mimic weight compression.
                  </p>
                </div>
              </div>
            )}

            {/* SHADERS & MATERIALS */}
            {wikiTab === "shading" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2">
                  <span className="font-bold uppercase text-[10px] text-gray-950 tracking-wider">[04 / ✨ WEBGL PHYSICALLY-BASED MATERIALS & CYBER EMISSIVE LIGHTING]</span>
                  <span className="text-[9px] bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded font-bold uppercase shrink-0">PBR PIPELINE</span>
                </div>
                <p className="normal-case">
                  Every mesh uses <code className="bg-gray-100 text-[#141414] px-1 font-bold">THREE.MeshStandardMaterial</code> to achieve high-fidelity rendering:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-gray-700">
                  <div className="bg-white border border-[#141414]/20 p-3 rounded space-y-1">
                    <strong className="text-gray-950 block uppercase font-bold">1. Surface Micro-Facet Roughness</strong>
                    <p className="normal-case">
                      Governs the scattering of incident light. Set roughness to <code className="bg-gray-100 text-[#141414] px-1 font-bold">0.8</code> for a matte, clay-like appearance. Reduce to <code className="bg-gray-100 text-[#141414] px-1 font-bold">0.1</code> to obtain sharp specular highlights resembling gloss plastic.
                    </p>
                  </div>
                  <div className="bg-white border border-[#141414]/20 p-3 rounded space-y-1">
                    <strong className="text-gray-950 block uppercase font-bold">2. Metallic Reflection</strong>
                    <p className="normal-case">
                      Adjusts the metal conductivity. When set to <code className="bg-gray-100 text-[#141414] px-1 font-bold">0.9</code>, the material reflects the background environment colors directly rather than absorbing them, recreating polished gold, iron, or steel armor plating.
                    </p>
                  </div>
                  <div className="bg-white border border-[#141414]/20 p-3 rounded space-y-1 col-span-2">
                    <strong className="text-gray-950 block uppercase font-bold">3. Cyber Emissive Engine (Self-Illumination)</strong>
                    <p className="normal-case">
                      Allows elements of the voxel structure to emit light of a specified color without relying on external scene spotlights. Toggling emissive intensity is perfect for futuristic glowing eyes, laser circuits, or fluorescent armor trims!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* EXTERNAL ENGINE IMPORT */}
            {wikiTab === "export" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2">
                  <span className="font-bold uppercase text-[10px] text-gray-950 tracking-wider">[05 / 🎮 BLENDER, MIXAMO, UNITY, AND UNREAL ENGINE WORKFLOW]</span>
                  <span className="text-[9px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase shrink-0">PRODUCTION READY</span>
                </div>
                <p className="normal-case">
                  How to import and animate your exported GLB file in major industry-standard 3D software and games platforms:
                </p>
                
                <div className="space-y-3 text-[11px] text-gray-700">
                  <div className="bg-white border border-[#141414]/20 p-3 rounded space-y-1.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-gray-950 block font-bold">🧡 BLENDER RE-RIGGING & COMPOSITION</strong>
                      <span className="text-[8px] bg-orange-100 text-orange-700 px-1 font-mono rounded font-bold shrink-0">BLENDER</span>
                    </div>
                    <ol className="list-decimal pl-4 space-y-1 normal-case text-gray-600">
                      <li>Launch Blender and go to <strong>File &gt; Import &gt; glTF 2.0 (.glb)</strong> and load your downloaded file.</li>
                      <li>To view materials, change viewport shading mode to <strong>Material Preview</strong> or <strong>Rendered</strong>.</li>
                      <li>Under material properties for transparent elements (e.g. glass or accessories), set <strong>Blend Mode</strong> to <strong>Alpha Blend</strong>.</li>
                      <li>The model includes a clean bone armature hierarchy. Enter <strong>Pose Mode</strong> to manipulate joints directly!</li>
                    </ol>
                  </div>

                  <div className="bg-white border border-[#141414]/20 p-3 rounded space-y-1.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-gray-950 block font-bold">💃 MIXAMO AUTO-ANIMATION OVERLAYS</strong>
                      <span className="text-[8px] bg-red-100 text-red-700 px-1 font-mono rounded font-bold shrink-0">MIXAMO</span>
                    </div>
                    <p className="normal-case text-gray-600">
                      Mixamo is an outstanding free online auto-rigging and animation library. To use it with your voxel model:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 normal-case text-gray-600">
                      <li>Go to <code className="bg-gray-100 text-[#141414] px-1 font-bold">mixamo.com</code> and click <strong>Upload Character</strong>.</li>
                      <li>Select your downloaded <code className="bg-gray-100 text-[#141414] px-1 font-bold">.glb</code> file.</li>
                      <li>Position the auto-rigging circular markers onto the corresponding parts of the model (Chin, Wrists, Elbows, Knees, Groin).</li>
                      <li>Click next! Mixamo will process the model in seconds, auto-bind the skeleton joints, and let you select and download from over 3,000 professional animations (running, climbing, spellcasting, dancing, fighting)!</li>
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-[#141414]/20 p-3 rounded space-y-1">
                      <strong className="text-gray-950 block font-bold">🎮 UNITY ENGINE IMPORT</strong>
                      <ol className="list-decimal pl-4 space-y-1 normal-case text-gray-600">
                        <li>Drag the `.glb` model directly into your Assets panel.</li>
                        <li>Select the model, go to the <strong>Rig</strong> tab in import settings, and change Animation Type to <strong>Humanoid</strong>.</li>
                        <li>Drag the avatar into your active Scene, attach an Anim Controller, and run around!</li>
                      </ol>
                    </div>

                    <div className="bg-white border border-[#141414]/20 p-3 rounded space-y-1">
                      <strong className="text-gray-950 block font-bold">🎮 UNREAL ENGINE 5 SETUP</strong>
                      <ol className="list-decimal pl-4 space-y-1 normal-case text-gray-600">
                        <li>Ensure the <strong>glTF Importer</strong> plugin is enabled in UE5.</li>
                        <li>Drag your model into the Content Browser to generate Static Meshes and skeleton assets.</li>
                        <li>Create an <strong>IK Rig</strong> from the imported skeleton, retarget it to Manny/Quinn, and assign to your third-person controller.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
