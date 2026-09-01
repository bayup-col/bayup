// Data fetching de servidor para la tienda publica (frontend/app/shop/[slug]).
//
// `getShopBaseData` usa exactamente la misma URL + opciones de `fetch` en
// layout.tsx (generateMetadata) y en page.tsx (carga inicial) para que Next.js
// las deduplique automaticamente dentro del mismo request (request memoization
// de `fetch`) — evita pedir dos veces `/public/shop/{slug}` en cada carga.

import { sanitizeCustomHtml } from '@/lib/sanitize-custom-html';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';

export async function getShopBaseData(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/public/shop/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

// Carga completa para el primer render (SSR): tienda + productos + el diseño
// publicado de la vista solicitada, en paralelo (no dependen uno del otro,
// solo del id de la tienda) — misma estrategia que antes se hacia en el
// useEffect del cliente, movida al servidor. Productos y diseño de pagina
// se piden siempre en vivo (`cache: 'no-store'`) porque reflejan inventario,
// precios y contenido editado en el dashboard — no queremos servir una
// version cacheada desactualizada.
export async function getInitialShopData(slug: string, view: string, postSlug?: string): Promise<any | null> {
  const data = await getShopBaseData(slug);
  if (!data) return null;

  // "cart" no siempre es una pagina real persistida: para tiendas nativas
  // (bloques) su contenido es 100% dinamico (carrito en memoria) y no existe
  // una ShopPage propia, asi que reutilizamos el header/footer ya publicados
  // de "home". Pero una tienda con plantilla HTML curada (custom_html) puede
  // tener su propia pagina de carrito real (ej. Orzen) — se intenta esa
  // primero y solo se cae a "home" si de verdad no existe.
  const fetchPageWithFallback = async () => {
    const primary = await fetch(`${API_BASE}/public/stores/${data.id}/pages/${view}`, { cache: 'no-store' });
    if (primary.ok || view !== 'cart') return primary;
    return fetch(`${API_BASE}/public/stores/${data.id}/pages/home`, { cache: 'no-store' });
  };
  const fetchExtras = view === 'journal'
    ? fetch(`${API_BASE}/public/stores/${data.id}/posts`, { cache: 'no-store' })
    : (view === 'journal-post' && postSlug)
    ? fetch(`${API_BASE}/public/stores/${data.id}/posts/${postSlug}`, { cache: 'no-store' })
    : Promise.resolve(null as any);
  const [prodResult, pageResult, postsResult] = await Promise.allSettled([
    fetch(`${API_BASE}/public/stores/${data.id}/products`, { cache: 'no-store' }),
    fetchPageWithFallback(),
    fetchExtras,
  ]);

  if (prodResult.status === 'fulfilled' && prodResult.value.ok) {
    data.products = await prodResult.value.json();
  } else if (prodResult.status === 'rejected') {
    console.error('Error cargando productos', prodResult.reason);
  }
  if (postsResult.status === 'fulfilled' && postsResult.value && postsResult.value.ok) {
    const postsJson = await postsResult.value.json();
    if (view === 'journal') data.posts = postsJson;
    else data.currentPost = postsJson;
  }

  if (pageResult.status === 'fulfilled' && pageResult.value.ok) {
    const pageData = await pageResult.value.json();
    const sd = pageData?.schema_data;
    if (sd && (sd.header || sd.body || sd.footer)) {
      data.custom_schema = sd;
    }
    // Plantilla tipo HTML: no tiene schema_data, el backend devuelve el HTML
    // crudo de esta pagina puntual.
    if (pageData && pageData.html) {
      data.custom_html = (slug === 'orzen' || data.shop_slug === 'orzen')
        ? sanitizeCustomHtml(pageData.html)
        : pageData.html;
    }
  } else if (pageResult.status === 'rejected') {
    console.warn(`Diseño para vista ${view} no publicado.`);
  }

  return data;
}
