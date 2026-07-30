import { getOrdersInitialData } from '@/lib/orders-data';
import OrdersContent from './OrdersContent';

// Server Component: prefetch de pedidos/productos en el servidor leyendo la
// cookie httpOnly de sesión — mismo patrón que /dashboard (page.tsx) y la
// tienda pública. La interactividad y el refresco de datos siguen viviendo
// en <OrdersContent>.
export default async function OrdersPage() {
  const initialData = await getOrdersInitialData();
  return <OrdersContent initialData={initialData} />;
}
