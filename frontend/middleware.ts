import { NextResponse } from 'next/server'

export function middleware(request) {
  const hostname = request.headers.get('host') || ''
  
  // Lista de dominios que NO son de clientes
  const mainDomains = ['localhost', 'bayup.com', 'vercel.app', 'bayup.com.co']
  const isCustomDomain = !mainDomains.some(d => hostname.includes(d))

  if (isCustomDomain && !request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/shop')) {
    const slug = hostname.split('.')[0]
    return NextResponse.rewrite(new URL(`/shop/${slug}${request.nextUrl.pathname}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'],
}
