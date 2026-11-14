import type { Prisma, User } from '@prisma/client';
import { ApiError } from '@/lib/contracts';
import type { Category, CompleteResultDTO, DonateInput, MeDTO, RedemptionDTO } from '@/lib/contracts';
import { CHECKIN_RADIUS_M, DAILY_CREDIT_CAP, CLASS_META } from '@/lib/constants';
import { badgesEarned, deriveClass, distanceMeters, levelFromXp } from '@/lib/domain';
import { db } from './db';
import { loadMe, loadQuestDetail, toBadgeDTO, toCauseDTO, toOfferDTO, questInclude } from './mappers';

type Tx = Prisma.TransactionClient;
const demoMode = () => process.env.DEMO_MODE === 'true';
const ACTIVE = ['ACCEPTED', 'CHECKED_IN'];

async function detail(questId: string, user: Pick<User, 'id' | 'orgId'>) {
  const d = await loadQuestDetail(questId, user);
  if (!d) throw new ApiError('NOT_FOUND', 'Quest not found');
  return d;
}

export async function acceptQuest(user: User, questId: string) {
  await db.$transaction(async (tx) => {
    const quest = await tx.quest.findUnique({ where: { id: questId } });
    if (!quest) throw new ApiError('NOT_FOUND', 'Quest not found');
    if (quest.status !== 'OPEN') throw new ApiError('CONFLICT', 'This quest is closed');
    const existing = await tx.participation.findUnique({ where: { questId_userId: { questId, userId: user.id } } });
    if (existing && ACTIVE.includes(existing.status)) throw new ApiError('CONFLICT', 'You are already on this quest');
    if (existing?.status === 'COMPLETED') throw new ApiError('CONFLICT', 'You already completed this quest');
    const active = await tx.participation.count({ where: { questId, status: { in: ACTIVE } } });
    if (active >= quest.capacity) throw new ApiError('QUEST_FULL', 'This quest is full');
    if (existing) {
      await tx.participation.update({ where: { id: existing.id }, data: { status: 'ACCEPTED', acceptedAt: new Date(), checkedInAt: null, completedAt: null } });
    } else {
      await tx.participation.create({ data: { questId, userId: user.id } });
    }
  });
  return detail(questId, user);
}

export async function checkInQuest(user: User, questId: string, lat: number, lng: number) {
  const quest = await db.quest.findUnique({ where: { id: questId } });
  if (!quest) throw new ApiError('NOT_FOUND', 'Quest not found');
  const part = await db.participation.findUnique({ where: { questId_userId: { questId, userId: user.id } } });
  if (!part || !ACTIVE.includes(part.status)) throw new ApiError('CONFLICT', 'Accept the quest first');
  if (part.status === 'CHECKED_IN') return detail(questId, user);
  if (!demoMode() && distanceMeters({ lat, lng }, { lat: quest.lat, lng: quest.lng }) > CHECKIN_RADIUS_M) {
    throw new ApiError('TOO_FAR', `You need to be within ${CHECKIN_RADIUS_M} m of the quest to check in`);
  }
  await db.participation.update({ where: { id: part.id }, data: { status: 'CHECKED_IN', checkedInAt: new Date() } });
  return detail(questId, user);
}

export async function abandonQuest(user: User, questId: string) {
  const part = await db.participation.findUnique({ where: { questId_userId: { questId, userId: user.id } } });
  if (!part || !ACTIVE.includes(part.status)) throw new ApiError('CONFLICT', 'You are not on this quest');
  await db.participation.update({ where: { id: part.id }, data: { status: 'ABANDONED' } });
  return detail(questId, user);
}

/** Recompute stats and grant any newly-qualified badges. Returns the new badge DTOs. */
async function awardBadges(tx: Tx, userId: string) {
  const done = await tx.participation.findMany({
    where: { userId, status: 'COMPLETED' },
    include: { quest: { select: { neighborhood: true, capacity: true, chainId: true } } },
  });
  const donations = await tx.donation.count({ where: { userId } });
  const chainIds = Array.from(new Set(done.map((p) => p.quest.chainId).filter((x): x is string => !!x)));
  let completedChain = false;
  for (const chainId of chainIds) {
    const steps = await tx.quest.findMany({ where: { chainId }, select: { id: true } });
    const mine = new Set(done.map((p) => p.questId));
    if (steps.length > 0 && steps.every((s) => mine.has(s.id))) completedChain = true;
  }
  const slugs = badgesEarned({
    completed: done.length,
    distinctNeighborhoods: new Set(done.map((p) => p.quest.neighborhood)).size,
    donations,
    completedGroupQuest: done.some((p) => p.quest.capacity > 1),
    completedChain,
  });
  const owned = new Set((await tx.userBadge.findMany({ where: { userId }, include: { badge: true } })).map((b) => b.badge.slug));
  const fresh = slugs.filter((s) => !owned.has(s));
  const out = [];
  for (const slug of fresh) {
    const badge = await tx.badge.findUnique({ where: { slug } });
    if (!badge) continue;
    const ub = await tx.userBadge.create({ data: { userId, badgeId: badge.id } });
    out.push(toBadgeDTO(badge, ub.earnedAt));
  }
  return { newBadges: out, completedChain };
}

