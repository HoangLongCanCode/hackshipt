import type { Prisma } from '@prisma/client';
import type {
  AvatarClass, BadgeDTO, CauseDTO, Category, LedgerEntryDTO, MeDTO, MyStatus, OfferDTO, QuestDTO, QuestDetailDTO, SponsorDTO,
} from '@/lib/contracts';
import { levelFromXp, levelProgress, revealedDistricts } from '@/lib/domain';
import { db } from './db';

export const questInclude = {
  org: true,
  chain: { include: { _count: { select: { quests: true } } } },
  participations: { include: { user: true } },
} satisfies Prisma.QuestInclude;
export type QuestRow = Prisma.QuestGetPayload<{ include: typeof questInclude }>;

const ACTIVE = ['ACCEPTED', 'CHECKED_IN'];

export function toQuestDTO(q: QuestRow, userId?: string | null): QuestDTO {
  const live = q.participations.filter((p) => p.status !== 'ABANDONED');
  const active = q.participations.filter((p) => ACTIVE.includes(p.status));
  const mine = userId ? q.participations.find((p) => p.userId === userId) : undefined;
  return {
    id: q.id, title: q.title, description: q.description, category: q.category as Category,
    interestSlugs: q.interestSlugs ? q.interestSlugs.split(',').filter(Boolean) : [],
    lat: q.lat, lng: q.lng, neighborhood: q.neighborhood, address: q.address,
    difficulty: q.difficulty as QuestDTO['difficulty'], durationMin: q.durationMin,
    rewardCredits: q.rewardCredits, rewardXp: q.rewardXp, capacity: q.capacity,
    participantCount: live.length,
    // spots are taken by people currently on the quest, not by finished adventurers
    spotsLeft: Math.max(0, q.capacity - active.length),
    status: q.status as 'OPEN' | 'CLOSED',
    org: { id: q.org.id, name: q.org.name, emoji: q.org.emoji, verified: q.org.verified, imageUrl: q.org.imageUrl || undefined },
    chain: q.chain ? { id: q.chain.id, title: q.chain.title, order: q.chainOrder ?? 1, total: q.chain._count.quests } : null,
    myStatus: mine ? (mine.status as MyStatus) : null,
  };
}

export function toQuestDetailDTO(q: QuestRow, user?: { id: string; orgId: string | null } | null): QuestDetailDTO {
  const party = q.participations
    .filter((p) => p.status !== 'ABANDONED' && p.userId !== user?.id)
    .slice(0, 8)
    .map((p) => ({
      userId: p.userId, displayName: p.user.displayName, avatarEmoji: p.user.avatarEmoji,
      avatarClass: p.user.avatarClass as AvatarClass, level: levelFromXp(p.user.xp),
      favoriteArtist: p.user.favoriteArtist, hobby: p.user.hobby,
    }));
  const dto: QuestDetailDTO = { ...toQuestDTO(q, user?.id), party };
  if (user?.orgId && user.orgId === q.orgId) dto.verifyCode = q.verifyCode;
  return dto;
}

export async function loadQuestDetail(questId: string, user?: { id: string; orgId: string | null } | null) {
  const q = await db.quest.findUnique({ where: { id: questId }, include: questInclude });
  return q ? toQuestDetailDTO(q, user) : null;
}

export function toBadgeDTO(b: { slug: string; name: string; icon: string; description: string }, earnedAt?: Date): BadgeDTO {
  return { slug: b.slug, name: b.name, icon: b.icon, description: b.description, ...(earnedAt ? { earnedAt: earnedAt.toISOString() } : {}) };
}

export async function loadMe(userId: string): Promise<MeDTO> {
  const u = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      interests: { include: { interest: true } },
      badges: { include: { badge: true }, orderBy: { earnedAt: 'asc' } },
      participations: { where: { status: 'COMPLETED' }, include: { quest: { select: { neighborhood: true } } } },
      donations: true,
    },
  });
  const earned = await db.ledgerEntry.aggregate({ where: { userId, delta: { gt: 0 } }, _sum: { delta: true } });
  const neighborhoods = Array.from(new Set(u.participations.map((p) => p.quest.neighborhood)));
  const lp = levelProgress(u.xp);
  return {
    id: u.id, email: u.email, displayName: u.displayName, bio: u.bio, favoriteArtist: u.favoriteArtist, hobby: u.hobby,
    avatarClass: u.avatarClass as AvatarClass, avatarEmoji: u.avatarEmoji,
    xp: u.xp, level: lp.level, xpIntoLevel: lp.xpIntoLevel, xpForNext: lp.xpForNext, credits: u.credits,
    interests: u.interests.map((i) => ({ slug: i.interest.slug, label: i.interest.label, emoji: i.interest.emoji })),
    badges: u.badges.map((b) => toBadgeDTO(b.badge, b.earnedAt)),
    stats: {
      questsCompleted: u.participations.length,
      creditsEarned: earned._sum.delta ?? 0,
      creditsDonated: u.donations.reduce((s, d) => s + d.amount, 0),
      neighborhoods,
    },
    revealedDistricts: revealedDistricts(neighborhoods),
  };
}

export const toOfferDTO = (o: { id: string; title: string; description: string; costCredits: number; stock: number }): OfferDTO => ({
  id: o.id, title: o.title, description: o.description, costCredits: o.costCredits, stock: o.stock,
});

export const toSponsorDTO = (s: Prisma.SponsorGetPayload<{ include: { offers: true } }>): SponsorDTO => ({
  id: s.id, name: s.name, emoji: s.emoji, description: s.description, lat: s.lat, lng: s.lng,
  offers: s.offers.map(toOfferDTO),
});

export const toCauseDTO = (c: Prisma.CauseGetPayload<{ include: { org: true } }>): CauseDTO => ({
  id: c.id, title: c.title, description: c.description, orgName: c.org.name, goalCredits: c.goalCredits, raisedCredits: c.raisedCredits,
});

export const toLedgerDTO = (l: { id: string; delta: number; kind: string; note: string; createdAt: Date }): LedgerEntryDTO => ({
  id: l.id, delta: l.delta, kind: l.kind as LedgerEntryDTO['kind'], note: l.note, createdAt: l.createdAt.toISOString(),
});
