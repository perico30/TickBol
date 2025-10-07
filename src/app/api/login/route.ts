// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { setAdminSession } from '@/lib/cookies';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const e = (email || '').toString().trim().toLowerCase();
    const p = (password || '').toString();

    if (!e || !p) {
      return NextResponse.json({ message: 'Faltan credenciales' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash, status')
      .eq('email', e)
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

    const ok = await bcrypt.compare(p, user.password_hash || '');
    if (!ok) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'No tienes permisos de admin' }, { status: 403 });
    }

    setAdminSession();
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch {
    return NextResponse.json({ message: 'Error en el servidor' }, { status: 500 });
  }
}
