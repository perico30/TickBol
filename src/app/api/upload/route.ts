// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Fuerza Node.js (Buffer no va en Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceRole, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const bucket = (form.get('bucket') as string) || 'carousel-images';
    if (!file) return NextResponse.json({ message: 'Falta el archivo (file)' }, { status: 400 });

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ message: `Tipo no permitido: ${file.type}` }, { status: 415 });
    }

    const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
    const key = `carousel/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const buf = Buffer.from(await file.arrayBuffer());
    const supabase = getAdminClient();

    // crea bucket si no existe (idempotente)
    await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});

    const { error: upErr } = await supabase.storage.from(bucket).upload(key, buf, {
      contentType: file.type,
      upsert: true,
    });
    if (upErr) {
      return NextResponse.json({ message: 'Error subiendo archivo', detail: upErr.message }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(key);
    return NextResponse.json({ ok: true, bucket, path: key, url: pub?.publicUrl || null });
  } catch (e: any) {
    return NextResponse.json({ message: 'Error interno del servidor', detail: e?.message }, { status: 500 });
  }
}
