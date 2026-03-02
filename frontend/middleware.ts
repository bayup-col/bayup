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
  // --- MODO DE EMERGENCIA: SI LAS LLAVES FALTAN, DEJAR PASAR ---
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const sk = process.env.CLERK_SECRET_KEY;

  if (!pk || !sk || pk.includes('dummy')) {
    return NextResponse.next();
  }

  try {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  } catch (e) {
    // Si falla la protección por red o configuración, no bloquear la web
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
