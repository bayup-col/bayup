"use client";

import React, { useState, useEffect, useId, useRef, memo } from "react";
import { useStudio, ComponentType, SectionType } from "../context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Type, Palette, Move, Sliders, Image as ImageIcon, 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, 
  Settings2, Sparkles, Layout, ChevronDown, Check, Upload,
  ShoppingBag, MousePointer2
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
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
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

  const triggerUpload = (target: string) => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget) {
      const url = URL.createObjectURL(file);
      handleChange(uploadTarget, url);
      setUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderButtonDesigner = (prefix: string, title: string) => {
    const p = (key: string) => prefix ? `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : key;
    const isAurora = element.props[p("variant")] === "aurora";

    return (
      <ControlGroup title={title} icon={MousePointer2}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Etiqueta</span><input type="text" value={element.props[p("text")] || ""} onChange={(e) => handleChange(p("text"), e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" placeholder="Texto..." /></div>
            <div><span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Vínculo</span><input type="text" value={element.props[p("url")] || ""} onChange={(e) => handleChange(p("url"), e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-mono text-blue-600" placeholder="/url" /></div>
          </div>
          
          <div className="space-y-2">
            <span className="text-[9px] font-black text-gray-400 uppercase">Tema de Diseño</span>
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
              {[
                { id: "solid", l: "Sólido" }, { id: "glass", l: "Glass" }, { id: "outline", l: "Borde" },
                { id: "3d", l: "3D Pro" }, { id: "brutalist", l: "Brutal" }, { id: "aurora", l: "Aurora" }
              ].map(v => (
                <button key={v.id} onClick={() => handleChange(p("variant"), v.id)} className={cn("py-1.5 text-[8px] font-black uppercase rounded-md transition-all", (element.props[p("variant")] === v.id || (!element.props[p("variant")] && v.id === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v.l}</button>
              ))}
            </div>
          </div>

          {isAurora && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <span className="text-[9px] font-black text-blue-600 uppercase">Colores Aurora (Mezcla)</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100">
                  <input type="color" value={element.props[p("aurora1")] || "#00f2ff"} onChange={(e) => handleChange(p("aurora1"), e.target.value)} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" />
                  <span className="text-[8px] text-gray-400">Color 1</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100">
                  <input type="color" value={element.props[p("aurora2")] || "#7000ff"} onChange={(e) => handleChange(p("aurora2"), e.target.value)} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" />
                  <span className="text-[8px] text-gray-400">Color 2</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Fuente</span>
              <select value={element.props[p("font")] || "font-black"} onChange={(e) => handleChange(p("font"), e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white outline-none">
                <option value="font-black">Black</option><option value="font-sans">Modern</option><option value="font-serif">Classic</option>
              </select>
            </div>
            <div className="flex items-center gap-2 p-1.5 border rounded-lg bg-white self-end h-[38px]">
              <input type="color" value={element.props[p("textColor")] || "#ffffff"} onChange={(e) => handleChange(p("textColor"), e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer bg-transparent" />
              <span className="text-[9px] text-gray-400 uppercase">Texto</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-1.5 border rounded-lg bg-white h-[38px]">
              <input type="color" value={element.props[p("bgColor")] || "#2563eb"} onChange={(e) => handleChange(p("bgColor"), e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer bg-transparent" />
              <span className="text-[9px] text-gray-400 uppercase">Fondo</span>
            </div>
            <div className="flex flex-col justify-end"><FluidSlider label="Tamaño" value={element.props[p("size")] || 14} min={10} max={24} onChange={(val:number) => handleChange(p("size"), val)} /></div>
          </div>

          <div className="py-2 bg-blue-50/30 rounded-xl px-2 border border-blue-100/50">
            <FluidSlider label="Intensidad Visual" value={element.props[p("intensity")] || 100} min={0} max={200} onChange={(val:number) => handleChange(p("intensity"), val)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FluidSlider label="Posición X" value={element.props[p("posX")] || 0} min={-300} max={300} onChange={(val:number) => handleChange(p("posX"), val)} />
            <FluidSlider label="Posición Y" value={element.props[p("posY")] || 0} min={-100} max={100} onChange={(val:number) => handleChange(p("posY"), val)} />
          </div>
        </div>
      </ControlGroup>
    );
  };

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans border-l border-gray-100">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div><h2 className="font-bold text-gray-800 text-sm flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />Editor: {element.type}</h2><p className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase font-black tracking-tighter">Personalización Elite</p></div>
          <button onClick={() => selectElement(null)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400"><X size={18} /></button>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
           {[{ id: "content", label: "Contenido", icon: Type }, { id: "style", label: "Diseño", icon: Palette }, { id: "animation", label: "Efectos", icon: Sparkles }].map((tab) => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all", activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600")}><tab.icon size={14} /><span>{tab.label}</span></button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
        <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
        
        {activeTab === "content" && (
          <>
            {element.type === "announcement-bar" && (
              <ControlGroup title="Mensajes de la Barra" icon={Type} defaultOpen={true}>
                <div className="space-y-3">
                  {(element.props.messages || ["ANUNCIO"]).map((msg: string, idx: number) => (
                    <div key={idx} className="relative group/msg">
                      <textarea value={msg} onChange={(e) => { const newMsgs = [...element.props.messages]; newMsgs[idx] = e.target.value; handleChange("messages", newMsgs); }} className="w-full p-3 pr-8 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50/30" />
                      {element.props.messages?.length > 1 && <button onClick={() => handleChange("messages", element.props.messages.filter((_:any, i:number) => i !== idx))} className="absolute top-2 right-2 text-red-400"><X size={12}/></button>}
                    </div>
                  ))}
                  <button onClick={() => handleChange("messages", [...(element.props.messages || []), "NUEVA PROMO"])} className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-[9px] font-black uppercase text-gray-400">+ Añadir Mensaje</button>
                </div>
              </ControlGroup>
            )}

            {element.type === "navbar" && (
              <ControlGroup title="Identidad Visual" icon={ImageIcon} defaultOpen={true}>
                <div className="space-y-4">
                  <div onClick={() => triggerUpload("logoUrl")} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 transition-colors">
                    {element.props.logoUrl ? <img src={element.props.logoUrl} className="h-12 mx-auto object-contain" /> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR LOGO</p>}
                  </div>
                  <input type="text" value={element.props.logoText || ""} onChange={(e) => handleChange("logoText", e.target.value)} className="w-full p-3 border rounded-xl text-xs font-bold bg-gray-50/30" placeholder="Nombre de Tienda..." />
                  <FluidSlider label="Escala Logo" value={element.props.logoSize || 24} min={12} max={120} onChange={(val:number) => handleChange("logoSize", val)} />
                </div>
              </ControlGroup>
            )}

            {element.type === "text" && (
              <ControlGroup title="Contenido de Texto" icon={Type} defaultOpen={true}>
                <textarea value={element.props.content || ""} onChange={(e) => handleChange("content", e.target.value)} className="w-full p-3 border rounded-xl text-sm min-h-[120px] bg-gray-50/30" placeholder="Escribe aquí..." />
              </ControlGroup>
            )}

            {element.type === "button" && renderButtonDesigner("", "Personalizar Botón")}

            {element.type === "hero-banner" && (
              <>
                <ControlGroup title="Título de Impacto" icon={Type} defaultOpen={true}>
                  <div className="space-y-4">
                    <textarea value={element.props.title || ""} onChange={(e) => handleChange("title", e.target.value)} className="w-full p-3 border rounded-xl text-sm font-black bg-gray-50/30 uppercase italic" />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={element.props.titleFont || "font-black"} onChange={(e) => handleChange("titleFont", e.target.value)} className="w-full p-2 border rounded-xl text-[10px] font-bold bg-white outline-none">
                        <option value="font-black">Black</option><option value="font-sans">Modern</option><option value="font-serif">Classic</option>
                      </select>
                      <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.titleColor || "#ffffff"} onChange={(e) => handleChange("titleColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer bg-transparent" /><span className="text-[9px] font-mono text-gray-400 uppercase">{element.props.titleColor || "#ffffff"}</span></div>
                    </div>
                    <FluidSlider label="Tamaño" value={element.props.titleSize || 48} min={24} max={120} onChange={(val:number) => handleChange("titleSize", val)} />
                    <div className="grid grid-cols-2 gap-3"><FluidSlider label="Posición X" value={element.props.textPosX || 0} min={-500} max={500} onChange={(val:number) => handleChange("textPosX", val)} /><FluidSlider label="Posición Y" value={element.props.textPosY || 0} min={-200} max={200} onChange={(val:number) => handleChange("textPosY", val)} /></div>
                    <div className="py-2 bg-blue-50/30 rounded-xl px-2 border border-blue-100/50"><FluidSlider label="Intensidad Visual" value={element.props.titleIntensity || 100} min={0} max={200} onChange={(val:number) => handleChange("titleIntensity", val)} /></div>
                  </div>
                </ControlGroup>
                <ControlGroup title="Descripción" icon={Type}>
                  <div className="space-y-4">
                    <textarea value={element.props.subtitle || ""} onChange={(e) => handleChange("subtitle", e.target.value)} className="w-full p-3 border rounded-xl text-xs bg-gray-50/30 min-h-[80px]" />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={element.props.subtitleFont || "font-sans"} onChange={(e) => handleChange("subtitleFont", e.target.value)} className="w-full p-2 border rounded-xl text-[10px] font-bold bg-white outline-none"><option value="font-sans">Modern</option><option value="font-serif">Classic</option><option value="font-mono">Tech</option></select>
                      <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.subtitleColor || "#ffffff"} onChange={(e) => handleChange("subtitleColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer bg-transparent" /><span className="text-[9px] font-mono text-gray-400 uppercase">{element.props.subtitleColor || "#ffffff"}</span></div>
                    </div>
                    <FluidSlider label="Tamaño" value={element.props.subtitleSize || 18} min={12} max={40} onChange={(val:number) => handleChange("subtitleSize", val)} />
                    <div className="py-2 bg-blue-50/30 rounded-xl px-2 border border-blue-100/50"><FluidSlider label="Intensidad Visual" value={element.props.subtitleIntensity || 100} min={0} max={200} onChange={(val:number) => handleChange("subtitleIntensity", val)} /></div>
                  </div>
                </ControlGroup>
                {renderButtonDesigner("primaryBtn", "Botón Primario")}
                {renderButtonDesigner("secondaryBtn", "Botón Secundario")}
              </>
            )}
          </>
        )}

        {activeTab === "style" && (
          <>
            <ControlGroup title="Estructura y Tamaño" icon={Move} defaultOpen={true}>
              <div className="space-y-6">
                <div className="flex bg-gray-100 p-1 rounded-lg border">{["left", "center", "right"].map((pos) => (<button key={pos} onClick={() => handleChange("align", pos)} className={cn("flex-1 p-2 flex justify-center rounded-md transition-all", (element.props.align === pos || (!element.props.align && pos === "center")) ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600")}>{pos === "left" && <AlignLeft size={16} />}{pos === "center" && <AlignCenter size={16} />}{pos === "right" && <AlignRight size={16} />}</button>))}</div>
                <FluidSlider label={element.type === "announcement-bar" ? "Grosor Barra" : (element.type === "text" || element.type === "button") ? "Altura Bloque" : "Grosor Barra"} value={element.props.navHeight || (element.type === "announcement-bar" ? 36 : 80)} min={20} max={400} onChange={(val: number) => handleChange("navHeight", val)} />
              </div>
            </ControlGroup>
            
            {/* OPCIONES DE IMAGEN INTERNA (SOLO PARA BOTÓN COMPONENTE) */}
            {element.type === "button" && (
              <ControlGroup title="Imagen Interna del Botón" icon={ImageIcon}>
                <div className="space-y-3">
                  <div onClick={() => triggerUpload("btnBgImage")} className="group border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 cursor-pointer relative overflow-hidden">
                    {element.props.btnBgImage ? (
                      <div className="relative aspect-video rounded-md overflow-hidden"><img src={element.props.btnBgImage} className="w-full h-full object-cover" /><button onClick={(e) => { e.stopPropagation(); handleChange("btnBgImage", null); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={10} /></button></div>
                    ) : (<div className="py-2"><ImageIcon size={16} className="mx-auto text-gray-300" /><p className="text-[9px] font-bold text-gray-400 uppercase">Subir Imagen</p></div>)}
                  </div>
                  {element.props.btnBgImage && (
                    <div className="flex bg-gray-100 p-1 rounded-lg">{[{ id: "cover", l: "Llena" }, { id: "repeat", l: "Mosaico" }, { id: "contain", l: "Ajustar" }].map((m) => (<button key={m.id} onClick={() => handleChange("btnBgMode", m.id)} className={cn("flex-1 py-1 text-[8px] font-black uppercase rounded-md transition-all", (element.props.btnBgMode === m.id || (!element.props.btnBgMode && m.id === "cover")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{m.l}</button>))}</div>
                  )}
                  <FluidSlider label="Redondeo" value={element.props.borderRadius || 12} min={0} max={40} onChange={(val:number) => handleChange("borderRadius", val)} />
                </div>
              </ControlGroup>
            )}

            <ControlGroup title="Fondo del Bloque" icon={Palette}>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => handleChange("bgColor", "transparent")} className={cn("w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center relative", element.props.bgColor === "transparent" ? "border-blue-500" : "")}><div className="w-full h-full rounded-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />{element.props.bgColor === "transparent" && <Check size={12} className="absolute text-blue-600" />}</button>
                  {["#ffffff", "#000000", "#3b82f6", "#1e293b", "#ef4444", "#10b981", "#f59e0b"].map(color => (
                    <button key={color} onClick={() => handleChange("bgColor", color)} className={cn("w-8 h-8 rounded-full border-2 transition-all relative", element.props.bgColor === color ? "border-blue-500 shadow-lg" : "border-gray-100")} style={{ backgroundColor: color }}>{element.props.bgColor === color && <Check size={12} className={color === "#ffffff" ? "text-blue-500" : "text-white"} />}</button>
                  ))}
                  <input type="color" value={element.props.bgColor || "#ffffff"} onChange={(e) => handleChange("bgColor", e.target.value)} className="w-8 h-8 rounded-full border-2 border-gray-100 p-0 overflow-hidden cursor-pointer" />
                </div>
                <FluidSlider label="Opacidad Capa" value={element.props.opacity !== undefined ? element.props.opacity : 100} min={0} max={100} suffix="%" onChange={(val: number) => handleChange("opacity", val)} />
              </div>
            </ControlGroup>
            <ControlGroup title="Textura del Bloque" icon={ImageIcon}>
               <div onClick={() => triggerUpload("bgPatternUrl")} className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all relative">
                  {element.props.bgPatternUrl ? (<div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100"><div className="absolute inset-0" style={{ backgroundImage: `url(${element.props.bgPatternUrl})`, backgroundRepeat: 'repeat', backgroundSize: 'auto 100%' }} /><button onClick={(e) => { e.stopPropagation(); handleChange("bgPatternUrl", null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors z-10"><X size={12} /></button></div>) : (<div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3"><ImageIcon size={24} className="text-gray-300" /></div>)}
                  <p className="text-xs font-bold text-gray-700 uppercase">Subir Fondo</p>
               </div>
            </ControlGroup>
          </>
        )}

        {activeTab === "animation" && (
          <ControlGroup title="Efectos de Revelado" icon={Sparkles}>
            <div className="space-y-2">
               {[{ id: "none", label: "Ninguna" }, { id: "fade", label: "Desvanecer" }, { id: "slide", label: "Deslizar" }, { id: "zoom", label: "Zoom" }, { id: "blur", label: "Desenfoque" }].map(anim => (
                 <button key={anim.id} onClick={() => handleChange("animation", anim.id)} className={cn("w-full p-3 border rounded-xl text-left transition-all flex items-center justify-between group", (element.props.animation === anim.id || (!element.props.animation && anim.id === "none")) ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-gray-100 hover:bg-gray-50")}>
                    <span className="text-xs font-black uppercase">{anim.label}</span>
                    {(element.props.animation === anim.id || (!element.props.animation && anim.id === "none")) && <Check size={14} className="text-blue-600" />}
                 </button>
               ))}
            </div>
          </ControlGroup>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-white shrink-0"><button onClick={() => selectElement(null)} className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95">Confirmar Cambios</button></div>
    </div>
  );
};