"use client";

import React, { useState, useEffect, useId, useRef, memo } from "react";
import { useStudio, ComponentType, SectionType } from "../context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Type, Palette, Move, Sliders, Image as ImageIcon, 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, 
  Settings2, Sparkles, Layout, ChevronDown, Check, Upload,
  ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "content" | "style" | "animation";

// --- COMPONENTES AUXILIARES ESTABLES ---

const FluidSlider = ({ label, value, min, max, onChange, suffix = "px" }: any) => {
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => { setLocalValue(value); }, [value]);
  const handleLocalChange = (e: any) => {
    const val = parseInt(e.target.value);
    setLocalValue(val);
    onChange(val);
  };
  return (
    <div onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] font-black text-gray-400 uppercase">{label}</span>
        <span className="text-[10px] font-black text-blue-500 font-mono">{localValue}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} value={localValue} onChange={handleLocalChange} className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none" />
    </div>
  );
};

const ControlGroup = ({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <div onClick={() => setIsOpen(!isOpen)} className={cn("flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border border-transparent", isOpen ? "bg-blue-50/50 border-blue-100" : "hover:bg-gray-50")}>
        <div className="flex items-center gap-3">
          <div className={cn("p-1.5 rounded-lg transition-colors", isOpen ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400")}><Icon size={14} /></div>
          <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", isOpen ? "text-blue-700" : "text-gray-500")}>{title}</span>
        </div>
        <ChevronDown size={14} className={cn("text-gray-300 transition-transform duration-300", isOpen && "rotate-180 text-blue-500")} />
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="overflow-hidden">
            <div className="pt-4 px-2 space-y-4 pb-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export const DesignerInspector = () => {
  const { selectedElementId, selectElement, pageData, updateElement, sidebarView } = useStudio();
  const [activeTab, setActiveTab] = useState<TabType>("content");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const elementData = React.useMemo(() => {
    if (!selectedElementId) return null;
    const sections: SectionType[] = ["header", "body", "footer"];
    for (const section of sections) {
      const found = pageData[section].elements.find(el => el.id === selectedElementId);
      if (found) return { element: found, sectionKey: section };
    }
    return null;
  }, [pageData, selectedElementId]);

  if (sidebarView !== "properties" || !selectedElementId || !elementData) return null;

  const { element, sectionKey } = elementData;

  const handleChange = (key: string, value: any) => {
    updateElement(sectionKey, selectedElementId, { [key]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      // Inteligencia de subida avanzada
      const isPattern = (element.type === "navbar" || element.type === "announcement-bar") && activeTab === "style";
      const propName = isPattern ? "bgPatternUrl" : 
                       (element.type === "navbar" && activeTab === "content") ? "logoUrl" : "imageUrl";
      handleChange(propName, url);
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans border-l border-gray-100">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />Editor: {element.type}</h2>
            <p className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase font-black">Modo Personalización</p>
          </div>
          <button onClick={() => selectElement(null)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400"><X size={18} /></button>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
           {[{ id: "content", label: "Texto", icon: Type }, { id: "style", label: "Diseño", icon: Palette }, { id: "animation", label: "Efectos", icon: Sparkles }].map((tab) => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all", activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600")}>
                <tab.icon size={14} /><span>{tab.label}</span>
             </button>
           ))}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
        
        {activeTab === "content" && (
          <>
            {/* ANNOUNCEMENT BAR ADVANCED */}
            {element.type === "announcement-bar" && (
              <>
                <ControlGroup title="Mensajes" icon={Type} defaultOpen={true}>
                  <div className="space-y-3">
                    {(element.props.messages || [element.props.content || "PROMO"]).map((msg: string, idx: number) => (
                      <div key={idx} className="relative group/msg">
                        <textarea value={msg} onChange={(e) => { const newMsgs = [...(element.props.messages || [element.props.content])]; newMsgs[idx] = e.target.value; handleChange("messages", newMsgs); }} className="w-full p-3 pr-8 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500 outline-none min-h-[60px] resize-none bg-gray-50/30" />
                        {(element.props.messages?.length > 1) && <button onClick={() => handleChange("messages", element.props.messages.filter((_: any, i: number) => i !== idx))} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover/msg:opacity-100 transition-opacity"><X size={12} /></button>}
                      </div>
                    ))}
                    <button onClick={() => handleChange("messages", [...(element.props.messages || [element.props.content]), "NUEVO MENSAJE 🎊"])} className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:text-blue-500 transition-all">+ Añadir Mensaje</button>
                  </div>
                </ControlGroup>
                <ControlGroup title="Comportamiento" icon={Sparkles}>
                  <div className="space-y-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      {[{ id: "static", label: "Estático" }, { id: "marquee", label: "Carrusel" }, { id: "slide", label: "Rotación" }].map((b) => (
                        <button key={b.id} onClick={() => handleChange("behavior", b.id)} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase rounded-md transition-all", (element.props.behavior === b.id || (!element.props.behavior && b.id === "static")) ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}>{b.label}</button>
                      ))}
                    </div>
                    {element.props.behavior === "marquee" && <FluidSlider label="Velocidad" value={element.props.speed || 10} min={1} max={50} suffix="x" onChange={(val: number) => handleChange("speed", val)} />}
                  </div>
                </ControlGroup>
                <ControlGroup title="Tipografía y Alineación" icon={Type}>
                  <div className="space-y-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      {["left", "center", "right"].map((pos) => (
                        <button key={pos} onClick={() => handleChange("align", pos)} className={cn("flex-1 p-2 flex justify-center rounded-md transition-all", (element.props.align === pos || (!element.props.align && pos === "center")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>
                          {pos === "left" && <AlignLeft size={14} />}{pos === "center" && <AlignCenter size={14} />}{pos === "right" && <AlignRight size={14} />}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <select value={element.props.fontFamily || "font-black"} onChange={(e) => handleChange("fontFamily", e.target.value)} className="w-full p-2 border border-gray-200 rounded-xl text-[10px] font-bold bg-white outline-none">
                        <option value="font-black">Black</option><option value="font-sans">Modern</option><option value="font-serif">Classic</option><option value="font-mono">Tech</option>
                      </select>
                      <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-xl bg-white">
                        <input type="color" value={element.props.textColor || "#ffffff"} onChange={(e) => handleChange("textColor", e.target.value)} className="w-6 h-6 rounded-lg overflow-hidden border-0 p-0 cursor-pointer bg-transparent" />
                        <span className="text-[9px] font-mono text-gray-400 uppercase">{element.props.textColor || "#ffffff"}</span>
                      </div>
                    </div>
                    <FluidSlider label="Fuente" value={element.props.fontSize || 11} min={8} max={24} onChange={(val: number) => handleChange("fontSize", val)} />
                  </div>
                </ControlGroup>
              </>
            )}

            {/* NAVBAR CONTENT */}
            {element.type === "navbar" && (
              <>
                <ControlGroup title="Identidad Visual" icon={ImageIcon} defaultOpen={true}>
                  <div className="space-y-6">
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all">
                      {element.props.logoUrl ? (
                        <div className="relative h-12 w-full flex items-center justify-center"><img src={element.props.logoUrl} className="h-full object-contain" /><button onClick={(e) => { e.stopPropagation(); handleChange("logoUrl", null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={10} /></button></div>
                      ) : (
                        <div className="space-y-1"><Upload size={16} className="mx-auto text-gray-400" /><p className="text-[10px] font-bold text-gray-500 uppercase">Subir Logo</p></div>
                      )}
                    </div>
                    <input type="text" value={element.props.logoText || ""} onChange={(e) => handleChange("logoText", e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/30 font-bold" placeholder="Nombre de Tienda..." />
                    <FluidSlider label="Escala" value={element.props.logoSize || 24} min={12} max={120} onChange={(val: number) => handleChange("logoSize", val)} />
                    <FluidSlider label={element.props.logoAlign === "right" ? "Distancia Der" : "Pos. Horizontal"} value={element.props.logoOffset || 0} min={0} max={300} onChange={(val: number) => handleChange("logoOffset", val)} />
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      {["left", "center", "right"].map((pos) => (
                        <button key={pos} onClick={() => handleChange("logoAlign", pos)} className={cn("flex-1 p-2 flex justify-center rounded-md transition-all", (element.props.logoAlign === pos || (!element.props.logoAlign && pos === "left")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>
                          {pos === "left" && <AlignLeft size={14} />}{pos === "center" && <AlignCenter size={14} />}{pos === "right" && <AlignRight size={14} />}
                        </button>
                      ))}
                    </div>
                    {!element.props.logoUrl && (
                      <div className="grid grid-cols-2 gap-4">
                        <select value={element.props.logoFont || "font-sans"} onChange={(e) => handleChange("logoFont", e.target.value)} className="w-full p-2 border border-gray-200 rounded-xl text-[10px] font-bold bg-white outline-none uppercase">
                          <option value="font-sans">Sans</option><option value="font-serif">Serif</option><option value="font-mono">Mono</option><option value="font-black italic">Itálica</option>
                        </select>
                        <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-xl bg-white">
                          <input type="color" value={element.props.logoColor || "#2563eb"} onChange={(e) => handleChange("logoColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer bg-transparent" />
                          <span className="text-[9px] font-mono text-gray-400 uppercase">{element.props.logoColor || "#2563eb"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </ControlGroup>
                <ControlGroup title="Acciones y Carrito" icon={ShoppingBag}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-xl bg-white">
                      <input type="color" value={element.props.utilityColor || "#6b7280"} onChange={(e) => handleChange("utilityColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer bg-transparent" />
                      <span className="text-[9px] font-mono text-gray-400 uppercase">{element.props.utilityColor || "#6b7280"}</span>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      {[{ id: "icon", label: "Icono" }, { id: "text", label: "Texto" }, { id: "both", label: "Ambos" }].map((type) => (
                        <button key={type.id} onClick={() => handleChange("utilityType", type.id)} className={cn("flex-1 py-1 px-2 text-[9px] font-black uppercase rounded-md transition-all", (element.props.utilityType === type.id) ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}>{type.label}</button>
                      ))}
                    </div>
                    <div className="space-y-3 pt-2 border-t border-gray-50">
                      {(element.props.utilityItems || []).map((item: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 relative group/item">
                          <button onClick={() => handleChange("utilityItems", element.props.utilityItems.filter((_:any, i:number) => i !== idx))} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"><X size={12}/></button>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" value={item.label} onChange={(e) => { const newItems = [...element.props.utilityItems]; newItems[idx].label = e.target.value; handleChange("utilityItems", newItems); }} className="p-2 border border-gray-200 rounded-lg text-[9px] font-bold uppercase outline-none bg-white" placeholder="Nombre" />
                            <select value={item.icon} onChange={(e) => { const newItems = [...element.props.utilityItems]; newItems[idx].icon = e.target.value; handleChange("utilityItems", newItems); }} className="p-2 border border-gray-200 rounded-lg text-[9px] font-bold bg-white outline-none"><option value="HelpCircle">Ayuda</option><option value="Heart">Deseos</option><option value="Search">Buscar</option><option value="Phone">Llamar</option></select>
                          </div>
                          <input type="text" value={item.url} onChange={(e) => { const newItems = [...element.props.utilityItems]; newItems[idx].url = e.target.value; handleChange("utilityItems", newItems); }} className="w-full p-2 border border-gray-200 rounded-lg text-[8px] font-mono outline-none bg-white text-blue-500" placeholder="URL o /modulo" />
                        </div>
                      ))}
                      <button onClick={() => handleChange("utilityItems", [...(element.props.utilityItems || []), { label: "Ayuda", icon: "HelpCircle", url: "/soporte" }])} className="w-full py-2 border border-dashed border-gray-200 rounded-xl text-[8px] font-black uppercase text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-all">+ Añadir Enlace</button>
                    </div>
                  </div>
                </ControlGroup>
                <ControlGroup title="Menú de Navegación" icon={Layout}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-xl bg-white">
                      <input type="color" value={element.props.menuColor || "#4b5563"} onChange={(e) => handleChange("menuColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer bg-transparent" />
                      <span className="text-[9px] font-mono text-gray-400 uppercase">{element.props.menuColor || "#4b5563"}</span>
                    </div>
                    <div className="space-y-3 pt-2 border-t border-gray-50">
                      {(element.props.menuItems || []).map((item: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 relative group/item">
                          <button onClick={() => { const newItems = element.props.menuItems.filter((_: any, i: number) => i !== idx); handleChange("menuItems", newItems); }} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"><X size={12} /></button>
                          <input type="text" value={typeof item === 'string' ? item : item.label} onChange={(e) => { const newItems = [...element.props.menuItems]; const current = typeof item === 'string' ? { label: item, url: "/" } : item; newItems[idx] = { ...current, label: e.target.value }; handleChange("menuItems", newItems); }} className="w-full p-2 border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white" placeholder="Ej: Ofertas" />
                          <input type="text" value={typeof item === 'string' ? "/" : item.url} onChange={(e) => { const newItems = [...element.props.menuItems]; const current = typeof item === 'string' ? { label: item, url: "/" } : item; newItems[idx] = { ...current, url: e.target.value }; handleChange("menuItems", newItems); }} className="w-full p-2 border border-gray-200 rounded-lg text-[9px] font-mono bg-white text-blue-500" placeholder="/vincular" />
                        </div>
                      ))}
                      <button onClick={() => handleChange("menuItems", [...(element.props.menuItems || []), { label: "Nuevo Link", url: "/" }])} className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:border-blue-300 transition-all">+ Añadir Enlace</button>
                    </div>
                  </div>
                </ControlGroup>
              </>
            )}

            {/* DEFAULT CONTENT */}
            {element.type !== "announcement-bar" && element.type !== "navbar" && (
              <ControlGroup title="Contenido Principal" icon={Type}>
                <textarea value={element.props.content !== undefined ? element.props.content : (element.props.title || "")} onChange={(e) => handleChange(element.props.content !== undefined ? "content" : "title", e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] resize-none bg-gray-50/30 transition-all" />
              </ControlGroup>
            )}
          </>
        )}

        {activeTab === "style" && (
          <>
            <ControlGroup title="Estructura y Tamaño" icon={Move} defaultOpen={true}>
              <div className="space-y-6">
                <div className="flex bg-gray-100 p-1 rounded-lg border">
                  {["left", "center", "right"].map((pos) => (
                    <button key={pos} onClick={() => handleChange("align", pos)} className={cn("flex-1 p-2 flex justify-center rounded-md transition-all", (element.props.align === pos || (!element.props.align && pos === "center")) ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600")}>
                      {pos === "left" && <AlignLeft size={16} />}{pos === "center" && <AlignCenter size={16} />}{pos === "right" && <AlignRight size={16} />}
                    </button>
                  ))}
                </div>
                <FluidSlider 
                  label={element.type === "announcement-bar" ? "Grosor de Barra" : "Grosor Barra"} 
                  value={element.props.navHeight || (element.type === "announcement-bar" ? 36 : 80)} 
                  min={element.type === "announcement-bar" ? 20 : 40} 
                  max={element.type === "announcement-bar" ? 100 : 200} 
                  onChange={(val: number) => handleChange("navHeight", val)} 
                />
              </div>
            </ControlGroup>
            <ControlGroup title="Paleta de Colores" icon={Palette}>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleChange("bgColor", "transparent")} className={cn("w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center relative", element.props.bgColor === "transparent" ? "border-blue-500" : "")}>
                  <div className="w-full h-full rounded-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                  {element.props.bgColor === "transparent" && <Check size={12} className="absolute text-blue-600" />}
                </button>
                {["#ffffff", "#000000", "#3b82f6", "#1e293b", "#ef4444", "#10b981", "#f59e0b"].map(color => (
                  <button key={color} onClick={() => handleChange("bgColor", color)} className={cn("w-8 h-8 rounded-full border-2 transition-all relative", element.props.bgColor === color ? "border-blue-500" : "border-gray-100")} style={{ backgroundColor: color }}>
                    {element.props.bgColor === color && <Check size={12} className={color === "#ffffff" ? "text-blue-500" : "text-white"} />}
                  </button>
                ))}
                <div className="relative w-8 h-8 rounded-full border-2 border-gray-100 overflow-hidden" style={{ background: "conic-gradient(red, yellow, green, cyan, blue, magenta, red)" }}>
                    <input type="color" value={element.props.bgColor && element.props.bgColor !== 'transparent' ? element.props.bgColor : "#ffffff"} onChange={(e) => handleChange("bgColor", e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" />
                </div>
              </div>
              <FluidSlider label="Opacidad" value={element.props.opacity !== undefined ? element.props.opacity : 100} min={0} max={100} suffix="%" onChange={(val: number) => handleChange("opacity", val)} />
            </ControlGroup>
            <ControlGroup title={(element.type === "navbar" || element.type === "announcement-bar") ? "Textura de Fondo" : "Multimedia"} icon={ImageIcon}>
               <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all relative">
                  {(element.props.imageUrl || element.props.bgPatternUrl) ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100">
                      <div 
                        className="absolute inset-0" 
                        style={{ 
                          backgroundImage: `url(${element.props.bgPatternUrl || element.props.imageUrl})`, 
                          backgroundRepeat: (element.type === "navbar" || element.type === "announcement-bar") ? 'repeat' : 'no-repeat', 
                          backgroundSize: (element.type === "navbar" || element.type === "announcement-bar") ? '100px auto' : 'cover' 
                        }} 
                      />
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleChange(element.props.bgPatternUrl ? "bgPatternUrl" : "imageUrl", null); 
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors z-10"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (<div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3"><ImageIcon size={24} className="text-gray-300" /></div>)}
                  <p className="text-xs font-bold text-gray-700">{(element.type === "navbar" || element.type === "announcement-bar") ? "Subir Patrón" : "Cambiar Imagen"}</p>
               </div>
               {element.props.bgPatternUrl && <button onClick={() => handleChange("bgPatternUrl", null)} className="w-full mt-2 py-2 text-[9px] font-black uppercase text-red-400 hover:text-red-600">Eliminar Textura</button>}
            </ControlGroup>
          </>
        )}

        {activeTab === "animation" && (
          <>
           <ControlGroup title="Efectos de Revelado" icon={Sparkles}>
              <div className="space-y-2">
                 {[{ id: "none", label: "Ninguna", desc: "Aparición inmediata" }, { id: "fade", label: "Desvanecer", desc: "Aparición suave" }, { id: "slide", label: "Deslizar", desc: "Entrada desde abajo" }, { id: "zoom", label: "Zoom", desc: "Efecto de expansión" }, { id: "blur", label: "Desenfoque", desc: "Estilo premium" }].map(anim => (
                   <button key={anim.id} onClick={() => handleChange("animation", anim.id)} className={cn("w-full p-3 border rounded-xl text-left transition-all flex items-center justify-between group", (element.props.animation === anim.id || (!element.props.animation && anim.id === "none")) ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-gray-100 hover:bg-gray-50")}>
                      <div><p className={cn("text-xs font-black uppercase tracking-tight", element.props.animation === anim.id ? "text-blue-700" : "text-gray-700")}>{anim.label}</p><p className="text-[9px] text-gray-400 font-medium">{anim.desc}</p></div>
                      {(element.props.animation === anim.id || (!element.props.animation && anim.id === "none")) && <Check size={14} className="text-blue-600" />}
                   </button>
                 ))}
              </div>
           </ControlGroup>
           <ControlGroup title="Marketplace" icon={ShoppingBag}>
              <div className="py-10 text-center space-y-3"><div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-2 rotate-3 border border-blue-100 shadow-sm"><Sparkles size={24} className="text-blue-500 animate-pulse" /></div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Próximamente</p><p className="text-[9px] text-gray-400 max-w-[180px] mx-auto leading-relaxed font-medium">Librería ultra-premium de diseñadores elite.</p></div>
           </ControlGroup>
          </>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-100 bg-white shrink-0">
         <button onClick={() => selectElement(null)} className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95">Confirmar Cambios</button>
      </div>
    </div>
  );
};