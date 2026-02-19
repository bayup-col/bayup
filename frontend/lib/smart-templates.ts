import { v4 as uuidv4 } from "uuid";
import { PageSchema } from "@/app/dashboard/pages/studio/context";

export const getSmartTemplate = (templateId: string): PageSchema => {
  const defaultSchema: PageSchema = {
    header: { elements: [], styles: {} },
    body: { elements: [], styles: {} },
    footer: { elements: [], styles: {} }
  };

  switch (templateId) {
    case 'tpl-comp':
      return {
        header: {
          elements: [{ id: uuidv4(), type: "navbar", props: { logoText: "TECH HUB", bgColor: "#ffffff", logoColor: "#1152d4", menuItems: [{ label: "PORTÁTILES", url: "#" }, { label: "EQUIPOS", url: "#" }] } }],
          styles: { position: 'sticky', top: 0, zIndex: 50 }
        },
        body: {
          elements: [
            { id: uuidv4(), type: "hero-banner", props: { title: "Potencia Sin Límites", subtitle: "Equipos de alto rendimiento.", bgType: "image", imageUrl: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?q=80&w=2000", primaryBtnBgColor: "#1152d4" } },
            { id: uuidv4(), type: "product-grid", props: { title: "Novedades", columns: 4, itemsCount: 4, priceColor: "#1152d4" } }
          ],
          styles: { backgroundColor: "#f6f6f8" }
        },
        footer: { elements: [{ id: uuidv4(), type: "footer-premium", props: { bgColor: "#0f172a", textColor: "#ffffff", accentColor: "#1152d4" } }], styles: {} }
      };

    case 'tpl-hogar':
      return {
        header: { elements: [{ id: uuidv4(), type: "navbar", props: { logoText: "HOGAR & ESTILO", bgColor: "#ffffff", logoColor: "#1754cf" } }], styles: {} },
        body: {
          elements: [
            { id: uuidv4(), type: "hero-banner", props: { title: "Transforma tu Hogar", subtitle: "Mobiliario de alta gama.", imageUrl: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=2000", primaryBtnBgColor: "#1754cf" } },
            { id: uuidv4(), type: "categories-grid", props: { title: "Inspiración", columns: 3 } }
          ],
          styles: { backgroundColor: "#ffffff" }
        },
        footer: { elements: [{ id: uuidv4(), type: "footer-premium", props: { bgColor: "#1e293b", accentColor: "#1754cf" } }], styles: {} }
      };

    case 'tpl-joyeria':
      return {
        header: { elements: [{ id: uuidv4(), type: "navbar", props: { logoText: "JEWELRY LUXE", bgColor: "#ffffff", logoColor: "#b45309" } }], styles: {} },
        body: { elements: [{ id: uuidv4(), type: "hero-banner", props: { title: "Brillo Eterno", subtitle: "Joyas que cuentan historias.", imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2000", primaryBtnBgColor: "#b45309" } }], styles: {} },
        footer: { elements: [{ id: uuidv4(), type: "footer-premium", props: { bgColor: "#451a03", accentColor: "#b45309" } }], styles: {} }
      };

    case 'tpl-jugueteria':
      return {
        header: { elements: [{ id: uuidv4(), type: "navbar", props: { logoText: "KIDS WORLD", logoColor: "#ec4899" } }], styles: {} },
        body: { elements: [{ id: uuidv4(), type: "hero-banner", props: { title: "Diversión sin Fin", subtitle: "Los mejores juguetes para los pequeños.", imageUrl: "https://images.unsplash.com/photo-1532330393533-443990a51d10?q=80&w=2000", primaryBtnBgColor: "#ec4899" } }], styles: {} },
        footer: { elements: [{ id: uuidv4(), type: "footer-premium", props: { bgColor: "#be185d", accentColor: "#ec4899" } }], styles: {} }
      };

    case 'tpl-maquillaje':
      return {
        header: { elements: [{ id: uuidv4(), type: "navbar", props: { logoText: "BEAUTY & GLOW", logoColor: "#be123c" } }], styles: {} },
        body: { elements: [{ id: uuidv4(), type: "hero-banner", props: { title: "Resalta tu Belleza", subtitle: "Cosmética profesional.", imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2000", primaryBtnBgColor: "#be123c" } }], styles: {} },
        footer: { elements: [{ id: uuidv4(), type: "footer-premium", props: { bgColor: "#881337", accentColor: "#be123c" } }], styles: {} }
      };

    case 'tpl-tenis':
      return {
        header: { elements: [{ id: uuidv4(), type: "navbar", props: { logoText: "URBAN SNEAKERS", logoColor: "#000000" } }], styles: {} },
        body: { elements: [{ id: uuidv4(), type: "hero-banner", props: { title: "Urban Culture", subtitle: "Ediciones limitadas.", imageUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2000", primaryBtnBgColor: "#000000" } }], styles: {} },
        footer: { elements: [{ id: uuidv4(), type: "footer-premium", props: { bgColor: "#000000", accentColor: "#ffffff" } }], styles: {} }
      };

    case 'tpl-tecno':
      return {
        header: { elements: [{ id: uuidv4(), type: "navbar", props: { logoText: "TECH HUB", logoColor: "#06b6d4" } }], styles: {} },
        body: { elements: [{ id: uuidv4(), type: "hero-banner", props: { title: "Next Gen Tech", subtitle: "Lo último en gadgets.", imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2000", primaryBtnBgColor: "#06b6d4" } }], styles: {} },
        footer: { elements: [{ id: uuidv4(), type: "footer-premium", props: { bgColor: "#083344", accentColor: "#06b6d4" } }], styles: {} }
      };

    case 'tpl-lenceria':
      return {
        header: { elements: [{ id: uuidv4(), type: "navbar", props: { logoText: "INTIMATE", logoColor: "#4c1d95" } }], styles: {} },
        body: { elements: [{ id: uuidv4(), type: "hero-banner", props: { title: "Elegancia Íntima", subtitle: "Seda y encaje premium.", imageUrl: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?q=80&w=2000", primaryBtnBgColor: "#4c1d95" } }], styles: {} },
        footer: { elements: [{ id: uuidv4(), type: "footer-premium", props: { bgColor: "#2e1065", accentColor: "#4c1d95" } }], styles: {} }
      };

    case 'tpl-papeleria':
      return {
        header: { elements: [{ id: uuidv4(), type: "navbar", props: { logoText: "STATIONERY", logoColor: "#15803d" } }], styles: {} },
        body: { elements: [{ id: uuidv4(), type: "hero-banner", props: { title: "Orden Creativo", subtitle: "Útiles de alta calidad.", imageUrl: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=2000", primaryBtnBgColor: "#15803d" } }], styles: {} },
        footer: { elements: [{ id: uuidv4(), type: "footer-premium", props: { bgColor: "#064e3b", accentColor: "#15803d" } }], styles: {} }
      };

    case 'tpl-ropa-elegante':
      return {
        header: { elements: [{ id: uuidv4(), type: "navbar", props: { logoText: "COUTURE", logoColor: "#1e1b4b" } }], styles: {} },
        body: { elements: [{ id: uuidv4(), type: "hero-banner", props: { title: "Classic Couture", subtitle: "Moda de lujo.", imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000", primaryBtnBgColor: "#1e1b4b" } }], styles: {} },
        footer: { elements: [{ id: uuidv4(), type: "footer-premium", props: { bgColor: "#1e1b4b", accentColor: "#ffffff" } }], styles: {} }
      };

    case 'tpl-zapatos':
      return {
        header: { elements: [{ id: uuidv4(), type: "navbar", props: { logoText: "FOOTWEAR", logoColor: "#7c2d12" } }], styles: {} },
        body: { elements: [{ id: uuidv4(), type: "hero-banner", props: { title: "Pasos con Estilo", subtitle: "Colección 2024.", imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2000", primaryBtnBgColor: "#7c2d12" } }], styles: {} },
        footer: { elements: [{ id: uuidv4(), type: "footer-premium", props: { bgColor: "#431407", accentColor: "#7c2d12" } }], styles: {} }
      };

    case 'tpl-pocket':
      return {
        header: { elements: [{ id: uuidv4(), type: "navbar", props: { logoText: "POCKET STORE", logoColor: "#ef4444" } }], styles: {} },
        body: { elements: [{ id: uuidv4(), type: "hero-banner", props: { title: "Venta Rápida", subtitle: "Compra en un clic.", imageUrl: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=2000", primaryBtnBgColor: "#ef4444" } }], styles: {} },
        footer: { elements: [{ id: uuidv4(), type: "footer-premium", props: { bgColor: "#7f1d1d", accentColor: "#ef4444" } }], styles: {} }
      };

    default:
      return defaultSchema;
  }
};
