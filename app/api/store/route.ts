import { handle, ok } from '@/lib/server/http';
import { db } from '@/lib/server/db';
import { toSponsorDTO } from '@/lib/server/mappers';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const sponsors = await db.sponsor.findMany({ include: { offers: { orderBy: { costCredits: 'asc' } } }, orderBy: { name: 'asc' } });
    return ok({ sponsors: sponsors.map(toSponsorDTO) });
  });
}
