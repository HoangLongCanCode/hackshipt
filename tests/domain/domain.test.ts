import { describe, expect, it } from 'vitest';
import {
  badgesEarned, computeReward, deriveClass, distanceMeters, levelFromXp, levelProgress,
  matchReason, matchScore, revealedDistricts, xpForLevel, type MatchProfile,
} from '@/lib/domain';

describe('levels', () => {
  it('edges', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(39)).toBe(1);
    expect(levelFromXp(40)).toBe(2);
    expect(levelFromXp(159)).toBe(2);
    expect(levelFromXp(160)).toBe(3);
  });
  it('xpForLevel', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(40);
    expect(xpForLevel(3)).toBe(160);
  });
  it('progress', () => {
    expect(levelProgress(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNext: 40, pct: 0 });
    const p = levelProgress(100);
    expect(p.level).toBe(2);
    expect(p.xpIntoLevel).toBe(60);
    expect(p.xpForNext).toBe(120);
    expect(p.pct).toBeCloseTo(0.5);
  });
});

describe('deriveClass', () => {
  it('no completions → wanderer', () => expect(deriveClass([])).toBe('wanderer'));
  it('animals → keeper', () => expect(deriveClass([{ category: 'animals', completedAt: 1 }])).toBe('keeper'));
  it('food+animals count together', () => {
    expect(deriveClass([
      { category: 'food', completedAt: 1 }, { category: 'animals', completedAt: 2 }, { category: 'arts', completedAt: 3 },
    ])).toBe('keeper');
  });
  it('tie → most recent', () => {
    expect(deriveClass([
      { category: 'cleanup', completedAt: 10 }, { category: 'education', completedAt: 20 },
    ])).toBe('teacher');
    expect(deriveClass([
      { category: 'education', completedAt: 10 }, { category: 'cleanup', completedAt: 20 },
    ])).toBe('builder');
  });
});

describe('distance', () => {
  it('same point is 0', () => expect(distanceMeters({ lat: 1, lng: 1 }, { lat: 1, lng: 1 })).toBe(0));
  it('Railroad Park ↔ Vulcan Park ≈ 3 km', () => {
    const d = distanceMeters({ lat: 33.5116, lng: -86.8128 }, { lat: 33.4916, lng: -86.7956 });
    expect(d).toBeGreaterThan(2500);
    expect(d).toBeLessThan(3500);
  });
});

describe('computeReward', () => {
  it('rounds to 5 and xp = 2x', () => {
    expect(computeReward(60, 2)).toEqual({ credits: 25, xp: 50 });
    const r = computeReward(30, 1);
    expect(r.credits % 5).toBe(0);
    expect(r.xp).toBe(r.credits * 2);
  });
  it('never below 5', () => expect(computeReward(10, 1).credits).toBeGreaterThanOrEqual(5));
});

const me: MatchProfile = { id: 'me', avatarClass: 'keeper', interestSlugs: ['animals', 'gardening'], questIds: ['q1'], neighborhoods: ['Avondale'] };
const other: MatchProfile = { id: 'o', avatarClass: 'keeper', interestSlugs: ['animals', 'gardening', 'tech'], questIds: ['q1', 'q2'], neighborhoods: ['Avondale', 'Downtown'] };

describe('matching', () => {
  it('score formula', () => expect(matchScore(me, other)).toBe(3 * 2 + 2 + 2 * 1 + 1));
  it('excludes self', () => expect(matchScore(me, me)).toBe(0));
  it('reason is specific', () => {
    const r = matchReason(me, other, { animals: 'Animals', gardening: 'Gardening' }, { q1: 'Dog Day at the Shelter' });
    expect(r).toContain('Both into Animals & Gardening');
    expect(r).toContain("Both on 'Dog Day at the Shelter'");
  });
  it('fallback reason', () => {
    const stranger: MatchProfile = { id: 's', avatarClass: 'bard', interestSlugs: [], questIds: [], neighborhoods: [] };
    expect(matchReason({ ...me, avatarClass: 'wanderer', interestSlugs: [], questIds: [], neighborhoods: [] }, stranger)).toBeTruthy();
  });
});

describe('badges', () => {
  const base = { completed: 0, distinctNeighborhoods: 0, donations: 0, completedGroupQuest: false, completedChain: false };
  it('none', () => expect(badgesEarned(base)).toEqual([]));
  it('first-steps', () => expect(badgesEarned({ ...base, completed: 1 })).toEqual(['first-steps']));
  it('regular at 5', () => expect(badgesEarned({ ...base, completed: 5 })).toContain('regular'));
  it('explorer at 3 neighborhoods', () => expect(badgesEarned({ ...base, distinctNeighborhoods: 3 })).toContain('explorer'));
  it('patron / team-player / chain-breaker', () => {
    expect(badgesEarned({ ...base, donations: 1, completedGroupQuest: true, completedChain: true }))
      .toEqual(expect.arrayContaining(['patron', 'team-player', 'chain-breaker']));
  });
});

describe('revealedDistricts', () => {
  it('maps known names only', () => {
    expect(revealedDistricts(['Downtown', 'Atlantis'])).toEqual(['Downtown']);
    expect(revealedDistricts([])).toEqual([]);
  });
});
