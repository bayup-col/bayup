"use client";

import React, { useEffect, useRef } from "react";
import { useStudio, SectionType } from "../context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trash2, Plus as PlusIcon, GripVertical, ShoppingBag, ShoppingCart, User, UserCircle, LogIn, Image as ImageIcon, Heart, Bell, Star, MessageSquare, Phone, Info, Search, HelpCircle, X, Monitor, Globe, Play } from "lucide-react";
import { useDroppable, useDraggable } from "@dnd-kit/core";

// --- HELPERS ESTABLES ---

const AnnouncementSlides = ({ messages, animationType = "slide", speed = 20 }: { messages: string[], animationType?: string, speed?: number }) => {
  const [index, setIndex] = React.useState(0);
  
  useEffect(() => {
    if (!messages || messages.length <= 1 || animationType === "marquee" || animationType === "rotate") return;
    const timer = setInterval(() => { setIndex((prev) => (prev + 1) % messages.length); }, 3000);
    return () => clearInterval(timer);
  }, [messages?.length, animationType]);

  const variants = {
    slide: { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -50 } },
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
    zoom: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.2 } },
    bounce: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } },
    rotate: { initial: { opacity: 0, x: 100, rotateY: 45 }, animate: { opacity: 1, x: 0, rotateY: 0 }, exit: { opacity: 0, x: -100, rotateY: -45 } }
  };

  // Lógica de Flujo Continuo (Marquesina y Rotar)
  if (animationType === "marquee" || animationType === "rotate") {
    const isRotate = animationType === "rotate";
    // Repetimos los mensajes varias veces para asegurar que llenen cualquier ancho de pantalla
    const repeatedMessages = [...messages, ...messages, ...messages, ...messages];
    
    return (
      <div className="flex whitespace-nowrap overflow-hidden w-full relative h-full items-center">
        <div 
          className="animate-marquee-loop flex items-center"
          style={{ 
            animationDuration: `${speed || 20}s`,
            width: "max-content" 
          }}
        >
          {/* Renderizamos el tren de mensajes */}
          <div className="flex items-center gap-24 pr-24">
            {repeatedMessages.map((m, i) => (
              <span key={`msg-${i}`} className="flex items-center gap-8">
                {m} {isRotate && <span className="text-white/20 text-xs">•</span>}
              </span>
            ))}
          </div>
          {/* Duplicamos el tren completo para el loop infinito perfecto */}
          <div className="flex items-center gap-24 pr-24" aria-hidden="true">
            {repeatedMessages.map((m, i) => (
              <span key={`dup-${i}`} className="flex items-center gap-8">
                {m} {isRotate && <span className="text-white/20 text-xs">•</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeVariant = (variants as any)[animationType] || variants.slide;

  return (
    <div style={{ perspective: "1000px", width: "100%", height: "100%", position: "relative" }}>
      <AnimatePresence>
        <motion.span 
          key={`${index}-${animationType}`} 
          initial={activeVariant.initial}
          animate={activeVariant.animate}
          exit={activeVariant.exit}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }} 
          className="absolute inset-0 flex items-center justify-center text-center whitespace-nowrap"
        >
          {messages[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

const DroppableSection = ({ section, headerRef, children, activeSection, setActiveSection }: any) => {
  const { setNodeRef, isOver } = useDroppable({ id: section });
  const sectionLabels = { header: "Inicio / Header", body: "Centro / Cuerpo", footer: "Final / Footer" };
  const isHeader = section === "header";

  return (
    <section ref={(node) => { setNodeRef(node); if (headerRef) (headerRef as any).current = node; }} onClick={() => setActiveSection(section)} className={cn("bg-white rounded-2xl shadow-sm transition-all duration-500 overflow-hidden relative", activeSection === section ? "ring-4 ring-blue-500/20 scale-[1.02]" : "opacity-80 scale-100", isOver && "ring-4 ring-green-500/30 bg-green-50/10")}>
      <div className="bg-gray-50/50 px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 flex justify-between items-center">
        <span>{sectionLabels[section as SectionType]}</span>
        {activeSection === section && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
      </div>
      <div className={cn("min-h-[150px]", isHeader ? "p-0" : "p-4")}>{children}</div>
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

// --- RENDERERS DE SOPORTE (FUERA DEL COMPONENTE PARA EVITAR ERRORES DE SINTAXIS) ---

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
    case "brutalist": themeClasses += " border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"; themeStyles.textShadow = "none"; break;
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

const renderTextWithTheme = (text: any, props: any, prefix: string = "", extraId: string = "", isBody = true) => {
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
  const size = get("size", 24);
  const isIcon = typeof text !== 'string';

  const getIntensityStyle = (val: number) => {
    const intensityVal = val !== undefined ? val : 100;
    if (intensityVal <= 100) return { opacity: intensityVal / 100, filter: "brightness(1)" };
    const extra = (intensityVal - 100) / 100;
    return { opacity: 1, filter: `brightness(${1 + (extra * 2)})` };
  };

  const effectVariants = {
    none: {},
    glow: { filter: [`drop-shadow(0 0 2px ${color})`, `drop-shadow(0 0 10px ${color})`, `drop-shadow(0 0 2px ${color})`] },
    neon: { filter: [`drop-shadow(0 0 5px ${color})`, `drop-shadow(0 0 20px ${color})`, `drop-shadow(0 0 5px ${color})`] },
    fire: { color: ["#ff4d00", "#ffae00", "#ff4d00"], filter: ["blur(0px)", "blur(1px)", "blur(0px)"] },
    float: { y: [posY, posY - 15, posY] }
  };

  const Tag = prefix === "title" ? motion.h1 : prefix === "subtitle" ? motion.p : motion.div;

  const fontMap: any = {
    "font-sans": "font-sans",
    "font-serif": "font-serif",
    "font-mono": "font-mono",
    "font-black": "font-black",
    "font-cursive": "font-serif italic" 
  };

  let variantStyles: any = { color: variant === "aurora" ? undefined : color };
  let extraClasses = "";
  
  if (variant === "outline") {
    if (!isIcon) {
      variantStyles.WebkitTextStroke = `1px ${color}`;
      variantStyles.color = "transparent";
    } else {
      // Técnica de 4 capas de sombra para un outline SVG perfecto
      variantStyles.filter = `drop-shadow(1px 1px 0px ${color}) drop-shadow(-1px -1px 0px ${color}) drop-shadow(1px -1px 0px ${color}) drop-shadow(-1px 1px 0px ${color})`;
      variantStyles.color = "transparent";
    }
  } else if (variant === "3d") {
    variantStyles.filter = `drop-shadow(2px 2px 0px rgba(0,0,0,0.2)) drop-shadow(4px 4px 10px rgba(0,0,0,0.1))`;
    if (!isIcon) variantStyles.textShadow = `0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa`;
  } else if (variant === "brutalist") {
    variantStyles.filter = `drop-shadow(3px 3px 0px #000)`;
  } else if (variant === "aurora") {
    extraClasses = "bg-clip-text text-transparent animate-aurora-text bg-[length:200%_auto]";
    variantStyles.backgroundImage = `linear-gradient(135deg, ${get("aurora1", "#00f2ff")}, ${get("aurora2", "#7000ff")}, ${get("aurora1", "#00f2ff")})`;
  }

  return (
    <Tag 
      key={`text-${prefix}-${extraId}-${variant}-${intensity}`}
      animate={{ x: posX, y: effect === "float" ? undefined : posY, ...getIntensityStyle(intensity), ...(effect !== "none" ? (effectVariants as any)[effect] : {}) }}
      transition={{ x: { type: "spring", stiffness: 450, damping: 30 }, y: effect === "float" ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 450, damping: 30 }, filter: { duration: 2, repeat: (effect !== "none" && effect !== "float") ? Infinity : 0 } }}
      className={cn("uppercase leading-tight font-black", fontMap[get("font", "font-sans")], extraClasses)}
      style={{ ...variantStyles, fontSize: `${size}px` }}
    >
      {isIcon ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: variant === "aurora" ? variantStyles.backgroundImage : "none",
          WebkitBackgroundClip: variant === "aurora" ? "text" : "unset",
          backgroundClip: variant === "aurora" ? "text" : "unset",
          WebkitTextFillColor: variant === "aurora" ? "transparent" : "unset",
          color: variant === "aurora" ? "transparent" : "inherit",
        }}>
          {variant === "aurora" ? React.cloneElement(text as React.ReactElement, { stroke: "currentColor" }) : text}
        </div>
      ) : text}
    </Tag>
  );
};

const renderFloatingElement = (item: any) => {
  const url = item.url || item.floatUrl || item.imageUrl || item.videoUrl;
  if (!url && item.type !== 'video') return null;
  
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
      <div className="w-full h-full relative">
        {type === "video" ? (
          <video autoPlay muted loop playsInline className="w-full h-full object-cover" src={url} />
        ) : (
          <img src={url} className="w-full h-full object-cover" alt="" />
        )}
      </div>
    </motion.div>
  );
};

// --- COMPONENTE DRAGGABLE ELEMENT ---

const DraggableCanvasElement = ({ el, section, selectedElementId, selectElement, setActiveSection, removeElement, realCategories, realProducts }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: el.id, data: { type: el.type, id: el.id, section: section, isNew: false } });
  const isBody = section === "body";
  
  const userOpacity = (el.props.opacity !== undefined ? el.props.opacity : 100) / 100;
  const style = { transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, zIndex: transform ? 100 : undefined, opacity: userOpacity };

  return (
    <motion.div key={el.id} ref={setNodeRef} {...listeners} {...attributes} style={style} onClick={(e) => { e.stopPropagation(); selectElement(el.id); setActiveSection(section); }} className={cn("relative group transition-all duration-200 cursor-move", selectedElementId === el.id ? "ring-2 ring-blue-500 rounded-lg shadow-lg z-10" : "hover:ring-1 hover:ring-blue-300 rounded-lg", isDragging && "opacity-30 grayscale blur-[1px]")}>
      {selectedElementId === el.id && <div className="absolute -top-10 left-0 bg-blue-500 text-white flex items-center gap-2 px-2 py-1 rounded-t-lg shadow-md z-30"><GripVertical size={12} className="text-blue-200" /><span className="text-[10px] font-bold uppercase tracking-wider">{el.type}</span><button onMouseDown={(e) => { e.stopPropagation(); removeElement(section, el.id); }} className="ml-2 hover:text-red-200"><Trash2 size={12} /></button></div>}
      
      <div className={cn("p-2 pointer-events-none", el.type === "announcement-bar" && "p-0")}>
        {el.type === "announcement-bar" && (
          <div 
            className="w-full relative overflow-hidden flex items-center transition-all duration-500"
            style={{ 
              height: `${el.props.height || 40}px`, 
              backgroundColor: el.props.bgColor || "#004d4d" 
            }}
          >
            <div 
              className={cn("w-full h-full flex items-center font-black uppercase tracking-[0.2em]", el.props.font || "font-sans")}
              style={{ 
                color: el.props.textColor || "#ffffff",
                fontSize: `${el.props.fontSize || 11}px`
              }}
            >
              <AnnouncementSlides 
                messages={el.props.messages || ["¡PROMOCIÓN DISPONIBLE!"]} 
                animationType={el.props.messageAnimation}
                speed={el.props.messageSpeed}
              />
            </div>
          </div>
        )}

        {/* FOOTER PREMIUM */}
        {section === "footer" && el.type === "footer-premium" && (
          <div className="w-full py-16 px-12 rounded-[3rem] shadow-2xl transition-all" style={{ backgroundColor: el.props.bgColor || "#111827", color: el.props.textColor || "#ffffff" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {/* COL 1: Identidad */}
              <div className="space-y-6">
                <div 
                  className="transition-all duration-300 relative" 
                  style={{ transform: `translate(${el.props.footerLogoPosX || 0}px, ${el.props.footerLogoPosY || 0}px)` }}
                >
                  {el.props.footerLogoUrl ? (
                    <img src={el.props.footerLogoUrl} className="object-contain" style={{ height: `${el.props.footerLogoSize || 24}px` }} alt="Footer Logo" />
                  ) : (
                    renderTextWithTheme(el.props.logoText || "LOGO", {
                      ...el.props,
                      variant: el.props.footerLogoVariant,
                      effect: el.props.footerLogoEffect,
                      color: el.props.footerLogoColor,
                      size: el.props.footerLogoSize,
                      font: el.props.footerLogoFont,
                      aurora1: el.props.footerLogoAurora1,
                      aurora2: el.props.footerLogoAurora2
                    }, "footerLogo", el.id, false)
                  )}
                </div>
                
                <div 
                  className="transition-all duration-300 relative" 
                  style={{ transform: `translate(${el.props.footerDescPosX || 0}px, ${el.props.footerDescPosY || 0}px)` }}
                >
                  {renderTextWithTheme(el.props.description, {
                    ...el.props,
                    variant: el.props.footerDescVariant,
                    effect: el.props.footerDescEffect,
                    color: el.props.footerDescColor,
                    size: el.props.footerDescSize,
                    font: el.props.footerDescFont,
                    aurora1: el.props.footerDescAurora1,
                    aurora2: el.props.footerDescAurora2
                  }, "footerDesc", el.id, false)}
                </div>

                {el.props.showSocial && (
                  <div className="flex flex-wrap gap-4 pt-4">
                    {(el.props.socialLinks || []).map((s: any) => (
                      <div key={s.id} className="group flex flex-col items-center gap-1.5 cursor-pointer">
                        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all overflow-hidden">
                          {s.iconUrl ? (
                            <img src={s.iconUrl} className="h-full w-full object-cover" alt="" />
                          ) : (
                            <span className="text-[10px] font-black uppercase">
                              {s.platform === 'facebook' ? <Globe size={18}/> : 
                               s.platform === 'instagram' ? <ImageIcon size={18}/> : 
                               s.platform === 'whatsapp' ? <MessageSquare size={18}/> : 
                               s.platform === 'tiktok' ? <Play size={18}/> : s.label.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="text-[7px] font-black uppercase text-white/40 group-hover:text-white transition-colors">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* COL 2 & 3: Menús */}
              {(el.props.menuGroups || [])
                .filter((group: any) => group.show !== false)
                .map((group: any, idx: number) => (
                <div 
                  key={idx} 
                  className="space-y-6 transition-all duration-300"
                  style={{ transform: `translate(${group.posX || 0}px, ${group.posY || 0}px)` }}
                >
                  <h4 
                    className={cn("uppercase tracking-[0.2em]", group.titleFont || "font-black")} 
                    style={{ 
                      color: group.titleColor || el.props.accentColor || "#00f2ff",
                      fontSize: `${group.titleSize || 10}px`
                    }}
                  >
                    {group.title}
                  </h4>
                  <ul 
                    className="flex flex-col"
                    style={{ gap: `${group.linksGap || 16}px` }}
                  >
                    {(group.links || []).map((link: any, lIdx: number) => (
                      <li 
                        key={lIdx} 
                        className="font-bold hover:translate-x-2 transition-all cursor-pointer"
                        style={{ 
                          color: group.linksColor || "#ffffff",
                          fontSize: `${group.linksSize || 14}px`,
                          opacity: (group.linksOpacity !== undefined ? group.linksOpacity : 40) / 100
                        }}
                      >
                        {link.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* COL 4: Newsletter */}
              <div 
                className="space-y-6 transition-all duration-300 relative"
                style={{ transform: `translate(${el.props.newsletterPosX || 0}px, ${el.props.newsletterPosY || 0}px)` }}
              >
                {el.props.showNewsletter && (
                  <div className="space-y-6">
                    <div className="relative">
                      {renderTextWithTheme(el.props.newsletterTitle || "Suscripción Pro", {
                        ...el.props,
                        variant: el.props.newsletterTitleVariant,
                        effect: el.props.newsletterTitleEffect,
                        color: el.props.newsletterTitleColor,
                        size: el.props.newsletterTitleSize,
                        font: el.props.newsletterTitleFont,
                        aurora1: el.props.newsletterTitleAurora1,
                        aurora2: el.props.newsletterTitleAurora2
                      }, "newsletterTitle", el.id, false)}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder={el.props.newsletterPlaceholder}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-white/30 transition-all"
                        />
                        <button className="absolute right-2 top-2 h-10 w-10 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: el.props.accentColor || "#00f2ff", color: "#000" }}>
                          <PlusIcon size={18} />
                        </button>
                      </div>
                      <p className="text-[9px] opacity-40 italic">Únete a nuestra comunidad exclusiva.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 relative">
              <div 
                className="transition-all duration-300"
                style={{ transform: `translate(${el.props.footerCopyPosX || 0}px, ${el.props.footerCopyPosY || 0}px)` }}
              >
                {renderTextWithTheme(el.props.copyright, {
                  ...el.props,
                  variant: el.props.footerCopyVariant,
                  effect: el.props.footerCopyEffect,
                  color: el.props.footerCopyColor,
                  size: el.props.footerCopySize,
                  font: el.props.footerCopyFont,
                  aurora1: el.props.footerCopyAurora1,
                  aurora2: el.props.footerCopyAurora2
                }, "footerCopy", el.id, false)}
              </div>
              <div className="flex gap-6 opacity-30 text-[10px] font-black uppercase">
                <span>Privacidad</span>
                <span>Términos</span>
                <span>Cookies</span>
              </div>
            </div>
          </div>
        )}

        {el.type === "navbar" && (
          <div className={cn("flex items-center px-6 shadow-sm rounded-xl border border-gray-100 overflow-hidden")} style={{ height: `${el.props.navHeight || 80}px`, backgroundColor: el.props.bgColor || "#ffffff" }}>
            <div 
              className="flex items-center gap-2 shrink-0 transition-all duration-300" 
              style={{ transform: `translateX(${el.props.logoPosX || 0}px)` }}
            >
              {el.props.logoUrl ? (
                <img src={el.props.logoUrl} className="object-contain" style={{ height: `${el.props.logoSize || 24}px` }} alt="Logo" />
              ) : (
                <div className="relative">
                  {renderTextWithTheme(el.props.logoText || "LOGO", { 
                    ...el.props, 
                    variant: el.props.logoVariant, 
                    effect: el.props.logoEffect,
                    color: el.props.logoColor,
                    size: el.props.logoSize,
                    font: el.props.logoFont,
                    aurora1: el.props.logoAurora1,
                    aurora2: el.props.logoAurora2
                  }, "logo", el.id, false)}
                </div>
              )}
            </div>
            
            <nav 
              className="hidden md:flex items-center ml-auto transition-all duration-300"
              style={{ 
                transform: `translateX(${el.props.menuPosX || 0}px)`,
                gap: `${el.props.menuGap || 32}px`
              }}
            >
              {(el.props.menuItems || []).map((item: any, idx: number) => (
                <div key={idx} className="cursor-pointer hover:opacity-70 transition-opacity">
                  {renderTextWithTheme(item.label || item, el.props, "menu", `${el.id}-${idx}`, false)}
                </div>
              ))}
            </nav>

            <div 
              className="flex items-center ml-8 border-l border-gray-100 pl-8 transition-all duration-300"
              style={{ 
                transform: `translateX(${el.props.utilityPosX || 0}px)`,
                gap: `${el.props.utilityGap || 16}px`
              }}
            >
              {[
                { id: 'search', show: el.props.showSearch, icon: Search, label: 'Búsqueda' },
                { id: 'user', show: el.props.showUser, icon: User, label: 'Acceso' },
                { id: 'cart', show: el.props.showCart, icon: ShoppingCart, label: 'Carrito' },
                ...(el.props.extraUtilities || []).map((u: any) => {
                  const iconMap: any = { Heart, Bell, Star, MessageSquare, Phone, Info };
                  return { ...u, icon: iconMap[u.icon] || HelpCircle };
                })
              ].map((util) => {
                if (!util.show && util.show !== undefined) return null;
                
                const mode = el.props.utilityDisplayMode || "icon";
                
                return (
                  <div key={util.id} className="cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-2">
                    {(mode === "icon" || mode === "both") && (
                      <div className="relative">
                        {renderTextWithTheme(<util.icon size={el.props.utilitySize || 18} />, {
                          ...el.props,
                          variant: "solid", // Forzamos sólido para evitar errores de temas
                          effect: el.props.utilityEffect,
                          color: el.props.utilityColor,
                          size: el.props.utilitySize
                        }, "utility", `${el.id}-${util.id}`, false)}
                      </div>
                    )}
                    {(mode === "text" || mode === "both") && (
                      <div className="relative">
                        {renderTextWithTheme(util.label, {
                          ...el.props,
                          variant: "solid",
                          effect: el.props.utilityEffect,
                          color: el.props.utilityColor,
                          size: (el.props.utilitySize || 18) * 0.7,
                          font: el.props.utilityFont
                        }, "utility", `${el.id}-${util.id}-txt`, false)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {isBody && (
          <div className={cn("w-full rounded-2xl flex flex-col p-12 overflow-hidden relative shadow-lg transition-all items-center text-center")} style={{ backgroundColor: el.props.bgColor || "#111827", minHeight: `${el.props.height || 400}px`, justifyContent: "center" }}>
            {/* Fondo Multimedia Universal */}
            <motion.div key={`${el.props.bgEffect}-${el.props.bgType}`} animate={el.props.bgEffect === "ken-burns" ? { scale: [1, 1.15] } : el.props.bgEffect === "zoom-out" ? { scale: [1.2, 1] } : { scale: 1 }} transition={{ duration: 8, repeat: Infinity, repeatType: "mirror" }} className="absolute inset-0 w-full h-full">
              {el.props.bgType === "video" && el.props.videoUrl ? <video autoPlay muted loop playsInline className="w-full h-full object-cover" src={el.props.videoUrl} /> : el.props.imageUrl ? <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${el.props.imageUrl})` }} /> : null}
              <div className="absolute inset-0 transition-opacity duration-300" style={{ backgroundColor: el.props.overlayColor || "#000000", opacity: (el.props.overlayOpacity || 0) / 100 }}/>
            </motion.div>

            {/* Contenido Principal */}
            <div className="relative z-10 w-full flex flex-col items-center">
              {renderTextWithTheme(el.props.title, el.props, "title", "", true)}
              {renderTextWithTheme(el.props.subtitle, el.props, "subtitle", "", true)}
              
              {/* Renderizado Específico según Tipo */}
              <div className="w-full my-8">
                                {el.type === "product-grid" && (
                                  <>
                                    <style>{`
                                                            @keyframes aurora-text {
                                                              0% { background-position: 0% 50%; }
                                                              50% { background-position: 100% 50%; }
                                                              100% { background-position: 0% 50%; }
                                                            }
                                                                                  @keyframes marquee {
                                                                                    0% { transform: translateX(0); }
                                                                                    100% { transform: translateX(-50%); }
                                                                                  }
                                                                                  .animate-marquee-loop {
                                                                                    display: flex;
                                                                                    width: fit-content;
                                                                                    animation: marquee 20s linear infinite;
                                                                                  }
                                                                                  .animate-aurora-text {                                        animation: aurora-text 5s linear infinite;
                                      }
                                      .scrollbar-glass::-webkit-scrollbar { height: 8px; }
                                      .scrollbar-glass::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
                                      .scrollbar-glass::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); border-radius: 10px; border: 2px solid rgba(255,255,255,0.1); }
                                      
                                      .scrollbar-neon::-webkit-scrollbar { height: 8px; }
                                      .scrollbar-neon::-webkit-scrollbar-track { background: #000; }
                                      .scrollbar-neon::-webkit-scrollbar-thumb { background: #00f2ff; border-radius: 0px; box-shadow: 0 0 10px #00f2ff; }
                                      
                                      .scrollbar-minimal::-webkit-scrollbar { height: 4px; }
                                      .scrollbar-minimal::-webkit-scrollbar-track { background: transparent; }
                                      .scrollbar-minimal::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 20px; }
                                    `}</style>
                    <div 
                      className={cn(
                        "w-full transition-all duration-500", 
                        el.props.layout === "carousel" ? "flex overflow-x-auto pb-8 gap-x-6" : "grid",
                        el.props.layout === "carousel" && !el.props.showScrollbar && "no-scrollbar",
                        el.props.layout === "carousel" && el.props.showScrollbar && el.props.scrollbarStyle === "glass" && "scrollbar-glass",
                        el.props.layout === "carousel" && el.props.showScrollbar && el.props.scrollbarStyle === "neon" && "scrollbar-neon",
                        el.props.layout === "carousel" && el.props.showScrollbar && el.props.scrollbarStyle === "minimal" && "scrollbar-minimal"
                      )} 
                      style={{ 
                        gridTemplateColumns: el.props.layout === "grid" ? `repeat(${el.props.columns || 4}, minmax(0, 1fr))` : undefined,
                        gap: `${el.props.gridGap || 24}px`,
                        height: el.props.height ? `${el.props.height}px` : "auto",
                        minHeight: "200px"
                      }}
                    >
                    {(el.props.selectedCategory === "all" || !el.props.selectedCategory
                      ? (realProducts || []).slice(0, el.props.itemsCount || 4)
                      : (realProducts || []).filter((p: any) => {
                          const pCat = String(p.collection_id || p.category_id || "");
                          const selectedCat = String(el.props.selectedCategory);
                          return pCat === selectedCat;
                        }).slice(0, el.props.itemsCount || 4)
                    ).map((product: any, i: number) => {
                      // Construcción robusta de la URL de imagen
                      let imageUrl = null;
                      const rawImg = product.image_url;
                      
                      if (typeof rawImg === 'string' && rawImg) {
                        if (rawImg.startsWith('http')) {
                          imageUrl = rawImg;
                        } else {
                          // Limpiamos la ruta para evitar duplicados como /uploads/uploads/
                          const cleanPath = rawImg.replace(/^\/?uploads\/?/, '');
                          imageUrl = `http://localhost:8000/uploads/${cleanPath}`;
                        }
                      }

                      return (
                        <div 
                          key={product.id || i} 
                          className={cn(
                            "group/card relative transition-all duration-300 flex flex-col items-center text-center",
                            el.props.cardStyle === "premium" && "bg-white p-4 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-2xl hover:-translate-y-2",
                            el.props.cardStyle === "minimal" && "p-2 hover:bg-gray-50/50",
                            el.props.cardStyle === "glass" && "bg-white/10 backdrop-blur-xl border border-white/20 p-4 shadow-2xl hover:bg-white/20",
                                                      el.props.layout === "carousel" && "min-w-[280px]"
                                                    )}
                                                    style={{ 
                                                      borderRadius: `${el.props.cardBorderRadius || 20}px`,
                                                      height: `${el.props.cardHeight || 450}px`
                                                    }}
                                                  >                          {/* Etiqueta de Oferta */}
                          {el.props.showOfferBadge && (
                            <div className="absolute top-6 right-6 z-20 bg-rose-500 text-white text-[8px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full shadow-lg rotate-12">
                              {el.props.offerBadgeText || "-30% OFF"}
                            </div>
                          )}

                          {/* Imagen del Producto */}
                          <div 
                            className={cn(
                              "w-full bg-gray-100/50 overflow-hidden flex items-center justify-center relative transition-transform duration-500 group-hover/card:scale-[1.02]",
                              el.props.imageAspectRatio === "portrait" ? "aspect-[4/5]" : "aspect-square"
                            )}
                            style={{ borderRadius: `${(el.props.cardBorderRadius || 20) * 0.75}px` }}
                          >
                             {imageUrl ? (
                               <img 
                                 src={imageUrl} 
                                 className="w-full h-full object-cover" 
                                 alt={product.name}
                                 onError={(e: any) => {
                                   // Si falla la carga, intentamos con la ruta de uploads por si acaso
                                   if (!e.target.src.includes('/uploads/')) {
                                      e.target.src = `http://localhost:8000/uploads${product.image_url.startsWith('/') ? '' : '/'}${product.image_url}`;
                                   } else {
                                      e.target.style.display = 'none'; // Si también falla, ocultamos y mostramos el placeholder
                                   }
                                 }}
                               />
                             ) : (
                               <ShoppingBag size={48} className="text-gray-300 opacity-20" />
                             )}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                          </div>

                          {/* Info del Producto */}
                          <div className="mt-5 space-y-1">
                            <h4 className={cn("text-xs font-black uppercase tracking-tight px-4", el.props.cardStyle === "glass" ? "text-white" : "text-gray-900")}>
                               {product.name || "Producto sin nombre"}
                            </h4>
                            
                                                      {el.props.showDescription && (
                                                        <div className="mt-1">
                                                          {renderTextWithTheme(product.description || "Sin descripción disponible.", el.props, "description", product.id, el.props.cardStyle === "glass")}
                                                        </div>
                                                      )}
                                                      
                                                      {el.props.showPrice && (
                                                        <div className="flex flex-col gap-1 pt-1">
                                                           {renderTextWithTheme(`$${product.price ? product.price.toLocaleString() : "0"}`, el.props, "price", product.id, el.props.cardStyle === "glass")}
                                                        </div>
                                                      )}
                            {el.props.showAddToCart && (
                              <div className="mt-4 w-full px-4 relative">
                                {renderButton(el.props, "addToCart", product.id)}
                              </div>
                            )}
                          </div>

                          {/* Hover Overlay - Solo si el botón principal está oculto o como extra */}
                          {!el.props.showAddToCart && (
                            <div className="mt-4 w-full opacity-0 group-hover/card:opacity-100 transition-opacity translate-y-2 group-hover/card:translate-y-0 duration-300 px-4 pb-2">
                               <div className="w-full py-2 bg-gray-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                  <PlusIcon size={12} /> Añadir
                               </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {(el.props.selectedCategory !== "all" && (realProducts || []).filter((p: any) => String(p.collection_id) === String(el.props.selectedCategory)).length === 0) && (
                      <div className="col-span-full py-20 text-center text-gray-400 font-black uppercase text-[10px] tracking-widest italic opacity-50">
                         No hay productos en esta categoría
                      </div>
                    )}
                  </div>
                </>
                )}

                {el.type === "video" && (
                   <div 
                     className={cn(
                       "w-full max-w-4xl rounded-3xl overflow-hidden mx-auto relative transition-all",
                       !(el.props.imageUrl || (el.props.bgType === "video" && el.props.videoUrl) || el.props.videoExternalUrl) ? "bg-black border-4 border-white/10 shadow-2xl" : "bg-transparent border-0 shadow-none"
                     )}
                     style={{ 
                       height: `${el.props.height || 400}px`,
                       aspectRatio: el.props.height ? 'auto' : '16/9'
                     }}
                   >
                      {/* Placeholder: Solo si no hay ABSOLUTAMENTE NADA */}
                      {!(el.props.imageUrl || (el.props.bgType === "video" && el.props.videoUrl) || el.props.videoExternalUrl) && (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black z-0">
                           <Monitor size={64} className="text-white/20 animate-pulse" />
                        </div>
                      )}

                      {/* Video Externo (YouTube/Vimeo) */}
                      {el.props.videoExternalUrl && (
                        <div className="absolute inset-0 w-full h-full z-10 bg-black">
                           <iframe 
                             className="w-full h-full border-0"
                             src={el.props.videoExternalUrl.includes('youtube.com') || el.props.videoExternalUrl.includes('youtu.be') 
                               ? `https://www.youtube.com/embed/${el.props.videoExternalUrl.split('v=')[1]?.split('&')[0] || el.props.videoExternalUrl.split('/').pop()}?autoplay=0`
                               : el.props.videoExternalUrl
                             }
                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                             allowFullScreen
                           />
                        </div>
                      )}
                   </div>
                )}

                {el.type === "custom-block" && (
                   <div className="w-full p-12 border-4 border-dashed border-white/10 rounded-[3rem] flex items-center justify-center">
                      <PlusIcon size={48} className="text-white/10" />
                   </div>
                )}
              </div>

              {/* Elementos Extra */}
              {(el.props.extraElements || []).filter((it:any) => it.type === 'text').map((it:any) => renderTextWithTheme(it.content, it, "", it.id, true))}
              {(el.props.extraElements || []).filter((it:any) => it.type === 'image' || it.type === 'video').map((it:any) => renderFloatingElement(it))}
              
              {/* Botones */}
              <div className="flex gap-4 flex-wrap justify-center mt-6">
                {el.props.primaryBtnText && renderButton(el.props, "primaryBtn")}
                {el.props.secondaryBtnText && renderButton(el.props, "secondaryBtn")}
                {(el.props.extraElements || []).filter((it:any) => it.type === 'button').map((it:any) => renderButton(it, "", it.id))}
              </div>
            </div>

            {/* Elementos Flotantes */}
            {(el.props.floatUrl || el.props.floatType === "video") && renderFloatingElement({ id: 'base-float', ...el.props })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const Canvas = () => {
  const { pageData, activeSection, setActiveSection, selectElement, selectedElementId, removeElement, viewport } = useStudio();
  const [realCategories, setRealCategories] = React.useState<{id: string, title: string}[]>([]);
  const [realProducts, setRealProducts] = React.useState<any[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const viewportWidths = { desktop: "max-w-5xl", tablet: "max-w-2xl", mobile: "max-w-sm" };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const { categoryService, productService } = await import('@/lib/api');
        const [categories, products] = await Promise.all([
          categoryService.getAll(token),
          productService.getAll(token)
        ]);
        setRealCategories(Array.isArray(categories) ? categories : []);
        setRealProducts(Array.isArray(products) ? products : []);
      } catch (err: any) {
        console.error("Error cargando datos en Canvas:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const refs: Record<SectionType, React.RefObject<HTMLDivElement>> = { header: headerRef, body: bodyRef, footer: footerRef };
    const targetRef = refs[activeSection];
    if (targetRef?.current) targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeSection]);

  const renderElements = (section: SectionType) => {
    const data = pageData[section];
    return <> {data.elements.map((el, idx) => ( <React.Fragment key={el.id}> <InsertionPoint section={section} index={idx} /> <DraggableCanvasElement el={el} section={section} idx={idx} selectedElementId={selectedElementId} selectElement={selectElement} setActiveSection={setActiveSection} removeElement={removeElement} realCategories={realCategories} realProducts={realProducts} /> </React.Fragment> ))} <InsertionPoint section={section} index={data.elements.length} /> </>;
  };

  return (
    <div className="flex-1 bg-gray-100 overflow-y-auto overflow-x-hidden p-8 scroll-smooth flex flex-col items-center">
      {/* ESTILOS GLOBALES DEL MOTOR VISUAL */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-loop {
          display: flex;
          width: fit-content;
          animation: marquee 20s linear infinite;
        }
        @keyframes aurora-text {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-aurora-text {
          animation: aurora-text 5s linear infinite;
        }
        .scrollbar-glass::-webkit-scrollbar { height: 8px; }
        .scrollbar-glass::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .scrollbar-glass::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); border-radius: 10px; border: 2px solid rgba(255,255,255,0.1); }
        .scrollbar-neon::-webkit-scrollbar { height: 8px; }
        .scrollbar-neon::-webkit-scrollbar-track { background: #000; }
        .scrollbar-neon::-webkit-scrollbar-thumb { background: #00f2ff; border-radius: 0px; box-shadow: 0 0 10px #00f2ff; }
        .scrollbar-minimal::-webkit-scrollbar { height: 4px; }
        .scrollbar-minimal::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-minimal::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 20px; }
      `}</style>

      <div className={cn("w-full transition-all duration-500 space-y-6 pb-40 mx-auto", viewportWidths[viewport])}>
        <DroppableSection section="header" headerRef={headerRef} activeSection={activeSection} setActiveSection={setActiveSection}>{renderElements("header")}</DroppableSection>
        <DroppableSection section="body" headerRef={bodyRef} activeSection={activeSection} setActiveSection={setActiveSection}>{renderElements("body")}</DroppableSection>
        <DroppableSection section="footer" headerRef={footerRef} activeSection={activeSection} setActiveSection={setActiveSection}>{renderElements("footer")}</DroppableSection>
      </div>
    </div>
  );
};