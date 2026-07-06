import { Metadata } from 'next';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  params: { slug: string };
}

async function getShopData(slug: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';
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

  const storeName = data.full_name || data.store_name || 'Mi Tienda';
  const productsCount = data.products?.length || 0;
  const description = `Explora la colección exclusiva de ${storeName} en Bayup. Tenemos ${productsCount} productos disponibles para envío inmediato. ¡Compra inteligente!`;

  const ogImage = data.products?.[0]?.image_url?.[0] ?? data.logo_url ?? null;
  return {
    metadataBase: new URL('https://www.bayup.com.co'),
    title: `${storeName} | Tienda Oficial`,
    description: description,
    alternates: { canonical: `/shop/${params.slug}` },
    openGraph: {
      title: `${storeName} - Catálogo Online`,
      description: description,
      type: 'website',
      images: ogImage ? [{ url: ogImage, alt: storeName }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: storeName,
      description: description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default function ShopLayout({ children }: Props) {
  return <>{children}</>;
}
