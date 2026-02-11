"use client";

import React, { useState, useEffect, useId, useRef } from "react";
import { useStudio, ComponentType, SectionType } from "../context";
import { 
  X, Type, Palette, Move, Sliders, Image as ImageIcon, 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, 
  Settings2, Sparkles, Layout, ChevronDown, Check, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "content" | "style" | "animation";

export const DesignerInspector = () => {
  const { selectedElementId, selectElement, pageData, updateElement, sidebarView } = useStudio();
  const [activeTab, setActiveTab] = useState<TabType>("content");
  const panelId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Buscar el elemento seleccionado
  let element: any = null;
  let sectionKey: SectionType = "body";

  const sections: SectionType[] = ["header", "body", "footer"];
  for (const section of sections) {
    const found = pageData[section].elements.find(el => el.id === selectedElementId);
    if (found) {
      element = found;
      sectionKey = section;
      break;
    }
  }

  if (sidebarView !== "properties" || !selectedElementId || !element) return null;

  const handleChange = (key: string, value: any) => {
    updateElement(sectionKey, selectedElementId, { [key]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulamos subida generando una URL local
      const imageUrl = URL.createObjectURL(file);
      handleChange("imageUrl", imageUrl);
    }
  };

  const ControlGroup = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        <Icon size={14} className="text-blue-500" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  return (
    <div id={`designer-inspector-${panelId}`} className="w-80 h-full bg-white border-l border-gray-200 flex flex-col shadow-2xl z-30 overflow-hidden font-sans">
      {/* HEADER DINÁMICO */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Editor: {element.type.replace("-", " ")}
            </h2>
            <p className="text-[9px] text-gray-400 font-mono mt-0.5">Sincronización Activa</p>
          </div>
          <button
            onClick={() => selectElement(null)}
            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* TABS DE EDICIÓN */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
           {[
             { id: "content", label: "Texto", icon: Type },
             { id: "style", label: "Diseño", icon: Palette },
             { id: "animation", label: "Efectos", icon: Sparkles },
           ].map((tab) => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                  activeTab === tab.id ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5" : "text-gray-400 hover:text-gray-600"
                )}
             >
                <tab.icon size={14} />
                <span>{tab.label}</span>
             </button>
           ))}
        </div>
      </div>

      {/* CUERPO DEL EDITOR */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
        
        {activeTab === "content" && (
          <>
            <ControlGroup title="Contenido Principal" icon={Type}>
              <textarea
                value={element.props.content !== undefined ? element.props.content : (element.props.title || "")}
                onChange={(e) => handleChange(element.props.content !== undefined ? "content" : "title", e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] resize-none bg-gray-50/30 transition-all"
                placeholder="Escribe aquí tu mensaje..."
              />
            </ControlGroup>

            {(element.type === "hero-banner" || element.props.subtitle !== undefined) && (
              <ControlGroup title="Subtítulo / Descripción" icon={Type}>
                <input
                  type="text"
                  value={element.props.subtitle || ""}
                  onChange={(e) => handleChange("subtitle", e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/30 transition-all"
                  placeholder="Añade un subtítulo..."
                />
              </ControlGroup>
            )}

            {(element.type === "button" || element.type === "hero-banner") && (
              <ControlGroup title="Acción (Botón)" icon={Settings2}>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={element.props.buttonText || ""}
                    onChange={(e) => handleChange("buttonText", e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/30"
                    placeholder="Texto del botón..."
                  />
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full p-3 pl-9 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/30 text-blue-600"
                      placeholder="https://tutienda.com/producto"
                    />
                    <Layout className="absolute left-3 top-3.5 text-gray-400" size={14} />
                  </div>
                </div>
              </ControlGroup>
            )}
          </>
        )}

        {activeTab === "style" && (
          <>
            <ControlGroup title="Alineación" icon={Move}>
              <div className="flex bg-gray-100 p-1 rounded-lg border">
                {["left", "center", "right"].map((pos) => (
                  <button 
                    key={pos}
                    onClick={() => handleChange("align", pos)}
                    className={cn(
                      "flex-1 p-2 flex justify-center rounded-md transition-all", 
                      (element.props.align === pos || (!element.props.align && pos === "center")) ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {pos === "left" && <AlignLeft size={16} />}
                    {pos === "center" && <AlignCenter size={16} />}
                    {pos === "right" && <AlignRight size={16} />}
                  </button>
                ))}
              </div>
            </ControlGroup>

            <ControlGroup title="Paleta de Colores" icon={Palette}>
              <div className="grid grid-cols-6 gap-2">
                {["#ffffff", "#3b82f6", "#1e293b", "#ef4444", "#10b981", "#f59e0b"].map(color => (
                  <button 
                    key={color}
                    onClick={() => handleChange("bgColor", color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center relative",
                      element.props.bgColor === color ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-100 shadow-sm"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {element.props.bgColor === color && <Check size={12} className={color === "#ffffff" ? "text-blue-500" : "text-white"} />}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                 <div>
                    <span className="text-[10px] text-gray-400 block mb-1 font-bold uppercase tracking-tighter">Tamaño</span>
                    <select 
                      value={element.props.fontSize || "md"} 
                      onChange={(e) => handleChange("fontSize", e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="xs">XS</option>
                      <option value="md">Medio</option>
                      <option value="2xl">Grande</option>
                      <option value="5xl">Hero</option>
                    </select>
                 </div>
                 <div>
                    <span className="text-[10px] text-gray-400 block mb-1 font-bold uppercase tracking-tighter">Opacidad</span>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={element.props.opacity !== undefined ? element.props.opacity : 100}
                      onChange={(e) => handleChange("opacity", parseInt(e.target.value))}
                      className="w-full accent-blue-600" 
                    />
                 </div>
              </div>
            </ControlGroup>

            <ControlGroup title="Multimedia Principal" icon={ImageIcon}>
               <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handleImageUpload} 
               />
               <div 
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all active:scale-95"
               >
                  {element.props.imageUrl ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden shadow-md mb-3">
                      <img src={element.props.imageUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={20} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                      <ImageIcon size={24} className="text-gray-300 group-hover:text-blue-500" />
                    </div>
                  )}
                  <p className="text-xs font-bold text-gray-700">Cambiar Imagen</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-tighter">Formatos: JPG, PNG, WebP</p>
               </div>
            </ControlGroup>
          </>
        )}

        {activeTab === "animation" && (
           <ControlGroup title="Efectos de Revelado" icon={Sparkles}>
              <div className="space-y-2">
                 {[
                   { id: "none", label: "Ninguna", desc: "Aparición inmediata" },
                   { id: "fade", label: "Fade In", desc: "Suave y progresivo" },
                   { id: "slide", label: "Deslizar", desc: "Entrada desde abajo" },
                   { id: "zoom", label: "Zoom", desc: "Efecto de expansión" },
                 ].map(anim => (
                   <button 
                    key={anim.id}
                    onClick={() => handleChange("animation", anim.id)}
                    className={cn(
                      "w-full p-3 border rounded-xl text-left transition-all flex items-center justify-between group",
                      (element.props.animation === anim.id || (!element.props.animation && anim.id === "none")) 
                        ? "border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20" 
                        : "border-gray-100 hover:border-blue-200 hover:bg-gray-50"
                    )}
                   >
                      <div>
                        <p className={cn("text-xs font-black uppercase tracking-tight", element.props.animation === anim.id ? "text-blue-700" : "text-gray-700 group-hover:text-blue-600")}>{anim.label}</p>
                        <p className="text-[9px] text-gray-400 font-medium">{anim.desc}</p>
                      </div>
                      {(element.props.animation === anim.id || (!element.props.animation && anim.id === "none")) && <Check size={14} className="text-blue-600" />}
                   </button>
                 ))}
              </div>
           </ControlGroup>
        )}

      </div>

      {/* FOOTER DE ACCIONES */}
      <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
         <button 
          onClick={() => selectElement(null)}
          className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95"
         >
           Confirmar Cambios
         </button>
      </div>
    </div>
  );
};
