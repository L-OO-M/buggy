import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useMarketplace } from '../context/MarketplaceContext';
import { Sparkles, Orbit, Compass, Zap } from 'lucide-react';

export const ThreeCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { antiGravityActive, setAntiGravityActive } = useMarketplace();

  // Reference for velocities to illustrate Easter Egg #2
  const velocitiesRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 520;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07080d, 0.035);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 2. Central 3D Antigravity Nexus Artifact
    const group = new THREE.Group();

    // Inner Glowing Core (Icosahedron)
    const coreGeo = new THREE.IcosahedronGeometry(1.1, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      wireframe: true,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Inner solid core
    const innerSolidGeo = new THREE.OctahedronGeometry(0.7, 0);
    const innerSolidMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x7f00ff,
      emissiveIntensity: 0.4
    });
    const innerSolid = new THREE.Mesh(innerSolidGeo, innerSolidMat);
    group.add(innerSolid);

    // Orbiting Torus Rings
    const ringGeo1 = new THREE.TorusGeometry(1.8, 0.025, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    group.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.1, 0.02, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    group.add(ring2);

    scene.add(group);

    // 3. Ambient & Point Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointCyan = new THREE.PointLight(0x00f0ff, 3, 50);
    pointCyan.position.set(4, 5, 4);
    scene.add(pointCyan);

    const pointPink = new THREE.PointLight(0xff007f, 3, 50);
    pointPink.position.set(-4, -3, 3);
    scene.add(pointPink);

    // 4. Floating Antigravity Particles Field
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 16;
      positions[i + 1] = (Math.random() - 0.5) * 12;
      positions[i + 2] = (Math.random() - 0.5) * 16;

      velocities[i] = (Math.random() - 0.5) * 0.02;
      velocities[i + 1] = Math.random() * 0.03 + 0.01; // upward velocity
      velocities[i + 2] = (Math.random() - 0.5) * 0.02;
    }

    velocitiesRef.current = velocities;
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // INTENTIONAL BUG (ISSUE #06):
    // The window resize listener improperly hardcodes 300x300 or fails to update camera.aspect properly!
    const handleBrokenResize = () => {
      // Flawed resize handling that squishes or fails on responsive changes
      if (!renderer || !camera) return;
      // Intentionally hardcoded or unproportional resize trigger:
      const brokenWidth = containerRef.current?.clientWidth || 300;
      renderer.setSize(brokenWidth, 300); // Buggy: forces height to 300px instead of clientHeight!
      // Missing: camera.aspect = width / height; camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleBrokenResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Rotate central artifact
      group.rotation.y = elapsedTime * 0.4 + mouseX * 0.5;
      group.rotation.x = Math.sin(elapsedTime * 0.5) * 0.2 - mouseY * 0.4;
      coreMesh.rotation.y += 0.005;
      innerSolid.rotation.z += 0.01;
      ring1.rotation.z += 0.008;
      ring2.rotation.x += 0.006;

      // Antigravity floating bobbing
      group.position.y = Math.sin(elapsedTime * 1.5) * 0.18;

      // Particle update physics
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        
        // Update positions based on velocity
        posArray[idx] += velocities[idx];
        posArray[idx + 1] += velocities[idx + 1];
        posArray[idx + 2] += velocities[idx + 2];

        // Boundary wrap
        if (posArray[idx + 1] > 6) posArray[idx + 1] = -6;
        if (posArray[idx + 1] < -6) posArray[idx + 1] = 6;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // INTENTIONAL FLAW (ISSUE #06): Incomplete cleanup leaves listeners & render loop running if not fixed
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleBrokenResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Easter Egg #2: The Antigravity Singularity (Velocity Exploder)
  const handleToggleGravity = () => {
    setAntiGravityActive(prev => {
      const nextState = !prev;
      if (velocitiesRef.current) {
        // EASTER EGG #2: Multiplies velocities by -1.85 exponentially without clamping!
        // Clicking this repeatedly makes velocities reach NaN / Infinity, destroying WebGL matrices!
        for (let i = 0; i < velocitiesRef.current.length; i++) {
          velocitiesRef.current[i] *= -1.85;
        }
      }
      return nextState;
    });
  };

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-[#090a0f] shadow-2xl group">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Subtle Spatial Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Hero Content HUD Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10 pointer-events-none">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-mono font-medium text-slate-300">ZERO-G ENGINE ONLINE</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleGravity}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors border backdrop-blur-md ${
                antiGravityActive
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>GRAVITY: {antiGravityActive ? 'ZERO-G FLOATING' : 'STANDARD G'}</span>
            </button>
          </div>
        </div>

        {/* Center / Bottom Typography */}
        <div className="max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            THREE.JS INTERACTIVE ENVIRONMENT
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            DISCOVER THE <br />
            ZERO-G RELIC VAULT
          </h1>

          <p className="text-xs md:text-sm text-slate-300 font-normal leading-relaxed max-w-md">
            Decentralized spatial collectibles and 3D quantum artifacts floating in perpetual zero-gravity suspension.
          </p>

          {/* Quick Stats Grid */}
          <div className="pt-2 flex items-center gap-6 text-slate-300 font-mono text-xs">
            <div>
              <div className="text-white font-bold text-base">24.8k ETH</div>
              <div className="text-slate-500 text-[10px]">TOTAL VOLUME</div>
            </div>
            <div className="w-[1px] h-7 bg-white/10" />
            <div>
              <div className="text-cyan-400 font-bold text-base">0.05 ETH</div>
              <div className="text-slate-500 text-[10px]">FLOOR PRICE</div>
            </div>
            <div className="w-[1px] h-7 bg-white/10" />
            <div>
              <div className="text-white font-bold text-base">1,402</div>
              <div className="text-slate-500 text-[10px]">ITEMS FLOATING</div>
            </div>
          </div>
        </div>

        {/* Subtle Canvas Controls Hint */}
        <div className="text-right pointer-events-auto">
          <span className="text-[11px] font-mono text-slate-500 flex items-center justify-end gap-1.5">
            <Orbit className="w-3.5 h-3.5" /> Interactive 3D Canvas • Drag or tilt cursor
          </span>
        </div>
      </div>
    </div>
  );
};
