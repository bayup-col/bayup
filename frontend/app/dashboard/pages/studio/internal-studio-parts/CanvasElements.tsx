"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { Trash2, GripVertical, ShoppingBag, Plus as PlusIcon, Globe, Monitor, Search, User, ShoppingCart, Heart, Bell, Star, MessageSquare, Phone, Info, HelpCircle, Sparkles, Wind, Zap, X, Tag, Smartphone, Tablet, ChevronDown, Layout, Store, Truck, BarChart3, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderButton, renderTextWithTheme } from "./VisualEngine";
import { useStudio } from "../context";
import { useCart } from "@/context/cart-context";
import { useRouter } from "next/navigation";

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

export const DraggableCanvasElement = ({ el, section, selectedElementId, selectElement, setActiveSection, removeElement, realCategories, realProducts, isPreview = false }: any) => {
  const { viewport, pageKey } = useStudio();
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Hooks de Comercio
  const { addItem } = useCart();
  const router = useRouter();

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
        !isPreview && (selectedElementId === el.id ? "ring-2 ring-blue-500 rounded-lg shadow-xl z-[400]" : "hover:ring-1 hover:ring-blue-300 rounded-lg"),
        selectedElementId === el.id ? "overflow-visible" : "overflow-hidden"
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
              elProps.barEffect === "glass" ? "backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-2xl rounded-b-2xl" : "",
              elProps.barEffect === "shadow" ? "shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-none" : "",
              elProps.barEffect === "neon" ? "border-b-2 border-blue-500 shadow-[0_8px_20px_rgba(59,130,246,0.6)]" : ""
            )} 
            style={{ 
              height: `${elProps.navHeight || 80}px`, 
              backgroundColor: elProps.barEffect === "transparent" ? "transparent" : (elProps.barEffect === "glass" ? "rgba(255,255,255,0.8)" : elProps.bgColor || "#ffffff")
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
                {elProps.logoUrl ? <img src={elProps.logoUrl} style={{ height: `${elProps.logoSize || 24}px` }} className="object-contain" /> : renderTextWithTheme(elProps.logoText || "LOGO", elProps, "logo")}
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
                      font: elProps.menuFont || "font-black"
                    };
                    return (
                      <div key={i} className="cursor-pointer" onClick={() => { if (isPreview && m.url) router.push(m.url); }}>
                        {renderTextWithTheme(labelToShow, menuProps, "none", `nav-item-${i}`)}
                      </div>
                    );
                  })}
                </div>
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
                        size: elProps.utilitySize || 18
                      };
                      return renderTextWithTheme(content, utilProps, "none", id);
                    };
                    return (
                      <>
                        {elProps.showSearch && (
                          <div className="cursor-pointer" onClick={() => isPreview && alert("Abriendo buscador inteligente...")}>
                            {renderUtil(<Search size={elProps.utilitySize || 18} />, "Buscar", "nav-search")}
                          </div>
                        )}
                        {elProps.showUser && (
                          <div className="cursor-pointer" onClick={() => isPreview && router.push("/login")}>
                            {renderUtil(<User size={elProps.utilitySize || 18} />, "Cuenta", "nav-user")}
                          </div>
                        )}
                        {elProps.showCart && (
                          <div className="cursor-pointer relative" onClick={() => isPreview && router.push("/checkout")}>
                            {renderUtil(<ShoppingCart size={elProps.utilitySize || 18} />, "Carrito", "nav-cart")}
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
              height: "auto",
              backgroundColor: elProps.bgColor || (pageKey === "colecciones" ? "#ffffff" : "#111827") 
            }} 
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "w-full flex flex-col p-12 relative shadow-lg items-center text-center",
              (el.type === "product-grid" || el.type === "product-master-view") ? "justify-start" : "justify-center",
              selectedElementId === el.id ? "overflow-visible" : "overflow-hidden"
            )}
          >
            {elProps.bgType === "video" && (elProps.videoUrl || elProps.videoExternalUrl) && (
              <div className="absolute inset-0 z-0"><video src={elProps.videoUrl} autoPlay muted loop className="w-full h-full object-cover" /></div>
            )}
            {elProps.bgType === "image" && elProps.imageUrl && (
              <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000" style={{ backgroundImage: `url(${elProps.imageUrl})`, transform: elProps.bgEffect === "ken-burns" ? "scale(1.1)" : "scale(1)" }} />
            )}
            <div className="absolute inset-0 z-[1]" style={{ backgroundColor: elProps.overlayColor || "#000000", opacity: (elProps.overlayOpacity || 0) / 100 }} />
            
            <div className="relative z-10 w-full flex flex-col items-center gap-8">
              
              {/* --- RENDERIZADO CONDICIONAL POR TIPO --- */}
              
              {(el.type === "hero-banner" || el.type === "text") && (
                <>
                  <div className="space-y-4 w-full">
                    {elProps.title && <div className="w-full">{renderTextWithTheme(elProps.title, elProps, "title")}</div>}
                    {elProps.subtitle && <div className="w-full">{renderTextWithTheme(elProps.subtitle, elProps, "subtitle")}</div>}
                    {elProps.content && <div className="w-full">{renderTextWithTheme(elProps.content, elProps, "content")}</div>}
                  </div>
                  <div className="flex flex-wrap justify-center items-center gap-6 w-full">
                    {elProps.primaryBtnText && renderButton(elProps, "primaryBtn")}
                    {elProps.secondaryBtnText && renderButton(elProps, "secondaryBtn")}
                  </div>
                </>
              )}

              {el.type === "product-grid" && (
                <div 
                  className={cn(
                    "w-full mt-12 flex flex-col", 
                    elProps.filterPlacement === "top" ? "flex-col" : 
                    elProps.filterPlacement === "right" ? "lg:flex-row-reverse" : "lg:flex-row",
                    elProps.showFilters ? "items-start" : "items-center"
                  )}
                  style={{ gap: `${elProps.filterGridGap || 40}px` }}
                >
                  {elProps.showFilters && (
                    <div 
                      className={cn(
                        "shrink-0 space-y-8 text-left transition-all duration-500 animate-in fade-in",
                        elProps.filterPlacement === "top" ? "w-full flex flex-wrap items-end gap-8 mb-4 p-6" : "p-6 sticky top-4",
                        elProps.filterGlass ? "backdrop-blur-xl border-white/20" : "border-gray-100",
                        elProps.filterShadow ? "shadow-2xl shadow-gray-200/50" : ""
                      )}
                      style={{ 
                        backgroundColor: elProps.filterGlass ? "rgba(255,255,255,0.1)" : (elProps.filterBg || "#f9fafb"),
                        borderRadius: `${elProps.filterRadius || 32}px`,
                        borderWidth: "1px",
                        width: elProps.filterPlacement === "top" ? "100%" : `${elProps.filterWidth || 260}px`,
                        minWidth: elProps.filterPlacement === "top" ? "100%" : `${elProps.filterWidth || 260}px`,
                        transform: `translate(${elProps.filterPosX || 0}px, ${elProps.filterPosY || 0}px)`,
                        zIndex: 20
                      }}
                    >
                      {/* Contenido de Filtros... */}
                      <div className="font-black text-[10px] uppercase opacity-40">Filtros Activos</div>
                    </div>
                  )}

                  <div className="flex-1 w-full">
                    <div ref={scrollContainerRef} onScroll={handleScroll} className={cn("grid w-full transition-all duration-500", elProps.layout === "carousel" ? "flex overflow-x-auto pb-8 custom-scrollbar scroll-smooth" : "grid")} style={{ gridTemplateColumns: elProps.layout === "grid" ? `repeat(${elProps.columns || 4}, minmax(0, 1fr))` : "none", gap: `${elProps.gridGap || 24}px` }}>
                      {(() => {
                        const MOCK_IMAGES = [
                          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
                          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop",
                          "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=2070&auto=format&fit=crop"
                        ];

                        // PRIORIZAR PRODUCTOS REALES
                        let displayItems = [];
                        if (realProducts && realProducts.length > 0) {
                          displayItems = realProducts;
                          if (elProps.selectedCategory && elProps.selectedCategory !== "all") {
                            displayItems = displayItems.filter((p: any) => p.collection_id === elProps.selectedCategory || p.category === elProps.selectedCategory);
                          }
                          displayItems = displayItems.slice(0, elProps.itemsCount || 12);
                        } else {
                          displayItems = Array.from({ length: elProps.itemsCount || 4 }).map((_, i) => ({
                            id: `prod-${i}`, name: `Producto Platinum v${i + 1}`, price: 150000 + (i * 20000), image_url: MOCK_IMAGES[i % 3]
                          }));
                        }

                        return displayItems.map((p: any, i: number) => (
                          <motion.div 
                            key={p.id} whileHover={{ y: -10, scale: 1.02 }}
                            onClick={() => isPreview && router.push(`/shop/${pageKey}/product/${p.id}`)}
                            className="relative group flex flex-col bg-white rounded-[2.5rem] overflow-hidden shadow-lg cursor-pointer"
                            style={{ minWidth: elProps.layout === "carousel" ? "300px" : "auto", height: elProps.cardHeight || 450, borderRadius: `${elProps.cardBorderRadius || 40}px` }}
                          >
                            <div className="h-[60%] overflow-hidden bg-gray-50">
                              <img src={Array.isArray(p.image_url) ? p.image_url[0] : (p.image_url || p.main_image || MOCK_IMAGES[0])} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            </div>
                            <div className="p-8 flex flex-col justify-between flex-1 text-center">
                              <div>
                                <h4 className="font-black uppercase text-sm text-gray-900 truncate">{p.name || p.title}</h4>
                                <p className="text-[#004D4D] font-black mt-2">${Number(p.price).toLocaleString()}</p>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); if(isPreview) addItem({id: p.id, title: p.name || p.title, price: Number(p.price), image: Array.isArray(p.image_url) ? p.image_url[0] : p.image_url, quantity: 1}); }}
                                className="w-full py-3 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#004D4D] transition-all"
                              >
                                Añadir al Carrito
                              </button>
                            </div>
                          </motion.div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {el.type === "cards" && (
                <div className="w-full grid py-12" style={{ gridTemplateColumns: `repeat(${elProps.columns || 2}, minmax(0, 1fr))`, gap: `${elProps.gap || 48}px` }}>
                  {(elProps.cards || []).map((card: any) => (
                    <motion.div
                      key={card.id} whileHover={{ y: -10, scale: 1.02 }}
                      onClick={() => isPreview && card.url && router.push(card.url)}
                      className="relative h-[500px] rounded-[3rem] overflow-hidden group cursor-pointer shadow-2xl"
                    >
                      <img src={card.bgImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                      <div className="relative z-10 h-full p-12 flex flex-col justify-end items-start text-left space-y-4">
                        <h4 className="text-4xl font-black text-white uppercase italic tracking-tighter">{card.title}</h4>
                        <p className="text-white/80 font-bold uppercase tracking-widest text-xs">{card.description}</p>
                        <button className="px-10 py-4 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                          {card.btnText || "Ver Catálogo"}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {el.type === "product-master-view" && (
                <div className="w-full grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-24 py-20 px-8 text-left animate-in fade-in duration-1000">
                  <div className="flex flex-col gap-8">
                    <div className="w-full aspect-[4/5] bg-gray-50 overflow-hidden shadow-2xl relative rounded-[3rem] border border-gray-100">
                      <img src={elProps.mainImage} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-12 py-6">
                    <div className="space-y-8">
                      <h2 className="text-5xl font-black uppercase italic tracking-tighter">{elProps.title}</h2>
                      <p className="text-2xl font-black text-blue-600">${Number(elProps.price || 0).toLocaleString()}</p>
                      <p className="text-gray-500 leading-relaxed italic">{elProps.description}</p>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => isPreview && addItem({id: 'p1', title: elProps.title, price: Number(elProps.price), image: elProps.mainImage, quantity: 1})}
                        className="flex-1 py-5 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
                      >
                        Añadir al Carrito
                      </button>
                      <button onClick={() => isPreview && router.push("/checkout")} className="flex-1 py-5 border-2 border-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-xl">Comprar Ahora</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
