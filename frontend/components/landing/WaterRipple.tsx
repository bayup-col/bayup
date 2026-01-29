"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 toMouse = uv - uMouse;
    float d = length(toMouse);
    float ripple = sin(d * 45.0 - uTime * 6.0) * exp(-d * 12.0);
    vec2 distortedUv = uv + (normalize(toMouse + 0.0001) * ripple * uIntensity);
    
    vec3 color1 = vec3(0.98, 0.98, 0.98); 
    vec3 color2 = vec3(0.94, 0.94, 0.95); 
    
    float grad = distance(distortedUv, vec2(0.5, 0.5));
    vec3 finalColor = mix(color1, color2, grad * 1.3);
    finalColor += (ripple * uIntensity * 1.0);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function RipplePlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const intensityRef = useRef(0);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uIntensity: { value: 0 }
  }), []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1.0 - (e.clientY / window.innerHeight);
      intensityRef.current = 0.09; 
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    material.uniforms.uMouse.value.lerp(mouseRef.current, 0.1);
    material.uniforms.uIntensity.value = THREE.MathUtils.lerp(material.uniforms.uIntensity.value, intensityRef.current, 0.05);
    intensityRef.current = THREE.MathUtils.lerp(intensityRef.current, 0.03, 0.01);
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export const WaterRipple = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none w-full h-full overflow-hidden">
      <Canvas 
        camera={{ position: [0, 0, 1], fov: 90 }}
        style={{ width: '100vw', height: '100vh', background: '#FAFAFA' }}
      >
        <RipplePlane />
      </Canvas>
    </div>
  );
};