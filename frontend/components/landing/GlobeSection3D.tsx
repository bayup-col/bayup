"use client";

import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Float, Stars, PerspectiveCamera, useTexture, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { NumberTicker } from './NumberTicker';

function GlobeMesh() {
  const meshRef = useRef<THREE.Group>(null);
  const earthTexture = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png');
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.001;
  });
  return (
    <group ref={meshRef}>
      <mesh>
        <sphereGeometry args={[2.48, 64, 64]} />
        <meshStandardMaterial color="#020202" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshStandardMaterial alphaMap={earthTexture} transparent opacity={1} color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1.2} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.52, 45, 45]} />
        <meshStandardMaterial color="#FFFFFF" wireframe transparent opacity={0.1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.6, 64, 64]} />
        <meshBasicMaterial color="#00f2ff" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function FloatingParticlesLayer({ count = 60 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -viewport.width + Math.random() * (viewport.width * 2);
      const yFactor = -viewport.height + Math.random() * (viewport.height * 2);
      const zFactor = -10 + Math.random() * 20;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor });
    }
    return temp;
  }, [count, viewport]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      dummy.position.set(xFactor + a * factor * 0.1, yFactor + b * factor * 0.1, zFactor + s);
      dummy.scale.set(s * 0.2 + 0.2, s * 0.2 + 0.2, s * 0.2 + 0.2);
      dummy.updateMatrix();
      if (mesh.current) mesh.current.setMatrixAt(i, dummy.matrix);
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color="#00f2ff" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  );
}

function MouseLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  const { mouse, viewport } = useThree();
  useFrame(() => {
    if (!lightRef.current) return;
    lightRef.current.position.set((mouse.x * viewport.width) / 2, (mouse.y * viewport.height) / 2, 5);
  });
  return <pointLight ref={lightRef} intensity={35} distance={25} color="#00f2ff" decay={2} />;
}

function InteractiveStars() {
  const pointsRef = useRef<THREE.Points>(null);
  const { mouse, viewport } = useThree();
  const count = 4000;
  const [positions, colors, sizes, originals, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const orig = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 60;
      pos[i * 3] = orig[i * 3] = x; pos[i * 3 + 1] = orig[i * 3 + 1] = y; pos[i * 3 + 2] = orig[i * 3 + 2] = z;
      vel[i * 3] = vel[i * 3 + 1] = vel[i * 3 + 2] = 0;
      cols[i * 3] = 0.05; cols[i * 3 + 1] = 0.1; cols[i * 3 + 2] = 0.1;
      s[i] = Math.random() * 0.4 + 0.1;
    }
    return [pos, cols, s, orig, vel];
  }, []);
  useFrame((state) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const colorAttr = pointsRef.current.geometry.attributes.color;
    const sizeAttr = pointsRef.current.geometry.attributes.size;
    const mx = (mouse.x * viewport.width) / 2;
    const my = (mouse.y * viewport.height) / 2;
    const time = state.clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const dx = mx - posAttr.array[i3];
      const dy = my - posAttr.array[i3 + 1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 15) {
        const force = (1 - dist / 15) * 0.02;
        const orbitX = Math.cos(time + i) * 0.5;
        const orbitY = Math.sin(time + i) * 0.5;
        velocities[i3] += (dx + orbitX) * force;
        velocities[i3 + 1] += (dy + orbitY) * force;
        velocities[i3 + 2] += (0 - posAttr.array[i3 + 2]) * force;
        let visibility = 1;
        if (dist < 6) visibility = Math.max(0, (dist - 2) / 4);
        const intensity = (1 - dist / 15) * visibility;
        colorAttr.setXYZ(i, 0, 3 * intensity, 4 * intensity);
        sizeAttr.setX(i, sizes[i] * (1 + intensity * 2) * visibility);
      } else {
        velocities[i3] += (originals[i3] - posAttr.array[i3]) * 0.005;
        velocities[i3 + 1] += (originals[i3 + 1] - posAttr.array[i3 + 1]) * 0.005;
        velocities[i3 + 2] += (originals[i3 + 2] - posAttr.array[i3 + 2]) * 0.005;
        colorAttr.setXYZ(i, THREE.MathUtils.lerp(colorAttr.getX(i), 0.05, 0.1), THREE.MathUtils.lerp(colorAttr.getY(i), 0.1, 0.1), THREE.MathUtils.lerp(colorAttr.getZ(i), 0.1, 0.1));
        sizeAttr.setX(i, THREE.MathUtils.lerp(sizeAttr.getX(i), sizes[i], 0.1));
      }
      velocities[i3] *= 0.92; velocities[i3 + 1] *= 0.92; velocities[i3 + 2] *= 0.92;
      posAttr.array[i3] += velocities[i3]; posAttr.array[i3 + 1] += velocities[i3 + 1]; posAttr.array[i3 + 2] += velocities[i3 + 2];
    }
    posAttr.needsUpdate = true; colorAttr.needsUpdate = true; sizeAttr.needsUpdate = true;
  });
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute name="size" attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial vertexColors transparent opacity={1} size={0.035} sizeAttenuation={true} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function CometSystem() {
  const comets = Array.from({ length: 5 }).map(() => useRef<THREE.Mesh>(null));
  const [states, setStates] = useState(comets.map(() => ({ active: false })));
  useFrame((state) => {
    comets.forEach((ref, i) => {
      if (!ref.current) return;
      if (!states[i].active && Math.random() < 0.015) {
        states[i].active = true;
        ref.current.position.set(-35 - (Math.random() * 15), (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20);
        setStates([...states]);
      }
      if (states[i].active) {
        ref.current.position.x += 1.4; ref.current.position.y -= 0.25;
        if (ref.current.position.x > 35) { states[i].active = false; setStates([...states]); }
      }
    });
  });
  return <>{comets.map((ref, i) => (<mesh key={i} ref={ref} visible={states[i].active}><sphereGeometry args={[0.08, 8, 8]} /><meshBasicMaterial color="#00f2ff" /><pointLight intensity={8} distance={15} color="#00f2ff" /></mesh>))}</>;
}

function GlowHeading({ children, mousePos }: { children: React.ReactNode, mousePos: { x: number, y: number } }) {
  return (
    <div className="relative group">
      <motion.div
        className="absolute inset-0 -z-10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(0, 242, 255, 0.4), transparent 70%)`
        }}
      />
      <motion.div
        className="absolute inset-0 -z-20 blur-[100px] opacity-20"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: 'radial-gradient(circle at center, #00f2ff, transparent 70%)'
        }}
      />
      {children}
    </div>
  );
}

