import { Metadata } from 'next';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  params: { slug: string };
}

async function getShopData(slug: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://bayup-interactive-production.up.railway.app';
  try {
    const res = await fetch(`${apiBase}/public/shop/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getShopData(params.slug);

  if (!data) {
    return {
      title: 'Tienda No Encontrada | Bayup',
      description: 'La tienda que buscas no existe en el ecosistema Bayup.',
    };
  }

  const storeName = data.store_name || 'Mi Tienda';
  const productsCount = data.products?.length || 0;
  const description = `Explora la colección exclusiva de ${storeName} en Bayup. Tenemos ${productsCount} productos disponibles para envío inmediato. ¡Compra inteligente!`;

  return {
    title: `${storeName} | Tienda Oficial`,
    description: description,
    openGraph: {
      title: `${storeName} - Catálogo Online`,
      description: description,
      type: 'website',
      images: data.products?.[0]?.image_url?.[0] ? [{ url: data.products[0].image_url[0] }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: storeName,
      description: description,
    }
  };
}

export default function ShopLayout({ children }: Props) {
  return <>{children}</>;
}
