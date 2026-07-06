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
  bounceTime: number;
}

export default function ThreeCanvas({
  config,
  faceCanvas,
  onSceneReady,
  autoRotate,
  bounceTime,
}: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Animation and interaction state
  const [animationMode, setAnimationMode] = useState<"idle" | "walk" | "dance" | "zombie" | "spin" | "ninja" | "custom">("idle");
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const isMouseOverRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#CCCCCC"); // Concrete gray background
    sceneRef.current = scene;

    // Add grid/floor helper
    if (config.showGrid !== false) {
      const gridHelper = new THREE.GridHelper(10, 20, "#141414", "#888888");
      gridHelper.position.y = -0.01; // Slightly below ground level to avoid z-fighting
      scene.add(gridHelper);
    }

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

    // 2. Create Camera with dynamic FOV (field of view)
    const fov = config.cameraFov !== undefined ? config.cameraFov : 45;
    const camera = new THREE.PerspectiveCamera(
      fov,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    // Position camera to look at the character beautifully according to Blender Preset angles
    const cameraPreset = config.cameraPreset || "front";
    if (cameraPreset === "side") {
      camera.position.set(4.5, 1.5, 0);
    } else if (cameraPreset === "top") {
      camera.position.set(0, 5.0, 0.1);
    } else if (cameraPreset === "isometric") {
      camera.position.set(3.5, 3.5, 3.5);
    } else {
      // "front" preset
      camera.position.set(0, 1.8, 4.5);
    }
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

    // 4. Lights with dynamic slider controllers
    const ambientIntensity = config.ambientIntensity !== undefined ? config.ambientIntensity : 0.75;
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    scene.add(ambientLight);

    // Main spotlight casting beautiful soft shadows
    const keyLightColor = config.keyLightColor || "#ffffff";
    const keyLightIntensity = config.keyLightIntensity !== undefined ? config.keyLightIntensity : 0.85;
    const dirLight = new THREE.DirectionalLight(new THREE.Color(keyLightColor), keyLightIntensity);
    dirLight.position.set(3, 6, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // Rim light/Backlight to give depth
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
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
    dom.addEventListener("mouseenter", handleMouseMove);
    dom.addEventListener("mouseenter", handleMouseEnter);
    dom.addEventListener("mouseleave", handleMouseLeave);

    // 8. Render/Animation loop
    let clock = new THREE.Clock();
    // Track physics bounce trigger - if bounceTime changes, this effect restarts, initializing this to 0 (since clock starts at 0)
    const lastBounceTriggerTime = bounceTime > 0 ? 0 : -999;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Soft-body physics bounce calculation
      const bounceElapsed = elapsedTime - lastBounceTriggerTime;
      let bounceY = 0;
      let squishY = 1.0;
      let squishXZ = 1.0;

      if (bounceElapsed >= 0 && bounceElapsed < 1.2) {
        if (bounceElapsed < 0.9) {
          const progress = bounceElapsed / 0.9;
          bounceY = Math.sin(progress * Math.PI) * 1.2;
          squishY = 1.2 - Math.sin(progress * Math.PI) * 0.15;
          squishXZ = 1.0 / squishY;
        } else {
          const landingProgress = (bounceElapsed - 0.9) / 0.3;
          const decay = Math.exp(-landingProgress * 3.0);
          const squishFreq = Math.sin(landingProgress * Math.PI * 3.0);
          squishY = 1.0 - decay * 0.25 * squishFreq;
          squishXZ = 1.0 / squishY;
        }
      }

      if (avatarGroupRef.current) {
        avatarGroupRef.current.position.y = bounceY;
        avatarGroupRef.current.scale.set(squishXZ, squishY, squishXZ);
      }

      // Implement Disco lights Mode if active
      if (config.discoMode) {
        if (dirLight) {
          dirLight.color.setHSL((elapsedTime * 0.45) % 1.0, 1.0, 0.55);
          dirLight.position.x = Math.sin(elapsedTime * 3.0) * 4.5;
          dirLight.position.z = Math.cos(elapsedTime * 3.0) * 4.5;
          dirLight.intensity = 1.8;
        }
        if (ambientLight) {
          ambientLight.color.setHex(0x180b2d); // deep neon background ambient
          ambientLight.intensity = 0.3;
        }
        if (scene) {
          scene.background = new THREE.Color("#0c0919");
        }
      } else if (config.twoDStyleEffect === "blueprint") {
        if (dirLight) {
          dirLight.color.setHex(0xffffff);
          dirLight.position.set(2, 5, 3);
          dirLight.intensity = 1.3;
        }
        if (ambientLight) {
          ambientLight.color.setHex(0xffffff);
          ambientLight.intensity = 1.0;
        }
        if (scene) {
          scene.background = new THREE.Color("#0f35a0"); // rich blueprint blue
        }
      } else if (config.twoDStyleEffect === "gameboy") {
        if (dirLight) {
          dirLight.color.setHex(0xeefed1);
          dirLight.position.set(2, 5, 3);
          dirLight.intensity = 0.9;
        }
        if (ambientLight) {
          ambientLight.color.setHex(0x8b956d);
          ambientLight.intensity = 0.7;
        }
        if (scene) {
          scene.background = new THREE.Color("#8b956d"); // olive-green LCD
        }
      } else if (config.twoDStyleEffect === "cyberpunk") {
        if (dirLight) {
          dirLight.color.setHex(0xff007f); // neon hot pink
          dirLight.position.x = Math.sin(elapsedTime * 2.0) * 3.5;
          dirLight.position.z = Math.cos(elapsedTime * 2.0) * 3.5;
          dirLight.intensity = 1.6;
        }
        if (ambientLight) {
          ambientLight.color.setHex(0x00f0ff); // electric cyan
          ambientLight.intensity = 0.8;
        }
        if (scene) {
          scene.background = new THREE.Color("#030308"); // deep cyberspace dark
        }
      } else if (config.twoDStyleEffect === "sketch") {
        if (dirLight) {
          dirLight.color.setHex(0xffffff);
          dirLight.position.set(4, 8, 2);
          dirLight.intensity = 1.6;
        }
        if (ambientLight) {
          ambientLight.color.setHex(0xeaeaea);
          ambientLight.intensity = 1.1;
        }
        if (scene) {
          scene.background = new THREE.Color("#fbf9f4"); // sketchbook background
        }
      } else {
        if (dirLight) {
          dirLight.color.setStyle(config.keyLightColor || "#ffffff");
          dirLight.position.set(3, 6, 4);
          dirLight.intensity = config.keyLightIntensity !== undefined ? config.keyLightIntensity : 0.85;
        }
        if (ambientLight) {
          ambientLight.color.setHex(0xffffff);
          ambientLight.intensity = config.ambientIntensity !== undefined ? config.ambientIntensity : 0.75;
        }
        if (scene) {
          scene.background = new THREE.Color("#CCCCCC");
        }
      }

      if (avatarGroupRef.current) {
        const torso = avatarGroupRef.current.getObjectByName("torso") as THREE.Object3D;
        const head = avatarGroupRef.current.getObjectByName("head") as THREE.Object3D;
        const leftArm = avatarGroupRef.current.getObjectByName("left-arm") as THREE.Object3D;
        const rightArm = avatarGroupRef.current.getObjectByName("right-arm") as THREE.Object3D;
        const leftLeg = avatarGroupRef.current.getObjectByName("left-leg") as THREE.Object3D;
        const rightLeg = avatarGroupRef.current.getObjectByName("right-leg") as THREE.Object3D;

        const baseHeight = config.bodyType === "chibi" ? 0.8 : config.bodyType === "tall" ? 1.6 : 1.35;

        if (animationMode === "custom") {
          // Manual armature direct control sliders (superior to Blender's tedious rotation armature menus!)
          if (head) {
            const headYaw = ((config.poseHeadYaw !== undefined ? config.poseHeadYaw : 0) * Math.PI) / 180;
            const headPitch = ((config.poseHeadPitch !== undefined ? config.poseHeadPitch : 0) * Math.PI) / 180;
            head.rotation.set(headPitch, headYaw, 0);
          }
          if (leftArm) {
            const rotX = ((config.poseLeftArmRotationX !== undefined ? config.poseLeftArmRotationX : 0) * Math.PI) / 180;
            const rotZ = ((config.poseLeftArmRotationZ !== undefined ? config.poseLeftArmRotationZ : -5) * Math.PI) / 180;
            leftArm.rotation.set(rotX, 0, rotZ);
          }
          if (rightArm) {
            const rotX = ((config.poseRightArmRotationX !== undefined ? config.poseRightArmRotationX : 0) * Math.PI) / 180;
            const rotZ = ((config.poseRightArmRotationZ !== undefined ? config.poseRightArmRotationZ : 5) * Math.PI) / 180;
            rightArm.rotation.set(rotX, 0, rotZ);
          }
          if (leftLeg) {
            const rotX = ((config.poseLeftLegRotationX !== undefined ? config.poseLeftLegRotationX : 0) * Math.PI) / 180;
            leftLeg.rotation.set(rotX, 0, 0);
          }
          if (rightLeg) {
            const rotX = ((config.poseRightLegRotationX !== undefined ? config.poseRightLegRotationX : 0) * Math.PI) / 180;
            rightLeg.rotation.set(rotX, 0, 0);
          }
          if (torso) {
            torso.position.y = baseHeight;
            torso.rotation.set(0, 0, 0);
          }
        } else if (animationMode === "walk") {
          // Beautiful active walking loop
          const speed = 7.8;
          const angle = 0.45;
          const swing = Math.sin(elapsedTime * speed) * angle;

          if (leftLeg) leftLeg.rotation.set(swing, 0, 0);
          if (rightLeg) rightLeg.rotation.set(-swing, 0, 0);
          if (leftArm) leftArm.rotation.set(-swing * 0.8, 0, -0.05);
          if (rightArm) rightArm.rotation.set(swing * 0.8, 0, 0.05);

          if (torso) {
            torso.position.y = baseHeight + Math.abs(Math.sin(elapsedTime * speed)) * 0.05 - 0.025;
            torso.rotation.set(0, Math.sin(elapsedTime * speed * 0.5) * 0.05, 0);
          }

          if (head) {
            head.rotation.set(Math.sin(elapsedTime * speed) * 0.03, 0, Math.cos(elapsedTime * speed * 0.5) * 0.025);
          }
        } else if (animationMode === "dance") {
          // Exaggerated Voxel Jig Dance
          const speed = 9.2;
          const bounce = Math.sin(elapsedTime * speed * 2) * 0.08;
          const swayX = Math.sin(elapsedTime * speed) * 0.5;

          if (leftLeg) leftLeg.rotation.set(swayX, 0, 0);
          if (rightLeg) rightLeg.rotation.set(-swayX, 0, 0);
          if (leftArm) leftArm.rotation.set(Math.cos(elapsedTime * speed) * 0.7, 0, -0.4 + Math.sin(elapsedTime * speed) * 0.4);
          if (rightArm) rightArm.rotation.set(-Math.cos(elapsedTime * speed) * 0.7, 0, 0.4 + Math.cos(elapsedTime * speed) * 0.4);

          if (torso) {
            torso.position.y = baseHeight + bounce;
            torso.rotation.set(Math.sin(elapsedTime * speed) * 0.06, Math.cos(elapsedTime * speed * 0.5) * 0.2, Math.sin(elapsedTime * speed) * 0.12);
          }

          if (head) {
            head.rotation.set(Math.cos(elapsedTime * speed * 2) * 0.08, Math.sin(elapsedTime * speed) * 0.15, Math.sin(elapsedTime * speed) * 0.08);
          }
        } else if (animationMode === "zombie") {
          // Slow zombie stagger
          const speed = 2.4;
          const slowSway = Math.sin(elapsedTime * speed);

          if (leftLeg) leftLeg.rotation.set(slowSway * 0.25, 0, 0.05);
          if (rightLeg) rightLeg.rotation.set(-slowSway * 0.18, 0, -0.05);
          if (leftArm) leftArm.rotation.set(-Math.PI / 2 + Math.sin(elapsedTime * speed) * 0.08, 0.1, -0.05);
          if (rightArm) rightArm.rotation.set(-Math.PI / 2 - Math.sin(elapsedTime * speed) * 0.08, -0.1, 0.05);

          if (torso) {
            torso.position.y = baseHeight + Math.sin(elapsedTime * speed * 2) * 0.015 - 0.04;
            torso.rotation.set(0.18, 0.05 * Math.sin(elapsedTime * speed), 0.03 * Math.cos(elapsedTime * speed));
          }

          if (head) {
            head.rotation.set(0.12, -0.1, 0.15);
          }
        } else if (animationMode === "spin") {
          // Crazy whirlwind helicopter spin
          if (leftLeg) leftLeg.rotation.set(0.08, 0, -0.08);
          if (rightLeg) rightLeg.rotation.set(0.08, 0, 0.08);
          if (leftArm) leftArm.rotation.set(0, 0, -Math.PI / 1.6);
          if (rightArm) rightArm.rotation.set(0, 0, Math.PI / 1.6);

          if (torso) {
            torso.position.y = baseHeight + Math.sin(elapsedTime * 15) * 0.06;
            torso.rotation.set(0, elapsedTime * 10, 0); // ROTATING CONSTANTLY
          }

          if (head) {
            head.rotation.set(-0.1, 0, 0);
          }
        } else if (animationMode === "ninja") {
          // Aerodynamic running stance
          const speed = 14.5;
          const runSwing = Math.sin(elapsedTime * speed) * 0.7;

          if (leftLeg) leftLeg.rotation.set(runSwing, 0, 0);
          if (rightLeg) rightLeg.rotation.set(-runSwing, 0, 0);
          if (leftArm) leftArm.rotation.set(0.85 + runSwing * 0.15, 0, -0.08);
          if (rightArm) rightArm.rotation.set(0.85 - runSwing * 0.15, 0, 0.08);

          if (torso) {
            torso.position.y = baseHeight - 0.16 + Math.abs(Math.sin(elapsedTime * speed)) * 0.09;
            torso.rotation.set(0.48, Math.sin(elapsedTime * speed * 0.5) * 0.08, 0);
          }

          if (head) {
            head.rotation.set(-0.28, 0, 0);
          }
        } else {
          // Premium breathing Idle loop
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
        if (autoRotate && animationMode !== "walk" && animationMode !== "spin") {
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
      dom.removeEventListener("mouseenter", handleMouseMove);
      dom.removeEventListener("mouseenter", handleMouseEnter);
      dom.removeEventListener("mouseleave", handleMouseLeave);
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [
    autoRotate,
    animationMode,
    bounceTime,
    config.bodyType,
    config.showGrid,
    config.ambientIntensity,
    config.keyLightIntensity,
    config.keyLightColor,
    config.cameraFov,
    config.cameraPreset,
    config.discoMode,
    config.twoDStyleEffect,
    config.poseHeadYaw,
    config.poseHeadPitch,
    config.poseLeftArmRotationX,
    config.poseLeftArmRotationZ,
    config.poseRightArmRotationX,
    config.poseRightArmRotationZ,
    config.poseLeftLegRotationX,
    config.poseRightLegRotationX
  ]);

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
      className={`w-full h-full min-h-[350px] md:min-h-[500px] rounded-none overflow-hidden relative border-2 border-[#141414] transition-all duration-300 ${
        config.twoDStyleEffect === "gameboy"
          ? "bg-[#8b956d] contrast-[1.1] saturate-[0.9]"
          : config.twoDStyleEffect === "blueprint"
          ? "bg-[#0f35a0]"
          : config.twoDStyleEffect === "sketch"
          ? "bg-[#fbf9f4] grayscale contrast-[1.8] brightness-[1.05]"
          : "bg-[#CCCCCC]"
      }`}
      id="3d-preview-canvas-container"
      style={{ backgroundImage: config.twoDStyleEffect === "blueprint" ? "none" : "radial-gradient(#aaa 1px, transparent 1px)", backgroundSize: "20px 20px" }}
    >
      {/* 2D Overlay Effects */}
      {config.twoDStyleEffect === "crt" && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Repeating Scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] mix-blend-overlay" />
          {/* CRT Glare Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.4)_100%)] mix-blend-multiply" />
          {/* Bezel frame shadow */}
          <div className="absolute inset-0 border-[10px] border-black/15 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]" />
          {/* Indicator */}
          <div className="absolute top-3 right-3 text-red-500 font-mono text-[9px] font-bold flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span>LIVE CRT_NTSC</span>
          </div>
        </div>
      )}

      {config.twoDStyleEffect === "blueprint" && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden border-2 border-white/20">
          {/* Fine architectural blueprint grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:20px_20px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:100px_100px] border-t border-l border-white/10" />
          {/* Schematic metadata texts */}
          <div className="absolute bottom-12 right-4 text-white/50 font-mono text-[8px] text-right leading-relaxed select-none">
            <div>ASSEMBLY: VOXEL_RIG_X90</div>
            <div>MESH TYPE: RETRO BLOCKY</div>
            <div>GLB TRANS_COORDS: Z-UP</div>
          </div>
          <div className="absolute top-12 left-4 text-white/40 font-mono text-[8px] leading-relaxed select-none">
            <div>DRAFT_ENGIN v3.5</div>
            <div>TOLERANCE: +/-0.015m</div>
            <div>BOUNDS: [1.2m, 0.8m, 1.8m]</div>
          </div>
          <div className="absolute top-3 right-3 text-white/70 font-mono text-[9px] font-bold uppercase tracking-wider">
            PLAN_SHEET // #001
          </div>
        </div>
      )}

      {config.twoDStyleEffect === "gameboy" && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Heavy LCD pixel dither block matrix */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.07)_1px,transparent_1px)] bg-[length:3px_3px]" />
          {/* Greenish vignette shading */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(45,55,30,0.35)_100%)] mix-blend-multiply" />
          {/* Corner highlights */}
          <div className="absolute top-3 right-3 text-[#303810]/70 font-mono text-[8px] font-bold">
            BATTERY ●●●
          </div>
        </div>
      )}

      {config.twoDStyleEffect === "cyberpunk" && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Cyan/Magenta retro-future neon grids */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_50%,rgba(255,0,127,0.02)_50%)] bg-[length:100%_8px]" />
          {/* Center Target HUD overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-cyan-500/20 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-pink-500/60 rounded-full animate-ping" />
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-500/10 -translate-x-1/2 h-full" />
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-cyan-500/10 -translate-y-1/2 w-full" />
          </div>
          {/* Cybernetic HUD Frame corners */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute bottom-16 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute bottom-16 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
          {/* Sci-fi live coordinates */}
          <div className="absolute top-12 right-4 text-pink-500 font-mono text-[8px] text-right leading-relaxed select-none">
            <div>STANCE: COMPILING_MESH</div>
            <div>SYS_TEMP: 32.5°C (OK)</div>
            <div>CYBER_SHIELD: 100%</div>
          </div>
          <div className="absolute top-12 left-4 text-cyan-400 font-mono text-[8px] leading-relaxed select-none">
            <div>LOC_X: [0.00]</div>
            <div>LOC_Y: [1.35]</div>
            <div>ALIGN: POSITIVE_SKEW</div>
          </div>
        </div>
      )}

      {config.twoDStyleEffect === "sketch" && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-75">
          {/* Shaded vignette charcoal pencil frame */}
          <div className="absolute inset-0 border-[16px] border-[#edeae2]/95" />
          <div className="absolute inset-0 bg-[#f4f1ea]/10" />
          <div className="absolute bottom-12 left-4 text-[#333333]/60 font-serif italic text-[8.5px] select-none">
            * Pencil and Charcoal Shading Outline Projection
          </div>
        </div>
      )}

      {/* Floating viewport details */}
      <div className="absolute top-3 left-3 bg-[#141414] border border-[#141414] text-[10px] px-2.5 py-1.5 rounded-none text-[#E4E3E0] font-mono select-none z-10 font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(20,20,20,0.15)] leading-tight">
        VIEWPORT: PERSPECTIVE_3D<br/>
        RENDER: LIVE_MESH<br/>
        ORBIT_CONTROLS: ENABLED
      </div>

      {/* Floating Animation / Pose Controller */}
      <div className="absolute bottom-3 left-3 right-3 md:right-auto bg-white/95 border-2 border-[#141414] p-1.5 rounded-none z-10 flex flex-wrap items-center gap-1 font-mono text-[9px] shadow-[3px_3px_0px_0px_rgba(20,20,20,0.25)] select-none">
        <span className="font-bold uppercase text-[8px] px-1 text-[#141414]/70">POSE:</span>
        {(["idle", "walk", "dance", "zombie", "spin", "ninja", "custom"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setAnimationMode(mode)}
            className={`px-2 py-1 font-bold uppercase transition-all border ${
              animationMode === mode
                ? "bg-[#141414] text-white border-[#141414]"
                : "bg-transparent text-[#141414] border-transparent hover:bg-[#141414]/10"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
