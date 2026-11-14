import { handle, ok } from '@/lib/server/http';
import { db } from '@/lib/server/db';
import { requireUser } from '@/lib/server/session';
import { levelFromXp, matchReason, matchScore, type MatchProfile } from '@/lib/domain';
import type { AvatarClass, MatchDTO } from '@/lib/contracts';

export const dynamic = 'force-dynamic';

/** "Adventurers like you": everyone sharing >=1 interest or quest with the caller, top 10. */
export async function GET() {
  return handle(async () => {
    const me = await requireUser();
    const [users, interests] = await Promise.all([
      db.user.findMany({
        include: {
          interests: { include: { interest: true } },
          participations: { where: { status: { in: ['ACCEPTED', 'CHECKED_IN', 'COMPLETED'] } }, include: { quest: { select: { id: true, title: true, neighborhood: true } } } },
        },
      }),
      db.interest.findMany(),
    ]);
    const labels = Object.fromEntries(interests.map((i) => [i.slug, i.label]));
    const titles: Record<string, string> = {};
    const toProfile = (u: (typeof users)[number]): MatchProfile => {
      u.participations.forEach((p) => (titles[p.quest.id] = p.quest.title));
      return {
        id: u.id, avatarClass: u.avatarClass as AvatarClass,
        interestSlugs: u.interests.map((i) => i.interest.slug),
        questIds: u.participations.map((p) => p.questId),
        neighborhoods: u.participations.filter((p) => p.status === 'COMPLETED').map((p) => p.quest.neighborhood),
      };
    };
    const profiles = users.map((u) => ({ u, p: toProfile(u) }));
    const mine = profiles.find((x) => x.u.id === me.id)?.p ?? { id: me.id, avatarClass: me.avatarClass as AvatarClass, interestSlugs: [], questIds: [], neighborhoods: [] };

    const out: MatchDTO[] = profiles
      .filter(({ u, p }) => u.id !== me.id && (p.interestSlugs.some((s) => mine.interestSlugs.includes(s)) || p.questIds.some((q) => mine.questIds.includes(q))))
      .map(({ u, p }) => ({
        userId: u.id, displayName: u.displayName, avatarEmoji: u.avatarEmoji, avatarClass: u.avatarClass as AvatarClass,
        level: levelFromXp(u.xp), score: matchScore(mine, p), favoriteArtist: u.favoriteArtist, hobby: u.hobby,
        sharedInterests: u.interests.filter((i) => mine.interestSlugs.includes(i.interest.slug)).map((i) => ({ slug: i.interest.slug, label: i.interest.label, emoji: i.interest.emoji })),
        reason: matchReason(mine, p, labels, titles),
      }))
      .sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName))
      .slice(0, 10);
    return ok(out);
  });
}
