import { v4 as uuidv4 } from "uuid";
import { PageSchema, ComponentType, StudioElement } from "@/app/dashboard/pages/studio/context";

type PageType = 'home' | 'colecciones' | 'productos' | 'nosotros' | 'legal' | 'checkout';

// --- CONFIGURACIÓN DE IDENTIDADES VISUALES ---
const THEMES = {
  t1: { // Aura Minimal (Moda Premium)
    bg: "#ffffff", text: "#000000", accent: "#000000", font: "font-sans", radius: 0,
    isDark: false, cardStyle: "minimal" as any, navAlign: "center" as any
  },
  t2: { // Pixel Tech (Tecnología / Celulares)
    bg: "#020617", text: "#f8fafc", accent: "#00f2ff", font: "font-mono", radius: 24,
    isDark: true, cardStyle: "premium" as any, navAlign: "left" as any
  },
  t3: { // Vogue Pro (Editorial / Vestidos)
    bg: "#fafafa", text: "#1a1a1a", accent: "#be123c", font: "font-serif", radius: 0,
    isDark: false, cardStyle: "premium" as any, navAlign: "center" as any
  },
  t4: { // Mechanic Pro (Repuestos / Herramientas)
    bg: "#0c0a09", text: "#e7e5e4", accent: "#f59e0b", font: "font-black", radius: 8,
    isDark: true, cardStyle: "solid" as any, navAlign: "left" as any
  },
  t5: { // Hyper Speed (Zapatillas / Deporte)
    bg: "#ffffff", text: "#000000", accent: "#ef4444", font: "font-black", radius: 40,
    isDark: false, cardStyle: "premium" as any, navAlign: "center" as any
  },
  t6: { // Collector Edition (Funko Pops / Juguetes)
    bg: "#1e1b4b", text: "#ffffff", accent: "#22d3ee", font: "font-sans", radius: 32,
    isDark: true, cardStyle: "premium" as any, navAlign: "left" as any
  }
};

