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
  '/api/public/(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // 1. LÓGICA DE DOMINIO PERSONALIZADO (White-labeling)
  // Añadimos bayup.com.co y sus variaciones a la lista blanca
  const mainDomains = [
    "localhost:3000", 
    "bayup.com", 
    "www.bayup.com", 
    "bayup.vercel.app",
    "bayup.com.co",
    "www.bayup.com.co"
  ];
  
  const isCustomDomain = !mainDomains.some(d => hostname.includes(d));

  // Solo hacemos rewrite si es un dominio externo Y no estamos ya en una ruta de tienda o API
  if (isCustomDomain && !url.pathname.startsWith('/api') && !url.pathname.startsWith('/shop')) {
    const slug = hostname.split('.')[0]; 
    return NextResponse.rewrite(new URL(`/shop/${slug}${url.pathname}`, request.url));
  }

  // 2. PROTECCIÓN DE CLERK (Original)
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk || pk.includes('dummy') || !pk.startsWith('pk_live_')) {
    return;
  }

  if (isPublicRoute(request) || url.pathname.startsWith('/templates')) {
    return;
  }

  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
