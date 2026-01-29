"use client";

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, PerspectiveCamera, OrbitControls, Environment, Text, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

const products = [
  { name: 'CAMISETA', icon: '👕', color: '#00f2ff', detail: 'PREMIUM APPAREL' },
  { name: 'LAPTOP', icon: '💻', color: '#004d4d', detail: 'TECH ENGINE' },
  { name: 'MAQUILLAJE', icon: '💄', color: '#ff007a', detail: 'BEAUTY LUXE' },
  { name: 'BICICLETA', icon: '🚲', color: '#00ff88', detail: 'SMART MOBILITY' },
  { name: 'CELULAR', icon: '📱', color: '#4d00ff', detail: 'NEXT GEN' },
  { name: 'TENIS', icon: '👟', color: '#ffcc00', detail: 'STREET STYLE' },
];

function ProductModel({ index, mouse }: { index: number, mouse: React.MutableRefObject<[number, number]> }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Inercia de mouse
    const targetRotationX = mouse.current[1] * 0.5;
    const targetRotationY = mouse.current[0] * 0.5;
    
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotationX, 0.1);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotationY, 0.1);
    
    // Flotación constante
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <MeshDistortMaterial 
            color={products[index].color} 
            speed={3} 
            distort={0.4} 
            radius={1}
            roughness={0.1}
            metalness={0.8}
          />
          <Text
            position={[0, 0, 1.1]}
            fontSize={1.5}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {products[index].icon}
          </Text>
        </mesh>
      </Float>
    </group>
  );
}

export const Hero3D = () => {
  const [index, setIndex] = useState(0);
  const mouse = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = [
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      ];
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % products.length);
    }, 4000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="relative h-screen w-full bg-graphite overflow-hidden">
      
      {/* 1. Fondo Cinematográfico con Movimiento */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,77,77,0.2),transparent_70%)] animate-pulse-slow" />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-mesh-pattern" />
        
        {/* Grid futurista */}
        <div className="absolute inset-0 opacity-[0.05]" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '100px 100px' }} 
        />
      </div>

      {/* 2. Contenido de Texto Narrativo */}
      <div className="absolute inset-0 z-20 flex flex-col justify-between p-12 pointer-events-none">
        <div className="flex justify-between items-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="h-1 w-12 bg-cyan shadow-[0_0_15px_#00f2ff]" />
            <p className="text-[10px] font-black tracking-[0.5em] text-cyan uppercase italic">Cinematic Engine v3.0</p>
          </motion.div>
          <div className="text-right">
            <p className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">Scroll to explore</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-8xl md:text-[12rem] font-black text-white italic leading-[0.8] tracking-tighter opacity-10 absolute -top-20 -left-10 select-none">
                {products[index].name}
              </h1>
              <h2 className="text-6xl md:text-8xl font-black text-white italic leading-[0.9] tracking-tighter relative z-10">
                VENDE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan to-petroleum">
                  SIN LÍMITES.
                </span>
              </h2>
              <p className="mt-8 text-white/50 font-medium text-lg max-w-sm border-l-2 border-cyan/30 pl-6 uppercase tracking-widest text-[10px]">
                {products[index].detail} • {products[index].name} EXPERIENCE
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex gap-4 pointer-events-auto">
            <button className="px-10 py-5 bg-white text-black font-black text-xs uppercase tracking-[0.3em] italic hover:bg-cyan transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              Get Started
            </button>
          </div>
          <div className="space-y-2">
            {products.map((p, i) => (
              <div key={i} className={`h-1 transition-all duration-500 ${i === index ? 'w-12 bg-cyan' : 'w-4 bg-white/10'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* 3. El Escaparate 3D Interactivo */}
      <div className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
        <Canvas dpr={[1, 2]} gl={{ antialias: true }}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
          <pointLight position={[-10, -10, -10]} color={products[index].color} intensity={1} />
          
          <Suspense fallback={null}>
            <ProductModel index={index} mouse={mouse} />
            <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
            <Environment preset="city" />
          </Suspense>
        </Canvas>
      </div>

    </section>
  );
};
