"use client";

import React, { useEffect, useRef } from "react";

const MAX_LINK_DISTANCE = 120;

export const FloatingParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let paused = false;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = (Math.random() * 2 + 0.5) * dpr;
        this.speedX = (Math.random() - 0.5) * 0.3 * dpr;
        this.speedY = (Math.random() - 0.5) * 0.3 * dpr;
        this.opacity = Math.random() * 0.4 + 0.1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        const dx = mouse.current.x - this.x;
        const dy = mouse.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Repulsión suave
        if (distance < 150 * dpr) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (150 * dpr - distance) / (150 * dpr);
          this.x -= forceDirectionX * force * 2;
          this.y -= forceDirectionY * force * 2;
        }

        if (this.x > canvas!.width) this.x = 0;
        else if (this.x < 0) this.x = canvas!.width;
        if (this.y > canvas!.height) this.y = 0;
        else if (this.y < 0) this.y = canvas!.height;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 242, 255, ${this.opacity})`;
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      // Densidad acotada: en pantallas grandes evita disparar el número de
      // partículas (y por tanto los pares a comparar) sin límite.
      const numberOfParticles = Math.min(
        Math.floor((canvas.width * canvas.height) / (9000 * dpr * dpr)),
        140
      );
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    };

    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      init();
    };

    // Conecta partículas cercanas usando un grid espacial en vez de comparar
    // cada par (O(n²)): así con 100+ partículas no se dispara el costo por
    // frame y el scroll/animaciones encima dejan de sentirse "trabados".
    const drawLines = () => {
      if (!ctx) return;
      const cellSize = MAX_LINK_DISTANCE * dpr;
      const grid = new Map<string, Particle[]>();

      const cellKey = (x: number, y: number) => `${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`;

      for (const p of particles) {
        const key = cellKey(p.x, p.y);
        const bucket = grid.get(key);
        if (bucket) bucket.push(p);
        else grid.set(key, [p]);
      }

      const maxDist = cellSize;

      for (const p of particles) {
        const cx = Math.floor(p.x / cellSize);
        const cy = Math.floor(p.y / cellSize);

        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const neighbors = grid.get(`${cx + ox}:${cy + oy}`);
            if (!neighbors) continue;

            for (const other of neighbors) {
              if (other === p) continue;
              const dx = p.x - other.x;
              const dy = p.y - other.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < maxDist) {
                const opacity = (1 - distance / maxDist) * 0.2;
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0, 242, 255, ${opacity})`;
                ctx.lineWidth = 0.5 * dpr;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(other.x, other.y);
                ctx.stroke();
              }
            }
          }
        }
      }
    };

    const animate = () => {
      if (!paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((particle) => {
          particle.update();
          particle.draw();
        });
        drawLines();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX * dpr;
      mouse.current.y = e.clientY * dpr;
    };

    const handleMouseLeave = () => {
      mouse.current.x = -1000;
      mouse.current.y = -1000;
    };

    const handleVisibilityChange = () => {
      paused = document.hidden;
    };

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 150);
    };

    resizeCanvas();
    animate();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeout(resizeTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none opacity-80"
      style={{ background: "transparent" }}
    />
  );
};
