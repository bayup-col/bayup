"use client";

import React, { useEffect, useRef } from "react";
import { useStudio, SectionType } from "../context";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { DraggableCanvasElement } from "./CanvasElements";
import { Lock, Unlock } from "lucide-react";

const DroppableSection = ({ section, headerRef, children, activeSection, setActiveSection, isPreview = false }: any) => {
  const { setNodeRef, isOver } = useDroppable({ id: section, disabled: isPreview });
  const { pageKey, headerLocked, setHeaderLocked, footerLocked, setFooterLocked } = useStudio();

  if (isPreview) return (
    <section 
      ref={headerRef} 
      className={cn(
        "w-full relative", 
        section === "header" ? "z-[150] overflow-visible" : "z-[10]"
      )}
    >
      {children}
    </section>
  );

  const labels: any = { header: "Inicio / Header", body: "Centro / Cuerpo", footer: "Final / Footer" };
  const isHome = pageKey === "home" || pageKey === "" || pageKey === null;
  const isLocked = !isHome && (section === "header" ? headerLocked : section === "footer" ? footerLocked : false);
  const showLock = !isHome && (section === "header" || section === "footer");

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (section === "header") setHeaderLocked(!headerLocked);
    if (section === "footer") setFooterLocked(!footerLocked);
  };

  return (
    <section 
      ref={(node) => { setNodeRef(node); if (headerRef) (headerRef as any).current = node; }} 
      onClick={() => setActiveSection(section)} 
      className={cn(
        "rounded-2xl transition-all duration-500 overflow-hidden relative mb-8", 
        section === "header" ? "bg-transparent" : "bg-white shadow-sm",
        activeSection === section ? "ring-4 ring-blue-500/20 scale-[1.02]" : "opacity-80 scale-100", 
        isOver && "ring-4 ring-green-500/30 bg-green-50/10"
      )}
    >
      <div className="bg-gray-50/50 px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span>{labels[section]}</span>
          {showLock && (
            <button 
              onClick={toggleLock} 
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all border",
                isLocked ? "bg-blue-500 text-white border-blue-400 shadow-sm" : "bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-500"
              )}
            >
              {isLocked ? <Lock size={10} strokeWidth={3} /> : <Unlock size={10} strokeWidth={3} />}
              <span className="text-[8px] font-black">{isLocked ? "HEREDADO DE HOME" : "PERSONALIZADO"}</span>
            </button>
          )}
        </div>
        {activeSection === section && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
      </div>
      <div className={cn("min-h-[150px]", section === "header" ? "p-0" : "p-4")}>
        {isLocked ? (
          <div className="relative">
            <div className="absolute inset-0 bg-blue-50/5 backdrop-blur-[1px] z-20 pointer-events-none flex items-center justify-center">
               <div className="bg-white/80 px-4 py-2 rounded-2xl shadow-xl border border-blue-100 flex items-center gap-3 scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Lock size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black text-gray-600 uppercase">Sección Sincronizada con Inicio</span>
               </div>
            </div>
            {children}
          </div>
        ) : children}
      </div>
    </section>
  );
};

const InsertionPoint = ({ section, index }: any) => {
  const { setNodeRef, isOver } = useDroppable({ id: `insert-${section}-${index}`, data: { section, index } });
  return (
    <div ref={setNodeRef} className={cn("relative w-full transition-all h-4 -my-2 z-40", isOver && "h-12 my-1")}>
      <div className={cn("absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full transition-all", isOver ? "bg-blue-500 opacity-100 shadow-[0_0_20px_blue]" : "bg-transparent opacity-0")} />
    </div>
  );
};

export const Canvas = ({ overrideData = null, isPreview = false }: { overrideData?: any, isPreview?: boolean }) => {
  const studio = useStudio();
  const pageData = overrideData || studio.pageData;
  const { activeSection, setActiveSection, selectElement, selectedElementId, removeElement, viewport, pageKey } = studio;
  
  const [realCategories, setRealCategories] = React.useState<any[]>([]);
  const [realProducts, setRealProducts] = React.useState<any[]>([]);
  const headerRef = useRef(null);
  const bodyRef = useRef(null);
  const footerRef = useRef(null);
  
  // Ancho dinámico: Más amplio para Producto/Colecciones
  const isProductPage = pageKey === "colecciones";
  const viewportWidths: any = { 
    desktop: isProductPage ? "max-w-7xl" : "max-w-5xl", 
    tablet: "max-w-2xl", 
    mobile: "max-w-sm" 
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const { categoryService, productService } = await import('@/lib/api');
        const [categories, products] = await Promise.all([categoryService.getAll(token), productService.getAll(token)]);
        setRealCategories(categories || []);
        setRealProducts(products || []);
      } catch (err) { console.error("Canvas data error:", err); }
    };
    fetchData();
  }, []);

  const renderElements = (section: SectionType) => {
    const data = pageData[section];
    return (
      <>
        {data.elements.map((el: any, idx: number) => (
          <React.Fragment key={el.id}>
            {!isPreview && <InsertionPoint section={section} index={idx} />}
            <DraggableCanvasElement el={el} section={section} selectedElementId={selectedElementId} selectElement={selectElement} setActiveSection={setActiveSection} removeElement={removeElement} realCategories={realCategories} realProducts={realProducts} isPreview={isPreview} />
          </React.Fragment>
        ))}
        {!isPreview && <InsertionPoint section={section} index={data.elements.length} />}
      </>
    );
  };

  return (
    <div className={cn("flex-1 overflow-y-auto overflow-x-hidden scroll-smooth flex flex-col items-center", isPreview ? "bg-white p-0 w-full" : "bg-gray-100 p-8")}>
      <style>{` @keyframes marquee-loop { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee-loop { animation: marquee-loop 20s linear infinite; } `}</style>
      <div className={cn("w-full transition-all duration-500", !isPreview ? viewportWidths[viewport] : "max-w-none")}>
        <DroppableSection section="header" headerRef={headerRef} activeSection={activeSection} setActiveSection={setActiveSection} isPreview={isPreview}>{renderElements("header")}</DroppableSection>
        <DroppableSection section="body" headerRef={bodyRef} activeSection={activeSection} setActiveSection={setActiveSection} isPreview={isPreview}>{renderElements("body")}</DroppableSection>
        <DroppableSection section="footer" headerRef={footerRef} activeSection={activeSection} setActiveSection={setActiveSection} isPreview={isPreview}>{renderElements("footer")}</DroppableSection>
      </div>
    </div>
  );
};
