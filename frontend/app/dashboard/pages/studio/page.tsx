"use client";

import React, { useState, useEffect } from "react";
import { StudioProvider, useStudio, ComponentType } from "./context";
import { ToolboxSidebar } from "./internal-studio-parts/ToolboxSidebar";
import { Canvas } from "./internal-studio-parts/Canvas";
import { DesignerInspector } from "./internal-studio-parts/StudioPropertiesInspector";
import { ChevronLeft, Save, Eye, Smartphone, Monitor, Tablet, MousePointer2 } from "lucide-react";
import Link from "next/link";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, defaultDropAnimationSideEffects } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { cn } from "@/lib/utils";

const StudioInterface = () => {
  const { sidebarView, toggleSidebar, handleDragEnd, viewport, setViewport } = useStudio();
  const [activeDragItem, setActiveDragItem] = useState<ComponentType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveDragItem(event.active.data.current?.type);
  };

  return (
    <DndContext 
      id="bayup-studio-v2-dnd"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={(e) => {
        handleDragEnd(e);
        setActiveDragItem(null);
      }}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="fixed inset-0 z-[100] flex flex-col h-screen w-screen bg-gray-100 overflow-hidden text-gray-900 font-sans">
        
        {/* HEADER DEL STUDIO */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-[110] shadow-sm">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/pages" 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="font-bold text-gray-800 leading-tight text-base">Bayup Studio</h1>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter text-nowrap">Editor Visual Pro v4.0</p>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
             <button onClick={() => setViewport("desktop")} className={cn("p-2 rounded-lg transition-all", viewport === "desktop" ? "text-blue-600 bg-white shadow-sm" : "text-gray-400")}>
               <Monitor size={16} />
             </button>
             <button onClick={() => setViewport("tablet")} className={cn("p-2 rounded-lg transition-all", viewport === "tablet" ? "text-blue-600 bg-white shadow-sm" : "text-gray-400")}>
               <Tablet size={16} />
             </button>
             <button onClick={() => setViewport("mobile")} className={cn("p-2 rounded-lg transition-all", viewport === "mobile" ? "text-blue-600 bg-white shadow-sm" : "text-gray-400")}>
               <Smartphone size={16} />
             </button>
          </div>

          <div className="flex items-center gap-3">
            {sidebarView === "properties" && (
              <button 
                onClick={() => toggleSidebar("toolbox")}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <ChevronLeft size={14} /> Toolbox
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Eye size={18} />
              <span>Previsualizar</span>
            </button>
            <button className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
              <Save size={18} />
              <span>Publicar Web</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden relative">
          <div className={`transition-all duration-500 ease-in-out h-full ${sidebarView === "toolbox" ? "translate-x-0 w-64" : "-translate-x-full w-0 absolute"}`}>
             <ToolboxSidebar />
          </div>
          <div className="flex-1 flex flex-col min-w-0 bg-gray-100 h-full overflow-hidden">
             <Canvas />
          </div>
          <div className={`transition-all duration-500 ease-in-out h-full ${sidebarView === "properties" ? "translate-x-0 w-80" : "translate-x-full w-0 absolute"}`}>
             <DesignerInspector />
          </div>
        </main>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDragItem ? (
          <div className="p-4 bg-white border-2 border-blue-500 rounded-xl shadow-2xl flex items-center gap-3 scale-110 opacity-90 cursor-grabbing z-[150]">
            <MousePointer2 className="text-blue-500" size={20} />
            <span className="font-bold text-sm text-gray-700 capitalize">{activeDragItem}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default function StudioPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-screen w-screen bg-gray-100 flex items-center justify-center font-bold text-gray-400">Cargando Motor Visual v2...</div>;
  }

  return (
    <StudioProvider>
      <StudioInterface />
    </StudioProvider>
  );
}
