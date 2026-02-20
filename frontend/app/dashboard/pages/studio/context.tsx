"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { useSearchParams } from "next/navigation";

// --- Tipos ---
export type SectionType = "header" | "body" | "footer";
export type ComponentType = "text" | "button" | "image" | "product-grid" | "hero-banner" | "video" | "announcement-bar" | "navbar" | "custom-block" | "cards" | "product-master-view" | "footer-premium" | "categories-grid";

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

const DEFAULT_SCHEMA: PageSchema = { header: { elements: [], styles: {} }, body: { elements: [], styles: {} }, footer: { elements: [], styles: {} } };

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
  viewport: "desktop" | "tablet" | "mobile";
  setViewport: (v: "desktop" | "tablet" | "mobile") => void;
  editMode: "all" | "individual";
  setEditMode: (mode: "all" | "individual") => void;
  pageKey: string;
  headerLocked: boolean;
  setHeaderLocked: (locked: boolean) => void;
  footerLocked: boolean;
  setFooterLocked: (locked: boolean) => void;
  publishPage: () => Promise<void>;
  saveDraft: () => Promise<void>;
  isPublishing: boolean;
  isSaving: boolean;
  isLoading: boolean;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export const StudioProvider = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
  const pageKey = searchParams.get("page") || "home";
  const templateId = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionType>("body");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [editMode, setEditMode] = useState<"all" | "individual">("all");
  const [sidebarView, setSidebarView] = useState<"toolbox" | "properties">("toolbox");
  
  const [pagesData, setPagesData] = useState<Record<string, PageSchema>>({
    home: DEFAULT_SCHEMA,
    colecciones: DEFAULT_SCHEMA,
    productos: DEFAULT_SCHEMA,
    checkout: DEFAULT_SCHEMA
  });

  useEffect(() => {
    const loadEverything = async () => {
      setIsLoading(true);
      
      if (templateId && templateId.startsWith('tpl-')) {
        const idToFolder: any = {
          'tpl-comp': 'computadora', 'tpl-hogar': 'Hogar', 'tpl-joyeria': 'Joyeria',
          'tpl-jugueteria': 'Jugueteria', 'tpl-lenceria': 'lenceria', 'tpl-maquillaje': 'Maquillaje',
          'tpl-papeleria': 'Papeleria', 'tpl-pocket': 'pocket', 'tpl-ropa-elegante': 'Ropa elegante',
          'tpl-tecno': 'Tecnologia', 'tpl-tenis': 'Tenis', 'tpl-zapatos': 'Zapatos'
        };
        const folder = idToFolder[templateId];
        if (folder) {
          try {
            const res = await fetch(`/templates/custom-html/${folder}/architecture.json`);
            if (res.ok) {
              const schema = await res.json();
              setPagesData({ [pageKey]: schema });
              setIsLoading(false);
              return;
            }
          } catch (e) {}
        }
      }

      const token = localStorage.getItem("token");
      if (token) {
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const res = await fetch(`${apiBase}/shop-pages/${pageKey}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.schema_data) setPagesData(prev => ({ ...prev, [pageKey]: data.schema_data }));
          }
        } catch (e) {}
      }
      
      setIsLoading(false);
    };

    loadEverything();
  }, [pageKey, templateId]);

  const pageData = pagesData[pageKey] || DEFAULT_SCHEMA;

  const selectElement = (id: string | null) => {
    setSelectedElementId(id);
    setSidebarView(id ? "properties" : "toolbox");
  };

  const updateElement = (section: SectionType, id: string, newProps: Record<string, any>) => {
    setPagesData(prev => {
      const page = prev[pageKey] || DEFAULT_SCHEMA;
      const elements = page[section].elements.map(el => el.id === id ? { ...el, props: { ...el.props, ...newProps } } : el);
      return { ...prev, [pageKey]: { ...page, [section]: { ...page[section], elements } } };
    });
  };

  const saveDraft = async () => {
    setIsSaving(true);
    const token = localStorage.getItem("token");
    if (!token) {
        setIsSaving(false);
        return;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiBase}/shop-pages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          page_key: pageKey,
          schema_data: pageData,
          template_id: templateId
        })
      });
    } catch (e) {
      console.error("Error al guardar:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const publishPage = async () => {
    setIsPublishing(true);
    await saveDraft();
    setIsPublishing(false);
  };

  return (
    <StudioContext.Provider value={{ 
      activeSection, setActiveSection, selectedElementId, selectElement, pageData, 
      addElement: () => {}, updateElement, removeElement: () => {}, 
      sidebarView, toggleSidebar: (v) => setSidebarView(v), handleDragEnd: () => {}, 
      viewport, setViewport, editMode, setEditMode, pageKey,
      headerLocked: true, setHeaderLocked: () => {}, footerLocked: true, setFooterLocked: () => {},
      publishPage, saveDraft, isPublishing, isSaving, isLoading
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
