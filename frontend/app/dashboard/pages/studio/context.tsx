"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { DragEndEvent } from "@dnd-kit/core";

// --- Tipos ---

export type SectionType = "header" | "body" | "footer";

export type ComponentType = "text" | "button" | "image" | "product-grid" | "hero-banner" | "video" | "announcement-bar" | "navbar" | "custom-block" | "cards";

export interface StudioElement {
  id: string;
  type: ComponentType;
  props: Record<string, any>; 
}

export interface PageSchema {
  header: { elements: StudioElement[]; styles: Record<string, any>; };
  body: { elements: StudioElement[]; styles: Record<string, any>; };
  footer: { elements: StudioElement[]; styles: Record<string, any>; };
}

const DEFAULT_SCHEMA: PageSchema = {
  header: {
    elements: [
      { 
        id: "nav-default", 
        type: "navbar", 
        props: { 
          logoText: "BAYUP STUDIO", logoUrl: null, logoSize: 24, logoAlign: "left", logoOffset: 0, 
          logoFont: "font-black", logoColor: "#2563eb", logoVariant: "aurora", logoEffect: "none",
          logoAurora1: "#00f2ff", logoAurora2: "#7000ff", logoPosX: 0,
          navHeight: 80, align: "center", menuColor: "#4b5563", 
          menuFont: "font-black",
          menuSize: 10, menuVariant: "solid", menuEffect: "none",
          menuAurora1: "#00f2ff", menuAurora2: "#7000ff", menuPosX: 0,
          menuGap: 32,
          utilityColor: "#6b7280", 
          utilityFont: "font-black",
          utilitySize: 18,
          utilityVariant: "solid",
          utilityEffect: "none",
          utilityDisplayMode: "icon",
          utilityAurora1: "#00f2ff",
          utilityAurora2: "#7000ff",
          utilityPosX: 0,
          utilityGap: 16,
          extraUtilities: [],
          bgColor: "#ffffff", 
          menuItems: [{ label: "Inicio", url: "/" }, { label: "Tienda", url: "/tienda" }, { label: "Contacto", url: "/contacto" }], 
          showCart: true, showUser: true, showSearch: true 
        } 
      },
    ],
    styles: { backgroundColor: "#ffffff" },
  },
  body: {
    elements: [
        { 
          id: "hero-default", 
          type: "product-grid", 
          props: { 
            title: "ESTILO DEFINITIVO", 
            subtitle: "Diseña tu tienda con el editor más potente del mercado.", 
            columns: 4,
            itemsCount: 4,
            layout: "grid",
            cardStyle: "premium", 
            cardBorderRadius: 20,
            cardHeight: 450,
            showPrice: true,
            selectedCategory: "all",
            showAddToCart: true,
            bgColor: "#111827",
            titleColor: "#ffffff",
            titleSize: 48,
            titleVariant: "aurora",
            titleAurora1: "#00f2ff",
            titleAurora2: "#7000ff",
            subtitleColor: "#9ca3af",
            subtitleSize: 18,
            primaryBtnText: "Explorar Ahora",
            primaryBtnVariant: "aurora",
            primaryBtnAurora1: "#00f2ff",
            primaryBtnAurora2: "#7000ff"
          } 
        },
    ],
    styles: { backgroundColor: "#ffffff" },
  },
  footer: {
    elements: [
      { 
        id: "footer-default", 
        type: "footer-premium", 
        props: { 
          logoText: "BAYUP STUDIO",
          footerLogoSize: 24,
          footerLogoColor: "#00f2ff",
          footerLogoFont: "font-black",
          footerLogoVariant: "aurora",
          footerLogoAurora1: "#00f2ff",
          footerLogoAurora2: "#7000ff",
          description: "La herramienta líder para creadores digitales y empresarios de éxito.",
          footerDescColor: "#ffffff",
          footerDescSize: 12,
          footerCopyColor: "#ffffff",
          footerCopySize: 10,
          bgColor: "#000000",
          textColor: "#ffffff",
          accentColor: "#00f2ff",
          showSocial: true,
          menuGroups: [
            { 
              title: "Estudio", 
              show: true,
              titleColor: "#00f2ff", titleSize: 10, titleFont: "font-black",
              linksColor: "#ffffff", linksSize: 14, linksGap: 16, linksOpacity: 40,
              links: [{ label: "Editor", url: "#" }, { label: "Plantillas", url: "#" }] 
            },
            { 
              title: "Legal", 
              show: true,
              titleColor: "#00f2ff", titleSize: 10, titleFont: "font-black",
              linksColor: "#ffffff", linksSize: 14, linksGap: 16, linksOpacity: 40,
              links: [{ label: "Privacidad", url: "#" }, { label: "Términos", url: "#" }] 
            }
          ],
          copyright: "© 2026 Bayup Professional Studio. Definición de Excelencia."
        } 
      }
    ],
    styles: { backgroundColor: "#111827", color: "white" },
  },
};

