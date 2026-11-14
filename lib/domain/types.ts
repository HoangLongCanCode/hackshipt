import type { AvatarClass, Category } from '@/lib/contracts';

export interface LatLng { lat: number; lng: number }

export interface LevelProgress { level: number; xpIntoLevel: number; xpForNext: number; pct: number }

export interface Completion { category: Category; completedAt: Date | number }

/** What the matcher needs to know about one adventurer. */
export interface MatchProfile {
  id: string;
  avatarClass: AvatarClass;
  interestSlugs: string[];
  /** ids of quests the user has active (ACCEPTED/CHECKED_IN) or COMPLETED */
  questIds: string[];
  /** neighborhoods of the user's COMPLETED quests */
  neighborhoods: string[];
}

export interface BadgeStats {
  completed: number;
  distinctNeighborhoods: number;
  donations: number;
  completedGroupQuest: boolean;
  completedChain: boolean;
}

export interface Reward { credits: number; xp: number }
