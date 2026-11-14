import { ApiError } from '@/lib/contracts';
import type {
  BadgeDTO, CauseDTO, LeaderboardRowDTO, NewQuestInput, ChainDTO, CompleteResultDTO, InterestDTO, LedgerEntryDTO, MatchDTO, MeDTO, QuestDetailDTO,
  QuestFilters, RedemptionDTO, SponsorDTO,
} from '@/lib/contracts';
import { computeReward, deriveClass, levelProgress, revealedDistricts } from '@/lib/domain';
import { CLASS_META } from '@/lib/constants';
import {
  MOCK_BADGES, MOCK_CAUSES, MOCK_CHAIN, MOCK_INTERESTS, MOCK_ME, MOCK_MATCHES, MOCK_QUESTS, MOCK_SPONSORS,
} from './data';

// In-memory state (module singleton, resets on reload). Simplified SYSTEM.md §6 rules.
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const state = {
  me: clone(MOCK_ME) as MeDTO,
  loggedIn: true,
  quests: clone(MOCK_QUESTS) as QuestDetailDTO[],
  sponsors: clone(MOCK_SPONSORS) as SponsorDTO[],
  causes: clone(MOCK_CAUSES) as CauseDTO[],
  ledger: [] as LedgerEntryDTO[],
  completedCats: [] as { category: QuestDetailDTO['category']; completedAt: number }[],
  donations: 0,
};
const CODES: Record<string, string> = {};
MOCK_QUESTS.forEach((qq, i) => (CODES[qq.id] = String((i + 1) * 1111).slice(0, 4).padStart(4, '1')));

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(clone(v)), 80));
let seq = 0;
const nextId = () => `m${++seq}`;

function refreshMe() {
  const lp = levelProgress(state.me.xp);
  Object.assign(state.me, { level: lp.level, xpIntoLevel: lp.xpIntoLevel, xpForNext: lp.xpForNext });
  state.me.avatarClass = deriveClass(state.completedCats);
  state.me.avatarEmoji = CLASS_META[state.me.avatarClass].emoji;
  state.me.revealedDistricts = revealedDistricts(state.me.stats.neighborhoods);
}

function findQuest(id: string) {
  const qq = state.quests.find((x) => x.id === id);
  if (!qq) throw new ApiError('NOT_FOUND', 'Quest not found');
  return qq;
}
function setCounts(qq: QuestDetailDTO) {
  qq.spotsLeft = Math.max(0, qq.capacity - qq.participantCount);
}
function addLedger(delta: number, kind: LedgerEntryDTO['kind'], note: string) {
  state.ledger.unshift({ id: nextId(), delta, kind, note, createdAt: new Date().toISOString() });
}