export const GlobeSection3D = () => {
  const [headingMousePos, setHeadingMousePos] = useState({ x: 50, y: 50 });
  const headingRef = useRef<HTMLDivElement>(null);

  const handleHeadingMouseMove = (e: React.MouseEvent) => {
    if (!headingRef.current) return;
    const rect = headingRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHeadingMousePos({ x, y });
  };

  return (
    <section id="global" className="relative h-screen w-full bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
      
      {/* BACKGROUND CANVAS (Starfield + Particles) */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 15] }}>
          <MouseLight />
          <FloatingParticlesLayer />
          <InteractiveStars />
          <CometSystem />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </Canvas>
      </div>

      {/* MOBILE GLOBE BACKGROUND */}
      <div className="absolute inset-0 z-1 lg:hidden">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} />
          <OrbitControls enableZoom={false} enablePan={false} makeDefault rotateSpeed={0.5} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} color="#00f2ff" intensity={1} />
          <Suspense fallback={null}><GlobeMesh /></Suspense>
        </Canvas>
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 flex flex-col lg:grid lg:grid-cols-2 gap-10 md:gap-20 items-center justify-center h-full">
        
        {/* TEXT CONTENT */}
        <div 
          ref={headingRef}
          onMouseMove={handleHeadingMouseMove}
          className="space-y-8 md:space-y-10 flex flex-col items-center lg:items-start text-center lg:text-left pointer-events-auto"
        >
          <div className="space-y-3 flex flex-col items-center lg:items-start">
            <div className="h-1.5 w-16 bg-cyan shadow-[0_0_20px_#00f2ff]" />
            <p className="text-xs md:text-lg font-black tracking-[0.5em] text-cyan uppercase italic drop-shadow-[0_0:10px_rgba(0,242,255,0.8)]">NO TE LIMITES</p>
          </div>
          
          <GlowHeading mousePos={headingMousePos}>
            <h2 className="text-5xl md:text-[5.5rem] font-black text-white italic tracking-tighter leading-[0.9] md:leading-[0.85] uppercase relative z-10">
              VENDE EN TODO <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan to-petroleum">EL MUNDO.</span>
            </h2>
          </GlowHeading>

          <p className="max-w-xs md:max-w-md text-white/90 text-sm md:text-sm font-black leading-relaxed uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            Tu local físico ya no es el límite. Lleva tus productos a cualquier rincón del planeta y convierte al mundo entero en tu cliente.
          </p>

          <div className="flex gap-10 md:gap-12 border-t border-white/10 pt-10 w-full justify-center lg:justify-start">
            <div className="flex flex-col items-center lg:items-start">
              <p className="text-3xl md:text-2xl font-black text-cyan italic">+200</p>
              <p className="text-[9px] md:text-[8px] font-bold text-gray-500 uppercase mt-1">Comercios</p>
            </div>
            <div className="flex flex-col items-center lg:items-start">
              <p className="text-3xl md:text-2xl font-black text-cyan italic">+50K</p>
              <p className="text-[9px] md:text-[8px] font-bold text-gray-500 uppercase mt-1">Ventas</p>
            </div>
            <div className="flex flex-col items-center lg:items-start">
              <p className="text-3xl md:text-2xl font-black text-cyan italic">REAL</p>
              <p className="text-[9px] md:text-[8px] font-bold text-gray-500 uppercase mt-1">Soporte</p>
            </div>
          </div>
        </div>

        {/* DESKTOP GLOBE (HIDDEN ON MOBILE) */}
        <div className="hidden lg:flex relative h-[600px] items-center justify-center cursor-grab active:cursor-grabbing">
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 0, 6]} />
            <OrbitControls enableZoom={false} enablePan={false} makeDefault rotateSpeed={0.5} enableDamping={true} dampingFactor={0.05} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} color="#00f2ff" intensity={1} />
            <Suspense fallback={null}><GlobeMesh /></Suspense>
          </Canvas>
          
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-1/4 right-1/4 bg-white/[0.02] backdrop-blur-[100px] border-2 border-white/40 p-8 rounded-[3rem] space-y-2 pointer-events-none shadow-[0_40px_80px_-15px_rgba(0,77,77,0.4)] border-b-cyan/30 isolate">
            <div className="absolute inset-0 bg-petroleum/10 rounded-[3rem] -z-10" />
            <p className="text-cyan text-[10px] font-black uppercase tracking-[0.3em]">TRÁFICO EN VIVO</p>
            <p className="text-white text-2xl font-black italic">
              <NumberTicker value={854200} className="text-2xl font-black" /> 
              <span className="text-xs uppercase not-italic text-white/40 ml-1">ops/s</span>
            </p>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-4">
              <div className="h-full w-2/3 bg-gradient-to-r from-cyan to-petroleum shadow-[0_0_10px_#00f2ff]" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
