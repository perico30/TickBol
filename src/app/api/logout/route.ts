// src/app/api/logout/route.ts
import { NextResponse } from 'next/server';

const ADMIN_COOKIE_NAME = 'admin_session';

export async function POST() {
  // Crear la respuesta y borrar la cookie en la RESPUESTA
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    maxAge: 0, // borrar inmediatamente
  });
  return res;
}
