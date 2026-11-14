// One catch-all that hands every /api/* call to the game engine (lib/game.js -> Supabase or in-memory).
// Auth is a bearer token kept in localStorage by lib/client/api.ts.
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { route, HttpError } = require('../../../lib/game') as {
  route: (method: string, path: string, body: unknown, token: string | null) => Promise<unknown>;
  HttpError: new (...a: never[]) => Error & { status: number; code: string };
};

async function handle(req: NextRequest, { params }: { params: { path: string[] } }) {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const auth = req.headers.get('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    let body: unknown = {};
    if (req.method !== 'GET') body = await req.json().catch(() => ({}));
    const data = await route(req.method, params.path.join('/'), body, token);
    return NextResponse.json({ ok: true, data }, { headers });
  } catch (e) {
    if (e instanceof HttpError) {
      return NextResponse.json({ ok: false, error: { code: e.code, message: e.message } }, { status: e.status, headers });
    }
    console.error(e);
    return NextResponse.json({ ok: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong on our side. Try again.' } }, { status: 500, headers });
  }
}

export { handle as GET, handle as POST };
