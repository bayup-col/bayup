import { v4 as uuidv4 } from "uuid";
import { PageSchema, ComponentType } from "@/app/dashboard/pages/studio/context";

// --- DEFINICIÓN DE LOS 6 TIPOS DE PÁGINA ---
type PageType = 'home' | 'colecciones' | 'productos' | 'nosotros' | 'legal' | 'checkout';

// --- PALETAS DE COLOR POR ESTILO ---
const THEMES = {
  t1: { // Aura Minimal (Moda)
    bg: "#ffffff", text: "#111827", accent: "#059669", font: "font-sans", 
    radius: 0, navVariant: "minimal", heroVariant: "clean"
  },
  t2: { // Pixel Tech (Tecnología)
    bg: "#0f172a", text: "#f8fafc", accent: "#3b82f6", font: "font-mono", 
    radius: 12, navVariant: "glass", heroVariant: "glow"
  },
  t3: { // Vogue Pro (Editorial)
    bg: "#fff1f2", text: "#881337", accent: "#be123c", font: "font-serif", 
    radius: 0, navVariant: "solid", heroVariant: "split"
  },
  t4: { // Mechanic Pro (Industrial)
    bg: "#1c1917", text: "#e7e5e4", accent: "#f59e0b", font: "font-black", 
    radius: 4, navVariant: "solid", heroVariant: "bold"
  },
  t5: { // Hyper Speed (Deportivo)
    bg: "#ffffff", text: "#000000", accent: "#ef4444", font: "font-black", 
    radius: 32, navVariant: "floating", heroVariant: "slant"
  },
  t6: { // Collector Edition (Funko/Toys)
    bg: "#4c1d95", text: "#ffffff", accent: "#22d3ee", font: "font-sans", 
    radius: 24, navVariant: "glass", heroVariant: "pop"
  }
};

