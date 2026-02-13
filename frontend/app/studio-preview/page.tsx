"use client";

import React, { useEffect, useState } from "react";
import { Canvas } from "../dashboard/pages/studio/internal-studio-parts/Canvas";
import { StudioProvider } from "../dashboard/pages/studio/context";
import { PageSchema } from "../dashboard/pages/studio/context";

export default function PreviewPage() {
  const [data, setData] = useState<PageSchema | null>(null);

  useEffect(() => {
    // Leemos los datos que guardó el Studio antes de abrir esta pestaña
    const saved = localStorage.getItem("bayup-studio-preview");
    if (saved) {
      setData(JSON.parse(saved));
    }
  }, []);

  if (!data) return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white font-black uppercase tracking-[0.5em] animate-pulse">
      Cargando Previsualización Platinum...
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* 
          Envolvemos en el StudioProvider para que los componentes tengan acceso al contexto,
          pero le pasamos el modo isPreview al Canvas para que se vea como una web real.
      */}
      <StudioProvider>
        <Canvas overrideData={data} isPreview={true} />
      </StudioProvider>
    </div>
  );
}
