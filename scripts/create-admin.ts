// scripts/create-admin.ts
// Admin seeding usando Service Role (bypassea RLS).
// REQUIERE: SUPABASE_SERVICE_ROLE_KEY en tu .env.local (NO subir a GitHub).

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// 1) Cargar .env*. Busca .env.local primero
const ROOT = process.cwd();
const ENV_CANDIDATES = ['.env.local', '.env.development.local', '.env', '.env.development'];
let loadedFrom: string | null = null;
for (const file of ENV_CANDIDATES) {
  const p = path.join(ROOT, file);
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loadedFrom = file;
    break;
  }
}
console.log(loadedFrom ? `📦 Variables cargadas desde ${loadedFrom}` : '⚠️ No se encontró .env.local en la raíz.');

// 2) Validar claves
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY; // sensible, no exponer al cliente
if (!url || !service) {
  console.error('❌ Faltan variables: NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Obtén el Service Role en: Supabase → Settings → API → service_role (NO lo publiques)');
  process.exit(1);
}

// 3) Cliente con service role (bypass RLS)
const supabase = createClient(url, service, {
  auth: { persistSession: false },
  global: { headers: { 'X-Client-Info': 'admin-seed-script' } }
});

type Args = { email?: string; password?: string; name?: string; };
function parseArgs(): Args {
  const out: Args = {};
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email') out.email = args[i+1];
    if (args[i] === '--password') out.password = args[i+1];
    if (args[i] === '--name') out.name = args[i+1];
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const email = (args.email || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = (args.password || process.env.ADMIN_PASSWORD || '').toString();
  const name = args.name || process.env.ADMIN_NAME || 'Administrador';

  if (!email || !password) {
    console.error('❌ Falta email o password. Usa --email y --password o setea ADMIN_EMAIL / ADMIN_PASSWORD');
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);

  // 4) Upsert admin
  const { data: existing, error: qErr } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', email)
    .maybeSingle();
  if (qErr) {
    console.error('❌ Error consultando users:', qErr.message);
    process.exit(1);
  }

  if (existing?.id) {
    const { error: updErr } = await supabase
      .from('users')
      .update({
        name,
        role: 'admin',
        password_hash,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (updErr) {
      console.error('❌ Error actualizando admin:', updErr.message);
      process.exit(1);
    }
    console.log(`✅ Admin ACTUALIZADO: ${email}`);
  } else {
    const { error: insErr } = await supabase
      .from('users')
      .insert([{
        email,
        name,
        role: 'admin',
        password_hash,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    if (insErr) {
      console.error('❌ Error creando admin:', insErr.message);
      process.exit(1);
    }
    console.log(`✅ Admin CREADO: ${email}`);
  }

  console.log('ℹ️ Ahora prueba /login en tu app con ese usuario. Deberías acceder a /admin si validas role=admin.');
}

main().catch(e => {
  console.error('❌ Fatal:', e);
  process.exit(1);
});