export async function completeQuest(user: User, questId: string, code: string): Promise<CompleteResultDTO> {
  const quest = await db.quest.findUnique({ where: { id: questId } });
  if (!quest) throw new ApiError('NOT_FOUND', 'Quest not found');
  const part = await db.participation.findUnique({ where: { questId_userId: { questId, userId: user.id } } });
  if (!part || part.status !== 'CHECKED_IN') throw new ApiError('CONFLICT', 'Check in before completing the quest');
  if (code.trim() !== quest.verifyCode) throw new ApiError('BAD_CODE', 'That code is not right. Ask the quest giver for the 4-digit code.');
  if (!demoMode()) {
    const since = new Date(Date.now() - 86400000);
    const agg = await db.ledgerEntry.aggregate({ where: { userId: user.id, kind: 'EARN', createdAt: { gte: since } }, _sum: { delta: true } });
    if ((agg._sum.delta ?? 0) + quest.rewardCredits > DAILY_CREDIT_CAP) throw new ApiError('DAILY_CAP', 'Daily credit cap reached. Come back tomorrow!');
  }

  const result = await db.$transaction(async (tx) => {
    const fresh = await tx.participation.updateMany({ where: { id: part.id, status: 'CHECKED_IN' }, data: { status: 'COMPLETED', completedAt: new Date() } });
    if (fresh.count === 0) throw new ApiError('CONFLICT', 'Quest already completed');
    await tx.ledgerEntry.create({ data: { userId: user.id, delta: quest.rewardCredits, kind: 'EARN', refType: 'quest', refId: quest.id, note: `Completed: ${quest.title}` } });

    // chain bonus: this was the last uncompleted step for this user
    let chainBonus = 0;
    if (quest.chainId) {
      const chain = await tx.questChain.findUnique({ where: { id: quest.chainId }, include: { quests: { select: { id: true } } } });
      if (chain) {
        const doneIds = new Set((await tx.participation.findMany({ where: { userId: user.id, status: 'COMPLETED', questId: { in: chain.quests.map((q) => q.id) } } })).map((p) => p.questId));
        if (chain.quests.every((q) => doneIds.has(q.id))) {
          chainBonus = chain.bonusCredits;
          await tx.ledgerEntry.create({ data: { userId: user.id, delta: chainBonus, kind: 'BONUS', refType: 'chain', refId: chain.id, note: `Chain complete: ${chain.title}` } });
        }
      }
    }

    const completed = await tx.participation.findMany({ where: { userId: user.id, status: 'COMPLETED' }, include: { quest: { select: { category: true } } } });
    const cls = deriveClass(completed.map((p) => ({ category: p.quest.category as Category, completedAt: p.completedAt ?? new Date() })));
    const updated = await tx.user.update({
      where: { id: user.id },
      data: { credits: { increment: quest.rewardCredits + chainBonus }, xp: { increment: quest.rewardXp }, avatarClass: cls, avatarEmoji: CLASS_META[cls].emoji },
    });
    const { newBadges } = await awardBadges(tx, user.id);
    return { chainBonus, newBadges, levelUp: levelFromXp(updated.xp) > levelFromXp(user.xp) };
  });

  const [me, questDto] = await Promise.all([loadMe(user.id), detail(questId, user)]);
  return {
    me, earned: { credits: quest.rewardCredits, xp: quest.rewardXp, chainBonus: result.chainBonus },
    levelUp: result.levelUp, newBadges: result.newBadges, quest: questDto,
  };
}

function redemptionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `RPGB-${s}`;
}

export async function redeemOffer(user: User, offerId: string): Promise<RedemptionDTO> {
  return db.$transaction(async (tx) => {
    const offer = await tx.offer.findUnique({ where: { id: offerId }, include: { sponsor: true } });
    if (!offer) throw new ApiError('NOT_FOUND', 'Offer not found');
    const stock = await tx.offer.updateMany({ where: { id: offerId, stock: { gt: 0 } }, data: { stock: { decrement: 1 } } });
    if (stock.count === 0) throw new ApiError('CONFLICT', 'That offer is out of stock');
    const paid = await tx.user.updateMany({ where: { id: user.id, credits: { gte: offer.costCredits } }, data: { credits: { decrement: offer.costCredits } } });
    if (paid.count === 0) throw new ApiError('INSUFFICIENT_CREDITS', 'Not enough credits');
    const red = await tx.redemption.create({ data: { userId: user.id, offerId, code: redemptionCode() } });
    await tx.ledgerEntry.create({ data: { userId: user.id, delta: -offer.costCredits, kind: 'SPEND', refType: 'offer', refId: offerId, note: `Redeemed: ${offer.title} @ ${offer.sponsor.name}` } });
    const me = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
    const fresh = await tx.offer.findUniqueOrThrow({ where: { id: offerId } });
    return { id: red.id, code: red.code, offer: toOfferDTO(fresh), sponsorName: offer.sponsor.name, balance: me.credits };
  });
}

export async function donateCredits(user: User, input: DonateInput) {
  return db.$transaction(async (tx) => {
    const cause = await tx.cause.findUnique({ where: { id: input.causeId } });
    if (!cause) throw new ApiError('NOT_FOUND', 'Cause not found');
    const paid = await tx.user.updateMany({ where: { id: user.id, credits: { gte: input.amount } }, data: { credits: { decrement: input.amount } } });
    if (paid.count === 0) throw new ApiError('INSUFFICIENT_CREDITS', 'Not enough credits');
    await tx.donation.create({ data: { userId: user.id, causeId: cause.id, amount: input.amount } });
    const updated = await tx.cause.update({ where: { id: cause.id }, data: { raisedCredits: { increment: input.amount } }, include: { org: true } });
    await tx.ledgerEntry.create({ data: { userId: user.id, delta: -input.amount, kind: 'DONATE', refType: 'cause', refId: cause.id, note: `Donated to ${cause.title}` } });
    await awardBadges(tx, user.id);
    const me = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
    return { balance: me.credits, cause: toCauseDTO(updated) };
  });
}

export type { MeDTO };
export { questInclude };
