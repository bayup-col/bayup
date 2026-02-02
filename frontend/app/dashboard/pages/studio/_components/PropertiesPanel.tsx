"use client";

import React, { useState } from "react";
import { useStudio, ComponentType, SectionType } from "../context";
import { 
  X, Type, Palette, Move, Sliders, Image as ImageIcon, 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, 
  Settings2, Sparkles, Layout, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "content" | "style" | "animation";

export const PropertiesPanel = () => {
  const { selectedElementId, selectElement, pageData, updateElement, sidebarView } = useStudio();
  const [activeTab, setActiveTab] = useState<TabType>("content");

  if (sidebarView !== "properties" || !selectedElementId) return null;

  // Buscar el elemento seleccionado
  let element: any = null;
  let sectionKey: SectionType = "body";

  for (const section of ["header", "body", "footer"] as SectionType[]) {
    const found = pageData[section].elements.find(el => el.id === selectedElementId);
    if (found) {
      element = found;
      sectionKey = section;
      break;
    }
  }

  if (!element) return null;

  const handleChange = (key: string, value: any) => {
    updateElement(sectionKey, selectedElementId, { [key]: value });
  };

  const ControlGroup = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="space-y-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col shadow-2xl z-30 overflow-hidden">
      {/* HEADER DINÁMICO */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Editando {element.type.replace("-", " ")}
            </h2>
            <p className="text-[9px] text-gray-400 font-mono mt-0.5">ID: {element.id.slice(0,8)}</p>
          </div>
          <button
            onClick={() => selectElement(null)}
            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* TABS DE EDICIÓN */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
           {[
             { id: "content", label: "Contenido", icon: Type },
             { id: "style", label: "Estilo", icon: Palette },
             { id: "animation", label: "Efectos", icon: Sparkles },
           ].map((tab) => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                  activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
             >
                <tab.icon size={14} />
                <span>{tab.label}</span>
             </button>
           ))}
        </div>
      </div>

      {/* CUERPO DEL EDITOR */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        
        {activeTab === "content" && (
          <>
            <ControlGroup title="Texto Principal" icon={Type}>
              <textarea
                value={element.props.content || element.props.title || ""}
                onChange={(e) => handleChange(element.props.content ? "content" : "title", e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] resize-none bg-gray-50/30"
                placeholder="Escribe el mensaje principal..."
              />
            </ControlGroup>

            {(element.type === "hero-banner" || element.props.subtitle !== undefined) && (
              <ControlGroup title="Subtítulo / Descripción" icon={Type}>
                <input
                  type="text"
                  value={element.props.subtitle || ""}
                  onChange={(e) => handleChange("subtitle", e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/30"
                  placeholder="Añade un subtítulo..."
                />
              </ControlGroup>
            )}

            {(element.type === "button" || element.type === "hero-banner") && (
              <ControlGroup title="Acción (Botón)" icon={Settings2}>
                <input
                  type="text"
                  value={element.props.buttonText || "Comprar Ahora"}
                  onChange={(e) => handleChange("buttonText", e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/30 mb-2"
                  placeholder="Texto del botón..."
                />
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-3 pl-9 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/30"
                    placeholder="Enlace (URL o Página)..."
                  />
                  <Layout className="absolute left-3 top-3.5 text-gray-400" size={14} />
                </div>
              </ControlGroup>
            )}
          </>
        )}

        {activeTab === "style" && (
          <>
            <ControlGroup title="Alineación y Orden" icon={Move}>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => handleChange("align", "left")}
                  className={cn("flex-1 p-2 flex justify-center rounded-md", element.props.align === "left" ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}
                >
                  <AlignLeft size={16} />
                </button>
                <button 
                  onClick={() => handleChange("align", "center")}
                  className={cn("flex-1 p-2 flex justify-center rounded-md", element.props.align === "center" ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}
                >
                  <AlignCenter size={16} />
                </button>
                <button 
                  onClick={() => handleChange("align", "right")}
                  className={cn("flex-1 p-2 flex justify-center rounded-md", element.props.align === "right" ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}
                >
                  <AlignRight size={16} />
                </button>
              </div>
            </ControlGroup>

            <ControlGroup title="Paleta de Colores" icon={Palette}>
              <div>
                <span className="text-[10px] text-gray-400 block mb-2 font-bold">FONDO PRINCIPAL</span>
                <div className="flex flex-wrap gap-2">
                  {["#ffffff", "#f8fafc", "#3b82f6", "#1e293b", "#ef4444", "#10b981"].map(color => (
                    <button 
                      key={color}
                      onClick={() => handleChange("bgColor", color)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                        element.props.bgColor === color ? "border-blue-500 ring-2 ring-blue-100" : "border-transparent shadow-sm"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <button className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                 <div>
                    <span className="text-[10px] text-gray-400 block mb-1 font-bold">TAMAÑO FUENTE</span>
                    <select 
                      value={element.props.fontSize || "md"} 
                      onChange={(e) => handleChange("fontSize", e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="xs">Extra Pequeño</option>
                      <option value="sm">Pequeño</option>
                      <option value="md">Normal</option>
                      <option value="lg">Grande</option>
                      <option value="2xl">Extra Grande</option>
                      <option value="5xl">Gigante (Hero)</option>
                    </select>
                 </div>
                 <div>
                    <span className="text-[10px] text-gray-400 block mb-1 font-bold">OPACIDAD</span>
                    <input type="range" className="w-full accent-blue-600" min="0" max="100" />
                 </div>
              </div>
            </ControlGroup>

            <ControlGroup title="Imágenes y Vídeo" icon={ImageIcon}>
               <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all group">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <ImageIcon size={24} className="text-gray-300 group-hover:text-blue-500" />
                  </div>
                  <p className="text-xs font-bold text-gray-700">Subir Archivo</p>
                  <p className="text-[10px] text-gray-400 mt-1">Soporta JPG, PNG, WEBP o MP4</p>
               </div>
            </ControlGroup>
          </>
        )}

        {activeTab === "animation" && (
           <>
            <ControlGroup title="Entrada Visual" icon={Sparkles}>
               <div className="space-y-2">
                  {[
                    { id: "fade", label: "Fundido Suave (Fade)", desc: "Aparece gradualmente" },
                    { id: "slide-up", label: "Deslizar Arriba", desc: "Sube desde el fondo" },
                    { id: "zoom", label: "Efecto Zoom", desc: "Se expande suavemente" },
                    { id: "bounce", label: "Rebote Premium", desc: "Estilo juguetón y fluido" },
                  ].map(anim => (
                    <button 
                      key={anim.id}
                      className="w-full p-3 border border-gray-100 rounded-xl text-left hover:border-blue-200 hover:bg-blue-50/50 transition-all flex items-center justify-between group"
                    >
                       <div>
                          <p className="text-xs font-bold text-gray-700 group-hover:text-blue-600">{anim.label}</p>
                          <p className="text-[9px] text-gray-400">{anim.desc}</p>
                       </div>
                       <ChevronDown size={14} className="text-gray-300 -rotate-90" />
                    </button>
                  ))}
               </div>
            </ControlGroup>
            
            <ControlGroup title="Avanzado" icon={Settings2}>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                   <span className="text-xs font-medium text-gray-600">Retraso (Delay)</span>
                   <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-md border border-gray-200 text-blue-600">0.2s</span>
                </div>
            </ControlGroup>
           </>
        )}

      </div>

      {/* FOOTER DE ACCIONES */}
      <div className="p-4 border-t border-gray-100 bg-white space-y-3">
         <div className="flex gap-2">
            <button className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all">
              Descartar
            </button>
            <button className="flex-[2] py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all">
              Guardar Cambios
            </button>
         </div>
         <p className="text-[9px] text-center text-gray-400">Los cambios se guardan localmente hasta publicar.</p>
      </div>
    </div>
  );
};