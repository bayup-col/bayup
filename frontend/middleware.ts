import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Dominios exactos de la app principal — nunca son tiendas de clientes
  const exactMainDomains = [
    "localhost:3000",
    "bayup.com",
    "www.bayup.com",
    "bayup.com.co",
    "www.bayup.com.co",
  ];

  const isVercelUrl     = hostname.endsWith(".vercel.app");
  const isLocalTunnel   = hostname.includes("tunnelmole.net") || hostname.includes("loca.lt");
  const isMainDomain    = exactMainDomains.includes(hostname) || isLocalTunnel;

  // Subdominio de Bayup: mi-tienda.bayup.com.co → /shop/mi-tienda
  // OJO: must NOT match los dominios exactos de arriba (ya cubiertos por isMainDomain)
  const isBayupSubdomain = !isMainDomain && hostname.endsWith(".bayup.com.co");

  // Dominio propio del cliente (futuro): www.mitienda.com
  // Por ahora no tiene lógica DB — se implementa en Paso 2
  const isCustomDomain = !isVercelUrl && !isMainDomain && !isBayupSubdomain;

  if (isBayupSubdomain || isCustomDomain) {
    const path = url.pathname;
    // Evitar reescribir rutas internas
    if (path.startsWith('/api') || path.startsWith('/shop') || path.startsWith('/_next')) {
      return NextResponse.next();
    }
    // Extrae el slug del primer segmento del hostname: mi-tienda.bayup.com.co → mi-tienda
    const slug = hostname.split('.')[0];
    return NextResponse.rewrite(new URL(`/shop/${slug}${path}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
