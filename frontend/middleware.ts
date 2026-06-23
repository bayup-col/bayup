import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// MIDDLEWARE PURO BAYUP (Sin dependencias externas)
export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  
  // 1. Lista de dominios que NO son de clientes
  const mainDomains = [
    "localhost:3000",
    "bayup.com",
    "www.bayup.com",
    "bayup.com.co",
    "www.bayup.com.co",
    "tunnelmole.net",
    "loca.lt"
  ];

  // Cualquier URL de Vercel (producción, previews, despliegues individuales tipo
  // bayup-xxxx-bayups-projects-xxxx.vercel.app) es de la app, nunca un dominio de tienda.
  const isVercelUrl = hostname.endsWith(".vercel.app");

  const isCustomDomain = !isVercelUrl && !mainDomains.some(d => hostname.includes(d));

  // 2. Redirección de tiendas (Ej: pepito.bayup.com.co -> /shop/pepito)
  if (isCustomDomain && !url.pathname.startsWith('/api') && !url.pathname.startsWith('/shop')) {
    const slug = hostname.split('.')[0]; 
    return NextResponse.rewrite(new URL(`/shop/${slug}${url.pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
