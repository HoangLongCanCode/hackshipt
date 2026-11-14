# Phase 3 — Frontend: App UI (1 agent, parallel with Phases 2 and 4, ~85 min)

---PROMPT START---

You are the **Frontend agent** for RPG Birmingham, a 4-hour personal hackathon project. Two other agents (Backend = Phase 2, 3D Map = Phase 4) work at the same time in the same folder. You own every screen except the 3D scene itself. Code fast; the demo path must be flawless.

**Read `D:\Projects\hackshipt\docs\SYSTEM.md` completely first** (§7 DTOs, §9 design system, §10 mock mode, §14 demo script), and `Claude.txt`.

## Context from previous phases
{{PHASE_1_HANDOFF}}

*(If still a literal placeholder, Phase 1 isn't merged: rely on SYSTEM.md and inspect the repo.)*

## Owned paths (edit only these)
`app/(app)/**`, `app/login/**`, `components/{ui,shell,quest,profile,store}/**`, `lib/client/**` (hook/action names and signatures from Phase 1 are frozen; you may add small helper hooks), and additions to `app/globals.css` below a `/* P3 */` marker. **Never edit** `components/map/**` (Phase 4 is replacing the stub `QuestMap`; its props are frozen in §8), `lib/contracts.ts`, `prisma/**`, `app/api/**`, `lib/domain/**`.

## Goal
Every screen on the demo path (§14) works against **mock mode** (`NEXT_PUBLIC_USE_MOCKS=1`) with real loading/empty/error states, in a polished mobile-game look ("cozy-dark RPG", §9 tokens). Phase 5 later flips to the real API.

## Tasks
1. **UI kit** `components/ui`: Button (variants), Card, Pill, Sheet (bottom sheet with peek/half/full snap; CSS + pointer events), ProgressBar, Avatar (emoji), Modal, Toast (provider + `useToast`), EmptyState, Skeleton.
2. **Shell** `components/shell`: top-left HUD (level ring from `MeDTO`, gold credits pill, class emoji), bottom nav (Map · Quests · People · Store · Profile) with active state, and an auth gate in `app/(app)/layout.tsx` (redirect to `/login` when `useMe` is unauthenticated). Wordmark "RPG Birmingham".
3. **Login** (`/login`): email + display name, big "Begin your adventure" button, a prefilled demo-email chip; calls `login`, routes to `/`.
4. **Map home** (`app/(app)/page.tsx`): full-screen `<QuestMap>` fed by `useQuests(filters)` and `useMe().revealedDistricts`; category filter chips on top; bottom `Sheet` with a horizontally scrolling quest-card carousel (peek) that expands to detail when a beacon or card is selected. One shared selection state for map and sheet.
5. **Quest components** `components/quest`: `QuestCard`, `QuestSheet` (org, description, reward badge, duration, difficulty stars, party avatars, spots left, chain progress, and a CTA that follows `myStatus`: Accept → Check in → Enter code & Complete → Done; Abandon secondary; 4-digit code input), `CategoryChip`, `RewardBadge`.
6. **Completion moment:** on `completeQuest` success, a Modal with credits/xp count-up, level-up banner when `levelUp`, new badges. Keep it an isolated component with a clear props interface, since Phase 6 will restyle it.
7. **Pages:** `/quests` (filterable list, search, "Group only" toggle), `/quest/[id]`, `/profile` (avatar, class, level/XP bar, credits, interests editor, badges grid, stats, recent ledger), `/store` (sponsors → offers → redeem with confirm → ticket-style code card), `/donate` (causes with progress bars, amount stepper), `/people` (simple card list from `useMatches()`; Phase 5 polishes it).
8. **Resilience:** every consumer handles loading, empty and `ApiError` (toast + inline retry); buttons disable while pending; no layout shift.

## Rules
- Use only hooks/actions from `lib/client/api.ts`; no direct `fetch`; no imports from `lib/server`.
- No new dependencies; Tailwind + tokens only; icons from `lucide-react`.
- Don't change DTOs. If a screen needs missing data, derive it client-side and note it as TODO.
- Mobile first (390 px) but fine on desktop.

## Verify
`npm run typecheck` green. In mock mode, walk §14 steps 1–5 at 390 px: login → map → select quest → accept → check in → complete → modal → people → store redeem → donate. No console errors.

## Final output
End with `## HANDOFF 3` (SYSTEM.md §13): routes/components built, mock behaviors you rely on, and what will likely break when real API data replaces mocks.
