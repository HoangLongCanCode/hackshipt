import { handle, ok } from '@/lib/server/http';
import { db } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const rows = await db.interest.findMany({ orderBy: { label: 'asc' } });
    return ok(rows.map((i) => ({ slug: i.slug, label: i.label, emoji: i.emoji })));
  });
}
