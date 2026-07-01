"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/context/toast-context";

// --- Tipos ---
export type SectionType = "header" | "body" | "footer";
export type ComponentType = "text" | "button" | "image" | "product-grid" | "hero-banner" | "video" | "announcement-bar" | "navbar" | "custom-block" | "cards" | "product-master-view" | "footer-premium" | "categories-grid" | "text-block-premium" | "contact-form" | "product-detail";

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
  const { showToast } = useToast();
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
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [pagesData, setPagesData] = useState<Record<string, PageSchema>>({
    home: DEFAULT_SCHEMA,
    colecciones: DEFAULT_SCHEMA,
    productos: DEFAULT_SCHEMA,
    checkout: DEFAULT_SCHEMA
  });

  useEffect(() => {
    const loadEverything = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.bayup.com.co";

      // 1. Cargar Perfil (para el Slug)
      if (token) {
        try {
          const uRes = await fetch(`${apiBase}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (uRes.ok) {
            const uData = await uRes.json();
            setUserProfile(uData);
          }
        } catch (e) {}
      }
      
      // 2. Cargar Diseño de DB (fuente de verdad: incluye los cambios ya guardados)
      let loadedFromDb = false;
      if (token) {
        try {
          const res = await fetch(`${apiBase}/shop-pages/${pageKey}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.schema_data && (data.schema_data.header || data.schema_data.body || data.schema_data.footer)) {
              const raw = data.schema_data;
              const merged: PageSchema = {
                header: raw.header ? { elements: raw.header.elements || [], styles: raw.header.styles || {} } : DEFAULT_SCHEMA.header,
                body:   raw.body   ? { elements: raw.body.elements   || [], styles: raw.body.styles   || {} } : DEFAULT_SCHEMA.body,
                footer: raw.footer ? { elements: raw.footer.elements || [], styles: raw.footer.styles || {} } : DEFAULT_SCHEMA.footer,
              };
              setPagesData(prev => ({ ...prev, [pageKey]: merged }));
              loadedFromDb = true;
            }
          }
        } catch (e) {}
      }

      // 3. Si la DB aun no tiene nada guardado para esta pagina, sembramos desde la plantilla local
      if (!loadedFromDb && templateId && templateId.startsWith('tpl-')) {
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
              setPagesData(prev => ({ ...prev, [pageKey]: schema }));
            }
          } catch (e) {}
        }
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
      const sectionData = page[section] || DEFAULT_SCHEMA[section];
      const elements = sectionData.elements.map(el => el.id === id ? { ...el, props: { ...el.props, ...newProps } } : el);
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
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.bayup.com.co";
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
      showToast("Borrador guardado correctamente", "success");
    } catch (e) {
      showToast("No se pudo guardar el borrador", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const publishPage = async () => {
    setIsPublishing(true);
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Debes iniciar sesión para publicar", "error");
      setIsPublishing(false);
      return;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.bayup.com.co";
      const res = await fetch(`${apiBase}/shop-pages/publish`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          page_key: pageKey,
          schema_data: pageData
        })
      });

      if (res.ok) {
        showToast("¡Tu web ya está en vivo! 🚀", "success");
        
        // Abrir la web real en nueva pestaña
        if (userProfile?.shop_slug) {
            const origin = window.location.origin;
            const viewParam = pageKey !== 'home' ? `?view=${pageKey}` : '';
            const shopUrl = `${origin}/shop/${userProfile.shop_slug}${viewParam}`;
            setTimeout(() => {
                window.open(shopUrl, '_blank');
            }, 1000);
        }
      } else {
        showToast("Error al publicar la página", "error");
      }
    } catch (e) {
      showToast("Error de conexión con el servidor", "error");
    } finally {
      setIsPublishing(false);
    }
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
