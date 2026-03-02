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
    "bayup.vercel.app",
    "bayup.com.co",
    "www.bayup.com.co"
  ];
  
  const isCustomDomain = !mainDomains.some(d => hostname.includes(d));

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
