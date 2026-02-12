"use client";

import React, { useState, useEffect, useId, useRef, memo } from "react";
import { useStudio, ComponentType, SectionType } from "../context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Type, Palette, Move, Sliders, Image as ImageIcon, 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, 
  Settings2, Sparkles, Layout, ChevronDown, Check, Upload,
  ShoppingBag, MousePointer2, Play, Link as LinkIcon
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
      <ControlGroup title={title} icon={MousePointer2} defaultOpen={!prefix}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Etiqueta</span><input type="text" value={element.props[p("text")] || ""} onChange={(e) => handleChange(p("text"), e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
            <div><span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Vínculo</span><input type="text" value={element.props[p("url")] || ""} onChange={(e) => handleChange(p("url"), e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-mono text-blue-600" /></div>
          </div>
          <div className="space-y-2">
            <span className="text-[9px] font-black text-gray-400 uppercase">Tema de Diseño</span>
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
              {[{ id: "solid", l: "Sólido" }, { id: "glass", l: "Glass" }, { id: "outline", l: "Borde" }, { id: "3d", l: "3D Pro" }, { id: "brutalist", l: "Brutal" }, { id: "aurora", l: "Aurora" }].map(v => (
                <button key={v.id} onClick={() => handleChange(p("variant"), v.id)} className={cn("py-1.5 text-[8px] font-black uppercase rounded-md transition-all", (element.props[p("variant")] === v.id || (!element.props[p("variant")] && v.id === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v.l}</button>
              ))}
            </div>
          </div>
          {isAurora && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={element.props[p("aurora1")] || "#00f2ff"} onChange={(e) => handleChange(p("aurora1"), e.target.value)} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 1</span></div>
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={element.props[p("aurora2")] || "#7000ff"} onChange={(e) => handleChange(p("aurora2"), e.target.value)} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 2</span></div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <select value={element.props[p("font")] || "font-black"} onChange={(e) => handleChange(p("font"), e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white outline-none"><option value="font-black">Black</option><option value="font-sans">Modern</option><option value="font-serif">Classic</option></select>
            <div className="flex items-center gap-2 p-1.5 border rounded-lg bg-white self-end h-[38px]"><input type="color" value={element.props[p("textColor")] || "#ffffff"} onChange={(e) => handleChange(p("textColor"), e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer bg-transparent" /><span className="text-[9px] text-gray-400 uppercase">Texto</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-1.5 border rounded-lg bg-white h-[38px]"><input type="color" value={element.props[p("bgColor")] || "#2563eb"} onChange={(e) => handleChange(p("bgColor"), e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer bg-transparent" /><span className="text-[9px] text-gray-400 uppercase">Fondo</span></div>
            <div className="flex flex-col justify-end"><FluidSlider label="Tamaño" value={element.props[p("size")] || 14} min={10} max={40} onChange={(val:number) => handleChange(p("size"), val)} /></div>
          </div>
          <div className="py-2 bg-blue-50/30 rounded-xl px-2 border border-blue-100/50"><FluidSlider label="Intensidad Visual" value={element.props[p("intensity")] || 100} min={0} max={200} onChange={(val:number) => handleChange(p("intensity"), val)} /></div>
          <div className="grid grid-cols-2 gap-3"><FluidSlider label="Posición X" value={element.props[p("posX")] || 0} min={-300} max={300} onChange={(val:number) => handleChange(p("posX"), val)} /><FluidSlider label="Posición Y" value={element.props[p("posY")] || 0} min={-100} max={100} onChange={(val:number) => handleChange(p("posY"), val)} /></div>
        </div>
      </ControlGroup>
    );
  };

  const renderTextThemeDesigner = (prefix: string, title: string) => {
    const v = (key: string) => prefix ? `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : key;
    const isAurora = element.props[v("variant")] === "aurora";
    return (
      <ControlGroup title={title} icon={Type} defaultOpen={!prefix}>
        <div className="space-y-4">
          <textarea value={element.props[prefix || "content"] || ""} onChange={(e) => handleChange(prefix || "content", e.target.value)} className="w-full p-3 border rounded-xl text-sm font-black bg-gray-50/30 uppercase italic" />
          <div className="space-y-2">
            <span className="text-[9px] font-black text-gray-400 uppercase">Tema de Texto</span>
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
              {[{ id: "solid", l: "Sólido" }, { id: "outline", l: "Borde" }, { id: "3d", l: "3D Pro" }, { id: "brutalist", l: "Brutal" }, { id: "aurora", l: "Aurora" }].map(t => (
                <button key={t.id} onClick={() => handleChange(v("variant"), t.id)} className={cn("py-1.5 text-[8px] font-black uppercase rounded-md transition-all", (element.props[v("variant")] === t.id || (!element.props[v("variant")] && t.id === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{t.l}</button>
              ))}
            </div>
          </div>
          {isAurora && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={element.props[v("aurora1")] || "#00f2ff"} onChange={(e) => handleChange(v("aurora1"), e.target.value)} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 1</span></div>
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={element.props[v("aurora2")] || "#7000ff"} onChange={(e) => handleChange(v("aurora2"), e.target.value)} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 2</span></div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <select value={element.props[v("font")] || 'font-sans'} onChange={(e) => handleChange(v("font"), e.target.value)} className="w-full p-2 border rounded-xl text-[10px] font-bold bg-white outline-none"><option value="font-black">Black</option><option value="font-sans">Modern</option><option value="font-serif">Classic</option></select>
            <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white h-[38px]"><input type="color" value={element.props[v("color")] || "#ffffff"} onChange={(e) => handleChange(v("color"), e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer bg-transparent" /><span className="text-[9px] text-gray-400 uppercase">Color</span></div>
          </div>
          <FluidSlider label="Tamaño" value={element.props[v("size")] || 24} min={12} max={120} onChange={(val:number) => handleChange(v("size"), val)} />
          <div className="py-2 bg-blue-50/30 rounded-xl px-2 border border-blue-100/50"><FluidSlider label="Intensidad Visual" value={element.props[v("intensity")] || 100} min={0} max={200} onChange={(val:number) => handleChange(v("intensity"), val)} /></div>
          <div className="grid grid-cols-2 gap-3"><FluidSlider label="Posición X" value={element.props[v("posX")] || 0} min={-500} max={500} onChange={(val:number) => handleChange(v("posX"), val)} /><FluidSlider label="Posición Y" value={element.props[v("posY")] || 0} min={-200} max={200} onChange={(val:number) => handleChange(v("posY"), val)} /></div>
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
        <input type="file" className="hidden" ref={fileInputRef} accept="image/*,video/mp4,video/webm,video/ogg" onChange={handleImageUpload} />
        
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
                  <div onClick={() => triggerUpload("logoUrl")} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 transition-colors">{element.props.logoUrl ? <img src={element.props.logoUrl} className="h-12 mx-auto object-contain" /> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR LOGO</p>}</div>
                  <input type="text" value={element.props.logoText || ""} onChange={(e) => handleChange("logoText", e.target.value)} className="w-full p-3 border rounded-xl text-xs font-bold bg-gray-50/30" placeholder="Nombre de Tienda..." />
                  <FluidSlider label="Escala Logo" value={element.props.logoSize || 24} min={12} max={120} onChange={(val:number) => handleChange("logoSize", val)} />
                </div>
              </ControlGroup>
            )}
            {element.type === "text" && renderTextThemeDesigner("", "Personalizar Texto")}
            {element.type === "button" && renderButtonDesigner("", "Personalizar Botón")}
            {element.type === "hero-banner" && (
              <>
                {renderTextThemeDesigner("title", "Título de Impacto")}
                {renderTextThemeDesigner("subtitle", "Descripción")}
                {renderButtonDesigner("primaryBtn", "Botón Primario")}
                {renderButtonDesigner("secondaryBtn", "Botón Secundario")}
              </>
            )}
          </>
        )}

        {activeTab === "style" && (
          <>
            {/* MULTIMEDIA DE FONDO (EXCLUSIVO HERO) */}
            {element.type === "hero-banner" && (
              <ControlGroup title="Multimedia de Fondo" icon={ImageIcon} defaultOpen={true}>
                <div className="space-y-4">
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {[{id:"image", l:"Imagen"}, {id:"video", l:"Video"}].map(t => (
                      <button key={t.id} onClick={() => handleChange("bgType", t.id)} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase rounded-md transition-all", (element.props.bgType === t.id || (!element.props.bgType && t.id === "image")) ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}>{t.l}</button>
                    ))}
                  </div>
                  {element.props.bgType === "video" ? (
                    <div className="space-y-4">
                      <div onClick={() => triggerUpload("videoUrl")} className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer relative transition-all">
                        {element.props.videoUrl ? (
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100 bg-black flex items-center justify-center"><Play size={24} className="text-white opacity-50" /><button onClick={(e) => { e.stopPropagation(); handleChange("videoUrl", null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><X size={12} /></button></div>
                        ) : (<div className="py-2"><Play size={24} className="mx-auto text-gray-300 mb-1" /><p className="text-[9px] font-bold text-gray-400 uppercase">SUBIR VIDEO (MP4, WEBM)</p></div>)}
                      </div>
                      <div className="relative"><span className="text-[9px] font-black text-gray-400 uppercase block mb-1">O pega un enlace de video</span><div className="relative"><input type="text" value={element.props.videoUrl || ""} onChange={(e) => handleChange("videoUrl", e.target.value)} className="w-full p-3 pl-9 border rounded-xl text-[10px] font-mono text-blue-600 bg-gray-50/30" placeholder="https://..." /><LinkIcon size={12} className="absolute left-3 top-3.5 text-gray-400" /></div></div>
                    </div>
                  ) : (
                    <div onClick={() => triggerUpload("imageUrl")} className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer relative transition-all">
                      {element.props.imageUrl ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100"><img src={element.props.imageUrl} className="w-full h-full object-cover" /><button onClick={(e) => { e.stopPropagation(); handleChange("imageUrl", null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><X size={12} /></button></div>
                      ) : (<div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3"><ImageIcon size={24} className="text-gray-300" /></div>)}
                      <p className="text-xs font-bold text-gray-700 uppercase">Subir Imagen</p>
                    </div>
                  )}
                  
                  <div className="space-y-2 pt-2 border-t border-gray-50">
                    <span className="text-[9px] font-black text-gray-400 uppercase">Tema del Banner (Fondo)</span>
                    <div className="grid grid-cols-2 gap-2">{[{id:"none", l:"Normal"}, {id:"ken-burns", l:"Ken Burns"}, {id:"zoom-out", l:"Zoom Out"}, {id:"float", l:"Flotación"}].map(e => (<button key={e.id} onClick={() => handleChange("bgEffect", e.id)} className={cn("py-2 text-[8px] font-black uppercase rounded-lg border transition-all", element.props.bgEffect === e.id ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-gray-500 border-gray-100 hover:border-blue-200")}>{e.l}</button>))}</div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-50">
                    <span className="text-[9px] font-black text-gray-400 uppercase block">Color del Difuminado (Overlay)</span>
                    <div className="flex items-center gap-3">
                      <input type="color" value={element.props.overlayColor || "#000000"} onChange={(e) => handleChange("overlayColor", e.target.value)} className="w-10 h-10 rounded-xl p-0 border-2 border-gray-100 cursor-pointer overflow-hidden" />
                      <div className="flex-1"><FluidSlider label="Intensidad Difuminado" value={element.props.overlayOpacity || 40} min={0} max={95} suffix="%" onChange={(val:number) => handleChange("overlayOpacity", val)} /></div>
                    </div>
                  </div>
                </div>
              </ControlGroup>
            )}

            <ControlGroup title="Estructura y Tamaño" icon={Move}>
              <div className="space-y-6">
                <div className="flex bg-gray-100 p-1 rounded-lg border">{["left", "center", "right"].map((pos) => (<button key={pos} onClick={() => handleChange("align", pos)} className={cn("flex-1 p-2 flex justify-center rounded-md transition-all", (element.props.align === pos || (!element.props.align && pos === "center")) ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600")}>{pos === "left" && <AlignLeft size={16} />}{pos === "center" && <AlignCenter size={16} />}{pos === "right" && <AlignRight size={16} />}</button>))}</div>
                <FluidSlider label={element.type === "announcement-bar" ? "Grosor Barra" : (element.type === "text" || element.type === "button") ? "Altura Bloque" : "Altura"} value={element.props.navHeight || (element.type === "hero-banner" ? element.props.height : 80)} min={20} max={800} onChange={(val: number) => handleChange(element.type === "hero-banner" ? "height" : "navHeight", val)} />
              </div>
            </ControlGroup>
            
            {element.type === "button" && (
              <ControlGroup title="Imagen Interna del Botón" icon={ImageIcon}>
                <div className="space-y-3">
                  <div onClick={() => triggerUpload("btnBgImage")} className="group border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 cursor-pointer relative overflow-hidden">
                    {element.props.btnBgImage ? (
                      <div className="relative aspect-video rounded-md overflow-hidden"><img src={element.props.btnBgImage} className="w-full h-full object-cover" /><button onClick={(e) => { e.stopPropagation(); handleChange("btnBgImage", null); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={10} /></button></div>
                    ) : (<div className="py-2"><ImageIcon size={16} className="mx-auto text-gray-300" /><p className="text-[9px] font-bold text-gray-400 uppercase">Subir Imagen</p></div>)}
                  </div>
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
          </>
        )}

        {activeTab === "animation" && (
          <>
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

            <ControlGroup title="Marketplace de Efectos" icon={ShoppingBag}>
              <div className="py-10 text-center space-y-3">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-2 rotate-3 border border-blue-100 shadow-sm">
                  <Sparkles size={24} className="text-blue-500 animate-pulse" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Próximamente</p>
                <p className="text-[9px] text-gray-400 max-w-[180px] mx-auto leading-relaxed font-medium">Librería ultra-premium de efectos y transiciones creadas por diseñadores élite.</p>
              </div>
            </ControlGroup>
          </>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-white shrink-0"><button onClick={() => selectElement(null)} className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95">Confirmar Cambios</button></div>
    </div>
  );
};