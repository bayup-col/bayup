"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Trash2, GripVertical, ShoppingBag, Plus as PlusIcon, Globe, Monitor, Search, User, ShoppingCart, Heart, Bell, Star, MessageSquare, Phone, Info, HelpCircle, Sparkles, Wind, Zap, X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderButton, renderTextWithTheme } from "./VisualEngine";
import { useStudio } from "../context";

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
              "flex items-center w-full px-10 relative transition-all duration-500",
              (!elProps.barEffect || elProps.barEffect === "none") ? "border-b border-gray-100 shadow-sm overflow-hidden" : "",
              elProps.barEffect === "glass" ? "backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-2xl rounded-b-2xl" : "overflow-hidden",
              elProps.barEffect === "shadow" ? "shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-none" : "",
              elProps.barEffect === "neon" ? "border-b-2 border-blue-500 shadow-[0_8px_20px_rgba(59,130,246,0.6)]" : "",
              isPreview && (elProps.barEffect === "glass" || elProps.barEffect === "transparent" || elProps.barEffect === "aurora") ? "absolute top-0 inset-x-0 w-full z-[200]" : "relative"
            )} 
            style={{ 
              height: `${elProps.navHeight || 80}px`, 
              backgroundColor: (elProps.barEffect === "transparent" || elProps.barEffect === "aurora") ? "rgba(0,0,0,0)" : 
                               elProps.barEffect === "glass" ? "rgba(255,255,255,0.1)" : 
                               elProps.bgColor || "#ffffff" 
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
                      <div key={i} className="cursor-pointer">
                        {renderTextWithTheme(labelToShow, menuProps, "none", `nav-item-${i}`)}
                      </div>
                    );
                  })}
                </div>
              </nav>
              <div className="flex items-center shrink-0 ml-auto" style={{ gap: `${elProps.utilityGap || 16}px`, transform: `translateX(${elProps.utilityPosX || 0}px)` }}>
                {(elProps.extraElements || []).filter((ex: any) => ex.type === 'button' || ex.type === 'text').map((extra: any) => (
                  <div key={extra.id}>{extra.type === 'button' ? renderButton(extra, "extra", extra.id) : renderTextWithTheme(extra.content || extra.title, extra, "extra", extra.id)}</div>
                ))}
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
                        {elProps.showSearch && renderUtil(<Search size={elProps.utilitySize || 18} />, "Buscar", "nav-search")}
                        {elProps.showUser && renderUtil(<User size={elProps.utilitySize || 18} />, "Cuenta", "nav-user")}
                        {elProps.showCart && renderUtil(<ShoppingCart size={elProps.utilitySize || 18} />, "Carrito", "nav-cart")}
                        {(elProps.extraUtilities || []).map((util: any) => {
                          const IconComp = { Heart, Bell, Star, MessageSquare, Phone, Info }[util.icon] || Info;
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

        {section === "body" && (
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
              el.type === "product-grid" ? "justify-start" : "justify-center",
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
            {elProps.floatUrl && (
              <motion.div
                animate={{ x: elProps.floatPosX || 0, y: elProps.floatPosY || 0, rotate: elProps.floatAnim === "rotate" ? [0, 360] : 0, scale: elProps.floatAnim === "pulse" ? [1, 1.05, 1] : elProps.floatAnim === "zoom" ? [0.9, 1.1] : 1 }}
                transition={{ x: { type: "spring", stiffness: 450, damping: 30 }, y: { type: "spring", stiffness: 450, damping: 30 }, rotate: elProps.floatAnim === "rotate" ? { duration: 10, repeat: Infinity, ease: "linear" } : {}, scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                className={cn("absolute z-20 overflow-hidden", elProps.floatAnim === "float" ? "animate-float" : "", elProps.floatAnim === "blink" ? "animate-pulse" : "", elProps.floatLinkUrl ? "cursor-pointer pointer-events-auto" : "pointer-events-none")}
                style={{ width: `${elProps.floatSize || 150}px`, aspectRatio: "1/1", borderRadius: `${(elProps.floatRadius || 0) / 2}%` }}
              >
                {elProps.floatLinkUrl ? ( <a href={elProps.floatLinkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">{elProps.floatType === "video" ? <video src={elProps.floatUrl} autoPlay muted loop className="w-full h-full object-cover" /> : <img src={elProps.floatUrl} className="w-full h-full object-cover shadow-2xl" />}</a> ) : ( elProps.floatType === "video" ? <video src={elProps.floatUrl} autoPlay muted loop className="w-full h-full object-cover" /> : <img src={elProps.floatUrl} className="w-full h-full object-cover shadow-2xl" /> )}
              </motion.div>
            )}
            {(elProps.extraElements || []).filter((ex: any) => (ex.type === 'image' || ex.type === 'video') && (ex.url || ex.floatUrl)).map((extra: any) => (
              <motion.div key={extra.id} animate={{ x: extra.posX || 0, y: extra.posY || 0 }} transition={{ type: "spring", stiffness: 450, damping: 30 }} className="absolute z-30 pointer-events-none overflow-hidden" style={{ width: `${extra.size || 100}px`, aspectRatio: "1/1", borderRadius: `${(extra.radius || 0) / 2}%` }}>
                {extra.type === 'video' ? <video src={extra.url || extra.floatUrl} autoPlay muted loop className="w-full h-full object-cover shadow-2xl" /> : <img src={extra.url || extra.floatUrl} className="w-full h-full object-cover shadow-2xl" />}
              </motion.div>
            ))}
            <div className="relative z-10 w-full flex flex-col items-center gap-8">
              <div className="space-y-4 w-full">
                {elProps.title && <div className="w-full">{renderTextWithTheme(elProps.title, elProps, "title")}</div>}
                {elProps.subtitle && <div className="w-full">{renderTextWithTheme(elProps.subtitle, elProps, "subtitle")}</div>}
              </div>
              <div className="flex flex-wrap justify-center items-center gap-6 w-full">
                {elProps.primaryBtnText && renderButton(elProps, "primaryBtn")}
                {elProps.secondaryBtnText && renderButton(elProps, "secondaryBtn")}
                {(elProps.extraElements || []).filter((ex: any) => ex.type === 'button' || ex.type === 'text').map((extra: any) => (
                  <div key={extra.id}>{extra.type === 'button' ? renderButton(extra, "extra", extra.id) : renderTextWithTheme(extra.content || extra.title, extra, "extra", extra.id)}</div>
                ))}
              </div>
              
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
                  
                  {/* SIDEBAR / TOPBAR DE FILTROS */}
                  {elProps.showFilters && (
                    <div 
                      className={cn(
                        "shrink-0 space-y-8 text-left transition-all duration-500 animate-in fade-in",
                        elProps.filterPlacement === "top" ? "w-full flex flex-wrap items-end gap-8 mb-4 p-6" : "p-6 sticky top-4",
                        elProps.filterPlacement === "top" ? "slide-in-from-top" : elProps.filterPlacement === "right" ? "slide-in-from-right" : "slide-in-from-left",
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
                      <div className={cn(elProps.filterPlacement === "top" && "flex-1 min-w-[200px] mb-0")}>
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-4" style={{ color: elProps.filterTextColor ? `${elProps.filterTextColor}80` : undefined }}>Filtrar Categoría</h4>
                        <div className={cn(
                          "gap-2", 
                          elProps.filterStyle === "pills" || elProps.filterPlacement === "top" ? "flex flex-wrap" : "space-y-2 flex flex-col"
                        )}>
                          {["Todas", "Nueva Colección", "Accesorios", "Exclusivos"].map((c, idx) => (
                            <div key={c} className={cn(
                              "flex items-center gap-2 cursor-pointer group transition-all",
                              elProps.filterStyle === "pills" ? "px-4 py-2 border-2" : "hover:translate-x-1"
                            )}
                            style={{ 
                              borderRadius: elProps.filterStyle === "pills" ? "99px" : "0px",
                              borderColor: elProps.filterStyle === "pills" ? (idx === 0 ? elProps.filterAccent : "transparent") : "transparent",
                              backgroundColor: elProps.filterStyle === "pills" && idx === 0 ? `${elProps.filterAccent}10` : "transparent"
                            }}>
                              {elProps.filterStyle !== "pills" && (
                                <div className="w-4 h-4 rounded-md border-2 transition-colors" 
                                     style={{ borderColor: idx === 0 ? (elProps.filterAccent || "#2563eb") : "#e5e7eb", backgroundColor: idx === 0 ? (elProps.filterAccent || "#2563eb") : "transparent" }} />
                              )}
                              <span className={cn("font-bold")} style={{ 
                                fontSize: `${elProps.filterTextSize || 12}px`,
                                color: idx === 0 ? (elProps.filterAccent || "#2563eb") : (elProps.filterTextColor || "#4b5563")
                              }}>{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={cn(elProps.filterPlacement === "top" && "flex-1 min-w-[200px] mb-0")}>
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-4" style={{ color: elProps.filterTextColor ? `${elProps.filterTextColor}80` : undefined }}>Rango de Precio</h4>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full relative">
                          <div className="absolute inset-y-0 left-0 w-2/3 rounded-full" style={{ backgroundColor: elProps.filterAccent || "#2563eb" }} />
                          <div className="absolute top-1/2 left-2/3 -translate-y-1/2 w-4 h-4 bg-white border-2 rounded-full shadow-md" style={{ borderColor: elProps.filterAccent || "#2563eb" }} />
                        </div>
                        <div className="flex justify-between mt-2 font-mono text-[9px] text-gray-400"><span>$0</span><span>$2.5M+</span></div>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 w-full">
                    <div ref={scrollContainerRef} onScroll={handleScroll} className={cn("grid w-full transition-all duration-500", elProps.layout === "carousel" ? "flex overflow-x-auto pb-8 custom-scrollbar scroll-smooth" : "grid")} style={{ gridTemplateColumns: elProps.layout === "grid" ? `repeat(${elProps.columns || 4}, minmax(0, 1fr))` : "none", gap: `${elProps.gridGap || 24}px` }}>
                      {(() => {
                        const filteredProducts = (realProducts || []).filter((p: any) => !elProps.selectedCategory || elProps.selectedCategory === "all" || p.category_id === elProps.selectedCategory).slice(0, elProps.itemsCount || 4);
                        
                        // Mock Data de Alta Calidad
                        const MOCK_IMAGES = [
                          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
                          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop",
                          "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=2070&auto=format&fit=crop",
                          "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=2080&auto=format&fit=crop"
                        ];

                        const displayItems = filteredProducts.length > 0 
                          ? filteredProducts 
                          : Array.from({ length: elProps.itemsCount || 4 }).map((_, i) => ({
                              id: `mock-${i}`,
                              title: `Producto Elite v${i + 1}`,
                              price: 150000 + (i * 25000),
                              description: "Diseño premium con materiales de alta calidad para un estilo de vida excepcional.",
                              main_image: MOCK_IMAGES[i % MOCK_IMAGES.length]
                            }));

                        return displayItems.map((p: any, i: number) => (
                          <motion.div 
                            key={p?.id || `prod-${i}`} 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ 
                              opacity: 1, 
                              y: elProps.cardPosY || 0 
                            }} 
                            whileHover={{ y: (elProps.cardPosY || 0) - 10, scale: 1.02 }}
                            transition={{ delay: i * 0.05 }} 
                            className={cn(
                              "relative group flex flex-col transition-all duration-500", 
                              elProps.cardStyle === "glass" ? "bg-white/5 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)]" : 
                              elProps.cardStyle === "minimal" ? "bg-transparent border-none shadow-none" : 
                              "bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_30px_70px_rgba(0,0,0,0.12)]",
                              "rounded-[2.5rem] overflow-hidden"
                            )} 
                            style={{ 
                              minWidth: elProps.layout === "carousel" ? "300px" : "auto", 
                              borderRadius: `${elProps.cardBorderRadius || 40}px`, 
                              height: elProps.cardHeight ? `${elProps.cardHeight}px` : (elProps.showDescription ? "500px" : "420px") 
                            }}
                          >
                            {elProps.showOfferBadge && (
                              <div 
                                className={cn(
                                  "absolute top-6 left-6 z-20 text-[10px] font-black px-4 py-1.5 rounded-full shadow-2xl transition-all",
                                  elProps.offerBadgePulse !== false ? "animate-pulse" : ""
                                )}
                                style={{ 
                                  backgroundColor: elProps.offerBadgeBg || "#ef4444", 
                                  color: elProps.offerBadgeColor || "#ffffff",
                                  letterSpacing: "0.1em"
                                }}
                              >
                                {elProps.offerBadgeText || "OFERTA"}
                              </div>
                            )}
                            <div className="p-5 pb-0 w-full h-[60%] shrink-0">
                              <div className="w-full h-full bg-gray-50/50 relative overflow-hidden" style={{ borderRadius: `${(elProps.cardBorderRadius || 40) * 0.7}px` }}>
                                {p?.main_image ? (
                                  <img src={p.main_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                                    <ShoppingBag size={48} className="opacity-10" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                              </div>
                            </div>
                            <div className={cn(
                              "p-8 pt-6 flex flex-col gap-4 flex-1 justify-between",
                              elProps.cardAlign === "center" ? "text-center items-center" : 
                              elProps.cardAlign === "right" ? "text-right items-end" : "text-left items-start"
                            )}>
                              <div className={cn("space-y-3 w-full flex flex-col", elProps.cardAlign === "center" ? "items-center" : elProps.cardAlign === "right" ? "items-end" : "items-start")}>
                                {renderTextWithTheme(p?.title || "Producto de Ejemplo", { 
                                  ...elProps, 
                                  variant: elProps.cardTitleVariant || "solid",
                                  color: elProps.cardTitleColor || (elProps.cardStyle === "glass" ? "#ffffff" : "#111827"), 
                                  size: elProps.cardTitleSize || 16, 
                                  font: elProps.cardTitleFont || "font-black",
                                  aurora1: elProps.cardTitleAurora1,
                                  aurora2: elProps.cardTitleAurora2,
                                  intensity: elProps.cardTitleIntensity || 100
                                }, "none", `title-${i}`)}
                                
                                {elProps.showDescription && <div className={cn("line-clamp-2 w-full opacity-60", elProps.cardAlign === "center" ? "text-center" : elProps.cardAlign === "right" ? "text-right" : "text-left")}>
                                  {renderTextWithTheme(p?.description || "Una breve descripción del producto...", { 
                                    ...elProps, 
                                    variant: elProps.descriptionVariant || "solid",
                                    color: elProps.descriptionColor || "#6b7280", 
                                    size: elProps.descriptionSize || 11, 
                                    font: elProps.descriptionFont || "font-sans",
                                    intensity: elProps.descriptionIntensity || 100
                                  }, "none", `desc-${i}`, elProps.cardStyle !== "glass")}
                                </div>}
                              </div>
                              
                              <div className={cn("flex flex-col gap-5 w-full", elProps.cardAlign === "center" ? "items-center" : elProps.cardAlign === "right" ? "items-end" : "items-start")}>
                                {elProps.showPrice && <div className="flex flex-col">
                                  {(() => { 
                                    const rawPrice = p?.price || "99000"; 
                                    const formattedPrice = new Intl.NumberFormat('es-CO').format(Number(rawPrice)); 
                                    return renderTextWithTheme(`$${formattedPrice}`, { 
                                      ...elProps, 
                                      variant: elProps.priceVariant || "solid",
                                      color: elProps.priceColor || "#2563eb", 
                                      size: elProps.priceSize || 18, 
                                      font: elProps.priceFont || "font-black",
                                      aurora1: elProps.priceAurora1,
                                      aurora2: elProps.priceAurora2,
                                      intensity: elProps.priceIntensity || 100
                                    }, "none", `price-${i}`, elProps.cardStyle !== "glass"); 
                                  })()}
                                </div>}
                                {elProps.showAddToCart && (
                                  <div className={cn(elProps.cardAlign === "center" ? "" : elProps.cardAlign === "right" ? "origin-right" : "origin-left", "transition-transform group-hover:scale-105")}>
                                    {renderButton({ 
                                      text: elProps.addToCartText || "Añadir", 
                                      variant: elProps.addToCartVariant || "solid", 
                                      bgColor: elProps.addToCartBgColor || "#000000", 
                                      textColor: elProps.addToCartTextColor || "#ffffff", 
                                      borderRadius: elProps.addToCartBorderRadius || 12, 
                                      size: elProps.addToCartSize || 10, 
                                      posX: elProps.addToCartPosX || 0, 
                                      posY: elProps.addToCartPosY || 0 
                                    }, "addToCart", `btn-cart-${i}`)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* --- PLANTILLA MAESTRA DE PRODUCTO (COLECCIONES) --- */}
              {el.type === "product-master-view" && (
                <div className="w-full grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-24 py-20 px-8 text-left animate-in fade-in duration-1000">
                  <div className="flex flex-col gap-8" style={{ transform: `scale(${(elProps.galleryScale || 100) / 100})`, transformOrigin: "top left" }}>
                    <div className="w-full aspect-[4/5] bg-gray-50 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] relative group border border-gray-100" style={{ borderRadius: `${elProps.galleryRadius || 48}px` }}>
                      {elProps.badgeText && <div className="absolute top-10 left-10 z-10 bg-black text-white text-[11px] font-black px-6 py-3 rounded-full tracking-[0.3em] uppercase shadow-2xl">{elProps.badgeText}</div>}
                      <img src={elProps.mainImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop"} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                      {(elProps.thumbnails || []).map((thumb: string, idx: number) => (
                        <div key={idx} className="w-28 h-28 shrink-0 border-2 border-transparent hover:border-black cursor-pointer overflow-hidden transition-all bg-gray-50 p-1.5 shadow-sm" style={{ borderRadius: `${(elProps.galleryRadius || 48) * 0.4}px` }}>
                          <img src={thumb} className="w-full h-full object-cover opacity-60 hover:opacity-100" style={{ borderRadius: `${(elProps.galleryRadius || 48) * 0.3}px` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-12 py-6">
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <span className="text-blue-600 font-black text-[11px] uppercase tracking-[0.5em] mb-2 block">Bayup Haute Couture</span>
                        {renderTextWithTheme(elProps.title || "PRODUCTO PREMIUM", { ...elProps, size: elProps.titleSize || 48 }, "title")}
                      </div>
                      <div className="flex items-center gap-8">
                        {(() => { const formattedPrice = new Intl.NumberFormat('es-CO').format(Number(elProps.price || 1500000)); return renderTextWithTheme(`$${formattedPrice}`, { ...elProps, size: elProps.priceSize || 32 }, "price", "pdp-price"); })()}
                        <div className="flex flex-col"><span className="text-gray-300 line-through text-base font-bold opacity-50">$2.100.000</span><span className="text-green-500 text-[10px] font-black uppercase">Ahorras 30%</span></div>
                      </div>
                      <div className="border-l-8 border-black pl-10 py-4 max-w-lg bg-gray-50/30 rounded-r-3xl">
                        {renderTextWithTheme(elProps.description || "Descripción detallada del producto...", { ...elProps, size: elProps.descSize || 16 }, "description")}
                      </div>
                    </div>
                    <div className="space-y-10 pt-10 border-t border-gray-100">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Talla / Medida</span><span className="text-[9px] font-bold text-blue-600 underline cursor-pointer">Guía de Tallas</span></div>
                        <div className="flex flex-wrap gap-3">
                          {(elProps.variants || ["S", "M", "L"]).map((v: string) => (
                            <button key={v} className={cn("min-w-[70px] h-12 flex items-center justify-center rounded-2xl text-[10px] font-black transition-all border-2 uppercase", v === "M" ? "bg-black text-white border-black shadow-xl scale-105" : "bg-white text-gray-400 border-gray-100 hover:border-black hover:text-black")}>{v}</button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Seleccionar Color</span>
                        <div className="flex gap-4">
                          {(elProps.colors || ["#000000", "#ffffff"]).map((c: string) => (
                            <button key={c} className={cn("w-12 h-12 rounded-full border-4 transition-all p-1 shadow-sm", c === "#000000" ? "border-blue-500 scale-110 shadow-lg" : "border-transparent hover:border-gray-200")}>
                              <div className="w-full h-full rounded-full border border-black/5 shadow-inner" style={{ backgroundColor: c }} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 pt-10">
                      <div className="w-full scale-105">{renderButton({ text: "Añadir a mi Carrito", variant: "aurora", size: 14, borderRadius: 24 }, "extra", "pdp-cart-btn")}</div>
                      <button className="w-full py-5 rounded-[1.5rem] border-2 border-black text-black font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all active:scale-95 shadow-lg shadow-gray-100">Comprar Ahora — Checkout Express</button>
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
