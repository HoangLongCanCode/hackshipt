import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError, type ErrorCode } from '@/lib/contracts';

const STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INVALID_INPUT: 400,
  CONFLICT: 409,
  INSUFFICIENT_CREDITS: 402,
  TOO_FAR: 422,
  BAD_CODE: 422,
  QUEST_FULL: 409,
  DAILY_CAP: 429,
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(code: ErrorCode, message: string, status?: number) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status: status ?? STATUS[code] });
}

/** Wrap a route handler: turns ApiError/zod errors into the envelope, never leaks stacks. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) return fail(e.code, e.message, e.status);
    if (e instanceof ZodError) {
      return fail('INVALID_INPUT', e.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '));
    }
    console.error(e);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL', message: 'Something went wrong' } }, { status: 500 });
  }
}

/** Parse a JSON body (empty body → {}) */
export async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError('INVALID_INPUT', 'Body must be valid JSON');
  }
}
