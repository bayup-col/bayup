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

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans border-l border-gray-100">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />Editor: {element.type}</h2>
            <p className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase font-black tracking-tighter">Renderizado de Alta Precisión</p>
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

            {element.type === "button" && (
              <>
                <ControlGroup title="Texto del Botón" icon={Type} defaultOpen={true}>
                  <input type="text" value={element.props.buttonText || ""} onChange={(e) => handleChange("buttonText", e.target.value)} className="w-full p-3 border rounded-xl text-sm font-bold bg-gray-50/30" />
                </ControlGroup>
                <ControlGroup title="Vínculo / URL" icon={Layout}>
                  <input type="text" value={element.props.url || ""} onChange={(e) => handleChange("url", e.target.value)} className="w-full p-3 border rounded-xl text-xs font-mono text-blue-600 bg-gray-50/30" placeholder="/vincular-a" />
                </ControlGroup>
              </>
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
                  label={element.type === "announcement-bar" ? "Grosor Barra" : (element.type === "text" || element.type === "button") ? "Altura Bloque" : "Grosor Barra"} 
                  value={element.props.navHeight || (element.type === "announcement-bar" ? 36 : 80)} 
                  min={element.type === "announcement-bar" ? 20 : 40} max={400} 
                  onChange={(val: number) => handleChange("navHeight", val)} 
                />
              </div>
            </ControlGroup>

            {element.type === "button" && (
              <ControlGroup title="Estilo Visual del Botón" icon={Palette} defaultOpen={true}>
                <div className="space-y-4">
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {[{id:"solid", l:"Sólido"}, {id:"outline", l:"Contorno"}, {id:"ghost", l:"Fantasma"}].map(v => (
                      <button key={v.id} onClick={() => handleChange("variant", v.id)} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase rounded-md transition-all", (element.props.variant === v.id || (!element.props.variant && v.id === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v.l}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Fondo</span><input type="color" value={element.props.color || "#2563eb"} onChange={(e) => handleChange("color", e.target.value)} className="w-full h-8 rounded-lg cursor-pointer bg-transparent" /></div>
                    <div><span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Texto</span><input type="color" value={element.props.textColor || "#ffffff"} onChange={(e) => handleChange("textColor", e.target.value)} className="w-full h-8 rounded-lg cursor-pointer bg-transparent" /></div>
                  </div>
                  
                  {/* IMAGEN DEL BOTÓN (INTERNA) */}
                  <div className="pt-2 border-t border-gray-50 space-y-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase block">Imagen del Botón (Interna)</span>
                    <div onClick={() => triggerUpload("btnBgImage")} className="group border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 cursor-pointer relative overflow-hidden transition-all">
                      {element.props.btnBgImage ? (
                        <div className="relative aspect-video rounded-md overflow-hidden border border-gray-100 bg-gray-50">
                          <img src={element.props.btnBgImage} className="w-full h-full object-cover" />
                          <button onClick={(e) => { e.stopPropagation(); handleChange("btnBgImage", null); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md"><X size={10} /></button>
                        </div>
                      ) : (
                        <div className="py-2"><ImageIcon size={16} className="mx-auto text-gray-300 mb-1" /><p className="text-[9px] font-bold text-gray-400 uppercase">SUBIR IMAGEN BOTÓN</p></div>
                      )}
                    </div>
                    {element.props.btnBgImage && (
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        {[{ id: "cover", label: "Llena" }, { id: "repeat", label: "Mosaico" }, { id: "contain", label: "Ajustar" }].map((m) => (
                          <button key={m.id} onClick={() => handleChange("btnBgMode", m.id)} className={cn("flex-1 py-1 text-[8px] font-black uppercase rounded-md transition-all", (element.props.btnBgMode === m.id || (!element.props.btnBgMode && m.id === "cover")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{m.label}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <FluidSlider label="Redondeo" value={element.props.borderRadius || 12} min={0} max={40} onChange={(val:number) => handleChange("borderRadius", val)} />
                </div>
              </ControlGroup>
            )}

            <ControlGroup title="Fondo del Bloque" icon={Palette}>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => handleChange("bgColor", "transparent")} className={cn("w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center relative", element.props.bgColor === "transparent" ? "border-blue-500" : "")}>
                    <div className="w-full h-full rounded-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                    {element.props.bgColor === "transparent" && <Check size={12} className="absolute text-blue-600" />}
                  </button>
                  {["#ffffff", "#000000", "#3b82f6", "#1e293b", "#ef4444", "#10b981", "#f59e0b"].map(color => (
                    <button key={color} onClick={() => handleChange("bgColor", color)} className={cn("w-8 h-8 rounded-full border-2 transition-all relative", element.props.bgColor === color ? "border-blue-500 shadow-lg" : "border-gray-100")} style={{ backgroundColor: color }}>
                      {element.props.bgColor === color && <Check size={12} className={color === "#ffffff" ? "text-blue-500" : "text-white"} />}
                    </button>
                  ))}
                  <input type="color" value={element.props.bgColor || "#ffffff"} onChange={(e) => handleChange("bgColor", e.target.value)} className="w-8 h-8 rounded-full border-2 border-gray-100 p-0 overflow-hidden cursor-pointer" />
                </div>
                <FluidSlider label="Opacidad Capa" value={element.props.opacity !== undefined ? element.props.opacity : 100} min={0} max={100} suffix="%" onChange={(val: number) => handleChange("opacity", val)} />
              </div>
            </ControlGroup>

            <ControlGroup title="Textura del Bloque (Mosaico)" icon={ImageIcon}>
               <div onClick={() => triggerUpload("bgPatternUrl")} className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all relative">
                  {(element.props.bgPatternUrl) ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100">
                      <div className="absolute inset-0" style={{ backgroundImage: `url(${element.props.bgPatternUrl})`, backgroundRepeat: 'repeat', backgroundSize: 'auto 100%' }} />
                      <button onClick={(e) => { e.stopPropagation(); handleChange("bgPatternUrl", null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors z-10"><X size={12} /></button>
                    </div>
                  ) : (<div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3"><ImageIcon size={24} className="text-gray-300" /></div>)}
                  <p className="text-xs font-bold text-gray-700 uppercase">Subir Fondo del Bloque</p>
               </div>
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
           <ControlGroup title="Marketplace" icon={ShoppingBag}><div className="py-10 text-center"><Sparkles size={24} className="text-blue-500 mx-auto mb-2 animate-pulse"/><p className="text-[10px] font-black uppercase text-blue-600">Próximamente</p></div></ControlGroup>
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