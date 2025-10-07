// middleware.ts (en la RAÍZ del repo)
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ADMIN_COOKIE = 'admin_session';

export function middleware(req: NextRequest) {
  // Solo proteger rutas del panel
  const isAdmin = req.nextUrl.pathname.startsWith('/admin');
  if (!isAdmin) return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE)?.value;

  // Cookie presente -> deja pasar
  if (token === 'yes') return NextResponse.next();

  // Sin cookie -> redirigir a /login con ?next=/admin/...
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

// Qué rutas cubre
export const config = {
  matcher: ['/admin/:path*'],
};
