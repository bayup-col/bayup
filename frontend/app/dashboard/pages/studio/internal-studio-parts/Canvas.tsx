"use client";

import React, { useEffect, useRef } from "react";
import { useStudio, SectionType } from "../context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trash2, Plus as PlusIcon, GripVertical, ShoppingBag, User, Image as ImageIcon } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";

const DroppableSection = ({ 
  section, 
  headerRef, 
  children, 
  activeSection, 
  setActiveSection 
}: { 
  section: SectionType, 
  headerRef: React.RefObject<HTMLDivElement>, 
  children: React.ReactNode,
  activeSection: SectionType,
  setActiveSection: (s: SectionType) => void
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: section,
  });

  const sectionLabels = {
    header: "Inicio / Header",
    body: "Centro / Cuerpo",
    footer: "Final / Footer"
  };

  return (
    <section
      ref={(node) => {
        setNodeRef(node);
        (headerRef as any).current = node;
      }}
      onClick={() => setActiveSection(section)}
      className={cn(
        "bg-white rounded-2xl shadow-sm transition-all duration-500 overflow-hidden relative",
        activeSection === section ? "ring-4 ring-blue-500/20 scale-[1.02]" : "opacity-80 scale-100",
        isOver && activeSection === section && "ring-4 ring-green-500/30 bg-green-50/10",
        isOver && activeSection !== section && "ring-4 ring-red-500/20 bg-red-50/10"
      )}
    >
      {isOver && activeSection === section && (
        <div className="absolute inset-0 bg-blue-500/5 pointer-events-none flex items-center justify-center border-4 border-blue-500/30 border-dashed rounded-2xl z-20">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold animate-bounce shadow-lg">
                ¡Suelta aquí!
            </div>
        </div>
      )}

      <div className="bg-gray-50/50 px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 flex justify-between items-center">
        <span>{sectionLabels[section]}</span>
        {activeSection === section && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
      </div>
      <div className="min-h-[150px] p-4">
        {children}
      </div>
    </section>
  );
};

