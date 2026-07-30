// Data fetching de servidor para la tienda publica (frontend/app/shop/[slug]).
//
// `getShopBaseData` usa exactamente la misma URL + opciones de `fetch` en
// layout.tsx (generateMetadata) y en page.tsx (carga inicial) para que Next.js
// las deduplique automaticamente dentro del mismo request (request memoization
// de `fetch`) — evita pedir dos veces `/public/shop/{slug}` en cada carga.

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
export async function getInitialShopData(slug: string, view: string): Promise<any | null> {
  const data = await getShopBaseData(slug);
  if (!data) return null;

  const [prodResult, pageResult] = await Promise.allSettled([
    fetch(`${API_BASE}/public/stores/${data.id}/products`, { cache: 'no-store' }),
    fetch(`${API_BASE}/public/stores/${data.id}/pages/${view}`, { cache: 'no-store' }),
  ]);

  if (prodResult.status === 'fulfilled' && prodResult.value.ok) {
    data.products = await prodResult.value.json();
  } else if (prodResult.status === 'rejected') {
    console.error('Error cargando productos', prodResult.reason);
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
      data.custom_html = pageData.html;
    }
  } else if (pageResult.status === 'rejected') {
    console.warn(`Diseño para vista ${view} no publicado.`);
  }

  return data;
}
