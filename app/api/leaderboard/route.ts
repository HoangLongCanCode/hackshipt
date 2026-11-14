import { handle, ok } from '@/lib/server/http';
import { db } from '@/lib/server/db';
import { requireUser } from '@/lib/server/session';
import { levelFromXp } from '@/lib/domain';
import type { LeaderboardRowDTO } from '@/lib/contracts';

export const dynamic = 'force-dynamic';

/** Top 10 by XP. `scope=neighborhood` is accepted for the demo; one city = one neighborhood board. */
export async function GET() {
  return handle(async () => {
    await requireUser();
    const users = await db.user.findMany({ orderBy: [{ xp: 'desc' }, { displayName: 'asc' }], take: 10 });
    const rows: LeaderboardRowDTO[] = users.map((u, i) => ({ rank: i + 1, displayName: u.displayName, avatarEmoji: u.avatarEmoji, xp: u.xp, level: levelFromXp(u.xp) }));
    return ok(rows);
  });
}
