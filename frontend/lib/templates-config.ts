import { v4 as uuidv4 } from "uuid";
import { PageSchema, ComponentType } from "@/app/dashboard/pages/studio/context";

type PageType = 'home' | 'colecciones' | 'productos' | 'nosotros' | 'legal' | 'checkout';

interface ThemeConfig {
  id: string;
  name: string;
  font: string;
  bg: string;
  text: string;
  accent: string;
  radius: number;
  isDark: boolean;
  style: "brutalist" | "editorial" | "hype" | "technical" | "retail" | "cyber";
}

const THEMES: Record<string, ThemeConfig> = {
  t1: { // SILICON PRO (Inspirado en Apple / Minimalismo Tech)
    id: "t1", name: "Silicon Pro", font: "font-sans", bg: "#ffffff", text: "#000000", accent: "#0071e3", radius: 16,
    isDark: false, style: "technical"
  },
  t2: { // EDITORIAL LUXE (Studio F)
    id: "t2", name: "Editorial Luxe", font: "font-serif", bg: "#f8f8f8", text: "#1a1a1a", accent: "#be123c", radius: 2,
    isDark: false, style: "editorial"
  },
  t3: { // CYBER GADGET (Tech Pro)
    id: "t3", name: "Cyber Gadget", font: "font-mono", bg: "#020617", text: "#f8fafc", accent: "#00f2ff", radius: 12,
    isDark: true, style: "cyber"
  },
  t4: { // INDUSTRIAL MASTER (Arturo Calle / Mechanic)
    id: "t4", name: "Industrial Master", font: "font-black", bg: "#0c0a09", text: "#e7e5e4", accent: "#f59e0b", radius: 4,
    isDark: true, style: "technical"
  },
  t5: { // HYPER RETAIL (Éxito / Amazon)
    id: "t5", name: "Hyper Retail", font: "font-sans", bg: "#ffffff", text: "#1e293b", accent: "#2563eb", radius: 8,
    isDark: false, style: "retail"
  },
  t6: { // HYPE DROP (Nude Project Style)
    id: "t6", name: "Hype Drop", font: "font-black", bg: "#fafaf9", text: "#1c1917", accent: "#ef4444", radius: 40,
    isDark: false, style: "hype"
  }
};

