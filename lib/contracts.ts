import { z } from 'zod';

// ---------- Enumerations ----------
export const CATEGORIES = ['cleanup', 'food', 'education', 'seniors', 'animals', 'arts', 'environment', 'community'] as const;
export type Category = (typeof CATEGORIES)[number];
export const AVATAR_CLASSES = ['wanderer', 'builder', 'healer', 'scout', 'teacher', 'keeper', 'bard'] as const;
export type AvatarClass = (typeof AVATAR_CLASSES)[number];
export type MyStatus = 'ACCEPTED' | 'CHECKED_IN' | 'COMPLETED' | 'ABANDONED';

// ---------- DTOs (SYSTEM.md §7) ----------
export interface InterestDTO { slug: string; label: string; emoji: string }

export interface QuestDTO {
  id: string; title: string; description: string; category: Category;
  interestSlugs: string[]; lat: number; lng: number; neighborhood: string; address: string;
  difficulty: 1 | 2 | 3 | 4 | 5; durationMin: number; rewardCredits: number; rewardXp: number;
  capacity: number; participantCount: number; spotsLeft: number; status: 'OPEN' | 'CLOSED';
  org: { id: string; name: string; emoji: string; verified: boolean };
  chain?: { id: string; title: string; order: number; total: number } | null;
  myStatus?: MyStatus | null;
}
export interface PartyMemberDTO { userId: string; displayName: string; avatarEmoji: string; avatarClass: AvatarClass; level: number }
export interface QuestDetailDTO extends QuestDTO { party: PartyMemberDTO[]; verifyCode?: string /* only for giver's own org */ }

export interface BadgeDTO { slug: string; name: string; icon: string; description: string; earnedAt?: string }
export interface MeDTO {
  id: string; email: string; displayName: string; bio: string;
  avatarClass: AvatarClass; avatarEmoji: string;
  xp: number; level: number; xpIntoLevel: number; xpForNext: number; credits: number;
  interests: InterestDTO[]; badges: BadgeDTO[];
  stats: { questsCompleted: number; creditsEarned: number; creditsDonated: number; neighborhoods: string[] };
  revealedDistricts: string[];
}
export interface CompleteResultDTO {
  me: MeDTO; earned: { credits: number; xp: number; chainBonus: number };
  levelUp: boolean; newBadges: BadgeDTO[]; quest: QuestDetailDTO;
}
export interface OfferDTO { id: string; title: string; description: string; costCredits: number; stock: number }
export interface SponsorDTO { id: string; name: string; emoji: string; description: string; lat: number; lng: number; offers: OfferDTO[] }
export interface RedemptionDTO { id: string; code: string; offer: OfferDTO; sponsorName: string; balance: number }
export interface CauseDTO { id: string; title: string; description: string; orgName: string; goalCredits: number; raisedCredits: number }
export interface LedgerEntryDTO { id: string; delta: number; kind: 'EARN' | 'BONUS' | 'SPEND' | 'DONATE'; note: string; createdAt: string }
export interface MatchDTO { userId: string; displayName: string; avatarEmoji: string; avatarClass: AvatarClass; level: number; score: number; sharedInterests: InterestDTO[]; reason: string }
export interface ChainDTO { id: string; title: string; description: string; bonusCredits: number; steps: { questId: string; title: string; order: number; done: boolean }[] }
export interface NewQuestInput { title: string; description: string; category: Category; lat: number; lng: number; neighborhood: string; address: string; difficulty: 1 | 2 | 3 | 4 | 5; durationMin: number; capacity: number; interestSlugs: string[] }
export interface LeaderboardRowDTO { rank: number; displayName: string; avatarEmoji: string; xp: number; level: number }

// ---------- Errors ----------
export type ErrorCode =
  | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INVALID_INPUT' | 'CONFLICT'
  | 'INSUFFICIENT_CREDITS' | 'TOO_FAR' | 'BAD_CODE' | 'QUEST_FULL' | 'DAILY_CAP';

export class ApiError extends Error {
  code: ErrorCode;
  status?: number;
  constructor(code: ErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: { code: ErrorCode | string; message: string } };

// ---------- Request schemas ----------
export const loginSchema = z.object({
  email: z.string().trim().email(),
  displayName: z.string().trim().min(1).max(40).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const patchMeSchema = z.object({
  displayName: z.string().trim().min(1).max(40).optional(),
  bio: z.string().max(280).optional(),
  interestSlugs: z.array(z.string()).max(12).optional(),
});
export type PatchMeInput = z.infer<typeof patchMeSchema>;

export const checkinSchema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });
export type CheckinInput = z.infer<typeof checkinSchema>;

export const completeSchema = z.object({ code: z.string().trim().min(1).max(8) });
export type CompleteInput = z.infer<typeof completeSchema>;

export const redeemSchema = z.object({ offerId: z.string().min(1) });
export type RedeemInput = z.infer<typeof redeemSchema>;

export const donateSchema = z.object({ causeId: z.string().min(1), amount: z.number().int().positive() });
export type DonateInput = z.infer<typeof donateSchema>;

export const newQuestSchema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(3).max(1000),
  category: z.enum(CATEGORIES),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  neighborhood: z.string().min(1),
  address: z.string().min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  durationMin: z.number().int().min(10).max(600),
  capacity: z.number().int().min(1).max(50),
  interestSlugs: z.array(z.string()),
});

export const questFiltersSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  q: z.string().optional(),
  neighborhood: z.string().optional(),
  maxMinutes: z.coerce.number().int().positive().optional(),
  group: z.enum(['1']).optional(),
  status: z.enum(['OPEN', 'CLOSED']).optional(),
});
export type QuestFilters = z.infer<typeof questFiltersSchema>;
