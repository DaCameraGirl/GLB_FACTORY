import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Trophy,
  Cpu,
  Gamepad2,
  Volume2,
  Layers,
  Flame,
} from "lucide-react";
import { AvatarConfig, DetectionResult, LogEntry, HairStyle } from "./types";
import { StudioMode } from "./types/mutation";
import ThreeCanvas from "./components/ThreeCanvas";
import StudioLogs from "./components/StudioLogs";
import MutationFlow from "./components/MutationFlow";
import ModeSelect from "./components/ModeSelect";
import PhotoPipeline from "./components/PhotoPipeline";
import AvatarEditor from "./components/AvatarEditor";
import MutationLab from "./components/MutationLab";
import SpecimenVault from "./components/SpecimenVault";
import Guidebook, { WikiTab } from "./components/Guidebook";
import ExportPanel from "./components/ExportPanel";
import MorphOverlay from "./components/MorphOverlay";
import { prepareFaceTexture } from "./utils/texturePreparer";
import { estimateFaceBox } from "./utils/faceDetector";
import { playSynthSound } from "./utils/playSynthSound";
import { PRESET_HEROES, PresetHero } from "./constants/presets";
import { useMutationEngine } from "./hooks/useMutationEngine";
import { useAvatarExport } from "./hooks/useAvatarExport";
import genieMascotIcon from "./assets/genie-mascot.png";
import glbLogo from "./assets/glb-logo.png";
import * as THREE from "three";

// Re-export for any external importers that used App's synth helper
export { playSynthSound } from "./utils/playSynthSound";

