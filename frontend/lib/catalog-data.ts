// Data fetching de servidor para /dashboard/catalog — mismo patrón que lib/products-data.ts.

import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';

export interface CatalogData {
  id: string;
  tenant_id: string;
  banner_url: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  public_url: string | null;
}

export async function getCatalogInitialData(): Promise<CatalogData | null> {
  const token = cookies().get('bayup_access_token')?.value;
  if (!token) return null;

  const requestHeaders = { Cookie: `bayup_access_token=${token}` };

  try {
    const res = await fetch(`${API_BASE}/catalog`, { headers: requestHeaders, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
