// src/app/api/logout/route.ts
import { NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/cookies';

export async function POST() {
  clearAdminSession();
  return NextResponse.json({ ok: true });
}
