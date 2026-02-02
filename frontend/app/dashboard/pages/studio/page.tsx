"use client";

import React, { useState } from "react";
import { StudioProvider, useStudio, ComponentType } from "./context";
import { ToolboxSidebar } from "./_components/ToolboxSidebar";
import { Canvas } from "./_components/Canvas";
import { PropertiesPanel } from "./_components/PropertiesPanel";
import { ChevronLeft, Save, Eye, Smartphone, Monitor, Tablet, MousePointer2 } from "lucide-react";
import Link from "next/link";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, defaultDropAnimationSideEffects } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

const StudioContent = () => {
  const { sidebarView, toggleSidebar, handleDragEnd } = useStudio();
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
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={(e) => {
        handleDragEnd(e);
        setActiveDragItem(null);
      }}
      modifiers={[restrictToWindowEdges]}
    >
      {/* 
          CONTENEDOR MAESTRO: 
          Usamos fixed inset-0 y z-[100] para asegurar que cubra TODO el dashboard (Sidebar incluido)
      */}
      <div className="fixed inset-0 z-[100] flex flex-col h-screen w-screen bg-gray-100 overflow-hidden text-gray-900">
        
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
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">Editor Visual Pro</p>
            </div>
          </div>

          {/* Controles de Vista/Preview */}
          <div className="hidden md:flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
             <button className="p-2 text-blue-600 bg-white shadow-sm rounded-lg transition-all">
               <Monitor size={16} />
             </button>
             <button className="p-2 text-gray-400 hover:text-gray-600 transition-all">
               <Tablet size={16} />
             </button>
             <button className="p-2 text-gray-400 hover:text-gray-600 transition-all">
               <Smartphone size={16} />
             </button>
          </div>

          {/* Acciones Principales */}
          <div className="flex items-center gap-3">
            {sidebarView === "properties" && (
              <button 
                onClick={() => toggleSidebar("toolbox")}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-all active:scale-95"
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

        {/* ÁREA DE TRABAJO PRINCIPAL */}
        <main className="flex-1 flex overflow-hidden relative">
          
          {/* Lado Izquierdo (Toolbox) */}
          <div className={`transition-all duration-500 ease-in-out h-full ${sidebarView === "toolbox" ? "translate-x-0 w-64" : "-translate-x-full w-0 absolute"}`}>
             <ToolboxSidebar />
          </div>

          {/* Centro (Canvas) */}
          <div className="flex-1 flex flex-col min-w-0 bg-gray-100 h-full">
             <Canvas />
          </div>

          {/* Lado Derecho (Propiedades) */}
          <div className={`transition-all duration-500 ease-in-out h-full ${sidebarView === "properties" ? "translate-x-0 w-80" : "translate-x-full w-0 absolute"}`}>
             <PropertiesPanel />
          </div>

        </main>
      </div>

      {/* OVERLAY VISUAL AL ARRASTRAR */}
      <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
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
  return (
    <StudioProvider>
      <StudioContent />
    </StudioProvider>
  );
}
