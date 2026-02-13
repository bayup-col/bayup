"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Trash2, GripVertical, ShoppingBag, Plus as PlusIcon, Globe, Monitor, Search, User, ShoppingCart, Heart, Bell, Star, MessageSquare, Phone, Info, HelpCircle, Sparkles, Wind, Zap } from "lucide-react";
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
  const { viewport } = useStudio();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id: el.id, data: { type: el.type, id: el.id, section: section }, disabled: isPreview 
  });
  
  const elProps = {
    ...el.props,
    ...(el.props.responsiveOverrides?.[viewport] || {})
  };

  const style = { transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, opacity: isDragging ? 0.3 : 1 };

  return (
    <motion.div ref={setNodeRef} style={style} {...(isPreview ? {} : { ...listeners, ...attributes })} onClick={(e) => { if (isPreview) return; e.stopPropagation(); selectElement(el.id); setActiveSection(section); }} className={cn("relative group transition-all", !isPreview && (selectedElementId === el.id ? "ring-2 ring-blue-500 rounded-lg shadow-lg z-10" : "hover:ring-1 hover:ring-blue-300 rounded-lg"))}>
      
      {(!isPreview && selectedElementId === el.id) && (
        <div className="absolute -top-10 left-0 bg-blue-500 text-white flex items-center gap-2 px-2 py-1 rounded-t-lg shadow-md z-30">
          <GripVertical size={12} />
          <span className="text-[10px] font-bold uppercase">{el.type}</span>
          <button onMouseDown={(e) => { e.stopPropagation(); removeElement(section, el.id); }} className="ml-2 hover:text-red-200"><Trash2 size={12} /></button>
        </div>
      )}

      <div className={cn(!isPreview && "p-2", el.type === "announcement-bar" && "p-0")}>
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
          <div className="flex items-center w-full px-10 shadow-sm border-b border-gray-100 relative transition-all duration-500 overflow-hidden" style={{ height: `${elProps.navHeight || 80}px`, backgroundColor: elProps.bgColor || "#ffffff" }}>
            
            {/* 1. ÁREA DE LOGOTIPO (IZQUIERDA) */}
            <div className="shrink-0 z-10 flex items-center" style={{ transform: `translateX(${elProps.logoPosX || 0}px)` }}>
              {elProps.logoUrl ? (
                <img src={elProps.logoUrl} style={{ height: `${elProps.logoSize || 24}px` }} className="object-contain" />
              ) : (
                renderTextWithTheme(elProps.logoText || "LOGO", elProps, "logo")
              )}
            </div>

            {/* 2. ÁREA DE MENÚ PRINCIPAL (CENTRO) */}
            <nav className={cn(
              "hidden md:flex flex-1 items-center gap-8 transition-all px-8",
              elProps.align === "left" ? "justify-start ml-8" : 
              elProps.align === "right" ? "justify-end mr-8" : "justify-center"
            )} 
            style={{ transform: `translateX(${elProps.menuPosX || 0}px)` }}>
              <div className="flex items-center" style={{ gap: `${elProps.menuGap || 32}px` }}>
                {(elProps.menuItems || []).map((m: any, i: number) => {
                  // Validación quirúrgica para evitar renderizar objetos
                  const labelToShow = typeof m === 'string' ? m : (m?.label || "Link");
                  return (
                    <div key={i} className="cursor-pointer">
                      {renderTextWithTheme(labelToShow, elProps, "menu", `nav-item-${i}`)}
                    </div>
                  );
                })}
              </div>
            </nav>

            {/* 3. ÁREA DE UTILIDADES / ICONOS (DERECHA) */}
            <div className="flex items-center z-10 shrink-0 ml-auto" style={{ gap: `${elProps.utilityGap || 16}px`, transform: `translateX(${elProps.utilityPosX || 0}px)` }}>
              
              {/* Elementos Extra del Navbar (Botones/Textos añadidos) */}
              {(elProps.extraElements || []).map((extra: any) => (
                <div key={extra.id} className="flex items-center">
                  {extra.type === 'button' && renderButton(extra, "extra", extra.id)}
                  {extra.type === 'text' && renderTextWithTheme(extra.content, extra, "extra", extra.id)}
                </div>
              ))}

              <div className="flex items-center" style={{ gap: `${elProps.utilityGap || 16}px` }}>
                {/* Iconos Estándar */}
                {elProps.showSearch && renderTextWithTheme(<Search size={elProps.utilitySize || 18} />, elProps, "utility", "nav-search")}
                {elProps.showUser && renderTextWithTheme(<User size={elProps.utilitySize || 18} />, elProps, "utility", "nav-user")}
                {elProps.showCart && renderTextWithTheme(<ShoppingCart size={elProps.utilitySize || 18} />, elProps, "utility", "nav-cart")}

                {/* Iconos Personalizados (Extra Utilities) */}
                {(elProps.extraUtilities || []).map((util: any) => {
                  const IconComp = { Heart, Bell, Star, MessageSquare, Phone, Info }[util.icon] || Info;
                  return (
                    <div key={util.id} title={util.label} className="cursor-pointer">
                      {renderTextWithTheme(<IconComp size={elProps.utilitySize || 18} />, elProps, "utility", util.id)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {section === "body" && (
          <div className="w-full flex flex-col p-12 overflow-hidden relative shadow-lg items-center text-center" style={{ backgroundColor: elProps.bgColor || "#111827", minHeight: `${elProps.height || 400}px`, justifyContent: "center" }}>
            
            {/* FONDO MULTIMEDIA (IMAGEN/VIDEO) */}
            {elProps.bgType === "video" && (elProps.videoUrl || elProps.videoExternalUrl) && (
              <div className="absolute inset-0 z-0">
                <video 
                  src={elProps.videoUrl} 
                  autoPlay 
                  muted 
                  loop 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {elProps.bgType === "image" && elProps.imageUrl && (
              <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
                style={{ 
                  backgroundImage: `url(${elProps.imageUrl})`,
                  transform: elProps.bgEffect === "ken-burns" ? "scale(1.1)" : "scale(1)"
                }}
              />
            )}

            {/* CAPA DE OVERLAY (DIFUMINADO) */}
            <div 
              className="absolute inset-0 z-[1]" 
              style={{ 
                backgroundColor: elProps.overlayColor || "#000000", 
                opacity: (elProps.overlayOpacity || 0) / 100 
              }} 
            />

            <div className="relative z-10 space-y-6 w-full">
              {elProps.title && renderTextWithTheme(elProps.title, elProps, "title")}
              {elProps.subtitle && renderTextWithTheme(elProps.subtitle, elProps, "subtitle")}
              {elProps.primaryBtnText && renderButton(elProps, "primaryBtn")}
              
              {/* RENDERIZADO ESPECÍFICO SEGÚN TIPO (GRILLA DE PRODUCTOS, ETC) */}
              {el.type === "product-grid" && (
                <div className="w-full">
                  <div className={cn(
                    "grid w-full transition-all duration-500",
                    elProps.layout === "carousel" ? "flex overflow-x-auto pb-6 custom-scrollbar scroll-smooth" : "grid"
                  )}
                  style={{ 
                    gridTemplateColumns: elProps.layout === "grid" ? `repeat(${elProps.columns || 4}, minmax(0, 1fr))` : "none",
                    gap: `${elProps.gridGap || 24}px`
                  }}>
                    {/* LÓGICA DE FILTRADO Y RENDERIZADO DE PRODUCTOS */}
                    {(() => {
                      const filteredProducts = (realProducts || [])
                        .filter((p: any) => elProps.selectedCategory === "all" || p.category_id === elProps.selectedCategory)
                        .slice(0, elProps.itemsCount || 4);
                      
                      // Si no hay productos reales, creamos placeholders que imiten la estructura
                      const displayItems = filteredProducts.length > 0 ? filteredProducts : Array.from({ length: elProps.itemsCount || 4 });

                      return displayItems.map((p: any, i: number) => (
                        <motion.div 
                          key={p?.id || i} 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={cn(
                            "relative group flex flex-col transition-all duration-300",
                            elProps.cardStyle === "glass" ? "bg-white/10 backdrop-blur-md border border-white/20 shadow-xl" : 
                            elProps.cardStyle === "minimal" ? "bg-transparent border-none" : "bg-white shadow-lg",
                            "rounded-[20px] overflow-hidden"
                          )}
                          style={{ 
                            minWidth: elProps.layout === "carousel" ? "280px" : "auto",
                            borderRadius: `${elProps.cardBorderRadius || 20}px`,
                            height: elProps.cardHeight ? `${elProps.cardHeight}px` : (elProps.showDescription ? "450px" : "350px")
                          }}
                        >
                          {/* ETIQUETA DE OFERTA */}
                          {elProps.showOfferBadge && (
                            <div className="absolute top-6 left-6 z-20 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg animate-pulse">
                              {elProps.offerBadgeText || "OFERTA"}
                            </div>
                          )}

                          {/* IMAGEN DEL PRODUCTO (CONTENIDA) */}
                          <div className="p-4 pb-0 w-full">
                            <div className={cn(
                              "w-full bg-gray-50/10 relative overflow-hidden",
                              elProps.imageAspectRatio === "square" ? "aspect-square" : "aspect-[4/5]"
                            )}
                            style={{ borderRadius: `${(elProps.cardBorderRadius || 20) * 0.6}px` }}
                            >
                              {p?.main_image ? (
                                <img src={p.main_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <ShoppingBag size={40} className="opacity-20" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* INFO DEL PRODUCTO */}
                          <div className="p-6 pt-4 flex flex-col gap-4 text-left flex-1">
                            <div className="space-y-2">
                              <h3 className={cn("font-black uppercase tracking-tighter leading-none", elProps.cardStyle === "glass" ? "text-white" : "text-gray-900")} style={{ fontSize: "14px" }}>
                                {p?.title || "Producto de Ejemplo"}
                              </h3>
                              
                              {elProps.showDescription && (
                                <p className="line-clamp-2 opacity-60" style={{ 
                                  color: elProps.descriptionColor || "#9ca3af",
                                  fontSize: `${elProps.descriptionSize || 9}px`,
                                  fontFamily: elProps.descriptionFont || "font-sans"
                                }}>
                                  {p?.description || "Una breve descripción del producto que resalta sus mejores cualidades y beneficios para el cliente."}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col items-start gap-4">
                              {elProps.showPrice && (
                                <div className="flex flex-col">
                                  {renderTextWithTheme(`$${p?.price || "99.00"}`, elProps, "price", `price-${i}`, elProps.cardStyle !== "glass")}
                                </div>
                              )}
                              
                              {elProps.showAddToCart && (
                                <div className="scale-90 origin-left">
                                  {renderButton({ 
                                    text: elProps.addToCartText || "Añadir", 
                                    variant: elProps.addToCartVariant || "solid",
                                    bgColor: elProps.addToCartBgColor || "#000000",
                                    textColor: elProps.addToCartTextColor || "#ffffff",
                                    borderRadius: elProps.addToCartBorderRadius || 12,
                                    size: elProps.addToCartSize || 10
                                  }, "addToCart", `btn-cart-${i}`)}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ));
                    })()}
                  </div>
                  
                  {/* BARRA DE SCROLL PARA CARRUSEL */}
                  {elProps.layout === "carousel" && elProps.showScrollbar && (
                    <div className="mt-6 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-1/3 rounded-full" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
