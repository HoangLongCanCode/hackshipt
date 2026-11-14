import type { AvatarClass, Category } from '@/lib/contracts';
import { DISTRICTS } from '@/lib/constants';
import type { BadgeStats, Completion, LatLng, LevelProgress, MatchProfile, Reward } from './types';

export type * from './types';

/** level = 1 + floor(sqrt(xp/40)). */
export function levelFromXp(xp: number): number {
  return 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 40));
}

/** Total XP needed to reach level n: 40 * (n-1)^2. */
export function xpForLevel(n: number): number {
  return 40 * Math.pow(Math.max(1, n) - 1, 2);
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = next - base;
  const xpIntoLevel = Math.max(0, xp) - base;
  return { level, xpIntoLevel, xpForNext: span, pct: span > 0 ? Math.min(1, xpIntoLevel / span) : 0 };
}

const CLASS_BY_CATEGORY: Record<Category, AvatarClass> = {
  cleanup: 'builder',
  environment: 'scout',
  seniors: 'healer',
  food: 'keeper',
  animals: 'keeper',
  education: 'teacher',
  arts: 'bard',
  community: 'bard',
};

/** Most frequent mapped class wins; ties go to the class of the most recent completion; none → wanderer. */
export function deriveClass(completions: Completion[]): AvatarClass {
  if (completions.length === 0) return 'wanderer';
  const counts = new Map<AvatarClass, number>();
  const latest = new Map<AvatarClass, number>();
  for (const c of completions) {
    const cls = CLASS_BY_CATEGORY[c.category];
    counts.set(cls, (counts.get(cls) ?? 0) + 1);
    const t = +new Date(c.completedAt);
    latest.set(cls, Math.max(latest.get(cls) ?? 0, t));
  }
  let best: AvatarClass = 'wanderer';
  let bestCount = -1;
  let bestTime = -1;
  for (const [cls, n] of counts) {
    const t = latest.get(cls) ?? 0;
    if (n > bestCount || (n === bestCount && t > bestTime)) {
      best = cls;
      bestCount = n;
      bestTime = t;
    }
  }
  return best;
}

/** Haversine distance in meters. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** credits ≈ (durationMin/15) * 5 * (0.8 + 0.2*difficulty) rounded to 5 (min 5); xp = credits * 2. */
export function computeReward(durationMin: number, difficulty: number): Reward {
  const raw = (durationMin / 15) * 5 * (0.8 + 0.2 * difficulty);
  const credits = Math.max(5, Math.round(raw / 5) * 5);
  return { credits, xp: credits * 2 };
}

function shared<T>(a: T[], b: T[]): T[] {
  const set = new Set(b);
  return Array.from(new Set(a)).filter((x) => set.has(x));
}

/** 3×shared interests + 2×(same class) + 2×shared quests + 1×shared neighborhoods. */
export function matchScore(me: MatchProfile, other: MatchProfile): number {
  if (me.id === other.id) return 0;
  return (
    3 * shared(me.interestSlugs, other.interestSlugs).length +
    (me.avatarClass === other.avatarClass ? 2 : 0) +
    2 * shared(me.questIds, other.questIds).length +
    shared(me.neighborhoods, other.neighborhoods).length
  );
}

function joinNice(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' & ' + items[items.length - 1];
}

/**
 * Human reason, e.g. "Both into Animals & Gardening · Both on 'Dog Day at the Shelter'".
 * `interestLabels` maps slug → label, `questTitles` maps questId → title.
 */
export function matchReason(
  me: MatchProfile,
  other: MatchProfile,
  interestLabels: Record<string, string> = {},
  questTitles: Record<string, string> = {},
): string {
  const parts: string[] = [];
  const si = shared(me.interestSlugs, other.interestSlugs);
  if (si.length) parts.push(`Both into ${joinNice(si.slice(0, 3).map((s) => interestLabels[s] ?? s))}`);
  const sq = shared(me.questIds, other.questIds);
  if (sq.length) parts.push(`Both on '${questTitles[sq[0]] ?? 'a quest'}'`);
  const sn = shared(me.neighborhoods, other.neighborhoods);
  if (sn.length) parts.push(`Both helped out in ${sn[0]}`);
  if (me.avatarClass === other.avatarClass && me.avatarClass !== 'wanderer') parts.push(`Fellow ${me.avatarClass}s`);
  return parts.length ? parts.join(' · ') : 'Fellow adventurer in Birmingham';
}

/** Slugs of every badge the stats qualify for. */
export function badgesEarned(s: BadgeStats): string[] {
  const out: string[] = [];
  if (s.completed >= 1) out.push('first-steps');
  if (s.completed >= 5) out.push('regular');
  if (s.distinctNeighborhoods >= 3) out.push('explorer');
  if (s.donations >= 1) out.push('patron');
  if (s.completedGroupQuest) out.push('team-player');
  if (s.completedChain) out.push('chain-breaker');
  return out;
}

/** Names of DISTRICTS with at least one completed quest. */
export function revealedDistricts(completedNeighborhoods: string[]): string[] {
  const done = new Set(completedNeighborhoods);
  return DISTRICTS.filter((d) => done.has(d.name)).map((d) => d.name);
}
