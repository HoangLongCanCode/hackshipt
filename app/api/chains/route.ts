import { handle, ok } from '@/lib/server/http';
import { db } from '@/lib/server/db';
import { requireUser } from '@/lib/server/session';
import type { ChainDTO } from '@/lib/contracts';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const [chains, done] = await Promise.all([
      db.questChain.findMany({ include: { quests: { select: { id: true, title: true, chainOrder: true } } } }),
      db.participation.findMany({ where: { userId: user.id, status: 'COMPLETED' }, select: { questId: true } }),
    ]);
    const doneIds = new Set(done.map((d) => d.questId));
    const out: ChainDTO[] = chains.map((c) => ({
      id: c.id, title: c.title, description: c.description, bonusCredits: c.bonusCredits,
      steps: c.quests
        .map((q, i) => ({ questId: q.id, title: q.title, order: q.chainOrder ?? i + 1, done: doneIds.has(q.id) }))
        .sort((a, b) => a.order - b.order),
    }));
    return ok(out);
  });
}
