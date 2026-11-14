'use client';

/**
 * Client data layer. The UI was built against the Prisma contract in lib/contracts.ts; the live backend
 * (lib/game.js on Supabase) speaks a smaller "bootstrap + actions" API. This file adapts one to the other,
 * so the pages and hooks stay exactly as designed.
 */
import useSWR, { mutate as globalMutate } from 'swr';
import { ApiError } from '@/lib/contracts';
import type {
  BadgeDTO, CauseDTO, Category, ChainDTO, CompleteResultDTO, ErrorCode, InterestDTO, LeaderboardRowDTO, LedgerEntryDTO, MatchDTO, MeDTO,
  NewQuestInput, PatchMeInput, QuestDTO, QuestDetailDTO, QuestFilters, RedemptionDTO, SponsorDTO, AvatarClass,
} from '@/lib/contracts';
import { BIRMINGHAM, DISTRICTS } from '@/lib/constants';
import { localTodayStr } from '@/lib/dates';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = Record<string, any>;

// ---------- transport ----------
const TOKEN_KEY = 'rpgb-token';
const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
const setToken = (t: string | null) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ }
};

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  });
  let json: any;
  try { json = await res.json(); } catch { throw new ApiError('INVALID_INPUT', `Bad response (${res.status})`, res.status); }
  if (!json.ok) throw new ApiError(json.error.code as ErrorCode, json.error.message, res.status);
  return json.data as T;
}

// One bootstrap fetch feeds every hook; share it for a moment so a page with six hooks makes one request.
let inflight: { at: number; p: Promise<Raw> } | null = null;
function boot(force = false): Promise<Raw> {
  if (!force && inflight && Date.now() - inflight.at < 800) return inflight.p;
  const p = call<Raw>('GET', 'bootstrap');
  inflight = { at: Date.now(), p };
  p.catch(() => { if (inflight?.p === p) inflight = null; });
  return p;
}

// ---------- adapters: backend shape -> contract DTOs ----------
export const INTEREST_LIST: InterestDTO[] = [
  { slug: 'food', label: 'Food', emoji: '🍲' },
  { slug: 'gardening', label: 'Gardening', emoji: '🌱' },
  { slug: 'teaching', label: 'Teaching', emoji: '📚' },
  { slug: 'tech', label: 'Tech', emoji: '💻' },
  { slug: 'seniors', label: 'Seniors', emoji: '🤝' },
  { slug: 'community', label: 'Community', emoji: '💬' },
  { slug: 'outdoors', label: 'Outdoors', emoji: '🌳' },
  { slug: 'music', label: 'Music', emoji: '🎸' },
];
const interestOf = (slug: string): InterestDTO => INTEREST_LIST.find((i) => i.slug === slug) ?? { slug, label: slug, emoji: '✨' };

const CATEGORY: Record<string, Category> = { education: 'education', food: 'food', farm: 'environment', tech: 'education', seniors: 'seniors', community: 'community' };

function neighborhoodOf(lat: number, lng: number): string {
  let best = 'Birmingham', bd = Infinity;
  for (const d of DISTRICTS) {
    const dy = (lat - d.center.lat) * 111_000, dx = (lng - d.center.lng) * 92_000;
    const dist = Math.hypot(dx, dy);
    if (dist < bd) { bd = dist; best = d.name; }
  }
  return bd < 2500 ? best : 'Birmingham';
}

const mapBadge = (b: Raw): BadgeDTO => ({ slug: b.slug, name: b.name, icon: b.icon, description: b.description });

function toMe(raw: Raw): MeDTO {
  const m = raw.me as Raw;
  const earned = (raw.ledger as Raw[] | undefined)?.filter((l) => l.delta > 0).reduce((a, l) => a + l.delta, 0) ?? 0;
  return {
    id: m.id, email: m.email, displayName: m.name, bio: '', favoriteArtist: '', hobby: '',
    avatarClass: (m.klass ?? 'wanderer') as AvatarClass, avatarEmoji: m.avatarEmoji,
    xp: m.xp, level: m.level, xpIntoLevel: m.xpIntoLevel, xpForNext: m.xpForNext, credits: m.credits,
    interests: (m.interests as string[]).map(interestOf),
    badges: (m.badges as Raw[]).map(mapBadge),
    stats: { questsCompleted: m.stats.questsCompleted, creditsEarned: earned, creditsDonated: m.stats.creditsDonated, neighborhoods: [] },
    // The map has no fog of war, so every district counts as discovered.
    revealedDistricts: DISTRICTS.map((d) => d.name),
  };
}

