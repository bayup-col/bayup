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
  // Ignoramos localhost y el dominio principal de producción
  const mainDomains = ["localhost:3000", "bayup.com", "www.bayup.com", "bayup.vercel.app"];
  const isCustomDomain = !mainDomains.some(d => hostname.includes(d));

  if (isCustomDomain && !url.pathname.startsWith('/api')) {
    // Si entran a mitienda.com, hacemos un rewrite interno a /shop/[slug]
    // En el MVP, asumimos que el hostname ya es el slug o podemos consultarlo a la API
    // Por ahora, simularemos que el hostname es el slug (ej: mitienda.com -> slug: mitienda)
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
