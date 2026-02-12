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
      if (uploadTarget.id) {
        const newList = (element.props.extraElements || []).map((item: any) => item.id === uploadTarget.id ? { ...item, [uploadTarget.key]: url } : item);
        handleChange("extraElements", newList);
      } else {
        handleChange(uploadTarget.key, url);
      }
      setUploadTarget(null);
    }
  };

  // --- RENDERERS UNIVERSALES PLATINUM ---

  const renderTextDesigner = (props: any, onUpdate: (p: any) => void, title: string, canRemove = false, onRemove?: () => void) => {
    const variant = props.variant || "solid";
    return (
      <ControlGroup title={title} icon={Type} onRemove={canRemove ? onRemove : null}>
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
            <select value={props.font || "font-sans"} onChange={(e) => onUpdate({ font: e.target.value })} className="w-full p-2 border rounded-lg text-[10px] font-bold bg-white outline-none"><option value="font-black">Impact Black</option><option value="font-sans">Modern Sans</option></select>
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

  const renderButtonDesigner = (props: any, onUpdate: (p: any) => void, title: string, canRemove = false, onRemove?: () => void) => {
    const variant = props.variant || "solid";
    return (
      <ControlGroup title={title} icon={MousePointer2} onRemove={canRemove ? onRemove : null}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Etiqueta</span><input type="text" value={props.text || ""} onChange={(e) => onUpdate({ text: e.target.value })} className="w-full p-2 border rounded-lg text-xs font-bold" /></div>
            <div><span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Vínculo</span><input type="text" value={props.url || ""} onChange={(e) => onUpdate({ url: e.target.value })} className="w-full p-2 border rounded-lg text-[10px] font-mono text-blue-600 placeholder:text-gray-300" placeholder="URL" /></div>
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
          <FluidSlider label="Redondeo de Bordes" value={props.borderRadius || 12} min={0} max={40} onChange={(val:number) => onUpdate({ borderRadius: val })} />
          <div className="grid grid-cols-2 gap-3"><FluidSlider label="Posición X" value={props.posX || 0} min={-500} max={500} onChange={(val:number) => onUpdate({ posX: val })} /><FluidSlider label="Posición Y" value={props.posY || 0} min={-200} max={200} onChange={(val:number) => onUpdate({ posY: val })} /></div>
        </div>
      </ControlGroup>
    );
  };

  const renderMultimediaDesigner = (props: any, onUpdate: (p: any) => void, title: string, canRemove = false, onRemove?: () => void) => {
    const floatType = props.floatType || "image";
    return (
      <ControlGroup title={title} icon={ImageIcon} onRemove={canRemove ? onRemove : null}>
        <div className="space-y-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {[{id:"image", l:"Imagen"}, {id:"video", l:"Video"}].map(t => (
              <button key={t.id} onClick={() => onUpdate({ floatType: t.id })} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase rounded-md transition-all", (floatType === t.id) ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}>{t.l}</button>
            ))}
          </div>
          <div onClick={() => triggerUpload("url", props.id)} className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 cursor-pointer relative">
            {props.url || props.floatUrl ? (
              <div className="relative aspect-square w-20 mx-auto rounded-lg overflow-hidden border">
                <img src={props.url || props.floatUrl} className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); onUpdate({ url: null, floatUrl: null }); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-xl border-2 border-white hover:scale-110 transition-all"><X size={12}/></button>
              </div>
            ) : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR MULTIMEDIA</p>}
          </div>
          <input type="text" value={props.url || props.floatUrl || ""} onChange={(e) => onUpdate({ url: e.target.value, floatUrl: e.target.value })} className="w-full p-2 border rounded-lg text-[10px] font-mono text-blue-600 bg-gray-50/30" placeholder="O pega URL..." />
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
            {element.type === "navbar" && (
              <ControlGroup title="Identidad Visual" icon={ImageIcon} defaultOpen={true}>
                <div className="space-y-4">
                  <div onClick={() => triggerUpload("logoUrl")} className="group border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-400 relative">
                    {element.props.logoUrl ? <div className="relative h-12 mx-auto"><img src={element.props.logoUrl} className="h-full object-contain" /><button onClick={(e) => { e.stopPropagation(); handleChange("logoUrl", null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md border-2 border-white"><X size={10}/></button></div> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR LOGO</p>}
                  </div>
                  <input type="text" value={element.props.logoText || ""} onChange={(e) => handleChange("logoText", e.target.value)} className="w-full p-3 border rounded-xl text-xs font-bold bg-gray-50/30" placeholder="Nombre de Tienda..." />
                  <FluidSlider label="Escala Logo" value={element.props.logoSize || 24} min={12} max={120} onChange={(val:number) => handleChange("logoSize", val)} />
                </div>
              </ControlGroup>
            )}

            {element.type === "hero-banner" && (
              <>
                {/* ELEMENTOS BASE */}
                {renderTextDesigner({ ...element.props, content: element.props.title, variant: element.props.titleVariant, color: element.props.titleColor, size: element.props.titleSize, posX: element.props.textPosX, posY: element.props.textPosY, font: element.props.titleFont, aurora1: element.props.titleAurora1, aurora2: element.props.titleAurora2, effect: element.props.titleEffect, intensity: element.props.titleIntensity }, (p) => {
                  const key = Object.keys(p)[0];
                  const mapping: any = { content: 'title', variant: 'titleVariant', color: 'titleColor', size: 'titleSize', posX: 'textPosX', posY: 'textPosY', font: 'titleFont', aurora1: 'titleAurora1', aurora2: 'titleAurora2', effect: 'titleEffect', intensity: 'titleIntensity' };
                  handleChange(mapping[key], p[key]);
                }, "Título de Impacto")}

                {renderTextDesigner({ ...element.props, content: element.props.subtitle, variant: element.props.subtitleVariant, color: element.props.subtitleColor, size: element.props.subtitleSize, posX: element.props.subtitlePosX, posY: element.props.subtitlePosY, font: element.props.subtitleFont, intensity: element.props.subtitleIntensity }, (p) => {
                  const key = Object.keys(p)[0];
                  const mapping: any = { content: 'subtitle', variant: 'subtitleVariant', color: 'subtitleColor', size: 'subtitleSize', posX: 'subtitlePosX', posY: 'subtitlePosY', font: 'subtitleFont', intensity: 'subtitleIntensity' };
                  handleChange(mapping[key], p[key]);
                }, "Descripción")}

                {renderButtonDesigner({ ...element.props, text: element.props.primaryBtnText, variant: element.props.primaryBtnVariant, bgColor: element.props.primaryBtnBgColor, posX: element.props.primaryBtnPosX, posY: element.props.primaryBtnPosY, size: element.props.primaryBtnSize, borderRadius: element.props.primaryBtnRadius, aurora1: element.props.primaryBtnAurora1, aurora2: element.props.primaryBtnAurora2, intensity: element.props.primaryBtnIntensity }, (p) => {
                  const key = Object.keys(p)[0];
                  const mapping: any = { text: 'primaryBtnText', variant: 'primaryBtnVariant', bgColor: 'primaryBtnBgColor', posX: 'primaryBtnPosX', posY: 'primaryBtnPosY', size: 'primaryBtnSize', borderRadius: 'primaryBtnRadius', aurora1: 'primaryBtnAurora1', aurora2: 'primaryBtnAurora2', intensity: 'primaryBtnIntensity' };
                  handleChange(mapping[key], p[key]);
                }, "Botón Primario")}

                {renderButtonDesigner({ ...element.props, text: element.props.secondaryBtnText, variant: element.props.secondaryBtnVariant, posX: element.props.secondaryBtnPosX, posY: element.props.secondaryBtnPosY }, (p) => {
                  const key = Object.keys(p)[0];
                  const mapping: any = { text: 'secondaryBtnText', variant: 'secondaryBtnVariant', posX: 'secondaryBtnPosX', posY: 'secondaryBtnPosY' };
                  handleChange(mapping[key], p[key]);
                }, "Botón Secundario")}

                {renderMultimediaDesigner(element.props, (p) => {
                  const key = Object.keys(p)[0];
                  const mapping: any = { floatType: 'floatType', url: 'floatUrl', floatUrl: 'floatUrl', floatAnim: 'floatAnim', size: 'floatSize', floatSize: 'floatSize', radius: 'floatRadius', floatRadius: 'floatRadius', posX: 'floatPosX', floatPosX: 'floatPosX', posY: 'floatPosY', floatPosY: 'floatPosY', floatLinkUrl: 'floatLinkUrl' };
                  handleChange(mapping[key], p[key]);
                }, "Imagen de Complemento")}

                {/* ELEMENTOS EXTRA CON MENÚS PLATINUM */}
                {(element.props.extraElements || []).map((extra: any) => (
                  <React.Fragment key={extra.id}>
                    {extra.type === 'text' && renderTextDesigner(extra, (p) => handleExtraChange(extra.id, p), "Texto Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                    {extra.type === 'button' && renderButtonDesigner(extra, (p) => handleExtraChange(extra.id, p), "Botón Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
                    {extra.type === 'image' && renderMultimediaDesigner(extra, (p) => handleExtraChange(extra.id, p), "Imagen/Video Extra", true, () => handleChange("extraElements", element.props.extraElements.filter((el:any) => el.id !== extra.id)))}
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

        {activeTab === "style" && (
          <div className="space-y-4">
            {element.type === "hero-banner" && (
              <ControlGroup title="Multimedia de Fondo" icon={ImageIcon} defaultOpen={true}>
                <div className="space-y-4">
                  <div className="flex bg-gray-100 p-1 rounded-lg">{[{id:"image", l:"Imagen"}, {id:"video", l:"Video"}].map(t => (<button key={t.id} onClick={() => handleChange("bgType", t.id)} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase rounded-md transition-all", (element.props.bgType === t.id || (!element.props.bgType && t.id === "image")) ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}>{t.l}</button>))}</div>
                  {element.props.bgType === "video" ? (
                    <div className="space-y-4">
                      <div onClick={() => triggerUpload("videoUrl")} className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 cursor-pointer relative transition-all">
                        {element.props.videoUrl ? <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100 bg-black flex items-center justify-center"><Play size={24} className="text-white opacity-50" /><button onClick={(e) => { e.stopPropagation(); handleChange("videoUrl", null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md border-2 border-white"><X size={12} /></button></div> : <div className="py-2"><Play size={24} className="mx-auto text-gray-300 mb-1" /><p className="text-[9px] font-bold text-gray-400 uppercase">SUBIR VIDEO (MP4, WEBM)</p></div>}
                      </div>
                      <div className="relative"><span className="text-[9px] font-black text-gray-400 uppercase block mb-1">O pega un enlace de video</span><div className="relative"><input type="text" value={element.props.videoUrl || ""} onChange={(e) => handleChange("videoUrl", e.target.value)} className="w-full p-3 pl-9 border rounded-xl text-[10px] font-mono text-blue-600 bg-gray-50/30" placeholder="https://..." /><LinkIcon size={12} className="absolute left-3 top-3.5 text-gray-400" /></div></div>
                    </div>
                  ) : (
                    <div onClick={() => triggerUpload("imageUrl")} className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 cursor-pointer transition-all relative">
                      {element.props.imageUrl ? <div className="relative"><img src={element.props.imageUrl} className="h-20 mx-auto rounded-lg shadow-sm" /><button onClick={(e) => { e.stopPropagation(); handleChange("imageUrl", null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md border-2 border-white"><X size={12}/></button></div> : <p className="text-[10px] font-bold text-gray-400 uppercase">SUBIR FONDO</p>}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">{[{id:"none", l:"Normal"}, {id:"ken-burns", l:"Ken Burns"}, {id:"zoom-out", l:"Zoom Out"}, {id:"float", l:"Flotación"}].map(e => (<button key={e.id} onClick={() => handleChange("bgEffect", e.id)} className={cn("py-2 text-[8px] font-black uppercase rounded-lg border", element.props.bgEffect === e.id ? "bg-blue-600 text-white" : "bg-white")}>{e.l}</button>))}</div>
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-50"><input type="color" value={element.props.overlayColor || "#000000"} onChange={(e) => handleChange("overlayColor", e.target.value)} className="w-10 h-10 rounded-xl p-0 border cursor-pointer" /><div className="flex-1"><FluidSlider label="Difuminado" value={element.props.overlayOpacity || 40} min={0} max={95} suffix="%" onChange={(v:number) => handleChange("overlayOpacity", v)} /></div></div>
                </div>
              </ControlGroup>
            )}
            <ControlGroup title="Estructura y Tamaño" icon={Move}>
              <div className="space-y-6">
                <div className="flex bg-gray-100 p-1 rounded-lg border">{["left", "center", "right"].map((pos) => (<button key={pos} onClick={() => handleChange("align", pos)} className={cn("flex-1 p-2 flex justify-center rounded-md transition-all", (element.props.align === pos || (!element.props.align && pos === "center")) ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600")}>{pos === "left" && <AlignLeft size={16} />}{pos === "center" && <AlignCenter size={16} />}{pos === "right" && <AlignRight size={16} />}</button>))}</div>
                <FluidSlider label="Altura" value={element.props.height || (element.type === 'navbar' ? element.props.navHeight : 400)} min={50} max={800} onChange={(v:number) => handleChange(element.type === 'hero-banner' ? 'height' : 'navHeight', v)} />
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
