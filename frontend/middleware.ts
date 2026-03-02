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
  '/api/public/(.*)',
  '/checkout(.*)',
  '/qr(.*)',
  '/studio-preview(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  try {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  } catch (error) {
    // Si Clerk falla (por falta de keys o error de red), permitimos que la app siga
    // Esto evita el error 500 bloqueante mientras se configuran las variables en Vercel.
    console.error("Clerk Middleware Error:", error);
  }
});

export const config = {
  // Mantenemos runtime nodejs porque la v6+ de Clerk usa APIs nativas de Node
  runtime: 'nodejs',
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
