// Data fetching de servidor para /dashboard/orders — mismo patrón que
// lib/dashboard-data.ts: lee la cookie httpOnly de sesión y prefetch en el
// servidor para evitar el waterfall de useEffect tras hidratar.

import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';

export interface OrdersInitialData {
  orders: any[];
  products: any[];
}

export async function getOrdersInitialData(): Promise<OrdersInitialData | null> {
  const token = cookies().get('bayup_access_token')?.value;
  if (!token) return null;

  const headers = { Cookie: `bayup_access_token=${token}` };

  const [ordersRes, productsRes] = await Promise.allSettled([
    fetch(`${API_BASE}/orders`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE}/products`, { headers, cache: 'no-store' }),
  ]);

  const readJson = async (r: PromiseSettledResult<Response>) => {
    if (r.status === 'fulfilled' && r.value.ok) {
      try { return await r.value.json(); } catch { return []; }
    }
    return [];
  };

  const orders: any[] = await readJson(ordersRes);
  const products: any[] = await readJson(productsRes);

  return {
    // Misma regla que ya aplica el cliente: los pedidos POS no viven en esta vista.
    orders: Array.isArray(orders) ? orders.filter((o: any) => (o.source || '').toLowerCase() !== 'pos') : [],
    products: Array.isArray(products) ? products : [],
  };
}
