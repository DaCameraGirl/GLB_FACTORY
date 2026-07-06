import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { AvatarConfig } from "../types";
import { buildAvatar } from "../utils/avatarBuilder";

interface ThreeCanvasProps {
  config: AvatarConfig;
  faceCanvas: HTMLCanvasElement | null;
  onSceneReady?: (avatarGroup: THREE.Group) => void;
  autoRotate: boolean;
}

export default function ThreeCanvas({
  config,
  faceCanvas,
  onSceneReady,
  autoRotate,
}: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Animation and interaction state
  const [animationMode, setAnimationMode] = useState<"idle" | "walk">("idle");
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const isMouseOverRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#CCCCCC"); // Concrete gray background
    sceneRef.current = scene;

    // Add grid/floor helper
    const gridHelper = new THREE.GridHelper(10, 20, "#141414", "#888888");
    gridHelper.position.y = -0.01; // Slightly below ground level to avoid z-fighting
    scene.add(gridHelper);

    // Subtle ground shadow-receiver circle
    const shadowGeo = new THREE.RingGeometry(0, 2.5, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x141414,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = Math.PI / 2;
    shadowMesh.position.y = 0.001;
    scene.add(shadowMesh);

    // 2. Create Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    // Position camera to look at the character beautifully
    camera.position.set(0, 2.0, 4.5);
    cameraRef.current = camera;

    // 3. Create WebGLRenderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Clear previous children
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    // Main spotlight casting beautiful soft shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(3, 6, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // Rim light/Backlight to give depth
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(-3, 3, -4);
    scene.add(rimLight);

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't orbit below ground
    controls.minDistance = 2.0;
    controls.maxDistance = 10.0;
    controls.target.set(0, 1.3, 0); // focus on character center
    controlsRef.current = controls;

    // 6. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (rendererRef.current && cameraRef.current) {
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    });
    resizeObserver.observe(containerRef.current);

    // 7. Mouse move listeners for Head look-at
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Calculate normalized mouse coordinates (-1 to +1)
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current.set(x, y);
    };

    const handleMouseEnter = () => {
      isMouseOverRef.current = true;
    };

    const handleMouseLeave = () => {
      isMouseOverRef.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousemove", handleMouseMove);
    dom.addEventListener("mouseenter", handleMouseEnter);
    dom.addEventListener("mouseleave", handleMouseLeave);

    // 8. Render/Animation loop
    let clock = new THREE.Clock();
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      if (avatarGroupRef.current) {
        const torso = avatarGroupRef.current.getObjectByName("torso") as THREE.Object3D;
        const head = avatarGroupRef.current.getObjectByName("head") as THREE.Object3D;
        const leftArm = avatarGroupRef.current.getObjectByName("left-arm") as THREE.Object3D;
        const rightArm = avatarGroupRef.current.getObjectByName("right-arm") as THREE.Object3D;
        const leftLeg = avatarGroupRef.current.getObjectByName("left-leg") as THREE.Object3D;
        const rightLeg = avatarGroupRef.current.getObjectByName("right-leg") as THREE.Object3D;

        if (animationMode === "walk") {
          // Beautiful active walking loop
          const speed = 7.8;
          const angle = 0.45;
          const swing = Math.sin(elapsedTime * speed) * angle;

          if (leftLeg) leftLeg.rotation.x = swing;
          if (rightLeg) rightLeg.rotation.x = -swing;
          if (leftArm) leftArm.rotation.x = -swing * 0.8;
          if (rightArm) rightArm.rotation.x = swing * 0.8;

          // Reset lateral sways
          if (leftArm) leftArm.rotation.z = -0.05;
          if (rightArm) rightArm.rotation.z = 0.05;

          // Bob torso up/down slightly
          if (torso) {
            const baseHeight = config.bodyType === "chibi" ? 0.8 : config.bodyType === "tall" ? 1.6 : 1.35;
            torso.position.y = baseHeight + Math.abs(Math.sin(elapsedTime * speed)) * 0.05 - 0.025;
            torso.rotation.y = Math.sin(elapsedTime * speed * 0.5) * 0.05; // slight pelvic hip sway
          }

          if (head) {
            head.rotation.x = Math.sin(elapsedTime * speed) * 0.03;
            head.rotation.z = Math.cos(elapsedTime * speed * 0.5) * 0.025;
            head.rotation.y = 0;
          }
        } else {
          // Premium breathing Idle loop
          const baseHeight = config.bodyType === "chibi" ? 0.8 : config.bodyType === "tall" ? 1.6 : 1.35;
          if (torso) {
            torso.position.y = baseHeight + Math.sin(elapsedTime * 1.5) * 0.025;
            torso.rotation.set(0, 0, 0);
          }

          if (leftLeg) leftLeg.rotation.set(0, 0, 0);
          if (rightLeg) rightLeg.rotation.set(0, 0, 0);

          if (head) {
            if (isMouseOverRef.current) {
              // Interactive look-at target matching the mouse position
              const targetX = Math.max(-0.25, Math.min(0.25, mouseRef.current.y * 0.4));
              const targetY = Math.max(-0.45, Math.min(0.45, mouseRef.current.x * 0.5));
              head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetX, 0.12);
              head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetY, 0.12);
              head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0, 0.12);
            } else {
              // Continuous ambient head sway
              head.rotation.z = Math.sin(elapsedTime * 0.7) * 0.02;
              head.rotation.x = Math.sin(elapsedTime * 1.1) * 0.022;
              head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0, 0.1);
            }
          }

          if (leftArm && rightArm) {
            leftArm.rotation.z = -0.05 - Math.sin(elapsedTime * 1.5) * 0.04;
            rightArm.rotation.z = 0.05 + Math.sin(elapsedTime * 1.5) * 0.04;

            leftArm.rotation.x = Math.sin(elapsedTime * 0.5) * 0.03;
            rightArm.rotation.x = -Math.sin(elapsedTime * 0.5) * 0.03;
          }
        }
      }

      if (controlsRef.current) {
        if (autoRotate && animationMode !== "walk") {
          controlsRef.current.autoRotate = true;
          controlsRef.current.autoRotateSpeed = 2.0;
        } else {
          controlsRef.current.autoRotate = false;
        }
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Cleanups
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      resizeObserver.disconnect();
      dom.removeEventListener("mousemove", handleMouseMove);
      dom.removeEventListener("mouseenter", handleMouseEnter);
      dom.removeEventListener("mouseleave", handleMouseLeave);
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [autoRotate, animationMode, config.bodyType]);

  // Re-build Avatar whenever the 3D representation or texture canvas changes
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove old avatar group if exists
    if (avatarGroupRef.current) {
      sceneRef.current.remove(avatarGroupRef.current);
    }

    // Build new avatar
    const avatarGroup = buildAvatar(config, faceCanvas);
    sceneRef.current.add(avatarGroup);
    avatarGroupRef.current = avatarGroup;

    if (onSceneReady) {
      onSceneReady(avatarGroup);
    }
  }, [config, faceCanvas, onSceneReady]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[350px] md:min-h-[500px] rounded-none overflow-hidden relative border-2 border-[#141414] bg-[#CCCCCC]"
      id="3d-preview-canvas-container"
      style={{ backgroundImage: "radial-gradient(#aaa 1px, transparent 1px)", backgroundSize: "20px 20px" }}
    >
      {/* Floating viewport details */}
      <div className="absolute top-3 left-3 bg-[#141414] border border-[#141414] text-[10px] px-2.5 py-1.5 rounded-none text-[#E4E3E0] font-mono select-none z-10 font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(20,20,20,0.15)] leading-tight">
        VIEWPORT: PERSPECTIVE_3D<br/>
        RENDER: LIVE_MESH<br/>
        ORBIT_CONTROLS: ENABLED
      </div>

      {/* Floating Animation / Pose Controller */}
      <div className="absolute bottom-3 left-3 bg-white/95 border-2 border-[#141414] p-1.5 rounded-none z-10 flex items-center gap-1.5 font-mono text-[10px] shadow-[3px_3px_0px_0px_rgba(20,20,20,0.25)] select-none">
        <span className="font-bold uppercase text-[9px] px-1 text-[#141414]/70">POSE:</span>
        <button
          onClick={() => setAnimationMode("idle")}
          className={`px-2.5 py-1 font-bold uppercase tracking-wider transition-all border ${
            animationMode === "idle"
              ? "bg-[#141414] text-white border-[#141414]"
              : "bg-transparent text-[#141414] border-transparent hover:bg-[#141414]/10"
          }`}
        >
          Idle
        </button>
        <button
          onClick={() => setAnimationMode("walk")}
          className={`px-2.5 py-1 font-bold uppercase tracking-wider transition-all border ${
            animationMode === "walk"
              ? "bg-[#141414] text-white border-[#141414]"
              : "bg-transparent text-[#141414] border-transparent hover:bg-[#141414]/10"
          }`}
        >
          Walk
        </button>
      </div>
    </div>
  );
}
