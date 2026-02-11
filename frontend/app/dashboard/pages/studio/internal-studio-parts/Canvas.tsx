"use client";

import React, { useEffect, useRef } from "react";
import { useStudio, SectionType } from "../context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trash2, Plus as PlusIcon, GripVertical, ShoppingBag, ShoppingCart, User, UserCircle, LogIn, Image as ImageIcon, Heart, Search, HelpCircle, Phone } from "lucide-react";
import { useDroppable, useDraggable } from "@dnd-kit/core";

// --- HELPERS PARA ANUNCIOS ---

const AnnouncementSlides = ({ messages }: { messages: string[] }) => {
  const [index, setIndex] = React.useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 flex items-center justify-center text-center whitespace-nowrap"
      >
        {messages[index]}
      </motion.span>
    </AnimatePresence>
  );
};

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
        if (headerRef) (headerRef as any).current = node;
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
    data: { type: el.type, id: el.id, section: section, isNew: false }
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: transform ? 100 : undefined,
    opacity: (el.props.opacity !== undefined ? el.props.opacity : 100) / 100
  };

  const userOpacity = (el.props.opacity !== undefined ? el.props.opacity : 100) / 100;

  const variants = {
    none: { opacity: userOpacity, y: 0, scale: 1, filter: "blur(0px)" },
    fade: { initial: { opacity: 0 }, animate: { opacity: userOpacity }, transition: { duration: 0.8 } },
    slide: { initial: { opacity: 0, y: 20 }, animate: { opacity: userOpacity, y: 0 }, transition: { duration: 0.5 } },
    zoom: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: userOpacity, scale: 1 }, transition: { duration: 0.4 } },
    blur: { initial: { opacity: 0, filter: "blur(10px)" }, animate: { opacity: userOpacity, filter: "blur(0px)" }, transition: { duration: 1 } }
  };

  const anim = (variants as any)[el.props.animation] || variants.none;

  return (
    <motion.div
      key={`${el.id}-${el.props.animation}-${el.props.behavior}-${el.props.speed}-${el.props.opacity}`}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      initial={anim.initial}
      animate={anim.animate}
      transition={anim.transition}
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
          <button onMouseDown={(e) => { e.stopPropagation(); removeElement(section, el.id); }} className="hover:text-red-200">
            <Trash2 size={12} />
          </button>
        </div>
      )}

      <div className={cn("p-2 pointer-events-none", el.type === "announcement-bar" && "p-0")}>
        {el.type === "announcement-bar" && (
          <div 
            className="w-full relative overflow-hidden flex items-center transition-all"
            style={{ 
              backgroundColor: el.props.bgColor || "#004d4d", 
              color: el.props.textColor || "#ffffff",
              backgroundImage: el.props.bgPatternUrl ? `url(${el.props.bgPatternUrl})` : undefined,
              backgroundRepeat: "repeat",
              backgroundSize: "auto 100%", // Ajuste perfecto a la altura de la barra
              height: `${el.props.navHeight || 36}px`,
              minHeight: "20px",
              justifyContent: el.props.align === "left" ? "flex-start" : el.props.align === "right" ? "flex-end" : "center"
            }}
          >
            {/* COMPORTAMIENTO: ESTÁTICO */}
            {(!el.props.behavior || el.props.behavior === "static") && (
              <div 
                className={cn("w-full transition-all uppercase tracking-[0.2em]", el.props.fontFamily || "font-black")}
                style={{ 
                  fontSize: `${el.props.fontSize || 11}px`,
                  textAlign: el.props.align as any || "center"
                }}
              >
                {el.props.messages?.[0] || el.props.content || "¡NUEVA PROMOCIÓN!"}
              </div>
            )}

            {/* COMPORTAMIENTO: TELEPROMPTER / MARQUEE */}
            {el.props.behavior === "marquee" && (
              <div className="flex whitespace-nowrap overflow-hidden">
                <motion.div 
                  initial={{ x: "0%" }}
                  animate={{ x: "-50%" }}
                  transition={{ 
                    duration: 20 / (el.props.speed || 10) * 10, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className={cn("flex gap-20 uppercase tracking-[0.2em]", el.props.fontFamily || "font-black")}
                  style={{ fontSize: `${el.props.fontSize || 11}px` }}
                >
                  <span className="flex gap-20">
                    {(el.props.messages || ["PROMO"]).map((msg: string, i: number) => <span key={i}>{msg}</span>)}
                  </span>
                  <span className="flex gap-20">
                    {(el.props.messages || ["PROMO"]).map((msg: string, i: number) => <span key={`dup-${i}`}>{msg}</span>)}
                  </span>
                </motion.div>
              </div>
            )}

            {/* COMPORTAMIENTO: SLIDE (ROTACIÓN) */}
            {el.props.behavior === "slide" && (
              <div 
                className={cn("w-full transition-all uppercase tracking-[0.2em] relative h-5 flex items-center justify-center", el.props.fontFamily || "font-black")}
                style={{ fontSize: `${el.props.fontSize || 11}px` }}
              >
                <AnnouncementSlides messages={el.props.messages || ["PROMO"]} />
              </div>
            )}
          </div>
        )}

        {el.type === "navbar" && (
          <div 
            className={cn(
              "flex items-center px-6 shadow-sm rounded-xl border border-gray-100 transition-all overflow-hidden",
              el.props.align === "left" && "justify-start gap-12",
              (el.props.align === "center" || !el.props.align) && "justify-between",
              el.props.align === "right" && "justify-end gap-12 flex-row-reverse"
            )}
            style={{ 
              height: `${el.props.navHeight || 80}px`,
              backgroundColor: el.props.bgColor || "#ffffff",
              backgroundImage: el.props.bgPatternUrl ? `url(${el.props.bgPatternUrl})` : undefined,
              backgroundRepeat: "repeat",
              backgroundSize: "100px auto"
            }}
          >
            <div 
              className={cn("flex items-center gap-2 transition-transform duration-75 shrink-0", el.props.logoFont || "font-black italic")}
              style={{ 
                fontSize: `${el.props.logoSize || 20}px`,
                transform: `translateX(${el.props.logoAlign === "right" ? -(el.props.logoOffset || 0) : (el.props.logoOffset || 0)}px)`
              }}
            >
              {el.props.logoUrl ? (
                <img src={el.props.logoUrl} className="object-contain" style={{ height: `${el.props.logoSize || 24}px` }} />
              ) : (
                <span className="tracking-tighter uppercase whitespace-nowrap" style={{ color: el.props.logoColor || "#2563eb" }}>
                  {el.props.logoText || "LOGO"}
                </span>
              )}
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
                {(el.props.menuItems || []).map((item: any, idx: number) => (
                  <span key={idx} className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:opacity-70 transition-opacity" style={{ color: el.props.menuColor || "#4b5563" }}>
                    {typeof item === 'string' ? item : item.label}
                  </span>
                ))}
            </nav>

            <div className={cn("flex items-center gap-4", el.props.logoAlign === "right" && "flex-row-reverse")}>
                <div className="hidden md:flex items-center gap-4 mr-2">
                  {el.props.utilityItems?.map((item: any, idx: number) => {
                    const icons: any = { ShoppingBag, ShoppingCart, User, UserCircle, LogIn, Heart, Search, HelpCircle, Phone };
                    const IconComp = icons[item.icon] || HelpCircle;
                    return (
                      <div key={idx} className="flex items-center gap-1.5 cursor-pointer group/util">
                        <IconComp size={14} style={{ color: el.props.utilityColor || "#6b7280" }} className="transition-colors group-hover/util:opacity-70" />
                        <span className="text-[9px] font-black uppercase tracking-tighter transition-colors group-hover/util:opacity-70" style={{ color: el.props.utilityColor || "#6b7280" }}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3" style={{ color: el.props.utilityColor || "#6b7280" }}>
                  {el.props.showUser && (
                    <div className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity">
                      {(el.props.utilityType === "icon" || el.props.utilityType === "both") && (
                        el.props.userIcon === "UserCircle" ? <UserCircle size={18} /> : 
                        el.props.userIcon === "LogIn" ? <LogIn size={18} /> : <User size={18} />
                      )}
                      {(el.props.utilityType === "text" || el.props.utilityType === "both") && (
                        <span className="text-[10px] font-black uppercase tracking-tighter">Cuenta</span>
                      )}
                    </div>
                  )}

                  {el.props.showCart && (
                    <div className="flex items-center gap-1 cursor-pointer relative hover:opacity-70 transition-opacity">
                      {(el.props.utilityType === "icon" || el.props.utilityType === "both") && (
                        <>
                          {el.props.cartIcon === "ShoppingCart" ? <ShoppingCart size={18} /> : <ShoppingBag size={18} />}
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        </>
                      )}
                      {(el.props.utilityType === "text" || el.props.utilityType === "both") && (
                        <span className="text-[10px] font-black uppercase tracking-tighter">Carrito</span>
                      )}
                    </div>
                  )}
                </div>
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
    </motion.div>
  );
};

export const Canvas = () => {
  const { pageData, activeSection, setActiveSection, selectElement, selectedElementId, removeElement, viewport } = useStudio();
  
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const viewportWidths = { desktop: "max-w-5xl", tablet: "max-w-2xl", mobile: "max-w-sm" };

  useEffect(() => {
    const refs: Record<SectionType, React.RefObject<HTMLDivElement>> = { header: headerRef, body: bodyRef, footer: footerRef };
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
            <DraggableCanvasElement el={el} section={section} idx={idx} selectedElementId={selectedElementId} selectElement={selectElement} setActiveSection={setActiveSection} removeElement={removeElement} />
          </React.Fragment>
        ))}
        <InsertionPoint section={section} index={data.elements.length} />
      </>
    );
  };

  return (
    <div className="flex-1 bg-gray-100 overflow-y-auto overflow-x-hidden p-8 scroll-smooth custom-scrollbar flex flex-col items-center">
      <div className={cn("w-full transition-all duration-500 space-y-6 pb-40 mx-auto", viewportWidths[viewport])}>
        <DroppableSection section="header" headerRef={headerRef} activeSection={activeSection} setActiveSection={setActiveSection}>{renderElements("header")}</DroppableSection>
        <DroppableSection section="body" headerRef={bodyRef} activeSection={activeSection} setActiveSection={setActiveSection}>{renderElements("body")}</DroppableSection>
        <DroppableSection section="footer" headerRef={footerRef} activeSection={activeSection} setActiveSection={setActiveSection}>{renderElements("footer")}</DroppableSection>
      </div>
    </div>
  );
};
