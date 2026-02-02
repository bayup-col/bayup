"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { DragEndEvent } from "@dnd-kit/core";

// --- Tipos ---

export type SectionType = "header" | "body" | "footer";

export type ComponentType = "text" | "button" | "image" | "product-grid" | "hero-banner" | "video";

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
        type: "text", // Usaremos tipos base pero con props extendidas para la nav
        props: { 
          isNav: true,
          logoText: "BAYUP SHOP",
          menuItems: ["Inicio", "Productos", "Nosotros"],
          showCart: true,
          showLogin: true
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

  const addElement = (section: SectionType, type: ComponentType) => {
    const newElement: StudioElement = {
      id: uuidv4(),
      type,
      props: type === "hero-banner" ? { title: "Nuevo Banner", subtitle: "Subtítulo" } : { content: "Nuevo Elemento" },
    };

    setPageData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        elements: [...prev[section].elements, newElement],
      },
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;

    if (over && active.data.current) {
      const componentType = active.data.current.type as ComponentType;
      const targetSection = over.id as SectionType;

      // REGLA DE ORO: Solo añadir si la zona donde se suelta es la sección activa
      if (targetSection === activeSection) {
        addElement(targetSection, componentType);
      } else {
        console.log("No tienes permiso para soltar aquí");
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