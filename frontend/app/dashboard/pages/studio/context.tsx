"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { DragEndEvent } from "@dnd-kit/core";

// --- Tipos ---

export type SectionType = "header" | "body" | "footer";

export type ComponentType = "text" | "button" | "image" | "product-grid" | "hero-banner" | "video" | "announcement-bar" | "navbar" | "custom-block";

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
        id: "nav-1", 
        type: "navbar", 
        props: { 
          logoText: "BAYUP SHOP",
          menuItems: [{ label: "Inicio", url: "/" }, { label: "Tienda", url: "/tienda" }, { label: "Sobre Nosotros", url: "/nosotros" }],
          showCart: true, showUser: true, logoColor: "#2563eb", navHeight: 80, align: "center", bgColor: "#ffffff"
        } 
      },
    ],
    styles: { backgroundColor: "#ffffff" },
  },
  body: {
    elements: [
        { 
          id: "hero-1", 
          type: "hero-banner", 
          props: { 
            title: "NUEVA COLECCIÓN 2026", 
            subtitle: "Descubre las tendencias que están transformando el mundo.", 
            bgType: "image",
            imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
            videoUrl: "",
            overlayOpacity: 40,
            overlayColor: "#000000",
            bgEffect: "none",
            align: "center",
            textPosX: 0,
            textPosY: 0,
            height: 500,
            bgColor: "#ffffff",
            titleColor: "#ffffff",
            titleSize: 48,
            titleIntensity: 100,
            titleVariant: "solid",
            titleAurora1: "#00f2ff",
            titleAurora2: "#7000ff",
            subtitleColor: "#ffffff",
            subtitleSize: 18,
            subtitleIntensity: 100,
            subtitleVariant: "solid",
            subtitleAurora1: "#ff0080",
            subtitleAurora2: "#7000ff",
            primaryBtnText: "Explorar Ahora",
            primaryBtnVariant: "solid",
            primaryBtnBgColor: "#2563eb",
            primaryBtnColor: "#ffffff",
            primaryBtnIntensity: 100,
            secondaryBtnText: "Ver más",
            secondaryBtnVariant: "glass"
          } 
        },
    ],
    styles: { backgroundColor: "#ffffff" },
  },
  footer: {
    elements: [{ id: "f1", type: "text", props: { content: "© 2026 Bayup Interactive. Todos los derechos reservados.", fontSize: 12, align: "center", color: "#ffffff", variant: "solid", intensity: 100 } }],
    styles: { backgroundColor: "#111827", color: "white" },
  },
};

export type ViewportType = "desktop" | "tablet" | "mobile";

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
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export const StudioProvider = ({ children }: { children: ReactNode }) => {
  const [activeSection, setActiveSection] = useState<SectionType>("body");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PageSchema>(DEFAULT_SCHEMA);
  const [sidebarView, setSidebarView] = useState<"toolbox" | "properties">("toolbox");
  const [viewport, setViewport] = useState<ViewportType>("desktop");

  const selectElement = (id: string | null) => {
    setSelectedElementId(id);
    setSidebarView(id ? "properties" : "toolbox");
  };

  const addElement = (section: SectionType, type: ComponentType, index?: number) => {
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
               messages: ["¡PROMO DISPONIBLE!"], bgColor: "#004d4d", textColor: "#ffffff", fontSize: 11, align: "center", fontFamily: "font-black", behavior: "static"
             } :
             type === "navbar" ? { 
               logoText: "MI MARCA", logoUrl: null, logoSize: 24, logoAlign: "left", logoOffset: 0, logoFont: "font-sans", logoColor: "#2563eb", navHeight: 80, align: "center", menuColor: "#4b5563", utilityColor: "#6b7280", bgColor: "#ffffff", menuItems: [{ label: "Inicio", url: "/" }], utilityType: "icon", showCart: true, showUser: true 
             } :
             type === "text" ? { 
               content: "Escribe aquí tu mensaje...", fontSize: 24, color: "#1f2937", variant: "solid", intensity: 100, align: "center", fontFamily: "font-sans", textPosX: 0, textPosY: 0, aurora1: "#00f2ff", aurora2: "#7000ff"
             } :
             type === "button" ? {
               text: "Haz clic", url: "/", variant: "solid", bgColor: "#2563eb", textColor: "#ffffff", borderRadius: 12, align: "center", font: "font-black", size: 14, intensity: 100, posX: 0, posY: 0, aurora1: "#00f2ff", aurora2: "#7000ff"
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
      ...prev, [section]: { ...prev[section], elements: prev[section].elements.map((el) => el.id === id ? { ...el, props: { ...el.props, ...newProps } } : el) }
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
    <StudioContext.Provider value={{ activeSection, setActiveSection, selectedElementId, selectElement, pageData, addElement, updateElement, removeElement, sidebarView, toggleSidebar, handleDragEnd, viewport, setViewport }}>
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) throw new Error("useStudio must be used within a StudioProvider");
  return context;
};