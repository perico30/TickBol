// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const isAdminPath = req.nextUrl.pathname.startsWith('/admin');
  if (!isAdminPath) return NextResponse.next();

  const token = req.cookies.get('admin_session')?.value;
  if (token === 'yes') return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*'],
};
