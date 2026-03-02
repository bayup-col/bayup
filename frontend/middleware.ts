import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/', 
  '/login(.*)', 
  '/register(.*)', 
  '/shop/(.*)', 
  '/planes(.*)', 
  '/acerca(.*)',
  '/contacto(.*)',
  '/privacidad(.*)',
  '/terms(.*)',
  '/api/public/(.*)',
  '/checkout(.*)',
  '/qr(.*)',
  '/studio-preview(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // 1. LÓGICA DE DOMINIO PERSONALIZADO (White-labeling)
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

  // 2. PROTECCIÓN DE RUTA (Solo si no es pública)
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
