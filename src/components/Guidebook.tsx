import React from "react";

export type WikiTab = "quickstart" | "texturing" | "rigging" | "shading" | "export";

interface GuidebookProps {
  wikiTab: WikiTab;
  setWikiTab: (tab: WikiTab) => void;
}

/**
 * Studio documentation — export language is intentionally accurate:
 * poseable mesh hierarchy + PBR, not skinned AnimationClip export.
 */
export default function Guidebook({ wikiTab, setWikiTab }: GuidebookProps) {
  return (
    <section
      className="bg-white/95 border-2 border-[#141414] rounded-none p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)] text-[#141414] space-y-4"
      id="documentation-section"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#141414] pb-3 gap-2">
        <h3 className="font-serif text-[12px] text-[#141414] font-bold uppercase tracking-wide flex items-center gap-2">
          <span className="text-base">📖</span>
          <span>GLB Factory Guidebook: Photo Pipeline, Mutation Lab &amp; Export</span>
        </h3>
        <span className="font-mono text-[11px] bg-yellow-400 border border-[#141414] px-2 py-0.5 font-bold uppercase tracking-widest shadow-[1px_1px_0px_0px_#141414] shrink-0">
          STUDIO_DOCS // WORKFLOW_GUIDE
        </span>
      </div>

      <p className="text-[14px] font-mono leading-relaxed normal-case text-gray-700">
        Two connected modes: <strong>Create From Photo</strong> (upload → build → customize → export) and{" "}
        <strong>Mutation Lab</strong> (generate → collect → breed → export). Use the tabs below for texture math,
        in-viewer posing, materials, and honest export notes.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-[#141414]/5 border-2 border-[#141414] font-mono text-[11px] font-bold select-none">
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
            {tab === "rigging" && "🧱 Mesh Hierarchy"}
            {tab === "shading" && "✨ Shaders & Shading"}
            {tab === "export" && "🎮 Engine Export"}
          </button>
        ))}
      </div>

      <div className="bg-[#141414]/5 border-2 border-[#141414] p-5 font-mono text-[14px] text-gray-800 leading-relaxed shadow-[inner_2px_2px_4px_rgba(0,0,0,0.05)]">
        {wikiTab === "quickstart" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2">
              <span className="font-bold uppercase text-[12px] text-gray-950 tracking-wider">
                [01 / 🚀 FIVE-STEP AVATAR CREATION WALKTHROUGH]
              </span>
              <span className="text-[11px] bg-green-200 text-green-800 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                BEGINNER FRIENDLY
              </span>
            </div>
            <p className="normal-case">
              Follow these steps to generate, fine-tune, style, and export a customizable voxel-style character:
            </p>
            <div className="space-y-3 pl-2 border-l-2 border-yellow-500">
              <div className="space-y-1">
                <span className="font-bold text-gray-950 block">1. INITIAL PORTRAIT ACQUISITION</span>
                <p className="normal-case pl-3 text-[14px] text-gray-700">
                  Drag and drop any front-facing portrait into the upload zone. Eye-level, facing forward, and even
                  lighting produce the cleanest face crops and color samples.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-gray-950 block">2. PIPELINE TRIGGER (BUILD 3D AVATAR)</span>
                <p className="normal-case pl-3 text-[14px] text-gray-700">
                  Click <strong className="text-gray-950">&quot;Build 3D Avatar&quot;</strong>. When a backend key is
                  available, Gemini locates the face and harvests skin/hair/clothing colors. On the static demo, a
                  client-side sampler provides the same fields offline.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-gray-950 block">3. TEXTURE TUNING</span>
                <p className="normal-case pl-3 text-[14px] text-gray-700">
                  Use feather edges, crop shift, and crop scale so the portrait blends into the synthetic skin on the
                  head mesh.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-gray-950 block">4. PARTS, MATERIALS &amp; POSE</span>
                <p className="normal-case pl-3 text-[14px] text-gray-700">
                  Equip hairstyles and accessories, tweak transforms, or adjust roughness/metalness for plastic, matte,
                  or chrome looks. In-viewer poses rotate mesh groups — great for staging a still before export.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-gray-950 block">5. EXPORT</span>
                <p className="normal-case pl-3 text-[14px] text-gray-700">
                  Click <strong className="text-gray-950">&quot;Export Final GLB&quot;</strong> for a customizable,
                  poseable GLB character with PBR materials and an organized mesh hierarchy. Walk/dance cycles in the
                  viewport are live mesh-group animation — they are not written as glTF AnimationClips yet.
                </p>
              </div>
            </div>
          </div>
        )}

        {wikiTab === "texturing" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2">
              <span className="font-bold uppercase text-[12px] text-gray-950 tracking-wider">
                [02 / 🧠 FRONT FACE UV TEXTURE GENERATION]
              </span>
              <span className="text-[11px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                CANVAS MATH
              </span>
            </div>
            <p className="normal-case">
              Face coordinates arrive as a 0–100% box <code className="bg-gray-100 px-1 font-bold">[ymin, xmin, ymax, xmax]</code>.
              We crop into a 256×256 canvas, feather into skin color, and map that texture across the front of the head
              with front-projection UVs.
            </p>
          </div>
        )}

        {wikiTab === "rigging" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2">
              <span className="font-bold uppercase text-[12px] text-gray-950 tracking-wider">
                [03 / 🧱 MESH HIERARCHY &amp; IN-VIEWER POSING]
              </span>
              <span className="text-[11px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                SCENEGRAPH
              </span>
            </div>
            <p className="normal-case">
              Characters are a nested <code className="bg-gray-100 px-1 font-bold">THREE.Group</code> hierarchy (torso →
              head/arms/legs). Pose sliders and walk/dance modes rotate those groups each frame. Limb builder code can
              attach experimental bone chains for local deformation experiments, but the shipped exporter does not yet
              emit a full production skinned skeleton with AnimationClips.
            </p>
            <div className="bg-white border border-[#141414]/20 p-3 rounded font-mono leading-relaxed text-[10px] text-gray-600">
              <div>📁 [ROOT CONTAINER // Group]</div>
              <div className="pl-4">├── 📁 [TORSO // joint & mesh]</div>
              <div className="pl-8">├── 📁 [HEAD // joint & mesh]</div>
              <div className="pl-8">├── 📁 [LEFT_ARM / RIGHT_ARM]</div>
              <div className="pl-8">└── 📁 [LEFT_LEG / RIGHT_LEG]</div>
            </div>
          </div>
        )}

        {wikiTab === "shading" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2">
              <span className="font-bold uppercase text-[12px] text-gray-950 tracking-wider">
                [04 / ✨ PBR MATERIALS]
              </span>
              <span className="text-[11px] bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                PBR PIPELINE
              </span>
            </div>
            <p className="normal-case">
              Most meshes use <code className="bg-gray-100 px-1 font-bold">THREE.MeshStandardMaterial</code> — roughness,
              metalness, and optional emissive colors export as standard glTF PBR factors.
            </p>
          </div>
        )}

        {wikiTab === "export" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2">
              <span className="font-bold uppercase text-[12px] text-gray-950 tracking-wider">
                [05 / 🎮 WHAT THE GLB ACTUALLY CONTAINS]
              </span>
              <span className="text-[11px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                ACCURATE SCOPE
              </span>
            </div>
            <div className="bg-amber-50 border border-amber-600/40 p-3 text-[13px] normal-case text-amber-950 space-y-2">
              <strong className="block font-bold uppercase text-[11px] tracking-wide">Export contract (current)</strong>
              <p>
                Customizable, poseable GLB characters with PBR materials and an organized mesh hierarchy. The current
                pose (group transforms) is preserved. The exporter intentionally ships{" "}
                <code className="bg-amber-100 px-1 font-bold">animations: []</code> — viewport walk/dance cycles are not
                baked into the file.
              </p>
              <p>
                Do not assume Mixamo/Unity Humanoid auto-rig out of the box. For game engines, treat the asset as a
                stylized static/poseable mesh hierarchy and re-rig externally when you need skinned clips.
              </p>
            </div>
            <div className="space-y-3 text-[14px] text-gray-700">
              <div className="bg-white border border-[#141414]/20 p-3 rounded space-y-1.5">
                <strong className="text-gray-950 block font-bold">🧡 BLENDER</strong>
                <ol className="list-decimal pl-4 space-y-1 normal-case text-gray-600">
                  <li>
                    File → Import → glTF 2.0 (.glb) and open the download.
                  </li>
                  <li>Switch to Material Preview / Rendered to see PBR colors and the face map.</li>
                  <li>
                    Hierarchy appears as nested empties/meshes. Pose by rotating objects, or build your own armature
                    if you need skin weights.
                  </li>
                </ol>
              </div>
              <div className="bg-white border border-[#141414]/20 p-3 rounded space-y-1.5">
                <strong className="text-gray-950 block font-bold">💃 MIXAMO / UNITY / UNREAL</strong>
                <p className="normal-case text-gray-600">
                  Mixamo auto-rig and engine Humanoid pipelines expect a conventional skinned character. Re-rig or
                  retarget after import if you need clip-based locomotion. We plan to restore full skinned + AnimationClip
                  claims only after bones, weights, and exported clips land in the pipeline.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
