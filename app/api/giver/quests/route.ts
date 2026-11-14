import { handle, ok, readJson } from '@/lib/server/http';
import { newQuestSchema } from '@/lib/contracts';
import { db } from '@/lib/server/db';
import { requireUser } from '@/lib/server/session';
import { requireGiverOrg } from '@/lib/server/giver';
import { questInclude, toQuestDetailDTO } from '@/lib/server/mappers';
import { computeReward } from '@/lib/domain';

export const dynamic = 'force-dynamic';

/** My org's quests, WITH verify codes (toQuestDetailDTO adds the code only for the owning org). */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const orgId = await requireGiverOrg(user);
    const rows = await db.quest.findMany({ where: { orgId }, include: questInclude, orderBy: { createdAt: 'desc' } });
    return ok(rows.map((q) => toQuestDetailDTO(q, { id: user.id, orgId })));
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const orgId = await requireGiverOrg(user);
    const input = newQuestSchema.parse(await readJson(req));
    const reward = computeReward(input.durationMin, input.difficulty);
    const verifyCode = String(Math.floor(1000 + Math.random() * 9000));
    const created = await db.quest.create({
      data: {
        orgId, title: input.title, description: input.description, category: input.category,
        interestSlugs: input.interestSlugs.join(','), lat: input.lat, lng: input.lng,
        neighborhood: input.neighborhood, address: input.address, difficulty: input.difficulty,
        durationMin: input.durationMin, rewardCredits: reward.credits, rewardXp: reward.xp,
        capacity: input.capacity, verifyCode,
      },
      include: questInclude,
    });
    return ok(toQuestDetailDTO(created, { id: user.id, orgId }), { status: 201 });
  });
}
