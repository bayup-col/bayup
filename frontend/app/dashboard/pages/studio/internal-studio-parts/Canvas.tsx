"use client";

import React, { useEffect, useRef } from "react";
import { useStudio, SectionType } from "../context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trash2, Plus as PlusIcon, GripVertical, ShoppingBag, ShoppingCart, User, UserCircle, LogIn, Image as ImageIcon, Heart, Search, HelpCircle, Phone, X } from "lucide-react";
import { useDroppable, useDraggable } from "@dnd-kit/core";

// --- HELPERS ---

const AnnouncementSlides = ({ messages }: { messages: string[] }) => {
  const [index, setIndex] = React.useState(0);
  useEffect(() => {
    if (!messages || messages.length <= 1) return;
    const timer = setInterval(() => { setIndex((prev) => (prev + 1) % messages.length); }, 3000);
    return () => clearInterval(timer);
  }, [messages?.length]);
  return (
    <AnimatePresence mode="wait">
      <motion.span key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }} className="absolute inset-0 flex items-center justify-center text-center whitespace-nowrap">{messages[index]}</motion.span>
    </AnimatePresence>
  );
};

const DroppableSection = ({ section, headerRef, children, activeSection, setActiveSection }: any) => {
  const { setNodeRef, isOver } = useDroppable({ id: section });
  const sectionLabels = { header: "Inicio / Header", body: "Centro / Cuerpo", footer: "Final / Footer" };
  return (
    <section ref={(node) => { setNodeRef(node); if (headerRef) (headerRef as any).current = node; }} onClick={() => setActiveSection(section)} className={cn("bg-white rounded-2xl shadow-sm transition-all duration-500 overflow-hidden relative", activeSection === section ? "ring-4 ring-blue-500/20 scale-[1.02]" : "opacity-80 scale-100", isOver && "ring-4 ring-green-500/30 bg-green-50/10")}>
      <div className="bg-gray-50/50 px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 flex justify-between items-center">
        <span>{sectionLabels[section as SectionType]}</span>
        {activeSection === section && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
      </div>
      <div className="min-h-[150px] p-4">{children}</div>
    </section>
  );
};

const InsertionPoint = ({ section, index }: { section: SectionType, index: number }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `insert-${section}-${index}`, data: { section, index } });
  return (
    <div ref={setNodeRef} className={cn("relative w-full transition-all duration-300 z-40", isOver ? "h-12 my-1" : "h-4 -my-2")}>
      <div className={cn("absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full transition-all", isOver ? "bg-blue-500 scale-y-150 shadow-[0_0_20px_rgba(59,130,246,1)] opacity-100" : "bg-transparent opacity-0")} />
    </div>
  );
};

