import { getProductsInitialData } from '@/lib/products-data';
import ProductsContent from './ProductsContent';

// Server Component: prefetch de productos/categorías en el servidor leyendo
// la cookie httpOnly de sesión — mismo patrón que /dashboard y
// /dashboard/orders. Preserva la regla existente de no cargar categorías
// en producción real (antes evaluada con window.location.hostname en el
// cliente, ahora con el header Host de la petición).
export default async function ProductsPage() {
  const initialData = await getProductsInitialData();
  return <ProductsContent initialData={initialData} />;
}
