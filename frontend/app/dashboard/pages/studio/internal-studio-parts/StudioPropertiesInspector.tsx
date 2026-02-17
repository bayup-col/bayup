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
  User, ShoppingCart, Search, Edit3, Heart, Bell, MessageSquare, Phone, Info, Globe, Eye, EyeOff, Tag, Store, Share2, ShieldCheck
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
    <div onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="w-full">
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

const renderModularTextDesigner = (props: any, onUpdate: (p: any) => void, title: string, canRemove = false, onRemove?: () => void) => {
  const variant = props.variant || "solid";
  return (
    <ControlGroup title={title} icon={Type} onRemove={canRemove ? onRemove : null} defaultOpen={true}>
      <div className="space-y-4">
        {props.content !== undefined && (
          <textarea value={props.content ?? props.title ?? ""} onChange={(e) => onUpdate({ content: e.target.value, title: e.target.value })} className="w-full p-3 border rounded-xl text-sm font-black bg-gray-50/30 uppercase italic" />
        )}
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
            <option value="font-black">Heavy (Display)</option>
            <option value="font-serif">Classic (Serif)</option>
          </select>
          <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={props.color || "#ffffff"} onChange={(e) => onUpdate({ color: e.target.value })} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase">Color</span></div>
        </div>
        <FluidSlider label="Tamaño" value={props.size || 24} min={10} max={120} onChange={(val:number) => onUpdate({ size: val })} />
        <div className="grid grid-cols-2 gap-3">
          <FluidSlider label="Posición X" value={props.posX || 0} min={-500} max={500} onChange={(val:number) => onUpdate({ posX: val })} />
          <FluidSlider label="Posición Y" value={props.posY || 0} min={-500} max={500} onChange={(val:number) => onUpdate({ posY: val })} />
        </div>
        <FluidSlider label="Intensidad Visual" value={props.intensity || 100} min={0} max={200} onChange={(val:number) => onUpdate({ intensity: val })} />
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
          {showLink && <div><span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Vínculo</span><input type="text" value={props.url || ""} onChange={(e) => onUpdate({ url: e.target.value })} className="w-full p-2 border rounded-lg text-[10px] font-mono text-blue-600" placeholder="URL" /></div>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-1.5 border rounded-lg bg-white h-[38px]"><input type="color" value={props.bgColor || "#2563eb"} onChange={(e) => onUpdate({ bgColor: e.target.value })} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase">Fondo</span></div>
          <FluidSlider label="Tamaño" value={props.size || 14} min={10} max={40} onChange={(val:number) => onUpdate({ size: val })} />
        </div>
        <div className="space-y-2">
          <span className="text-[9px] font-black text-gray-400 uppercase">Tema de Botón</span>
          <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg">
            {["solid", "outline", "glass", "aurora", "neon"].map(v => (<button key={v} onClick={() => onUpdate({ variant: v })} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (variant === v) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FluidSlider label="Posición X" value={props.posX || 0} min={-500} max={500} onChange={(val:number) => onUpdate({ posX: val })} />
          <FluidSlider label="Posición Y" value={props.posY || 0} min={-200} max={200} onChange={(val:number) => onUpdate({ posY: val })} />
        </div>
      </div>
    </ControlGroup>
  );
};

const renderModularMultimediaDesigner = (props: any, onUpdate: (p: any) => void, title: string, onTriggerUpload: (key: string, id?: string | null) => void, canRemove = false, onRemove?: () => void, uploadKey = "url") => {
  const floatType = props.floatType || props.type || "image";
  const url = props.url || props.floatUrl || props.videoUrl || props.imageUrl;
  return (
    <ControlGroup title={title} icon={ImageIcon} onRemove={canRemove ? onRemove : null} defaultOpen={true}>
      <div className="space-y-4">
        <div onClick={() => onTriggerUpload(uploadKey, props.id)} className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 cursor-pointer relative">
          {url ? <div className="relative aspect-square w-20 mx-auto rounded-lg overflow-hidden border"><img src={url} className="w-full h-full object-cover" /><button onClick={(e) => { e.stopPropagation(); onUpdate({ url: null, floatUrl: null, videoUrl: null, imageUrl: null }); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-xl border-2 border-white transition-all z-50"><X size={14}/></button></div> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR MULTIMEDIA</p>}
        </div>
        <div className="grid grid-cols-2 gap-3"><FluidSlider label="Escala" value={props.size || props.floatSize || 150} min={50} max={400} onChange={(v:number) => onUpdate({ size: v, floatSize: v })} /><FluidSlider label="Puntas" value={props.radius || props.floatRadius || 12} min={0} max={100} onChange={(v:number) => onUpdate({ radius: v, floatRadius: v })} /></div>
        <div className="grid grid-cols-2 gap-3"><FluidSlider label="Posición X" value={props.posX ?? props.floatPosX ?? 0} min={-600} max={600} onChange={(v:number) => onUpdate({ posX: v, floatPosX: v })} /><FluidSlider label="Posición Y" value={props.posY ?? props.floatPosY ?? 0} min={-300} max={300} onChange={(v:number) => onUpdate({ posY: v, floatPosY: v })} /></div>
      </div>
    </ControlGroup>
  );
};

export const DesignerInspector = () => {
  const { selectedElementId, selectElement, pageData, updateElement, sidebarView, viewport, removeElement } = useStudio();
  const [activeTab, setActiveTab] = useState<TabType>("content");
  const [uploadTarget, setUploadTarget] = useState<{ id: string | null, key: string } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [realCategories, setRealCategories] = useState<{id: string, title: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { categoryService } = await import('@/lib/api');
        const token = localStorage.getItem('token');
        if (!token) return;
        const categories = await categoryService.getAll(token);
        setRealCategories(Array.isArray(categories) ? categories : []);
      } catch (err: any) {}
    };
    fetchCategories();
  }, []);

  const elementData = React.useMemo(() => {
    if (!selectedElementId) return null;
    const sections: SectionType[] = ["header", "body", "footer"];
    for (const section of sections) {
      const found = pageData[section].elements.find(el => el.id === selectedElementId);
      if (found) {
        const effectiveProps = { ...found.props, ...(found.props.responsiveOverrides?.[viewport] || {}) };
        return { element: { ...found, props: effectiveProps }, sectionKey: section };
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
    const newEl = { id: uuidv4(), type, props: { content: "Nuevo", size: 24, posX: 0, posY: 0 } };
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
      
      // Solo actualizar extraElements si el ID realmente existe en esa lista
      const isExtraElement = uploadTarget.id && (element.props.extraElements || []).some((item: any) => item.id === uploadTarget.id);
      
      if (isExtraElement) {
        const newList = (element.props.extraElements || []).map((item: any) => 
          item.id === uploadTarget.id ? { ...item, [keyToUpdate]: url, url: url, type: isVideo ? 'video' : 'image' } : item
        );
        handleChange("extraElements", newList);
      } else {
        if (keyToUpdate === "bgBackground") { 
          handleChange(isVideo ? "videoUrl" : "imageUrl", url); 
          handleChange("bgType", isVideo ? "video" : "image"); 
        }
        else if (keyToUpdate === "floatUrl" || keyToUpdate === "mainImage") { 
          handleChange(keyToUpdate, url); 
        }
        else { 
          handleChange(keyToUpdate, url); 
        }
      }
      setUploadTarget(null);
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans border-l border-gray-100">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div><h2 className="font-bold text-gray-800 text-sm flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />Editor: {element.type}</h2><p className="text-[9px] text-gray-400 uppercase font-black">Personalización Elite</p></div>
          <button onClick={() => selectElement(null)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400"><X size={18} /></button>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
           {[{ id: "content", label: "Contenido", icon: Type }, { id: "style", label: "Diseño", icon: Palette }, { id: "animation", label: "Efectos", icon: Sparkles }].map((tab) => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all", activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600")}><tab.icon size={14} /><span>{tab.label}</span></button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
        <input type="file" className="hidden" ref={fileInputRef} accept="image/*,video/mp4" onChange={handleImageUpload} />
        {activeTab === "content" && (
          <div className="space-y-4">
            {sectionKey === "header" && element.type === "navbar" && (
              <>
                <ControlGroup title="1. Identidad (Logo)" icon={ImageIcon} defaultOpen={true}>
                  <div className="space-y-4">
                    <div onClick={() => triggerUpload("logoUrl")} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 relative">
                      {element.props.logoUrl ? <div className="relative h-12 mx-auto"><img src={element.props.logoUrl} className="h-full object-contain" alt="Logo" /><button onClick={(e) => { e.stopPropagation(); handleChange("logoUrl", null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md border-2 border-white"><X size={10}/></button></div> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR LOGO</p>}
                    </div>
                    <input type="text" value={element.props.logoText || ""} onChange={(e) => handleChange("logoText", e.target.value)} className="w-full p-3 border rounded-xl text-xs font-bold bg-gray-50/30 uppercase" placeholder="Nombre..." />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.logoColor || "#2563eb"} onChange={(e) => handleChange("logoColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 font-black uppercase">Color</span></div>
                      <select value={element.props.logoFont || "font-black"} onChange={(e) => handleChange("logoFont", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white"><option value="font-black">Black</option><option value="font-sans">Modern</option></select>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Diseño Logo</span>
                      <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg">
                        {["solid", "outline", "aurora", "neon"].map(v => (<button key={v} onClick={() => handleChange("logoVariant", v)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", element.props.logoVariant === v ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
                      </div>
                    </div>
                    <FluidSlider label="Escala Logo" value={element.props.logoSize || 24} min={12} max={120} onChange={(val:number) => handleChange("logoSize", val)} />
                    <FluidSlider label="Posición Lateral" value={element.props.logoPosX || 0} min={-200} max={200} onChange={(val:number) => handleChange("logoPosX", val)} />
                  </div>
                </ControlGroup>

                <ControlGroup title="2. Menú Principal" icon={Layout} defaultOpen={false}>
                  <div className="space-y-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg border mb-4">
                      {["left", "center", "right"].map((pos) => (
                        <button key={pos} onClick={() => handleChange("align", pos)} className={cn("flex-1 p-1.5 flex justify-center rounded-md transition-all", element.props.align === pos ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}><AlignCenter size={14} /></button>
                      ))}
                    </div>
                    {(element.props.menuItems || []).map((item: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
                        <input type="text" value={typeof item === 'string' ? item : (item.label || "")} onChange={(e) => { const newItems = [...element.props.menuItems]; if (typeof newItems[idx] === 'string') newItems[idx] = { label: e.target.value, url: "/" }; else newItems[idx].label = e.target.value; handleChange("menuItems", newItems); }} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white" placeholder="Nombre" />
                        <input type="text" value={item.url || "/"} onChange={(e) => { const newItems = [...element.props.menuItems]; if (typeof newItems[idx] === 'string') newItems[idx] = { label: newItems[idx], url: e.target.value }; else newItems[idx].url = e.target.value; handleChange("menuItems", newItems); }} className="w-full p-2 border rounded-lg text-[9px] font-mono text-blue-600 bg-white" placeholder="/" />
                        <button onClick={() => { const newItems = element.props.menuItems.filter((_: any, i: number) => i !== idx); handleChange("menuItems", newItems); }} className="h-8 w-full flex items-center justify-center text-gray-300 hover:text-red-500 rounded-lg"><X size={16}/></button>
                      </div>
                    ))}
                    <button onClick={() => handleChange("menuItems", [...(element.props.menuItems || []), { label: "NUEVO", url: "/" }])} className="w-full py-2 border-2 border-dashed rounded-lg text-[9px] font-black text-gray-400 uppercase">+ Añadir Enlace</button>
                    
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Estética del Menú</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.menuColor || "#4b5563"} onChange={(e) => handleChange("menuColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 font-black uppercase">Color</span></div>
                        <select value={element.props.menuFont || "font-black"} onChange={(e) => handleChange("menuFont", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white">
                          <option value="font-sans">Modern</option>
                          <option value="font-black">Heavy</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Estilo de Enlace</span>
                        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                          {[{id:"solid", l:"Sólido"}, {id:"aurora", l:"Aurora"}, {id:"neon", l:"Neón"}].map(v => (<button key={v.id} onClick={() => handleChange("menuVariant", v.id)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.menuVariant === v.id) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v.l}</button>))}
                        </div>
                      </div>
                      {element.props.menuVariant === "aurora" && (
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={element.props.menuAurora1 || "#00f2ff"} onChange={(e) => handleChange("menuAurora1", e.target.value)} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 1</span></div>
                            <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={element.props.menuAurora2 || "#7000ff"} onChange={(e) => handleChange("menuAurora2", e.target.value)} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 2</span></div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Efecto Visual</span>
                        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                          {[{id:"none", l:"Sólido"}, {id:"glass", l:"Glass"}, {id:"neon", l:"Neón"}, {id:"aurora", l:"Aurora"}].map(e => (<button key={e.id} onClick={() => handleChange("menuEffect", e.id)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.menuEffect === e.id || (!element.props.menuEffect && e.id === "none")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{e.l}</button>))}
                        </div>
                      </div>
                      {element.props.menuEffect === "aurora" && (
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={element.props.menuAurora1 || "#00f2ff"} onChange={(e) => handleChange("menuAurora1", e.target.value)} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 1</span></div>
                            <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={element.props.menuAurora2 || "#7000ff"} onChange={(e) => handleChange("menuAurora2", e.target.value)} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 2</span></div>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <FluidSlider label="Tamaño Letra" value={element.props.menuSize || 10} min={8} max={16} onChange={(v:number) => handleChange("menuSize", v)} />
                        <FluidSlider label="Separación" value={element.props.menuGap || 32} min={10} max={64} onChange={(v:number) => handleChange("menuGap", v)} />
                      </div>
                    </div>
                    <FluidSlider label="Posición X Menú" value={element.props.menuPosX || 0} min={-300} max={300} onChange={(v:number) => handleChange("menuPosX", v)} />
                  </div>
                </ControlGroup>


                <ControlGroup title="3. Botones de Utilidad" icon={Zap} defaultOpen={false}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'showSearch', l: 'Buscador Inteligente', i: Search },
                        { id: 'showCart', l: 'Carrito de Compras', i: ShoppingCart },
                        { id: 'showUser', l: 'Acceso a Cuenta', i: User }
                      ].map(opt => (
                        <button key={opt.id} onClick={() => handleChange(opt.id, !element.props[opt.id])} className={cn("flex items-center justify-between p-3 rounded-xl border transition-all", element.props[opt.id] ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" : "bg-white border-gray-100 text-gray-400")}>
                          <div className="flex items-center gap-3"><opt.i size={14}/><span className="text-[10px] font-black uppercase">{opt.l}</span></div>
                          <div className={cn("w-8 h-4 rounded-full p-0.5 transition-all", element.props[opt.id] ? "bg-blue-500" : "bg-gray-200")}>
                            <div className={cn("w-3 h-3 bg-white rounded-full transition-all", element.props[opt.id] ? "translate-x-4" : "translate-x-0")} />
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Estética de Utilidades</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.utilityColor || "#6b7280"} onChange={(e) => handleChange("utilityColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 font-black uppercase">Color</span></div>
                        <select value={element.props.utilityVariant || "solid"} onChange={(e) => handleChange("utilityVariant", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white">
                          <option value="solid">Sólido</option>
                          <option value="aurora">Aurora</option>
                          <option value="neon">Neón</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Mostrar como</span>
                        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                          {[{id:"icon", l:"Icono"}, {id:"text", l:"Texto"}, {id:"both", l:"Ambos"}].map(m => (<button key={m.id} onClick={() => handleChange("utilityDisplayMode", m.id)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.utilityDisplayMode === m.id || (!element.props.utilityDisplayMode && m.id === "icon")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{m.l}</button>))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Efecto Visual</span>
                        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                          {[{id:"none", l:"Sólido"}, {id:"glass", l:"Glass"}, {id:"neon", l:"Neón"}, {id:"aurora", l:"Aurora"}].map(e => (<button key={e.id} onClick={() => handleChange("utilityEffect", e.id)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.utilityEffect === e.id || (!element.props.utilityEffect && e.id === "none")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{e.l}</button>))}
                        </div>
                      </div>
                      {element.props.utilityEffect === "aurora" && (
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={element.props.utilityAurora1 || "#00f2ff"} onChange={(e) => handleChange("utilityAurora1", e.target.value)} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 1</span></div>
                            <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-blue-100"><input type="color" value={element.props.utilityAurora2 || "#7000ff"} onChange={(e) => handleChange("utilityAurora2", e.target.value)} className="w-6 h-6 rounded-md p-0 cursor-pointer bg-transparent" /><span className="text-[8px] text-gray-400">Color 2</span></div>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <FluidSlider label="Tamaño" value={element.props.utilitySize || 18} min={14} max={32} onChange={(v:number) => handleChange("utilitySize", v)} />
                        <FluidSlider label="Separación" value={element.props.utilityGap || 16} min={0} max={64} onChange={(v:number) => handleChange("utilityGap", v)} />
                        <FluidSlider label="Ajuste X" value={element.props.utilityPosX || 0} min={-200} max={200} onChange={(v:number) => handleChange("utilityPosX", v)} />
                      </div>
                    </div>
                  </div>
                </ControlGroup>

                <ControlGroup title="4. Iconos de Acción Extra" icon={PlusIcon} defaultOpen={false}>
                  <div className="space-y-4">
                    {(element.props.extraUtilities || []).map((util: any, idx: number) => (
                      <div key={util.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative group/util">
                        <button onClick={() => handleChange("extraUtilities", element.props.extraUtilities.filter((_:any, i:number) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/util:opacity-100 transition-opacity shadow-lg"><X size={10}/></button>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={util.label} onChange={(e) => { const newU = [...element.props.extraUtilities]; newU[idx].label = e.target.value; handleChange("extraUtilities", newU); }} className="w-full p-2 border rounded-lg text-[10px] font-bold" placeholder="Etiqueta" />
                          <select value={util.icon} onChange={(e) => { const newU = [...element.props.extraUtilities]; newU[idx].icon = e.target.value; handleChange("extraUtilities", newU); }} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white">
                            <option value="Heart">Favoritos</option>
                            <option value="Phone">WhatsApp</option>
                            <option value="MessageSquare">Chat</option>
                            <option value="Bell">Campana</option>
                            <option value="Star">Estrella</option>
                          </select>
                        </div>
                        <input type="text" value={util.url} onChange={(e) => { const newU = [...element.props.extraUtilities]; newU[idx].url = e.target.value; handleChange("extraUtilities", newU); }} className="w-full p-2 border rounded-lg text-[9px] font-mono text-blue-600" placeholder="https://wa.me/..." />
                      </div>
                    ))}
                    <button onClick={() => handleChange("extraUtilities", [...(element.props.extraUtilities || []), { id: uuidv4(), label: "WhatsApp", icon: "Phone", url: "" }])} className="w-full py-2 border-2 border-dashed rounded-lg text-[9px] font-black text-gray-400 uppercase">+ Vincular Canal Directo</button>
                  </div>
                </ControlGroup>
              </>
            )}

            {sectionKey === "footer" && element.type === "footer-premium" && (
              <>
                <ControlGroup title="1. Identidad de Marca" icon={Store} defaultOpen={true}>
                  <div className="space-y-4">
                    <div onClick={() => triggerUpload("footerLogoUrl")} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 relative">
                      {element.props.footerLogoUrl ? <div className="relative h-12 mx-auto"><img src={element.props.footerLogoUrl} className="h-full object-contain" /><button onClick={(e) => { e.stopPropagation(); handleChange("footerLogoUrl", null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md border-2 border-white"><X size={10}/></button></div> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR LOGO FOOTER</p>}
                    </div>
                    <input type="text" value={element.props.logoText || ""} onChange={(e) => handleChange("logoText", e.target.value)} className="w-full p-3 border rounded-xl text-xs font-bold bg-gray-50/30 uppercase" placeholder="Nombre..." />
                    <textarea value={element.props.description || ""} onChange={(e) => handleChange("description", e.target.value)} className="w-full p-3 border rounded-xl text-[10px] font-medium bg-gray-50/30" placeholder="Biografía corta..." rows={3} />
                    <div className="grid grid-cols-2 gap-3">
                      <FluidSlider label="Posición X" value={element.props.footerLogoPosX || 0} min={-200} max={200} onChange={(v:number) => handleChange("footerLogoPosX", v)} />
                      <FluidSlider label="Posición Y" value={element.props.footerLogoPosY || 0} min={-100} max={100} onChange={(v:number) => handleChange("footerLogoPosY", v)} />
                    </div>
                  </div>
                </ControlGroup>

                <ControlGroup title="2. Columnas de Enlaces" icon={Layout} defaultOpen={false}>
                  <div className="space-y-6">
                    {(element.props.menuGroups || []).map((group: any, gIdx: number) => (
                      <div key={gIdx} className="p-4 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4 relative group/g">
                        <button onClick={() => { const newG = element.props.menuGroups.filter((_:any, i:number) => i !== gIdx); handleChange("menuGroups", newG); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/g:opacity-100 transition-opacity"><X size={12}/></button>
                        <input type="text" value={group.title} onChange={(e) => { const newG = [...element.props.menuGroups]; newG[gIdx].title = e.target.value; handleChange("menuGroups", newG); }} className="w-full p-2 border-b bg-transparent text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500" />
                        <div className="space-y-2">
                          {group.links.map((link: any, lIdx: number) => (
                            <div key={lIdx} className="flex gap-2">
                              <input type="text" value={link.label} onChange={(e) => { const newG = [...element.props.menuGroups]; newG[gIdx].links[lIdx].label = e.target.value; handleChange("menuGroups", newG); }} className="flex-1 p-1.5 border rounded-lg text-[9px] font-bold" />
                              <input type="text" value={link.url} onChange={(e) => { const newG = [...element.props.menuGroups]; newG[gIdx].links[lIdx].url = e.target.value; handleChange("menuGroups", newG); }} className="flex-1 p-1.5 border rounded-lg text-[8px] font-mono" />
                              <button onClick={() => { const newG = [...element.props.menuGroups]; newG[gIdx].links = newG[gIdx].links.filter((_:any, i:number) => i !== lIdx); handleChange("menuGroups", newG); }} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                            </div>
                          ))}
                          <button onClick={() => { const newG = [...element.props.menuGroups]; newG[gIdx].links.push({label: "NUEVO", url: "#"}); handleChange("menuGroups", newG); }} className="w-full py-1.5 border border-dashed rounded-lg text-[8px] font-black text-gray-400 uppercase">+ Enlace</button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => handleChange("menuGroups", [...(element.props.menuGroups || []), { title: "NUEVA SECCIÓN", show: true, links: [] }])} className="w-full py-3 border-2 border-dashed rounded-2xl text-[9px] font-black text-gray-400 uppercase">+ Añadir Columna</button>
                  </div>
                </ControlGroup>

                <ControlGroup title="3. Canales Sociales" icon={Share2} defaultOpen={false}>
                  <div className="space-y-4">
                    <button onClick={() => handleChange("showSocial", !element.props.showSocial)} className={cn("w-full py-2 border rounded-xl text-[9px] font-black transition-all", element.props.showSocial ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-400")}>Iconos Sociales {element.props.showSocial ? "ON" : "OFF"}</button>
                    {element.props.showSocial && (
                      <div className="grid grid-cols-2 gap-2">
                        {['facebook', 'instagram', 'whatsapp', 'tiktok'].map(p => (
                          <div key={p} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2">
                            <span className="text-[8px] font-black uppercase text-gray-400">{p}</span>
                            <input type="text" placeholder="URL" onChange={(e) => {
                              const newLinks = (element.props.socialLinks || []).map((l:any) => l.platform === p ? {...l, url: e.target.value} : l);
                              if (!newLinks.find((l:any) => l.platform === p)) newLinks.push({id: uuidv4(), platform: p, url: e.target.value});
                              handleChange("socialLinks", newLinks);
                            }} className="w-full p-1.5 border rounded-md text-[8px] font-mono" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ControlGroup>

                <ControlGroup title="4. Suscripción & Copyright" icon={ShieldCheck} defaultOpen={false}>
                  <div className="space-y-4">
                    <button onClick={() => handleChange("showNewsletter", !element.props.showNewsletter)} className={cn("w-full py-2 border rounded-xl text-[9px] font-black transition-all", element.props.showNewsletter ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-400")}>Newsletter {element.props.showNewsletter ? "ON" : "OFF"}</button>
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Texto Copyright</span>
                      <input type="text" value={element.props.copyright || ""} onChange={(e) => handleChange("copyright", e.target.value)} className="w-full p-3 border rounded-xl text-[10px] font-bold bg-gray-50/30" />
                    </div>
                  </div>
                </ControlGroup>
              </>
            )}
            
            {sectionKey === "body" && (
              <>
                {element.type !== "product-master-view" && (
                  <>
                    {renderModularTextDesigner(
                      { ...element.props, content: element.props.title, variant: element.props.titleVariant, color: element.props.titleColor, size: element.props.titleSize, font: element.props.titleFont, aurora1: element.props.titleAurora1, aurora2: element.props.titleAurora2, intensity: element.props.titleIntensity || 100, posX: element.props.titlePosX, posY: element.props.titlePosY }, 
                      (p) => {
                        const updates: any = {};
                        if ('content' in p) updates.title = p.content;
                        if ('variant' in p) updates.titleVariant = p.variant;
                        if ('color' in p) updates.titleColor = p.color;
                        if ('size' in p) updates.titleSize = p.size;
                        if ('font' in p) updates.titleFont = p.font;
                        if ('aurora1' in p) updates.titleAurora1 = p.aurora1;
                        if ('aurora2' in p) updates.titleAurora2 = p.aurora2;
                        if ('intensity' in p) updates.titleIntensity = p.intensity;
                        if ('posX' in p) updates.titlePosX = p.posX; // Añadido
                        if ('posY' in p) updates.titlePosY = p.posY; // Añadido
                        updateElement(sectionKey, selectedElementId, updates);
                      }, "Título de Impacto"
                    )}
                    {renderModularTextDesigner(
                      { ...element.props, content: element.props.subtitle, variant: element.props.subtitleVariant, color: element.props.subtitleColor, size: element.props.subtitleSize, font: element.props.subtitleFont, intensity: element.props.subtitleIntensity || 100, posX: element.props.subtitlePosX, posY: element.props.subtitlePosY }, 
                      (p) => {
                        const updates: any = {};
                        if ('content' in p) updates.subtitle = p.content;
                        if ('variant' in p) updates.subtitleVariant = p.variant;
                        if ('color' in p) updates.subtitleColor = p.color;
                        if ('size' in p) updates.subtitleSize = p.size;
                        if ('font' in p) updates.subtitleFont = p.font;
                        if ('intensity' in p) updates.subtitleIntensity = p.intensity;
                        if ('posX' in p) updates.subtitlePosX = p.posX; // Añadido
                        if ('posY' in p) updates.subtitlePosY = p.posY; // Añadido
                        updateElement(sectionKey, selectedElementId, updates);
                      }, "Descripción"
                    )}
                    {renderModularButtonDesigner({ ...element.props, text: element.props.primaryBtnText, url: element.props.primaryBtnUrl, variant: element.props.primaryBtnVariant, bgColor: element.props.primaryBtnBgColor, size: element.props.primaryBtnSize, posX: element.props.primaryBtnPosX, posY: element.props.primaryBtnPosY }, (p) => {
                      const updates: any = {};
                      if ('text' in p) updates.primaryBtnText = p.text;
                      if ('url' in p) updates.primaryBtnUrl = p.url;
                      if ('variant' in p) updates.primaryBtnVariant = p.variant;
                      if ('bgColor' in p) updates.primaryBtnBgColor = p.bgColor;
                      if ('size' in p) updates.primaryBtnSize = p.size;
                      if ('posX' in p) updates.primaryBtnPosX = p.posX;
                      if ('posY' in p) updates.primaryBtnPosY = p.posY;
                      updateElement(sectionKey, selectedElementId, updates);
                    }, "Botón Primario")}
                    {renderModularButtonDesigner({ ...element.props, text: element.props.secondaryBtnText, url: element.props.secondaryBtnUrl, variant: element.props.secondaryBtnVariant, bgColor: element.props.secondaryBtnBgColor, size: element.props.secondaryBtnSize, posX: element.props.secondaryBtnPosX, posY: element.props.secondaryBtnPosY }, (p) => {
                      const updates: any = {};
                      if ('text' in p) updates.secondaryBtnText = p.text;
                      if ('url' in p) updates.secondaryBtnUrl = p.url;
                      if ('variant' in p) updates.secondaryBtnVariant = p.variant;
                      if ('bgColor' in p) updates.secondaryBtnBgColor = p.bgColor;
                      if ('size' in p) updates.secondaryBtnSize = p.size;
                      if ('posX' in p) updates.secondaryBtnPosX = p.posX;
                      if ('posY' in p) updates.secondaryBtnPosY = p.posY;
                      updateElement(sectionKey, selectedElementId, updates);
                    }, "Botón Secundario")}
                    {renderModularMultimediaDesigner({ ...element.props, id: null, floatUrl: element.props.floatUrl, floatSize: element.props.floatSize, floatRadius: element.props.floatRadius, floatPosX: element.props.floatPosX, floatPosY: element.props.floatPosY }, (p) => { 
                      const mapping: any = { floatType: 'floatType', url: 'floatUrl', floatUrl: 'floatUrl', floatAnim: 'floatAnim', size: 'floatSize', floatSize: 'floatSize', radius: 'floatRadius', floatRadius: 'floatRadius', posX: 'floatPosX', floatPosX: 'floatPosX', posY: 'floatPosY', floatPosY: 'floatPosY' }; 
                      const updates: Record<string, any> = {}; 
                      Object.keys(p).forEach(k => { if (mapping[k]) updates[mapping[k]] = p[k]; }); 
                      updateElement(sectionKey, selectedElementId, updates); 
                    }, "Imagen Complemento", triggerUpload, false, undefined, "floatUrl")}
                  </>
                )}

                {element.type === "product-grid" && (
                  <>
                    <ControlGroup title="Filtros y Grilla" icon={Layout} defaultOpen={true}>
                      <div className="space-y-4">
                        <select value={element.props.selectedCategory || "all"} onChange={(e) => handleChange("selectedCategory", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white">
                          <option value="all">Todas las Categorías</option>
                          {realCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.title}</option>))}
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                          <FluidSlider label="Columnas" value={element.props.columns || 4} min={1} max={6} onChange={(v:number) => handleChange("columns", v)} />
                          <FluidSlider label="Productos" value={element.props.itemsCount || 4} min={1} max={20} onChange={(v:number) => handleChange("itemsCount", v)} />
                        </div>
                        <FluidSlider label="Separación Cards" value={element.props.gridGap || 24} min={0} max={100} onChange={(v:number) => handleChange("gridGap", v)} />
                      </div>
                    </ControlGroup>

                    <ControlGroup title="Estilo de Tarjetas" icon={Palette}>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                          {[{id:"premium", l:"Premium"}, {id:"minimal", l:"Minimal"}, {id:"glass", l:"Glass"}].map(s => (
                            <button key={s.id} onClick={() => handleChange("cardStyle", s.id)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", element.props.cardStyle === s.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{s.l}</button>
                          ))}
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-lg border">
                          {["left", "center", "right"].map((pos) => (
                            <button key={pos} onClick={() => handleChange("cardAlign", pos)} className={cn("flex-1 p-1.5 flex justify-center rounded-md transition-all", (element.props.cardAlign === pos || (!element.props.cardAlign && pos === "left")) ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}><AlignCenter size={14} /></button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => handleChange("showPrice", !element.props.showPrice)} className={cn("py-2 border rounded-xl text-[9px] font-black uppercase transition-all", element.props.showPrice ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-400")}>Precio {element.props.showPrice ? "ON" : "OFF"}</button>
                          <button onClick={() => handleChange("showDescription", !element.props.showDescription)} className={cn("py-2 border rounded-xl text-[9px] font-black uppercase transition-all", element.props.showDescription ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-400")}>Desc. {element.props.showDescription ? "ON" : "OFF"}</button>
                        </div>
                        {renderModularTextDesigner({ variant: element.props.cardTitleVariant, color: element.props.cardTitleColor, size: element.props.cardTitleSize, font: element.props.cardTitleFont, intensity: element.props.cardTitleIntensity || 100 }, (p) => {
                          const updates: any = {};
                          if ('variant' in p) updates.cardTitleVariant = p.variant;
                          if ('color' in p) updates.cardTitleColor = p.color;
                          if ('size' in p) updates.cardTitleSize = p.size;
                          if ('font' in p) updates.cardTitleFont = p.font;
                          if ('intensity' in p) updates.cardTitleIntensity = p.intensity;
                          updateElement(sectionKey, selectedElementId, updates);
                        }, "Personalización Nombre")}
                        {element.props.showPrice && renderModularTextDesigner({ variant: element.props.priceVariant, color: element.props.priceColor, size: element.props.priceSize, font: element.props.priceFont, intensity: element.props.priceIntensity || 100 }, (p) => {
                          const updates: any = {};
                          if ('variant' in p) updates.priceVariant = p.variant;
                          if ('color' in p) updates.priceColor = p.color;
                          if ('size' in p) updates.priceSize = p.size;
                          if ('font' in p) updates.priceFont = p.font;
                          if ('intensity' in p) updates.priceIntensity = p.intensity;
                          updateElement(sectionKey, selectedElementId, updates);
                        }, "Personalización Precio")}
                        <FluidSlider label="Altura Tarjeta" value={element.props.cardHeight || 450} min={300} max={800} onChange={(v:number) => handleChange("cardHeight", v)} />
                        <FluidSlider label="Redondeo" value={element.props.cardBorderRadius || 20} min={0} max={60} onChange={(v:number) => handleChange("cardBorderRadius", v)} />
                        <FluidSlider label="Posición Y Cards" value={element.props.cardPosY || 0} min={-200} max={200} onChange={(v:number) => handleChange("cardPosY", v)} />
                      </div>
                    </ControlGroup>

                    <ControlGroup title="Etiqueta de Oferta" icon={Tag}>
                      <div className="space-y-4">
                        <button onClick={() => handleChange("showOfferBadge", !element.props.showOfferBadge)} className={cn("w-full py-2 border rounded-xl text-[9px] font-black uppercase transition-all", element.props.showOfferBadge ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-gray-400")}>Etiqueta Oferta {element.props.showOfferBadge ? "ON" : "OFF"}</button>
                        {element.props.showOfferBadge && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <input type="text" value={element.props.offerBadgeText || "OFERTA"} onChange={(e) => handleChange("offerBadgeText", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold uppercase" />
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-2 p-1 border rounded-lg bg-white h-[38px]"><input type="color" value={element.props.offerBadgeBg || "#ef4444"} onChange={(e) => handleChange("offerBadgeBg", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase">Fondo</span></div>
                              <div className="flex items-center gap-2 p-1 border rounded-lg bg-white h-[38px]"><input type="color" value={element.props.offerBadgeColor || "#ffffff"} onChange={(e) => handleChange("offerBadgeColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase">Texto</span></div>
                            </div>
                            <button onClick={() => handleChange("offerBadgePulse", !element.props.offerBadgePulse)} className={cn("w-full py-1.5 border rounded-lg text-[8px] font-black uppercase transition-all", element.props.offerBadgePulse !== false ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-white text-gray-400")}>Pulso {element.props.offerBadgePulse !== false ? "ON" : "OFF"}</button>
                          </div>
                        )}
                      </div>
                    </ControlGroup>

                    <ControlGroup title="Botón de Acción" icon={MousePointer2}>
                      <div className="space-y-4">
                        <button onClick={() => handleChange("showAddToCart", !element.props.showAddToCart)} className={cn("w-full py-2 border rounded-xl text-[9px] font-black uppercase transition-all", element.props.showAddToCart ? "bg-green-50 text-green-600 border-green-200" : "bg-white text-gray-400")}>Botón Carrito {element.props.showAddToCart ? "ON" : "OFF"}</button>
                        {element.props.showAddToCart && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <input type="text" value={element.props.addToCartText || "Añadir"} onChange={(e) => handleChange("addToCartText", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold" />
                            <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg">
                              {["solid", "outline", "glass", "aurora"].map(v => (<button key={v} onClick={() => handleChange("addToCartVariant", v)} className={cn("py-1 text-[7px] font-black uppercase rounded-md transition-all", (element.props.addToCartVariant === v || (!element.props.addToCartVariant && v === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
                            </div>
                            <FluidSlider label="Tamaño" value={element.props.addToCartSize || 10} min={8} max={20} onChange={(v:number) => handleChange("addToCartSize", v)} />
                            <FluidSlider label="Redondeo" value={element.props.addToCartBorderRadius || 12} min={0} max={30} onChange={(v:number) => handleChange("addToCartBorderRadius", v)} />
                          </div>
                        )}
                      </div>
                    </ControlGroup>
                  </>
                )}

                <div className="space-y-4 pt-4 border-t border-gray-100 mt-8">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4 px-2">Capas Extra Personalizadas</span>
                  {(element.props.extraElements || []).map((extra: any) => (
                    <React.Fragment key={extra.id}>
                      {extra.type === 'text' && renderModularTextDesigner(extra, (p) => handleExtraChange(extra.id, p), "Texto Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                      {extra.type === 'button' && renderModularButtonDesigner(extra, (p) => handleExtraChange(extra.id, p), "Botón Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                      {(extra.type === 'image' || extra.type === 'video') && renderModularMultimediaDesigner(extra, (p) => handleExtraChange(extra.id, p), "Multimedia Extra", triggerUpload, true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                    </React.Fragment>
                  ))}
                  <div className="relative px-2">
                    <button onClick={() => setShowAddMenu(!showAddMenu)} className="w-full py-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-blue-100 transition-all shadow-sm"><PlusIcon size={14} /> Agregar Otro Elemento</button>
                    <AnimatePresence>{showAddMenu && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-0 w-full bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 z-50 mb-2 grid grid-cols-3 gap-2">{[{id:'text', l:'Texto', i:Type}, {id:'button', l:'Botón', i:MousePointer2}, {id:'image', l:'Imagen', i:ImageIcon}].map(opt => (<button key={opt.id} onClick={() => addExtraElement(opt.id as any)} className="flex flex-col items-center gap-2 p-3 hover:bg-blue-50 rounded-xl transition-all"><div className="p-2 bg-blue-500 text-white rounded-lg shadow-sm"><opt.i size={16}/></div><span className="text-[9px] font-black uppercase text-gray-600">{opt.l}</span></button>))}</motion.div>)}</AnimatePresence>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {activeTab === "style" && (
          <div className="space-y-4">
            {sectionKey === "header" && element.type === "navbar" && (
              <>
                <ControlGroup title="1. Estética de Barra" icon={Palette} defaultOpen={true}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Efecto Visual</span>
                      <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg">
                        {[{id:"none", l:"Sólido"}, {id:"glass", l:"Glass"}, {id:"neon", l:"Neón"}, {id:"aurora", l:"Aurora"}].map(e => (
                          <button key={e.id} onClick={() => handleChange("barEffect", e.id)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.barEffect === e.id || (!element.props.barEffect && e.id === "none")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{e.l}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.bgColor || "#ffffff"} onChange={(e) => handleChange("bgColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 font-black uppercase">Fondo</span></div>
                      <FluidSlider label="Altura" value={element.props.navHeight || 80} min={60} max={140} onChange={(v:number) => handleChange("navHeight", v)} />
                    </div>
                  </div>
                </ControlGroup>
                
                <ControlGroup title="2. Diseño de Enlaces" icon={Type} defaultOpen={false}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.menuColor || "#4b5563"} onChange={(e) => handleChange("menuColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 font-black uppercase">Color</span></div>
                      <select value={element.props.menuFont || "font-black"} onChange={(e) => handleChange("menuFont", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white">
                        <option value="font-sans">Modern</option>
                        <option value="font-black">Heavy</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FluidSlider label="Tamaño Letra" value={element.props.menuSize || 10} min={8} max={16} onChange={(v:number) => handleChange("menuSize", v)} />
                      <FluidSlider label="Separación" value={element.props.menuGap || 32} min={10} max={64} onChange={(v:number) => handleChange("menuGap", v)} />
                    </div>
                  </div>
                </ControlGroup>
              </>
            )}
            
            {sectionKey === "body" && (
              <>
                {element.type === "product-grid" && (
                  <ControlGroup title="Configuración de Filtros" icon={Sliders} defaultOpen={true}>
                    <div className="space-y-4">
                      <button onClick={() => handleChange("showFilters", !element.props.showFilters)} className={cn("w-full py-2 border rounded-xl text-[9px] font-black uppercase transition-all", element.props.showFilters ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-400")}>Filtros {element.props.showFilters ? "VISIBLES" : "OCULTOS"}</button>
                      {element.props.showFilters && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                            {[{id:"left", l:"Izq."}, {id:"top", l:"Arriba"}, {id:"right", l:"Der."}].map(p => (<button key={p.id} onClick={() => handleChange("filterPlacement", p.id)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.filterPlacement === p.id || (!element.props.filterPlacement && p.id === "left")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{p.l}</button>))}
                          </div>
                          <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg">
                            {[{id:"list", l:"Lista"}, {id:"pills", l:"Botones"}].map(s => (<button key={s.id} onClick={() => handleChange("filterStyle", s.id)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.filterStyle === s.id || (!element.props.filterStyle && s.id === "list")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{s.l}</button>))}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white h-[38px]"><input type="color" value={element.props.filterBg || "#f9fafb"} onChange={(e) => handleChange("filterBg", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase">Fondo</span></div>
                            <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white h-[38px]"><input type="color" value={element.props.filterAccent || "#2563eb"} onChange={(e) => handleChange("filterAccent", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase">Énfasis</span></div>
                          </div>
                          <FluidSlider label="Redondeo" value={element.props.filterRadius || 32} min={0} max={60} onChange={(v:number) => handleChange("filterRadius", v)} />
                          <FluidSlider label="Ancho Panel" value={element.props.filterWidth || 260} min={150} max={400} onChange={(v:number) => handleChange("filterWidth", v)} />
                          <div className="grid grid-cols-2 gap-3">
                            <FluidSlider label="Posición X" value={element.props.filterPosX || 0} min={-500} max={500} onChange={(v:number) => handleChange("filterPosX", v)} />
                            <FluidSlider label="Posición Y" value={element.props.filterPosY || 0} min={-500} max={500} onChange={(v:number) => handleChange("filterPosY", v)} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleChange("filterShadow", !element.props.filterShadow)} className={cn("py-2 border rounded-xl text-[8px] font-black uppercase transition-all", element.props.filterShadow ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-400")}>Sombra</button>
                            <button onClick={() => handleChange("filterGlass", !element.props.filterGlass)} className={cn("py-2 border rounded-xl text-[8px] font-black uppercase transition-all", element.props.filterGlass ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-400")}>Glass</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </ControlGroup>
                )}
                <ControlGroup title="Multimedia de Fondo" icon={ImageIcon} defaultOpen={true}>
                  <div className="space-y-4">
                    <div onClick={() => triggerUpload("bgBackground")} className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 cursor-pointer relative transition-all">
                      {element.props.imageUrl || element.props.videoUrl ? (<div className="relative">{element.props.bgType === "video" ? <div className="h-20 w-20 mx-auto bg-black rounded-lg flex items-center justify-center"><Play size={20} className="text-white opacity-50"/></div> : <img src={element.props.imageUrl} className="h-20 mx-auto rounded-lg shadow-sm" />}<button onClick={(e) => { e.stopPropagation(); handleChange(element.props.bgType === "video" ? "videoUrl" : "imageUrl", null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-xl border-2 border-white transition-all z-50"><X size={12}/></button></div>) : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR FONDO</p>}
                    </div>
                    <FluidSlider label="Opacidad Overlay" value={element.props.overlayOpacity || 40} min={0} max={95} suffix="%" onChange={(v:number) => handleChange("overlayOpacity", v)} />
                  </div>
                </ControlGroup>
                <ControlGroup title="Estructura y Tamaño" icon={Move} defaultOpen={true}>
                  <FluidSlider label="Altura del Bloque" value={element.props.height || 400} min={100} max={1200} onChange={(v:number) => handleChange("height", v)} />
                </ControlGroup>
              </>
            )}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-100 bg-white shrink-0"><button onClick={() => selectElement(null)} className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95">Confirmar Cambios</button></div>
    </div>
  );
};
