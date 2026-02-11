"use client";

import React, { useEffect, useRef } from "react";
import { useStudio, SectionType } from "../context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trash2, Plus as PlusIcon, GripVertical, ShoppingBag, User, Image as ImageIcon } from "lucide-react";
import { useDroppable, useDraggable } from "@dnd-kit/core";

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

const InsertionPoint = ({ section, index }: { section: SectionType, index: number }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `insert-${section}-${index}`,
    data: { section, index }
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "relative w-full transition-all duration-300 z-40",
        isOver ? "h-12 my-1" : "h-4 -my-2" 
      )}
    >
      <div className={cn(
        "absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full transition-all",
        isOver ? "bg-blue-500 scale-y-150 shadow-[0_0_20px_rgba(59,130,246,1)] opacity-100" : "bg-transparent opacity-0"
      )} />
      {isOver && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-2xl z-50 animate-in zoom-in-95 duration-200">
          Soltar aquí
        </div>
      )}
    </div>
  );
};

const DraggableCanvasElement = ({ 
  el, 
  section, 
  idx, 
  selectedElementId, 
  selectElement, 
  setActiveSection, 
  removeElement 
}: { 
  el: any, 
  section: SectionType, 
  idx: number,
  selectedElementId: string | null,
  selectElement: (id: string | null) => void,
  setActiveSection: (s: SectionType) => void,
  removeElement: (s: SectionType, id: string) => void
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: el.id,
    data: {
      type: el.type,
      id: el.id,
      section: section,
      isNew: false
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 100,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        selectElement(el.id);
        setActiveSection(section);
      }}
      className={cn(
        "relative group transition-all duration-200 cursor-move",
        selectedElementId === el.id ? "ring-2 ring-blue-500 rounded-lg shadow-lg z-10" : "hover:ring-1 hover:ring-blue-300 rounded-lg",
        isDragging && "opacity-30 grayscale blur-[1px]"
      )}
    >
      {selectedElementId === el.id && (
        <div className="absolute -top-10 left-0 bg-blue-500 text-white flex items-center gap-2 px-2 py-1 rounded-t-lg shadow-md z-30">
          <GripVertical size={12} className="text-blue-200" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{el.type}</span>
          <div className="w-[1px] h-3 bg-blue-400 mx-1" />
          <button 
            onMouseDown={(e) => { e.stopPropagation(); removeElement(section, el.id); }} 
            className="hover:text-red-200"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      <div className={cn("p-2 pointer-events-none", el.type === "announcement-bar" && "p-0")}>
        {el.type === "announcement-bar" && (
          <div 
            className="w-full py-2 px-4 flex items-center justify-center text-center text-[11px] font-black uppercase tracking-[0.2em]"
            style={{ backgroundColor: el.props.bgColor || "#004d4d", color: el.props.textColor || "#ffffff" }}
          >
            {el.props.content || "¡NUEVA PROMOCIÓN DISPONIBLE! 🎊"}
          </div>
        )}

        {(el.type === "navbar" || el.props.isNav) && (
          <div className="flex items-center justify-between px-6 py-4 bg-white shadow-sm rounded-xl border border-gray-100">
            <div className="text-xl font-black italic tracking-tighter text-blue-600 flex items-center gap-2">
              {el.props.logoUrl ? <img src={el.props.logoUrl} className="h-8 w-auto" /> : <span>{el.props.logoText || "LOGO"}</span>}
            </div>
            <nav className="hidden md:flex items-center gap-8">
                {(el.props.menuItems || ["Inicio", "Productos"]).map((item: string) => (
                  <span key={item} className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{item}</span>
                ))}
            </nav>
            <div className="flex items-center gap-4 text-gray-400">
                <ShoppingBag size={18} />
                <User size={18} />
            </div>
          </div>
        )}

        {el.type === "hero-banner" && (
          <div className="w-full h-[300px] rounded-2xl flex flex-col items-center justify-center text-white p-8 overflow-hidden relative shadow-lg" style={{ backgroundColor: el.props.bgColor || "#111827" }}>
              <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
              <h1 className="text-4xl font-black mb-4 relative z-10 text-center uppercase italic">{el.props.title}</h1>
              <p className="text-sm opacity-80 relative z-10 text-center max-w-md font-medium mb-6">{el.props.subtitle}</p>
              <button className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-xl relative z-10 uppercase tracking-widest text-[10px]">Comprar</button>
          </div>
        )}

        {el.type === "text" && !el.props.isNav && (
          <div className="py-4 font-bold" style={{ textAlign: el.props.align as any, fontSize: el.props.fontSize === "2xl" ? "24px" : "14px" }}>
            {el.props.content}
          </div>
        )}
      </div>
    </div>
  );
};

export const Canvas = () => {
  const { pageData, activeSection, setActiveSection, selectElement, selectedElementId, removeElement, viewport } = useStudio();
  
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const viewportWidths = {
    desktop: "max-w-5xl",
    tablet: "max-w-2xl",
    mobile: "max-w-sm"
  };

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

    return (
      <>
        {data.elements.map((el, idx) => (
          <React.Fragment key={el.id}>
            <InsertionPoint section={section} index={idx} />
            <DraggableCanvasElement 
              el={el} 
              section={section} 
              idx={idx}
              selectedElementId={selectedElementId}
              selectElement={selectElement}
              setActiveSection={setActiveSection}
              removeElement={removeElement}
            />
          </React.Fragment>
        ))}
        <InsertionPoint section={section} index={data.elements.length} />
      </>
    );
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
