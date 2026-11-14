import { handle, ok } from '@/lib/server/http';
import { db } from '@/lib/server/db';
import { requireUser } from '@/lib/server/session';
import { toLedgerDTO } from '@/lib/server/mappers';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const rows = await db.ledgerEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
    return ok(rows.map(toLedgerDTO));
  });
}