function toQuest(q: Raw, orgs: Raw[]): QuestDTO {
  const o = orgs.find((x) => x.id === q.orgId) ?? {};
  return {
    id: q.id, title: q.title, description: q.description, category: CATEGORY[q.category] ?? 'community',
    interestSlugs: q.tags ?? [], lat: q.lat, lng: q.lng, neighborhood: String(q.address || '').replace(/\s*\(demo site\)/, '').split(',')[0].replace(/ Birmingham$/, '') || neighborhoodOf(q.lat, q.lng), address: q.address,
    difficulty: Math.min(5, Math.max(1, q.difficulty)) as QuestDTO['difficulty'], durationMin: q.durationMin,
    rewardCredits: q.rewardCredits, rewardXp: q.rewardXp, capacity: q.capacity, participantCount: q.capacity - q.spotsLeft,
    spotsLeft: q.spotsLeft, status: 'OPEN',
    org: { id: o.id ?? q.orgId, name: o.name ?? 'Partner', emoji: o.emoji ?? '📍', verified: true },
    chain: null, myStatus: q.myStatus ?? null, date: q.date, time: q.time,
  };
}

function toDetail(q: Raw, orgs: Raw[]): QuestDetailDTO {
  return {
    ...toQuest(q, orgs),
    party: (q.party as Raw[]).map((p) => ({
      userId: p.name, displayName: p.isMe ? 'You' : p.name, avatarEmoji: p.emoji, avatarClass: 'wanderer' as AvatarClass, level: 1,
    })),
  };
}

function applyFilters(list: QuestDTO[], f: QuestFilters = {}): QuestDTO[] {
  return list.filter((q) => {
    if (f.category && q.category !== f.category) return false;
    if (f.group && q.capacity <= 1) return false;
    if (f.maxMinutes && q.durationMin > f.maxMinutes) return false;
    if (f.neighborhood && q.neighborhood !== f.neighborhood) return false;
    if (f.q && !`${q.title} ${q.description} ${q.org.name}`.toLowerCase().includes(f.q.toLowerCase())) return false;
    return true;
  });
}

// ---------- fetchers ----------
const fetchers = {
  async me(): Promise<MeDTO> {
    const raw = await boot();
    if (!raw.me) throw new ApiError('UNAUTHENTICATED', 'Please sign in.', 401);
    return toMe(raw);
  },
  interests: async (): Promise<InterestDTO[]> => INTEREST_LIST,
  async quests(f?: QuestFilters): Promise<QuestDTO[]> {
    const raw = await boot();
    return applyFilters((raw.quests as Raw[]).map((q) => toQuest(q, raw.orgs)), f);
  },
  async quest(id: string): Promise<QuestDetailDTO> {
    const raw = await boot();
    const q = (raw.quests as Raw[]).find((x) => x.id === id);
    if (!q) throw new ApiError('NOT_FOUND', 'Quest not found.', 404);
    return toDetail(q, raw.orgs);
  },
  async store(): Promise<{ sponsors: SponsorDTO[] }> {
    const raw = await boot();
    const by = new Map<string, SponsorDTO>();
    for (const o of raw.offers as Raw[]) {
      if (!by.has(o.sponsor)) by.set(o.sponsor, { id: o.sponsor, name: o.sponsor, emoji: o.emoji, description: '', lat: BIRMINGHAM.center.lat, lng: BIRMINGHAM.center.lng, offers: [] });
      by.get(o.sponsor)!.offers.push({ id: o.id, title: o.title, description: o.description, costCredits: o.cost, stock: o.stock });
    }
    return { sponsors: [...by.values()] };
  },
  async causes(): Promise<CauseDTO[]> {
    const raw = await boot();
    return (raw.causes as Raw[]).map((c) => ({
      id: c.id, title: c.title, description: c.description, orgName: (raw.orgs as Raw[]).find((o) => o.id === c.orgId)?.name ?? '',
      goalCredits: c.goal, raisedCredits: c.raised,
    }));
  },
  async ledger(): Promise<LedgerEntryDTO[]> {
    const raw = await boot();
    if (!raw.me) throw new ApiError('UNAUTHENTICATED', 'Please sign in.', 401);
    return ((raw.ledger ?? []) as Raw[]).map((l, i) => ({ id: String(i), delta: l.delta, kind: l.kind, note: l.note, createdAt: l.at }));
  },
  async matches(): Promise<MatchDTO[]> {
    const rows = await call<Raw[]>('GET', 'people');
    return rows.map((p) => ({
      userId: p.name, displayName: p.name, avatarEmoji: p.emoji, avatarClass: p.klass as AvatarClass, level: p.level, score: p.score,
      sharedInterests: (p.shared as string[]).map(interestOf), reason: p.reason,
    }));
  },
  // Demo helper: the host's code, revealed once you are checked in at the site.
  async demoCodes(): Promise<Record<string, string>> {
    const raw = await boot();
    const out: Record<string, string> = {};
    for (const q of raw.quests as Raw[]) if (q.demoCode) out[q.id] = q.demoCode;
    return out;
  },
  async leaderboard(): Promise<LeaderboardRowDTO[]> {
    const raw = await boot();
    return (raw.leaderboard as Raw[]).map((r) => ({ rank: r.rank, displayName: r.isMe ? `${r.name} (you)` : r.name, avatarEmoji: r.emoji, xp: r.xp, level: r.level }));
  },
  async giverQuests(): Promise<QuestDetailDTO[]> {
    throw new ApiError('FORBIDDEN', 'Posting quests is not available in this build.', 403);
  },
  chains: async (): Promise<ChainDTO[]> => [],
};