export const generateTemplateSchema = (templateId: string): Record<PageType, PageSchema> => {
  const theme = THEMES[templateId] || THEMES.t1;
  const isDark = theme.isDark;

  // --- COMPONENTES DE ALTA FIDELIDAD POR ESTILO ---
  
  const createNavbar = () => ({
    elements: [{
      id: uuidv4(),
      type: "navbar" as ComponentType,
      props: {
        logoText: theme.name.toUpperCase(),
        bgColor: theme.bg,
        menuColor: theme.text,
        logoColor: theme.accent,
        logoFont: theme.font,
        menuFont: theme.font,
        navHeight: theme.style === "brutalist" ? 120 : 80,
        align: theme.style === "editorial" ? "center" : "left",
        barEffect: theme.style === "cyber" ? "glass" : "none",
        showCart: true, showUser: true, showSearch: true,
        menuItems: [
          { label: "COLECCIONES", url: "/productos" },
          { label: "NUEVO", url: "/productos" },
          { label: "MARCA", url: "/nosotros" }
        ]
      }
    }],
    styles: { backgroundColor: theme.bg }
  });

  const schemas: any = {};

  // 1. HOME (DISEÑO DIFERENCIADO SEGÚN MARCA)
  schemas.home = {
    header: createNavbar(),
    footer: { elements: [{ id: uuidv4(), type: "footer-premium", props: { bgColor: isDark ? "#000" : "#f1f1f1", textColor: theme.text, accentColor: theme.accent } }], styles: {} },
    body: {
      elements: [
        // Hero de Impacto Directo
        {
          id: uuidv4(),
          type: "hero-banner",
          props: {
            title: theme.id === "t1" ? "PRO. MÁS ALLÁ." : theme.style === "brutalist" ? "NEW DROP" : theme.style === "editorial" ? "The Art of Fashion" : "NEXT GEN TECH",
            subtitle: theme.id === "t1" ? "Lo último en potencia y diseño minimalista." : "Explora la selección exclusiva de esta temporada.",
            height: theme.id === "t1" ? 850 : (theme.style === "cyber" ? 900 : 750),
            bgType: "image",
            imageUrl: theme.id === "t1" ? "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=2000" : 
                      (theme.style === "brutalist" ? "https://images.unsplash.com/photo-1529139513055-07f9127e6111?q=80&w=2000" : 
                      (theme.style === "editorial" ? "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000" :
                      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2000")),
            titleVariant: theme.style === "cyber" ? "aurora" : "solid",
            titleSize: theme.id === "t1" ? 72 : 100,
            titleFont: theme.font,
            primaryBtnText: "VER MÁS",
            primaryBtnBgColor: theme.accent,
            primaryBtnBorderRadius: theme.radius
          }
        },
        // Bloque de Categorías con Estilo
        {
          id: uuidv4(),
          type: "categories-grid",
          props: {
            title: "CATEGORÍAS",
            columns: theme.style === "retail" ? 4 : 3,
            cardHeight: theme.style === "brutalist" ? 500 : 350,
            cardBorderRadius: theme.radius,
            cardStyle: theme.style === "cyber" ? "glass" : "premium"
          }
        },
        // Rejilla de Productos con Identidad
        {
          id: uuidv4(),
          type: "product-grid",
          props: {
            title: "BEST SELLERS",
            columns: theme.style === "retail" ? 5 : theme.style === "brutalist" ? 2 : 4,
            itemsCount: 8,
            cardStyle: theme.style === "editorial" ? "minimal" : "premium",
            cardBorderRadius: theme.radius,
            priceColor: theme.accent,
            showAddToCart: theme.style !== "editorial"
          }
        },
        // Bloque de Video (Solo en marcas top)
        {
          id: uuidv4(),
          type: "video",
          props: { height: 600, title: "BRAND MOVIE", videoExternalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // 2. COLECCIONES (PDP PROFESIONAL)
  schemas.colecciones = {
    header: createNavbar(),
    footer: schemas.home.footer,
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "product-master-view",
          props: {
            titleFont: theme.font,
            titleSize: theme.style === "brutalist" ? 64 : 40,
            priceColor: theme.accent,
            galleryEffect: theme.style === "cyber" ? "grid-reveal" : "zoom-swap",
            badgeText: "EXCLUSIVE",
            mainImageSize: 100
          }
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // 3. PRODUCTOS (CATÁLOGO ALTA DENSIDAD)
  schemas.productos = {
    header: createNavbar(),
    footer: schemas.home.footer,
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "hero-banner",
          props: { title: "CATÁLOGO", height: 250, bgType: "color", bgColor: theme.accent, titleColor: isDark ? "#000" : "#fff", titleSize: 40 }
        },
        {
          id: uuidv4(),
          type: "product-grid",
          props: { 
            columns: theme.style === "retail" ? 5 : 4, 
            showFilters: true, 
            filterStyle: "premium",
            cardBorderRadius: theme.radius,
            priceColor: theme.accent
          }
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // 4. NOSOTROS (BRAND STORY)
  schemas.nosotros = {
    header: createNavbar(),
    footer: schemas.home.footer,
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "hero-banner",
          props: { title: "NUESTRA HISTORIA", height: 500, bgType: "image", imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000" }
        },
        {
          id: uuidv4(),
          type: "text",
          props: { 
            content: "Somos la definición de excelencia en el mercado comercial. Cada producto es seleccionado por expertos.",
            fontSize: 24, align: "center", color: theme.text, fontFamily: theme.font
          }
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // 5. LEGAL (CORPORATE STYLE)
  schemas.legal = {
    header: createNavbar(),
    footer: schemas.home.footer,
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "text",
          props: { content: "TÉRMINOS Y CONDICIONES", fontSize: 32, fontFamily: theme.font, color: theme.text, align: "center" }
        },
        {
          id: uuidv4(),
          type: "text",
          props: { 
            content: `1. ACEPTACIÓN: El uso de esta web implica el cumplimiento de las normas.
            2. CALIDAD: Garantizamos el estado óptimo de todos los repuestos y productos.
            3. PRIVACIDAD: Sus datos están protegidos bajo protocolos de seguridad Bayup.`,
            fontSize: 14, color: isDark ? "#94a3b8" : "#64748b", align: "left"
          }
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // 6. CHECKOUT (CONVERSIÓN PURA)
  schemas.checkout = {
    header: { elements: [{ id: uuidv4(), type: "navbar", props: { logoText: "PAGO SEGURO", bgColor: theme.bg, showCart: false, showUser: false, showSearch: false, menuItems: [] } }], styles: {} },
    footer: { elements: [], styles: {} },
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "custom-block",
          props: { 
            title: "FINALIZAR PEDIDO", 
            themeColor: theme.bg, 
            accentColor: theme.accent, 
            borderRadius: theme.radius,
            showSummary: true,
            showShipping: true,
            showPayment: true
          }
        }
      ],
      styles: { backgroundColor: isDark ? "#000" : "#f8fafc" }
    }
  };

  return schemas;
};
