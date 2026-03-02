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
  // 1. Verificación de seguridad: Si no hay llaves de Clerk, dejamos pasar para evitar Error 500
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk || pk.includes('dummy') || !pk.startsWith('pk_live_')) {
    return NextResponse.next();
  }

  // 2. Protección de rutas estándar
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  // Runtime Node.js es obligatorio para compatibilidad con Clerk v6+ en Vercel
  runtime: 'nodejs',
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
