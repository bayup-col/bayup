import { notFound, redirect } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';

// El catálogo publicado por un tenant es en realidad su propia tienda
// (mismo carrito/checkout ya funcionando en /shop/[slug]) — esta ruta solo
// valida que exista un catálogo publicado para el slug y redirige.
export default async function CatalogRedirectPage({ params }: { params: { slug: string } }) {
  const res = await fetch(`${API_BASE}/public/catalog/${params.slug}`, { cache: 'no-store' });
  if (!res.ok) notFound();
  const data = await res.json();
  redirect(`/shop/${data.shop_slug}`);
}
