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
  navType: "minimal" | "centered" | "glass" | "solid" | "mega" | "floating";
  heroHeight: number;
  gridCols: number;
  isDark: boolean;
  images: { hero: string };
}

// --- ARQUITECTURA DE DISEÑO DE ALTO IMPACTO ---
const THEMES: Record<string, ThemeConfig> = {
  t1: { // URBAN RAW (Inspirado en Mattelsa / Nude Project)
    id: "t1", name: "Urban Raw", font: "font-black", bg: "#ffffff", text: "#000000", accent: "#000000", radius: 0,
    navType: "minimal", heroHeight: 800, gridCols: 2, isDark: false,
    images: { hero: "https://images.unsplash.com/photo-1529139513055-07f9127e6111?q=80&w=2000" }
  },
  t2: { // EDITORIAL LUXE (Inspirado en Studio F)
    id: "t2", name: "Editorial Luxe", font: "font-serif", bg: "#fcfcfc", text: "#1a1a1a", accent: "#be123c", radius: 4,
    navType: "centered", heroHeight: 700, gridCols: 3, isDark: false,
    images: { hero: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000" }
  },
  t3: { // CYBER GADGET (Inspirado en Tech Brands)
    id: "t3", name: "Cyber Gadget", font: "font-mono", bg: "#020617", text: "#f8fafc", accent: "#00f2ff", radius: 24,
    navType: "glass", heroHeight: 850, gridCols: 4, isDark: true,
    images: { hero: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2000" }
  },
  t4: { // INDUSTRIAL MASTER (Inspirado en Mechanic/Arturo Calle)
    id: "t4", name: "Industrial Master", font: "font-black", bg: "#0c0a09", text: "#e7e5e4", accent: "#f59e0b", radius: 4,
    navType: "solid", heroHeight: 650, gridCols: 3, isDark: true,
    images: { hero: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2000" }
  },
  t5: { // HYPER RETAIL (Inspirado en El Éxito / Amazon)
    id: "t5", name: "Hyper Retail", font: "font-sans", bg: "#ffffff", text: "#1e293b", accent: "#2563eb", radius: 12,
    navType: "mega", heroHeight: 500, gridCols: 5, isDark: false,
    images: { hero: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000" }
  },
  t6: { // COLLECTOR DREAM (Inspirado en Funko / Concept Stores)
    id: "t6", name: "Collector Dream", font: "font-sans", bg: "#1e1b4b", text: "#ffffff", accent: "#22d3ee", radius: 40,
    navType: "floating", heroHeight: 750, gridCols: 3, isDark: true,
    images: { hero: "https://images.unsplash.com/photo-1566576661368-2410a519808a?q=80&w=2000" }
  }
};

export const generateTemplateSchema = (templateId: string): Record<PageType, PageSchema> => {
  const theme = THEMES[templateId] || THEMES.t1;
  const isDark = theme.isDark;

  const createNav = () => ({
    elements: [{
      id: uuidv4(),
      type: "navbar" as ComponentType,
      props: {
        logoText: "STORE LOGO",
        bgColor: theme.bg,
        menuColor: theme.text,
        logoColor: theme.accent,
        logoFont: theme.font,
        menuFont: theme.font,
        align: theme.navType === "centered" ? "center" : "left",
        navHeight: theme.navType === "minimal" ? 100 : 80,
        showCart: true, showUser: true, showSearch: true,
        menuItems: [{ label: "INICIO", url: "/" }, { label: "TIENDA", url: "/productos" }, { label: "INFO", url: "/nosotros" }]
      }
    }],
    styles: { backgroundColor: theme.bg }
  });

  const createFooter = () => ({
    elements: [{
      id: uuidv4(),
      type: "footer-premium" as ComponentType,
      props: {
        bgColor: isDark ? "#000000" : "#f8fafc",
        textColor: theme.text,
        accentColor: theme.accent,
        footerLogoFont: theme.font,
        description: "Líderes en comercio electrónico de alto rendimiento.",
        copyright: `© ${new Date().getFullYear()} BAYUP ELITE STORE.`
      }
    }],
    styles: { backgroundColor: isDark ? "#000000" : "#f8fafc" }
  });

  const schemas: any = {};

  // --- 1. HOME (PÁGINA PRINCIPAL) ---
  schemas.home = {
    header: createNav(),
    footer: createFooter(),
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "announcement-bar",
          props: { content: "ENVIOS GRATIS POR TIEMPO LIMITADO", bgColor: theme.accent, textColor: isDark ? "#000" : "#fff", behavior: "marquee" }
        },
        {
          id: uuidv4(),
          type: "hero-banner",
          props: {
            title: theme.name.toUpperCase(),
            subtitle: "La nueva era del comercio digital comienza aquí.",
            height: theme.heroHeight,
            bgType: "image",
            imageUrl: theme.images.hero,
            titleVariant: isDark ? "aurora" : "solid",
            titleSize: 80,
            titleFont: theme.font,
            primaryBtnBgColor: theme.accent,
            primaryBtnText: "COMPRAR AHORA",
            primaryBtnBorderRadius: theme.radius
          }
        },
        {
          id: uuidv4(),
          type: "categories-grid",
          props: { title: "SELECCIÓN ESTRATÉGICA", columns: 3, gridGap: 40, cardStyle: "premium" }
        },
        {
          id: uuidv4(),
          type: "product-grid",
          props: { title: "RECIÉN LLEGADOS", itemsCount: 4, columns: theme.gridCols, cardBorderRadius: theme.radius, priceColor: theme.accent, showAddToCart: true }
        },
        {
          id: uuidv4(),
          type: "video",
          props: { height: 600, title: "Detrás de Cámaras", videoExternalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
        },
        {
            id: uuidv4(),
            type: "cards",
            props: { title: "POR QUÉ NOS ELIGEN", columns: 3, cards: [
                { id: "1", title: "CALIDAD", description: "Materiales premium certificados.", icon: "Shield", iconColor: theme.accent },
                { id: "2", title: "RAPIDEZ", description: "Entrega en 24h garantizada.", icon: "Zap", iconColor: theme.accent },
                { id: "3", title: "SOPORTE", description: "Asesoría experta real.", icon: "Bot", iconColor: theme.accent }
            ]}
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // --- 2. COLECCIONES (PDP - PRODUCT DETAIL) ---
  schemas.colecciones = {
    header: createNav(),
    footer: createFooter(),
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "product-master-view",
          props: {
            titleFont: theme.font,
            titleSize: 48,
            priceColor: theme.accent,
            priceFont: theme.font,
            galleryEffect: templateId === "t1" ? "minimal-fade" : "zoom-swap",
            mainImageSize: 100,
            badgeText: "LIMITED EDITION"
          }
        },
        {
          id: uuidv4(),
          type: "product-grid",
          props: { title: "COMPLETA TU LOOK", itemsCount: 4, columns: 4, priceColor: theme.accent, cardStyle: "minimal" }
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // --- 3. TODOS LOS PRODUCTOS (CATÁLOGO) ---
  schemas.productos = {
    header: createNav(),
    footer: createFooter(),
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "hero-banner",
          props: { title: "CATÁLOGO ELITE", height: 350, bgType: "color", bgColor: isDark ? "#111" : "#f1f5f9", titleColor: theme.text, titleSize: 50, titleFont: theme.font }
        },
        {
          id: uuidv4(),
          type: "product-grid",
          props: { 
            itemsCount: 16, 
            columns: theme.gridCols, 
            showFilters: true, 
            filterStyle: "premium",
            filterPlacement: "left",
            cardBorderRadius: theme.radius,
            priceColor: theme.accent,
            showPrice: true
          }
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // --- 4. NOSOTROS (BRAND STORY) ---
  schemas.nosotros = {
    header: createNav(),
    footer: createFooter(),
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "hero-banner",
          props: { title: "NUESTRA VISIÓN", subtitle: "Definiendo el futuro de la industria.", height: 500, bgType: "image", imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000" }
        },
        {
          id: uuidv4(),
          type: "text",
          props: { 
            content: "Nacimos de la necesidad de elevar el estándar. No solo vendemos productos, creamos legados. Cada pieza en nuestro catálogo ha pasado por un filtro riguroso de excelencia.",
            fontSize: 24, align: "center", color: theme.text, fontFamily: theme.font
          }
        },
        {
            id: uuidv4(),
            type: "custom-block",
            props: { title: "CONTACTO DIRECTO", showSummary: true, themeColor: theme.accent }
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // --- 5. LEGAL (COMPLIANCE) ---
  schemas.legal = {
    header: createNav(),
    footer: createFooter(),
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "text",
          props: { content: "TÉRMINOS DE SERVICIO Y PRIVACIDAD", fontSize: 40, fontFamily: theme.font, color: theme.text, align: "center" }
        },
        {
          id: uuidv4(),
          type: "text",
          props: { 
            content: `1. ACEPTACIÓN DE TÉRMINOS
            Al utilizar este sitio web, usted acepta cumplir con estos términos. El acceso a nuestra tienda implica la aceptación de nuestra política de privacidad y protección de datos conforme a la ley vigente.

            2. PROPIEDAD INTELECTUAL
            Todo el contenido, diseños, logos y fotografías son propiedad exclusiva de la marca. Queda prohibida su reproducción total o parcial sin autorización expresa.

            3. GARANTÍAS Y DEVOLUCIONES
            Ofrecemos garantía extendida en todos nuestros productos físicos comerciales. Para devoluciones, el producto debe estar en su empaque original...`,
            fontSize: 14, color: isDark ? "#94a3b8" : "#64748b", align: "left"
          }
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // --- 6. CHECKOUT (CONVERSIÓN FINAL) ---
  schemas.checkout = {
    header: {
      elements: [{
        id: uuidv4(),
        type: "navbar",
        props: { logoText: "CHECKOUT SEGURO", bgColor: theme.bg, menuColor: theme.text, logoColor: theme.accent, showCart: false, showUser: false, showSearch: false, menuItems: [] }
      }],
      styles: { backgroundColor: theme.bg }
    },
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
