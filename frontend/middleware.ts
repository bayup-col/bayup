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
  const isProdKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_');
  
  // Si no estamos en producción real con llaves reales, dejamos pasar todo
  // Esto evita que Clerk bloquee la web por errores de configuración
  if (!isProdKey) return;

  if (isPublicRoute(request)) return;

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
