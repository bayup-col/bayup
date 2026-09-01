import { Metadata } from 'next';
import { ReactNode } from 'react';
import { studioFontVariables } from '@/lib/studio-fonts';
import { getShopBaseData } from '@/lib/shop-data';

interface Props {
  children: ReactNode;
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getShopBaseData(params.slug);

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

const ORZEN_CRITICAL_CSS = `
.orzen-storefront template{display:none!important}
.orzen-storefront .logo img{height:20px;width:auto;max-height:20px}
.orzen-storefront .icon-btn svg{width:20px;height:20px;max-width:none}
.orzen-storefront .card-wish svg{width:16px;height:16px;max-width:none}
.orzen-storefront .mobile-menu:not(.open),
.orzen-storefront .search-overlay:not(.open),
.orzen-storefront .filter-sheet:not(.open),
.orzen-storefront .drawer:not(.open){
  position:fixed;inset:0;transform:translateY(-100%);
  pointer-events:none;visibility:hidden;
}
.orzen-storefront:not(.orzen-ready){visibility:hidden}
.orzen-storefront.orzen-ready{visibility:visible}
`;

export default function ShopLayout({ children, params }: Props) {
  const isOrzen = params.slug === 'orzen';
  return (
    <div className={studioFontVariables}>
      {isOrzen && (
        <>
          <link rel="stylesheet" href="/templates/clients/orzen/style.css" precedence="high" />
          <style dangerouslySetInnerHTML={{ __html: ORZEN_CRITICAL_CSS }} />
        </>
      )}
      {children}
    </div>
  );
}
