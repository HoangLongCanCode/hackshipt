import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { ApiError } from '@/lib/contracts';
import { db } from './db';

const COOKIE = 'ksr_session';
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  return new TextEncoder().encode(process.env.SESSION_SECRET ?? 'dev-only-change-me-32-chars-minimum!!');
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: MAX_AGE });
}

export async function getSessionUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const uid = payload.uid;
    if (typeof uid !== 'string') return null;
    return await db.user.findUnique({ where: { id: uid } });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new ApiError('UNAUTHENTICATED', 'Please log in');
  return user;
}

export function destroySession() {
  cookies().set(COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}
