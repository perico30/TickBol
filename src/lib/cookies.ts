// src/lib/cookies.ts
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'admin_session';

export function setAdminSession() {
  cookies().set(ADMIN_COOKIE_NAME, 'yes', {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 2, // 2 días
  });
}

export function clearAdminSession() {
  cookies().set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    maxAge: 0,
  });
}

export function hasAdminSession() {
  return cookies().get(ADMIN_COOKIE_NAME)?.value === 'yes';
}
