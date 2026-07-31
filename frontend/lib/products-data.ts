// Data fetching de servidor para /dashboard/products — mismo patrón que
// lib/dashboard-data.ts y lib/orders-data.ts.

import { cookies, headers } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';

export interface ProductsInitialData {
  products: any[];
  categories: any[];
}

export async function getProductsInitialData(): Promise<ProductsInitialData | null> {
  const token = cookies().get('bayup_access_token')?.value;
  if (!token) return null;

  const requestHeaders = { Cookie: `bayup_access_token=${token}` };

  // Misma regla que ya aplicaba el cliente vía window.location.hostname:
  // en producción real no se cargan categorías/colecciones en esta vista.
  const host = headers().get('host') || '';
  const isProduction = host.includes('railway.app') || host.includes('bayup.com');

  const [productsRes, categoriesRes] = await Promise.allSettled([
    fetch(`${API_BASE}/products`, { headers: requestHeaders, cache: 'no-store' }),
    isProduction
      ? Promise.resolve(null)
      : fetch(`${API_BASE}/collections`, { headers: requestHeaders, cache: 'no-store' }),
  ]);

  const readJson = async (r: PromiseSettledResult<Response | null>) => {
    if (r.status === 'fulfilled' && r.value && r.value.ok) {
      try { return await r.value.json(); } catch { return []; }
    }
    return [];
  };

  return {
    products: await readJson(productsRes),
    categories: await readJson(categoriesRes),
  };
}
