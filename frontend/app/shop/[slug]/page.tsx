import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getInitialShopData } from '@/lib/shop-data';
import { ShopContent } from './ShopContent';

interface Props {
  params: { slug: string };
  searchParams: { view?: string; id?: string; post?: string };
}

// Server Component: resuelve la carga inicial (tienda + productos + diseño
// publicado de la vista solicitada) en el servidor, para que el HTML de la
// primera respuesta ya traiga contenido real — antes esto solo pasaba
// despues de hidratar y correr un useEffect en el cliente (waterfall que
// sumaba 1.5-3s en movil antes de ver algo). La interactividad (carrito,
// checkout, navegacion entre vistas) sigue viviendo en <ShopContent>,
// un Client Component que recibe estos datos como prop inicial.
export default async function PublicShopPage({ params, searchParams }: Props) {
  const view = searchParams?.view || 'home';
  const initialShopData = await getInitialShopData(params.slug, view, searchParams?.post);

  return (
    <Suspense fallback={
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#004d4d]" />
      </div>
    }>
      <ShopContent initialShopData={initialShopData} />
    </Suspense>
  );
}