export const Canvas = () => {
  const { pageData, activeSection, setActiveSection, selectElement, selectedElementId, removeElement, viewport } = useStudio();
  
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refs: Record<SectionType, React.RefObject<HTMLDivElement>> = {
      header: headerRef,
      body: bodyRef,
      footer: footerRef
    };

    const targetRef = refs[activeSection];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSection]);

  const viewportWidths = {
    desktop: "max-w-5xl",
    tablet: "max-w-2xl",
    mobile: "max-w-sm"
  };

  const renderElements = (section: SectionType) => {
    const data = pageData[section];
    
    if (data.elements.length === 0) {
      return (
        <div className="py-12 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
          <PlusIcon size={24} className="mb-2" />
          <p className="text-sm font-medium">Arrastra componentes aquí</p>
        </div>
      );
    }

    return data.elements.map((el) => (
      <div
        key={el.id}
        onClick={(e) => {
          e.stopPropagation();
          selectElement(el.id);
          setActiveSection(section);
        }}
        className={cn(
          "relative group transition-all duration-200 cursor-pointer mb-4 last:mb-0",
          selectedElementId === el.id ? "ring-2 ring-blue-500 rounded-lg shadow-lg z-10" : "hover:ring-1 hover:ring-blue-300 rounded-lg"
        )}
      >
        {selectedElementId === el.id && (
          <div className="absolute -top-10 left-0 bg-blue-500 text-white flex items-center gap-2 px-2 py-1 rounded-t-lg shadow-md z-30">
            <GripVertical size={12} className="text-blue-200 cursor-grab" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{el.type}</span>
            <div className="w-[1px] h-3 bg-blue-400 mx-1" />
            <button onClick={() => removeElement(section, el.id)} className="hover:text-red-200">
              <Trash2 size={12} />
            </button>
          </div>
        )}

        <div className="p-2">
          {/* BARRA DE NAVEGACIÓN (HEADER) */}
          {el.props.isNav && (
            <div className="flex items-center justify-between px-6 py-4 bg-white shadow-sm rounded-xl border border-gray-100">
               <div className="text-xl font-black italic tracking-tighter text-blue-600">
                 {el.props.logoText || "LOGO"}
               </div>
               <nav className="hidden md:flex items-center gap-8">
                  {el.props.menuItems?.map((item: string) => (
                    <span key={item} className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors uppercase tracking-widest cursor-pointer">
                      {item}
                    </span>
                  ))}
               </nav>
               <div className="flex items-center gap-4 text-gray-400">
                  <div className="p-2 hover:bg-gray-100 rounded-full relative">
                    <ShoppingBag size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                  <div className="p-2 hover:bg-gray-100 rounded-full">
                    <User size={20} />
                  </div>
               </div>
            </div>
          )}

          {/* HERO BANNER */}
          {el.type === "hero-banner" && (
            <div className="w-full h-[450px] bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl flex flex-col items-center justify-center text-white p-12 overflow-hidden relative shadow-2xl">
                <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-black/20" />
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-6xl font-black mb-6 relative z-10 text-center leading-tight tracking-tighter"
                >
                  {el.props.title}
                </motion.h1>
                <p className="text-xl opacity-80 relative z-10 text-center max-w-2xl font-medium mb-8">
                  {el.props.subtitle}
                </p>
                <button className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-2xl relative z-10 hover:scale-105 transition-all uppercase tracking-widest text-sm">
                  {el.props.buttonText || "Comprar"}
                </button>
            </div>
          )}

          {/* TEXTO ESTÁNDAR */}
          {el.type === "text" && !el.props.isNav && (
             <div 
              className="py-4"
              style={{ 
                fontSize: el.props.fontSize === "2xl" ? "32px" : el.props.fontSize === "5xl" ? "48px" : "16px", 
                textAlign: el.props.align as any,
                fontWeight: el.props.fontSize === "2xl" || el.props.fontSize === "5xl" ? "900" : "400",
                letterSpacing: "-0.025em"
              }}
             >
               {el.props.content}
             </div>
          )}

          {/* GRILLA DE PRODUCTOS / CATEGORÍAS */}
          {el.type === "product-grid" && (
            <div className={cn(
              "p-4 rounded-2xl",
              el.props.isCarousel ? "bg-white" : "bg-gray-50/50 border border-gray-100"
            )}>
                <div className="grid grid-cols-3 gap-6">
                    {(el.props.items || [1,2,3]).map((item: any, i: number) => (
                        <div key={i} className="group relative aspect-[4/5] bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col items-center justify-end p-6 hover:shadow-xl transition-all cursor-pointer">
                            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <ImageIcon size={48} className="text-gray-200" />
                            </div>
                            <div className="relative z-10 w-full text-center">
                              <span className="inline-block px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full mb-2 uppercase tracking-widest">Ver más</span>
                              <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight truncate w-full">{typeof item === 'string' ? item : `Producto ${i+1}`}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div className="flex-1 bg-gray-100 overflow-y-auto overflow-x-hidden p-8 scroll-smooth custom-scrollbar flex flex-col items-center">
      <div className={cn("w-full transition-all duration-500 space-y-6 pb-40 mx-auto", viewportWidths[viewport])}>
        
        <DroppableSection 
            section="header" 
            headerRef={headerRef} 
            activeSection={activeSection} 
            setActiveSection={setActiveSection}
        >
          {renderElements("header")}
        </DroppableSection>

        <DroppableSection 
            section="body" 
            headerRef={bodyRef} 
            activeSection={activeSection} 
            setActiveSection={setActiveSection}
        >
          {renderElements("body")}
        </DroppableSection>

        <DroppableSection 
            section="footer" 
            headerRef={footerRef} 
            activeSection={activeSection} 
            setActiveSection={setActiveSection}
        >
          {renderElements("footer")}
        </DroppableSection>

      </div>
    </div>
  );
};