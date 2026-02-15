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
        const effectiveProps = {
          ...found.props,
          ...(found.props.responsiveOverrides?.[viewport] || {})
        };
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
        const newList = (element.props.extraElements || []).map((item: any) => item.id === uploadTarget.id ? { ...item, [keyToUpdate]: url, url: url, type: isVideo ? 'video' : 'image' } : item);
        handleChange("extraElements", newList);
      } else {
        if (keyToUpdate === "floatUrl" || keyToUpdate === "mainImage") {
          handleChange(keyToUpdate, url);
        } else if (keyToUpdate === "bgBackground") {
          handleChange(isVideo ? "videoUrl" : "imageUrl", url);
          handleChange("bgType", isVideo ? "video" : "image");
        } else {
          handleChange(keyToUpdate, url);
        }
      }
      setUploadTarget(null);
    }
  };

  const renderModularTextDesigner = (props: any, onUpdate: (p: any) => void, title: string, canRemove = false, onRemove?: () => void) => {
    const variant = props.variant || "solid";
    return (
      <ControlGroup title={title} icon={Type} onRemove={canRemove ? onRemove : null} defaultOpen={true}>
        <div className="space-y-4">
          <textarea value={props.content ?? props.title ?? ""} onChange={(e) => onUpdate({ content: e.target.value, title: e.target.value })} className="w-full p-3 border rounded-xl text-sm font-black bg-gray-50/30 uppercase italic" />
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
            </select>
            <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={props.color || "#ffffff"} onChange={(e) => onUpdate({ color: e.target.value })} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase">Color</span></div>
          </div>
          <FluidSlider label="Tamaño" value={props.size || 24} min={10} max={120} onChange={(val:number) => onUpdate({ size: val })} />
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
          <div onClick={() => triggerUpload(uploadKey, props.id)} className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 cursor-pointer relative">
            {url ? <div className="relative aspect-square w-20 mx-auto rounded-lg overflow-hidden border"><img src={url} className="w-full h-full object-cover" /><button onClick={(e) => { e.stopPropagation(); onUpdate({ url: null, floatUrl: null, videoUrl: null, imageUrl: null }); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-xl border-2 border-white transition-all z-50"><X size={14}/></button></div> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR MULTIMEDIA</p>}
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
                {element.type === "announcement-bar" && (
                  <ControlGroup title="Mensajes de la Barra" icon={Type} defaultOpen={true}>
                    <div className="space-y-3">
                      {(element.props.messages || []).map((msg: string, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <input type="text" value={msg} onChange={(e) => { const newMsgs = [...element.props.messages]; newMsgs[idx] = e.target.value; handleChange("messages", newMsgs); }} className="flex-1 p-2 border rounded-lg text-[10px] font-bold" />
                          <button onClick={() => handleChange("messages", element.props.messages.filter((_:any, i:number) => i !== idx))} className="text-red-400 p-1"><X size={14}/></button>
                        </div>
                      ))}
                      <button onClick={() => handleChange("messages", [...(element.props.messages || []), "¡NUEVO MENSAJE!"])} className="w-full py-2 border-2 border-dashed rounded-lg text-[9px] font-black text-gray-400 uppercase">+ Añadir Mensaje</button>
                    </div>
                  </ControlGroup>
                )}
                {element.type === "navbar" && (
                  <>
                    <ControlGroup title="1. Identidad (Logo)" icon={ImageIcon} defaultOpen={true}>
                      <div className="space-y-4">
                        <div onClick={() => triggerUpload("logoUrl")} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 relative">
                          {element.props.logoUrl ? <div className="relative h-12 mx-auto"><img src={element.props.logoUrl} className="h-full object-contain" alt="Logo" /><button onClick={(e) => { e.stopPropagation(); handleChange("logoUrl", null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md border-2 border-white"><X size={10}/></button></div> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR LOGO</p>}
                        </div>
                        <input type="text" value={element.props.logoText || ""} onChange={(e) => handleChange("logoText", e.target.value)} className="w-full p-3 border rounded-xl text-xs font-bold bg-gray-50/30 uppercase" placeholder="Nombre..." />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.logoColor || "#2563eb"} onChange={(e) => handleChange("logoColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 font-black uppercase">Color</span></div>
                          <select value={element.props.logoFont || "font-black"} onChange={(e) => handleChange("logoFont", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white"><option value="font-black">Black</option><option value="font-sans">Modern</option><option value="font-serif">Classic</option></select>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-gray-400 uppercase">Tema de Logo</span>
                          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                            {["solid", "outline", "3d", "brutalist", "aurora"].map(v => (<button key={v} onClick={() => handleChange("logoVariant", v)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.logoVariant === v || (!element.props.logoVariant && v === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
                          </div>
                        </div>

                        <FluidSlider label="Escala Logo" value={element.props.logoSize || 24} min={12} max={120} onChange={(val:number) => handleChange("logoSize", val)} />
                        <FluidSlider label="Posición Logo" value={element.props.logoPosX || 0} min={-200} max={200} onChange={(val:number) => handleChange("logoPosX", val)} />
                      </div>
                    </ControlGroup>

                    <ControlGroup title="2. Menú Principal" icon={Layout} defaultOpen={false}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {(element.props.menuItems || []).map((item: any, idx: number) => (
                            <div key={idx} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
                              <input type="text" value={typeof item === 'string' ? item : (item.label || "")} onChange={(e) => { const newItems = [...element.props.menuItems]; if (typeof newItems[idx] === 'string') newItems[idx] = { label: e.target.value, url: "/" }; else newItems[idx].label = e.target.value; handleChange("menuItems", newItems); }} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white" placeholder="Nombre" />
                              <input type="text" value={item.url || "/"} onChange={(e) => { const newItems = [...element.props.menuItems]; if (typeof newItems[idx] === 'string') newItems[idx] = { label: newItems[idx], url: e.target.value }; else newItems[idx].url = e.target.value; handleChange("menuItems", newItems); }} className="w-full p-2 border rounded-lg text-[9px] font-mono text-blue-600 bg-white" placeholder="/" />
                              <button onClick={() => { const newItems = element.props.menuItems.filter((_: any, i: number) => i !== idx); handleChange("menuItems", newItems); }} className="h-8 w-full flex items-center justify-center text-gray-300 hover:text-red-500 rounded-lg"><X size={16}/></button>
                            </div>
                          ))}
                          <button onClick={() => handleChange("menuItems", [...(element.props.menuItems || []), { label: "NUEVO", url: "/" }])} className="w-full py-2 mt-2 border-2 border-dashed rounded-lg text-[9px] font-black text-gray-400 uppercase">+ Añadir Enlace</button>
                        </div>

                        <div className="pt-4 border-t border-gray-100 space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.menuColor || "#4b5563"} onChange={(e) => handleChange("menuColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Color</span></div>
                            <select value={element.props.menuFont || "font-black"} onChange={(e) => handleChange("menuFont", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white"><option value="font-black">Heavy</option><option value="font-sans">Modern</option></select>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Tema de Menú</span>
                            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                              {["solid", "outline", "3d", "brutalist", "aurora"].map(v => (<button key={v} onClick={() => handleChange("menuVariant", v)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.menuVariant === v || (!element.props.menuVariant && v === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
                            </div>
                          </div>

                          <FluidSlider label="Tamaño Letra" value={element.props.menuSize || 10} min={8} max={24} onChange={(val:number) => handleChange("menuSize", val)} />
                          <FluidSlider label="Separación" value={element.props.menuGap || 32} min={0} max={100} onChange={(val:number) => handleChange("menuGap", val)} />
                          <FluidSlider label="Posición Menú" value={element.props.menuPosX || 0} min={-200} max={200} onChange={(val:number) => handleChange("menuPosX", val)} />
                        </div>
                      </div>
                    </ControlGroup>

                    <ControlGroup title="3. Iconos de Acceso" icon={MousePointer2} defaultOpen={false}>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2">
                          <button onClick={() => handleChange("showUser", !element.props.showUser)} className={cn("flex items-center justify-between px-4 py-2 border rounded-xl text-[10px] font-black uppercase transition-all", element.props.showUser ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-400")}>
                            <span>Inicio Sesión</span><span>{element.props.showUser ? "ON" : "OFF"}</span>
                          </button>
                          <button onClick={() => handleChange("showCart", !element.props.showCart)} className={cn("flex items-center justify-between px-4 py-2 border rounded-xl text-[10px] font-black uppercase transition-all", element.props.showCart ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-400")}>
                            <span>Carrito</span><span>{element.props.showCart ? "ON" : "OFF"}</span>
                          </button>
                          <button onClick={() => handleChange("showSearch", !element.props.showSearch)} className={cn("flex items-center justify-between px-4 py-2 border rounded-xl text-[10px] font-black uppercase transition-all", element.props.showSearch ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-400")}>
                            <span>Búsqueda</span><span>{element.props.showSearch ? "ON" : "OFF"}</span>
                          </button>
                        </div>

                        {(element.props.extraUtilities || []).map((util: any, idx: number) => (
                          <div key={util.id} className="p-3 border rounded-xl bg-gray-50/50 space-y-2 relative group">
                            <button onClick={() => handleChange("extraUtilities", element.props.extraUtilities.filter((_:any, i:number) => i !== idx))} className="absolute -top-1 -right-1 text-red-400"><X size={14}/></button>
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" value={util.label} onChange={(e) => { const newList = [...element.props.extraUtilities]; newList[idx].label = e.target.value; handleChange("extraUtilities", newList); }} className="w-full p-1.5 border rounded-lg text-[10px] font-bold" placeholder="Etiqueta" />
                              <input type="text" value={util.url} onChange={(e) => { const newList = [...element.props.extraUtilities]; newList[idx].url = e.target.value; handleChange("extraUtilities", newList); }} className="w-full p-1.5 border rounded-lg text-[9px] font-mono" placeholder="/url" />
                            </div>
                          </div>
                        ))}
                        <button onClick={() => handleChange("extraUtilities", [...(element.props.extraUtilities || []), { id: uuidv4(), label: "Nuevo", icon: "Heart", url: "/" }])} className="w-full py-2 border-2 border-dashed rounded-lg text-[9px] font-black text-gray-400 uppercase">+ Añadir Icono</button>

                        <div className="pt-4 border-t border-gray-100 space-y-4">
                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Tema de Iconos</span>
                            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                              {["solid", "outline", "3d", "aurora"].map(v => (<button key={v} onClick={() => handleChange("utilityVariant", v)} className={cn("py-1.5 text-[7px] font-black uppercase rounded-md transition-all", (element.props.utilityVariant === v || (!element.props.utilityVariant && v === "solid")) ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{v}</button>))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.utilityColor || "#6b7280"} onChange={(e) => handleChange("utilityColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 uppercase font-black">Color</span></div>
                          <FluidSlider label="Tamaño Iconos" value={element.props.utilitySize || 18} min={12} max={48} onChange={(val:number) => handleChange("utilitySize", val)} />
                          <FluidSlider label="Separación (Gap)" value={element.props.utilityGap || 16} min={0} max={60} onChange={(val:number) => handleChange("utilityGap", val)} />
                          <FluidSlider label="Posición Iconos" value={element.props.utilityPosX || 0} min={-200} max={200} onChange={(val:number) => handleChange("utilityPosX", val)} />
                        </div>
                      </div>
                    </ControlGroup>
                  </>
                )}
                {element.type === "footer-premium" && (
                  <>
                    <ControlGroup title="1. Identidad de Marca" icon={ImageIcon} defaultOpen={true}>
                      <div className="space-y-4">
                        <div onClick={() => triggerUpload("footerLogoUrl")} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 relative">
                          {element.props.footerLogoUrl ? <div className="relative h-12 mx-auto"><img src={element.props.footerLogoUrl} className="h-full object-contain" alt="Logo" /><button onClick={(e) => { e.stopPropagation(); handleChange("footerLogoUrl", null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md border-2 border-white"><X size={10}/></button></div> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR LOGO</p>}
                        </div>
                        <input type="text" value={element.props.logoText || ""} onChange={(e) => handleChange("logoText", e.target.value)} className="w-full p-3 border rounded-xl text-xs font-bold uppercase italic bg-gray-50" placeholder="Nombre..." />
                        <FluidSlider label="Tamaño Logo" value={element.props.footerLogoSize || 24} min={12} max={120} onChange={(val:number) => handleChange("footerLogoSize", val)} />
                      </div>
                    </ControlGroup>

                    <ControlGroup title="2. Descripción" icon={Type} defaultOpen={false}>
                      <div className="space-y-4">
                        <textarea value={element.props.description || ""} onChange={(e) => handleChange("description", e.target.value)} className="w-full p-3 border rounded-xl text-[10px] font-medium bg-white uppercase italic" placeholder="Escribe la descripción..." rows={3} />
                        <FluidSlider label="Tamaño Letra" value={element.props.footerDescSize || 12} min={10} max={100} onChange={(val:number) => handleChange("footerDescSize", val)} />
                      </div>
                    </ControlGroup>

                    <ControlGroup title="3. Secciones Informativas" icon={Layout} defaultOpen={false}>
                      <div className="space-y-6">
                        {(element.props.menuGroups || []).map((group: any, gIdx: number) => (
                          <div key={gIdx} className="p-4 border rounded-[2rem] bg-gray-50/50 space-y-4">
                            <input type="text" value={group.title} onChange={(e) => { const newGroups = [...element.props.menuGroups]; newGroups[gIdx].title = e.target.value; handleChange("menuGroups", newGroups); }} className="text-[10px] font-black uppercase tracking-widest bg-transparent border-none text-blue-600 outline-none" />
                            <div className="space-y-2">
                              {group.links.map((link: any, lIdx: number) => (
                                <div key={lIdx} className="grid grid-cols-[1.2fr_0.8fr_28px] gap-1.5 items-center">
                                  <input type="text" value={link.label} onChange={(e) => { const newGroups = [...element.props.menuGroups]; newGroups[gIdx].links[lIdx].label = e.target.value; handleChange("menuGroups", newGroups); }} className="w-full p-1.5 border rounded-lg text-[9px] font-bold" />
                                  <input type="text" value={link.url} onChange={(e) => { const newGroups = [...element.props.menuGroups]; newGroups[gIdx].links[lIdx].url = e.target.value; handleChange("menuGroups", newGroups); }} className="w-full p-1.5 border rounded-lg text-[8px] font-mono text-blue-600" />
                                  <button onClick={() => { const newGroups = [...element.props.menuGroups]; newGroups[gIdx].links = newGroups[gIdx].links.filter((_:any, i:number) => i !== lIdx); handleChange("menuGroups", newGroups); }} className="text-red-400"><Trash2 size={12}/></button>
                                </div>
                              ))}
                              <button onClick={() => { const newGroups = [...element.props.menuGroups]; newGroups[gIdx].links.push({ label: "NUEVO", url: "/" }); handleChange("menuGroups", newGroups); }} className="w-full py-1.5 border-2 border-dashed rounded-lg text-[8px] font-black text-gray-400 uppercase">+ Link</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ControlGroup>

                    <ControlGroup title="4. Redes Sociales" icon={Globe} defaultOpen={false}>
                      <div className="space-y-4">
                        <button onClick={() => handleChange("showSocial", !element.props.showSocial)} className={cn("w-full py-3 border rounded-xl text-[10px] font-black uppercase transition-all", element.props.showSocial ? "bg-gray-900 text-white" : "bg-white text-gray-400")}>Iconos: {element.props.showSocial ? "VISIBLES" : "OCULTO"}</button>
                        {element.props.showSocial && (
                          <div className="grid grid-cols-2 gap-3">
                            {(element.props.socialLinks || []).map((s: any, idx: number) => (
                              <div key={s.id} className="p-3 border rounded-2xl bg-white space-y-2 relative group">
                                <button onClick={() => handleChange("socialLinks", element.props.socialLinks.filter((_:any, i:number) => i !== idx))} className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"><X size={10}/></button>
                                <input type="text" value={s.label} onChange={(e) => { const newList = [...element.props.socialLinks]; newList[idx].label = e.target.value; handleChange("socialLinks", newList); }} className="w-full text-center text-[8px] font-black uppercase outline-none" placeholder="Nombre" />
                                <input type="text" value={s.url} onChange={(e) => { const newList = [...element.props.socialLinks]; newList[idx].url = e.target.value; handleChange("socialLinks", newList); }} className="w-full p-1 border rounded-md text-[7px] font-mono text-blue-600 outline-none" />
                              </div>
                            ))}
                            <button onClick={() => handleChange("socialLinks", [...(element.props.socialLinks || []), { id: uuidv4(), label: 'NUEVA', url: '#', platform: 'facebook' }])} className="w-full py-3 border-2 border-dashed rounded-xl text-[9px] font-black text-gray-400 uppercase">+ Añadir</button>
                          </div>
                        )}
                      </div>
                    </ControlGroup>

                    <ControlGroup title="5. Pie de Página" icon={Settings2} defaultOpen={false}>
                      <div className="space-y-4">
                        <input type="text" value={element.props.copyright || ""} onChange={(e) => handleChange("copyright", e.target.value)} className="w-full p-3 border rounded-xl text-[10px] font-bold bg-white" placeholder="© 2026 Empresa..." />
                        <FluidSlider label="Tamaño Copyright" value={element.props.footerCopySize || 10} min={8} max={40} onChange={(val:number) => handleChange("footerCopySize", val)} />
                      </div>
                    </ControlGroup>
                  </>
                )}
              </>
            )}
            {sectionKey === "body" && (
              <>
                {element.type === "product-master-view" && (
                  <>
                    <ControlGroup title="1. Galería de Producto" icon={ImageIcon} defaultOpen={true}>
                      <div className="space-y-4">
                        <div onClick={() => triggerUpload("mainImage")} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 relative transition-all">
                          {element.props.mainImage ? <img src={element.props.mainImage} className="h-20 mx-auto rounded-lg shadow-md" /> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR FOTO PRINCIPAL</p>}
                        </div>
                        <FluidSlider label="Escala Galería (%)" value={element.props.galleryScale || 100} min={50} max={150} onChange={(v:number) => handleChange("galleryScale", v)} suffix="%" />
                        <FluidSlider label="Redondeo Puntas" value={element.props.galleryRadius || 48} min={0} max={80} onChange={(v:number) => handleChange("galleryRadius", v)} />
                      </div>
                    </ControlGroup>
                    {renderModularTextDesigner({ ...element.props, content: element.props.title }, (p) => handleChange(Object.keys(p)[0] === 'content' ? 'title' : Object.keys(p)[0], Object.values(p)[0]), "2. Nombre del Producto")}
                    <ControlGroup title="3. Precio y Oferta" icon={ShoppingBag}>
                      <div className="space-y-4">
                        <input type="text" value={element.props.price || ""} onChange={(e) => handleChange("price", e.target.value)} className="w-full p-3 border rounded-xl text-lg font-black bg-gray-50 italic" placeholder="Ej: 1500000" />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.priceColor || "#2563eb"} onChange={(e) => handleChange("priceColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 font-black uppercase">Color</span></div>
                          <FluidSlider label="T. Precio" value={element.props.priceSize || 32} min={12} max={64} onChange={(v:number) => handleChange("priceSize", v)} />
                        </div>
                      </div>
                    </ControlGroup>
                    {renderModularTextDesigner({ ...element.props, content: element.props.description }, (p) => handleChange(Object.keys(p)[0] === 'content' ? 'description' : Object.keys(p)[0], Object.values(p)[0]), "4. Descripción Elite")}
                    <ControlGroup title="5. Variantes (Tallas y Colores)" icon={Sliders}>
                      <div className="space-y-6">
                        <textarea value={(element.props.variants || []).join(", ")} onChange={(e) => handleChange("variants", e.target.value.split(",").map(v => v.trim()).filter(v => v !== ""))} className="w-full p-2 border rounded-lg text-[10px] font-bold h-16" placeholder="S, M, L, XL..." />
                        <div className="flex flex-wrap gap-2">
                          {(element.props.colors || []).map((color: string, idx: number) => (
                            <div key={idx} className="relative group">
                              <input type="color" value={color} onChange={(e) => { const newCols = [...element.props.colors]; newCols[idx] = e.target.value; handleChange("colors", newCols); }} className="w-10 h-10 rounded-full cursor-pointer p-0.5 border" />
                              <button onClick={() => handleChange("colors", element.props.colors.filter((_:any, i:number) => i !== idx))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={8}/></button>
                            </div>
                          ))}
                          <button onClick={() => handleChange("colors", [...(element.props.colors || []), "#000000"])} className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center text-gray-400">+</button>
                        </div>
                      </div>
                    </ControlGroup>
                  </>
                )}
                {element.type !== "product-master-view" && (
                  <>
                    {renderModularTextDesigner(
                      { 
                        ...element.props, 
                        content: element.props.title,
                        variant: element.props.titleVariant,
                        color: element.props.titleColor,
                        size: element.props.titleSize,
                        font: element.props.titleFont,
                        aurora1: element.props.titleAurora1,
                        aurora2: element.props.titleAurora2
                      }, 
                      (p) => {
                        const updates: any = {};
                        if ('content' in p) updates.title = p.content;
                        if ('variant' in p) updates.titleVariant = p.variant;
                        if ('color' in p) updates.titleColor = p.color;
                        if ('size' in p) updates.titleSize = p.size;
                        if ('font' in p) updates.titleFont = p.font;
                        if ('aurora1' in p) updates.titleAurora1 = p.aurora1;
                        if ('aurora2' in p) updates.titleAurora2 = p.aurora2;
                        updateElement(sectionKey, selectedElementId, updates);
                      }, 
                      "Título de Impacto"
                    )}
                    
                    {renderModularTextDesigner(
                      { 
                        ...element.props, 
                        content: element.props.subtitle,
                        variant: element.props.subtitleVariant,
                        color: element.props.subtitleColor,
                        size: element.props.subtitleSize,
                        font: element.props.subtitleFont,
                        aurora1: element.props.subtitleAurora1,
                        aurora2: element.props.subtitleAurora2
                      }, 
                      (p) => {
                        const updates: any = {};
                        if ('content' in p) updates.subtitle = p.content;
                        if ('variant' in p) updates.subtitleVariant = p.variant;
                        if ('color' in p) updates.subtitleColor = p.color;
                        if ('size' in p) updates.subtitleSize = p.size;
                        if ('font' in p) updates.subtitleFont = p.font;
                        if ('aurora1' in p) updates.subtitleAurora1 = p.aurora1;
                        if ('aurora2' in p) updates.subtitleAurora2 = p.aurora2;
                        updateElement(sectionKey, selectedElementId, updates);
                      }, 
                      "Descripción"
                    )}
                    {renderModularButtonDesigner({ ...element.props, text: element.props.primaryBtnText, url: element.props.primaryBtnUrl }, (p) => handleChange(Object.keys(p)[0] === 'text' ? 'primaryBtnText' : 'primaryBtnUrl', Object.values(p)[0]), "Botón Primario")}
                    {renderModularButtonDesigner({ ...element.props, text: element.props.secondaryBtnText, url: element.props.secondaryBtnUrl }, (p) => handleChange(Object.keys(p)[0] === 'text' ? 'secondaryBtnText' : 'secondaryBtnUrl', Object.values(p)[0]), "Botón Secundario")}
                    {renderModularMultimediaDesigner({ ...element.props, floatUrl: element.props.floatUrl, linkUrl: element.props.floatLinkUrl }, (p) => { const mapping: any = { floatType: 'floatType', url: 'floatUrl', floatUrl: 'floatUrl', floatAnim: 'floatAnim', size: 'floatSize', radius: 'floatRadius', posX: 'floatPosX', posY: 'floatPosY', linkUrl: 'floatLinkUrl' }; const updates: Record<string, any> = {}; Object.keys(p).forEach(k => { if (mapping[k]) updates[mapping[k]] = p[k]; }); updateElement(sectionKey, selectedElementId, updates); }, "Imagen de Complemento", false, undefined, "floatUrl")}
                    {element.props.showNewsletter && (
                      <ControlGroup title="Configuración de Newsletter" icon={Zap} defaultOpen={false}>
                        <div className="space-y-4">
                          <input type="text" value={element.props.newsletterTitle || ""} onChange={(e) => handleChange("newsletterTitle", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold" placeholder="Título Newsletter" />
                          <input type="text" value={element.props.newsletterPlaceholder || ""} onChange={(e) => handleChange("newsletterPlaceholder", e.target.value)} className="w-full p-2 border rounded-lg text-[10px]" placeholder="Texto ayuda..." />
                          <FluidSlider label="Ancho Barra (%)" value={element.props.newsletterInputWidth || 100} min={50} max={100} onChange={(v:number) => handleChange("newsletterInputWidth", v)} suffix="%" />
                        </div>
                      </ControlGroup>
                    )}
                    {element.type === "footer-premium" && element.props.showNewsletter && (
                      <ControlGroup title="Configuración Newsletter" icon={Zap}>
                        <div className="space-y-4">
                          <input type="text" value={element.props.newsletterTitle || ""} onChange={(e) => handleChange("newsletterTitle", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold" placeholder="Título Newsletter" />
                          <input type="text" value={element.props.newsletterPlaceholder || ""} onChange={(e) => handleChange("newsletterPlaceholder", e.target.value)} className="w-full p-2 border rounded-lg text-[10px] font-bold" placeholder="Texto ayuda..." />
                        </div>
                      </ControlGroup>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
        {activeTab === "style" && (
          <div className="space-y-4">
            {sectionKey === "header" && (
              <>
                <ControlGroup title="Apariencia de Sección" icon={Palette} defaultOpen={true}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-1.5 border rounded-xl bg-white"><input type="color" value={element.props.bgColor || "#ffffff"} onChange={(e) => handleChange("bgColor", e.target.value)} className="w-6 h-6 rounded-lg p-0 cursor-pointer" /><span className="text-[9px] text-gray-400 font-black uppercase">Fondo</span></div>
                  </div>
                </ControlGroup>
                {element.type === "navbar" && (
                  <ControlGroup title="Efectos de Barra Elite" icon={Sparkles} defaultOpen={true}>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ id: "none", l: "Sólido" }, { id: "transparent", l: "Transparente" }, { id: "glass", l: "Glass" }, { id: "aurora", l: "Aurora" }].map(eff => (
                        <button key={eff.id} onClick={() => handleChange("barEffect", eff.id)} className={cn("p-2 rounded-xl border text-[9px] font-black uppercase", element.props.barEffect === eff.id ? "bg-blue-600 text-white shadow-lg" : "bg-white text-gray-400 border-gray-100")}>{eff.l}</button>
                      ))}
                    </div>
                  </ControlGroup>
                )}
                <ControlGroup title="Estructura y Tamaño" icon={Move} defaultOpen={false}>
                  <div className="space-y-6">
                    <FluidSlider label="Altura" value={element.props.height || (element.type === 'navbar' ? element.props.navHeight : 40) || 40} min={20} max={200} onChange={(v:number) => handleChange(element.type === 'navbar' ? 'navHeight' : 'height', v)} />
                  </div>
                </ControlGroup>
              </>
            )}
            {sectionKey === "body" && (
              <ControlGroup title="Estructura y Tamaño" icon={Move} defaultOpen={true}>
                <FluidSlider label="Altura del Bloque" value={element.props.height || 400} min={100} max={1200} onChange={(v:number) => handleChange("height", v)} />
              </ControlGroup>
            )}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-100 bg-white shrink-0"><button onClick={() => selectElement(null)} className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95">Confirmar Cambios</button></div>
    </div>
  );
};