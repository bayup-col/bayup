"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStudio, ComponentType, SectionType } from "../context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Type, Palette, Move, Sliders, Image as ImageIcon, 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, 
  Settings2, Sparkles, Layout, ChevronDown, Check, Upload,
  ShoppingBag, MousePointer2, Play, Link as LinkIcon, Plus as PlusIcon, Trash2,
  Zap, Star, Flame, Wind, Wand2, MonitorPlay, Maximize, RotateCw,
  User, ShoppingCart, Search, Edit3, Heart, Bell, MessageSquare, Phone, Info, Globe, Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

type TabType = "content" | "style" | "animation";

// --- HELPERS (ESTÁNDAR PLATINUM) ---

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

const ControlGroup = ({ title, icon: Icon, children, defaultOpen = false, onRemove }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <div onClick={() => setIsOpen(!isOpen)} className={cn("flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border border-transparent", isOpen ? "bg-blue-50/50 border-blue-100" : "hover:bg-gray-50")}>
        <div className="flex items-center gap-3">
          <div className={cn("p-1.5 rounded-lg transition-colors", isOpen ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400")}><Icon size={14} /></div>
          <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", isOpen ? "text-blue-700" : "text-gray-500")}>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {onRemove && <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-full shadow-sm"><Trash2 size={12}/></button>}
          <ChevronDown size={14} className={cn("text-gray-300 transition-transform duration-300", isOpen && "rotate-180 text-blue-500")} />
        </div>
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
  const { selectedElementId, selectElement, pageData, updateElement, sidebarView, viewport } = useStudio();
  const [activeTab, setActiveTab] = useState<TabType>("content");
  const [uploadTarget, setUploadTarget] = useState<{ id: string | null, key: string } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [realCategories, setRealCategories] = useState<{id: string, title: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const { categoryService } = await import('@/lib/api');
        const categories = await categoryService.getAll(token);
        setRealCategories(Array.isArray(categories) ? categories : []);
      } catch (err: any) {
        console.error("Inspector: Fallo al cargar categorías reales del sistema.");
      }
    };
    fetchCategories();
  }, []);

  const elementData = React.useMemo(() => {
    if (!selectedElementId) return null;
    const sections: SectionType[] = ["header", "body", "footer"];
    for (const section of sections) {
      const found = pageData[section].elements.find(el => el.id === selectedElementId);
      if (found) {
        // MEZCLA DE PROPS PARA EL INSPECTOR (Base + Overrides del Viewport actual)
        const effectiveProps = {
          ...found.props,
          ...(found.props.responsiveOverrides?.[viewport] || {})
        };
        return { 
          element: { ...found, props: effectiveProps }, 
          sectionKey: section 
        };
      }
    }
    return null;
  }, [pageData, selectedElementId, viewport]);

  if (sidebarView !== "properties" || !selectedElementId || !elementData) return null;
  const { element, sectionKey } = elementData;

  const handleChange = (key: string, value: any) => updateElement(sectionKey, selectedElementId, { [key]: value });

  const handleExtraChange = (id: string, newProps: any) => {
    const newList = (element.props.extraElements || []).map((item: any) => item.id === id ? { ...item, ...newProps } : item);
    handleChange("extraElements", newList);
  };

  const addExtraElement = (type: "text" | "button" | "image") => {
    const newEl = {
      id: uuidv4(),
      type,
      ...(type === 'text' ? { content: "Nuevo Mensaje", size: 24, color: "#ffffff", variant: "solid", posX: 0, posY: 0, intensity: 100, font: "font-sans", effect: "none" } : 
         type === 'button' ? { text: "Ver Oferta", variant: "solid", bgColor: "#2563eb", textColor: "#ffffff", posX: 0, posY: 0, size: 14, intensity: 100, font: "font-black", borderRadius: 12 } :
         { url: "", floatType: "image", size: 150, posX: 0, posY: 0, radius: 12, intensity: 100, floatAnim: "none" })
    };
    handleChange("extraElements", [...(element.props.extraElements || []), newEl]);
    setShowAddMenu(false);
  };

  const triggerUpload = (targetKey: string, id: string | null = null) => {
    setUploadTarget({ id, key: targetKey });
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget) {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const keyToUpdate = uploadTarget.key;
      
      if (uploadTarget.id) {
        // Lógica para Elementos Extra (Banner/Video)
        const isExtra = (element.props.extraElements || []).some((it: any) => it.id === uploadTarget.id);
        if (isExtra) {
          const newList = (element.props.extraElements || []).map((item: any) => {
            if (item.id === uploadTarget.id) {
              return { ...item, [keyToUpdate]: url, url: url, type: isVideo ? 'video' : 'image' };
            }
            return item;
          });
          handleChange("extraElements", newList);
        } else {
          // Lógica para Redes Sociales del Footer
          const newList = (element.props.socialLinks || []).map((item: any) => {
            if (item.id === uploadTarget.id) {
              return { ...item, [keyToUpdate]: url };
            }
            return item;
          });
          handleChange("socialLinks", newList);
        }
      } else {
        // Lógica para elementos principales (Fondo o Complemento)
        if (keyToUpdate === "floatUrl") {
          handleChange("floatUrl", url);
          handleChange("floatType", isVideo ? "video" : "image");
        } else if (keyToUpdate === "bgBackground") {
          if (isVideo) {
            handleChange("videoUrl", url);
            handleChange("bgType", "video");
          } else {
            handleChange("imageUrl", url);
            handleChange("bgType", "image");
          }
        } else {
          handleChange(keyToUpdate, url);
        }
      }
      setUploadTarget(null);
    }
  };

  // --- RENDERERS UNIVERSALES PLATINUM ---

  const renderModularTextDesigner = (props: any, onUpdate: (p: any) => void, title: string, canRemove = false, onRemove?: () => void) => {
    const variant = props.variant || "solid";
    return (
      <ControlGroup title={title} icon={Type} onRemove={canRemove ? onRemove : null} defaultOpen={true}>
        <div className="space-y-4">
          <textarea value={props.content || props.title || ""} onChange={(e) => onUpdate({ content: e.target.value, title: e.target.value })} className="w-full p-3 border rounded-xl text-sm font-black bg-gray-50/30 uppercase italic" />
          <div className="space-y-2">
            <span className="text-[9px] font-black text-gray-400 uppercase">Temas de Diseño</span>
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
              {["solid", "outline", "3d", "brutalist", "aurora"].map(v => (<button key={v} onClick={() => onUpdate({ variant: v })} className={cn("py-1.5 text-[8px] font-black uppercase rounded-md transition-all", (variant === v) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
            </div>
          </div>
          {variant === "aurora" && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={props.aurora1 || "#00f2ff"} onChange={(e) => onUpdate({ aurora1: e.target.value })} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 1</span></div>
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={props.aurora2 || "#7000ff"} onChange={(e) => onUpdate({ aurora2: e.target.value })} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 2</span></div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <select value={props.font || "font-sans"} onChange={(e) => onUpdate({ font: e.target.value })} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white outline-none">
              <option value="font-sans">Modern (Sans)</option>
              <option value="font-serif">Classic (Serif)</option>
              <option value="font-mono">Technical (Mono)</option>
              <option value="font-black">Heavy (Display)</option>
              <option value="font-cursive">Elegant (Script)</option>
            </select>
            <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={props.color || "#ffffff"} onChange={(e) => onUpdate({ color: e.target.value })} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase">Color</span></div>
          </div>
          <FluidSlider label="Tamaño" value={props.size || 24} min={10} max={120} onChange={(val:number) => onUpdate({ size: val })} />
          <FluidSlider label="Intensidad Visual" value={props.intensity || 100} min={0} max={200} onChange={(val:number) => onUpdate({ intensity: val })} />
          <div className="space-y-2">
            <span className="text-[9px] font-black text-gray-400 uppercase">Efecto Visual</span>
            <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg">
              {[{id:"none", l:"Normal", i:Wand2}, {id:"glow", l:"Resplandor", i:Zap}, {id:"neon", l:"Neon", i:Star}, {id:"fire", l:"Fuego", i:Flame}, {id:"float", l:"Flotante", i:Wind}].map(eff => (
                <button key={eff.id} onClick={() => onUpdate({ effect: eff.id })} className={cn("flex items-center gap-2 p-2 text-[8px] font-black uppercase rounded-md transition-all", (props.effect === eff.id || (!props.effect && eff.id === "none")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}><eff.i size={10} /> {eff.l}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3"><FluidSlider label="Posición X" value={props.posX || 0} min={-500} max={500} onChange={(val:number) => onUpdate({ posX: val })} /><FluidSlider label="Posición Y" value={props.posY || 0} min={-200} max={200} onChange={(val:number) => onUpdate({ posY: val })} /></div>
        </div>
      </ControlGroup>
    );
  };

  const renderModularButtonDesigner = (props: any, onUpdate: (p: any) => void, title: string, canRemove = false, onRemove?: () => void, showLink = true) => {
    const variant = props.variant || "solid";
    return (
      <ControlGroup title={title} icon={MousePointer2} onRemove={canRemove ? onRemove : null} defaultOpen={true}>
        <div className="space-y-4">
          <div className={cn("grid gap-2", showLink ? "grid-cols-2" : "grid-cols-1")}>
            <div><span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Etiqueta</span><input type="text" value={props.text || ""} onChange={(e) => onUpdate({ text: e.target.value })} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
            {showLink && <div><span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Vínculo</span><input type="text" value={props.url || ""} onChange={(e) => onUpdate({ url: e.target.value })} className="w-full p-2 border rounded-lg text-[10px] font-mono text-blue-600 placeholder:text-gray-300" placeholder="URL" /></div>}
          </div>
          <div className="space-y-2">
            <span className="text-[9px] font-black text-gray-400 uppercase">Temas de Botón</span>
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
              {[{id:"solid", l:"Sólido"}, {id:"outline", l:"Borde"}, {id:"3d", l:"3D Pro"}, {id:"glass", l:"Glass"}, {id:"aurora", l:"Aurora"}, {id:"neon", l:"Neon"}, {id:"brutalist", l:"Brutal"}, {id:"retro", l:"Retro"}].map(v => (
                <button key={v.id} onClick={() => onUpdate({ variant: v.id })} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (variant === v.id) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v.l}</button>
              ))}
            </div>
          </div>
          {variant === "aurora" && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={props.aurora1 || "#00f2ff"} onChange={(e) => onUpdate({ aurora1: e.target.value })} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 1</span></div>
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={props.aurora2 || "#7000ff"} onChange={(e) => onUpdate({ aurora2: e.target.value })} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 2</span></div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-1.5 border rounded-lg bg-white h-[38px]"><input type="color" value={props.bgColor || "#2563eb"} onChange={(e) => onUpdate({ bgColor: e.target.value })} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase">Fondo</span></div>
            <div className="flex flex-col justify-end"><FluidSlider label="Tamaño" value={props.size || 14} min={10} max={40} onChange={(val:number) => onUpdate({ size: val })} /></div>
          </div>
          <FluidSlider label="Redondeo" value={props.borderRadius || 12} min={0} max={40} onChange={(val:number) => onUpdate({ borderRadius: val })} />
          <div className="grid grid-cols-2 gap-3"><FluidSlider label="Posición X" value={props.posX || 0} min={-500} max={500} onChange={(val:number) => onUpdate({ posX: val })} /><FluidSlider label="Posición Y" value={props.posY || 0} min={-200} max={200} onChange={(val:number) => onUpdate({ posY: val })} /></div>
        </div>
      </ControlGroup>
    );
  };

  const renderModularMultimediaDesigner = (props: any, onUpdate: (p: any) => void, title: string, canRemove = false, onRemove?: () => void, uploadKey = "url") => {
    const floatType = props.floatType || props.type || "image";
    const url = props.url || props.floatUrl || props.videoUrl || props.imageUrl;
    
    return (
      <ControlGroup title={title} icon={ImageIcon} onRemove={canRemove ? onRemove : null} defaultOpen={true}>
        <div className="space-y-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {[{id:"image", l:"Imagen"}, {id:"video", l:"Video"}].map(t => (
              <button key={t.id} onClick={() => onUpdate({ floatType: t.id, bgType: t.id, type: t.id })} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase rounded-md transition-all", (floatType === t.id) ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}>{t.l}</button>
            ))}
          </div>
          <div onClick={() => triggerUpload(uploadKey, props.id)} className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 cursor-pointer relative">
            {url ? (
              <div className="relative aspect-square w-20 mx-auto rounded-lg overflow-hidden border">
                {floatType === "video" ? <div className="w-full h-full bg-black flex items-center justify-center"><Play size={24} className="text-white opacity-50"/></div> : <img src={url} className="w-full h-full object-cover" />}
                <button onClick={(e) => { e.stopPropagation(); onUpdate({ url: null, floatUrl: null, videoUrl: null, imageUrl: null }); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-xl border-2 border-white hover:scale-110 transition-all z-50"><X size={14} strokeWidth={3}/></button>
              </div>
            ) : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR {floatType === "video" ? "VIDEO" : "IMAGEN"}</p>}
          </div>
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-50">
            <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Vínculo (Redirección)</span>
            <input type="text" value={props.linkUrl || ""} onChange={(e) => onUpdate({ linkUrl: e.target.value })} className="w-full p-2 border rounded-lg text-[10px] font-mono text-blue-600 bg-gray-50/30" placeholder="https://..." />
          </div>
          
          <div className="space-y-2 pt-2 border-t border-gray-50">
            <span className="text-[9px] font-black text-gray-400 uppercase">Efectos Dinámicos</span>
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
              {[{id:"none", l:"Normal", i:Wand2}, {id:"float", l:"Flotar", i:Wind}, {id:"zoom", l:"Zoom", i:Maximize}, {id:"blink", l:"Parpadeo", i:Zap}, {id:"rotate", l:"Rotar", i:RotateCw}, {id:"pulse", l:"Pulso", i:Star}].map(eff => (
                <button key={eff.id} onClick={() => onUpdate({ floatAnim: eff.id, anim: eff.id })} className={cn("flex flex-col items-center gap-1 p-2 text-[6px] font-black uppercase rounded-md transition-all", ((props.floatAnim || props.anim) === eff.id || (!(props.floatAnim || props.anim) && eff.id === "none")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}><eff.i size={10} /> {eff.l}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3"><FluidSlider label="Escala" value={props.size || props.floatSize || 150} min={50} max={400} onChange={(v:number) => onUpdate({ size: v, floatSize: v })} /><FluidSlider label="Puntas" value={props.radius || props.floatRadius || 12} min={0} max={100} onChange={(v:number) => onUpdate({ radius: v, floatRadius: v })} /></div>
          <div className="grid grid-cols-2 gap-3"><FluidSlider label="Posición X" value={props.posX ?? props.floatPosX ?? 0} min={-600} max={600} onChange={(v:number) => onUpdate({ posX: v, floatPosX: v })} /><FluidSlider label="Posición Y" value={props.posY ?? props.floatPosY ?? 0} min={-300} max={300} onChange={(v:number) => onUpdate({ posY: v, floatPosY: v })} /></div>
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
          <div className="space-y-4">
            {sectionKey === "header" && (
              <>
                {/* BARRA DE ANUNCIOS */}
                {element.type === "announcement-bar" && (
                  <ControlGroup title="Mensajes de la Barra" icon={Type} defaultOpen={true}>
                    <div className="space-y-3">
                      {(element.props.messages || []).map((msg: string, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            type="text" 
                            value={msg} 
                            onChange={(e) => {
                              const newMsgs = [...element.props.messages];
                              newMsgs[idx] = e.target.value;
                              handleChange("messages", newMsgs);
                            }} 
                            className="flex-1 p-2 border rounded-lg text-[10px] font-bold" 
                          />
                          <button onClick={() => handleChange("messages", element.props.messages.filter((_:any, i:number) => i !== idx))} className="text-red-400 p-1"><X size={14}/></button>
                        </div>
                      ))}
                      <button onClick={() => handleChange("messages", [...(element.props.messages || []), "¡NUEVO MENSAJE!"])} className="w-full py-2 border-2 border-dashed rounded-lg text-[9px] font-black text-gray-400 uppercase">+ Añadir Mensaje</button>
                    </div>
                  </ControlGroup>
                )}

                {element.type === "announcement-bar" && (
                  <ControlGroup title="Animación" icon={Zap} defaultOpen={false}>
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Tipo de Transición</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {id: "slide", l: "Deslizar"},
                          {id: "fade", l: "Desvanecer"},
                          {id: "zoom", l: "Zoom"},
                          {id: "bounce", l: "Rebote"},
                          {id: "marquee", l: "Marquesina"},
                          {id: "rotate", l: "Rotar"}
                        ].map(anim => (
                          <button 
                            key={anim.id} 
                            onClick={() => handleChange("messageAnimation", anim.id)}
                            className={cn(
                              "py-2 px-3 rounded-xl border text-[9px] font-black uppercase transition-all",
                              element.props.messageAnimation === anim.id ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100" : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                            )}
                          >
                            {anim.l}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(element.props.messageAnimation === "marquee" || element.props.messageAnimation === "rotate") && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                        <FluidSlider 
                          label="Duración de Vuelta (Seg)" 
                          value={element.props.messageSpeed || 20} 
                          min={5} 
                          max={60} 
                          onChange={(v:number) => handleChange("messageSpeed", v)} 
                          suffix="s"
                        />
                        <p className="text-[7px] text-gray-400 italic mt-1">Menos segundos = más rápido.</p>
                      </div>
                    )}
                  </ControlGroup>
                )}

                {/* NAVEGACIÓN (NAVBAR) */}
                {element.type === "navbar" && (
                  <>
                    {/* MENÚ 1: LOGOTIPO */}
                    <ControlGroup title="1. Identidad (Logo)" icon={ImageIcon} defaultOpen={true}>
                      <div className="space-y-4">
                        <div onClick={() => triggerUpload("logoUrl")} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 relative">
                          {element.props.logoUrl ? <div className="relative h-12 mx-auto"><img src={element.props.logoUrl} className="h-full object-contain" alt="Logo" /><button onClick={(e) => { e.stopPropagation(); handleChange("logoUrl", null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md border-2 border-white"><X size={10}/></button></div> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR LOGO</p>}
                        </div>
                        
                        <div className="space-y-3 pt-2 border-t border-gray-50">
                          <input type="text" value={element.props.logoText || ""} onChange={(e) => handleChange("logoText", e.target.value)} className="w-full p-3 border rounded-xl text-xs font-bold bg-gray-50/30 uppercase italic" placeholder="Nombre de Tienda..." />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.logoColor || "#2563eb"} onChange={(e) => handleChange("logoColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Color</span></div>
                            <select value={element.props.logoFont || "font-black"} onChange={(e) => handleChange("logoFont", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white"><option value="font-black">Black</option><option value="font-sans">Modern</option><option value="font-serif">Classic</option></select>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Tema de Texto</span>
                            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                              {["solid", "outline", "3d", "brutalist", "aurora"].map(v => (<button key={v} onClick={() => handleChange("logoVariant", v)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.logoVariant === v || (!element.props.logoVariant && v === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Efecto Visual</span>
                            <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-lg">
                              {[{id:"none", l:"Normal"}, {id:"glow", l:"Brillo"}, {id:"neon", l:"Neon"}, {id:"fire", l:"Fuego"}, {id:"glass", l:"Glass"}].map(eff => (
                                <button key={eff.id} onClick={() => handleChange("logoEffect", eff.id)} className={cn("py-1.5 text-[6px] font-black uppercase rounded-md transition-all", (element.props.logoEffect === eff.id || (!element.props.logoEffect && eff.id === "none")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{eff.l}</button>
                              ))}
                            </div>
                          </div>

                          {element.props.logoVariant === "aurora" && (
                            <div className="grid grid-cols-2 gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                              <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.logoAurora1 || "#00f2ff"} onChange={(e) => handleChange("logoAurora1", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C1</span></div>
                              <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.logoAurora2 || "#7000ff"} onChange={(e) => handleChange("logoAurora2", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C2</span></div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 pt-2 border-t border-gray-50">
                          <FluidSlider label="Escala Logo" value={element.props.logoSize || 24} min={12} max={120} onChange={(val:number) => handleChange("logoSize", val)} />
                          <FluidSlider label="Posición Logo" value={element.props.logoPosX || 0} min={-200} max={200} onChange={(val:number) => handleChange("logoPosX", val)} />
                        </div>
                      </div>
                    </ControlGroup>

                    {/* MENÚ 2: LINKS PRINCIPALES */}
                    <ControlGroup title="2. Menú Principal" icon={Layout} defaultOpen={false}>
                      <div className="space-y-2">
                        <div className="grid grid-cols-[1fr_1fr_40px] gap-2 px-1 mb-1">
                          <span className="text-[7px] font-black text-gray-400 uppercase">Etiqueta</span>
                          <span className="text-[7px] font-black text-gray-400 uppercase">Enlace (URL)</span>
                          <span className="text-[7px] font-black text-gray-400 uppercase text-center">Borrar</span>
                        </div>
                        {(element.props.menuItems || []).map((item: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center group">
                            <input 
                              type="text" 
                              value={typeof item === 'string' ? item : (item.label || "")} 
                              onChange={(e) => { 
                                const newItems = [...element.props.menuItems]; 
                                if (typeof newItems[idx] === 'string') newItems[idx] = { label: e.target.value, url: "/" };
                                else newItems[idx].label = e.target.value; 
                                handleChange("menuItems", newItems); 
                              }} 
                              className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white" 
                              placeholder="Nombre"
                            />
                            <input 
                              type="text" 
                              value={item.url || "/"} 
                              onChange={(e) => { 
                                const newItems = [...element.props.menuItems]; 
                                if (typeof newItems[idx] === 'string') newItems[idx] = { label: newItems[idx], url: e.target.value };
                                else newItems[idx].url = e.target.value; 
                                handleChange("menuItems", newItems); 
                              }} 
                              className="w-full p-2 border rounded-lg text-[9px] font-mono text-blue-600 bg-white" 
                              placeholder="/"
                            />
                            <button 
                              onClick={() => {
                                const newItems = element.props.menuItems.filter((_: any, i: number) => i !== idx);
                                handleChange("menuItems", newItems);
                              }} 
                              className="h-8 w-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                              title="Eliminar enlace"
                            >
                              <X size={16} strokeWidth={3} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => handleChange("menuItems", [...(element.props.menuItems || []), { label: "NUEVO", url: "/" }])} className="w-full py-2 mt-2 border-2 border-dashed rounded-lg text-[9px] font-black text-gray-400 uppercase hover:border-blue-300 hover:text-blue-500 transition-all">+ Añadir Enlace</button>

                        <div className="space-y-4 pt-4 border-t border-gray-100 mt-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.menuColor || "#4b5563"} onChange={(e) => handleChange("menuColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Color</span></div>
                            <select value={element.props.menuFont || "font-black"} onChange={(e) => handleChange("menuFont", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white outline-none"><option value="font-black">Heavy</option><option value="font-sans">Modern</option><option value="font-serif">Classic</option></select>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Tema de Texto</span>
                            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                              {["solid", "outline", "3d", "brutalist", "aurora"].map(v => (<button key={v} onClick={() => handleChange("menuVariant", v)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.menuVariant === v || (!element.props.menuVariant && v === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Efecto Visual</span>
                            <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-lg">
                              {[{id:"none", l:"Normal"}, {id:"glow", l:"Brillo"}, {id:"neon", l:"Neon"}, {id:"fire", l:"Fuego"}, {id:"glass", l:"Glass"}].map(eff => (
                                <button key={eff.id} onClick={() => handleChange("menuEffect", eff.id)} className={cn("py-1.5 text-[6px] font-black uppercase rounded-md transition-all", (element.props.menuEffect === eff.id || (!element.props.logoEffect && eff.id === "none")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{eff.l}</button>
                              ))}
                            </div>
                          </div>

                          {element.props.menuVariant === "aurora" && (
                            <div className="grid grid-cols-2 gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                              <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.menuAurora1 || "#00f2ff"} onChange={(e) => handleChange("menuAurora1", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C1</span></div>
                              <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.menuAurora2 || "#7000ff"} onChange={(e) => handleChange("menuAurora2", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C2</span></div>
                            </div>
                          )}

                          <div className="space-y-4 pt-2">
                            <FluidSlider label="Tamaño Letra" value={element.props.menuSize || 10} min={8} max={24} onChange={(val:number) => handleChange("menuSize", val)} />
                            <FluidSlider label="Posición Menú" value={element.props.menuPosX || 0} min={-200} max={200} onChange={(val:number) => handleChange("menuPosX", val)} />
                            <FluidSlider label="Separación Links" value={element.props.menuGap || 32} min={0} max={100} onChange={(val:number) => handleChange("menuGap", val)} />
                          </div>
                        </div>
                      </div>
                    </ControlGroup>

                    {/* MENÚ 3: ICONOS DE ACCESO */}
                    <ControlGroup title="3. Iconos de Acceso" icon={MousePointer2} defaultOpen={false}>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2">
                          <button onClick={() => handleChange("showUser", !element.props.showUser)} className={cn("flex items-center justify-between px-4 py-3 border rounded-xl text-[10px] font-black uppercase transition-all", element.props.showUser ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-400 border-gray-100")}>
                            <div className="flex items-center gap-2"><User size={14}/><span>Inicio Sesión</span></div>
                            <span>{element.props.showUser ? "ON" : "OFF"}</span>
                          </button>
                          <button onClick={() => handleChange("showCart", !element.props.showCart)} className={cn("flex items-center justify-between px-4 py-3 border rounded-xl text-[10px] font-black uppercase transition-all", element.props.showCart ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-400 border-gray-100")}>
                            <div className="flex items-center gap-2"><ShoppingCart size={14}/><span>Carrito</span></div>
                            <span>{element.props.showCart ? "ON" : "OFF"}</span>
                          </button>
                          <button onClick={() => handleChange("showSearch", !element.props.showSearch)} className={cn("flex items-center justify-between px-4 py-3 border rounded-xl text-[10px] font-black uppercase transition-all", element.props.showSearch ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-400 border-gray-100")}>
                            <div className="flex items-center gap-2"><Search size={14}/><span>Búsqueda</span></div>
                            <span>{element.props.showSearch ? "ON" : "OFF"}</span>
                          </button>
                        </div>

                        {/* Lista de Iconos Personalizados */}
                        {(element.props.extraUtilities || []).map((util: any, idx: number) => (
                          <div key={util.id} className="p-3 border rounded-xl bg-gray-50/50 space-y-3 relative group">
                            <div className="flex justify-between items-start">
                              <span className="text-[8px] font-black text-blue-600 uppercase italic">Acceso Personalizado</span>
                              <div className="flex gap-1">
                                <button onClick={() => {
                                  const newLabel = prompt("Nuevo nombre:", util.label);
                                  if(newLabel) {
                                    const newList = [...element.props.extraUtilities];
                                    newList[idx].label = newLabel;
                                    handleChange("extraUtilities", newList);
                                  }
                                }} className="p-1 hover:text-blue-500 transition-colors"><Edit3 size={12}/></button>
                                <button onClick={() => handleChange("extraUtilities", element.props.extraUtilities.filter((_:any, i:number) => i !== idx))} className="p-1 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                              </div>
                            </div>

                            {/* Selector de Icono */}
                            <div className="space-y-1.5">
                              <span className="text-[7px] font-black text-gray-400 uppercase">Elegir Icono</span>
                              <div className="grid grid-cols-6 gap-1">
                                {[
                                  {n: 'Heart', i: Heart}, {n: 'Bell', i: Bell}, {n: 'Star', i: Star}, 
                                  {n: 'MessageSquare', i: MessageSquare}, {n: 'Phone', i: Phone}, {n: 'Info', i: Info}
                                ].map(iconOpt => (
                                  <button 
                                    key={iconOpt.n}
                                    onClick={() => {
                                      const newList = [...element.props.extraUtilities];
                                      newList[idx].icon = iconOpt.n;
                                      handleChange("extraUtilities", newList);
                                    }}
                                    className={cn(
                                      "p-1.5 rounded-md border transition-all flex items-center justify-center",
                                      util.icon === iconOpt.n ? "bg-blue-500 border-blue-500 text-white shadow-sm" : "bg-white border-gray-100 text-gray-400 hover:border-blue-200"
                                    )}
                                  >
                                    <iconOpt.i size={12} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div className="space-y-1">
                                <span className="text-[7px] font-black text-gray-400 uppercase">Etiqueta</span>
                                <input type="text" value={util.label} readOnly className="w-full p-1.5 border rounded-lg text-[10px] font-bold bg-white/50 cursor-default" />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[7px] font-black text-gray-400 uppercase">Redirección</span>
                                <input type="text" value={util.url} onChange={(e) => {
                                  const newList = [...element.props.extraUtilities];
                                  newList[idx].url = e.target.value;
                                  handleChange("extraUtilities", newList);
                                }} className="w-full p-1.5 border rounded-lg text-[9px] font-mono text-blue-600 bg-white" placeholder="/" />
                              </div>
                            </div>
                          </div>
                        ))}

                        <button 
                          onClick={() => {
                            const newUtil = { id: uuidv4(), label: "Favoritos", icon: "Heart", url: "/favoritos", show: true };
                            handleChange("extraUtilities", [...(element.props.extraUtilities || []), newUtil]);
                          }} 
                          className="w-full py-3 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-black text-[9px] uppercase hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                        >
                          <PlusIcon size={14}/> Añadir Nuevo Acceso
                        </button>

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Modo de Visualización</span>
                            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                              {[{id:"icon", l:"Icono"}, {id:"text", l:"Letras"}, {id:"both", l:"Ambos"}].map(m => (
                                <button key={m.id} onClick={() => handleChange("utilityDisplayMode", m.id)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.utilityDisplayMode === m.id || (!element.props.utilityDisplayMode && m.id === "icon")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{m.l}</button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.utilityColor || "#6b7280"} onChange={(e) => handleChange("utilityColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Color</span></div>
                            <select value={element.props.utilityFont || "font-black"} onChange={(e) => handleChange("utilityFont", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white outline-none"><option value="font-black">Heavy</option><option value="font-sans">Modern</option><option value="font-serif">Classic</option></select>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Efecto Visual</span>
                            <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-lg">
                              {[{id:"none", l:"Normal"}, {id:"glow", l:"Brillo"}, {id:"neon", l:"Neon"}, {id:"fire", l:"Fuego"}, {id:"glass", l:"Glass"}].map(eff => (
                                <button key={eff.id} onClick={() => handleChange("utilityEffect", eff.id)} className={cn("py-1.5 text-[6px] font-black uppercase rounded-md transition-all", (element.props.utilityEffect === eff.id || (!element.props.logoEffect && eff.id === "none")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{eff.l}</button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4 pt-2">
                            <FluidSlider label="Escala / Tamaño" value={element.props.utilitySize || 18} min={12} max={48} onChange={(val:number) => handleChange("utilitySize", val)} />
                            <FluidSlider label="Posición Iconos" value={element.props.utilityPosX || 0} min={-200} max={200} onChange={(val:number) => handleChange("utilityPosX", val)} />
                            <FluidSlider label="Espacio entre Iconos" value={element.props.utilityGap || 16} min={0} max={60} onChange={(val:number) => handleChange("utilityGap", val)} />
                          </div>
                        </div>
                      </div>
                    </ControlGroup>

                    {/* ELEMENTOS MODULARES EXTRA EN NAVBAR */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      {(element.props.extraElements || []).map((extra: any) => (
                        <React.Fragment key={extra.id}>
                          {extra.type === 'text' && renderModularTextDesigner(extra, (p) => handleExtraChange(extra.id, p), "Texto Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                          {extra.type === 'button' && renderModularButtonDesigner(extra, (p) => handleExtraChange(extra.id, p), "Botón Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                          {(extra.type === 'image' || extra.type === 'video') && renderModularMultimediaDesigner(extra, (p) => handleExtraChange(extra.id, p), "Imagen Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                        </React.Fragment>
                      ))}

                      <div className="relative">
                        <button onClick={() => setShowAddMenu(!showAddMenu)} className="w-full py-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-blue-100 transition-all shadow-sm">
                          <PlusIcon size={14} /> Agregar Otro Elemento
                        </button>
                        <AnimatePresence>
                          {showAddMenu && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-0 w-full bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 z-50 mb-2 grid grid-cols-3 gap-2">
                              {[{id:'text', l:'Texto', i:Type}, {id:'button', l:'Botón', i:MousePointer2}, {id:'image', l:'Imagen', i:ImageIcon}].map(opt => (
                                <button key={opt.id} onClick={() => { addExtraElement(opt.id as any); setShowAddMenu(false); }} className="flex flex-col items-center gap-2 p-3 hover:bg-blue-50 rounded-xl transition-all">
                                  <div className="p-2 bg-blue-500 text-white rounded-lg shadow-sm"><opt.i size={16}/></div>
                                  <span className="text-[9px] font-black uppercase text-gray-600">{opt.l}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </>
                )}

                {/* TEXTO SIMPLE EN HEADER */}
                {element.type === "text" && (
                  renderModularTextDesigner(element.props, (p) => updateElement(sectionKey, selectedElementId, p), "Etiqueta de Inicio")
                )}

                {/* BOTÓN SIMPLE EN HEADER */}
                {element.type === "button" && (
                  renderModularButtonDesigner(element.props, (p) => updateElement(sectionKey, selectedElementId, p), "Botón de Acción Rápida")
                )}

                {/* EDITOR DE CARDS */}
                {element.type === "cards" && (
                  <>
                    <ControlGroup title="Configuración de Tarjetas" icon={Layout} defaultOpen={true}>
                      <div className="space-y-4">
                        {(element.props.cards || []).map((card: any, idx: number) => (
                          <div key={card.id || idx} className="p-4 border rounded-2xl bg-gray-50/50 space-y-4 relative group">
                            <button onClick={() => {
                              const newCards = element.props.cards.filter((_:any, i:number) => i !== idx);
                              handleChange("cards", newCards);
                            }} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><X size={14}/></button>
                            
                            <div className="space-y-2">
                              <span className="text-[7px] font-black text-gray-400 uppercase">Título de Tarjeta</span>
                              <input type="text" value={card.title || ""} onChange={(e) => {
                                const newCards = [...element.props.cards];
                                newCards[idx].title = e.target.value;
                                handleChange("cards", newCards);
                              }} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white" />
                            </div>

                            <div className="space-y-2">
                              <span className="text-[7px] font-black text-gray-400 uppercase">Descripción</span>
                              <textarea value={card.description || ""} onChange={(e) => {
                                const newCards = [...element.props.cards];
                                newCards[idx].description = e.target.value;
                                handleChange("cards", newCards);
                              }} className="w-full p-2 border rounded-lg text-[9px] bg-white h-16" />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                               <div className="flex items-center gap-2 p-1.5 border rounded-lg bg-white"><input type="color" value={card.iconColor || "#2563eb"} onChange={(e) => {
                                 const newCards = [...element.props.cards];
                                 newCards[idx].iconColor = e.target.value;
                                 handleChange("cards", newCards);
                               }} className="w-5 h-5 rounded-md p-0 cursor-pointer" /><span className="text-[8px] text-gray-400 font-bold uppercase">Color Icono</span></div>
                               
                               <div className="flex items-center gap-2 p-1.5 border rounded-lg bg-white"><input type="color" value={card.bgColor || "#ffffff"} onChange={(e) => {
                                 const newCards = [...element.props.cards];
                                 newCards[idx].bgColor = e.target.value;
                                 handleChange("cards", newCards);
                               }} className="w-5 h-5 rounded-md p-0 cursor-pointer" /><span className="text-[8px] text-gray-400 font-bold uppercase">Fondo Card</span></div>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => {
                          const newCard = { id: uuidv4(), title: "Nueva Tarjeta", description: "Descripción de ejemplo...", icon: "Star", iconColor: "#2563eb", bgColor: "#ffffff" };
                          handleChange("cards", [...(element.props.cards || []), newCard]);
                        }} className="w-full py-3 border-2 border-dashed rounded-xl text-[9px] font-black text-gray-400 uppercase hover:text-blue-500 transition-all">+ Añadir Tarjeta</button>
                      </div>
                    </ControlGroup>

                    <ControlGroup title="Diseño de Grilla" icon={Layout}>
                      <div className="space-y-4">
                        <FluidSlider label="Columnas" value={element.props.columns || 3} min={1} max={4} onChange={(v:number) => handleChange("columns", v)} />
                        <FluidSlider label="Espaciado (Gap)" value={element.props.gap || 24} min={0} max={60} onChange={(v:number) => handleChange("gap", v)} />
                        <FluidSlider label="Redondeo" value={element.props.borderRadius || 24} min={0} max={60} onChange={(v:number) => handleChange("borderRadius", v)} />
                      </div>
                    </ControlGroup>
                  </>
                )}
              </>
            )}

            {sectionKey === "body" && (
              <>
                {/* Lógica Unificada de Contenido para TODOS los bloques del CUERPO */}
                {renderModularTextDesigner({ ...element.props, content: element.props.title, variant: element.props.titleVariant, color: element.props.titleColor, size: element.props.titleSize, posX: element.props.titlePosX, posY: element.props.titlePosY, font: element.props.titleFont, aurora1: element.props.titleAurora1, aurora2: element.props.titleAurora2, effect: element.props.titleEffect, intensity: element.props.titleIntensity }, (p) => {
                  const key = Object.keys(p)[0];
                  const mapping: any = { content: 'title', variant: 'titleVariant', color: 'titleColor', size: 'titleSize', posX: 'titlePosX', posY: 'titlePosY', font: 'titleFont', aurora1: 'titleAurora1', aurora2: 'titleAurora2', effect: 'titleEffect', intensity: 'titleIntensity' };
                  handleChange(mapping[key], p[key]);
                }, "Título de Impacto")}

                {renderModularTextDesigner({ ...element.props, content: element.props.subtitle, variant: element.props.subtitleVariant, color: element.props.subtitleColor, size: element.props.subtitleSize, posX: element.props.subtitlePosX, posY: element.props.subtitlePosY, font: element.props.subtitleFont, intensity: element.props.subtitleIntensity }, (p) => {
                  const key = Object.keys(p)[0];
                  const mapping: any = { content: 'subtitle', variant: 'subtitleVariant', color: 'subtitleColor', size: 'subtitleSize', posX: 'subtitlePosX', posY: 'subtitlePosY', font: 'subtitleFont', intensity: 'subtitleIntensity' };
                  handleChange(mapping[key], p[key]);
                }, "Descripción")}

                                    {renderModularButtonDesigner({ ...element.props, text: element.props.primaryBtnText, variant: element.props.primaryBtnVariant, bgColor: element.props.primaryBtnBgColor, posX: element.props.primaryBtnPosX, posY: element.props.primaryBtnPosY, size: element.props.primaryBtnSize, borderRadius: element.props.primaryBtnBorderRadius, aurora1: element.props.primaryBtnAurora1, aurora2: element.props.primaryBtnAurora2, intensity: element.props.primaryBtnIntensity }, (p) => {
                                      const key = Object.keys(p)[0];
                                      const mapping: any = { text: 'primaryBtnText', variant: 'primaryBtnVariant', bgColor: 'primaryBtnBgColor', posX: 'primaryBtnPosX', posY: 'primaryBtnPosY', size: 'primaryBtnSize', borderRadius: 'primaryBtnBorderRadius', aurora1: 'primaryBtnAurora1', aurora2: 'primaryBtnAurora2', intensity: 'primaryBtnIntensity' };
                                      handleChange(mapping[key], p[key]);
                                    }, "Botón Primario")}
                
                                    {renderModularButtonDesigner({ ...element.props, text: element.props.secondaryBtnText, variant: element.props.secondaryBtnVariant, posX: element.props.secondaryBtnPosX, posY: element.props.secondaryBtnPosY, borderRadius: element.props.secondaryBtnBorderRadius }, (p) => {
                                      const key = Object.keys(p)[0];
                                      const mapping: any = { text: 'secondaryBtnText', variant: 'secondaryBtnVariant', posX: 'secondaryBtnPosX', posY: 'secondaryBtnPosY', borderRadius: 'secondaryBtnBorderRadius' };
                                      handleChange(mapping[key], p[key]);
                                    }, "Botón Secundario")}
                                {renderModularMultimediaDesigner({ ...element.props, floatUrl: element.props.floatUrl }, (p) => {
                                  const key = Object.keys(p)[0];
                                  const mapping: any = { floatType: 'floatType', url: 'floatUrl', floatUrl: 'floatUrl', floatAnim: 'floatAnim', size: 'floatSize', floatSize: 'floatSize', radius: 'floatRadius', floatRadius: 'floatRadius', posX: 'floatPosX', floatPosX: 'floatPosX', posY: 'floatPosY', floatPosY: 'floatPosY', floatLinkUrl: 'floatLinkUrl' };
                                  handleChange(mapping[key], p[key]);
                                }, "Imagen de Complemento", false, undefined, "floatUrl")}
                
                                {/* SUPER EDITOR DE CARDS */}
                                {element.type === "cards" && (
                                  <>
                                    <div className="mt-8 mb-4">
                                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] px-2">Gestión de Tarjetas Elite</span>
                                    </div>
                
                                    {(element.props.cards || []).map((card: any, idx: number) => (
                                      <ControlGroup 
                                        key={card.id || idx} 
                                        title={`${idx + 1}. ${card.title || 'Tarjeta'}`} 
                                        icon={Layout} 
                                        defaultOpen={idx === 0}
                                        onRemove={() => {
                                          const newCards = element.props.cards.filter((_:any, i:number) => i !== idx);
                                          handleChange("cards", newCards);
                                        }}
                                      >
                                        <div className="space-y-4">
                                          <div className="space-y-2">
                                            <span className="text-[8px] font-black text-gray-400 uppercase">Contenido y Acción</span>
                                            <input type="text" value={card.title || ""} onChange={(e) => {
                                              const newCards = [...element.props.cards];
                                              newCards[idx].title = e.target.value;
                                              handleChange("cards", newCards);
                                            }} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white" placeholder="Título..." />
                                            
                                                                        <textarea value={card.description || ""} onChange={(e) => {
                                                                          const newCards = [...element.props.cards];
                                                                          newCards[idx].description = e.target.value;
                                                                          handleChange("cards", newCards);
                                                                        }} className="w-full p-2 border rounded-lg text-[9px] bg-white h-16" placeholder="Descripción..." />
                                            
                                                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                                                          <select value={card.descFont || "font-sans"} onChange={(e) => {
                                                                            const newCards = [...element.props.cards];
                                                                            newCards[idx].descFont = e.target.value;
                                                                            handleChange("cards", newCards);
                                                                          }} className="w-full p-1.5 border rounded-lg text-[8px] font-bold bg-white outline-none">
                                                                            <option value="font-sans">Sans</option>
                                                                            <option value="font-serif">Serif</option>
                                                                            <option value="font-mono">Mono</option>
                                                                          </select>
                                                                          <div className="flex items-center gap-2 p-1 border rounded-lg bg-white">
                                                                            <input type="color" value={card.descColor || "#6b7280"} onChange={(e) => {
                                                                              const newCards = [...element.props.cards];
                                                                              newCards[idx].descColor = e.target.value;
                                                                              handleChange("cards", newCards);
                                                                            }} className="w-4 h-4 rounded-sm p-0 cursor-pointer" />
                                                                            <FluidSlider label="T. Desc" value={card.descSize || 14} min={8} max={24} onChange={(v:number) => {
                                                                              const newCards = [...element.props.cards];
                                                                              newCards[idx].descSize = v;
                                                                              handleChange("cards", newCards);
                                                                            }} />
                                                                          </div>
                                                                        </div>                
                                            <div className="flex items-center gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                                               <LinkIcon size={12} className="text-blue-500" />
                                               <input type="text" value={card.url || ""} onChange={(e) => {
                                                 const newCards = [...element.props.cards];
                                                 newCards[idx].url = e.target.value;
                                                 handleChange("cards", newCards);
                                               }} className="flex-1 bg-transparent border-none text-[8px] font-mono text-blue-600 outline-none" placeholder="Enlace de Redirección..." />
                                            </div>
                                          </div>
                
                                                                    <div className="space-y-2 pt-2 border-t border-gray-100">
                                                                      <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-[8px] font-black text-gray-400 uppercase">Iconografía y Estética</span>
                                                                        <button 
                                                                          onClick={() => {
                                                                            const newCards = [...element.props.cards];
                                                                            newCards[idx].showIcon = card.showIcon === false ? true : false;
                                                                            handleChange("cards", newCards);
                                                                          }}
                                                                          className={cn(
                                                                            "flex items-center gap-1 px-2 py-1 rounded-md text-[7px] font-black uppercase transition-all",
                                                                            card.showIcon !== false ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                                                                          )}
                                                                        >
                                                                          {card.showIcon !== false ? <Eye size={10} /> : <EyeOff size={10} />}
                                                                          <span>{card.showIcon !== false ? "Visible" : "Oculto"}</span>
                                                                        </button>
                                                                      </div>
                                                                      
                                                                      {card.showIcon !== false && (
                                                                        <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-2">
                                                                          <div className="grid grid-cols-6 gap-1 bg-gray-100 p-1 rounded-lg">
                                                                            {[
                                                                              {n: 'Zap', i: Zap}, {n: 'Star', i: Star}, {n: 'Heart', i: Heart}, 
                                                                              {n: 'Bell', i: Bell}, {n: 'Info', i: Info}, {n: 'Wind', i: Wind}
                                                                            ].map(iconOpt => (
                                                                              <button key={iconOpt.n} onClick={() => {
                                                                                const newCards = [...element.props.cards];
                                                                                newCards[idx].icon = iconOpt.n;
                                                                                handleChange("cards", newCards);
                                                                              }} className={cn("p-1.5 rounded-md border flex items-center justify-center transition-all", card.icon === iconOpt.n ? "bg-blue-500 text-white shadow-sm border-blue-500" : "bg-white text-gray-400 border-gray-50")}>
                                                                                <iconOpt.i size={12} />
                                                                              </button>
                                                                            ))}
                                                                          </div>
                                                                          
                                                                          <div className="grid grid-cols-2 gap-2">
                                                                            <div className="flex items-center gap-2 p-1.5 border rounded-lg bg-white"><input type="color" value={card.iconColor || "#2563eb"} onChange={(e) => {
                                                                              const newCards = [...element.props.cards];
                                                                              newCards[idx].iconColor = e.target.value;
                                                                              handleChange("cards", newCards);
                                                                            }} className="w-5 h-5 rounded-md p-0 cursor-pointer" /><span className="text-[8px] text-gray-400 font-bold uppercase">Color Icono</span></div>
                                                                            
                                                                            <div className="flex items-center gap-2 p-1.5 border rounded-lg bg-white"><input type="color" value={card.bgColor || "#ffffff"} onChange={(e) => {
                                                                              const newCards = [...element.props.cards];
                                                                              newCards[idx].bgColor = e.target.value;
                                                                              handleChange("cards", newCards);
                                                                            }} className="w-5 h-5 rounded-md p-0 cursor-pointer" /><span className="text-[8px] text-gray-400 font-bold uppercase">Fondo Card</span></div>
                                                                          </div>
                                                                        </div>
                                                                      )}
                                          
                                                                      {card.showIcon === false && (
                                                                        <div className="p-2 border rounded-lg bg-white">
                                                                          <div className="flex items-center gap-2 p-1.5"><input type="color" value={card.bgColor || "#ffffff"} onChange={(e) => {
                                                                            const newCards = [...element.props.cards];
                                                                            newCards[idx].bgColor = e.target.value;
                                                                            handleChange("cards", newCards);
                                                                          }} className="w-5 h-5 rounded-md p-0 cursor-pointer" /><span className="text-[8px] text-gray-400 font-bold uppercase">Fondo Card</span></div>
                                                                        </div>
                                                                      )}
                                                                    </div>                
                                          <div className="space-y-4 pt-2 border-t border-gray-100">
                                            <span className="text-[8px] font-black text-gray-400 uppercase">Dimensiones y Ubicación</span>
                                            <div className="grid grid-cols-2 gap-3">
                                              <FluidSlider label="Tamaño Icono" value={card.iconSize || 40} min={20} max={80} onChange={(v:number) => {
                                                const newCards = [...element.props.cards];
                                                newCards[idx].iconSize = v;
                                                handleChange("cards", newCards);
                                              }} />
                                              <FluidSlider label="Tamaño Texto" value={card.titleSize || 20} min={10} max={40} onChange={(v:number) => {
                                                const newCards = [...element.props.cards];
                                                newCards[idx].titleSize = v;
                                                handleChange("cards", newCards);
                                              }} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                              <FluidSlider label="Posición X" value={card.posX || 0} min={-100} max={100} onChange={(v:number) => {
                                                const newCards = [...element.props.cards];
                                                newCards[idx].posX = v;
                                                handleChange("cards", newCards);
                                              }} />
                                              <FluidSlider label="Posición Y" value={card.posY || 0} min={-100} max={100} onChange={(v:number) => {
                                                const newCards = [...element.props.cards];
                                                newCards[idx].posY = v;
                                                handleChange("cards", newCards);
                                              }} />
                                            </div>
                                          </div>
                                        </div>
                                      </ControlGroup>
                                    ))}
                
                                    <div className="px-2 mb-8">
                                      <button onClick={() => {
                                        const newCard = { id: uuidv4(), title: "Nueva Tarjeta", description: "Descripción...", icon: "Star", iconColor: "#2563eb", bgColor: "#ffffff", posX: 0, posY: 0, iconSize: 40, titleSize: 20 };
                                        handleChange("cards", [...(element.props.cards || []), newCard]);
                                      }} className="w-full py-4 border-2 border-dashed border-blue-200 rounded-2xl text-[10px] font-black text-blue-500 uppercase flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-sm">
                                        <PlusIcon size={14} /> Añadir Tarjeta de Impacto
                                      </button>
                                    </div>
                
                                    <ControlGroup title="Configuración de Grilla Global" icon={Settings2}>
                                      <div className="space-y-4">
                                        <FluidSlider label="Columnas en Pantalla" value={element.props.columns || 3} min={1} max={6} onChange={(v:number) => handleChange("columns", v)} />
                                        <FluidSlider label="Separación entre Cards" value={element.props.gap || 24} min={0} max={100} onChange={(v:number) => handleChange("gap", v)} />
                                        <FluidSlider label="Redondeo de Bordes" value={element.props.borderRadius || 24} min={0} max={60} onChange={(v:number) => handleChange("borderRadius", v)} />
                                        <FluidSlider label="Altura del Módulo" value={element.props.height || 400} min={200} max={1200} onChange={(v:number) => handleChange("height", v)} />
                                      </div>
                                    </ControlGroup>
                                  </>
                                )}
                
                                {(element.props.extraElements || []).map((extra: any) => (                                      <React.Fragment key={extra.id}>
                                        {extra.type === 'text' && renderModularTextDesigner(extra, (p) => handleExtraChange(extra.id, p), "Texto Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                                        {extra.type === 'button' && renderModularButtonDesigner(extra, (p) => handleExtraChange(extra.id, p), "Botón Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                                        {(extra.type === 'image' || extra.type === 'video') && renderModularMultimediaDesigner(extra, (p) => handleExtraChange(extra.id, p), "Multimedia Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                                      </React.Fragment>
                                    ))}
                <div className="relative mt-8">
                  <button onClick={() => setShowAddMenu(!showAddMenu)} className="w-full py-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-blue-100 transition-all shadow-sm"><PlusIcon size={14} /> Agregar Otro Elemento</button>
                  <AnimatePresence>{showAddMenu && ( <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-0 w-full bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 z-50 mb-2 grid grid-cols-3 gap-2"> {[{id:'text', l:'Texto', i:Type}, {id:'button', l:'Botón', i:MousePointer2}, {id:'image', l:'Imagen', i:ImageIcon}].map(opt => ( <button key={opt.id} onClick={() => addExtraElement(opt.id as any)} className="flex flex-col items-center gap-2 p-3 hover:bg-blue-50 rounded-xl transition-all"><div className="p-2 bg-blue-500 text-white rounded-lg shadow-sm"><opt.i size={16}/></div><span className="text-[9px] font-black uppercase text-gray-600">{opt.l}</span></button> ))} </motion.div> )}</AnimatePresence>
                </div>
              </>
            )}

            {sectionKey === "footer" && (
              <>
                {/* FOOTER PREMIUM */}
                {element.type === "footer-premium" && (
                  <>
                    <ControlGroup title="1. Identidad de Marca" icon={ImageIcon} defaultOpen={true}>
                      <div className="space-y-4">
                        <div onClick={() => triggerUpload("footerLogoUrl")} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 relative">
                          {element.props.footerLogoUrl ? <div className="relative h-12 mx-auto"><img src={element.props.footerLogoUrl} className="h-full object-contain" alt="Logo" /><button onClick={(e) => { e.stopPropagation(); handleChange("footerLogoUrl", null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md border-2 border-white"><X size={10}/></button></div> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR LOGO</p>}
                        </div>

                        <div className="space-y-3 pt-2 border-t border-gray-50">
                          <input type="text" value={element.props.logoText || ""} onChange={(e) => handleChange("logoText", e.target.value)} className="w-full p-3 border rounded-xl text-xs font-bold uppercase italic bg-gray-50" placeholder="Nombre de Empresa..." />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.footerLogoColor || "#00f2ff"} onChange={(e) => handleChange("footerLogoColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Color</span></div>
                            <select value={element.props.footerLogoFont || "font-black"} onChange={(e) => handleChange("footerLogoFont", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white"><option value="font-black">Black</option><option value="font-sans">Modern</option><option value="font-serif">Classic</option></select>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Tema de Texto</span>
                            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                              {["solid", "outline", "3d", "brutalist", "aurora"].map(v => (<button key={v} onClick={() => handleChange("footerLogoVariant", v)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.footerLogoVariant === v || (!element.props.footerLogoVariant && v === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Efecto Visual</span>
                            <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-lg">
                              {[{id:"none", l:"Normal"}, {id:"glow", l:"Brillo"}, {id:"neon", l:"Neon"}, {id:"fire", l:"Fuego"}, {id:"glass", l:"Glass"}].map(eff => (
                                <button key={eff.id} onClick={() => handleChange("footerLogoEffect", eff.id)} className={cn("py-1.5 text-[6px] font-black uppercase rounded-md transition-all", (element.props.footerLogoEffect === eff.id || (!element.props.logoEffect && eff.id === "none")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{eff.l}</button>
                              ))}
                            </div>
                          </div>

                          {element.props.footerLogoVariant === "aurora" && (
                            <div className="grid grid-cols-2 gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                              <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.footerLogoAurora1 || "#00f2ff"} onChange={(e) => handleChange("footerLogoAurora1", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C1</span></div>
                              <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.footerLogoAurora2 || "#7000ff"} onChange={(e) => handleChange("footerLogoAurora2", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C2</span></div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 pt-2 border-t border-gray-50">
                          <FluidSlider label="Tamaño / Escala" value={element.props.footerLogoSize || 24} min={12} max={120} onChange={(val:number) => handleChange("footerLogoSize", val)} />
                          <div className="grid grid-cols-2 gap-3">
                            <FluidSlider label="Posición X" value={element.props.footerLogoPosX || 0} min={-200} max={200} onChange={(val:number) => handleChange("footerLogoPosX", val)} />
                            <FluidSlider label="Posición Y" value={element.props.footerLogoPosY || 0} min={-100} max={100} onChange={(val:number) => handleChange("footerLogoPosY", val)} />
                          </div>
                        </div>
                      </div>
                    </ControlGroup>

                    <ControlGroup title="2. Descripción" icon={Type} defaultOpen={false}>
                      <div className="space-y-4">
                        <textarea value={element.props.description || ""} onChange={(e) => handleChange("description", e.target.value)} className="w-full p-3 border rounded-xl text-[10px] font-medium bg-white uppercase italic" placeholder="Escribe la descripción..." rows={3} />
                        
                        <div className="space-y-3 pt-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.footerDescColor || "#ffffff"} onChange={(e) => handleChange("footerDescColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Color</span></div>
                            <select value={element.props.footerDescFont || "font-sans"} onChange={(e) => handleChange("footerDescFont", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white"><option value="font-sans">Modern</option><option value="font-black">Heavy</option><option value="font-serif">Classic</option></select>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Tema de Texto</span>
                            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                              {["solid", "outline", "3d", "brutalist", "aurora"].map(v => (<button key={v} onClick={() => handleChange("footerDescVariant", v)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.footerDescVariant === v || (!element.props.footerDescVariant && v === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Efecto Visual</span>
                            <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-lg">
                              {[{id:"none", l:"Normal"}, {id:"glow", l:"Brillo"}, {id:"neon", l:"Neon"}, {id:"fire", l:"Fuego"}, {id:"glass", l:"Glass"}].map(eff => (
                                <button key={eff.id} onClick={() => handleChange("footerDescEffect", eff.id)} className={cn("py-1.5 text-[6px] font-black uppercase rounded-md transition-all", (element.props.footerDescEffect === eff.id || (!element.props.logoEffect && eff.id === "none")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{eff.l}</button>
                              ))}
                            </div>
                          </div>

                          {element.props.footerDescVariant === "aurora" && (
                            <div className="grid grid-cols-2 gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                              <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.footerDescAurora1 || "#00f2ff"} onChange={(e) => handleChange("footerDescAurora1", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C1</span></div>
                              <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.footerDescAurora2 || "#7000ff"} onChange={(e) => handleChange("footerDescAurora2", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C2</span></div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 pt-2 border-t border-gray-100">
                          <FluidSlider label="Tamaño / Escala" value={element.props.footerDescSize || 12} min={10} max={100} onChange={(val:number) => handleChange("footerDescSize", val)} />
                          <div className="grid grid-cols-2 gap-3">
                            <FluidSlider label="Posición X" value={element.props.footerDescPosX || 0} min={-300} max={300} onChange={(val:number) => handleChange("footerDescPosX", val)} />
                            <FluidSlider label="Posición Y" value={element.props.footerDescPosY || 10} min={-200} max={200} onChange={(val:number) => handleChange("footerDescPosY", val)} />
                          </div>
                        </div>
                      </div>
                    </ControlGroup>

                    <ControlGroup title="3. Pie de Página" icon={Settings2} defaultOpen={false}>
                      <div className="space-y-4">
                        <input type="text" value={element.props.copyright || ""} onChange={(e) => handleChange("copyright", e.target.value)} className="w-full p-3 border rounded-xl text-[10px] font-bold bg-white" placeholder="© 2026 Empresa..." />
                        
                        <div className="space-y-3 pt-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.footerCopyColor || "#ffffff"} onChange={(e) => handleChange("footerCopyColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Color</span></div>
                            <select value={element.props.footerCopyFont || "font-sans"} onChange={(e) => handleChange("footerCopyFont", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white"><option value="font-sans">Modern</option><option value="font-black">Heavy</option><option value="font-serif">Classic</option></select>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Tema de Texto</span>
                            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                              {["solid", "outline", "3d", "brutalist", "aurora"].map(v => (<button key={v} onClick={() => handleChange("footerCopyVariant", v)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.footerCopyVariant === v || (!element.props.footerCopyVariant && v === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Efecto Visual</span>
                            <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-lg">
                              {[{id:"none", l:"Normal"}, {id:"glow", l:"Brillo"}, {id:"neon", l:"Neon"}, {id:"fire", l:"Fuego"}, {id:"glass", l:"Glass"}].map(eff => (
                                <button key={eff.id} onClick={() => handleChange("footerCopyEffect", eff.id)} className={cn("py-1.5 text-[6px] font-black uppercase rounded-md transition-all", (element.props.footerCopyEffect === eff.id || (!element.props.logoEffect && eff.id === "none")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{eff.l}</button>
                              ))}
                            </div>
                          </div>

                          {element.props.footerCopyVariant === "aurora" && (
                            <div className="grid grid-cols-2 gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                              <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.footerCopyAurora1 || "#00f2ff"} onChange={(e) => handleChange("footerCopyAurora1", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C1</span></div>
                              <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.footerCopyAurora2 || "#7000ff"} onChange={(e) => handleChange("footerCopyAurora2", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C2</span></div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 pt-2 border-t border-gray-100">
                          <FluidSlider label="Tamaño / Escala" value={element.props.footerCopySize || 10} min={8} max={40} onChange={(val:number) => handleChange("footerCopySize", val)} />
                          <div className="grid grid-cols-2 gap-3">
                            <FluidSlider label="Posición X" value={element.props.footerCopyPosX || 0} min={-300} max={300} onChange={(val:number) => handleChange("footerCopyPosX", val)} />
                            <FluidSlider label="Posición Y" value={element.props.footerCopyPosY || 0} min={-100} max={100} onChange={(val:number) => handleChange("footerCopyPosY", val)} />
                          </div>
                        </div>
                      </div>
                    </ControlGroup>

                    <ControlGroup title="4. Secciones Informativas" icon={Layout} defaultOpen={false}>
                      <div className="space-y-6">
                        {(element.props.menuGroups || []).map((group: any, gIdx: number) => (
                          <div key={gIdx} className={cn("p-4 border rounded-[2rem] transition-all duration-300 space-y-4", group.show === false ? "bg-gray-100/50 opacity-60 grayscale" : "bg-gray-50/50 border-blue-100 shadow-sm")}>
                            <div className="flex justify-between items-center gap-4">
                              <input 
                                type="text" 
                                value={group.title} 
                                onChange={(e) => {
                                  const newGroups = [...element.props.menuGroups];
                                  newGroups[gIdx].title = e.target.value;
                                  handleChange("menuGroups", newGroups);
                                }}
                                className={cn(
                                  "text-[10px] font-black uppercase tracking-widest bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-100 rounded-md px-1 flex-1", 
                                  group.show === false ? "text-gray-400" : "text-blue-600"
                                )} 
                              />
                              <div className="flex items-center gap-1">
                                <div className="p-1.5 text-gray-300">
                                  <Edit3 size={12}/>
                                </div>
                                <button 
                                  onClick={() => {
                                    const newGroups = [...element.props.menuGroups];
                                    newGroups[gIdx].show = group.show === false ? true : false;
                                    handleChange("menuGroups", newGroups);
                                  }}
                                  className={cn("p-1.5 rounded-lg transition-all", group.show === false ? "bg-amber-100 text-amber-600" : "hover:bg-white text-gray-400 hover:text-blue-500")}
                                >
                                  {group.show === false ? <EyeOff size={12}/> : <Eye size={12}/>}
                                </button>
                              </div>
                            </div>
                            
                            {group.show !== false && (
                              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                {group.links.map((link: any, lIdx: number) => (
                                  <div key={lIdx} className="grid grid-cols-[1.2fr_0.8fr_28px] gap-1.5 items-center">
                                    <input 
                                      type="text" 
                                      value={link.label} 
                                      onChange={(e) => {
                                        const newGroups = [...element.props.menuGroups];
                                        newGroups[gIdx].links[lIdx].label = e.target.value;
                                        handleChange("menuGroups", newGroups);
                                      }} 
                                      className="w-full p-1.5 border rounded-lg text-[9px] font-bold bg-white" 
                                      placeholder="Nombre"
                                    />
                                    <input 
                                      type="text" 
                                      value={link.url} 
                                      onChange={(e) => {
                                        const newGroups = [...element.props.menuGroups];
                                        newGroups[gIdx].links[lIdx].url = e.target.value;
                                        handleChange("menuGroups", newGroups);
                                      }} 
                                      className="w-full p-1.5 border rounded-lg text-[8px] font-mono text-blue-600 bg-white" 
                                      placeholder="/"
                                    />
                                    <button onClick={() => {
                                      const newGroups = [...element.props.menuGroups];
                                      newGroups[gIdx].links = newGroups[gIdx].links.filter((_:any, i:number) => i !== lIdx);
                                      handleChange("menuGroups", newGroups);
                                    }} className="h-7 w-7 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-md transition-all"><Trash2 size={12}/></button>
                                  </div>
                                ))}
                                <button onClick={() => {
                                  const newGroups = [...element.props.menuGroups];
                                  newGroups[gIdx].links.push({ label: "NUEVO", url: "/" });
                                  handleChange("menuGroups", newGroups);
                                }} className="w-full py-1.5 border-2 border-dashed rounded-lg text-[8px] font-black text-gray-400 uppercase hover:border-blue-200 hover:text-blue-500 transition-all">+ Link</button>

                                {/* --- SUB-MENÚS DE ESTILO POR SECCIÓN --- */}
                                <div className="pt-2 border-t border-gray-100 space-y-3">
                                  {/* Estilo de Título de Grupo */}
                                  <div className="p-2 bg-white rounded-xl space-y-2 border border-gray-50">
                                    <span className="text-[7px] font-black text-gray-400 uppercase">Estilo de Título ({group.title})</span>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex items-center gap-1.5 p-1 border rounded-md"><input type="color" value={group.titleColor || "#00f2ff"} onChange={(e) => { const ng = [...element.props.menuGroups]; ng[gIdx].titleColor = e.target.value; handleChange("menuGroups", ng); }} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[7px] text-gray-400 font-bold uppercase">Color</span></div>
                                      <select value={group.titleFont || "font-black"} onChange={(e) => { const ng = [...element.props.menuGroups]; ng[gIdx].titleFont = e.target.value; handleChange("menuGroups", ng); }} className="w-full p-1 border rounded-md text-[8px] font-bold bg-gray-50"><option value="font-black">Heavy</option><option value="font-sans">Sans</option></select>
                                    </div>
                                    <FluidSlider label="Tamaño Título" value={group.titleSize || 10} min={8} max={20} onChange={(v:number) => { const ng = [...element.props.menuGroups]; ng[gIdx].titleSize = v; handleChange("menuGroups", ng); }} />
                                  </div>

                                  {/* Estilo de Enlaces en Masa */}
                                  <div className="p-2 bg-white rounded-xl space-y-2 border border-gray-50">
                                    <span className="text-[7px] font-black text-gray-400 uppercase">Estilo de Enlaces (Todos)</span>
                                    <div className="flex items-center gap-2 p-1 border rounded-md w-full mb-2"><input type="color" value={group.linksColor || "#ffffff"} onChange={(e) => { const ng = [...element.props.menuGroups]; ng[gIdx].linksColor = e.target.value; handleChange("menuGroups", ng); }} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[7px] text-gray-400 font-bold uppercase">Color Global</span></div>
                                    <div className="grid grid-cols-1 gap-2">
                                      <FluidSlider label="Tamaño Texto" value={group.linksSize || 14} min={8} max={24} onChange={(v:number) => { const ng = [...element.props.menuGroups]; ng[gIdx].linksSize = v; handleChange("menuGroups", ng); }} />
                                      <FluidSlider label="Separación (Gap)" value={group.linksGap || 16} min={0} max={40} onChange={(v:number) => { const ng = [...element.props.menuGroups]; ng[gIdx].linksGap = v; handleChange("menuGroups", ng); }} />
                                      <FluidSlider label="Opacidad" value={group.linksOpacity || 40} min={0} max={100} suffix="%" onChange={(v:number) => { const ng = [...element.props.menuGroups]; ng[gIdx].linksOpacity = v; handleChange("menuGroups", ng); }} />
                                    </div>
                                  </div>

                                  {/* Posición de la Sección */}
                                  <div className="p-2 bg-blue-50/30 rounded-xl border border-blue-50 space-y-2">
                                    <FluidSlider label="Posición X" value={group.posX || 0} min={-150} max={150} onChange={(v:number) => { const ng = [...element.props.menuGroups]; ng[gIdx].posX = v; handleChange("menuGroups", ng); }} />
                                    <FluidSlider label="Posición Y" value={group.posY || 0} min={-100} max={100} onChange={(v:number) => { const ng = [...element.props.menuGroups]; ng[gIdx].posY = v; handleChange("menuGroups", ng); }} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ControlGroup>

                    <ControlGroup title="5. Redes Sociales" icon={Globe} defaultOpen={false}>
                      <div className="space-y-4">
                        <button onClick={() => handleChange("showSocial", !element.props.showSocial)} className={cn("w-full py-3 border rounded-xl text-[10px] font-black uppercase transition-all", element.props.showSocial ? "bg-gray-900 text-white shadow-lg shadow-gray-200" : "bg-white text-gray-400 border-gray-100")}>
                          Iconos Sociales: {element.props.showSocial ? "VISIBLES" : "OCULTO"}
                        </button>
                        
                        {element.props.showSocial && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="grid grid-cols-2 gap-3">
                              {(element.props.socialLinks || []).map((s: any, idx: number) => (
                                <div key={s.id} className="p-3 border rounded-2xl bg-white flex flex-col items-center gap-2 shadow-sm relative group">
                                  <button onClick={() => handleChange("socialLinks", element.props.socialLinks.filter((_:any, i:number) => i !== idx))} className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                                  
                                  <div onClick={() => triggerUpload("iconUrl", s.id)} className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-blue-50 transition-colors border border-dashed border-gray-200 overflow-hidden">
                                    {s.iconUrl ? <img src={s.iconUrl} className="h-full w-full object-cover" alt="" /> : (
                                      s.platform === 'facebook' ? <Globe size={18}/> : 
                                      s.platform === 'instagram' ? <ImageIcon size={18}/> : 
                                      s.platform === 'whatsapp' ? <MessageSquare size={18}/> : 
                                      s.platform === 'tiktok' ? <Play size={18}/> : <PlusIcon size={18}/>
                                    )}
                                  </div>

                                  <input 
                                    type="text" 
                                    value={s.label} 
                                    onChange={(e) => {
                                      const newList = [...element.props.socialLinks];
                                      newList[idx].label = e.target.value;
                                      handleChange("socialLinks", newList);
                                    }}
                                    className="w-full text-center text-[8px] font-black uppercase text-gray-900 bg-transparent border-none outline-none" 
                                    placeholder="Nombre"
                                  />
                                  
                                  <input 
                                    type="text" 
                                    value={s.url} 
                                    onChange={(e) => {
                                      const newList = [...element.props.socialLinks];
                                      newList[idx].url = e.target.value;
                                      handleChange("socialLinks", newList);
                                    }}
                                    className="w-full p-1.5 border rounded-md text-[7px] font-mono text-blue-600 bg-gray-50/50 outline-none focus:bg-white transition-all" 
                                    placeholder="URL..." 
                                  />
                                </div>
                              ))}
                            </div>
                            
                            <button 
                              onClick={() => {
                                const newId = uuidv4();
                                handleChange("socialLinks", [...(element.props.socialLinks || []), { id: newId, label: 'NUEVA', url: '#', iconType: 'custom' }]);
                              }}
                              className="w-full py-3 border-2 border-dashed rounded-xl text-[9px] font-black text-gray-400 uppercase hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                            >
                              <PlusIcon size={14}/> Añadir Red Social
                            </button>

                            <div className="space-y-4 pt-4 border-t border-gray-100 mt-4">
                              <div className="space-y-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase">Disposición</span>
                                <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg">
                                  {[{id:"row", l:"Fila (Horizontal)"}, {id:"column", l:"Bloque (2 Columnas)"}].map(m => (
                                    <button key={m.id} onClick={() => handleChange("socialLayout", m.id)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.socialLayout === m.id || (!element.props.socialLayout && m.id === "row")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{m.l}</button>
                                  ))}
                                </div>
                              </div>

                              <FluidSlider label="Tamaño Iconos" value={element.props.socialSize || 40} min={20} max={100} onChange={(v:number) => handleChange("socialSize", v)} />
                              <FluidSlider label="Separación (Gap)" value={element.props.socialGap || 16} min={0} max={60} onChange={(v:number) => handleChange("socialGap", v)} />
                              
                              <div className="grid grid-cols-2 gap-3">
                                <FluidSlider label="Posición X" value={element.props.socialPosX || 0} min={-1000} max={1000} onChange={(v:number) => handleChange("socialPosX", v)} />
                                <FluidSlider label="Posición Y" value={element.props.socialPosY || 0} min={-1000} max={1000} onChange={(v:number) => handleChange("socialPosY", v)} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ControlGroup>

                    <ControlGroup title="6. Newsletter" icon={Zap} defaultOpen={false}>
                      <div className="space-y-4">
                        <button onClick={() => handleChange("showNewsletter", !element.props.showNewsletter)} className={cn("w-full py-3 border rounded-xl text-[10px] font-black uppercase transition-all", element.props.showNewsletter ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white text-gray-400 border-gray-100")}>
                          Módulo Newsletter: {element.props.showNewsletter ? "VISIBLE" : "OCULTO"}
                        </button>

                        {element.props.showNewsletter && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4">
                              <div className="space-y-2">
                                <span className="text-[7px] font-black text-gray-400 uppercase">Título Principal</span>
                                <input type="text" value={element.props.newsletterTitle || ""} onChange={(e) => handleChange("newsletterTitle", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white" />
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-2 p-1 border rounded-lg bg-white"><input type="color" value={element.props.newsletterTitleColor || "#00f2ff"} onChange={(e) => handleChange("newsletterTitleColor", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[8px] text-gray-400 font-bold uppercase">Color</span></div>
                                  <FluidSlider label="Tamaño" value={element.props.newsletterTitleSize || 10} min={8} max={40} onChange={(val:number) => handleChange("newsletterTitleSize", val)} />
                                </div>
                              </div>
                              <div className="space-y-2 pt-2 border-t border-gray-100">
                                <span className="text-[7px] font-black text-gray-400 uppercase">Ayuda (Placeholder)</span>
                                <input type="text" value={element.props.newsletterPlaceholder || ""} onChange={(e) => handleChange("newsletterPlaceholder", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white" />
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-2 p-1 border rounded-lg bg-white"><input type="color" value={element.props.newsletterPlaceholderColor || "#9ca3af"} onChange={(e) => handleChange("newsletterPlaceholderColor", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[8px] text-gray-400 font-bold uppercase">Color</span></div>
                                  <FluidSlider label="Tamaño" value={element.props.newsletterPlaceholderSize || 12} min={8} max={24} onChange={(val:number) => handleChange("newsletterPlaceholderSize", val)} />
                                </div>
                              </div>
                              <div className="space-y-2 pt-2 border-t border-gray-100">
                                <span className="text-[7px] font-black text-gray-400 uppercase">Subtexto Final</span>
                                <input type="text" value={element.props.newsletterSubtext || ""} onChange={(e) => handleChange("newsletterSubtext", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white" />
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-2 p-1 border rounded-lg bg-white"><input type="color" value={element.props.newsletterSubColor || "#ffffff"} onChange={(e) => handleChange("newsletterSubColor", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[8px] text-gray-400 font-bold uppercase">Color</span></div>
                                  <FluidSlider label="Tamaño" value={element.props.newsletterSubSize || 9} min={7} max={20} onChange={(val:number) => handleChange("newsletterSubSize", val)} />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100">
                              <span className="text-[8px] font-black text-gray-400 uppercase">Dimensiones y Posición</span>
                              <FluidSlider label="Ancho Módulo (%)" value={element.props.newsletterContainerWidth || 100} min={30} max={300} onChange={(v:number) => handleChange("newsletterContainerWidth", v)} suffix="%" />
                              <div className="grid grid-cols-2 gap-3">
                                <FluidSlider label="Ancho Barra (%)" value={element.props.newsletterInputWidth || 100} min={50} max={100} onChange={(v:number) => handleChange("newsletterInputWidth", v)} suffix="%" />
                                <FluidSlider label="Altura Barra (px)" value={element.props.newsletterInputHeight || 50} min={30} max={120} onChange={(v:number) => handleChange("newsletterInputHeight", v)} suffix="px" />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <FluidSlider label="Posición X" value={element.props.newsletterPosX || 0} min={-300} max={300} onChange={(v:number) => handleChange("newsletterPosX", v)} />
                                <FluidSlider label="Posición Y" value={element.props.newsletterPosY || 0} min={-100} max={100} onChange={(v:number) => handleChange("newsletterPosY", v)} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ControlGroup>

                    {/* ELEMENTOS MODULARES EXTRA EN FOOTER */}
                    <div className="space-y-4 pt-4 border-t border-gray-100 mt-8">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block">Elementos Personalizados</span>
                      {(element.props.extraElements || []).map((extra: any) => (
                        <React.Fragment key={extra.id}>
                          {extra.type === 'text' && renderModularTextDesigner(extra, (p) => handleExtraChange(extra.id, p), "Texto Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                          {extra.type === 'button' && renderModularButtonDesigner(extra, (p) => handleExtraChange(extra.id, p), "Botón Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                          {(extra.type === 'image' || extra.type === 'video') && renderModularMultimediaDesigner(extra, (p) => handleExtraChange(extra.id, p), "Multimedia Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                        </React.Fragment>
                      ))}

                      <div className="relative">
                        <button onClick={() => setShowAddMenu(!showAddMenu)} className="w-full py-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-blue-100 transition-all shadow-sm">
                          <PlusIcon size={14} /> Agregar Otro Elemento
                        </button>
                        <AnimatePresence>
                          {showAddMenu && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-0 w-full bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 z-50 mb-2 grid grid-cols-3 gap-2">
                              {[{id:'text', l:'Texto', i:Type}, {id:'button', l:'Botón', i:MousePointer2}, {id:'image', l:'Imagen', i:ImageIcon}].map(opt => (
                                <button key={opt.id} onClick={() => { addExtraElement(opt.id as any); setShowAddMenu(false); }} className="flex flex-col items-center gap-2 p-3 hover:bg-blue-50 rounded-xl transition-all">
                                  <div className="p-2 bg-blue-500 text-white rounded-lg shadow-sm"><opt.i size={16}/></div>
                                  <span className="text-[9px] font-black uppercase text-gray-600">{opt.l}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* --- PESTAÑAS DISEÑO Y EFECTOS --- */}
        {activeTab === "style" && (
          <div className="space-y-4">
            {sectionKey === "header" && (
              <>
                <ControlGroup title="Apariencia de Sección" icon={Palette} defaultOpen={true}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white h-[38px]"><input type="color" value={element.props.bgColor || "#ffffff"} onChange={(e) => handleChange("bgColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Fondo de Sección</span></div>
                    {element.type === "announcement-bar" && (
                      <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white h-[38px]"><input type="color" value={element.props.textColor || "#ffffff"} onChange={(e) => handleChange("textColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Color del Texto</span></div>
                    )}
                    {element.type === "navbar" && (
                      <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white h-[38px]"><input type="color" value={element.props.menuColor || "#4b5563"} onChange={(e) => handleChange("menuColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Color de Menú</span></div>
                    )}
                  </div>
                </ControlGroup>
                
                <ControlGroup title="Estructura y Tamaño" icon={Move}>
                  <div className="space-y-6">
                    <FluidSlider label="Altura" value={element.props.height || (element.type === 'navbar' ? element.props.navHeight : 40) || 40} min={20} max={200} onChange={(v:number) => handleChange(element.type === 'navbar' ? 'navHeight' : 'height', v)} />
                    {element.type === "announcement-bar" && (
                      <FluidSlider label="Tamaño Letra" value={element.props.fontSize || 11} min={8} max={20} onChange={(v:number) => handleChange("fontSize", v)} />
                    )}
                  </div>
                </ControlGroup>
              </>
            )}

            {sectionKey === "footer" && (
              <>
                <ControlGroup title="Colores de Marca" icon={Palette} defaultOpen={true}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white h-[38px]"><input type="color" value={element.props.bgColor || "#111827"} onChange={(e) => handleChange("bgColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Fondo Footer</span></div>
                    <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white h-[38px]"><input type="color" value={element.props.textColor || "#ffffff"} onChange={(e) => handleChange("textColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Color de Texto</span></div>
                    <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white h-[38px]"><input type="color" value={element.props.accentColor || "#00f2ff"} onChange={(e) => handleChange("accentColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Color de Énfasis</span></div>
                  </div>
                </ControlGroup>
              </>
            )}

            {sectionKey === "body" && (
              <ControlGroup title="Multimedia de Fondo" icon={ImageIcon} defaultOpen={true}>
                <div className="space-y-4">
                  <div className="flex bg-gray-100 p-1 rounded-lg">{[{id:"image", l:"Imagen"}, {id:"video", l:"Video"}].map(t => (<button key={t.id} onClick={() => handleChange("bgType", t.id)} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase rounded-md transition-all", (element.props.bgType === t.id || (!element.props.bgType && t.id === "image")) ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}>{t.l}</button>))}</div>
                  <div onClick={() => triggerUpload(element.props.bgType === "video" ? "bgBackground" : "bgBackground")} className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 cursor-pointer relative transition-all">
                    {element.props.imageUrl || element.props.videoUrl ? (
                      <div className="relative">
                        {element.props.bgType === "video" ? <div className="h-20 w-20 mx-auto bg-black rounded-lg flex items-center justify-center"><Play size={20} className="text-white opacity-50"/></div> : <img src={element.props.imageUrl} className="h-20 mx-auto rounded-lg shadow-sm" />}
                        <button onClick={(e) => { e.stopPropagation(); handleChange(element.props.bgType === "video" ? "videoUrl" : "imageUrl", null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-xl border-2 border-white hover:scale-110 transition-all z-50"><X size={12}/></button>
                      </div>
                    ) : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR {element.props.bgType === "video" ? "VIDEO" : "FONDO"}</p>}
                  </div>

                  {element.type === "video" && element.props.bgType === "video" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                      <span className="text-[9px] font-black text-gray-400 uppercase">O pega URL (YouTube/Vimeo)</span>
                      <input 
                        type="text" 
                        value={element.props.videoExternalUrl || ""} 
                        onChange={(e) => handleChange("videoExternalUrl", e.target.value)}
                        className="w-full p-2 border rounded-lg text-[9px] font-mono text-blue-600 bg-gray-50"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">{[{id:"none", l:"Normal"}, {id:"ken-burns", l:"Ken Burns"}, {id:"zoom-out", l:"Zoom Out"}, {id:"float", l:"Flotación"}].map(e => (<button key={e.id} onClick={() => handleChange("bgEffect", e.id)} className={cn("py-2 text-[8px] font-black uppercase rounded-lg border", element.props.bgEffect === e.id ? "bg-blue-600 text-white" : "bg-white")}>{e.l}</button>))}</div>
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-50"><input type="color" value={element.props.overlayColor || "#000000"} onChange={(e) => handleChange("overlayColor", e.target.value)} className="w-10 h-10 rounded-xl p-0 border cursor-pointer" /><div className="flex-1"><FluidSlider label="Difuminado" value={element.props.overlayOpacity || 40} min={0} max={95} suffix="%" onChange={(v:number) => handleChange("overlayOpacity", v)} /></div></div>
                </div>
              </ControlGroup>
            )}

            {element.type === "product-grid" && (
              <ControlGroup title="Configuración de Inventario" icon={ShoppingBag} defaultOpen={true}>
                <div className="space-y-4">
                   <div className="space-y-2">
                     <span className="text-[9px] font-black text-gray-400 uppercase">Filtrar por Categoría</span>
                     <select 
                       value={element.props.selectedCategory || "all"} 
                       onChange={(e) => handleChange("selectedCategory", e.target.value)}
                       className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white outline-none"
                     >
                        <option value="all">Todas las Categorías</option>
                        {realCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.title}</option>
                        ))}
                     </select>
                   </div>
                   <div className="space-y-2 pt-2 border-t border-gray-50">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Etiqueta de Oferta</span>
                        <button 
                          onClick={() => handleChange("showOfferBadge", !element.props.showOfferBadge)}
                          className={cn("px-2 py-1 rounded-md text-[8px] font-black transition-all", element.props.showOfferBadge ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400")}
                        >
                           {element.props.showOfferBadge ? "ACTIVA" : "INACTIVA"}
                        </button>
                     </div>
                     {element.props.showOfferBadge && (
                       <input 
                         type="text" 
                         value={element.props.offerBadgeText || ""} 
                         onChange={(e) => handleChange("offerBadgeText", e.target.value)} 
                         className="w-full p-2 border rounded-lg text-[10px] font-bold bg-gray-50 uppercase italic" 
                         placeholder="Ej: -50% OFF" 
                       />
                     )}
                   </div>
                </div>
              </ControlGroup>
            )}

            {element.type === "product-grid" && (
              <ControlGroup title="Personalización de Tarjetas" icon={Layout} defaultOpen={true}>
                <div className="space-y-4">
                   <div className="space-y-2">
                     <span className="text-[9px] font-black text-gray-400 uppercase">Estilo Visual</span>
                     <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                       {[{id:"premium", l:"Premium"}, {id:"minimal", l:"Minimal"}, {id:"glass", l:"Glass"}].map(s => (
                         <button key={s.id} onClick={() => handleChange("cardStyle", s.id)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", element.props.cardStyle === s.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{s.l}</button>
                       ))}
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => handleChange("showPrice", !element.props.showPrice)} className={cn("flex items-center justify-center gap-2 py-2 border rounded-xl text-[9px] font-black uppercase transition-all", element.props.showPrice ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-400 border-gray-100")}>
                        Precio {element.props.showPrice ? "ON" : "OFF"}
                     </button>
                     <button onClick={() => handleChange("showDescription", !element.props.showDescription)} className={cn("flex items-center justify-center gap-2 py-2 border rounded-xl text-[9px] font-black uppercase transition-all", element.props.showDescription ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-400 border-gray-100")}>
                        Desc. {element.props.showDescription ? "ON" : "OFF"}
                     </button>
                   </div>

                   {/* Estilos dinámicos para Precio */}
                   {element.props.showPrice && (
                     <div className="p-3 bg-gray-50 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                        <span className="text-[8px] font-black text-gray-400 uppercase">Estilo de Precio</span>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={element.props.priceFont || "font-black"} onChange={(e) => handleChange("priceFont", e.target.value)} className="w-full p-1.5 border rounded-lg text-[9px] font-bold bg-white">
                            <option value="font-sans">Sans</option>
                            <option value="font-serif">Serif</option>
                            <option value="font-mono">Mono</option>
                            <option value="font-black">Heavy</option>
                          </select>
                          <div className="flex items-center gap-2 p-1 border rounded-lg bg-white"><input type="color" value={element.props.priceColor || "#2563eb"} onChange={(e) => handleChange("priceColor", e.target.value)} className="w-5 h-5 rounded-md p-0 cursor-pointer" /><span className="text-[8px] text-gray-400 font-bold uppercase">Color</span></div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[7px] font-black text-gray-400 uppercase">Temas de Precio</span>
                          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                            {["solid", "outline", "3d", "brutalist", "aurora"].map(v => (<button key={v} onClick={() => handleChange("priceVariant", v)} className={cn("py-1 text-[7px] font-black uppercase rounded-md transition-all", (element.props.priceVariant === v || (!element.props.priceVariant && v === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
                          </div>
                        </div>
                        {element.props.priceVariant === "aurora" && (
                          <div className="grid grid-cols-2 gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.priceAurora1 || "#00f2ff"} onChange={(e) => handleChange("priceAurora1", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C1</span></div>
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.priceAurora2 || "#7000ff"} onChange={(e) => handleChange("priceAurora2", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C2</span></div>
                          </div>
                        )}
                        <FluidSlider label="Tamaño Precio" value={element.props.priceSize || 14} min={8} max={32} onChange={(v:number) => handleChange("priceSize", v)} />
                     </div>
                   )}

                   {/* Estilos dinámicos para Descripción */}
                   {element.props.showDescription && (
                     <div className="p-3 bg-gray-50 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                        <span className="text-[8px] font-black text-gray-400 uppercase">Estilo de Descripción</span>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={element.props.descriptionFont || "font-sans"} onChange={(e) => handleChange("descriptionFont", e.target.value)} className="w-full p-1.5 border rounded-lg text-[9px] font-bold bg-white">
                            <option value="font-sans">Sans</option>
                            <option value="font-serif">Serif</option>
                            <option value="font-mono">Mono</option>
                            <option value="font-black">Heavy</option>
                          </select>
                          <div className="flex items-center gap-2 p-1 border rounded-lg bg-white"><input type="color" value={element.props.descriptionColor || "#9ca3af"} onChange={(e) => handleChange("descriptionColor", e.target.value)} className="w-5 h-5 rounded-md p-0 cursor-pointer" /><span className="text-[8px] text-gray-400 font-bold uppercase">Color</span></div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[7px] font-black text-gray-400 uppercase">Temas de Descripción</span>
                          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                            {["solid", "outline", "3d", "brutalist", "aurora"].map(v => (<button key={v} onClick={() => handleChange("descriptionVariant", v)} className={cn("py-1 text-[7px] font-black uppercase rounded-md transition-all", (element.props.descriptionVariant === v || (!element.props.descriptionVariant && v === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
                          </div>
                        </div>
                        {element.props.descriptionVariant === "aurora" && (
                          <div className="grid grid-cols-2 gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.descriptionAurora1 || "#00f2ff"} onChange={(e) => handleChange("descriptionAurora1", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C1</span></div>
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-blue-100"><input type="color" value={element.props.descriptionAurora2 || "#7000ff"} onChange={(e) => handleChange("descriptionAurora2", e.target.value)} className="w-4 h-4 rounded-sm p-0 cursor-pointer" /><span className="text-[6px] font-black text-gray-400">C2</span></div>
                          </div>
                        )}
                        <FluidSlider label="Tamaño Desc." value={element.props.descriptionSize || 9} min={7} max={20} onChange={(v:number) => handleChange("descriptionSize", v)} />
                     </div>
                   )}

                   <FluidSlider label="Bordes de Tarjeta" value={element.props.cardBorderRadius || 20} min={0} max={60} onChange={(v:number) => handleChange("cardBorderRadius", v)} />
                   <FluidSlider label="Altura de Tarjeta" value={element.props.cardHeight || 450} min={300} max={800} onChange={(v:number) => handleChange("cardHeight", v)} />
                   
                   <div className="space-y-2">
                     <span className="text-[9px] font-black text-gray-400 uppercase">Proporción de Imagen</span>
                     <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg">
                       {[{id:"square", l:"1:1 Cuadrado"}, {id:"portrait", l:"4:5 Vertical"}].map(a => (
                         <button key={a.id} onClick={() => handleChange("imageAspectRatio", a.id)} className={cn("py-1.5 text-[8px] font-black uppercase rounded-md transition-all", element.props.imageAspectRatio === a.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{a.l}</button>
                       ))}
                     </div>
                   </div>
                   <FluidSlider label="Separación (Gap)" value={element.props.gridGap || 24} min={0} max={60} onChange={(v:number) => handleChange("gridGap", v)} />
                </div>
              </ControlGroup>
            )}

            {element.type === "product-grid" && (
              <ControlGroup title="Botón de Acción" icon={MousePointer2} defaultOpen={false}>
                <div className="space-y-4">
                  <button 
                    onClick={() => handleChange("showAddToCart", !element.props.showAddToCart)}
                    className={cn("w-full flex items-center justify-center gap-2 py-3 border rounded-xl text-[10px] font-black uppercase transition-all", element.props.showAddToCart ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-100" : "bg-white text-gray-400 border-gray-100")}
                  >
                    Botón de Compra: {element.props.showAddToCart ? "ON" : "OFF"}
                  </button>

                  {element.props.showAddToCart && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      {renderModularButtonDesigner({ 
                        text: element.props.addToCartText, 
                        variant: element.props.addToCartVariant, 
                        bgColor: element.props.addToCartBgColor, 
                        textColor: element.props.addToCartTextColor,
                        borderRadius: element.props.addToCartBorderRadius,
                        size: element.props.addToCartSize,
                        posX: element.props.addToCartPosX,
                        posY: element.props.addToCartPosY,
                        intensity: element.props.addToCartIntensity
                      }, (p) => {
                        const key = Object.keys(p)[0];
                        const mapping: any = { 
                          text: 'addToCartText', 
                          variant: 'addToCartVariant', 
                          bgColor: 'addToCartBgColor', 
                          textColor: 'addToCartTextColor',
                          borderRadius: 'addToCartBorderRadius',
                          size: 'addToCartSize',
                          posX: 'addToCartPosX',
                          posY: 'addToCartPosY',
                          intensity: 'addToCartIntensity'
                        };
                        handleChange(mapping[key], p[key]);
                      }, "Estilo del Botón", false, undefined, false)}
                    </div>
                  )}
                </div>
              </ControlGroup>
            )}

            {element.type === "product-grid" && (
              <ControlGroup title="Configuración de Grilla" icon={Layout} defaultOpen={true}>
                <div className="space-y-4">
                   <div className="space-y-2">
                     <span className="text-[9px] font-black text-gray-400 uppercase">Distribución de Elementos</span>
                     <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg">
                       {[{id:"grid", l:"Cuadrícula"}, {id:"carousel", l:"Carrusel"}].map(l => (
                         <button key={l.id} onClick={() => handleChange("layout", l.id)} className={cn("py-2 text-[8px] font-black uppercase rounded-lg transition-all", element.props.layout === l.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{l.l}</button>
                       ))}
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <FluidSlider label="Columnas (PC)" value={element.props.columns || 4} min={1} max={6} onChange={(v:number) => handleChange("columns", v)} />
                      <FluidSlider label="Productos" value={element.props.itemsCount || 4} min={1} max={20} onChange={(v:number) => handleChange("itemsCount", v)} />
                   </div>
                </div>
              </ControlGroup>
            )}

            {element.type === "product-grid" && element.props.layout === "carousel" && (
              <ControlGroup title="Navegación / Scroll" icon={Move} defaultOpen={true}>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase">Estado de la Barra</span>
                    <button 
                      onClick={() => handleChange("showScrollbar", !element.props.showScrollbar)} 
                      className={cn("w-full flex items-center justify-center gap-2 py-3 border rounded-xl text-[10px] font-black uppercase transition-all", element.props.showScrollbar ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-white text-gray-400 border-gray-100")}
                    >
                       {element.props.showScrollbar ? "Barra Visible" : "Barra Oculta"}
                    </button>
                  </div>
                  
                  {element.props.showScrollbar && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Diseño de Barra</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[{id:"default", l:"Estándar"}, {id:"glass", l:"Glass"}, {id:"neon", l:"Neón"}, {id:"minimal", l:"Minimal"}].map(style => (
                          <button key={style.id} onClick={() => handleChange("scrollbarStyle", style.id)} className={cn("py-2 text-[8px] font-black uppercase rounded-lg border transition-all", element.props.scrollbarStyle === style.id ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm" : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50")}>{style.l}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ControlGroup>
            )}

            <ControlGroup title="Estructura y Tamaño" icon={Move}>
              <div className="space-y-6">
                <div className="flex bg-gray-100 p-1 rounded-lg border">{["left", "center", "right"].map((pos) => (<button key={pos} onClick={() => handleChange("align", pos)} className={cn("flex-1 p-2 flex justify-center rounded-md transition-all", (element.props.align === pos || (!element.props.align && pos === "center")) ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600")}>{pos === "left" && <AlignLeft size={16} />}{pos === "center" && <AlignCenter size={16} />}{pos === "right" && <AlignRight size={16} />}</button>))}</div>
                <FluidSlider label="Altura" value={element.props.height || (element.type === 'navbar' ? element.props.navHeight : 400)} min={100} max={1000} onChange={(v:number) => handleChange(element.type === 'navbar' ? 'navHeight' : 'height', v)} />
              </div>
            </ControlGroup>
          </div>
        )}

        {activeTab === "animation" && (
          <>
            <ControlGroup title="Efectos de Revelado" icon={Sparkles}>
              <div className="space-y-2">{[{ id: "none", label: "Ninguna" }, { id: "fade", label: "Desvanecer" }, { id: "slide", label: "Deslizar" }, { id: "zoom", label: "Zoom" }].map(anim => (<button key={anim.id} onClick={() => handleChange("animation", anim.id)} className={cn("w-full p-3 border rounded-xl text-left flex justify-between", element.props.animation === anim.id ? "border-blue-500 bg-blue-50/50" : "border-gray-100")}><span>{anim.label}</span>{element.props.animation === anim.id && <Check size={14} className="text-blue-600" />}</button>))}</div>
            </ControlGroup>
            <ControlGroup title="Marketplace de Efectos" icon={ShoppingBag}>
              <div className="py-10 text-center space-y-3"><div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-2 rotate-3 border border-blue-100 shadow-sm"><Sparkles size={24} className="text-blue-500 animate-pulse" /></div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Próximamente</p></div>
            </ControlGroup>
          </>
        )}
      </div>
      <div className="p-4 border-t border-gray-100 bg-white shrink-0"><button onClick={() => selectElement(null)} className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95">Confirmar Cambios</button></div>
    </div>
  );
};
