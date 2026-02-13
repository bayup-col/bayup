"use client";

import React, { useEffect, useRef } from "react";
import { useStudio, SectionType } from "../context";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { DraggableCanvasElement } from "./CanvasElements";

const DroppableSection = ({ section, headerRef, children, activeSection, setActiveSection, isPreview = false }: any) => {
  const { setNodeRef, isOver } = useDroppable({ id: section, disabled: isPreview });
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
        <span>{labels[section]}</span>
        {activeSection === section && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
      </div>
      <div className={cn("min-h-[150px]", section === "header" ? "p-0" : "p-4")}>{children}</div>
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
  const { activeSection, setActiveSection, selectElement, selectedElementId, removeElement, viewport } = studio;
  
  const [realCategories, setRealCategories] = React.useState([]);
  const [realProducts, setRealProducts] = React.useState([]);
  const headerRef = useRef(null);
  const bodyRef = useRef(null);
  const footerRef = useRef(null);
  const viewportWidths: any = { desktop: "max-w-5xl", tablet: "max-w-2xl", mobile: "max-w-sm" };

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
