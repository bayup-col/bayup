"use client";

import React from "react";
import { useStudio, ComponentType } from "../context";
import { LayoutTemplate, Monitor, ArrowDownToLine, Type, Image as ImageIcon, MousePointerClick, ShoppingBag, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";

// Mock de componentes disponibles por sección
const AVAILABLE_COMPONENTS = {
  header: [
    { type: "announcement-bar" as ComponentType, label: "Barra Anuncios", icon: LayoutTemplate },
    { type: "navbar" as ComponentType, label: "Navegación", icon: Monitor },
    { type: "text" as ComponentType, label: "Texto Simple", icon: Type },
    { type: "image" as ComponentType, label: "Logo / Imagen", icon: ImageIcon },
  ],
  body: [
    { type: "hero-banner" as ComponentType, label: "Hero Banner", icon: Monitor },
    { type: "product-grid" as ComponentType, label: "Grilla Productos", icon: ShoppingBag },
    { type: "text" as ComponentType, label: "Texto / Título", icon: Type },
    { type: "video" as ComponentType, label: "Video Promocional", icon: Video },
    { type: "button" as ComponentType, label: "Botón", icon: MousePointerClick },
  ],
  footer: [
     { type: "text" as ComponentType, label: "Texto Legal", icon: Type },
     { type: "image" as ComponentType, label: "Iconos Redes", icon: ImageIcon },
  ]
};

const DraggableItem = ({ comp, index, activeSection }: { comp: any, index: number, activeSection: string }) => {
  // Usamos un ID manual basado en la sección y el índice para que sea 100% estable entre Server y Client
  const stableId = `draggable-${activeSection}-${comp.type}-${index}`;
  
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: stableId,
    data: {
      type: comp.type,
      isNew: true,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group",
        isDragging && "opacity-50 border-blue-500 ring-2 ring-blue-200"
      )}
    >
      <div className="bg-gray-50 p-2 rounded-full mb-2 group-hover:bg-blue-50 text-gray-600 group-hover:text-blue-600 transition-colors">
        <comp.icon size={20} />
      </div>
      <span className="text-xs text-gray-600 font-medium text-center">{comp.label}</span>
    </div>
  );
};

export const ToolboxSidebar = () => {
  const { activeSection, sidebarView, setActiveSection } = useStudio();

  if (sidebarView !== "toolbox") return null;

  const currentComponents = AVAILABLE_COMPONENTS[activeSection as keyof typeof AVAILABLE_COMPONENTS] || [];

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col shadow-xl z-20">
      {/* Header del Toolbox */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-800 text-lg">Constructor</h2>
        <p className="text-xs text-gray-500">Arrastra elementos a tu web</p>
      </div>

      {/* Navegación de Secciones (Los Carriles) */}
      <div className="flex justify-around p-2 bg-gray-50">
        <button
          onClick={() => setActiveSection("header")}
          className={cn(
            "p-2 rounded-lg transition-all flex flex-col items-center gap-1 text-xs font-medium",
            activeSection === "header" ? "bg-blue-100 text-blue-600 shadow-sm" : "text-gray-400 hover:bg-gray-100"
          )}
        >
          <LayoutTemplate size={18} />
          <span>Inicio</span>
        </button>
        <button
          onClick={() => setActiveSection("body")}
          className={cn(
            "p-2 rounded-lg transition-all flex flex-col items-center gap-1 text-xs font-medium",
            activeSection === "body" ? "bg-blue-100 text-blue-600 shadow-sm" : "text-gray-400 hover:bg-gray-100"
          )}
        >
          <Monitor size={18} />
          <span>Cuerpo</span>
        </button>
        <button
          onClick={() => setActiveSection("footer")}
          className={cn(
            "p-2 rounded-lg transition-all flex flex-col items-center gap-1 text-xs font-medium",
            activeSection === "footer" ? "bg-blue-100 text-blue-600 shadow-sm" : "text-gray-400 hover:bg-gray-100"
          )}
        >
          <ArrowDownToLine size={18} />
          <span>Final</span>
        </button>
      </div>

      {/* Lista de Componentes Arrastrables */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Componentes para {activeSection === "header" ? "Inicio" : activeSection === "body" ? "Cuerpo" : "Final"}
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {currentComponents.map((comp, idx) => (
            <DraggableItem 
                key={`${activeSection}-${idx}`} 
                comp={comp} 
                index={idx} 
                activeSection={activeSection} 
            />
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400">Modo: Libertad Guiada</p>
      </div>
    </div>
  );
};
