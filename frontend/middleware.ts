import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
  // Ignorar Clerk durante el build o si no hay llaves reales
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk || pk.includes('dummy') || !pk.startsWith('pk_live_')) {
    return;
  }

  // 1. Si es una ruta pública o una plantilla estática, no hacer nada
  if (isPublicRoute(request) || request.nextUrl.pathname.startsWith('/templates')) {
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
