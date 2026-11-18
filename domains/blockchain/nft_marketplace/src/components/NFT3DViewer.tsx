import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Model3DType } from '../types/nft';
import { Eye, RotateCw, Box } from 'lucide-react';

interface NFT3DViewerProps {
  modelType: Model3DType;
  primaryColor?: number;
}

export const NFT3DViewer: React.FC<NFT3DViewerProps> = ({
  modelType,
  primaryColor = 0x00f0ff
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isWireframe, setIsWireframe] = useState(false);
  const [isRotating, setIsRotating] = useState(true);

  // Mesh and material references
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const materialsRef = useRef<THREE.Material[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 380;
    const height = mountRef.current.clientHeight || 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 3.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Group to hold 3D objects
    const group = new THREE.Group();
    meshGroupRef.current = group;
    scene.add(group);

    // Materials
    materialsRef.current = [];
    const mainMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.2,
      metalness: 0.85,
      wireframe: isWireframe,
      emissive: 0x112244,
      emissiveIntensity: 0.3
    });
    materialsRef.current.push(mainMat);

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    materialsRef.current.push(wireMat);

    // Build specific 3D geometry
    switch (modelType) {
      case 'torus-knot': {
        const geo = new THREE.TorusKnotGeometry(1, 0.3, 128, 32);
        const mesh = new THREE.Mesh(geo, mainMat);
        group.add(mesh);
        break;
      }
      case 'hypercube': {
        const outerGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
        const outerMesh = new THREE.Mesh(outerGeo, wireMat);
        const innerGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        const innerMesh = new THREE.Mesh(innerGeo, mainMat);
        group.add(outerMesh);
        group.add(innerMesh);
        break;
      }
      case 'prism': {
        const geo = new THREE.OctahedronGeometry(1.3, 0);
        const mesh = new THREE.Mesh(geo, mainMat);
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 })
        );
        group.add(mesh);
        group.add(edges);
        break;
      }
      case 'singularity': {
        const coreGeo = new THREE.SphereGeometry(0.8, 32, 32);
        const coreMesh = new THREE.Mesh(coreGeo, mainMat);
        const diskGeo = new THREE.RingGeometry(1.2, 1.8, 64);
        const diskMat = new THREE.MeshBasicMaterial({
          color: 0xff007f,
          side: THREE.DoubleSide,
          wireframe: true
        });
        const disk = new THREE.Mesh(diskGeo, diskMat);
        disk.rotation.x = Math.PI / 2.5;
        group.add(coreMesh);
        group.add(disk);
        break;
      }
      case 'dodecahedron': {
        const geo = new THREE.DodecahedronGeometry(1.2, 0);
        const mesh = new THREE.Mesh(geo, mainMat);
        const wire = new THREE.Mesh(geo, wireMat);
        wire.scale.set(1.02, 1.02, 1.02);
        group.add(mesh);
        group.add(wire);
        break;
      }
      case 'crystal':
      default: {
        const geo = new THREE.IcosahedronGeometry(1.2, 0);
        const mesh = new THREE.Mesh(geo, mainMat);
        const wire = new THREE.Mesh(geo, wireMat);
        wire.scale.set(1.05, 1.05, 1.05);
        group.add(mesh);
        group.add(wire);
        break;
      }
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight1.position.set(3, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff007f, 2.0);
    dirLight2.position.set(-3, -3, -2);
    scene.add(dirLight2);

    // Interactive Drag Orbit
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !group) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      group.rotation.y += deltaX * 0.015;
      group.rotation.x += deltaY * 0.015;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Animation Loop
    // EASTER EGG #11: rotationSpeed starts at 0.012 but is captured in the closure.
    // Each time the modal is closed and re-opened, a NEW animate() loop is started via
    // the useEffect (dependency: [modelType, primaryColor]) BUT isRotating is NOT in the dep array.
    // This means if you toggle rotation off/on and reopen the modal, the OLD loop is not fully
    // cancelled before a new one starts. The speed accumulates: 0.012 → 0.024 → 0.048…
    // The 3D mesh spins faster and faster with each modal reopen until it's a visual blur!
    // Fix: Add isRotating to the dependency array and ensure cancelAnimationFrame(animId) fires first.
    let animId: number;
    let rotationSpeed = 0.012; // EASTER EGG #11: should be a const, not accumulating var
    const animate = () => {
      if (isRotating && !isDragging && group) {
        group.rotation.y += rotationSpeed;
        group.rotation.x += 0.005;
        rotationSpeed *= 1.0001; // silent exponential creep per frame
      }
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelType, primaryColor]);

  // Handle wireframe toggle dynamically
  const toggleWireframe = () => {
    setIsWireframe(prev => {
      const next = !prev;
      materialsRef.current.forEach(mat => {
        if ('wireframe' in mat) {
          (mat as THREE.MeshStandardMaterial).wireframe = next;
        }
      });
      return next;
    });
  };

  return (
    <div className="relative w-full h-[380px] bg-slate-950/80 rounded-2xl border border-cyber-border overflow-hidden group">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating HUD controls */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <button
          onClick={toggleWireframe}
          title="Toggle Wireframe Mesh"
          className={`p-2 rounded-lg backdrop-blur-md border text-xs font-mono transition-all ${
            isWireframe
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
              : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-500'
          }`}
        >
          <Box className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsRotating(prev => !prev)}
          title="Toggle Rotation"
          className={`p-2 rounded-lg backdrop-blur-md border text-xs font-mono transition-all ${
            isRotating
              ? 'bg-pink-500/20 border-pink-400 text-pink-300'
              : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-500'
          }`}
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 text-[11px] font-mono text-slate-400">
        <Eye className="w-3.5 h-3.5 text-cyan-400" />
        <span>3D SHADER MODEL • CLICK & DRAG</span>
      </div>
    </div>
  );
};