export const mock = {
  me: () => delay(state.me),
  login: (email: string, displayName?: string) => {
    state.loggedIn = true;
    state.me.email = email;
    if (displayName) state.me.displayName = displayName;
    return delay(state.me);
  },
  logout: () => { state.loggedIn = false; return delay({}); },
  updateProfile: (p: { displayName?: string; bio?: string; favoriteArtist?: string; hobby?: string; interestSlugs?: string[] }) => {
    if (p.displayName) state.me.displayName = p.displayName;
    if (p.bio !== undefined) state.me.bio = p.bio;
    if (p.favoriteArtist !== undefined) state.me.favoriteArtist = p.favoriteArtist;
    if (p.hobby !== undefined) state.me.hobby = p.hobby;
    if (p.interestSlugs) state.me.interests = MOCK_INTERESTS.filter((i) => p.interestSlugs!.includes(i.slug));
    return delay(state.me);
  },
  interests: (): Promise<InterestDTO[]> => delay(MOCK_INTERESTS),
  quests: (f: QuestFilters = {}) => {
    let list = state.quests;
    if (f.category) list = list.filter((x) => x.category === f.category);
    if (f.q) list = list.filter((x) => (x.title + x.description).toLowerCase().includes(f.q!.toLowerCase()));
    if (f.neighborhood) list = list.filter((x) => x.neighborhood === f.neighborhood);
    if (f.maxMinutes) list = list.filter((x) => x.durationMin <= f.maxMinutes!);
    if (f.group) list = list.filter((x) => x.capacity > 1);
    if (f.status) list = list.filter((x) => x.status === f.status);
    return delay(list);
  },
  quest: (id: string) => delay(findQuest(id)),
  accept: (id: string) => {
    const qq = findQuest(id);
    if (qq.myStatus === 'ACCEPTED' || qq.myStatus === 'CHECKED_IN') throw new ApiError('CONFLICT', 'Already on this quest');
    if (qq.myStatus === 'COMPLETED') throw new ApiError('CONFLICT', 'Already completed');
    if (qq.spotsLeft <= 0) throw new ApiError('QUEST_FULL', 'This quest is full');
    qq.myStatus = 'ACCEPTED';
    qq.participantCount++;
    qq.party.push({ userId: state.me.id, displayName: state.me.displayName, avatarEmoji: state.me.avatarEmoji, avatarClass: state.me.avatarClass, level: state.me.level, favoriteArtist: state.me.favoriteArtist, hobby: state.me.hobby });
    setCounts(qq);
    return delay(qq);
  },
  checkin: (id: string) => {
    const qq = findQuest(id);
    if (qq.myStatus !== 'ACCEPTED') throw new ApiError('CONFLICT', 'Accept the quest first');
    qq.myStatus = 'CHECKED_IN';
    return delay(qq);
  },
  abandon: (id: string) => {
    const qq = findQuest(id);
    if (qq.myStatus !== 'ACCEPTED' && qq.myStatus !== 'CHECKED_IN') throw new ApiError('CONFLICT', 'Not on this quest');
    qq.myStatus = 'ABANDONED';
    qq.participantCount = Math.max(0, qq.participantCount - 1);
    qq.party = qq.party.filter((p) => p.userId !== state.me.id);
    setCounts(qq);
    return delay(qq);
  },
  complete: (id: string, code: string): Promise<CompleteResultDTO> => {
    const qq = findQuest(id);
    if (qq.myStatus !== 'CHECKED_IN') throw new ApiError('CONFLICT', 'Check in first');
    if (code !== CODES[id]) throw new ApiError('BAD_CODE', 'That code is not right');
    const beforeLevel = state.me.level;
    const beforeBadges = new Set(state.me.badges.map((b) => b.slug));
    qq.myStatus = 'COMPLETED';
    state.me.xp += qq.rewardXp;
    state.me.credits += qq.rewardCredits;
    state.me.stats.questsCompleted++;
    state.me.stats.creditsEarned += qq.rewardCredits;
    if (!state.me.stats.neighborhoods.includes(qq.neighborhood)) state.me.stats.neighborhoods.push(qq.neighborhood);
    state.completedCats.push({ category: qq.category, completedAt: Date.now() });
    addLedger(qq.rewardCredits, 'EARN', `Completed: ${qq.title}`);
    let chainBonus = 0;
    if (qq.chain) {
      const steps = state.quests.filter((x) => x.chain?.id === qq.chain!.id);
      if (steps.every((x) => x.myStatus === 'COMPLETED')) {
        chainBonus = MOCK_CHAIN.bonusCredits;
        state.me.credits += chainBonus;
        state.me.stats.creditsEarned += chainBonus;
        addLedger(chainBonus, 'BONUS', `Chain complete: ${qq.chain.title}`);
      }
    }
    const want: string[] = ['first-steps'];
    if (state.me.stats.questsCompleted >= 5) want.push('regular');
    if (state.me.stats.neighborhoods.length >= 3) want.push('explorer');
    if (qq.capacity > 1) want.push('team-player');
    if (chainBonus) want.push('chain-breaker');
    if (state.donations > 0) want.push('patron');
    const newBadges: BadgeDTO[] = MOCK_BADGES.filter((b) => want.includes(b.slug) && !beforeBadges.has(b.slug))
      .map((b) => ({ ...b, earnedAt: new Date().toISOString() }));
    state.me.badges.push(...newBadges);
    refreshMe();
    return delay({
      me: state.me,
      earned: { credits: qq.rewardCredits, xp: qq.rewardXp, chainBonus },
      levelUp: state.me.level > beforeLevel,
      newBadges,
      quest: qq,
    });
  },
  store: () => delay({ sponsors: state.sponsors }),
  redeem: (offerId: string): Promise<RedemptionDTO> => {
    for (const s of state.sponsors) {
      const offer = s.offers.find((o) => o.id === offerId);
      if (!offer) continue;
      if (offer.stock <= 0) throw new ApiError('CONFLICT', 'Out of stock');
      if (state.me.credits < offer.costCredits) throw new ApiError('INSUFFICIENT_CREDITS', 'Not enough credits');
      state.me.credits -= offer.costCredits;
      offer.stock--;
      addLedger(-offer.costCredits, 'SPEND', `Redeemed: ${offer.title}`);
      const code = 'RPGB-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      return delay({ id: nextId(), code, offer, sponsorName: s.name, balance: state.me.credits });
    }
    throw new ApiError('NOT_FOUND', 'Offer not found');
  },
  causes: () => delay(state.causes),
  donate: (causeId: string, amount: number) => {
    const cause = state.causes.find((c) => c.id === causeId);
    if (!cause) throw new ApiError('NOT_FOUND', 'Cause not found');
    if (amount <= 0 || state.me.credits < amount) throw new ApiError('INSUFFICIENT_CREDITS', 'Not enough credits');
    state.me.credits -= amount;
    state.me.stats.creditsDonated += amount;
    state.donations++;
    cause.raisedCredits += amount;
    addLedger(-amount, 'DONATE', `Donated to ${cause.title}`);
    if (!state.me.badges.some((b) => b.slug === 'patron')) {
      const b = MOCK_BADGES.find((x) => x.slug === 'patron')!;
      state.me.badges.push({ ...b, earnedAt: new Date().toISOString() });
    }
    return delay({ balance: state.me.credits, cause });
  },
  ledger: () => delay(state.ledger.slice(0, 50)),
  matches: (): Promise<MatchDTO[]> => delay(MOCK_MATCHES),
  demoCodes: (): Promise<Record<string, string>> => delay({ ...CODES }),
  leaderboard: (): Promise<LeaderboardRowDTO[]> =>
    delay([
      { rank: 1, displayName: 'Maya', avatarEmoji: '🐾', xp: 520, level: 4 },
      { rank: 2, displayName: 'Jordan', avatarEmoji: '🌲', xp: 340, level: 3 },
      { rank: 3, displayName: state.me.displayName, avatarEmoji: state.me.avatarEmoji, xp: state.me.xp, level: state.me.level },
    ]),
  giverQuests: () => delay(state.quests.filter((x) => x.verifyCode)),
  giverCreate: (input: NewQuestInput) => {
    const r = computeReward(input.durationMin, input.difficulty);
    const id = nextId();
    const qq: QuestDetailDTO = {
      ...input, id, rewardCredits: r.credits, rewardXp: r.xp, participantCount: 0, spotsLeft: input.capacity, status: 'OPEN',
      org: { id: 'mock-org', name: 'Railroad Park Foundation (demo)', emoji: '🚂', verified: true }, chain: null, myStatus: null,
      party: [], verifyCode: String(Math.floor(1000 + Math.random() * 9000)),
    };
    CODES[id] = qq.verifyCode!;
    state.quests.push(qq);
    return delay(qq);
  },
  chains: (): Promise<ChainDTO[]> => {
    const steps = MOCK_CHAIN.steps.map((s) => ({ ...s, done: state.quests.find((x) => x.id === s.questId)?.myStatus === 'COMPLETED' }));
    return delay([{ ...MOCK_CHAIN, steps }]);
  },
};