export default function App() {
  // Spooky Halloween music states & references
  const spookyAudioContextRef = useRef<AudioContext | null>(null);
  const spookySequenceIdRef = useRef<number | null>(null);
  const [spookyMusicPlaying, setSpookyMusicPlaying] = useState(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (spookySequenceIdRef.current) {
        clearTimeout(spookySequenceIdRef.current);
      }
      if (spookyAudioContextRef.current) {
        try {
          spookyAudioContextRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  const playSpookyNote = (ctx: AudioContext, freq: number, time: number, duration: number, type: OscillatorType = "sine") => {
    try {
      if (!ctx || ctx.state === "closed") return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      
      // High-pitched theremin vibrato
      if (type === "sine" && freq > 400) {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 5.5; // Vibrato rate
        lfoGain.gain.value = 8.0; // Vibrato depth
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(time);
        lfo.stop(time + duration);
      }

      gain.gain.setValueAtTime(0.0, time);
      gain.gain.linearRampToValueAtTime(type === "sawtooth" ? 0.015 : 0.045, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    } catch (err) {
      console.warn("Spooky note playback prevented due to context closure or audio block:", err);
    }
  };

  const handleToggleSpookyMusic = () => {
    if (spookyMusicPlaying) {
      if (spookySequenceIdRef.current) {
        clearTimeout(spookySequenceIdRef.current);
        spookySequenceIdRef.current = null;
      }
      if (spookyAudioContextRef.current) {
        try {
          spookyAudioContextRef.current.close();
        } catch (e) {}
        spookyAudioContextRef.current = null;
      }
      setSpookyMusicPlaying(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        spookyAudioContextRef.current = ctx;
        setSpookyMusicPlaying(true);
        
        // Classic eerie melodic sequence (John Carpenter styled 5/4 meter theme arpeggio)
        const notesBar1 = [554.37, 739.99, 739.99, 554.37, 739.99, 739.99, 554.37, 739.99, 587.33, 739.99]; // F# minor style
        const notesBar2 = [493.88, 659.25, 659.25, 493.88, 659.25, 659.25, 493.88, 659.25, 523.25, 659.25]; // E minor spooky style
        const notesBar3 = [466.16, 622.25, 622.25, 466.16, 622.25, 622.25, 466.16, 622.25, 493.88, 622.25]; // D# dim style
        
        let noteIndex = 0;
        const noteInterval = 0.16; // 160ms per note
        const totalNotesPerBar = 10;
        
        const playNextSpookyNote = () => {
          if (!spookyAudioContextRef.current) return;
          const currentCtx = spookyAudioContextRef.current;
          const time = currentCtx.currentTime;
          
          const bar = Math.floor(noteIndex / totalNotesPerBar);
          const indexInBar = noteIndex % totalNotesPerBar;
          
          let noteFreq = 0;
          let bassFreq = 0;
          
          if (bar % 3 === 0) {
            noteFreq = notesBar1[indexInBar];
            bassFreq = 92.50; // F#2
          } else if (bar % 3 === 1) {
            noteFreq = notesBar2[indexInBar];
            bassFreq = 82.41; // E2
          } else {
            noteFreq = notesBar3[indexInBar];
            bassFreq = 77.78; // D#2
          }
          
          // Play melody
          playSpookyNote(currentCtx, noteFreq, time, 0.25, "sine");
          
          // High chime overlay
          if (indexInBar === 0) {
            playSpookyNote(currentCtx, noteFreq * 2, time, 0.7, "triangle");
          }
          
          // Low creepy bass drone
          if (indexInBar === 0 || indexInBar === 5) {
            playSpookyNote(currentCtx, bassFreq, time, 0.75, "sawtooth");
          }
          
          noteIndex++;
          spookySequenceIdRef.current = window.setTimeout(playNextSpookyNote, noteInterval * 1000);
        };
        
        playNextSpookyNote();
      } catch (err) {
        console.warn("Blocked starting spooky theme player:", err);
      }
    }
  };

  // 1. App State
  const [characterName, setCharacterName] = useState("");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Product mode: landing select vs Create From Photo vs Mutation Lab
  const [studioMode, setStudioMode] = useState<StudioMode>("select");

  // Pipeline steps status
  const [currentStep, setCurrentStep] = useState<"upload" | "texture" | "mesh" | "glb" | "ready">("upload");
  const [showFlash, setShowFlash] = useState(false);
  const [brightnessLevel, setBrightnessLevel] = useState<"standard" | "low" | "high" | "overdrive">("standard");

  // Blender-style Workspace active tab
  const [editorTab, setEditorTab] = useState<"parts" | "transforms" | "materials" | "scene" | "camera">("parts");

  // Interactive 3D Step-by-Step Directives guide stage
  const [guideStage, setGuideStage] = useState<number>(0);

  // Interactive documentation and workflow guide active tab
  const [wikiTab, setWikiTab] = useState<WikiTab>("quickstart");

  // Avatar Configuration
  const [config, setConfig] = useState<AvatarConfig>({
    name: "",
    skinColor: "#e5a65d",
    hairColor: "#211510",
    clothingColor: "#1e3a8a",
    pantsColor: "#111827",
    shoesColor: "#ffffff",
    hairStyle: "short",
    bodyType: "normal",
    headShape: "organic-smooth",
    detailLevel: "medium",
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

    // Manual armature bones defaults
    poseHeadYaw: 0,
    poseHeadPitch: 0,
    poseLeftArmRotationX: 0,
    poseLeftArmRotationZ: -5,
    poseRightArmRotationX: 0,
    poseRightArmRotationZ: 5,
    poseLeftLegRotationX: 0,
    poseRightLegRotationX: 0,

    // Snapchat Lenses & Camera Studio default state
    activeLens: "none",
    photoCaption: "",
    photoCaptionEmoji: "",
    storyFrameStyle: "none",
    bigHeadFactor: 0.0,
    colorFilterPreset: "none",
    meltPreset: "slime",
    meltViscosity: 0.5,
  });

  // Physics bounce timer trigger
  const [bounceTime, setBounceTime] = useState<number>(0);

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
  const [meltActive, setMeltActive] = useState(false);

  // Mutation engine (vault, chaos, breeding) — see hooks/useMutationEngine
  // Refs for Image element and exported group
  const imageRef = useRef<HTMLImageElement | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const meltdownTimerRef = useRef<number | null>(null);
  const genieMascotImgRef = useRef<HTMLImageElement | null>(null);

  // 2. Logging helper — memoized so hooks that depend on it (e.g. the
  // auto-mutation loop) don't get a new function identity on every render.
  const addLog = useCallback((text: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        text,
        type,
      },
    ]);
  }, []);

  const {
    chaosIntensity,
    setChaosIntensity,
    autoMutationActive,
    setAutoMutationActive,
    showMutationFlow,
    setShowMutationFlow,
    lastMutationSummary,
    mutationVault,
    setMutationVault,
    splicerParents,
    setSplicerParents,
    handleApplyGuidedMutation,
    handleChaosMutation,
    handleFuseGenomes,
    toggleParentSelection,
  } = useMutationEngine(config, setConfig, setCharacterName, addLog);

  const { handleDownloadGLB, handleDownloadTexture } = useAvatarExport(
    avatarGroupRef,
    faceCanvas,
    characterName,
    addLog
  );

  // Auto-Mutation Chrono-Loop
  useEffect(() => {
    if (!autoMutationActive) return;
    handleChaosMutation();
    const interval = setInterval(() => {
      handleChaosMutation();
    }, 2200);
    return () => clearInterval(interval);
  }, [autoMutationActive, chaosIntensity, handleChaosMutation]);


  // Tab Selection with smooth scrolling
  const handleTabSelection = (tab: "parts" | "transforms" | "materials" | "scene" | "camera") => {
    setEditorTab(tab);
  };

  // Mutation handlers live in useMutationEngine (wired below after config state)

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

  // Preload genie mascot caption image so it's ready to bake into snap exports
  useEffect(() => {
    const img = new Image();
    img.src = genieMascotIcon;
    genieMascotImgRef.current = img;
  }, []);

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

  // Auto-mutation loop re-attached after mutation hook wire-up

  useEffect(() => {
    return () => {
      if (meltdownTimerRef.current) {
        window.clearInterval(meltdownTimerRef.current);
      }
    };
  }, []);

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
      // Reset crop/box state so the new photo doesn't inherit the previous one's manual framing
      setFaceBox(null);
      setFaceCanvas(null);
      setIsSuccess(false);
      setCurrentStep("texture");
      setConfig((prev) => ({
        ...prev,
        creatureVariant: "none",
        photoMorphProgress: 1.0,
        cropX: 0,
        cropY: 0,
        cropScale: 1.0,
      }));
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
    const defaults = {
      skin_tone: "#e5a65d",
      hair_color: "#211510",
      clothing_color: "#1e3a8a",
      gender_style: "short" as HairStyle,
    };

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return defaults;

      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);

      const rgbToHex = (r: number, g: number, b: number) => {
        return (
          "#" +
          [r, g, b]
            .map((x) => {
              const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
              return hex.length === 1 ? "0" + hex : hex;
            })
            .join("")
        );
      };

      // Average a block of pixels (more stable than a single sample)
      const averageRegion = (x0: number, y0: number, w: number, h: number) => {
        const data = ctx.getImageData(
          Math.max(0, x0),
          Math.max(0, y0),
          Math.min(w, 100 - x0),
          Math.min(h, 100 - y0)
        ).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
        if (n === 0) return { r: 128, g: 128, b: 128, lum: 128 };
        r /= n;
        g /= n;
        b /= n;
        return { r, g, b, lum: 0.2126 * r + 0.7152 * g + 0.0722 * b };
      };

      // Skin: sample cheeks & forehead (avoiding dark eyes/eyebrows/shadows)
      const candidates = [
        averageRegion(56, 46, 12, 12), // Right cheek
        averageRegion(32, 46, 12, 12), // Left cheek
        averageRegion(42, 28, 16, 10), // Forehead
        averageRegion(42, 42, 16, 16), // Central face
      ];

      let skin_tone = defaults.skin_tone;
      for (const cand of candidates) {
        if (cand.lum > 65 && cand.r > cand.g && cand.g > cand.b * 0.75) {
          skin_tone = rgbToHex(cand.r, cand.g, cand.b);
          break;
        }
      }

      // Hair: upper band
      const hair = averageRegion(35, 8, 30, 14);
      // Avoid mistaking bright background for hair
      const hair_color =
        hair.lum > 220
          ? defaults.hair_color
          : rgbToHex(hair.r, hair.g, hair.b);

      // Clothing: lower torso band — skip near-black / near-white (backdrop / voids)
      // that otherwise paint the entire mesh as a silhouette.
      const clothing = averageRegion(30, 78, 40, 16);
      let clothing_color: string;
      if (clothing.lum < 18 || clothing.lum > 245) {
        clothing_color = defaults.clothing_color;
      } else {
        clothing_color = rgbToHex(clothing.r, clothing.g, clothing.b);
      }

      return {
        skin_tone,
        hair_color,
        clothing_color,
        gender_style: "short",
      };
    } catch (e) {
      console.warn("Could not read image pixels client-side, defaulting to standard colors.", e);
      return defaults;
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

      // Apply detected values - First set the face box to trigger texture creation
      setFaceBox(result.face_box);
      
      // Wait for face texture to be prepared before updating config
      // This ensures the avatar is built with the photo texture
      setTimeout(() => {
        setConfig((prev) => ({
          ...prev,
          creatureVariant: "none",
          photoMorphProgress: 1.0,
          skinColor: result.skin_tone || prev.skinColor,
          hairColor: result.hair_color || prev.hairColor,
          clothingColor: result.clothing_color || prev.clothingColor,
          hairStyle: (result.gender_style as HairStyle) || prev.hairStyle,
          faceShape: result.face_shape,
          noseSize: result.nose_size,
          noseWidth: result.nose_width,
          jawWidth: result.jaw_width,
          chinShape: result.chin_shape,
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
      }, 100);
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

        // Estimate the actual face region from skin-toned pixels; only fall
        // back to a fixed center box if no confident skin blob is found.
        const estimatedBox = estimateFaceBox(imageRef.current);
        const localBox: [number, number, number, number] = estimatedBox || [20, 20, 80, 80];
        addLog(
          estimatedBox
            ? "Estimated face region from photo (client-side heuristic)."
            : "Could not confidently locate a face — using centered default crop.",
          estimatedBox ? "success" : "warning"
        );
        setFaceBox(localBox);
        
        // Wait for face texture to be prepared before updating config
        setTimeout(() => {
          setConfig((prev) => ({
            ...prev,
            creatureVariant: "none",
            photoMorphProgress: 1.0,
            skinColor: result.skin_tone,
            hairColor: result.hair_color,
            clothingColor: result.clothing_color,
            hairStyle: result.gender_style,
            faceShape: "oval",
            noseSize: "medium",
            noseWidth: "medium",
            jawWidth: "medium",
            chinShape: "rounded",
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
        }, 100);
      } catch (localErr: any) {
        setIsProcessing(false);
        addLog(`Local analysis failed: ${localErr.message}`, "error");
      }
    }
  };

  // Export handlers from useAvatarExport (wired below)

  const handleCycleBrightness = () => {
    const sequence: Array<{
      level: "low" | "standard" | "high" | "overdrive";
      ambient: number;
      key: number;
    }> = [
      { level: "low", ambient: 0.35, key: 0.45 },
      { level: "standard", ambient: 0.75, key: 0.85 },
      { level: "high", ambient: 1.35, key: 1.45 },
      { level: "overdrive", ambient: 1.95, key: 1.95 },
    ];

    const currentIndex = sequence.findIndex((entry) => entry.level === brightnessLevel);
    const next = sequence[(currentIndex + 1) % sequence.length];

    setBrightnessLevel(next.level);
    setConfig((prev) => ({
      ...prev,
      ambientIntensity: next.ambient,
      keyLightIntensity: next.key,
    }));
    addLog(`[LIGHTING] Set brightness preset to ${next.level.toUpperCase()}.`, "info");
    playSynthSound("zap");
  };

  const handleTriggerMeltdown = (preset: "slime" | "gold" | "acid" | "lava" = "slime") => {
    if (meltdownTimerRef.current) {
      window.clearInterval(meltdownTimerRef.current);
    }

    const viscosity = config.meltViscosity ?? 0.5;
    const stepSpeed = 0.01 + viscosity * 0.03;

    setConfig((prev) => ({
      ...prev,
      isMelting: true,
      meltProgress: 0,
      meltPreset: preset,
    }));
    setMeltActive(true);
    addLog(`[MELTDOWN] Reactor engaged: ${preset.toUpperCase()} profile.`, "warning");
    playSynthSound("boom");

    let progress = 0;
    meltdownTimerRef.current = window.setInterval(() => {
      progress = Math.min(1, progress + stepSpeed);

      setConfig((prev) => ({
        ...prev,
        meltProgress: progress,
      }));

      if (progress >= 1) {
        if (meltdownTimerRef.current) {
          window.clearInterval(meltdownTimerRef.current);
          meltdownTimerRef.current = null;
        }

        window.setTimeout(() => {
          setConfig((prev) => ({
            ...prev,
            isMelting: false,
            meltProgress: 0,
          }));
          setMeltActive(false);
          addLog("[MELTDOWN] Splice cycle complete. Geometry re-solidified.", "success");
          playSynthSound("coin");
        }, 700);
      }
    }, 30);
  };

  // 8. Snapchat Shutter Snap Capture & Compositer
  const handleTakeSnap = () => {
    // Synth shutter trigger using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playClick = (time: number, freq: number, dur: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(80, time + dur);
        
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.linearRampToValueAtTime(0.001, time + dur);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + dur);
      };
      
      const now = audioCtx.currentTime;
      playClick(now, 1100, 0.05); // High crisp mirror-up sound
      playClick(now + 0.06, 600, 0.12); // Deep shutter-closing curtain release
    } catch (soundErr) {
      console.warn("Audio Context block or unsupported browser: ", soundErr);
    }

    // Trigger active flash overlay
    setShowFlash(true);
    setTimeout(() => {
      setShowFlash(false);
    }, 250);

    // Locate live WebGL rendering canvas
    const canvas = document.querySelector("#preview-panel canvas") as HTMLCanvasElement;
    if (!canvas) {
      addLog("Unable to identify current WebGL renderer context.", "error");
      return;
    }

    try {
      addLog("Taking high-fidelity snap... Processing VFX layers...", "info");
      
      // Create high resolution Composite Canvas to bake overlays
      const compositeCanvas = document.createElement("canvas");
      compositeCanvas.width = canvas.width;
      compositeCanvas.height = canvas.height;
      const ctx = compositeCanvas.getContext("2d");
      
      if (!ctx) {
        addLog("Composite pipeline initialization failed.", "error");
        return;
      }

      // Draw original WebGL frame with simulated filters inside canvas 2D
      ctx.save();
      
      // Map color filters safely
      if (config.colorFilterPreset === "retro") {
        ctx.filter = "sepia(0.2) contrast(1.2) saturate(1.4) brightness(0.95)";
      } else if (config.colorFilterPreset === "cyber") {
        ctx.filter = "hue-rotate(270deg) saturate(1.8) contrast(1.1)";
      } else if (config.colorFilterPreset === "sepia") {
        ctx.filter = "sepia(0.85) contrast(0.9) brightness(0.9)";
      } else if (config.colorFilterPreset === "pink-glow") {
        ctx.filter = "hue-rotate(320deg) brightness(1.1) saturate(1.3)";
      } else if (config.colorFilterPreset === "glitch") {
        ctx.filter = "contrast(1.5) saturate(1.5) brightness(1.1)";
      }
      
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();

      const w = compositeCanvas.width;
      const h = compositeCanvas.height;

      // Render Framings
      if (config.storyFrameStyle === "polaroid") {
        const borderSize = Math.min(w, h) * 0.08;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = borderSize;
        ctx.strokeRect(borderSize / 2, borderSize / 2, w - borderSize, h - borderSize);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, h - borderSize * 2.2, w, borderSize * 2.2);

        // Name sticker
        ctx.fillStyle = "#1e293b";
        ctx.font = `italic bold ${Math.round(borderSize * 0.75)}px Georgia, serif`;
        ctx.textAlign = "center";
        ctx.fillText(characterName || "Specimen", w / 2, h - borderSize * 0.8);
      }

      if (config.storyFrameStyle === "story") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.font = `bold ${Math.round(w * 0.035)}px monospace`;
        ctx.textAlign = "left";
        ctx.fillText("📍 MUTANT WORKSPACE", w * 0.05, h * 0.08);

        ctx.textAlign = "right";
        ctx.fillText("⚡ 24 KM/H", w * 0.95, h * 0.08);

        ctx.textAlign = "center";
        ctx.font = `bold ${Math.round(w * 0.065)}px sans-serif`;
        ctx.fillText("15:41 PM", w / 2, h * 0.16);
      }

      if (config.storyFrameStyle === "cinematic") {
        const barH = h * 0.12;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, w, barH);
        ctx.fillRect(0, h - barH, w, barH);

        ctx.fillStyle = "#fbbf24"; // yellow subtitles font
        ctx.font = `bold ${Math.round(h * 0.032)}px Courier, monospace`;
        ctx.textAlign = "center";
        ctx.fillText(`[VOX-RIG SYSTEM // MODEL: ${(characterName || "specimen").toUpperCase()}]`, w / 2, h - barH * 0.45);
      }

      // Draw Caption Bar
      if (config.photoCaption) {
        const barH = h * 0.08;
        const barY = h * 0.70;
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, barY, w, barH);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${Math.round(barH * 0.40)}px sans-serif`;
        ctx.textAlign = "center";

        const isGenieMascot = config.photoCaptionEmoji === "GENIE_MASCOT";
        const emojiPrefix = config.photoCaptionEmoji && !isGenieMascot ? `${config.photoCaptionEmoji} ` : "";
        const captionText = `${emojiPrefix}${config.photoCaption}`.trim();

        if (isGenieMascot && genieMascotImgRef.current?.complete) {
          const iconSize = barH * 0.55;
          const textWidth = ctx.measureText(captionText).width;
          const groupHalfWidth = textWidth / 2 + iconSize * 0.7;
          ctx.drawImage(genieMascotImgRef.current, w / 2 - groupHalfWidth, barY + barH * 0.22, iconSize, iconSize);
          ctx.fillText(captionText, w / 2 + iconSize * 0.35, barY + barH * 0.62);
        } else {
          ctx.fillText(captionText, w / 2, barY + barH * 0.62);
        }
      }

      // Auto download composite canvas
      const link = document.createElement("a");
      const safeName = (characterName || "specimen").toLowerCase().replace(/\s+/g, "_");
      link.download = `${safeName}_snap.png`;
      link.href = compositeCanvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addLog(`📸 Captured custom photo snap: ${safeName}_snap.png`, "success");
    } catch (snapErr: any) {
      addLog(`Photo capture failed: ${snapErr.message}`, "error");
    }
  };

  // Reset configuration to defaults
  const handleResetDefaults = () => {
    if (meltdownTimerRef.current) {
      window.clearInterval(meltdownTimerRef.current);
      meltdownTimerRef.current = null;
    }

    setConfig({
      name: "",
      skinColor: "#e5a65d",
      hairColor: "#211510",
      clothingColor: "#1e3a8a",
      pantsColor: "#111827",
      shoesColor: "#ffffff",
      hairStyle: "short",
      bodyType: "normal",
      headShape: "organic-smooth",
      detailLevel: "medium",
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
      meltPreset: "slime",
      meltViscosity: 0.5,
    });
    setBrightnessLevel("standard");
    setMeltActive(false);
    setEditorTab("parts");
    addLog("Customizer configurations and workspace tabs reset to defaults.", "info");
    playSynthSound("jump");
  };

  // Load preset character template
  const handleLoadPreset = (hero: PresetHero) => {
    if (meltdownTimerRef.current) {
      window.clearInterval(meltdownTimerRef.current);
      meltdownTimerRef.current = null;
    }

    setCharacterName(hero.name);
    setConfig((prev) => ({
      ...prev,
      ...hero.config,
      name: hero.name,
      isMelting: false,
      meltProgress: 0,
    }));
    setMeltActive(false);
    setIsSuccess(true);
    setCurrentStep((prev) => (prev === "upload" ? "ready" : prev));
    addLog(`[GALLERY] Loaded premium character blueprint: ${hero.name.toUpperCase()}`, "success");
    playSynthSound("arp");
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
        "Click 'Export Final GLB' for a poseable mesh hierarchy with PBR materials (viewport animations are not baked into the file).",
      ],
      tip: "💡 PRO TIP: Exports are binary glTFs with materials and hierarchy — re-rig externally if you need skinned AnimationClips.",
      actionText: "Open Scene Tab",
      action: () => {
        setEditorTab("scene");
        const el = document.getElementById("customization-panel");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
  ];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-[#141414] selection:text-[#E4E3E0] ${
        studioMode === "select"
          ? "app-shell-select border-0 text-[#E4E3E0]"
          : "border-[12px] md:border-[16px] border-[#141414] bg-[#E4E3E0] text-[#141414]"
      }`}
      id="app-root-container"
    >
      <MorphOverlay active={isProcessing} characterName={characterName} />

      {/* HEADER BAR */}
      <header
        className={`flex flex-col sm:flex-row shrink-0 items-center justify-between border-b-2 border-[#141414] sticky top-0 z-50 gap-4 px-6 py-3 ${
          studioMode === "select"
            ? "bg-gradient-to-r from-[#1a0f2e] via-[#141414] to-[#0c1a22] text-[#E4E3E0]"
            : "bg-[#141414] text-[#E4E3E0]"
        }`}
      >
        <div className="flex items-center gap-4">
          <img
            src={glbLogo}
            alt="GLB Factory logo"
            className="w-10 h-10 rounded-none border-2 border-lime-400/50 object-cover shrink-0 shadow-[0_0_12px_rgba(132,204,22,0.45)]"
            id="app-header-logo"
          />
          <div>
            <h1 className="font-mono text-sm font-bold tracking-widest uppercase flex items-center gap-2 text-white">
              GLB Factory
              <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse inline-block shadow-[0_0_8px_#84cc16]"></span>
            </h1>
            <p className="font-mono text-[9px] opacity-70">
              {studioMode === "select"
                ? "PHOTO → 3D · MUTATE · EXPORT // BOB IBM CHALLENGE"
                : `v1.0.0-RELEASE // ${typeof window !== "undefined" ? window.location.hostname.toUpperCase() : "LOCALHOST"}`}
            </p>
          </div>
        </div>

        {/* Quick Stats/Indicators */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-[10px] uppercase tracking-tighter text-white">
          {/* Spooky Halloween Theme Music Button */}
          <button
            onClick={handleToggleSpookyMusic}
            className={`px-3 py-1.5 border-2 rounded-none font-bold uppercase tracking-wider text-[9px] flex items-center gap-2 transition-all duration-300 ${
              spookyMusicPlaying
                ? "bg-orange-500 text-black border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                : "bg-transparent text-white/80 border-white/20 hover:border-orange-500 hover:text-orange-400"
            }`}
            title="Listen to spooky high-pitch retro arpeggios & sub-bass drones"
            id="spooky-halloween-music-toggle"
          >
            <span className={`inline-block ${spookyMusicPlaying ? "animate-spin" : ""}`}>🎃</span>
            <span>{spookyMusicPlaying ? "SPOOKY THEME: ON 👻" : "PLAY SPOOKY MUSIC 🦇"}</span>
          </button>

          <div className="flex gap-3 opacity-80">
            <span className="text-cyan-300">CPU: 42%</span>
            <span className="text-fuchsia-300">MEM: 1.2GB</span>
            <span className="text-lime-300">GPU: THREE.JS</span>
          </div>
          <div className="border-l border-[#E4E3E0]/20 pl-4 opacity-75 hidden md:block text-cyan-200/80">
            ENGINE // GEMINI + CLIENT FALLBACK
          </div>
        </div>
      </header>

      {/* CORE CONTENT */}
      <main
        className={`flex-1 w-full mx-auto space-y-6 ${
          studioMode === "select"
            ? "max-w-6xl p-3 md:p-6"
            : "max-w-7xl p-4 md:p-8"
        }`}
      >
        {/* PIPELINE STUDIO STATUS BAR — colorful on select, step-lit when building */}
        {studioMode !== "select" && (
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-2 border-2 border-[#141414] p-2 rounded-none text-center text-xs font-mono select-none bg-gradient-to-r from-cyan-100 via-fuchsia-100 to-lime-100"
          id="pipeline-status-bar"
        >
          <div
            className={`py-2 px-3 rounded-none flex items-center justify-center gap-2 transition-all duration-300 border ${
              sourceImage
                ? "bg-cyan-500 text-white border-cyan-700 shadow-[2px_2px_0px_0px_#141414]"
                : "bg-white/50 text-[#141414]/40 border-transparent"
            }`}
          >
            <span className="w-5 h-5 rounded-none border border-current flex items-center justify-center text-[10px] font-bold">01</span>
            <span className="font-bold tracking-wider">PORTRAIT</span>
          </div>
          <div
            className={`py-2 px-3 rounded-none flex items-center justify-center gap-2 transition-all duration-300 border ${
              currentStep === "texture" || currentStep === "mesh" || currentStep === "glb" || currentStep === "ready"
                ? "bg-fuchsia-500 text-white border-fuchsia-700 shadow-[2px_2px_0px_0px_#141414]"
                : "bg-white/50 text-[#141414]/40 border-transparent"
            }`}
          >
            <span className="w-5 h-5 rounded-none border border-current flex items-center justify-center text-[10px] font-bold">02</span>
            <span className="font-bold tracking-wider">FACE_TEX</span>
          </div>
          <div
            className={`py-2 px-3 rounded-none flex items-center justify-center gap-2 transition-all duration-300 border ${
              currentStep === "mesh" || currentStep === "glb" || currentStep === "ready"
                ? "bg-lime-500 text-[#141414] border-lime-700 shadow-[2px_2px_0px_0px_#141414]"
                : "bg-white/50 text-[#141414]/40 border-transparent"
            }`}
          >
            <span className="w-5 h-5 rounded-none border border-current flex items-center justify-center text-[10px] font-bold">03</span>
            <span className="font-bold tracking-wider">AVATAR_MSH</span>
          </div>
          <div
            className={`py-2 px-3 rounded-none flex items-center justify-center gap-2 transition-all duration-300 border ${
              currentStep === "glb" || currentStep === "ready"
                ? "bg-amber-400 text-[#141414] border-amber-600 shadow-[2px_2px_0px_0px_#141414]"
                : "bg-white/50 text-[#141414]/40 border-transparent"
            }`}
          >
            <span className="w-5 h-5 rounded-none border border-current flex items-center justify-center text-[10px] font-bold">04</span>
            <span className="font-bold tracking-wider">EXPORT</span>
          </div>
        </div>
        )}

        {/* Mode switcher — always visible once a mode is chosen */}
        {studioMode !== "select" && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-[#141414] bg-white/60 p-2 font-mono text-[10px] uppercase font-bold" id="mode-switcher-bar">
            <div className="flex items-center gap-2">
              <span className="bg-[#141414] text-white px-2 py-1">
                Mode: {studioMode === "create" ? "Create From Photo" : "Mutation Lab"}
              </span>
              <button
                type="button"
                onClick={() => setStudioMode("select")}
                className="border border-[#141414] px-2 py-1 hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
              >
                Change mode
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStudioMode("create")}
                className={`border border-[#141414] px-2 py-1 cursor-pointer ${studioMode === "create" ? "bg-sky-200" : "bg-white hover:bg-sky-50"}`}
              >
                Create From Photo
              </button>
              <button
                type="button"
                onClick={() => setStudioMode("mutate")}
                className={`border border-[#141414] px-2 py-1 cursor-pointer ${studioMode === "mutate" ? "bg-emerald-200" : "bg-white hover:bg-emerald-50"}`}
              >
                Mutation Lab
              </button>
            </div>
          </div>
        )}

        {studioMode === "select" && (
          <ModeSelect onSelect={(mode) => setStudioMode(mode)} />
        )}


        {studioMode !== "select" && (
        <>
        {/* ==========================================
            🌟 PREMIUM ENTERPRISE HERO GALLERY (PRESETS)
           ========================================== */}
        <section className="bg-white/40 border-2 border-[#141414] p-4 space-y-3 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#141414]/15 pb-2 gap-2">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>PREMIUM ENTERPRISE CHARACTERS & BLUEPRINTS</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono bg-emerald-500 text-[#141414] px-1.5 py-0.5 font-bold uppercase">5 RIG PRESETS LOADED</span>
              <span className="text-[8px] font-mono bg-[#141414] text-white px-1.5 py-0.5 font-bold uppercase">v1.0-RELEASE</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {PRESET_HEROES.map((hero) => {
              const isSelected = characterName === hero.name;
              return (
                <button
                  type="button"
                  key={hero.name}
                  onClick={() => handleLoadPreset(hero)}
                  className={`border-2 p-3 text-left transition-all relative overflow-hidden flex flex-col justify-between group rounded-none select-none ${
                    isSelected
                      ? "bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[1px_1px_0px_0px_#141414]"
                      : "bg-white/60 text-[#141414] border-[#141414] hover:bg-white shadow-[3px_3px_0px_0px_#141414] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#141414]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-2xl filter drop-shadow-[1px_1px_0px_rgba(0,0,0,0.15)] group-hover:scale-110 transition-transform duration-200">{hero.emoji}</span>
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                  </div>
                  <div className="mt-4 space-y-0.5">
                    <div className="text-[10px] font-extrabold font-mono tracking-wide uppercase truncate">{hero.name}</div>
                    <div className={`text-[8px] font-mono uppercase tracking-widest ${isSelected ? "text-amber-400 font-bold" : "text-[#141414]/60"}`}>
                      {hero.badge}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

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

            {studioMode === "create" && (
            <PhotoPipeline
              characterName={characterName}
              setCharacterName={setCharacterName}
              config={config}
              setConfig={setConfig}
              sourceImage={sourceImage}
              faceBox={faceBox}
              setFaceBox={setFaceBox}
              imageRef={imageRef}
              isDraggingFile={isDraggingFile}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleFileChange={handleFileChange}
              handleBuildAvatar={handleBuildAvatar}
              isProcessing={isProcessing}
              updateFaceTexture={updateFaceTexture}
              faceCanvas={faceCanvas}
            />
            )}

            <section className="bg-yellow-50/85 border-2 border-[#141414] rounded-none p-5 space-y-4 shadow-[4px_4px_0px_0px_#141414]" id="meltdown-factory-panel">
                <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-yellow-300 flex items-center justify-between">
                  <h2 className="font-sans text-[11px] font-black text-[#141414] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-[14px]">☣</span>
                    <span>Meltdown Factory</span>
                  </h2>
                  <span className="text-[9px] font-mono font-bold bg-[#141414] text-yellow-300 px-1.5 py-0.5 uppercase tracking-tight">
                    Image Splicer
                  </span>
                </div>

                <p className="text-[11px] text-[#141414]/85 leading-relaxed font-sans">
                  Trigger a melt pass that collapses the rig into a pooled splice effect, then solidifies it back into the avatar.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-[#141414]/70 uppercase">Select Melting Agent</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "slime", label: "Toxic Slime", desc: "Radioactive plasma drip" },
                      { id: "gold", label: "Liquid Gold", desc: "Molten premium metal" },
                      { id: "acid", label: "Bio Acid", desc: "Corrosive neon sludge" },
                      { id: "lava", label: "Volcanic Lava", desc: "Fiery magma puddle" },
                    ].map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, meltPreset: agent.id as AvatarConfig["meltPreset"] }))}
                        className={`text-left p-2 rounded-none border-2 border-[#141414] transition-all duration-150 cursor-pointer ${
                          (config.meltPreset || "slime") === agent.id
                            ? "bg-[#141414] text-white shadow-none"
                            : "bg-white text-[#141414] shadow-[2px_2px_0px_0px_#141414] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#141414]"
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase">{agent.label}</div>
                        <div className={`text-[8px] mt-0.5 ${(config.meltPreset || "slime") === agent.id ? "text-white/60" : "text-neutral-500"}`}>
                          {agent.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
                    <span className="uppercase">Reactor Viscosity</span>
                    <span>{Math.round((config.meltViscosity || 0.5) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={config.meltViscosity || 0.5}
                    onChange={(e) => setConfig((prev) => ({ ...prev, meltViscosity: parseFloat(e.target.value) }))}
                    className="w-full accent-[#141414] h-1.5 bg-[#D4D3D0] rounded-none cursor-pointer"
                  />
                </div>

                {meltActive && (
                  <div className="p-3 bg-[#141414] text-white rounded-none border-2 border-[#141414] font-mono text-[10px] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400 font-bold uppercase tracking-wider animate-pulse">Melting Geometry...</span>
                      <span>{Math.round((config.meltProgress || 0) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-800 rounded-none overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 transition-all duration-100"
                        style={{ width: `${(config.meltProgress || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={meltActive}
                  onClick={() => handleTriggerMeltdown(config.meltPreset || "slime")}
                  className={`w-full py-2.5 px-4 font-mono text-xs font-black tracking-wider transition-all duration-300 flex items-center justify-center gap-2 uppercase select-none rounded-none border-2 border-[#141414] ${
                    meltActive
                      ? "bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none"
                      : "bg-red-500 text-white hover:bg-red-600 hover:translate-x-[2px] hover:translate-y-[2px] shadow-[3px_3px_0px_0px_#141414] hover:shadow-[1px_1px_0px_0px_#141414] cursor-pointer"
                  }`}
                >
                  <span>{meltActive ? "Splicing in progress..." : "Trigger Meltdown Transition"}</span>
                </button>
              </section>

            <AvatarEditor
              config={config}
              setConfig={setConfig}
              editorTab={editorTab}
              handleTabSelection={handleTabSelection}
              handleResetDefaults={handleResetDefaults}
              handleTakeSnap={handleTakeSnap}
              addLog={addLog}
            />
          </div>

          {/* RIGHT PANEL: LIVE 3D PREVIEW AND EXPORT TERMINAL (LG: 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 3D PREVIEW BLOCK */}
            <section className="bg-white/40 border-2 border-[#141414] rounded-none p-5 space-y-4 relative shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:z-20" id="preview-panel">
              <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-[#D4D3D0] flex items-center justify-between">
                <h2 className="font-serif text-[11px] italic text-[#141414]/80 uppercase font-bold tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>04 // 3D Render Viewport</span>
                </h2>

                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#141414]">
                  <button
                    type="button"
                    onClick={handleCycleBrightness}
                    title={`Cycle brightness levels (Current: ${brightnessLevel.toUpperCase()})`}
                    className="flex items-center gap-1 border-2 border-[#141414] bg-neutral-100 hover:bg-neutral-200 text-[#141414] px-2 py-0.5 font-bold uppercase tracking-wide select-none cursor-pointer text-[9px] shadow-[1px_1px_0px_0px_rgba(20,20,20,0.15)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                  >
                    <span>Light: {brightnessLevel.toUpperCase()}</span>
                  </button>

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
              <div className="relative overflow-hidden border-2 border-[#141414] shadow-[4px_4px_0px_0px_#141414]">
                {/* Visual filter container */}
                <div className={`transition-all duration-300 w-full h-full ${
                  config.colorFilterPreset === "retro" ? "sepia-[0.2] contrast-[1.2] saturate-[1.4] brightness-[0.95]" :
                  config.colorFilterPreset === "cyber" ? "hue-rotate-[270deg] saturate-[1.8] contrast-[1.1]" :
                  config.colorFilterPreset === "sepia" ? "sepia-[0.85] contrast-[0.9] brightness-[0.9]" :
                  config.colorFilterPreset === "pink-glow" ? "hue-rotate-[320deg] brightness-[1.1] saturate-[1.3]" :
                  config.colorFilterPreset === "glitch" ? "contrast-[1.5] saturate-[1.5] brightness-[1.1]" : ""
                }`}>
                  <ThreeCanvas
                    config={config}
                    faceCanvas={faceCanvas}
                    autoRotate={autoRotate}
                    bounceTime={bounceTime}
                    onSceneReady={(group) => {
                      avatarGroupRef.current = group;
                    }}
                  />
                </div>

                {/* --- 2D FRAMING OVERLAYS --- */}
                {config.storyFrameStyle === "polaroid" && (
                  <div className="absolute inset-0 border-[20px] border-white pointer-events-none flex flex-col justify-end select-none z-10">
                    <div className="bg-white h-14 -mx-[20px] -mb-[20px] border-t border-[#141414]/10 flex flex-col items-center justify-center">
                      <span className="font-serif italic text-xs text-gray-800 tracking-wider font-bold">
                        {characterName || "Specimen"}
                      </span>
                      <span className="text-[6px] text-gray-400 font-mono tracking-widest mt-0.5">
                        POLAROID ORIGINAL // 1984
                      </span>
                    </div>
                  </div>
                )}

                {config.storyFrameStyle === "story" && (
                  <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between select-none font-sans z-10">
                    <div className="flex justify-between items-start">
                      <div className="bg-black/55 text-white text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-xs">
                        📍 MUTANT WORKSPACE
                      </div>
                      <div className="bg-black/55 text-white text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-xs">
                        ⚡ 24 KM/H
                      </div>
                    </div>
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <span className="text-white text-xl font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">15:41 PM</span>
                      <span className="text-white text-[7px] uppercase tracking-wider font-mono font-bold bg-[#D946EF] text-white px-1.5 py-0.2 mt-0.5">
                        TEMP: 24°C
                      </span>
                    </div>
                  </div>
                )}

                {config.storyFrameStyle === "cinematic" && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between select-none z-10">
                    <div className="bg-black h-8 w-full border-b border-white/5" />
                    <div className="bg-black h-8 w-full border-t border-white/5 flex items-center justify-center">
                      <span className="text-yellow-400 font-mono text-[8px] tracking-wider uppercase font-bold">
                        [VOX-RIG LAB v2.0 // SPECIMEN: {(characterName || "unnamed").toUpperCase()}]
                      </span>
                    </div>
                  </div>
                )}

                {/* Snapchat Black Caption Bar */}
                {config.photoCaption && (
                  <div className="absolute bottom-[20%] left-0 w-full bg-black/60 py-2 px-3 text-center z-10 text-white text-[10px] font-bold font-sans select-none border-y border-white/5 shadow-md flex items-center justify-center gap-1">
                    {config.photoCaptionEmoji === "GENIE_MASCOT" ? (
                      <img src={genieMascotIcon} alt="Genie mascot" className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      config.photoCaptionEmoji && <span className="text-xs">{config.photoCaptionEmoji}</span>
                    )}
                    <span>{config.photoCaption}</span>
                  </div>
                )}

                {/* Overlaid watermark / name */}
                {config.storyFrameStyle !== "polaroid" && (
                  <div className="absolute bottom-4 right-4 bg-white/90 border border-[#141414] px-3 py-1.5 rounded-none z-10 text-right select-none shadow-[2px_2px_0px_0px_#141414]">
                    <span className="text-[9px] text-[#141414]/60 block font-mono font-bold">NAME</span>
                    <span className="text-xs font-bold text-[#141414] tracking-wider font-mono uppercase">{characterName}</span>
                  </div>
                )}

                {/* Flash Transient Cover */}
                {showFlash && (
                  <div className="absolute inset-0 bg-white z-50 pointer-events-none duration-200 transition-opacity" />
                )}
              </div>

              <ExportPanel
                isSuccess={isSuccess}
                faceCanvas={faceCanvas}
                handleDownloadGLB={handleDownloadGLB}
                handleDownloadTexture={handleDownloadTexture}
              />
            </section>

            {/* ==========================================
                🔊 RETRO AUDIO SYNTHESIS SOUNDBOARD
               ========================================== */}
            <section className="bg-white/40 border-2 border-[#141414] rounded-none p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]" id="audio-soundboard-panel">
              <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-[#D4D3D0] flex items-center justify-between">
                <h2 className="font-serif text-[11px] italic text-[#141414]/80 uppercase font-bold tracking-wider flex items-center gap-2">
                  <Gamepad2 className="w-3.5 h-3.5 text-[#141414]/80" />
                  <span>05 // Retro Audio Synth & Soundboard</span>
                </h2>
                <div className="flex items-center gap-1.5 text-[8px] font-mono bg-[#141414] text-white px-2 py-0.5 uppercase font-bold tracking-widest">
                  <Volume2 className="w-2.5 h-2.5 text-emerald-400" />
                  <span>synth: active</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-mono text-[9px] text-[#141414]/75 uppercase leading-relaxed">
                  Real-time 8-Bit frequency generator using Web Audio oscillators. Click to trigger sound design presets or listen to active rigging event feedback!
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => playSynthSound("zap")}
                    className="border-2 border-[#141414] bg-white/60 hover:bg-white text-[9px] font-mono font-bold py-2 px-1 text-center shadow-[2px_2px_0px_0px_#141414] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#141414] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer rounded-none"
                  >
                    ⚡ LASER ZAP
                  </button>
                  <button
                    type="button"
                    onClick={() => playSynthSound("coin")}
                    className="border-2 border-[#141414] bg-white/60 hover:bg-white text-[9px] font-mono font-bold py-2 px-1 text-center shadow-[2px_2px_0px_0px_#141414] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#141414] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer rounded-none"
                  >
                    🪙 COIN UP
                  </button>
                  <button
                    type="button"
                    onClick={() => playSynthSound("jump")}
                    className="border-2 border-[#141414] bg-white/60 hover:bg-white text-[9px] font-mono font-bold py-2 px-1 text-center shadow-[2px_2px_0px_0px_#141414] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#141414] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer rounded-none"
                  >
                    🦘 RIG JUMP
                  </button>
                  <button
                    type="button"
                    onClick={() => playSynthSound("boom")}
                    className="border-2 border-[#141414] bg-white/60 hover:bg-white text-[9px] font-mono font-bold py-2 px-1 text-center shadow-[2px_2px_0px_0px_#141414] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#141414] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer rounded-none"
                  >
                    💥 EXPLOSION
                  </button>
                  <button
                    type="button"
                    onClick={() => playSynthSound("arp")}
                    className="border-2 border-[#141414] bg-white/60 hover:bg-white text-[9px] font-mono font-bold py-2 px-1 text-center shadow-[2px_2px_0px_0px_#141414] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#141414] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer rounded-none"
                  >
                    🎵 ARPEGGIO
                  </button>
                  <button
                    type="button"
                    onClick={() => playSynthSound("disco")}
                    className="border-2 border-[#141414] bg-pink-100 hover:bg-pink-50 text-[9px] font-mono font-bold py-2 px-1 text-center text-pink-700 border-pink-700 shadow-[2px_2px_0px_0px_#e11d48] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#e11d48] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer rounded-none"
                  >
                    🕺 DISCO JIG
                  </button>
                </div>
              </div>
            </section>

            {/* ==========================================
                📊 ENTERPRISE RIG TELEMETRY & SYSTEM ANALYTICS
               ========================================== */}
            <section className="bg-white/40 border-2 border-[#141414] rounded-none p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]" id="telemetry-panel">
              <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-[#D4D3D0] flex items-center justify-between">
                <h2 className="font-serif text-[11px] italic text-[#141414]/80 uppercase font-bold tracking-wider flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>06 // Enterprise Rig Telemetry</span>
                </h2>
                <div className="font-mono text-[8px] bg-emerald-500 text-[#141414] px-2 py-0.5 uppercase font-bold tracking-widest animate-pulse">
                  SYSTEM STATUS: OPTIMAL
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] font-mono leading-relaxed">
                {/* Visual metric 1: Voxel Resolution */}
                <div className="space-y-1 bg-white/50 border border-[#141414]/10 p-2 shadow-[1px_1px_0px_0px_rgba(20,20,20,0.05)]">
                  <div className="flex justify-between font-bold">
                    <span>VOXEL RIG RESOLUTION</span>
                    <span className="text-emerald-600">
                      {config.detailLevel === "high" ? "18,450 VX" : config.detailLevel === "low" ? "1,340 VX" : "5,120 VX"}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#141414]/10 border border-[#141414]">
                    <div
                      className="h-full bg-[#141414] transition-all duration-300"
                      style={{ width: config.detailLevel === "high" ? "100%" : config.detailLevel === "low" ? "25%" : "60%" }}
                    />
                  </div>
                  <span className="text-[8.5px] text-[#141414]/65 block leading-tight">
                    {config.detailLevel === "high" ? "Hero Poly mesh (perfect for cinematic exports)" : config.detailLevel === "low" ? "Highly compact mobile optimized skeletal structure" : "Standard gaming engine compatible grid mapping"}
                  </span>
                </div>

                {/* Visual metric 2: Rigging Integrity */}
                {(() => {
                  const isExtreme = (config.headScaleX || 1.0) > 1.35 || (config.torsoScaleX || 1.0) > 1.35 || (config.headScaleX || 1.0) < 0.65;
                  const balance = isExtreme ? 72 : 100;
                  return (
                    <div className="space-y-1 bg-white/50 border border-[#141414]/10 p-2 shadow-[1px_1px_0px_0px_rgba(20,20,20,0.05)]">
                      <div className="flex justify-between font-bold">
                        <span>RIGGING INTEGRITY</span>
                        <span className={balance < 100 ? "text-amber-600 animate-pulse font-extrabold" : "text-emerald-600"}>
                          {balance}% {balance < 100 ? "⚠️ SKEWED" : "✓ PASS"}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#141414]/10 border border-[#141414]">
                        <div
                          className={`h-full transition-all duration-300 ${balance < 100 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${balance}%` }}
                        />
                      </div>
                      <span className="text-[8.5px] text-[#141414]/65 block leading-tight">
                        {balance < 100 ? "Warning: Extreme scaling may cause block joints to clip during animations." : "Proportions are highly stable for real-time physics simulation."}
                      </span>
                    </div>
                  );
                })()}

                {/* Visual metric 3: Magic/Emissive Spell Potential */}
                <div className="space-y-1 bg-white/50 border border-[#141414]/10 p-2 shadow-[1px_1px_0px_0px_rgba(20,20,20,0.05)]">
                  {(() => {
                    const power = Math.round(((config.materialMetalness || 0) * 40) + ((config.materialEmissiveIntensity || 0) * 30) + (config.accessories?.length || 0) * 10);
                    return (
                      <>
                        <div className="flex justify-between font-bold">
                          <span>EMISSIVE SPELLCASTING LEVEL</span>
                          <span className="text-pink-600 font-extrabold">{power}W (MAX_CHRG)</span>
                        </div>
                        <div className="h-2 w-full bg-[#141414]/10 border border-[#141414]">
                          <div
                            className="h-full bg-pink-500 transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(10, power))}%` }}
                          />
                        </div>
                        <span className="text-[8.5px] text-[#141414]/65 block leading-tight">
                          Calculated from metallic reflection indices, active emissive halo factors, and spellcaster accessories.
                        </span>
                      </>
                    );
                  })()}
                </div>

                {/* Visual metric 4: Retro Aesthetics Charm */}
                <div className="space-y-1 bg-white/50 border border-[#141414]/10 p-2 shadow-[1px_1px_0px_0px_rgba(20,20,20,0.05)]">
                  {(() => {
                    const filter = config.twoDStyleEffect || "none";
                    const score = filter === "gameboy" ? 98 : filter === "cyberpunk" ? 95 : filter === "crt" ? 92 : filter === "blueprint" ? 88 : filter === "sketch" ? 85 : 12;
                    return (
                      <>
                        <div className="flex justify-between font-bold">
                          <span>RETRO ESTHETIC COMPOSITOR</span>
                          <span className="text-blue-600">{score}% CHARM</span>
                        </div>
                        <div className="h-2 w-full bg-[#141414]/10 border border-[#141414]">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="text-[8.5px] text-[#141414]/65 block leading-tight">
                          Effect: <span className="font-mono text-blue-700 font-bold uppercase">{filter === "none" ? "Clean Render" : filter}</span>. Real-time viewport overlays active.
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Extra funny enterprise details footer */}
              <div className="border-t border-[#141414]/10 pt-3 flex flex-wrap justify-between text-[8px] font-mono text-[#141414]/60">
                <div>ENGINE LATENCY: 14ms (EDGE CONTAINER)</div>
                <div>DISCO_RHYTHM: {config.discoMode ? "142 BPM (STROBE)" : "0 BPM (STEADY)"}</div>
                <div>EXPORTER VER: CJS-BUNDLED v1.1</div>
              </div>
            </section>

            {studioMode === "mutate" && (
              <>
                <MutationLab
                  config={config}
                  chaosIntensity={chaosIntensity}
                  setChaosIntensity={setChaosIntensity}
                  autoMutationActive={autoMutationActive}
                  setAutoMutationActive={setAutoMutationActive}
                  lastMutationSummary={lastMutationSummary}
                  handleChaosMutation={handleChaosMutation}
                  setShowMutationFlow={setShowMutationFlow}
                  setBounceTime={setBounceTime}
                  addLog={addLog}
                />
                <SpecimenVault
                  mutationVault={mutationVault}
                  setMutationVault={setMutationVault}
                  splicerParents={splicerParents}
                  setSplicerParents={setSplicerParents}
                  handleFuseGenomes={handleFuseGenomes}
                  toggleParentSelection={toggleParentSelection}
                  setConfig={setConfig}
                  setCharacterName={setCharacterName}
                  addLog={addLog}
                />
              </>
            )}

            {/* LOGS TERMINAL */}
            <StudioLogs logs={logs} />
          </div>
        </div>

        </>
        )}
        {studioMode !== "select" && (
          <Guidebook wikiTab={wikiTab} setWikiTab={setWikiTab} />
        )}
      </main>

      {/* MUTATION FLOW MODAL */}
      {showMutationFlow && (
        <MutationFlow
          currentConfig={config}
          onApplyMutation={handleApplyGuidedMutation}
          onClose={() => setShowMutationFlow(false)}
        />
      )}

      {/* FOOTER */}
      <footer
        className={`border-t-2 border-[#141414] text-center py-4 text-[10px] font-mono mt-auto select-none ${
          studioMode === "select"
            ? "bg-[#0a0614] text-white/50"
            : "bg-[#D4D3D0] text-[#141414]/60"
        }`}
        id="app-footer"
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 uppercase tracking-tight">
          <span>DISK_WRITES: 124.5MB // UPTIME: 00:14:22</span>
          <span>
            © 2026 GLB Factory //{" "}
            <a
              href="https://github.com/DaCameraGirl"
              target="_blank"
              rel="noopener noreferrer"
              className={`underline underline-offset-2 ${
                studioMode === "select" ? "hover:text-lime-300" : "hover:text-[#141414]"
              }`}
            >
              DACAMERAGIRL
            </a>{" "}
            // REPO_FIX_01
          </span>
        </div>
      </footer>
    </div>
  );
}