// ---------- hooks ----------
export const useMe = () => useSWR<MeDTO>('me', fetchers.me, { shouldRetryOnError: false });
export const useInterests = () => useSWR<InterestDTO[]>('interests', fetchers.interests);
export const useQuests = (filters?: QuestFilters) => useSWR<QuestDTO[]>(['quests', JSON.stringify(filters ?? {})], () => fetchers.quests(filters));
export const useQuest = (id: string | null | undefined) => useSWR<QuestDetailDTO>(id ? ['quest', id] : null, () => fetchers.quest(id as string));
export const useStore = () => useSWR<{ sponsors: SponsorDTO[] }>('store', fetchers.store);
export const useCauses = () => useSWR<CauseDTO[]>('causes', fetchers.causes);
export const useLedger = () => useSWR<LedgerEntryDTO[]>('ledger', fetchers.ledger);
export const useMatches = () => useSWR<MatchDTO[]>('matches', fetchers.matches);
export const useChains = () => useSWR<ChainDTO[]>('chains', fetchers.chains);
export const useDemoCodes = () => useSWR<Record<string, string>>('demo-codes', fetchers.demoCodes, { shouldRetryOnError: false });
export const useLeaderboard = () => useSWR<LeaderboardRowDTO[]>('leaderboard', fetchers.leaderboard);
export const useGiverQuests = () => useSWR<QuestDetailDTO[]>('giver-quests', fetchers.giverQuests, { shouldRetryOnError: false });

/** Revalidate every SWR key after a mutation. (No data argument: passing `undefined` would clear caches and unmount open sheets.) */
const refresh = () => {
  inflight = null;
  return globalMutate(() => true);
};

async function act<T>(run: () => Promise<T>): Promise<T> {
  const result = await run();
  inflight = null;
  await refresh();
  return result;
}

// ---------- actions ----------
export const login = (email: string, displayName?: string) =>
  act<MeDTO>(async () => {
    const { token } = await call<{ token: string }>('POST', 'login', { email, name: displayName });
    setToken(token);
    const me = toMe(await boot(true));
    // Overwrite the cached "signed out" error before navigating, or the app layout bounces back to /login.
    await globalMutate('me', me, { revalidate: false });
    return me;
  });

export const logout = () =>
  act<object>(async () => {
    setToken(null);
    return {};
  });

export const updateProfile = (patch: PatchMeInput) =>
  act<MeDTO>(async () => {
    await call('POST', 'profile', { interests: patch.interestSlugs });
    return toMe(await boot(true));
  });

const detailOf = async (id: string) => fetchers.quest(id);

export const acceptQuest = (id: string) =>
  act<QuestDetailDTO>(async () => { await call('POST', `quests/${id}/accept`); inflight = null; return detailOf(id); });

export const checkIn = (id: string, _lat: number, _lng: number) =>
  act<QuestDetailDTO>(async () => { await call('POST', `quests/${id}/checkin`, { today: localTodayStr() }); inflight = null; return detailOf(id); });

export const abandonQuest = (id: string) =>
  act<QuestDetailDTO>(async () => { await call('POST', `quests/${id}/abandon`); inflight = null; return detailOf(id); });

export const completeQuest = (id: string, code: string) =>
  act<CompleteResultDTO>(async () => {
    const r = await call<Raw>('POST', `quests/${id}/complete`, { code });
    inflight = null;
    const raw = await boot(true);
    return {
      me: toMe(raw), earned: { credits: r.earned.credits, xp: r.earned.xp, chainBonus: 0 },
      levelUp: !!r.levelUp, newBadges: (r.newBadges as Raw[]).map(mapBadge), quest: toDetail((raw.quests as Raw[]).find((q) => q.id === id)!, raw.orgs),
    };
  });

export const redeem = (offerId: string) =>
  act<RedemptionDTO>(async () => {
    const r = await call<Raw>('POST', 'redeem', { offerId });
    inflight = null;
    const raw = await boot(true);
    const offer = (raw.offers as Raw[]).find((o) => o.id === offerId) ?? { id: offerId, title: r.title, description: '', cost: 0, stock: 0 };
    return {
      id: r.code, code: r.code, sponsorName: r.sponsor, balance: raw.me?.credits ?? 0,
      offer: { id: offer.id, title: offer.title, description: offer.description, costCredits: offer.cost, stock: offer.stock },
    };
  });

export const donate = (causeId: string, amount: number) =>
  act<{ balance: number; cause: CauseDTO }>(async () => {
    await call('POST', 'donate', { causeId, amount });
    inflight = null;
    const raw = await boot(true);
    const cause = (await fetchers.causes()).find((c) => c.id === causeId)!;
    return { balance: raw.me?.credits ?? 0, cause };
  });

export const giverCreateQuest = (_input: NewQuestInput): Promise<QuestDetailDTO> =>
  Promise.reject(new ApiError('FORBIDDEN', 'Posting quests is not available in this build.', 403));
