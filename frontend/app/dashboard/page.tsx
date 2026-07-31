import { getDashboardInitialData } from '@/lib/dashboard-data';
import DashboardContent from './DashboardContent';

// Server Component: resuelve la carga inicial (productos, pedidos, gastos)
// en el servidor leyendo la cookie httpOnly de sesión, para que el dashboard
// no arranque con listas vacías mientras el cliente hidrata y recién ahí
// dispara el fetch — mismo patrón ya aplicado en la tienda pública
// (frontend/app/shop/[slug]/page.tsx). La interactividad y el refresco de
// datos siguen viviendo en <DashboardContent>, que además vuelve a pedir
// estos mismos datos por su cuenta (incluye "activities" para super admin,
// que no se resuelve aquí).
export default async function DashboardPage() {
  const initialData = await getDashboardInitialData();
  return <DashboardContent initialData={initialData} />;
}
