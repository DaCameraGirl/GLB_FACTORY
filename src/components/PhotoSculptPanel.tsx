import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Box, Download, RefreshCw } from "lucide-react";
import { sculptFromPhoto, disposeSculpt, SculptResult } from "../utils/photoSculpt";
import { exportToGLB } from "../utils/glbExporter";

export interface PhotoSculptPanelProps {
  sourceImage: string | null;
  characterName: string;
  addLog?: (text: string, type?: "info" | "success" | "warning" | "error") => void;
}

type Settings = {
  depth: number;
  detail: number;
  backDepth: number;
  tolerance: number;
  resolution: number;
  focus: { x: number; y: number } | null;
  removeTaps: { x: number; y: number }[];
};
type SliderKey = Exclude<keyof Settings, "focus" | "removeTaps">;

const START: Settings = { depth: 0.55, detail: 0.35, backDepth: 0.7, tolerance: 42, resolution: 180, focus: null, removeTaps: [] };

export default function PhotoSculptPanel({ sourceImage, characterName, addLog }: PhotoSculptPanelProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const runIdRef = useRef(0);

  const [settings, setSettings] = useState<Settings>(START);
  const [result, setResult] = useState<SculptResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tapMode, setTapMode] = useState<"keep" | "remove">("keep");

  // Viewer setup (once).
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#1a1a1a");
    scene.add(new THREE.HemisphereLight(0xffffff, 0x404040, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(1.5, 2.5, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(-2, 1, -2);
    scene.add(rim);
    const grid = new THREE.GridHelper(4, 16, 0x555555, 0x333333);
    scene.add(grid);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    camera.position.set(0.8, 1.1, 3.2);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.9, 0);
    controls.enableDamping = true;

    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;

    const resize = () => {
      const w = mount.clientWidth || 300;
      const h = mount.clientHeight || 300;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let frame = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      if (groupRef.current) disposeSculpt(groupRef.current);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  // Swap the model into the viewer whenever a new sculpt is ready.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (groupRef.current) {
      scene.remove(groupRef.current);
      disposeSculpt(groupRef.current);
      groupRef.current = null;
    }
    if (result) {
      scene.add(result.group);
      groupRef.current = result.group;
      const box = new THREE.Box3().setFromObject(result.group);
      const center = box.getCenter(new THREE.Vector3());
      controlsRef.current?.target.copy(center);
    }
  }, [result]);

  // New photo = start fresh.
  useEffect(() => {
    setResult(null);
    setError(null);
    setSettings((p) => ({ ...p, focus: null, removeTaps: [] }));
    setTapMode("keep");
  }, [sourceImage]);

  const build = async (s: Settings) => {
    if (!sourceImage) return;
    const runId = ++runIdRef.current;
    setBusy(true);
    setError(null);
    try {
      const r = await sculptFromPhoto(sourceImage, s);
      if (runId !== runIdRef.current) {
        disposeSculpt(r.group); // a newer build started; drop this one
        return;
      }
      setResult(r);
      addLog?.(
        r.usedFallbackMask
          ? "Photo Sculpt: couldn't separate the subject from the background, used a centered oval. Try a plainer background or raise Edge Tolerance."
          : `Photo Sculpt: built ${r.triangleCount.toLocaleString()} triangles from the photo.`,
        r.usedFallbackMask ? "warning" : "success"
      );
    } catch (e: any) {
      if (runId === runIdRef.current) {
        setError(e?.message || "Sculpt failed.");
        addLog?.(`Photo Sculpt failed: ${e?.message || e}`, "error");
      }
    } finally {
      if (runId === runIdRef.current) setBusy(false);
    }
  };

  // Re-sculpt live when sliders move or the subject is tapped (after the first build).
  useEffect(() => {
    if (!result && !settings.focus) return;
    const t = window.setTimeout(() => build(settings), 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const download = async () => {
    if (!result) return;
    try {
      const blob = await exportToGLB(result.group, characterName || "sculpt");
      const safe = (characterName || "sculpt").replace(/[^a-z0-9_-]+/gi, "_").toLowerCase();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safe}_photo_sculpt.glb`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      addLog?.("Photo Sculpt GLB downloaded.", "success");
    } catch (e: any) {
      setError(e?.message || "Export failed.");
    }
  };

  const tapSubject = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    if (tapMode === "remove") setSettings((p) => ({ ...p, removeTaps: [...p.removeTaps, { x, y }] }));
    else setSettings((p) => ({ ...p, focus: { x, y } }));
  };

  const modeBtn = (mode: "keep" | "remove", label: string) => (
    <button
      type="button"
      onClick={() => setTapMode(mode)}
      className={`flex-1 py-1.5 font-mono text-[10px] font-bold uppercase border-2 border-[#141414] rounded-none ${
        tapMode === mode ? (mode === "keep" ? "bg-fuchsia-400" : "bg-red-400") : "bg-white/70"
      }`}
    >
      {label}
    </button>
  );

  const slider = (key: SliderKey, label: string, min: number, max: number, step: number) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono font-bold text-[#141414]/80">
        <span>{label}</span>
        <span>{settings[key]}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={settings[key]}
        onChange={(e) => setSettings((p) => ({ ...p, [key]: parseFloat(e.target.value) }))}
        className="w-full accent-[#141414] h-1.5 cursor-pointer bg-[#141414]/10"
      />
    </div>
  );

  return (
    <section
      className="bg-gradient-to-br from-lime-50 via-white to-cyan-50 border-2 border-[#141414] rounded-none p-5 space-y-4 shadow-[4px_4px_0px_0px_#a3e635]"
      id="photo-sculpt-panel"
    >
      <div className="-mx-5 -mt-5 p-3 border-b border-[#141414] bg-gradient-to-r from-lime-300 via-cyan-300 to-fuchsia-300">
        <h2 className="font-serif text-[11px] italic text-[#141414] uppercase font-bold tracking-wider flex items-center gap-2">
          <Box className="w-3.5 h-3.5" />
          <span>Photo Sculpt · Real 3D From Your Photo</span>
        </h2>
      </div>

      <p className="text-[11px] text-[#141414]/80 leading-relaxed">
        Cuts the subject out of your photo and sculpts it into a real 3D model, right in your browser. Works best with one
        person or object on a plain background.
      </p>

      {sourceImage && (
        <div className="space-y-1">
          <label className="font-mono text-[10px] uppercase font-bold text-[#141414]/85">
            {tapMode === "keep" ? "Tap your subject" : "Tap leftover background to remove it"}
          </label>
          <div className="flex gap-2 max-w-[220px]">
            {modeBtn("keep", "Keep")}
            {modeBtn("remove", "Remove")}
          </div>
          <div className="relative w-full max-w-[220px] border-2 border-[#141414] cursor-crosshair">
            <img src={sourceImage} alt="Tap the subject" onClick={tapSubject} className="w-full h-auto block select-none" draggable={false} />
            {settings.focus && (
              <div
                className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white bg-fuchsia-500 shadow pointer-events-none"
                style={{ left: `${settings.focus.x * 100}%`, top: `${settings.focus.y * 100}%` }}
              />
            )}
            {settings.removeTaps.map((t, k) => (
              <div
                key={k}
                className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white bg-red-500 shadow pointer-events-none flex items-center justify-center text-[9px] text-white font-black"
                style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%` }}
              >
                ×
              </div>
            ))}
          </div>
          {settings.removeTaps.length > 0 && (
            <button
              type="button"
              onClick={() => setSettings((p) => ({ ...p, removeTaps: [] }))}
              className="text-[9px] font-mono font-bold uppercase underline text-[#141414]/70"
            >
              Clear remove taps
            </button>
          )}
        </div>
      )}

      <div ref={mountRef} className="w-full aspect-square border-2 border-[#141414] bg-[#1a1a1a]" id="photo-sculpt-viewer" />

      <button
        type="button"
        onClick={() => build(settings)}
        disabled={!sourceImage || busy}
        className={`w-full py-3 px-4 font-mono text-xs tracking-wider font-black flex items-center justify-center gap-2 uppercase rounded-none border-2 border-[#141414] ${
          !sourceImage
            ? "bg-[#D4D3D0] text-[#141414]/30 cursor-not-allowed border-[#141414]/40"
            : "bg-gradient-to-r from-lime-400 via-cyan-400 to-fuchsia-400 text-[#141414] shadow-[4px_4px_0px_0px_#141414] cursor-pointer hover:brightness-110"
        }`}
        id="photo-sculpt-button"
      >
        {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Box className="w-4 h-4" />}
        <span>{!sourceImage ? "Upload a photo first" : busy ? "Sculpting…" : result ? "Re-Sculpt" : "Sculpt Real 3D"}</span>
      </button>

      {error && <p className="text-[11px] font-mono text-red-700">{error}</p>}

      {result && (
        <>
          <div className="flex items-center gap-3 p-2 bg-white/60 border border-[#141414]">
            <img src={result.maskCanvas.toDataURL()} alt="Cutout" className="w-14 h-14 object-contain bg-black border border-[#141414]" />
            <div className="text-[10px] font-mono text-[#141414]/80 leading-snug">
              <div className="font-bold uppercase">Cutout used</div>
              <div>{Math.round(result.coverage * 100)}% of photo · {result.triangleCount.toLocaleString()} tris</div>
              {result.usedFallbackMask && <div className="text-amber-700">No clear subject found, used an oval</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {slider("depth", "DEPTH", 0.2, 1.5, 0.05)}
            {slider("detail", "SURFACE DETAIL", 0, 1, 0.05)}
            {slider("backDepth", "BACK THICKNESS", 0.1, 1, 0.05)}
            {slider("tolerance", "EDGE TOLERANCE", 10, 120, 1)}
          </div>
          {slider("resolution", "RESOLUTION", 80, 260, 10)}

          <button
            type="button"
            onClick={download}
            className="w-full py-3 px-4 font-mono text-xs font-bold tracking-widest flex items-center justify-center gap-2 border-2 rounded-none uppercase bg-[#141414] text-[#E4E3E0] border-[#141414] hover:bg-black shadow-[3px_3px_0px_0px_#141414] cursor-pointer"
            id="photo-sculpt-download"
          >
            <Download className="w-4 h-4" />
            <span>Download Sculpt GLB</span>
          </button>
        </>
      )}
    </section>
  );
}
