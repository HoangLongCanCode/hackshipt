import { ok } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  return ok({ status: 'up' });
}
