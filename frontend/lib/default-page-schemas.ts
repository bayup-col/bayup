import { v4 as uuidv4 } from "uuid";
import type { StudioElement } from "@/app/dashboard/pages/studio/context";

/**
 * Contenido por defecto para paginas secundarias (catalog/about/product) que
 * una plantilla instalada solo crea para "home". Reutiliza el header/footer
 * de home (logo, navbar, footer) para que se vean consistentes con el resto
 * del sitio, y arma un cuerpo generico funcional por tipo de pagina.
 */
export function buildDefaultBodyElements(pageKey: "catalog" | "about" | "product"): StudioElement[] {
  if (pageKey === "catalog") {
    return [
      { id: uuidv4(), type: "hero-banner", props: { badge: "Tienda", title: "Catálogo", subtitle: "Descubre nuestra selección completa de productos." } },
      { id: uuidv4(), type: "product-grid", props: { title: "Todos los productos", itemsCount: 12 } },
    ];
  }

  if (pageKey === "about") {
    return [
      { id: uuidv4(), type: "hero-banner", props: { badge: "Nosotros", title: "Sobre Nosotros", subtitle: "Conoce nuestra historia y nuestro compromiso contigo." } },
      { id: uuidv4(), type: "text-block-premium", props: { title: "NUESTRA HISTORIA", subtitle: "Comprometidos con la calidad", content: "Somos una tienda dedicada a ofrecerte productos de calidad y una experiencia de compra confiable. Cada detalle de nuestro catálogo está pensado para ti." } },
      { id: uuidv4(), type: "contact-form", props: { badge: "Contacto", title: "¿Tienes alguna pregunta?" } },
    ];
  }

  // product
  return [
    { id: uuidv4(), type: "product-detail", props: {} },
  ];
}
