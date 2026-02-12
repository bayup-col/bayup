"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStudio, ComponentType, SectionType } from "../context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Type, Palette, Move, Sliders, Image as ImageIcon, 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, 
  Settings2, Sparkles, Layout, ChevronDown, Check, Upload,
  ShoppingBag, MousePointer2, Play, Link as LinkIcon, Plus as PlusIcon, Trash2,
  Zap, Star, Flame, Wind, Wand2, MonitorPlay, Maximize, RotateCw
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
  const { selectedElementId, selectElement, pageData, updateElement, sidebarView } = useStudio();
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
      if (found) return { element: found, sectionKey: section };
    }
    return null;
  }, [pageData, selectedElementId]);

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
        // --- CORRECCIÓN QUIRÚRGICA PARA ELEMENTOS EXTRA ---
        const newList = (element.props.extraElements || []).map((item: any) => {
          if (item.id === uploadTarget.id) {
            // Actualizamos la URL y el tipo dinámicamente
            return { 
              ...item, 
              [keyToUpdate]: url, 
              url: url, // Aseguramos que 'url' siempre tenga el valor
              type: isVideo ? 'video' : 'image' 
            };
          }
          return item;
        });
        handleChange("extraElements", newList);
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
          <input type="text" value={url || ""} onChange={(e) => onUpdate({ url: e.target.value, floatUrl: e.target.value, videoUrl: e.target.value, imageUrl: e.target.value })} className="w-full p-2 border rounded-lg text-[10px] font-mono text-blue-600 bg-gray-50/30" placeholder="O pega URL..." />
          
          <div className="space-y-2">
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
            {sectionKey === "header" && element.type === "navbar" && (
              <>
                <ControlGroup title="Identidad Visual" icon={ImageIcon} defaultOpen={true}>
                  <div className="space-y-4">
                    <div onClick={() => triggerUpload("logoUrl")} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 relative">
                      {element.props.logoUrl ? <div className="relative h-12 mx-auto"><img src={element.props.logoUrl} className="h-full object-contain" /><button onClick={(e) => { e.stopPropagation(); handleChange("logoUrl", null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md border-2 border-white"><X size={10}/></button></div> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR LOGO</p>}
                    </div>
                    <input type="text" value={element.props.logoText || ""} onChange={(e) => handleChange("logoText", e.target.value)} className="w-full p-3 border rounded-xl text-xs font-bold bg-gray-50/30" placeholder="Nombre de Tienda..." />
                    <FluidSlider label="Escala Logo" value={element.props.logoSize || 24} min={12} max={120} onChange={(val:number) => handleChange("logoSize", val)} />
                  </div>
                </ControlGroup>
                <ControlGroup title="Menú de Navegación" icon={Layout}><div className="space-y-3">{(element.props.menuItems || []).map((item: any, idx: number) => (<div key={idx} className="flex gap-2"><input type="text" value={item.label} onChange={(e) => { const newItems = [...element.props.menuItems]; newItems[idx].label = e.target.value; handleChange("menuItems", newItems); }} className="flex-1 p-2 border rounded-lg text-[10px] font-bold" /><button onClick={() => handleChange("menuItems", element.props.menuItems.filter((_:any, i:number) => i !== idx))} className="text-red-400"><Trash2 size={14}/></button></div>))}<button onClick={() => handleChange("menuItems", [...(element.props.menuItems || []), { label: "NUEVO", url: "/" }])} className="w-full py-2 border-2 border-dashed rounded-lg text-[9px] font-black text-gray-400">+ AÑADIR LINK</button></div></ControlGroup>
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

                                    {(element.props.extraElements || []).map((extra: any) => (
                                      <React.Fragment key={extra.id}>
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
          </div>
        )}

        {/* --- PESTAÑAS DISEÑO Y EFECTOS --- */}
        {activeTab === "style" && (
          <div className="space-y-4">
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
