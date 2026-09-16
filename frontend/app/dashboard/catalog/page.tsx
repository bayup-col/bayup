import { getCatalogInitialData } from '@/lib/catalog-data';
import CatalogContent from './CatalogContent';

// Server Component: prefetch del catálogo del tenant leyendo la cookie
// httpOnly de sesión — mismo patrón que /dashboard/products.
export default async function CatalogPage() {
  const initialData = await getCatalogInitialData();
  return <CatalogContent initialData={initialData} />;
}