export const generateTemplateSchema = (templateId: string): Record<PageType, PageSchema> => {
  const theme = THEMES[templateId as keyof typeof THEMES] || THEMES.t1;
  
  // --- HELPER PARA CREAR NAVBAR SEGÚN ESTILO ---
  const createHeader = (): any => ({
    elements: [{
      id: uuidv4(),
      type: "navbar",
      props: {
        logoText: "STORE NAME",
        bgColor: theme.isDark ? theme.bg : "#ffffff",
        menuColor: theme.text,
        logoColor: theme.accent,
        menuFont: theme.font,
        logoFont: theme.font,
        navHeight: templateId === 't1' ? 100 : 80,
        align: theme.navAlign,
        showCart: true, showUser: true, showSearch: true,
        menuItems: [
          { label: "INICIO", url: "/" },
          { label: "PRODUCTOS", url: "/productos" },
          { label: "NOSOTROS", url: "/nosotros" }
        ]
      }
    }],
    styles: { backgroundColor: theme.bg }
  });

  // --- HELPER PARA CREAR FOOTER SEGÚN ESTILO ---
  const createFooter = (): any => ({
    elements: [{
      id: uuidv4(),
      type: "footer-premium",
      props: {
        bgColor: theme.isDark ? "#000000" : "#f9fafb",
        textColor: theme.text,
        accentColor: theme.accent,
        footerLogoFont: theme.font,
        description: "Calidad y confianza en cada entrega.",
        copyright: `© ${new Date().getFullYear()} Bayup Commerce.`
      }
    }],
    styles: { backgroundColor: theme.isDark ? "#000000" : "#f9fafb" }
  });

  // --- CONSTRUCCIÓN DE LAS 6 PÁGINAS ---
  const schemas: any = {};

  // 1. HOME (Diferente estructura por tema)
  schemas.home = {
    header: createHeader(),
    footer: createFooter(),
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "hero-banner",
          props: {
            title: templateId === 't4' ? "EQUIPO PROFESIONAL" : "ESTILO SIN LÍMITES",
            subtitle: "La mejor selección de productos comerciales en un solo lugar.",
            height: templateId === 't2' ? 800 : 600,
            bgType: "image",
            imageUrl: templateId === 't4' ? "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2000" : "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000",
            titleVariant: theme.isDark ? "aurora" : "solid",
            titleAurora1: theme.accent,
            primaryBtnBgColor: theme.accent,
            primaryBtnBorderRadius: theme.radius
          }
        },
        templateId === 't2' || templateId === 't4' ? {
          id: uuidv4(),
          type: "video",
          props: { height: 500, title: "Ingeniería en Movimiento" }
        } : {
          id: uuidv4(),
          type: "categories-grid",
          props: { title: "Colecciones", cardStyle: theme.cardStyle, gridGap: 32 }
        },
        {
          id: uuidv4(),
          type: "product-grid",
          props: { title: "Destacados", itemsCount: 4, columns: 4, cardStyle: theme.cardStyle, cardBorderRadius: theme.radius, priceColor: theme.accent }
        }
      ].filter(Boolean),
      styles: { backgroundColor: theme.bg }
    }
  };

  // 2. COLECCIONES (PDP - Ficha de Producto)
  schemas.colecciones = {
    header: createHeader(),
    footer: createFooter(),
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "product-master-view",
          props: {
            titleFont: theme.font,
            titleColor: theme.text,
            priceColor: theme.accent,
            priceFont: theme.font,
            galleryEffect: templateId === 't2' ? "grid-reveal" : "zoom-swap",
            mainImageSize: 100
          }
        },
        {
          id: uuidv4(),
          type: "product-grid",
          props: { title: "Completa tu estilo", itemsCount: 4, columns: 4, priceColor: theme.accent }
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // 3. PRODUCTOS (Catálogo total con filtros)
  schemas.productos = {
    header: createHeader(),
    footer: createFooter(),
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "announcement-bar",
          props: { content: "Envíos gratis en compras mayores a $200.000", bgColor: theme.accent, textColor: theme.isDark ? "#000" : "#fff" }
        },
        {
          id: uuidv4(),
          type: "product-grid",
          props: { 
            itemsCount: 16, 
            columns: templateId === 't1' ? 3 : 4, 
            showFilters: true, 
            filterStyle: "premium",
            cardStyle: theme.cardStyle,
            priceColor: theme.accent
          }
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // 4. NOSOTROS (Página de Marca / Blog)
  schemas.nosotros = {
    header: createHeader(),
    footer: createFooter(),
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "hero-banner",
          props: { title: "Sobre Nosotros", subtitle: "Nuestra pasión por la excelencia.", height: 400, bgType: "color", bgColor: theme.isDark ? "#111" : "#f3f4f6" }
        },
        {
          id: uuidv4(),
          type: "text",
          props: { content: "Llevamos años liderando el mercado de productos comerciales con un enfoque en la calidad...", align: "center", color: theme.text, fontSize: 20 }
        },
        {
          id: uuidv4(),
          type: "cards",
          props: { columns: 3, cards: [
            { id: uuidv4(), title: "Garantía", icon: "Shield", iconColor: theme.accent },
            { id: uuidv4(), title: "Soporte", icon: "MessageCircle", iconColor: theme.accent },
            { id: uuidv4(), title: "Rapidez", icon: "Zap", iconColor: theme.accent }
          ]}
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // 5. LEGAL (Términos y Condiciones)
  schemas.legal = {
    header: createHeader(),
    footer: createFooter(),
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "text",
          props: { content: "AVISO LEGAL Y POLÍTICAS", align: "center", color: theme.text, fontSize: 32, fontFamily: theme.font }
        },
        {
          id: uuidv4(),
          type: "text",
          props: { 
            content: `1. Datos Identificativos: En cumplimiento con el deber de información...
            2. Usuarios: El acceso y/o uso de este portal atribuye la condición de USUARIO...
            3. Uso del Portal: El sitio web proporciona acceso a multitud de informaciones, servicios, programas o datos...`,
            align: "left", color: theme.isDark ? "#9ca3af" : "#4b5563", fontSize: 14 
          }
        }
      ],
      styles: { backgroundColor: theme.bg }
    }
  };

  // 6. CHECKOUT (Pasarela de Pago Final)
  schemas.checkout = {
    header: createHeader(),
    footer: { elements: [], styles: {} },
    body: {
      elements: [
        {
          id: uuidv4(),
          type: "custom-block",
          props: { 
            title: "Finalizar mi Compra", 
            themeColor: theme.bg, 
            accentColor: theme.accent, 
            borderRadius: theme.radius,
            showSummary: true,
            showShipping: true
          }
        }
      ],
      styles: { backgroundColor: theme.isDark ? "#000" : "#f8fafc" }
    }
  };

  return schemas;
};
