"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { DragEndEvent } from "@dnd-kit/core";

// --- Tipos ---

export type SectionType = "header" | "body" | "footer";

export type ComponentType = "text" | "button" | "image" | "product-grid" | "hero-banner" | "video" | "announcement-bar" | "navbar";

export interface StudioElement {
  id: string;
  type: ComponentType;
  props: Record<string, any>; // Propiedades editables (texto, color, url, etc.)
}

export interface PageSchema {
  header: {
    elements: StudioElement[];
    styles: Record<string, any>;
  };
  body: {
    elements: StudioElement[];
    styles: Record<string, any>;
  };
  footer: {
    elements: StudioElement[];
    styles: Record<string, any>;
  };
}

// Datos semilla (Template Default - Versión Pro)
const DEFAULT_SCHEMA: PageSchema = {
  header: {
    elements: [
      { 
        id: "nav-1", 
        type: "navbar", 
        props: { 
          logoText: "BAYUP SHOP",
          menuItems: [
            { label: "Inicio", url: "/" }, 
            { label: "Tienda", url: "/tienda" },
            { label: "Sobre Nosotros", url: "/nosotros" }
          ],
          showCart: true,
          showUser: true,
          logoColor: "#2563eb",
          navHeight: 80,
          align: "center",
          bgColor: "#ffffff"
        } 
      },
    ],
    styles: { backgroundColor: "#ffffff" },
  },
  body: {
    elements: [
        { id: "hero-1", type: "hero-banner", props: { title: "Nueva Colección 2026", subtitle: "Descubre las tendencias que están transformando el mundo.", buttonText: "Explorar Ahora" } },
        { id: "cat-1", type: "text", props: { content: "Nuestras Categorías", fontSize: "2xl", align: "center" } },
        { id: "grid-1", type: "product-grid", props: { title: "Categorías Destacadas", items: ["Moda", "Electrónica", "Hogar"] } },
        { id: "text-sep", type: "text", props: { content: "Productos más vendidos", fontSize: "2xl", align: "center" } },
        { id: "prod-1", type: "product-grid", props: { isCarousel: true } }
    ],
    styles: { backgroundColor: "#ffffff" },
  },
  footer: {
    elements: [
        { id: "f1", type: "text", props: { content: "© 2026 Bayup Interactive. Todos los derechos reservados.", fontSize: "sm", align: "center" } }
    ],
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
  addElement: (section: SectionType, type: ComponentType) => void;
  updateElement: (section: SectionType, id: string, newProps: Record<string, any>) => void;
  removeElement: (section: SectionType, id: string) => void;
  sidebarView: "toolbox" | "properties"; // Toolbox (Left) or Properties (Right)
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
    if (id) {
      setSidebarView("properties"); // Auto-abrir propiedades al seleccionar
    } else {
      setSidebarView("toolbox"); // Volver a toolbox si deselecciono
    }
  };

  const addElement = (section: SectionType, type: ComponentType, index?: number) => {
    const newElement: StudioElement = {
      id: uuidv4(),
      type,
      props: type === "hero-banner" ? { title: "Nuevo Banner", subtitle: "Subtítulo" } : 
             type === "announcement-bar" ? { 
               messages: ["¡NUEVA PROMOCIÓN DISPONIBLE! 🎊", "ENVÍOS GRATIS POR COMPRAS MAYORES A $100 🚀"],
               bgColor: "#004d4d", 
               textColor: "#ffffff",
               bgPatternUrl: null,
               fontSize: 11,
               align: "center",
               fontFamily: "font-black",
               behavior: "static", // 'static' | 'marquee' | 'slide'
               speed: 10
             } :
             type === "navbar" ? { 
               logoText: "MI MARCA", 
               logoUrl: null,
               logoSize: 24,
               logoAlign: "left",
               logoOffset: 0,
               logoFont: "font-sans",
               logoColor: "#2563eb",
               navHeight: 80,
               align: "center",
               menuColor: "#4b5563",
               utilityColor: "#6b7280",
               bgColor: "#ffffff",
               bgPatternUrl: null,
               menuItems: [{ label: "Inicio", url: "/" }, { label: "Tienda", url: "/tienda" }],
               utilityType: "icon", // 'icon' | 'text' | 'both'
               showCart: true,
               showUser: true,
               cartIcon: "ShoppingBag",
               userIcon: "User",
               utilityItems: [] as { label: string, icon: string, url: string }[] // Enlaces extra para la derecha
             } :
             type === "text" ? { 
               content: "Escribe tu mensaje aquí...", 
               fontSize: 16,
               color: "#1f2937",
               bgColor: "transparent",
               bgPatternUrl: null,
               navHeight: 60,
               align: "left",
               fontFamily: "font-sans",
               fontWeight: "font-medium",
               opacity: 100,
               animation: "none"
             } :
             { content: "Nuevo Elemento" },
    };

    setPageData((prev) => {
      const newElements = [...prev[section].elements];
      if (typeof index === 'number') {
        newElements.splice(index, 0, newElement);
      } else {
        newElements.push(newElement);
      }
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          elements: newElements,
        },
      };
    });
  };

  const moveElement = (fromSection: SectionType, toSection: SectionType, elementId: string, toIndex: number) => {
    setPageData((prev) => {
      const sourceElements = [...prev[fromSection].elements];
      const elementIdx = sourceElements.findIndex(el => el.id === elementId);
      if (elementIdx === -1) return prev;

      const [elementToMove] = sourceElements.splice(elementIdx, 1);
      
      const targetSectionElements = fromSection === toSection ? sourceElements : [...prev[toSection].elements];
      
      // Si movemos en la misma sección y hacia abajo, el índice de destino se desplaza
      // Pero si usamos el array ya 'spliced', el toIndex que viene del Canvas ya es correcto
      // para inserciones precisas.
      
      const finalElements = [...targetSectionElements];
      finalElements.splice(toIndex, 0, elementToMove);

      if (fromSection === toSection) {
        return {
          ...prev,
          [fromSection]: { ...prev[fromSection], elements: finalElements }
        };
      }

      return {
        ...prev,
        [fromSection]: { ...prev[fromSection], elements: sourceElements },
        [toSection]: { ...prev[toSection], elements: finalElements }
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;

    if (over && active.data.current) {
      const isNew = active.data.current.isNew;
      const componentType = active.data.current.type as ComponentType;
      
      // Caso A: Soltado sobre un Punto de Inserción
      if (over.id.toString().startsWith("insert-")) {
        const { section, index } = over.data.current as any;
        
        if (isNew) {
          addElement(section, componentType, index);
        } else {
          const { id: elementId, section: fromSection } = active.data.current as any;
          moveElement(fromSection, section, elementId, index);
        }
      } 
      // Caso B: Soltado sobre la sección completa (al final)
      else {
        const targetSection = over.id as SectionType;
        if (targetSection === activeSection) {
          if (isNew) {
            addElement(targetSection, componentType);
          } else {
            const { id: elementId, section: fromSection } = active.data.current as any;
            moveElement(fromSection, targetSection, elementId, pageData[targetSection].elements.length);
          }
        }
      }
    }
  };

  const updateElement = (section: SectionType, id: string, newProps: Record<string, any>) => {
    setPageData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        elements: prev[section].elements.map((el) =>
          el.id === id ? { ...el, props: { ...el.props, ...newProps } } : el
        ),
      },
    }));
  };

  const removeElement = (section: SectionType, id: string) => {
      setPageData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        elements: prev[section].elements.filter((el) => el.id !== id),
      },
    }));
    if (selectedElementId === id) selectElement(null);
  };

  const toggleSidebar = (view: "toolbox" | "properties") => {
      setSidebarView(view);
  }

  return (
    <StudioContext.Provider
      value={{
        activeSection,
        setActiveSection,
        selectedElementId,
        selectElement,
        pageData,
        addElement,
        updateElement,
        removeElement,
        sidebarView,
        toggleSidebar,
        handleDragEnd,
        viewport,
        setViewport
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("useStudio must be used within a StudioProvider");
  }
  return context;
};
