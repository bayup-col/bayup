"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { Trash2, GripVertical, ShoppingBag, Plus as PlusIcon, Globe, Monitor, Search, User, ShoppingCart, Heart, Bell, Star, MessageSquare, Phone, Info, HelpCircle, Sparkles, Wind, Zap, X, Tag, Smartphone, Tablet, ChevronDown, Layout, Store, Truck, BarChart3, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderButton, renderTextWithTheme } from "./VisualEngine";
import { useStudio } from "../context";
import { useCart } from "@/context/cart-context";
import { useRouter, useParams, useSearchParams } from "next/navigation";

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
  const { viewport, pageKey } = useStudio();
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false); 
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Hooks de Comercio
  const { addItem, items: cart } = useCart();
  const router = useRouter();

  const handleNavClick = (url: string) => {
    if (!isPreview) return;
    if (url.startsWith('http')) {
        window.open(url, '_blank');
        return;
    }
    
    // Mapeo inteligente de rutas internas de la tienda
    let target = `/shop/${slug}`;
    const lowUrl = url.toLowerCase();
    
    if (lowUrl.includes('tienda') || lowUrl.includes('productos')) target += '?page=productos';
    else if (lowUrl.includes('colecciones')) target += '?page=colecciones';
    else if (lowUrl.includes('nosotros') || lowUrl.includes('sobre')) target += '?page=nosotros';
    else if (lowUrl.includes('legal') || lowUrl.includes('politicas') || lowUrl.includes('terminos')) target += '?page=legal';
    else if (lowUrl.includes('contacto')) target += '?page=nosotros';
    else if (lowUrl.includes('checkout') || lowUrl.includes('finalizar')) target += '?page=checkout';
    else target += '?page=home';
    
    router.push(target);
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id: el.id, data: { type: el.type, id: el.id, section: section }, disabled: isPreview 
  });
  
  const elProps = {
    ...el.props,
    ...(el.props.responsiveOverrides?.[viewport] || {})
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollWidth > target.clientWidth) {
      const progress = target.scrollLeft / (target.scrollWidth - target.clientWidth);
      setScrollProgress(progress || 0);
    }
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
      onClick={(e) => { if (isPreview) return; e.stopPropagation(); selectElement(el.id); setActiveSection(section); }} 
      className={cn(
        "relative group transition-all", 
        !isPreview && (selectedElementId === el.id ? "ring-2 ring-blue-500 rounded-lg shadow-xl z-[400]" : "hover:ring-1 hover:ring-blue-300 rounded-lg")
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
        {el.type === "announcement-bar" && (
          <div className="w-full overflow-hidden flex items-center" style={{ height: `${elProps.height || 40}px`, backgroundColor: elProps.bgColor || "#004d4d" }}>
            <div className="w-full h-full flex items-center font-black uppercase" style={{ color: elProps.textColor || "#ffffff", fontSize: `${elProps.fontSize || 11}px` }}>
              <AnnouncementSlides messages={elProps.messages || ["¡BIENVENIDO!"]} animationType={elProps.messageAnimation} speed={elProps.messageSpeed} />
            </div>
          </div>
        )}

        {el.type === "footer-premium" && (
          <div className="w-full px-12 transition-all relative flex flex-col justify-center overflow-hidden" style={{ backgroundColor: elProps.bgColor || "#111827", color: elProps.textColor || "#ffffff", minHeight: `${elProps.height || 400}px` }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
              <div className="space-y-6 flex flex-col items-center text-center">
                <div style={{ transform: `translate(${elProps.footerLogoPosX || 0}px, ${elProps.footerLogoPosY || 0}px)` }}>
                  {elProps.footerLogoUrl ? <img src={elProps.footerLogoUrl} style={{ height: `${elProps.footerLogoSize || 24}px` }} /> : renderTextWithTheme(elProps.logoText || "LOGO", elProps, "footerLogo")}
                </div>
                <div style={{ transform: `translate(${elProps.footerDescPosX || 0}px, ${elProps.footerDescPosY || 0}px)` }}>
                  {renderTextWithTheme(elProps.description, elProps, "footerDesc")}
                </div>
              </div>
              <div className="md:col-span-3 grid grid-cols-3 gap-8 text-center">
                {(elProps.menuGroups || []).map((g: any, i: number) => (
                  <div key={i} className="space-y-4">
                    <h4 className="font-black uppercase text-[10px] opacity-50">{g.title}</h4>
                    <ul className="space-y-2">
                      {g.links.map((l: any, li: number) => <li key={li} className="text-sm font-bold opacity-80 cursor-pointer hover:opacity-100">{l.label}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {el.type === "navbar" && (
          <div 
            className={cn(
              "flex items-center w-full px-10 relative transition-all duration-500 z-[500]",
              (!elProps.barEffect || elProps.barEffect === "none") ? "border-b border-gray-100 shadow-sm" : "",
              elProps.barEffect === "glass" ? "backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-2xl rounded-b-2xl bg-white/20" : "", // Añadido bg-white/20
              elProps.barEffect === "shadow" ? "shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-none" : "",
              elProps.barEffect === "neon" ? "border-b-2 border-blue-500 shadow-[0_8px_20px_rgba(59,130,246,0.6)]" : ""
            )} 
            style={{ 
              height: `${elProps.navHeight || 80}px`, 
              backgroundColor: elProps.barEffect === "transparent" ? "transparent" : (elProps.barEffect === "glass" ? "rgba(255,255,255,0.2)" : elProps.bgColor || "#ffffff") // Cambiado de 0.8 a 0.2
            }}
          >
            {elProps.barEffect === "glass" && (
              <div key="navbar-glass-shine" className="absolute inset-x-0 top-0 h-[1px] bg-white/30 z-20" />
            )}
            {elProps.barEffect === "aurora" && (
              <motion.div 
                key="navbar-aurora-bg" initial={{ opacity: 0 }} animate={{ opacity: 0.6, backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ opacity: { duration: 0.5 }, backgroundPosition: { duration: 12, repeat: Infinity, ease: "linear" } }}
                className="absolute inset-0 z-0 pointer-events-none" style={{ background: `linear-gradient(90deg, ${elProps.logoAurora1 || "#00f2ff"}, ${elProps.logoAurora2 || "#7000ff"}, ${elProps.logoAurora1 || "#00f2ff"})`, backgroundSize: "200% 100%" }}
              />
            )}
            <div className={cn("flex items-center w-full z-10", elProps.barEffect === "glass" ? "drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]" : "")}>
              <div className="shrink-0 flex items-center" style={{ transform: `translateX(${elProps.logoPosX || 0}px)` }}>
                {elProps.logoUrl ? <img src={elProps.logoUrl} style={{ height: `${elProps.logoSize || 24}px` }} className="object-contain" /> : renderTextWithTheme(elProps.logoText || "LOGO", { ...elProps, variant: elProps.logoVariant || "solid", color: elProps.logoColor, size: elProps.logoSize, font: elProps.logoFont }, "none", "logo")}
              </div>
              <nav className={cn("hidden md:flex flex-1 items-center gap-8 transition-all px-8", elProps.align === "left" ? "justify-start ml-8" : elProps.align === "right" ? "justify-end mr-8" : "justify-center")} style={{ transform: `translateX(${elProps.menuPosX || 0}px)` }}>
                <div className="flex items-center" style={{ gap: `${elProps.menuGap || 32}px` }}>
                  {(elProps.menuItems || []).map((m: any, i: number) => {
                    const labelToShow = typeof m === 'string' ? m : (m?.label || "Link");
                                          const menuProps = {
                                            ...elProps,
                                            variant: elProps.menuVariant || "solid",
                                            color: elProps.menuColor || "#4b5563",
                                            size: elProps.menuSize || 10,
                                            font: elProps.menuFont || "font-black",
                                            effect: elProps.menuEffect || "none", // Añadido
                                            aurora1: elProps.menuAurora1, // Añadido
                                            aurora2: elProps.menuAurora2  // Añadido
                                          };
                                          return (
                                            <div key={i} className="cursor-pointer" onClick={() => handleNavClick(m.url)}>
                                              {renderTextWithTheme(labelToShow, menuProps, "none", `nav-item-${i}`)}
                                            </div>
                                          );
                                        })}                </div>
              </nav>
              <div className="flex items-center shrink-0 ml-auto" style={{ gap: `${elProps.utilityGap || 16}px`, transform: `translateX(${elProps.utilityPosX || 0}px)` }}>
                <div className="flex items-center" style={{ gap: `${elProps.utilityGap || 16}px` }}>
                  {(() => {
                    const mode = elProps.utilityDisplayMode || "icon";
                    const renderUtil = (icon: any, label: string, id: string) => {
                      const content = (
                        <div className="flex items-center gap-2">
                          {(mode === "icon" || mode === "both") && icon}
                          {(mode === "text" || mode === "both") && <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>}
                        </div>
                      );
                      const utilProps = { 
                        ...elProps, 
                        variant: elProps.utilityVariant || "solid",
                        color: elProps.utilityColor || "#6b7280",
                        size: elProps.utilitySize || 18,
                        effect: elProps.utilityEffect || "none", // Añadido
                        aurora1: elProps.utilityAurora1, // Añadido
                        aurora2: elProps.utilityAurora2  // Añadido
                      };
                      return renderTextWithTheme(content, utilProps, "none", id);
                    };

                    return (
                      <>
                        {elProps.showSearch && (
                          <div className="relative flex items-center">
                            <AnimatePresence>
                              {isSearchOpen && (
                                <motion.div 
                                  initial={{ width: 0, opacity: 0 }}
                                  animate={{ width: 200, opacity: 1 }}
                                  exit={{ width: 0, opacity: 0 }}
                                  className="absolute right-full mr-4 overflow-hidden"
                                >
                                  <input 
                                    autoFocus
                                    placeholder="Buscar..." 
                                    className="w-full px-4 py-2 bg-gray-50 border rounded-full text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                    onBlur={() => setIsSearchOpen(false)}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <div className="cursor-pointer" onClick={() => isPreview && setIsSearchOpen(!isSearchOpen)}>
                              {renderUtil(<Search size={elProps.utilitySize || 18} />, "Buscar", "nav-search")}
                            </div>
                          </div>
                        )}
                        {elProps.showUser && (
                          <div className="relative">
                            <div 
                              className="cursor-pointer" 
                              onClick={() => {
                                if (isPreview) setIsUserMenuOpen(!isUserMenuOpen);
                              }}
                            >
                              {renderUtil(<User size={elProps.utilitySize || 18} />, "Cuenta", "nav-user")}
                            </div>
                            
                            <AnimatePresence>
                              {isUserMenuOpen && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[600] overflow-hidden"
                                >
                                  <button 
                                    onClick={() => {
                                      setIsUserMenuOpen(false);
                                      if (onOpenLogin) onOpenLogin();
                                      else router.push("/login");
                                    }} 
                                    className="w-full text-left p-3 hover:bg-gray-50 rounded-xl text-[10px] font-black uppercase text-gray-600 transition-colors flex items-center gap-3"
                                  >
                                    <User size={14} /> Iniciar Sesión
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setIsUserMenuOpen(false);
                                      if (onOpenLogin) onOpenLogin();
                                      else router.push("/register");
                                    }} 
                                    className="w-full text-left p-3 hover:bg-gray-50 rounded-xl text-[10px] font-black uppercase text-[#004D4D] transition-colors flex items-center gap-3"
                                  >
                                    <PlusIcon size={14} /> Registrarse
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                        {elProps.showCart && (
                          <div className="cursor-pointer relative" onClick={() => {
                            if (isPreview) {
                              if (onOpenCart) onOpenCart();
                              else router.push("/checkout");
                            }
                          }}>
                            {renderUtil(<ShoppingCart size={elProps.utilitySize || 18} />, "Carrito", "nav-cart")}
                            {isPreview && cart.length > 0 && (
                              <span className="absolute -top-2 -right-2 h-5 w-5 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                {cart.reduce((acc: number, i: any) => acc + i.quantity, 0)}
                              </span>
                            )}
                          </div>
                        )}
                        {(elProps.extraUtilities || []).map((util: any) => {
                          const iconMap: any = { Heart, Bell, Star, MessageSquare, Phone, Info };
                          const IconComp = iconMap[util.icon] || Info;
                          return ( <div key={util.id} title={util.label} className="cursor-pointer">{renderUtil(<IconComp size={elProps.utilitySize || 18} />, util.label || "Link", util.id)}</div> );
                        })}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {(el.type !== "navbar" && el.type !== "announcement-bar" && el.type !== "footer-premium") && (
          <motion.div 
            layout initial={false} 
            animate={{ 
              minHeight: elProps.height || 400,
              backgroundColor: elProps.bgColor || (pageKey === "colecciones" ? "#ffffff" : "#111827") 
            }} 
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "w-full flex flex-col relative overflow-hidden transition-all duration-700",
              // ESTILOS DE CONTENEDOR SEGÚN EL TEMA (Deducido por props)
              elProps.titleFont === "font-black" ? "p-4 md:p-20" : "p-12 md:p-24", // Brutalista vs Standard
              (el.type === "product-grid" || el.type === "product-master-view") ? "justify-start" : "justify-center items-center text-center",
            )}
          >
            {/* --- CAPAS DE FONDO AVANZADAS --- */}
            {elProps.bgType === "video" && (elProps.videoUrl || elProps.videoExternalUrl) && (
              <div className="absolute inset-0 z-0 opacity-60"><video src={elProps.videoUrl} autoPlay muted loop className="w-full h-full object-cover" /></div>
            )}
            {elProps.bgType === "image" && elProps.imageUrl && (
              <div className="absolute inset-0 z-0 transition-transform duration-[2000ms]" style={{ transform: elProps.bgEffect === "ken-burns" ? "scale(1.15)" : "scale(1)" }}>
                <img src={elProps.imageUrl} className="w-full h-full object-cover" alt="Background" />
              </div>
            )}
            <div className="absolute inset-0 z-[1]" style={{ backgroundColor: elProps.overlayColor || "#000000", opacity: (elProps.overlayOpacity || 0) / 100 }} />
            
            {/* --- DECORACIONES DE DISEÑO TOP-TIER --- */}
            {elProps.titleFont === "font-black" && ( // Elementos decorativos para estilo Mattelsa/Brutalist
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
                    <div className="absolute -top-20 -left-20 text-[20vw] font-black italic leading-none whitespace-nowrap uppercase tracking-tighter">AUTHENTIC</div>
                </div>
            )}

            <div className={cn(
                "relative z-10 w-full flex flex-col gap-12",
                elProps.titleFont === "font-black" ? "items-start text-left" : "items-center text-center"
            )}>
              
              {/* --- HERO / TEXT CONTENT --- */}
              {(el.type === "hero-banner" || el.type === "text") && (
                <div className={cn(
                    "w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000",
                    elProps.titleFont === "font-black" ? "max-w-5xl" : "max-w-4xl"
                )}>
                  {elProps.title && (
                    <div className="w-full">
                        {renderTextWithTheme(elProps.title, {
                            ...elProps,
                            size: viewport === 'mobile' ? 40 : (elProps.titleSize || 80),
                            variant: elProps.titleVariant || (elProps.titleFont === "font-black" ? "solid" : "solid")
                        }, "title")}
                    </div>
                  )}
                  {elProps.subtitle && (
                    <div className="w-full opacity-80">
                        {renderTextWithTheme(elProps.subtitle, {
                            ...elProps,
                            size: viewport === 'mobile' ? 14 : (elProps.subtitleSize || 20),
                            font: "font-sans"
                        }, "subtitle")}
                    </div>
                  )}
                  
                  <div className={cn(
                      "flex flex-wrap gap-6 pt-4",
                      elProps.titleFont === "font-black" ? "justify-start" : "justify-center"
                  )}>
                    {elProps.primaryBtnText && renderButton(elProps, "primaryBtn")}
                    {elProps.secondaryBtnText && renderButton(elProps, "secondaryBtn")}
                  </div>
                </div>
              )}

              {/* --- PRODUCT GRID (REDISEÑADA PARA IMPACTO) --- */}
              {el.type === "product-grid" && (
                <div className="w-full space-y-16">
                  {elProps.title && (
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
                          <div className="text-left">
                            <p className="text-[10px] font-black tracking-[0.4em] text-blue-500 mb-2 uppercase">Curated selection</p>
                            {renderTextWithTheme(elProps.title, { ...elProps, size: 40 }, "title")}
                          </div>
                          {isPreview && (
                              <button onClick={() => handleNavClick('/productos')} className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                                  Ver Catálogo Completo <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                              </button>
                          )}
                      </div>
                  )}

                  <div 
                    className="grid w-full" 
                    style={{ 
                      gridTemplateColumns: `repeat(${viewport === 'mobile' ? 1 : (elProps.columns || 4)}, minmax(0, 1fr))`, 
                      gap: `${elProps.gridGap || (elProps.titleFont === "font-black" ? 2 : 40)}px` 
                    }}
                  >
                    {(() => {
                        const items = (realProducts && realProducts.length > 0) 
                            ? realProducts.slice(0, elProps.itemsCount || 8)
                            : Array.from({ length: elProps.itemsCount || 4 }).map((_, i) => ({
                                id: `prod-${i}`, name: `PRODUCT ITEM 0${i+1}`, price: 250000, image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800"
                            }));

                        return items.map((p: any, i: number) => (
                          <motion.div 
                            key={p.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                                "group relative flex flex-col bg-white overflow-hidden transition-all duration-500 cursor-pointer",
                                elProps.titleFont === "font-black" ? "border-[1px] border-gray-100" : "rounded-[2rem] shadow-sm hover:shadow-2xl"
                            )}
                            style={{ borderRadius: `${elProps.cardBorderRadius}px` }}
                          >
                            <div className="aspect-[3/4] overflow-hidden bg-gray-50 relative">
                                <img src={Array.isArray(p.image_url) ? p.image_url[0] : p.image_url} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all" />
                                
                                {elProps.showAddToCart && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); addItem({id: p.id, title: p.name, price: p.price, image: p.image_url, quantity: 1}); }}
                                        className="absolute bottom-6 left-6 right-6 py-4 bg-white/90 backdrop-blur-xl text-black font-black text-[9px] uppercase tracking-widest translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl hover:bg-black hover:text-white"
                                    >
                                        Añadir al Carrito
                                    </button>
                                )}
                            </div>
                            <div className="p-8 space-y-2">
                                <h4 className="font-black text-xs uppercase tracking-tighter text-gray-900">{p.name}</h4>
                                <p className="font-bold text-sm text-gray-500">${Number(p.price).toLocaleString()}</p>
                            </div>
                          </motion.div>
                        ));
                    })()}
                  </div>
                </div>
              )}

              {/* --- CATEGORIES (VISUAL PRO) --- */}
              {el.type === "categories-grid" && (
                  <div className="w-full grid" style={{ gridTemplateColumns: `repeat(${viewport === 'mobile' ? 1 : 3}, minmax(0, 1fr))`, gap: '2px' }}>
                      {[1,2,3].map(i => (
                          <div key={i} className="relative aspect-[1/1.2] bg-gray-900 group overflow-hidden cursor-pointer">
                              <img src={`https://images.unsplash.com/photo-152${i}275335684-37898b6baf30?q=80&w=1000`} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[2000ms]" />
                              <div className="absolute inset-0 flex items-center justify-center p-12">
                                  <h5 className="text-white font-black text-4xl italic tracking-tighter uppercase border-b-4 border-white pb-2 group-hover:px-4 transition-all">Colección 0{i}</h5>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
