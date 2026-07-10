import { useEffect, useRef } from "react";
import * as THREE from "three";
import { AvatarConfig } from "../types";
import { buildAvatar } from "../utils/avatarBuilder";

interface ThreeMiniCanvasProps {
  config: AvatarConfig;
  className?: string;
}

export default function ThreeMiniCanvas({ config, className = "" }: ThreeMiniCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Scene
    const scene = new THREE.Scene();
    
    // Create Camera
    const width = containerRef.current.clientWidth || 220;
    const height = containerRef.current.clientHeight || 220;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 20);
    
    // Position camera to zoom in on the upper torso and head/accessories
    camera.position.set(0, 1.35, 2.2);
    camera.lookAt(new THREE.Vector3(0, 1.1, 0));

    // Create WebGLRenderer with transparency enabled to blend with card backgrounds
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Optimizing performance
    
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    // Setup Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
    fillLight.position.set(-2, 2, -1);
    scene.add(fillLight);

    // Build the Avatar group from configuration
    let avatarGroup: THREE.Group | null = null;
    try {
      avatarGroup = buildAvatar(config, null);
      scene.add(avatarGroup);
    } catch (err) {
      console.warn("Could not construct preview avatar model:", err);
    }

    // Gentle render loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();
      if (avatarGroup) {
        // Slow automatic rotation showcasing the model's angles
        avatarGroup.rotation.y = elapsedTime * 0.55;
        
        // Gentle micro-bobbing to feel alive
        avatarGroup.position.y = Math.sin(elapsedTime * 2.0) * 0.02;
      }
      
      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer for dynamic dimensions
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: newWidth, height: newHeight } = entries[0].contentRect;
      if (renderer && camera) {
        renderer.setSize(newWidth, newHeight);
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Clean up WebGL resources and animation frame on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      
      if (avatarGroup) {
        avatarGroup.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            if (node.geometry) node.geometry.dispose();
            if (Array.isArray(node.material)) {
              node.material.forEach((mat) => mat.dispose());
            } else if (node.material) {
              node.material.dispose();
            }
          }
        });
        scene.remove(avatarGroup);
      }

      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [config]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full min-h-[200px] relative select-none cursor-default ${className}`}
    />
  );
}
