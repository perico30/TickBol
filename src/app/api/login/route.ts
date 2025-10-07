// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

const ADMIN_COOKIE_NAME = 'admin_session';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json({ message: 'Faltan credenciales' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash, status')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: 'Error consultando usuario' }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 401 });
    }
    if (user.status && user.status !== 'active') {
      return NextResponse.json({ message: 'Usuario inactivo' }, { status: 403 });
    }

    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'No tienes permisos de admin' }, { status: 403 });
    }

    // Set cookie on the RESPONSE (important in route handlers)
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
    res.cookies.set(ADMIN_COOKIE_NAME, 'yes', {
      httpOnly: true,
      sameSite: 'strict',
      secure: true, // on vercel it's HTTPS
      path: '/',
      maxAge: 60 * 60 * 24 * 2, // 2 days
    });
    return res;
  } catch (e) {
    return NextResponse.json({ message: 'Error en el servidor' }, { status: 500 });
  }
}
