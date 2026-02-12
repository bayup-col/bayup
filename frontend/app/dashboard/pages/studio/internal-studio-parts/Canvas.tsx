"use client";

import React, { useEffect, useRef } from "react";
import { useStudio, SectionType } from "../context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trash2, Plus as PlusIcon, GripVertical, ShoppingBag, ShoppingCart, User, UserCircle, LogIn, Image as ImageIcon, Heart, Search, HelpCircle, Phone, X } from "lucide-react";
import { useDroppable, useDraggable } from "@dnd-kit/core";

// --- HELPERS ESTABLES ---

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
  const isBody = section === "body";
  
  const userOpacity = (el.props.opacity !== undefined ? el.props.opacity : 100) / 100;
  const style = { transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, zIndex: transform ? 100 : undefined, opacity: userOpacity };

  const getIntensityStyle = (val: number) => {
    const intensity = val !== undefined ? val : 100;
    if (intensity <= 100) return { opacity: intensity / 100, filter: "brightness(1)" };
    const extra = (intensity - 100) / 100;
    return { opacity: 1, filter: `brightness(${1 + (extra * 2)})`, textShadow: `0 0 ${extra * 20}px rgba(255,255,255,0.8)` };
  };

  const renderButton = (btnProps: any, prefix: string = "", extraId: string = "") => {
    const get = (key: string, fallback: any) => {
      const fullKey = prefix ? `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : key;
      return btnProps[fullKey] !== undefined ? btnProps[fullKey] : fallback;
    };
    
    const variant = get("variant", prefix === "secondaryBtn" ? "glass" : "solid");
    const posX = get("posX", 0);
    const posY = get("posY", 0);
    const bgColor = get("bgColor", "#2563eb");
    const textColor = get("textColor", "#ffffff");
    const size = get("size", 14);
    const intensity = get("intensity", 100);
    const text = prefix === "primaryBtn" ? get("text", "Comprar") : prefix === "secondaryBtn" ? get("text", "Ver más") : btnProps.text || "Botón";
    const radius = get("borderRadius", 12);

    let themeStyles: any = { backgroundColor: bgColor, color: textColor, fontSize: `${size}px`, borderRadius: `${radius}px` };
    let themeClasses = "relative overflow-hidden transition-all duration-200 font-black uppercase tracking-widest text-[10px] px-8 py-3";

    switch(variant) {
      case "glass": themeClasses += " backdrop-blur-md bg-white/10 border border-white/20 shadow-xl"; themeStyles.backgroundColor = undefined; break;
      case "outline": themeClasses += " border-2 bg-transparent"; themeStyles.borderColor = bgColor; themeStyles.color = bgColor; themeStyles.backgroundColor = undefined; break;
      case "3d": themeClasses += " shadow-[0_6px_0_0_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none"; break;
      case "aurora": themeClasses += " border-none shadow-lg"; themeStyles.backgroundColor = undefined; break;
      case "neon": themeClasses += " border-2"; themeStyles.borderColor = bgColor; themeStyles.boxShadow = `0 0 15px ${bgColor}, inset 0 0 5px ${bgColor}`; break;
      case "brutalist": themeClasses += " border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"; break;
      case "retro": themeStyles.boxShadow = `0 10px 40px -10px ${bgColor}`; themeStyles.filter = "brightness(1.1)"; break;
      default: themeClasses += " shadow-md";
    }

    return (
      <motion.button key={`btn-${prefix}-${extraId}-${variant}-${intensity}`} animate={{ x: posX, y: posY }} transition={{ type: "spring", stiffness: 450, damping: 30 }} className={themeClasses} style={themeStyles}>
        {variant === "aurora" && <motion.div animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 z-0" style={{ background: `linear-gradient(135deg, ${get("aurora1", "#00f2ff")}, ${get("aurora2", "#7000ff")}, ${get("aurora1", "#00f2ff")})`, backgroundSize: "400% 400%" }} />}
        <span className="relative z-10">{text}</span>
      </motion.button>
    );
  };

  const renderTextWithTheme = (text: string, props: any, prefix: string = "", extraId: string = "") => {
    const get = (key: string, fallback: any) => {
      const fullKey = prefix ? `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : key;
      return props[fullKey] !== undefined ? props[fullKey] : fallback;
    };

    const variant = get("variant", "solid");
    const intensity = get("intensity", 100);
    const posX = get("posX", 0);
    const posY = get("posY", 0);
    const effect = get("effect", "none");
    const color = get("color", isBody ? "#ffffff" : "#1f2937");

    const effectVariants = {
      none: {},
      glow: { filter: ["drop-shadow(0 0 2px rgba(255,255,255,0.5))", "drop-shadow(0 0 15px rgba(255,255,255,1))", "drop-shadow(0 0 2px rgba(255,255,255,0.5))"] },
      neon: { textShadow: [`0 0 5px ${color}`, `0 0 25px ${color}`, `0 0 5px ${color}`] },
      fire: { color: ["#ff4d00", "#ffae00", "#ff4d00"], filter: ["blur(0px)", "blur(1.5px)", "blur(0px)"] },
      float: { y: [posY, posY - 15, posY] }
    };

    const Tag = prefix === "title" ? motion.h1 : prefix === "subtitle" ? motion.p : motion.div;

    return (
      <Tag 
        key={`text-${prefix}-${extraId}-${variant}-${intensity}`}
        animate={{ x: posX, y: effect === "float" ? undefined : posY, ...getIntensityStyle(intensity), ...(effect !== "none" ? (effectVariants as any)[effect] : {}) }}
        transition={{ x: { type: "spring", stiffness: 450, damping: 30 }, y: effect === "float" ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 450, damping: 30 }, filter: { duration: 2, repeat: effect !== "none" ? Infinity : 0 }, textShadow: { duration: 1.5, repeat: effect !== "none" ? Infinity : 0 }, color: { duration: 1, repeat: effect === "fire" ? Infinity : 0 } }}
        className={cn("uppercase italic leading-tight font-black", get("font", "font-sans"), variant === "aurora" && "bg-clip-text text-transparent animate-aurora-text bg-[length:200%_auto]")}
        style={{ color: variant === "aurora" ? undefined : color, fontSize: `${get("size", 24)}px`, backgroundImage: variant === "aurora" ? `linear-gradient(135deg, ${get("aurora1", "#00f2ff")}, ${get("aurora2", "#7000ff")}, ${get("aurora1", "#00f2ff")})` : undefined }}
      >
        {text}
      </Tag>
    );
  };

  const renderFloatingElement = (item: any) => {
    if (!item.url && !item.floatUrl) return null;
    const url = item.url || item.floatUrl;
    const type = item.type || item.floatType || "image";
    const anim = item.anim || item.floatAnim || "none";
    const size = item.size || item.floatSize || 150;
    const radius = item.radius || item.floatRadius || 12;
    const posX = item.posX ?? item.floatPosX ?? 0;
    const posY = item.posY ?? item.floatPosY ?? 0;

    const animVariants = {
      none: { x: posX, y: posY, scale: 1, opacity: 1, rotate: 0 },
      float: { y: [posY, posY - 20, posY] },
      zoom: { scale: [1, 1.1, 1] },
      blink: { opacity: [1, 0.4, 1] },
      rotate: { rotate: 360 },
      pulse: { scale: [1, 1.05, 1], filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"] }
    };

    return (
      <motion.div key={item.id || 'float'} animate={anim === "none" ? animVariants.none : { x: posX, y: anim === "float" ? undefined : posY, ...(animVariants as any)[anim] }} transition={{ x: { type: "spring", stiffness: 450, damping: 30 }, y: anim === "float" ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 450, damping: 30 }, scale: { duration: 3, repeat: anim === "zoom" || anim === "pulse" ? Infinity : 0 }, opacity: { duration: 1.5, repeat: anim === "blink" ? Infinity : 0 }, rotate: { duration: 10, repeat: anim === "rotate" ? Infinity : 0, ease: "linear" } }} className="absolute z-20 overflow-hidden shadow-2xl" style={{ width: `${size}px`, height: `${size}px`, borderRadius: `${radius}px` }}>
        <a href={item.linkUrl || item.floatLinkUrl || "#"} className="w-full h-full block">{type === "video" ? <video autoPlay muted loop playsInline className="w-full h-full object-cover" src={url} /> : <img src={url} className="w-full h-full object-cover" />}</a>
      </motion.div>
    );
  };

  return (
    <motion.div key={el.id} ref={setNodeRef} {...listeners} {...attributes} style={style} onClick={(e) => { e.stopPropagation(); selectElement(el.id); setActiveSection(section); }} className={cn("relative group transition-all duration-200 cursor-move", selectedElementId === el.id ? "ring-2 ring-blue-500 rounded-lg shadow-lg z-10" : "hover:ring-1 hover:ring-blue-300 rounded-lg", isDragging && "opacity-30 grayscale blur-[1px]")}>
      {selectedElementId === el.id && <div className="absolute -top-10 left-0 bg-blue-500 text-white flex items-center gap-2 px-2 py-1 rounded-t-lg shadow-md z-30"><GripVertical size={12} className="text-blue-200" /><span className="text-[10px] font-bold uppercase tracking-wider">{el.type}</span><button onMouseDown={(e) => { e.stopPropagation(); removeElement(section, el.id); }} className="ml-2 hover:text-red-200"><Trash2 size={12} /></button></div>}
      
      <div className={cn("p-2 pointer-events-none", el.type === "announcement-bar" && "p-0")}>
        {el.type === "navbar" && <div className={cn("flex items-center px-6 shadow-sm rounded-xl border border-gray-100 overflow-hidden")} style={{ height: `${el.props.navHeight || 80}px`, backgroundColor: el.props.bgColor || "#ffffff" }}><div className={cn("flex items-center gap-2 shrink-0", el.props.logoFont || "font-black italic")} style={{ fontSize: `${el.props.logoSize || 20}px` }}>{el.props.logoUrl ? <img src={el.props.logoUrl} className="object-contain" style={{ height: `${el.props.logoSize || 24}px` }} /> : <span style={{ color: el.props.logoColor || "#2563eb" }}>{el.props.logoText || "LOGO"}</span>}</div><nav className="hidden md:flex items-center gap-8 ml-auto">{(el.props.menuItems || []).map((item: any, idx: number) => <span key={idx} className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:opacity-70 transition-opacity" style={{ color: el.props.menuColor || "#4b5563" }}>{item.label || item}</span>)}</nav></div>}
        
        {isBody && (
          <div className="w-full relative flex flex-col items-center justify-center min-h-[100px]" style={{ backgroundColor: el.props.bgColor || "transparent", minHeight: `${el.props.navHeight || 100}px` }}>
            {el.type === "text" && renderTextWithTheme(el.props.content, el.props)}
            {el.type === "button" && renderButton(el.props)}
            {el.type === "image" && renderFloatingElement(el.props)}
            
            {el.type === "hero-banner" && (
              <div className={cn("w-full rounded-2xl flex flex-col p-12 overflow-hidden relative shadow-lg transition-all items-center text-center")} style={{ backgroundColor: el.props.bgColor || "#111827", minHeight: `${el.props.height || 400}px`, justifyContent: "center" }}>
                <motion.div key={`${el.props.bgEffect}-${el.props.bgType}`} animate={el.props.bgEffect === "ken-burns" ? { scale: [1, 1.15] } : el.props.bgEffect === "zoom-out" ? { scale: [1.2, 1] } : { scale: 1 }} transition={{ duration: 8, repeat: Infinity, repeatType: "mirror" }} className="absolute inset-0 w-full h-full">{el.props.bgType === "video" && el.props.videoUrl ? <video autoPlay muted loop playsInline className="w-full h-full object-cover" src={el.props.videoUrl} /> : el.props.imageUrl ? <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${el.props.imageUrl})` }} /> : null}<div className="absolute inset-0 transition-opacity duration-300" style={{ backgroundColor: el.props.overlayColor || "#000000", opacity: (el.props.overlayOpacity || 0) / 100 }}/></motion.div>
                <div className="relative z-10 w-full flex flex-col items-center">{renderTextWithTheme(el.props.title, el.props, "title")}{renderTextWithTheme(el.props.subtitle, el.props, "subtitle")}{(el.props.extraElements || []).filter((it:any) => it.type === 'text').map((it:any) => renderTextWithTheme(it.content, it, "", it.id))}<div className="flex gap-4 flex-wrap justify-center mt-6">{el.props.primaryBtnText && renderButton(el.props, "primaryBtn")}{el.props.secondaryBtnText && renderButton(el.props, "secondaryBtn")}{(el.props.extraElements || []).filter((it:any) => it.type === 'button').map((it:any) => renderButton(it, "", it.id))}</div></div>
                {(el.props.floatUrl || el.props.floatType === "video") && renderFloatingElement({ id: 'base-float', ...el.props })}
              </div>
            )}
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
    if (targetRef?.current) targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeSection]);
  const renderElements = (section: SectionType) => {
    const data = pageData[section];
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