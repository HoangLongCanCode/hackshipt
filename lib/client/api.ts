'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { ApiError } from '@/lib/contracts';
import type {
  ApiEnvelope, CauseDTO, LeaderboardRowDTO, NewQuestInput, ChainDTO, CompleteResultDTO, ErrorCode, InterestDTO, LedgerEntryDTO, MatchDTO, MeDTO,
  PatchMeInput, QuestDTO, QuestDetailDTO, QuestFilters, RedemptionDTO, SponsorDTO,
} from '@/lib/contracts';
import { mock } from '@/lib/mock/store';

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === '1';

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(path, {
    method: init?.method ?? 'GET',
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    credentials: 'same-origin',
  });
  let json: ApiEnvelope<T>;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError('INVALID_INPUT', `Bad response (${res.status})`, res.status);
  }
  if (!json.ok) throw new ApiError(json.error.code as ErrorCode, json.error.message, res.status);
  return json.data;
}

function qs(filters: QuestFilters = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
}

// ---------- fetchers ----------
const fetchers = {
  me: (): Promise<MeDTO> => (USE_MOCKS ? mock.me() : call('/api/me')),
  interests: (): Promise<InterestDTO[]> => (USE_MOCKS ? mock.interests() : call('/api/interests')),
  quests: (f?: QuestFilters): Promise<QuestDTO[]> => (USE_MOCKS ? mock.quests(f) : call(`/api/quests${qs(f)}`)),
  quest: (id: string): Promise<QuestDetailDTO> => (USE_MOCKS ? mock.quest(id) : call(`/api/quests/${id}`)),
  store: (): Promise<{ sponsors: SponsorDTO[] }> => (USE_MOCKS ? mock.store() : call('/api/store')),
  causes: (): Promise<CauseDTO[]> => (USE_MOCKS ? mock.causes() : call('/api/causes')),
  ledger: (): Promise<LedgerEntryDTO[]> => (USE_MOCKS ? mock.ledger() : call('/api/ledger')),
  matches: (): Promise<MatchDTO[]> => (USE_MOCKS ? mock.matches() : call('/api/matches')),
  leaderboard: (): Promise<LeaderboardRowDTO[]> => (USE_MOCKS ? mock.leaderboard() : call('/api/leaderboard?scope=neighborhood')),
  giverQuests: (): Promise<QuestDetailDTO[]> => (USE_MOCKS ? mock.giverQuests() : call('/api/giver/quests')),
  chains: (): Promise<ChainDTO[]> => (USE_MOCKS ? mock.chains() : call('/api/chains')),
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

export const useLeaderboard = () => useSWR<LeaderboardRowDTO[]>('leaderboard', fetchers.leaderboard);
export const useGiverQuests = () => useSWR<QuestDetailDTO[]>('giver-quests', fetchers.giverQuests, { shouldRetryOnError: false });

/** Revalidate every SWR key after a mutation. */
// NOTE: no data argument. Passing `undefined` would clear every cache entry, which unmounts open sheets/modals mid-action.
const refresh = () => globalMutate(() => true);

async function act<T>(run: () => Promise<T>): Promise<T> {
  const result = await run();
  await refresh();
  return result;
}

// ---------- actions ----------
export const login = (email: string, displayName?: string) =>
  act<MeDTO>(() => (USE_MOCKS ? mock.login(email, displayName) : call('/api/auth/login', { method: 'POST', body: { email, displayName } })));
export const logout = () => act<object>(() => (USE_MOCKS ? mock.logout() : call('/api/auth/logout', { method: 'POST' })));
export const updateProfile = (patch: PatchMeInput) =>
  act<MeDTO>(() => (USE_MOCKS ? mock.updateProfile(patch) : call('/api/me', { method: 'PATCH', body: patch })));
export const acceptQuest = (id: string) =>
  act<QuestDetailDTO>(() => (USE_MOCKS ? mock.accept(id) : call(`/api/quests/${id}/accept`, { method: 'POST' })));
export const checkIn = (id: string, lat: number, lng: number) =>
  act<QuestDetailDTO>(() => (USE_MOCKS ? mock.checkin(id) : call(`/api/quests/${id}/checkin`, { method: 'POST', body: { lat, lng } })));
export const completeQuest = (id: string, code: string) =>
  act<CompleteResultDTO>(() => (USE_MOCKS ? mock.complete(id, code) : call(`/api/quests/${id}/complete`, { method: 'POST', body: { code } })));
export const abandonQuest = (id: string) =>
  act<QuestDetailDTO>(() => (USE_MOCKS ? mock.abandon(id) : call(`/api/quests/${id}/abandon`, { method: 'POST' })));
export const redeem = (offerId: string) =>
  act<RedemptionDTO>(() => (USE_MOCKS ? mock.redeem(offerId) : call('/api/store/redeem', { method: 'POST', body: { offerId } })));
export const donate = (causeId: string, amount: number) =>
  act<{ balance: number; cause: CauseDTO }>(() => (USE_MOCKS ? mock.donate(causeId, amount) : call('/api/donate', { method: 'POST', body: { causeId, amount } })));
export const giverCreateQuest = (input: NewQuestInput) =>
  act<QuestDetailDTO>(() => (USE_MOCKS ? mock.giverCreate(input) : call('/api/giver/quests', { method: 'POST', body: input })));