// --- GENERADOR DE ESQUEMAS ---
export const generateTemplateSchema = (templateId: string): Record<PageType, PageSchema> => {
  const theme = THEMES[templateId as keyof typeof THEMES] || THEMES.t1;
  const isDark = ['t2', 't4', 't6'].includes(templateId);

  // 1. HEADER COMÚN (Navegación)
  const headerSchema = {
    elements: [{
      id: uuidv4(),
      type: "navbar" as ComponentType,
      props: {
        logoText: "TU TIENDA",
        bgColor: theme.bg,
        menuColor: theme.text,
        menuFont: theme.font,
        logoColor: theme.accent,
        navHeight: 80,
        showCart: true,
        showUser: true,
        showSearch: true,
        menuItems: [
            { label: "Inicio", url: "/" },
            { label: "Catálogo", url: "/productos" },
            { label: "Nosotros", url: "/nosotros" }
        ]
      }
    }],
    styles: { backgroundColor: theme.bg }
  };

  // 2. FOOTER COMÚN
  const footerSchema = {
    elements: [{
      id: uuidv4(),
      type: "footer-premium" as ComponentType,
      props: {
        bgColor: isDark ? "#000000" : "#f3f4f6",
        textColor: isDark ? "#ffffff" : "#1f2937",
        accentColor: theme.accent,
        copyright: `© ${new Date().getFullYear()} Todos los derechos reservados.`
      }
    }],
    styles: { backgroundColor: isDark ? "#000000" : "#f3f4f6" }
  };

  // --- GENERACIÓN DE PÁGINAS ---

  return {
    // 1. PAGINA DE INICIO
    home: {
      header: headerSchema,
      footer: footerSchema,
      body: {
        elements: [
          {
            id: uuidv4(),
            type: "hero-banner",
            props: {
              title: "NUEVA COLECCIÓN",
              subtitle: "Descubre los productos que definen tendencia este año.",
              titleColor: isDark ? "#ffffff" : "#000000",
              titleFont: theme.font,
              bgType: "image",
              imageUrl: templateId === 't4' 
                ? "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2000" // Mechanic
                : "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000", // Default
              height: 600,
              primaryBtnBgColor: theme.accent,
              primaryBtnVariant: "solid"
            }
          },
          {
            id: uuidv4(),
            type: "categories-grid",
            props: {
              title: "Categorías Destacadas",
              cardStyle: "premium",
              catTitleFont: theme.font,
              catTitleColor: "#ffffff"
            }
          },
          {
            id: uuidv4(),
            type: "product-grid",
            props: {
              title: "Más Vendidos",
              itemsCount: 4,
              columns: 4,
              priceColor: theme.accent,
              priceFont: theme.font,
              cardBorderRadius: theme.radius
            }
          }
        ],
        styles: { backgroundColor: theme.bg }
      }
    },

    // 2. COLECCIONES (Product Detail Page - PDP)
    colecciones: {
      header: headerSchema,
      footer: footerSchema,
      body: {
        elements: [
          {
            id: uuidv4(),
            type: "product-master-view",
            props: {
              titleColor: theme.text,
              titleFont: theme.font,
              priceColor: theme.accent,
              priceFont: theme.font,
              mainImageSize: 100, // %
              galleryEffect: "zoom-swap"
            }
          },
          {
            id: uuidv4(),
            type: "product-grid",
            props: {
              title: "Productos Relacionados",
              itemsCount: 4,
              columns: 4,
              priceColor: theme.accent
            }
          }
        ],
        styles: { backgroundColor: theme.bg }
      }
    },

    // 3. TODOS LOS PRODUCTOS (Catálogo)
    productos: {
      header: headerSchema,
      footer: footerSchema,
      body: {
        elements: [
          {
            id: uuidv4(),
            type: "hero-banner",
            props: {
              title: "CATÁLOGO COMPLETO",
              height: 300,
              titleSize: 40,
              titleColor: "#ffffff",
              overlayOpacity: 60
            }
          },
          {
            id: uuidv4(),
            type: "product-grid",
            props: {
              itemsCount: 20,
              columns: 4,
              showFilters: true,
              filterStyle: "list",
              priceColor: theme.accent,
              cardBorderRadius: theme.radius
            }
          }
        ],
        styles: { backgroundColor: theme.bg }
      }
    },

    // 4. SOBRE LA MARCA (Blog/Nosotros)
    nosotros: {
      header: headerSchema,
      footer: footerSchema,
      body: {
        elements: [
          {
            id: uuidv4(),
            type: "hero-banner",
            props: {
              title: "NUESTRA HISTORIA",
              height: 400,
              bgType: "color",
              bgColor: isDark ? "#1f2937" : "#f3f4f6",
              titleColor: theme.text
            }
          },
          {
            id: uuidv4(),
            type: "text",
            props: {
              content: "Somos una empresa dedicada a ofrecer la mejor calidad...",
              color: theme.text,
              fontFamily: theme.font,
              fontSize: 18,
              align: "left"
            }
          },
          {
            id: uuidv4(),
            type: "cards",
            props: {
              columns: 3,
              cards: [
                { id: uuidv4(), title: "Misión", description: "Innovar constantemente.", icon: "Rocket", iconColor: theme.accent },
                { id: uuidv4(), title: "Visión", description: "Liderar el mercado global.", icon: "Eye", iconColor: theme.accent },
                { id: uuidv4(), title: "Valores", description: "Integridad y Pasión.", icon: "Heart", iconColor: theme.accent }
              ]
            }
          }
        ],
        styles: { backgroundColor: theme.bg }
      }
    },

    // 5. POLITICAS Y LEGAL
    legal: {
      header: headerSchema,
      footer: footerSchema,
      body: {
        elements: [
          {
            id: uuidv4(),
            type: "text",
            props: {
              content: "TÉRMINOS Y CONDICIONES",
              fontSize: 32,
              fontFamily: "font-black",
              color: theme.text,
              align: "center"
            }
          },
          {
            id: uuidv4(),
            type: "text",
            props: {
              content: `1. Introducción
Al acceder a este sitio web, asumimos que aceptas estos términos y condiciones en su totalidad.

2. Licencia
A menos que se indique lo contrario, nosotros y/o nuestros licenciantes poseemos los derechos de propiedad intelectual...`,
              fontSize: 14,
              color: isDark ? "#9ca3af" : "#4b5563",
              align: "left"
            }
          }
        ],
        styles: { backgroundColor: theme.bg }
      }
    },

    // 6. CHECKOUT (Finalización de Compra)
    checkout: {
      header: headerSchema,
      footer: { elements: [], styles: {} }, // Checkout suele ser limpio sin footer complejo
      body: {
        elements: [
          {
            id: uuidv4(),
            type: "custom-block", // Bloque nativo de checkout
            props: {
              title: "Finalizar Compra",
              themeColor: theme.bg,
              accentColor: theme.accent,
              fontFamily: theme.font,
              borderRadius: theme.radius
            }
          }
        ],
        styles: { backgroundColor: isDark ? "#000000" : "#f8fafc" }
      }
    }
  };
};
