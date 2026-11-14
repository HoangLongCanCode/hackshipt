import { handle, ok } from '@/lib/server/http';
import { db } from '@/lib/server/db';
import { toCauseDTO } from '@/lib/server/mappers';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const rows = await db.cause.findMany({ include: { org: true }, orderBy: { title: 'asc' } });
    return ok(rows.map(toCauseDTO));
  });
}
