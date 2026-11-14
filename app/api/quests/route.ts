import type { Prisma } from '@prisma/client';
import { handle, ok } from '@/lib/server/http';
import { questFiltersSchema } from '@/lib/contracts';
import { db } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/session';
import { questInclude, toQuestDTO } from '@/lib/server/mappers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return handle(async () => {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const f = questFiltersSchema.parse(params);
    const user = await getSessionUser();
    const where: Prisma.QuestWhereInput = {};
    if (f.category) where.category = f.category;
    if (f.neighborhood) where.neighborhood = f.neighborhood;
    if (f.maxMinutes) where.durationMin = { lte: f.maxMinutes };
    if (f.group) where.capacity = { gt: 1 };
    if (f.status) where.status = f.status;
    if (f.q) where.OR = [{ title: { contains: f.q } }, { description: { contains: f.q } }];
    const rows = await db.quest.findMany({ where, include: questInclude, orderBy: [{ createdAt: 'asc' }, { title: 'asc' }] });
    return ok(rows.map((q) => toQuestDTO(q, user?.id)));
  });
}
