// Data fetching de servidor para el dashboard principal (frontend/app/dashboard/page.tsx).
//
// El token de sesión vive solo en una cookie httpOnly (bayup_access_token) —
// nunca en localStorage ni accesible por JS del cliente. Un Server Component
// sí puede leerla vía next/headers y reenviarla al backend, igual que ya hace
// el propio backend al aceptar la cookie como alternativa al header Bearer
// (ver get_current_user en security.py).

import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';

export interface DashboardInitialData {
  products: any[];
  orders: any[];
  expenses: any[];
}

export async function getDashboardInitialData(): Promise<DashboardInitialData | null> {
  const token = cookies().get('bayup_access_token')?.value;
  if (!token) return null;

  const headers = { Cookie: `bayup_access_token=${token}` };

  const [productsRes, ordersRes, expensesRes] = await Promise.allSettled([
    fetch(`${API_BASE}/products`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE}/orders`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE}/expenses`, { headers, cache: 'no-store' }),
  ]);

  const readJson = async (r: PromiseSettledResult<Response>) => {
    if (r.status === 'fulfilled' && r.value.ok) {
      try { return await r.value.json(); } catch { return []; }
    }
    return [];
  };

  return {
    products: await readJson(productsRes),
    orders: await readJson(ordersRes),
    expenses: await readJson(expensesRes),
  };
}
