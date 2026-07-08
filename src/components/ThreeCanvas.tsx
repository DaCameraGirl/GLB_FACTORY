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
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const meltParticlesRef = useRef<THREE.Group | null>(null);

  // Snapchat Lenses particles state refs
  const particlesRef = useRef<THREE.Group | null>(null);
  const particleMetaRef = useRef<{ ySpeed: number[]; rotSpeed: number[] } | null>(null);
  const lastLensRef = useRef<string | null>(null);

  // Animation and interaction state
  const [animationMode, setAnimationMode] = useState<"idle" | "walk" | "dance" | "zombie" | "spin" | "ninja" | "custom">("idle");
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const isMouseOverRef = useRef(false);

  // Synchronize configuration changes via stable refs for frame-rate interpolation
  const configRef = useRef(config);
  const autoRotateRef = useRef(autoRotate);
  const animationModeRef = useRef(animationMode);
  const bounceTimeRef = useRef(bounceTime);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    animationModeRef.current = animationMode;
  }, [animationMode]);

  useEffect(() => {
    bounceTimeRef.current = bounceTime;
  }, [bounceTime]);

  // Sync animation mode if parent sets config.animationMode
  useEffect(() => {
    if (config.animationMode) {
      setAnimationMode(config.animationMode);
    }
  }, [config.animationMode]);

  const fitCameraToAvatar = (
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls | null,
    avatarGroup: THREE.Group,
    cameraPreset: AvatarConfig["cameraPreset"] | undefined
  ) => {
    const bounds = new THREE.Box3().setFromObject(avatarGroup);
    if (bounds.isEmpty()) return;

    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const safeWidth = Math.max(size.x, 0.1);
    const safeHeight = Math.max(size.y, 0.1);
    const safeDepth = Math.max(size.z, 0.1);

    const fitHeightDistance = safeHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    const fitWidthDistance = (safeWidth / Math.max(camera.aspect, 0.1)) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.45 + safeDepth * 0.9;

    const preset = cameraPreset || "front";
    const direction =
      preset === "side"
        ? new THREE.Vector3(1, 0.2, 0)
        : preset === "top"
        ? new THREE.Vector3(0, 1, 0.18)
        : preset === "isometric"
        ? new THREE.Vector3(1, 0.75, 1)
        : new THREE.Vector3(0, 0.18, 1);

    direction.normalize();
    camera.position.copy(center).add(direction.multiplyScalar(distance));
    camera.near = Math.max(distance / 100, 0.1);
    camera.far = Math.max(distance * 12, 100);
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.copy(center);
      controls.minDistance = Math.max(distance * 0.45, 1.5);
      controls.maxDistance = Math.max(distance * 2.5, controls.minDistance + 1);
      controls.update();
    } else {
      camera.lookAt(center);
    }
  };

  // 1. Core Scene, Camera, WebGLRenderer, Controls initialization (ONCE on mount)
  useEffect(() => {
    if (!containerRef.current || !canvasMountRef.current) return;

    // Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#CCCCCC");
    sceneRef.current = scene;

    // Create Snapchat lens particles group
    const particlesGroup = new THREE.Group();
    particlesGroup.name = "lens-particles-group";
    scene.add(particlesGroup);
    particlesRef.current = particlesGroup;

    const meltParticlesGroup = new THREE.Group();
    meltParticlesGroup.name = "melt-particles-group";
    scene.add(meltParticlesGroup);
    meltParticlesRef.current = meltParticlesGroup;

    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 20, "#141414", "#888888");
    gridHelper.position.y = -0.01;
    gridHelper.visible = configRef.current.showGrid !== false;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Ground shadow receiver
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

    // Create Camera
    const fov = configRef.current.cameraFov !== undefined ? configRef.current.cameraFov : 45;
    const camera = new THREE.PerspectiveCamera(
      fov,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    
    const cameraPreset = configRef.current.cameraPreset || "front";
    if (cameraPreset === "side") {
      camera.position.set(4.5, 1.5, 0);
    } else if (cameraPreset === "top") {
      camera.position.set(0, 5.0, 0.1);
    } else if (cameraPreset === "isometric") {
      camera.position.set(3.5, 3.5, 3.5);
    } else {
      camera.position.set(0, 1.8, 4.5);
    }
    cameraRef.current = camera;

    // Create WebGLRenderer (preserving drawing buffer for snapshot capabilities)
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    canvasMountRef.current.innerHTML = "";
    canvasMountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient light
    const ambientIntensity = configRef.current.ambientIntensity !== undefined ? configRef.current.ambientIntensity : 0.75;
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Directional key light
    const keyLightColor = configRef.current.keyLightColor || "#ffffff";
    const keyLightIntensity = configRef.current.keyLightIntensity !== undefined ? configRef.current.keyLightIntensity : 0.85;
    const dirLight = new THREE.DirectionalLight(new THREE.Color(keyLightColor), keyLightIntensity);
    dirLight.position.set(3, 6, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Rim Light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
    rimLight.position.set(-3, 3, -4);
    scene.add(rimLight);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; // Allow mouse scroll wheel to scroll the webpage instead of zooming the scene
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 2.0;
    controls.maxDistance = 10.0;
    controls.target.set(0, 1.3, 0);
    controlsRef.current = controls;

    // Resize Observer
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

    // Mouse listeners for interactive look-at
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
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

    // Render loop
    const clock = new THREE.Clock();

    const animate = () => {
      const activeConfig = configRef.current;
      const activeAutoRotate = autoRotateRef.current;
      const activeAnimMode = animationModeRef.current;
      const activeBounceTime = bounceTimeRef.current;

      const elapsedTime = clock.getElapsedTime();

      // Bounce/squish dynamic soft-body calculations
      let bounceY = 0;
      let squishY = 1.0;
      let squishXZ = 1.0;

      if (avatarGroupRef.current) {
        if (activeBounceTime > 0) {
          const bounceAge = (Date.now() - activeBounceTime) / 1000;
          if (bounceAge >= 0 && bounceAge < 1.2) {
            if (bounceAge < 0.9) {
              const progress = bounceAge / 0.9;
              bounceY = Math.sin(progress * Math.PI) * 1.2;
              squishY = 1.2 - Math.sin(progress * Math.PI) * 0.15;
              squishXZ = 1.0 / squishY;
            } else {
              const landingProgress = (bounceAge - 0.9) / 0.3;
              const decay = Math.exp(-landingProgress * 3.0);
              const squishFreq = Math.sin(landingProgress * Math.PI * 3.0);
              squishY = 1.0 - decay * 0.25 * squishFreq;
              squishXZ = 1.0 / squishY;
            }
          }
        }

        avatarGroupRef.current.position.y = bounceY;
        let finalScaleX = squishXZ;
        let finalScaleY = squishY;
        let finalScaleZ = squishXZ;

        if (activeConfig.isMelting) {
          const progress = activeConfig.meltProgress || 0;
          finalScaleY *= 1.0 - progress * 0.75;
          finalScaleX *= 1.0 + progress * 0.65;
          finalScaleZ *= 1.0 + progress * 0.65;
        }

        avatarGroupRef.current.scale.set(finalScaleX, finalScaleY, finalScaleZ);

        // Snapchat Dynamic Big Head Lens controller
        const headObj = avatarGroupRef.current.getObjectByName("head") as THREE.Object3D;
        if (headObj) {
          const baseHeadFactor = 1.0 + (activeConfig.bigHeadFactor || 0) * 1.5;
          headObj.scale.set(baseHeadFactor, baseHeadFactor, baseHeadFactor);
        }
      }

      // --- SNAPCHAT LENS PARTICLES SYSTEM ---
      const activeLens = activeConfig.activeLens || "none";
      if (lastLensRef.current !== activeLens) {
        lastLensRef.current = activeLens;
        if (particlesRef.current) {
          // Clear current particle children safely
          while (particlesRef.current.children.length > 0) {
            const child = particlesRef.current.children[0] as THREE.Mesh;
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material.dispose();
              }
            }
            particlesRef.current.remove(child);
          }
          
          // Populate new particle meshes
          if (activeLens !== "none") {
            const count = activeLens === "heart-vfx" ? 25 : 35;
            const ySpeedList: number[] = [];
            const rotSpeedList: number[] = [];
            
            for (let i = 0; i < count; i++) {
              let geom: THREE.BufferGeometry;
              let mat: THREE.Material;
              
              if (activeLens === "heart-vfx") {
                geom = new THREE.ConeGeometry(0.08, 0.16, 4);
                mat = new THREE.MeshStandardMaterial({
                  color: 0xef4444,
                  roughness: 0.1,
                  metalness: 0.2,
                  emissive: new THREE.Color(0xef4444),
                  emissiveIntensity: 0.6
                });
              } else if (activeLens === "sparkle-vfx") {
                geom = new THREE.BoxGeometry(0.06, 0.06, 0.06);
                mat = new THREE.MeshStandardMaterial({
                  color: 0xfacc15,
                  roughness: 0.01,
                  metalness: 0.9,
                  emissive: new THREE.Color(0xfacc15),
                  emissiveIntensity: 1.2
                });
              } else if (activeLens === "code-vfx") {
                geom = new THREE.BoxGeometry(0.05, 0.1, 0.02);
                mat = new THREE.MeshStandardMaterial({
                  color: 0x10b981,
                  roughness: 0.3,
                  emissive: new THREE.Color(0x10b981),
                  emissiveIntensity: 0.9
                });
              } else if (activeLens === "bubble-vfx") {
                geom = new THREE.SphereGeometry(0.06, 8, 8);
                mat = new THREE.MeshStandardMaterial({
                  color: 0x60a5fa,
                  transparent: true,
                  opacity: 0.5,
                  roughness: 0.05,
                  metalness: 0.1
                });
              } else {
                geom = new THREE.SphereGeometry(0.04, 6, 6);
                mat = new THREE.MeshStandardMaterial({
                  color: 0xa7f3d0,
                  emissive: new THREE.Color(0x4ade80),
                  emissiveIntensity: 1.6,
                  roughness: 0.5
                });
              }
              
              const particle = new THREE.Mesh(geom, mat);
              particle.position.set(
                (Math.random() - 0.5) * 3.0,
                Math.random() * 4.0 - 0.5,
                (Math.random() - 0.5) * 2.5
              );
              particle.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
              
              particlesRef.current.add(particle);
              ySpeedList.push(0.015 + Math.random() * 0.02);
              rotSpeedList.push(0.01 + Math.random() * 0.03);
            }
            
            particleMetaRef.current = { ySpeed: ySpeedList, rotSpeed: rotSpeedList };
          } else {
            particleMetaRef.current = null;
          }
        }
      }
      
      // Animate flying lens particles
      if (activeLens !== "none" && particlesRef.current && particleMetaRef.current) {
        const pMeta = particleMetaRef.current;
        particlesRef.current.children.forEach((child, index) => {
          const mesh = child as THREE.Mesh;
          const ySpeedVal = (pMeta.ySpeed && pMeta.ySpeed[index] !== undefined) ? pMeta.ySpeed[index] : 0.02;
          const rotSpeedVal = (pMeta.rotSpeed && pMeta.rotSpeed[index] !== undefined) ? pMeta.rotSpeed[index] : 0.02;
          mesh.position.y += ySpeedVal;
          mesh.rotation.y += rotSpeedVal;
          mesh.rotation.x += rotSpeedVal * 0.5;
          
          if (activeLens === "heart-vfx") {
            const pulse = 1.0 + Math.sin(elapsedTime * 6.0 + index) * 0.15;
            mesh.scale.set(pulse, pulse, pulse);
          }
          if (activeLens === "code-vfx") {
            mesh.position.x += Math.sin(elapsedTime * 2.0 + index) * 0.003;
          }
          
          if (mesh.position.y > 3.5) {
            mesh.position.y = -0.5;
            mesh.position.x = (Math.random() - 0.5) * 3.0;
            mesh.position.z = (Math.random() - 0.5) * 2.5;
          }
        });
      }

      if (meltParticlesRef.current) {
        const isMeltActive = activeConfig.isMelting && activeConfig.meltProgress !== undefined;
        if (isMeltActive && Math.random() < 0.45) {
          const progress = activeConfig.meltProgress || 0;
          let colorHex = activeConfig.skinColor || "#e5a65d";
          const selector = Math.random();

          if (selector < 0.25) colorHex = activeConfig.hairColor || "#141414";
          else if (selector < 0.55) colorHex = activeConfig.clothingColor || "#3b82f6";
          else if (selector < 0.75) colorHex = activeConfig.pantsColor || "#111827";

          if (activeConfig.meltPreset === "gold") colorHex = "#ffd700";
          else if (activeConfig.meltPreset === "acid") colorHex = "#39ff14";
          else if (activeConfig.meltPreset === "lava") colorHex = "#ff4500";
          else if (activeConfig.meltPreset === "slime") colorHex = "#4ade80";

          const viscosity = activeConfig.meltViscosity ?? 0.5;
          const dropSize = 0.03 + Math.random() * 0.04;
          const drop = new THREE.Mesh(
            new THREE.SphereGeometry(dropSize, 5, 5),
            new THREE.MeshStandardMaterial({
              color: new THREE.Color(colorHex),
              roughness: 0.15,
              metalness: activeConfig.meltPreset === "gold" ? 0.9 : 0.08,
              emissive:
                activeConfig.meltPreset === "lava" || activeConfig.meltPreset === "acid"
                  ? new THREE.Color(colorHex)
                  : new THREE.Color(0, 0, 0),
              emissiveIntensity: activeConfig.meltPreset === "lava" ? 1.2 : activeConfig.meltPreset === "acid" ? 0.7 : 0,
            })
          );

          const baseHeight = activeConfig.bodyType === "tall" ? 2.0 : activeConfig.bodyType === "chibi" ? 0.9 : 1.45;
          drop.position.set(
            (Math.random() - 0.5) * 0.7 * (progress + 0.5),
            baseHeight * (1.0 - progress * 0.45) + (Math.random() - 0.5) * 0.15,
            (Math.random() - 0.5) * 0.6 * (progress + 0.5)
          );
          drop.userData = {
            vy: -(0.012 + (1 - viscosity) * 0.03 + Math.random() * 0.02),
            vx: (Math.random() - 0.5) * 0.01,
            vz: (Math.random() - 0.5) * 0.01,
            life: 1.0,
            hasLanded: false,
          };
          meltParticlesRef.current.add(drop);
        }

        [...meltParticlesRef.current.children].forEach((child) => {
          const drop = child as THREE.Mesh;
          const meta = drop.userData;
          if (!meta || meta.hasLanded === undefined) return;

          if (!meta.hasLanded) {
            drop.position.y += meta.vy;
            drop.position.x += meta.vx;
            drop.position.z += meta.vz;
            meta.vy -= 0.0012;
            const speed = Math.abs(meta.vy);
            drop.scale.set(1.0, Math.min(2.5, 1.0 + speed * 4.5), 1.0);

            if (drop.position.y <= 0) {
              drop.position.y = 0;
              meta.hasLanded = true;
              meta.vy = 0;
              meta.vx = 0;
              meta.vz = 0;
              drop.scale.set(2.4, 0.05, 2.4);
            }
          } else {
            drop.scale.x += 0.035;
            drop.scale.z += 0.035;
            meta.life -= 0.032;

            if (!Array.isArray(drop.material)) {
              drop.material.transparent = true;
              drop.material.opacity = Math.max(0, meta.life);
            }
          }

          if (meta.life <= 0 || drop.position.y < -0.4) {
            drop.geometry.dispose();
            if (Array.isArray(drop.material)) {
              drop.material.forEach((material) => material.dispose());
            } else {
              drop.material.dispose();
            }
            meltParticlesRef.current?.remove(drop);
          }
        });
      }

      // Live presets lighting & shader overrides (cheap color HSL settings)
      if (activeConfig.discoMode) {
        if (dirLight) {
          dirLight.color.setHSL((elapsedTime * 0.45) % 1.0, 1.0, 0.55);
          dirLight.position.x = Math.sin(elapsedTime * 3.0) * 4.5;
          dirLight.position.z = Math.cos(elapsedTime * 3.0) * 4.5;
          dirLight.intensity = 1.8;
        }
        if (ambientLight) {
          ambientLight.color.setHex(0x180b2d);
          ambientLight.intensity = 0.3;
        }
        scene.background = new THREE.Color("#0c0919");
      } else if (activeConfig.twoDStyleEffect === "blueprint") {
        if (dirLight) {
          dirLight.color.setHex(0xffffff);
          dirLight.position.set(2, 5, 3);
          dirLight.intensity = 1.3;
        }
        if (ambientLight) {
          ambientLight.color.setHex(0xffffff);
          ambientLight.intensity = 1.0;
        }
        scene.background = new THREE.Color("#0f35a0");
      } else if (activeConfig.twoDStyleEffect === "gameboy") {
        if (dirLight) {
          dirLight.color.setHex(0xeefed1);
          dirLight.position.set(2, 5, 3);
          dirLight.intensity = 0.9;
        }
        if (ambientLight) {
          ambientLight.color.setHex(0x8b956d);
          ambientLight.intensity = 0.7;
        }
        scene.background = new THREE.Color("#8b956d");
      } else if (activeConfig.twoDStyleEffect === "cyberpunk") {
        if (dirLight) {
          dirLight.color.setHex(0xff007f);
          dirLight.position.x = Math.sin(elapsedTime * 2.0) * 3.5;
          dirLight.position.z = Math.cos(elapsedTime * 2.0) * 3.5;
          dirLight.intensity = 1.6;
        }
        if (ambientLight) {
          ambientLight.color.setHex(0x00f0ff);
          ambientLight.intensity = 0.8;
        }
        scene.background = new THREE.Color("#030308");
      } else if (activeConfig.twoDStyleEffect === "sketch") {
        if (dirLight) {
          dirLight.color.setHex(0xffffff);
          dirLight.position.set(4, 8, 2);
          dirLight.intensity = 1.6;
        }
        if (ambientLight) {
          ambientLight.color.setHex(0xeaeaea);
          ambientLight.intensity = 1.1;
        }
        scene.background = new THREE.Color("#fbf9f4");
      } else {
        if (dirLight) {
          dirLight.color.set(activeConfig.keyLightColor || "#ffffff");
          dirLight.position.set(3, 6, 4);
          dirLight.intensity = activeConfig.keyLightIntensity !== undefined ? activeConfig.keyLightIntensity : 0.85;
        }
        if (ambientLight) {
          ambientLight.color.setHex(0xffffff);
          ambientLight.intensity = activeConfig.ambientIntensity !== undefined ? activeConfig.ambientIntensity : 0.75;
        }
        scene.background = new THREE.Color("#CCCCCC");
      }

      // Rig joints active animations
      if (avatarGroupRef.current) {
        const torso = avatarGroupRef.current.getObjectByName("torso") as THREE.Object3D;
        const head = avatarGroupRef.current.getObjectByName("head") as THREE.Object3D;
        const leftArm = avatarGroupRef.current.getObjectByName("left-arm") as THREE.Object3D;
        const rightArm = avatarGroupRef.current.getObjectByName("right-arm") as THREE.Object3D;
        const leftLeg = avatarGroupRef.current.getObjectByName("left-leg") as THREE.Object3D;
        const rightLeg = avatarGroupRef.current.getObjectByName("right-leg") as THREE.Object3D;

        const baseHeight = activeConfig.bodyType === "chibi" ? 0.8 : activeConfig.bodyType === "tall" ? 1.6 : 1.35;

        if (activeAnimMode === "custom") {
          if (head) {
            const headYaw = ((activeConfig.poseHeadYaw !== undefined ? activeConfig.poseHeadYaw : 0) * Math.PI) / 180;
            const headPitch = ((activeConfig.poseHeadPitch !== undefined ? activeConfig.poseHeadPitch : 0) * Math.PI) / 180;
            head.rotation.set(headPitch, headYaw, 0);
          }
          if (leftArm) {
            const rotX = ((activeConfig.poseLeftArmRotationX !== undefined ? activeConfig.poseLeftArmRotationX : 0) * Math.PI) / 180;
            const rotZ = ((activeConfig.poseLeftArmRotationZ !== undefined ? activeConfig.poseLeftArmRotationZ : -5) * Math.PI) / 180;
            leftArm.rotation.set(rotX, 0, rotZ);
          }
          if (rightArm) {
            const rotX = ((activeConfig.poseRightArmRotationX !== undefined ? activeConfig.poseRightArmRotationX : 0) * Math.PI) / 180;
            const rotZ = ((activeConfig.poseRightArmRotationZ !== undefined ? activeConfig.poseRightArmRotationZ : 5) * Math.PI) / 180;
            rightArm.rotation.set(rotX, 0, rotZ);
          }
          if (leftLeg) {
            const rotX = ((activeConfig.poseLeftLegRotationX !== undefined ? activeConfig.poseLeftLegRotationX : 0) * Math.PI) / 180;
            leftLeg.rotation.set(rotX, 0, 0);
          }
          if (rightLeg) {
            const rotX = ((activeConfig.poseRightLegRotationX !== undefined ? activeConfig.poseRightLegRotationX : 0) * Math.PI) / 180;
            rightLeg.rotation.set(rotX, 0, 0);
          }
          if (torso) {
            torso.position.y = baseHeight;
            torso.rotation.set(0, 0, 0);
          }
        } else if (activeAnimMode === "walk") {
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
        } else if (activeAnimMode === "dance") {
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
        } else if (activeAnimMode === "zombie") {
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
        } else if (activeAnimMode === "spin") {
          if (leftLeg) leftLeg.rotation.set(0.08, 0, -0.08);
          if (rightLeg) rightLeg.rotation.set(0.08, 0, 0.08);
          if (leftArm) leftArm.rotation.set(0, 0, -Math.PI / 1.6);
          if (rightArm) rightArm.rotation.set(0, 0, Math.PI / 1.6);

          if (torso) {
            torso.position.y = baseHeight + Math.sin(elapsedTime * 15) * 0.06;
            torso.rotation.set(0, elapsedTime * 10, 0);
          }
          if (head) {
            head.rotation.set(-0.1, 0, 0);
          }
        } else if (activeAnimMode === "ninja") {
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
          // Idle breathing
          if (torso) {
            torso.position.y = baseHeight + Math.sin(elapsedTime * 1.5) * 0.025;
            torso.rotation.set(0, 0, 0);
          }
          if (leftLeg) leftLeg.rotation.set(0, 0, 0);
          if (rightLeg) rightLeg.rotation.set(0, 0, 0);

          if (head) {
            if (isMouseOverRef.current) {
              const targetX = Math.max(-0.25, Math.min(0.25, mouseRef.current.y * 0.4));
              const targetY = Math.max(-0.45, Math.min(0.45, mouseRef.current.x * 0.5));
              head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetX, 0.12);
              head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetY, 0.12);
              head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0, 0.12);
            } else {
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

        const meltProgress = activeConfig.isMelting ? activeConfig.meltProgress || 0 : 0;
        const hairGroupObj = avatarGroupRef.current.getObjectByName("hairGroup") as THREE.Object3D | null;

        if (head) {
          if (head.userData.originalY === undefined) {
            head.userData.originalY = head.position.y;
            head.userData.originalRotZ = head.rotation.z;
            head.userData.originalRotX = head.rotation.x;
          }

          if (meltProgress > 0) {
            head.position.y = head.userData.originalY - meltProgress * 0.45;
            head.rotation.z = head.userData.originalRotZ + Math.sin(elapsedTime * 9.0) * 0.08 * meltProgress;
            head.rotation.x = head.userData.originalRotX + Math.cos(elapsedTime * 7.5) * 0.06 * meltProgress;
          } else {
            head.position.y = head.userData.originalY;
          }
        }

        if (hairGroupObj) {
          if (hairGroupObj.userData.originalY === undefined) {
            hairGroupObj.userData.originalY = hairGroupObj.position.y;
            hairGroupObj.userData.originalRotX = hairGroupObj.rotation.x;
          }

          if (meltProgress > 0) {
            hairGroupObj.position.y = hairGroupObj.userData.originalY - meltProgress * 0.15;
            hairGroupObj.rotation.x = hairGroupObj.userData.originalRotX + Math.sin(elapsedTime * 6.0) * 0.04 * meltProgress;
          } else {
            hairGroupObj.position.y = hairGroupObj.userData.originalY;
            hairGroupObj.rotation.x = hairGroupObj.userData.originalRotX;
          }
        }

        if (leftArm) {
          if (leftArm.userData.originalX === undefined) {
            leftArm.userData.originalX = leftArm.position.x;
            leftArm.userData.originalY = leftArm.position.y;
            leftArm.userData.originalZ = leftArm.position.z;
            leftArm.userData.originalRotZ = leftArm.rotation.z;
          }

          if (meltProgress > 0) {
            leftArm.position.y = leftArm.userData.originalY - meltProgress * 0.3;
            leftArm.position.x = leftArm.userData.originalX - meltProgress * 0.2;
            leftArm.rotation.z = leftArm.userData.originalRotZ - meltProgress * 0.5;
          } else {
            leftArm.position.x = leftArm.userData.originalX;
            leftArm.position.y = leftArm.userData.originalY;
            leftArm.position.z = leftArm.userData.originalZ;
          }
        }

        if (rightArm) {
          if (rightArm.userData.originalX === undefined) {
            rightArm.userData.originalX = rightArm.position.x;
            rightArm.userData.originalY = rightArm.position.y;
            rightArm.userData.originalZ = rightArm.position.z;
            rightArm.userData.originalRotZ = rightArm.rotation.z;
          }

          if (meltProgress > 0) {
            rightArm.position.y = rightArm.userData.originalY - meltProgress * 0.3;
            rightArm.position.x = rightArm.userData.originalX + meltProgress * 0.2;
            rightArm.rotation.z = rightArm.userData.originalRotZ + meltProgress * 0.5;
          } else {
            rightArm.position.x = rightArm.userData.originalX;
            rightArm.position.y = rightArm.userData.originalY;
            rightArm.position.z = rightArm.userData.originalZ;
          }
        }
      }

      if (controlsRef.current) {
        if (activeAutoRotate && activeAnimMode !== "walk" && activeAnimMode !== "spin") {
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
      if (meltParticlesRef.current) {
        [...meltParticlesRef.current.children].forEach((child) => {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material?.dispose();
          }
        });
        meltParticlesRef.current.clear();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (canvasMountRef.current) {
        canvasMountRef.current.innerHTML = "";
      }
    };
  }, []); // Mounts exactly once!

  // 2. Separate dynamic effect to update camera preset and FOV dynamically without recreating context
  useEffect(() => {
    const camera = cameraRef.current;
    if (camera) {
      camera.fov = config.cameraFov !== undefined ? config.cameraFov : 45;
      camera.updateProjectionMatrix();

      const cameraPreset = config.cameraPreset || "front";
      if (avatarGroupRef.current) {
        fitCameraToAvatar(camera, controlsRef.current, avatarGroupRef.current, cameraPreset);
      } else {
        if (cameraPreset === "side") {
          camera.position.set(4.5, 1.5, 0);
        } else if (cameraPreset === "top") {
          camera.position.set(0, 5.0, 0.1);
        } else if (cameraPreset === "isometric") {
          camera.position.set(3.5, 3.5, 3.5);
        } else {
          camera.position.set(0, 1.8, 4.5);
        }
        if (controlsRef.current) {
          controlsRef.current.update();
        }
      }
    }
  }, [config.cameraFov, config.cameraPreset]);

  // 3. Separate dynamic effect to update grid visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = config.showGrid !== false;
    }
  }, [config.showGrid]);

  // 4. Stable callback ref for onSceneReady
  const onSceneReadyRef = useRef(onSceneReady);
  useEffect(() => {
    onSceneReadyRef.current = onSceneReady;
  }, [onSceneReady]);

  // 5. Re-build Avatar ONLY when layout, geometry, or appearance configurations change
  useEffect(() => {
    if (!sceneRef.current) return;

    try {
      // Remove old avatar group if exists
      if (avatarGroupRef.current) {
        sceneRef.current.remove(avatarGroupRef.current);
      }

      // Build new avatar
      const avatarGroup = buildAvatar(config, faceCanvas);
      sceneRef.current.add(avatarGroup);
      avatarGroupRef.current = avatarGroup;

      if (cameraRef.current) {
        fitCameraToAvatar(
          cameraRef.current,
          controlsRef.current,
          avatarGroup,
          config.cameraPreset
        );
      }

      if (onSceneReadyRef.current) {
        onSceneReadyRef.current(avatarGroup);
      }
    } catch (err) {
      console.error("CRITICAL: Failed to build or render 3D Avatar group:", err);
    }
  }, [
    config.skinColor,
    config.hairColor,
    config.clothingColor,
    config.pantsColor,
    config.shoesColor,
    config.hairStyle,
    config.bodyType,
    config.headShape,
    config.accessories,
    config.clothingStyle,
    config.expression,
    config.morphSlender,
    config.morphBulk,
    config.detailLevel,
    config.materialRoughness,
    config.materialMetalness,
    config.wireframeMode,
    config.materialEmissive,
    config.materialEmissiveIntensity,
    config.headScaleX,
    config.headScaleY,
    config.headScaleZ,
    config.headRotateX,
    config.headRotateY,
    config.headRotateZ,
    config.headTranslateX,
    config.headTranslateY,
    config.headTranslateZ,
    config.torsoScaleX,
    config.torsoScaleY,
    config.torsoScaleZ,
    config.torsoTranslateX,
    config.torsoTranslateY,
    config.torsoTranslateZ,
    config.armScaleX,
    config.armScaleY,
    config.armScaleZ,
    config.legScaleX,
    config.legScaleY,
    config.legScaleZ,
    faceCanvas,
  ]);

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
      <div ref={canvasMountRef} className="absolute inset-0" />

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