const DraggableCanvasElement = ({ el, section, selectedElementId, selectElement, setActiveSection, removeElement }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: el.id, data: { type: el.type, id: el.id, section: section, isNew: false } });
  
  const userOpacity = (el.props.opacity !== undefined ? el.props.opacity : 100) / 100;
  const style = { transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, zIndex: transform ? 100 : undefined, opacity: userOpacity };

  const getIntensityStyle = (val: number) => {
    const intensity = val !== undefined ? val : 100;
    if (intensity <= 100) return { opacity: intensity / 100, filter: "brightness(1)", textShadow: "none" };
    const extra = (intensity - 100) / 100;
    return {
      opacity: 1,
      filter: `brightness(${1 + (extra * 2)})`,
      textShadow: `0 0 ${extra * 15}px rgba(255,255,255,0.8), 0 0 ${extra * 30}px rgba(255,255,255,0.4)`
    };
  };

  const renderButton = (btnProps: any, prefix: string = "") => {
    const get = (key: string, fallback: any) => {
      const fullKey = prefix ? `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : key;
      return btnProps[fullKey] !== undefined ? btnProps[fullKey] : fallback;
    };
    const text = prefix === "primaryBtn" ? get("text", "Comprar") : prefix === "secondaryBtn" ? get("text", "Ver más") : btnProps.text || btnProps.buttonText || "Botón";
    const variant = get("variant", prefix === "secondaryBtn" ? "glass" : "solid");
    const bgColor = prefix === "primaryBtn" ? get("bgColor", "#2563eb") : prefix === "secondaryBtn" ? get("bgColor", "rgba(255,255,255,0.1)") : btnProps.bgColor || btnProps.color || "#2563eb";
    const textColor = get("textColor", "#ffffff");
    const fontFamily = get("font", btnProps.fontFamily || "font-black");
    const fontSize = get("size", btnProps.fontSize || 14);
    const intensity = get("intensity", 100);
    const posX = get("posX", 0);
    const posY = get("posY", 0);
    const borderRadius = btnProps.borderRadius !== undefined ? btnProps.borderRadius : 12;
    const a1 = get("aurora1", "#00f2ff");
    const a2 = get("aurora2", "#7000ff");
    const baseStyles: any = { transform: `translate(${posX}px, ${posY}px)`, fontSize: `${fontSize}px`, borderRadius: `${borderRadius}px`, color: textColor };
    let themeClasses = "";
    switch(variant) {
      case "glass": themeClasses = "backdrop-blur-md border border-white/20 shadow-xl"; baseStyles.backgroundColor = "rgba(255,255,255,0.1)"; break;
      case "outline": themeClasses = "border-2 bg-transparent"; baseStyles.borderColor = bgColor; baseStyles.color = bgColor; break;
      case "3d": themeClasses = "shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-1 transition-all"; baseStyles.backgroundColor = bgColor; baseStyles.borderBottom = "4px solid rgba(0,0,0,0.3)"; break;
      case "brutalist": themeClasses = "border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"; baseStyles.backgroundColor = bgColor; break;
      case "aurora": themeClasses = "border-none shadow-lg overflow-hidden"; baseStyles.background = "transparent"; break;
      default: themeClasses = "shadow-md"; baseStyles.backgroundColor = bgColor;
    }
    return (
      <motion.button key={`${text}-${variant}-${intensity}-${a1}-${a2}-${posX}-${posY}`} animate={getIntensityStyle(intensity)} className={cn("px-8 py-3 font-black uppercase tracking-widest text-[10px] relative overflow-hidden transition-all", fontFamily, themeClasses)} style={baseStyles}>
        {variant === "aurora" && <motion.div animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 z-0" style={{ background: `linear-gradient(135deg, ${a1}, ${a2}, ${a1}, ${a2})`, backgroundSize: "400% 400%" }} />}
        <span className="relative z-10">{text}</span>
        {btnProps.btnBgImage && <div className="absolute inset-0 z-0" style={{ backgroundImage: `url(${btnProps.btnBgImage})`, backgroundSize: btnProps.btnBgMode === "repeat" ? "20px auto" : "cover", backgroundRepeat: btnProps.btnBgMode === "repeat" ? "repeat" : "no-repeat", backgroundPosition: "center" }} />}
      </motion.button>
    );
  };

  const renderTextWithTheme = (text: string, props: any, prefix: string = "") => {
    const get = (key: string, fallback: any) => {
      const fullKey = prefix ? `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : key;
      return props[fullKey] !== undefined ? props[fullKey] : fallback;
    };
    const variant = get("variant", "solid");
    const color = get("color", "#1f2937");
    const size = get("size", 24);
    const font = get("font", "font-sans");
    const intensity = get("intensity", 100);
    const a1 = get("aurora1", "#00f2ff");
    const a2 = get("aurora2", "#7000ff");
    const posX = get("posX", 0);
    const posY = get("posY", 0);
    const baseStyles: any = { color: color, fontSize: `${size}px`, transform: `translate(${posX}px, ${posY}px)`, ...getIntensityStyle(intensity) };
    let themeClasses = "";
    if (variant === "aurora") {
      themeClasses = "bg-clip-text text-transparent animate-aurora-text bg-[length:200%_auto]";
      baseStyles.backgroundImage = `linear-gradient(135deg, ${a1}, ${a2}, ${a1})`;
      baseStyles.color = "transparent";
    } else if (variant === "outline") { baseStyles.WebkitTextStroke = `1px ${color}`; baseStyles.color = "transparent"; } 
    else if (variant === "3d") { baseStyles.textShadow = `0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa, 0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25), 0 10px 10px rgba(0,0,0,.2), 0 20px 20px rgba(0,0,0,.15)`; } 
    else if (variant === "brutalist") { baseStyles.textShadow = `3px 3px 0px rgba(0,0,0,1)`; baseStyles.WebkitTextStroke = `1px black`; }
    const Tag = prefix === "title" ? motion.h1 : prefix === "subtitle" ? motion.p : motion.div;
    return <Tag key={`${variant}-${intensity}-${a1}-${a2}-${posX}-${posY}`} animate={getIntensityStyle(intensity)} className={cn("uppercase italic leading-tight transition-all", font, themeClasses)} style={baseStyles}>{text}</Tag>;
  };

  return (
    <motion.div key={el.id} ref={setNodeRef} {...listeners} {...attributes} style={style} onClick={(e) => { e.stopPropagation(); selectElement(el.id); setActiveSection(section); }} className={cn("relative group transition-all duration-200 cursor-move", selectedElementId === el.id ? "ring-2 ring-blue-500 rounded-lg shadow-lg z-10" : "hover:ring-1 hover:ring-blue-300 rounded-lg", isDragging && "opacity-30 grayscale blur-[1px]")}>
      {selectedElementId === el.id && (
        <div className="absolute -top-10 left-0 bg-blue-500 text-white flex items-center gap-2 px-2 py-1 rounded-t-lg shadow-md z-30">
          <GripVertical size={12} className="text-blue-200" /><span className="text-[10px] font-bold uppercase tracking-wider">{el.type}</span>
          <button onMouseDown={(e) => { e.stopPropagation(); removeElement(section, el.id); }} className="ml-2 hover:text-red-200"><Trash2 size={12} /></button>
        </div>
      )}

      <div className={cn("p-2 pointer-events-none", el.type === "announcement-bar" && "p-0")}>
        {el.type === "announcement-bar" && (
          <div className="w-full relative overflow-hidden flex items-center transition-all" style={{ backgroundColor: el.props.bgColor || "#004d4d", color: el.props.textColor || "#ffffff", backgroundImage: el.props.bgPatternUrl ? `url(${el.props.bgPatternUrl})` : undefined, backgroundRepeat: "repeat", backgroundSize: "auto 100%", height: `${el.props.navHeight || 36}px`, minHeight: "20px", justifyContent: el.props.align === "left" ? "flex-start" : el.props.align === "right" ? "flex-end" : "center" }}>
            {(!el.props.behavior || el.props.behavior === "static") && <div className={cn("w-full uppercase tracking-[0.2em]", el.props.fontFamily || "font-black")} style={{ fontSize: `${el.props.fontSize || 11}px`, textAlign: el.props.align as any || "center" }}>{el.props.messages?.[0] || "¡NUEVA PROMOCIÓN!"}</div>}
            {el.props.behavior === "marquee" && <div className="flex whitespace-nowrap overflow-hidden"><motion.div key={el.props.speed} initial={{ x: "0%" }} animate={{ x: "-50%" }} transition={{ duration: 20 / (el.props.speed || 10) * 10, repeat: Infinity, ease: "linear" }} className={cn("flex gap-20 uppercase tracking-[0.2em]", el.props.fontFamily || "font-black")} style={{ fontSize: `${el.props.fontSize || 11}px` }}><span className="flex gap-20">{(el.props.messages || ["PROMO"]).map((msg: string, i: number) => <span key={i}>{msg}</span>)}</span><span className="flex gap-20">{(el.props.messages || ["PROMO"]).map((msg: string, i: number) => <span key={`dup-${i}`}>{msg}</span>)}</span></motion.div></div>}
            {el.props.behavior === "slide" && <div className={cn("w-full uppercase tracking-[0.2em] relative h-5 flex items-center justify-center", el.props.fontFamily || "font-black")} style={{ fontSize: `${el.props.fontSize || 11}px` }}><AnnouncementSlides messages={el.props.messages || ["PROMO"]} /></div>}
          </div>
        )}

        {el.type === "navbar" && (
          <div className={cn("flex items-center px-6 shadow-sm rounded-xl border border-gray-100 overflow-hidden", el.props.align === "left" && "justify-start gap-12", (el.props.align === "center" || !el.props.align) && "justify-between", el.props.align === "right" && "justify-end gap-12 flex-row-reverse")} style={{ height: `${el.props.navHeight || 80}px`, backgroundColor: el.props.bgColor || "#ffffff", backgroundImage: el.props.bgPatternUrl ? `url(${el.props.bgPatternUrl})` : undefined, backgroundRepeat: "repeat", backgroundSize: "auto 100%" }}>
            <div className={cn("flex items-center gap-2 shrink-0", el.props.logoFont || "font-black italic")} style={{ fontSize: `${el.props.logoSize || 20}px`, transform: `translateX(${el.props.logoAlign === "right" ? -(el.props.logoOffset || 0) : (el.props.logoOffset || 0)}px)` }}>
              {el.props.logoUrl ? <img src={el.props.logoUrl} className="object-contain" style={{ height: `${el.props.logoSize || 24}px` }} /> : <span className="tracking-tighter uppercase whitespace-nowrap" style={{ color: el.props.logoColor || "#2563eb" }}>{el.props.logoText || "LOGO"}</span>}
            </div>
            <nav className="hidden md:flex items-center gap-8">{(el.props.menuItems || []).map((item: any, idx: number) => <span key={idx} className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:opacity-70 transition-opacity" style={{ color: el.props.menuColor || "#4b5563" }}>{typeof item === 'string' ? item : item.label}</span>)}</nav>
            <div className={cn("flex items-center gap-4", el.props.logoAlign === "right" && "flex-row-reverse")}>
                <div className="hidden md:flex items-center gap-4 mr-2">
                  {el.props.utilityItems?.map((item: any, idx: number) => {
                    const icons: any = { ShoppingBag, ShoppingCart, User, UserCircle, LogIn, Heart, Search, HelpCircle, Phone };
                    const IconComp = icons[item.icon] || HelpCircle;
                    return <div key={idx} className="flex items-center gap-1.5 cursor-pointer group/util"><IconComp size={14} style={{ color: el.props.utilityColor || "#6b7280" }} /><span className="text-[9px] font-black uppercase tracking-tighter" style={{ color: el.props.utilityColor || "#6b7280" }}>{item.label}</span></div>;
                  })}
                </div>
                <div className="flex items-center gap-3" style={{ color: el.props.utilityColor || "#6b7280" }}>
                  {el.props.showUser && <div className="flex items-center gap-1 cursor-pointer hover:opacity-70">{(el.props.utilityType === "icon" || el.props.utilityType === "both") && (el.props.userIcon === "UserCircle" ? <UserCircle size={18} /> : el.props.userIcon === "LogIn" ? <LogIn size={18} /> : <User size={18} />)}<span className="text-[10px] font-black uppercase tracking-tighter">{el.props.utilityType !== "icon" && "Cuenta"}</span></div>}
                  {el.props.showCart && <div className="flex items-center gap-1 cursor-pointer relative hover:opacity-70">{(el.props.utilityType === "icon" || el.props.utilityType === "both") && <><ShoppingCart size={18} /><span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" /></>}<span className="text-[10px] font-black uppercase tracking-tighter">{el.props.utilityType !== "icon" && "Carrito"}</span></div>}
                </div>
            </div>
          </div>
        )}

        {el.type === "text" && !el.props.isNav && (
          <div className={cn("w-full transition-all flex items-center px-4 rounded-xl", el.props.fontFamily || "font-sans")} style={{ textAlign: el.props.align as any || "center", backgroundColor: el.props.bgColor || "transparent", backgroundImage: el.props.bgPatternUrl ? `url(${el.props.bgPatternUrl})` : undefined, backgroundRepeat: "repeat", backgroundSize: "auto 100%", minHeight: `${el.props.navHeight || 60}px`, justifyContent: el.props.align === "left" ? "flex-start" : el.props.align === "right" ? "flex-end" : "center" }}>
            {renderTextWithTheme(el.props.content, el.props)}
          </div>
        )}

        {el.type === "button" && (
          <div className="w-full py-4 flex" style={{ justifyContent: el.props.align === "left" ? "flex-start" : el.props.align === "right" ? "flex-end" : "center" }}>
            {renderButton(el.props)}
          </div>
        )}

        {el.type === "hero-banner" && (
          <div className={cn("w-full rounded-2xl flex flex-col p-12 overflow-hidden relative shadow-lg transition-all", el.props.align === "left" ? "items-start text-left" : el.props.align === "right" ? "items-end text-right" : "items-center text-center")} style={{ backgroundColor: el.props.bgColor || "#111827", minHeight: `${el.props.height || 400}px`, justifyContent: "center" }}>
              <motion.div 
                key={`${el.props.bgEffect}-${el.props.bgType}`}
                animate={el.props.bgEffect === "ken-burns" ? { scale: [1, 1.15] } : el.props.bgEffect === "zoom-out" ? { scale: [1.2, 1] } : el.props.bgEffect === "float" ? { y: [0, -15, 0], scale: 1.05 } : { scale: 1 }}
                transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                {el.props.bgType === "video" && el.props.videoUrl ? <video autoPlay muted loop playsInline className="w-full h-full object-cover" src={el.props.videoUrl} /> : el.props.imageUrl ? <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${el.props.imageUrl})` }} /> : null}
                <div className="absolute inset-0 transition-opacity duration-300" style={{ backgroundColor: el.props.overlayColor || "#000000", opacity: (el.props.overlayOpacity || 0) / 100 }}/>
              </motion.div>
              
              <div className={cn("relative z-10 w-full" )} style={{ transform: `translate(${el.props.textPosX || 0}px, ${el.props.textPosY || 0}px)`, display: "flex", flexDirection: "column", alignItems: el.props.align === "left" ? "flex-start" : el.props.align === "right" ? "flex-end" : "center" }}>
                {renderTextWithTheme(el.props.title, el.props, "title")}
                {renderTextWithTheme(el.props.subtitle, el.props, "subtitle")}
                <div className="flex gap-4 flex-wrap justify-inherit">
                  {el.props.primaryBtnText && renderButton(el.props, "primaryBtn")}
                  {el.props.secondaryBtnText && renderButton(el.props, "secondaryBtn")}
                </div>
              </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes auroraText { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-aurora-text { animation: auroraText 5s ease infinite; }
      `}</style>
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
    if (targetRef?.current) targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeSection]);
  const renderElements = (section: SectionType) => {
    const data = pageData[section];
    if (data.elements.length === 0) return <div className="py-12 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400"><PlusIcon size={24} className="mb-2" /><p className="text-sm font-medium">Arrastra componentes aquí</p></div>;
    return <> {data.elements.map((el, idx) => ( <React.Fragment key={el.id}> <InsertionPoint section={section} index={idx} /> <DraggableCanvasElement el={el} section={section} idx={idx} selectedElementId={selectedElementId} selectElement={selectElement} setActiveSection={setActiveSection} removeElement={removeElement} /> </React.Fragment> ))} <InsertionPoint section={section} index={data.elements.length} /> </>;
  };
  return (
    <div className="flex-1 bg-gray-100 overflow-y-auto overflow-x-hidden p-8 scroll-smooth flex flex-col items-center">
      <div className={cn("w-full transition-all duration-500 space-y-6 pb-40 mx-auto", viewportWidths[viewport])}>
        <DroppableSection section="header" headerRef={headerRef} activeSection={activeSection} setActiveSection={setActiveSection}>{renderElements("header")}</DroppableSection>
        <DroppableSection section="body" headerRef={bodyRef} activeSection={activeSection} setActiveSection={setActiveSection}>{renderElements("body")}</DroppableSection>
        <DroppableSection section="footer" headerRef={footerRef} activeSection={activeSection} setActiveSection={setActiveSection}>{renderElements("footer")}</DroppableSection>
      </div>
    </div>
  );
};