export type ViewportType = "desktop" | "tablet" | "mobile";
export type EditMode = "all" | "individual";

interface StudioContextType {
  activeSection: SectionType;
  setActiveSection: (section: SectionType) => void;
  selectedElementId: string | null;
  selectElement: (id: string | null) => void;
  pageData: PageSchema;
  addElement: (section: SectionType, type: ComponentType, index?: number) => void;
  updateElement: (section: SectionType, id: string, newProps: Record<string, any>) => void;
  removeElement: (section: SectionType, id: string) => void;
  sidebarView: "toolbox" | "properties";
  toggleSidebar: (view: "toolbox" | "properties") => void;
  handleDragEnd: (event: DragEndEvent) => void;
  viewport: ViewportType;
  setViewport: (v: ViewportType) => void;
  editMode: EditMode;
  setEditMode: (mode: EditMode) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export const StudioProvider = ({ children }: { children: ReactNode }) => {
  const [activeSection, setActiveSection] = useState<SectionType>("body");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PageSchema>(DEFAULT_SCHEMA);
  const [sidebarView, setSidebarView] = useState<"toolbox" | "properties">("toolbox");
  const [viewport, setViewport] = useState<ViewportType>("desktop");
  const [editMode, setEditMode] = useState<EditMode>("all");

  const selectElement = (id: string | null) => {
    setSelectedElementId(id);
    setSidebarView(id ? "properties" : "toolbox");
  };

  const addElement = (section: SectionType, type: ComponentType, index?: number) => {
    // ... (rest of addElement remains same)
    // Definimos las props base para cualquier elemento del CUERPO para mantener consistencia
    const standardBodyProps = {
      title: "Nuevo Bloque",
      subtitle: "Añade una descripción impactante aquí.",
      titleColor: "#ffffff",
      titleSize: 48,
      titleIntensity: 100,
      titleVariant: "solid",
      titleFont: "font-black",
      subtitleColor: "#ffffff",
      subtitleSize: 18,
      subtitleIntensity: 100,
      subtitleVariant: "solid",
      primaryBtnText: "Acción Principal",
      primaryBtnVariant: "solid",
      primaryBtnBgColor: "#2563eb",
      primaryBtnBorderRadius: 12,
      secondaryBtnText: "Saber más",
      secondaryBtnVariant: "glass",
      align: "center",
      height: 400,
      bgColor: "#111827",
      overlayOpacity: 40,
      overlayColor: "#000000",
    };

    const newElement: StudioElement = {
      id: uuidv4(),
      type,
      props: type === "hero-banner" ? { 
               ...standardBodyProps, 
               title: "Nuevo Banner", 
               bgType: "image", 
               imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
             } : 
             type === "product-grid" ? {
               ...standardBodyProps,
               title: "Nuestros Productos",
               columns: 4,
               itemsCount: 4,
               layout: "grid",
               cardStyle: "premium", 
               cardBorderRadius: 20,
               cardHeight: 450,
               showDescription: false,
               descriptionColor: "#9ca3af",
               descriptionFont: "font-sans",
               descriptionSize: 9,
               descriptionVariant: "solid",
               descriptionAurora1: "#00f2ff",
               descriptionAurora2: "#7000ff",
               showPrice: true,
               priceColor: "#2563eb",
               priceFont: "font-black",
               priceSize: 14,
               priceVariant: "solid",
               priceAurora1: "#00f2ff",
               priceAurora2: "#7000ff",
               showOfferBadge: true,
               offerBadgeText: "-30% OFF",
               selectedCategory: "all",
               showAddToCart: true,
               addToCartText: "Añadir al Carrito",
               addToCartVariant: "solid",
               addToCartBgColor: "#000000",
               addToCartTextColor: "#ffffff",
               addToCartBorderRadius: 12,
               addToCartSize: 10,
               addToCartIntensity: 100,
               addToCartPosX: 0,
               addToCartPosY: 0,
               showScrollbar: true,
               scrollbarStyle: "default",
               imageAspectRatio: "square",
               gridGap: 24
             } : 
             type === "video" ? {
               ...standardBodyProps,
               title: "Video Promocional",
               videoExternalUrl: ""
             } :
             type === "custom-block" ? {
               ...standardBodyProps,
               title: "Bloque Personalizado"
             } :
                                       type === "announcement-bar" ? { 
                                         messages: ["¡PROMO DISPONIBLE!"], bgColor: "#004d4d", textColor: "#ffffff", fontSize: 11, align: "center", fontFamily: "font-black", behavior: "static",
                                         messageAnimation: "slide",
                                         messageSpeed: 20
                                       } : 
                                                    type === "navbar" ? { 
                                                      logoText: "BAYUP SHOP", logoUrl: null, logoSize: 24, logoAlign: "left", logoOffset: 0, 
                            logoFont: "font-black", logoColor: "#2563eb", logoVariant: "solid", logoEffect: "none",
                            logoAurora1: "#00f2ff", logoAurora2: "#7000ff", logoPosX: 0,
                            navHeight: 80, align: "center", menuColor: "#4b5563", 
                            menuFont: "font-black",
                            menuSize: 10, menuVariant: "solid", menuEffect: "none",
                            menuAurora1: "#00f2ff", menuAurora2: "#7000ff", menuPosX: 0,
                            menuGap: 32,
                            utilityColor: "#6b7280", 
                            utilityFont: "font-black",
                            utilitySize: 18,
                            utilityVariant: "solid",
                            utilityEffect: "none",
                            utilityDisplayMode: "icon", // icon, text, both
                            utilityAurora1: "#00f2ff",
                            utilityAurora2: "#7000ff",
                            utilityPosX: 0,
                            utilityGap: 16,
                            extraUtilities: [], // Para guardar iconos personalizados
                            bgColor: "#ffffff", 
                            menuItems: [{ label: "Inicio", url: "/" }, { label: "Tienda", url: "/tienda" }, { label: "Sobre Nosotros", url: "/nosotros" }], 
                            utilityType: "icon", showCart: true, showUser: true, showSearch: true 
                          } :              type === "text" ? { 
               content: "Escribe aquí tu mensaje...", fontSize: 24, color: "#1f2937", variant: "solid", intensity: 100, align: "center", fontFamily: "font-sans", textPosX: 0, textPosY: 0, aurora1: "#00f2ff", aurora2: "#7000ff"
             } :
             type === "button" ? {
               text: "Haz clic", url: "/", variant: "solid", bgColor: "#2563eb", textColor: "#ffffff", borderRadius: 12, align: "center", font: "font-black", size: 14, intensity: 100, posX: 0, posY: 0, aurora1: "#00f2ff", aurora2: "#7000ff"
             } : 
             type === "cards" ? {
               cards: [
                 { id: uuidv4(), title: "Calidad Premium", description: "Utilizamos los mejores materiales del mercado para garantizar durabilidad extrema.", icon: "Star", iconColor: "#2563eb", bgColor: "#ffffff" },
                 { id: uuidv4(), title: "Envío Rápido", description: "Recibe tus pedidos en la puerta de tu casa en menos de 24 horas garantizadas.", icon: "Wind", iconColor: "#059669", bgColor: "#ffffff" },
                 { id: uuidv4(), title: "Soporte 24/7", description: "Nuestro equipo de expertos está disponible en todo momento para ayudarte.", icon: "Zap", iconColor: "#7c3aed", bgColor: "#ffffff" }
               ],
               columns: 3,
               gap: 24,
               borderRadius: 24,
               height: 400
             } :
             type === "footer-premium" ? {
               logoText: "BAYUP SHOP",
               footerLogoUrl: null,
               footerLogoSize: 24,
               footerLogoPosX: 0,
               footerLogoPosY: 0,
               footerLogoColor: "#00f2ff",
               footerLogoFont: "font-black",
               footerLogoVariant: "solid",
               footerLogoEffect: "none",
               footerLogoAurora1: "#00f2ff",
               footerLogoAurora2: "#7000ff",
               description: "Transformando la forma en que el mundo compra online con tecnología de vanguardia.",
               footerDescColor: "#ffffff",
               footerDescFont: "font-sans",
               footerDescVariant: "solid",
               footerDescEffect: "none",
               footerDescAurora1: "#00f2ff",
               footerDescAurora2: "#7000ff",
               footerDescSize: 12,
               footerDescPosX: 0,
               footerDescPosY: 10,
               footerCopyColor: "#ffffff",
               footerCopyFont: "font-sans",
               footerCopyVariant: "solid",
               footerCopyEffect: "none",
               footerCopyAurora1: "#00f2ff",
               footerCopyAurora2: "#7000ff",
               footerCopySize: 10,
               footerCopyPosX: 0,
               footerCopyPosY: 0,
               bgColor: "#111827",
               textColor: "#ffffff",
               accentColor: "#00f2ff",
               showSocial: true,
               socialLinks: [
                 { id: '1', label: 'Facebook', url: '#', iconType: 'default', platform: 'facebook' },
                 { id: '2', label: 'Instagram', url: '#', iconType: 'default', platform: 'instagram' },
                 { id: '3', label: 'WhatsApp', url: '#', iconType: 'default', platform: 'whatsapp' },
                 { id: '4', label: 'TikTok', url: '#', iconType: 'default', platform: 'tiktok' }
               ],
               menuGroups: [
                 { 
                   title: "Navegación", 
                   show: true,
                   titleColor: "#00f2ff", titleSize: 10, titleFont: "font-black",
                   linksColor: "#ffffff", linksSize: 14, linksGap: 16, linksOpacity: 40,
                   posX: 0, posY: 0,
                   links: [{ label: "Inicio", url: "/" }, { label: "Tienda", url: "/tienda" }, { label: "Sobre Nosotros", url: "/nosotros" }] 
                 },
                 { 
                   title: "Legal", 
                   show: true,
                   titleColor: "#00f2ff", titleSize: 10, titleFont: "font-black",
                   linksColor: "#ffffff", linksSize: 14, linksGap: 16, linksOpacity: 40,
                   posX: 0, posY: 0,
                   links: [{ label: "Términos", url: "/terms" }, { label: "Privacidad", url: "/privacy" }, { label: "Garantía", url: "/warranty" }] 
                 },
                 { 
                   title: "Contacto", 
                   show: true,
                   titleColor: "#00f2ff", titleSize: 10, titleFont: "font-black",
                   linksColor: "#ffffff", linksSize: 14, linksGap: 16, linksOpacity: 40,
                   posX: 0, posY: 0,
                   links: [{ label: "Email", url: "mailto:info@bayup.com" }, { label: "WhatsApp", url: "https://wa.me/..." }] 
                 }
               ],
               showNewsletter: true,
               newsletterTitle: "Suscripción Pro",
               newsletterPlaceholder: "Tu mejor email...",
               newsletterTitleColor: "#00f2ff",
               newsletterTitleFont: "font-black",
               newsletterTitleSize: 10,
               newsletterTitleVariant: "solid",
               newsletterTitleEffect: "none",
               newsletterTitleAurora1: "#00f2ff",
               newsletterTitleAurora2: "#7000ff",
               newsletterPosX: 0,
               newsletterPosY: 0,
               copyright: "© 2026 Bayup Interactive. Todos los derechos reservados."
             } : { content: "Nuevo Elemento" },
    };

    setPageData((prev) => {
      const newElements = [...prev[section].elements];
      if (typeof index === 'number') newElements.splice(index, 0, newElement);
      else newElements.push(newElement);
      return { ...prev, [section]: { ...prev[section], elements: newElements } };
    });
  };

  const moveElement = (fromSection: SectionType, toSection: SectionType, elementId: string, toIndex: number) => {
    setPageData((prev) => {
      const sourceElements = [...prev[fromSection].elements];
      const elementIdx = sourceElements.findIndex(el => el.id === elementId);
      if (elementIdx === -1) return prev;
      const [elementToMove] = sourceElements.splice(elementIdx, 1);
      const targetSectionElements = fromSection === toSection ? sourceElements : [...prev[toSection].elements];
      const finalElements = [...targetSectionElements];
      finalElements.splice(toIndex, 0, elementToMove);
      if (fromSection === toSection) return { ...prev, [fromSection]: { ...prev[fromSection], elements: finalElements } };
      return { ...prev, [fromSection]: { ...prev[fromSection], elements: sourceElements }, [toSection]: { ...prev[toSection], elements: finalElements } };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    if (over && active.data.current) {
      const isNew = active.data.current.isNew;
      const componentType = active.data.current.type as ComponentType;
      if (over.id.toString().startsWith("insert-")) {
        const { section, index } = over.data.current as any;
        if (isNew) addElement(section, componentType, index);
        else moveElement(active.data.current.section, section, active.data.current.id, index);
      } else {
        const targetSection = over.id as SectionType;
        if (targetSection === activeSection) {
          if (isNew) addElement(targetSection, componentType);
          else moveElement(active.data.current.section, targetSection, active.data.current.id, pageData[targetSection].elements.length);
        }
      }
    }
  };

  const updateElement = (section: SectionType, id: string, newProps: Record<string, any>) => {
    setPageData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        elements: prev[section].elements.map((el) => {
          if (el.id !== id) return el;

          if (editMode === "individual") {
            // Guardar en overrides específicos para el viewport actual
            const currentOverrides = el.props.responsiveOverrides || {};
            const viewportOverrides = currentOverrides[viewport] || {};
            
            return {
              ...el,
              props: {
                ...el.props,
                responsiveOverrides: {
                  ...currentOverrides,
                  [viewport]: {
                    ...viewportOverrides,
                    ...newProps
                  }
                }
              }
            };
          } else {
            // Guardar en la base (afecta a todos si no hay overrides)
            return {
              ...el,
              props: {
                ...el.props,
                ...newProps
              }
            };
          }
        })
      }
    }));
  };

  const removeElement = (section: SectionType, id: string) => {
    setPageData((prev) => ({
      ...prev, [section]: { ...prev[section], elements: prev[section].elements.filter((el) => el.id !== id) }
    }));
    if (selectedElementId === id) selectElement(null);
  };

  const toggleSidebar = (view: "toolbox" | "properties") => setSidebarView(view);

  return (
    <StudioContext.Provider value={{ 
      activeSection, setActiveSection, 
      selectedElementId, selectElement, 
      pageData, addElement, updateElement, removeElement, 
      sidebarView, toggleSidebar, 
      handleDragEnd, viewport, setViewport,
      editMode, setEditMode
    }}>
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) throw new Error("useStudio must be used within a StudioProvider");
  return context;
};