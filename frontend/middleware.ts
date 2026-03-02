import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ESTE ES UN MIDDLEWARE DE RESCATE PARA DESBLOQUEAR LA WEB
export function middleware(request: NextRequest) {
  // 1. Lógica de dominio personalizado (Mantenemos esto para que las tiendas funcionen)
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  
  const mainDomains = [
    "localhost:3000", 
    "bayup.com", 
    "www.bayup.com", 
    "bayup.vercel.app",
    "bayup.com.co",
    "www.bayup.com.co"
  ];
  
  const isCustomDomain = !mainDomains.some(d => hostname.includes(d));

  if (isCustomDomain && !url.pathname.startsWith('/api') && !url.pathname.startsWith('/shop')) {
    const slug = hostname.split('.')[0]; 
    return NextResponse.rewrite(new URL(`/shop/${slug}${url.pathname}`, request.url));
  }

  // Dejar pasar todo lo demás para eliminar el Error 500
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
