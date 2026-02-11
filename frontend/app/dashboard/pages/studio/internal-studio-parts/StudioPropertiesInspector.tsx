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

// --- COMPONENTES AUXILIARES ESTABLES (FUERA DEL RENDER PRINCIPAL) ---

const FluidSlider = ({ label, value, min, max, onChange, suffix = "px" }: any) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

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
      <input 
        type="range" min={min} max={max} 
        value={localValue}
        onChange={handleLocalChange}
        className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
      />
    </div>
  );
};

const ControlGroup = ({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border border-transparent",
          isOpen ? "bg-blue-50/50 border-blue-100" : "hover:bg-gray-50"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-1.5 rounded-lg transition-colors", isOpen ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400")}>
            <Icon size={14} />
          </div>
          <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", isOpen ? "text-blue-700" : "text-gray-500")}>
            {title}
          </span>
        </div>
        <ChevronDown 
          size={14} 
          className={cn("text-gray-300 transition-transform duration-300", isOpen && "rotate-180 text-blue-500")} 
        />
      </div>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4 px-2 space-y-4 pb-2">
              {children}
            </div>
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

  // Buscar el elemento seleccionado de forma estable
  const elementData = React.useMemo(() => {
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
      const propName = element.type === "navbar" ? "logoUrl" : "imageUrl";
      handleChange(propName, url);
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans border-l border-gray-100">
      {/* CABECERA FIJA DEL INSPECTOR */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2 text-nowrap">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Editor: {element.type.replace("-", " ")}
            </h2>
            <p className="text-[9px] text-gray-400 font-mono mt-0.5">Estado Persistente</p>
          </div>
          <button
            onClick={() => selectElement(null)}
            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* TABS DE EDICIÓN */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
           {[
             { id: "content", label: "Texto", icon: Type },
             { id: "style", label: "Diseño", icon: Palette },
             { id: "animation", label: "Efectos", icon: Sparkles },
           ].map((tab) => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                  activeTab === tab.id ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5" : "text-gray-400 hover:text-gray-600"
                )}
             >
                <tab.icon size={14} />
                <span>{tab.label}</span>
             </button>
           ))}
        </div>
      </div>

      {/* CUERPO DEL EDITOR CON SCROLL PERSISTENTE */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleImageUpload} 
        />
        
        {activeTab === "content" && (
          <>
            {element.type === "announcement-bar" && (
              <ControlGroup title="Mensaje Informativo" icon={Type} defaultOpen={true}>
                <textarea
                  value={element.props.content || ""}
                  onChange={(e) => handleChange("content", e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-none bg-gray-50/30 transition-all"
                  placeholder="Ej: ¡ENVÍO GRATIS HOY!..."
                />
              </ControlGroup>
            )}

            {element.type === "navbar" && (
              <>
                <ControlGroup title="Identidad Visual" icon={ImageIcon} defaultOpen={true}>
                  <div className="space-y-6">
                    {/* SUBIDA DE LOGO */}
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase block mb-2">Logo de Marca</span>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all"
                      >
                        {element.props.logoUrl ? (
                          <div className="relative h-12 w-full flex items-center justify-center">
                            <img src={element.props.logoUrl} className="h-full object-contain" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleChange("logoUrl", null); }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Upload size={16} className="mx-auto text-gray-400" />
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Subir Logo</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TEXTO ALTERNATIVO / MARCA */}
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase block mb-2">Nombre de Tienda (Texto)</span>
                      <input
                        type="text"
                        value={element.props.logoText || ""}
                        onChange={(e) => handleChange("logoText", e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/30 font-bold"
                        placeholder="Nombre si no hay logo..."
                      />
                    </div>

                    {/* TAMAÑO Y POSICIÓN FLUIDA */}
                    <div className="pt-2 border-t border-gray-50 space-y-4">
                      <FluidSlider 
                        label="Escala del Logo"
                        value={element.props.logoSize || 24}
                        min={12} max={120}
                        onChange={(val: number) => handleChange("logoSize", val)}
                      />
                      <FluidSlider 
                        label={element.props.logoAlign === "right" ? "Distancia desde la Derecha" : "Posición Horizontal"}
                        value={element.props.logoOffset || 0}
                        min={0} max={300}
                        suffix="px"
                        onChange={(val: number) => handleChange("logoOffset", val)}
                      />
                    </div>

                    {/* POSICIÓN */}
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase block mb-2">Alineación</span>
                      <div className="flex bg-gray-100 p-1 rounded-lg border">
                        {["left", "center", "right"].map((pos) => (
                          <button 
                            key={pos}
                            onClick={() => handleChange("logoAlign", pos)}
                            className={cn(
                              "flex-1 p-2 flex justify-center rounded-md transition-all", 
                              (element.props.logoAlign === pos || (!element.props.logoAlign && pos === "left")) ? "bg-white shadow-sm text-blue-600" : "text-gray-400"
                            )}
                          >
                            {pos === "left" && <AlignLeft size={14} />}
                            {pos === "center" && <AlignCenter size={14} />}
                            {pos === "right" && <AlignRight size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* TIPOGRAFÍA (Solo si no hay logoUrl) */}
                    {!element.props.logoUrl && (
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-2">Estilo de Texto</span>
                        <select 
                          value={element.props.logoFont || "font-sans"}
                          onChange={(e) => handleChange("logoFont", e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-xl text-[10px] font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                        >
                          <option value="font-sans">Moderna (Sans)</option>
                          <option value="font-serif">Elegante (Serif)</option>
                          <option value="font-mono">Técnica (Mono)</option>
                          <option value="font-black italic">Itálica Black</option>
                        </select>
                      </div>
                    )}
                  </div>
                </ControlGroup>

                <ControlGroup title="Acciones y Carrito" icon={ShoppingBag}>
                  <div className="space-y-4">
                    {/* TIPO DE VISUALIZACIÓN */}
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase block mb-2">Mostrar como</span>
                      <div className="flex bg-gray-100 p-1 rounded-lg border">
                        {[
                          { id: "icon", label: "Icono" },
                          { id: "text", label: "Texto" },
                          { id: "both", label: "Ambos" }
                        ].map((type) => (
                          <button 
                            key={type.id}
                            onClick={() => handleChange("utilityType", type.id)}
                            className={cn(
                              "flex-1 py-1 px-2 text-[9px] font-black uppercase rounded-md transition-all", 
                              (element.props.utilityType === type.id) ? "bg-white shadow-sm text-blue-600" : "text-gray-400"
                            )}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SELECTOR DE ICONOS */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-2">Icono Carrito</span>
                        <select 
                          value={element.props.cartIcon || "ShoppingBag"}
                          onChange={(e) => handleChange("cartIcon", e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-xl text-[10px] font-bold bg-white outline-none"
                        >
                          <option value="ShoppingBag">Bolsa</option>
                          <option value="ShoppingCart">Carrito</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-2">Icono Usuario</span>
                        <select 
                          value={element.props.userIcon || "User"}
                          onChange={(e) => handleChange("userIcon", e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-xl text-[10px] font-bold bg-white outline-none"
                        >
                          <option value="User">Usuario 1</option>
                          <option value="UserCircle">Usuario 2</option>
                          <option value="LogIn">Log In</option>
                        </select>
                      </div>
                    </div>

                    {/* ENLACES EXTRA (DERECHA) */}
                    <div className="pt-2 border-t border-gray-50">
                      <span className="text-[10px] font-black text-gray-400 uppercase block mb-2">Enlaces Extra</span>
                      <div className="space-y-3">
                        {(element.props.utilityItems || []).map((item: any, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 relative group/item">
                            <button 
                              onClick={() => handleChange("utilityItems", element.props.utilityItems.filter((_:any, i:number) => i !== idx))} 
                              className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                              <X size={12}/>
                            </button>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={item.label}
                                onChange={(e) => {
                                  const newItems = [...element.props.utilityItems];
                                  newItems[idx].label = e.target.value;
                                  handleChange("utilityItems", newItems);
                                }}
                                className="p-2 border border-gray-200 rounded-lg text-[9px] font-bold uppercase outline-none bg-white"
                                placeholder="Nombre"
                              />
                              <select 
                                value={item.icon}
                                onChange={(e) => {
                                  const newItems = [...element.props.utilityItems];
                                  newItems[idx].icon = e.target.value;
                                  handleChange("utilityItems", newItems);
                                }}
                                className="p-2 border border-gray-200 rounded-lg text-[9px] font-bold bg-white outline-none"
                              >
                                <option value="HelpCircle">Ayuda</option>
                                <option value="Heart">Deseos</option>
                                <option value="Search">Buscar</option>
                                <option value="Phone">Llamar</option>
                              </select>
                            </div>
                            <input
                              type="text"
                              value={item.url}
                              onChange={(e) => {
                                const newItems = [...element.props.utilityItems];
                                newItems[idx].url = e.target.value;
                                handleChange("utilityItems", newItems);
                              }}
                              className="w-full p-2 border border-gray-200 rounded-lg text-[8px] font-mono outline-none bg-white text-blue-500"
                              placeholder="URL o /modulo"
                            />
                          </div>
                        ))}
                        <button 
                          onClick={() => handleChange("utilityItems", [...(element.props.utilityItems || []), { label: "Ayuda", icon: "HelpCircle", url: "/soporte" }])}
                          className="w-full py-2 border border-dashed border-gray-200 rounded-xl text-[8px] font-black uppercase text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-all"
                        >
                          + Añadir Enlace Estratégico
                        </button>
                      </div>
                    </div>
                  </div>
                </ControlGroup>

                <ControlGroup title="Menú de Navegación" icon={Layout}>
                  <div className="space-y-2">
                    {(element.props.menuItems || ["Inicio", "Productos", "Contacto"]).map((item: string, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newItems = [...(element.props.menuItems || ["Inicio", "Productos", "Contacto"])];
                            newItems[idx] = e.target.value;
                            handleChange("menuItems", newItems);
                          }}
                          className="flex-1 p-2 border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button 
                          onClick={() => {
                            const newItems = (element.props.menuItems || ["Inicio", "Productos", "Contacto"]).filter((_: any, i: number) => i !== idx);
                            handleChange("menuItems", newItems);
                          }}
                          className="p-2 text-red-400 hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => handleChange("menuItems", [...(element.props.menuItems || ["Inicio", "Productos", "Contacto"]), "Nuevo Link"])}
                      className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all"
                    >
                      + Añadir Enlace
                    </button>
                  </div>
                </ControlGroup>
              </>
            )}

            {element.type !== "announcement-bar" && element.type !== "navbar" && (
              <ControlGroup title="Contenido Principal" icon={Type}>
                <textarea
                  value={element.props.content !== undefined ? element.props.content : (element.props.title || "")}
                  onChange={(e) => handleChange(element.props.content !== undefined ? "content" : "title", e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] resize-none bg-gray-50/30 transition-all"
                  placeholder="Escribe aquí tu mensaje..."
                />
              </ControlGroup>
            )}

            {(element.type === "hero-banner" || element.props.subtitle !== undefined) && (
              <ControlGroup title="Subtítulo / Descripción" icon={Type}>
                <input
                  type="text"
                  value={element.props.subtitle || ""}
                  onChange={(e) => handleChange("subtitle", e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/30 transition-all"
                  placeholder="Añade un subtítulo..."
                />
              </ControlGroup>
            )}

            {(element.type === "button" || element.type === "hero-banner") && (
              <ControlGroup title="Acción (Botón)" icon={Settings2}>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={element.props.buttonText || ""}
                    onChange={(e) => handleChange("buttonText", e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/30"
                    placeholder="Texto del botón..."
                  />
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full p-3 pl-9 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/30 text-blue-600"
                      placeholder="https://tutienda.com/producto"
                    />
                    <Layout className="absolute left-3 top-3.5 text-gray-400" size={14} />
                  </div>
                </div>
              </ControlGroup>
            )}
          </>
        )}

        {activeTab === "style" && (
          <>
            <ControlGroup title="Alineación" icon={Move}>
              <div className="flex bg-gray-100 p-1 rounded-lg border">
                {["left", "center", "right"].map((pos) => (
                  <button 
                    key={pos}
                    onClick={() => handleChange("align", pos)}
                    className={cn(
                      "flex-1 p-2 flex justify-center rounded-md transition-all", 
                      (element.props.align === pos || (!element.props.align && pos === "center")) ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {pos === "left" && <AlignLeft size={16} />}
                    {pos === "center" && <AlignCenter size={16} />}
                    {pos === "right" && <AlignRight size={16} />}
                  </button>
                ))}
              </div>
            </ControlGroup>

            <ControlGroup title="Paleta de Colores" icon={Palette}>
              <div className="grid grid-cols-6 gap-2">
                {["#ffffff", "#3b82f6", "#1e293b", "#ef4444", "#10b981", "#f59e0b"].map(color => (
                  <button 
                    key={color}
                    onClick={() => handleChange("bgColor", color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center relative",
                      element.props.bgColor === color ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-100 shadow-sm"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {element.props.bgColor === color && <Check size={12} className={color === "#ffffff" ? "text-blue-500" : "text-white"} />}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                 <div>
                    <span className="text-[10px] text-gray-400 block mb-1 font-bold uppercase tracking-tighter">Tamaño</span>
                    <select 
                      value={element.props.fontSize || "md"} 
                      onChange={(e) => handleChange("fontSize", e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="xs">XS</option>
                      <option value="md">Medio</option>
                      <option value="2xl">Grande</option>
                      <option value="5xl">Hero</option>
                    </select>
                 </div>
                 <div>
                    <FluidSlider 
                      label="Opacidad"
                      value={element.props.opacity !== undefined ? element.props.opacity : 100}
                      min={0} max={100}
                      suffix="%"
                      onChange={(val: number) => handleChange("opacity", val)}
                    />
                 </div>
              </div>
            </ControlGroup>

            <ControlGroup title="Multimedia Principal" icon={ImageIcon}>
               <div 
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all active:scale-95"
               >
                  {element.props.imageUrl ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden shadow-md mb-3">
                      <img src={element.props.imageUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={20} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                      <ImageIcon size={24} className="text-gray-300 group-hover:text-blue-500" />
                    </div>
                  )}
                  <p className="text-xs font-bold text-gray-700">Cambiar Imagen</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-tighter">Formatos: JPG, PNG, WebP</p>
               </div>
            </ControlGroup>
          </>
        )}

        {activeTab === "animation" && (
           <ControlGroup title="Efectos de Revelado" icon={Sparkles}>
              <div className="space-y-2">
                 {[
                   { id: "none", label: "Ninguna", desc: "Aparición inmediata" },
                   { id: "fade", label: "Fade In", desc: "Suave y progresivo" },
                   { id: "slide", label: "Deslizar", desc: "Entrada desde abajo" },
                   { id: "zoom", label: "Zoom", desc: "Efecto de expansión" },
                 ].map(anim => (
                   <button 
                    key={anim.id}
                    onClick={() => handleChange("animation", anim.id)}
                    className={cn(
                      "w-full p-3 border rounded-xl text-left transition-all flex items-center justify-between group",
                      (element.props.animation === anim.id || (!element.props.animation && anim.id === "none")) 
                        ? "border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20" 
                        : "border-gray-100 hover:border-blue-200 hover:bg-gray-50"
                    )}
                   >
                      <div>
                        <p className={cn("text-xs font-black uppercase tracking-tight", element.props.animation === anim.id ? "text-blue-700" : "text-gray-700 group-hover:text-blue-600")}>{anim.label}</p>
                        <p className="text-[9px] text-gray-400 font-medium">{anim.desc}</p>
                      </div>
                      {(element.props.animation === anim.id || (!element.props.animation && anim.id === "none")) && <Check size={14} className="text-blue-600" />}
                   </button>
                 ))}
              </div>
           </ControlGroup>
        )}

      </div>

      {/* FOOTER DE ACCIONES */}
      <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)] shrink-0">
         <button 
          onClick={() => selectElement(null)}
          className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95"
         >
           Confirmar Cambios
         </button>
      </div>
    </div>
  );
};
