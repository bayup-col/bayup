"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { Trash2, GripVertical, Plus as PlusIcon, Monitor, Smartphone, Tablet, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudio } from "../context";
import { useCart } from "@/context/cart-context";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { SmartNavbar, SmartHero, SmartProductGrid } from "@/components/dashboard/studio/HighFidelityBlocks";

// --- HELPERS ---
export const AnnouncementSlides = ({ messages, animationType = "slide", speed = 20 }: any) => {
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    if (!messages || messages.length <= 1 || animationType === "marquee" || animationType === "rotate") return;
    const timer = setInterval(() => { setIndex((prev) => (prev + 1) % messages.length); }, 3000);
    return () => clearInterval(timer);
  }, [messages?.length, animationType]);

  if (animationType === "marquee" || animationType === "rotate") {
    const repeated = [...messages, ...messages, ...messages, ...messages];
    return (
      <div className="flex whitespace-nowrap overflow-hidden w-full relative h-full items-center">
        <div className="animate-marquee-loop flex items-center" style={{ animationDuration: `${speed || 20}s`, width: "max-content" }}>
          <div className="flex items-center gap-24 pr-24">
            {repeated.map((m, i) => <span key={i} className="flex items-center gap-8">{m} {animationType === "rotate" && "•"}</span>)}
          </div>
          <div className="flex items-center gap-24 pr-24" aria-hidden="true">
            {repeated.map((m, i) => <span key={i} className="flex items-center gap-8">{m} {animationType === "rotate" && "•"}</span>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full perspective-[1000px]">
      <AnimatePresence>
        <motion.span key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute inset-0 flex items-center justify-center">{messages[index]}</motion.span>
      </AnimatePresence>
    </div>
  );
};

export const DraggableCanvasElement = ({ 
  el, 
  section, 
  selectedElementId, 
  selectElement, 
  setActiveSection, 
  removeElement, 
  realCategories, 
  realProducts, 
  isPreview = false,
  onOpenCart = null,
  onOpenLogin = null
}: any) => {
  const { viewport } = useStudio();
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id: el.id, data: { type: el.type, id: el.id, section: section }, disabled: isPreview 
  });
  
  const elProps = {
    ...el.props,
    ...(el.props.responsiveOverrides?.[viewport] || {})
  };

  const style = { 
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, 
    opacity: isDragging ? 0.3 : 1 
  };

  return (
    <motion.div 
      ref={setNodeRef} 
      style={style} 
      {...(isPreview ? {} : { ...listeners, ...attributes })} 
      onClick={(e) => { 
        if (isPreview) return; 
        e.preventDefault();
        e.stopPropagation(); 
        selectElement(el.id); 
        setActiveSection(section); 
      }} 
      className={cn(
        "relative group transition-all duration-300", 
        !isPreview && (selectedElementId === el.id ? "ring-4 ring-blue-500 rounded-2xl shadow-2xl z-[400] scale-[1.01]" : "hover:ring-2 hover:ring-blue-300 rounded-xl")
      )}
    >
      
      {(!isPreview && selectedElementId === el.id) && (
        <div className="absolute -top-10 left-0 flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-t-xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] z-[300] border-x border-t border-blue-400 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/20 rounded-md transition-colors">
            <GripVertical size={14} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{el.type}</span>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button 
            onMouseDown={(e) => { e.stopPropagation(); removeElement(section, el.id); }} 
            className="p-1 hover:bg-red-500 rounded-md transition-all group/del"
            title="Eliminar Bloque"
          >
            <Trash2 size={14} className="group-hover/del:scale-110" />
          </button>
        </div>
      )}

      <div className={cn(!isPreview && "p-2", (el.type === "announcement-bar" || el.type === "navbar") && "p-0")}>
        
        {/* EXCLUSIVO: RENDERIZADO DE PLANTILLAS SMART */}
        {el.type === "navbar" && <SmartNavbar props={elProps} />}
        {el.type === "hero-banner" && <SmartHero props={elProps} />}
        {el.type === "product-grid" && <SmartProductGrid props={elProps} />}
        
        {/* COMPONENTES COMPLEMENTARIOS */}
        {el.type === "announcement-bar" && (
          <div className="w-full overflow-hidden flex items-center" style={{ height: `${elProps.height || 40}px`, backgroundColor: elProps.bgColor || "#004d4d" }}>
            <div className="w-full h-full flex items-center font-black uppercase" style={{ color: elProps.textColor || "#ffffff", fontSize: `${elProps.fontSize || 11}px` }}>
              <AnnouncementSlides messages={elProps.messages || ["¡BIENVENIDO!"]} animationType={elProps.messageAnimation} speed={elProps.messageSpeed} />
            </div>
          </div>
        )}

        {el.type === "footer-premium" && (
          <div className="w-full p-20 bg-slate-900 text-white text-center rounded-[3rem]">
             <h4 className="text-2xl font-black italic">{elProps.logoText || 'BAYUP STORE'}</h4>
             <p className="text-slate-400 mt-4">Todos los derechos reservados © 2026</p>
          </div>
        )}

        {/* BLOQUES DE TEXTO/IMG SIMPLES (Si existen en el JSON) */}
        {el.type === "text" && (
           <div className="p-12 text-center">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter" style={{ color: elProps.color || '#000' }}>
                {elProps.content || elProps.text || "Escribe aquí..."}
              </h2>
           </div>
        )}
      </div>
    </motion.div>
  );
};
