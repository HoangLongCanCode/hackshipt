# Phase 1 — Foundation (1 agent, ~25 min, serial)

---PROMPT START---

You are the **Foundation agent** for RPG Birmingham, a 4-hour personal hackathon project. Three parallel agents (Backend, Frontend, 3D Map) build on what you create, so your job is to lay rails, not features. Move fast; don't dive deep into anything.

**First read `D:\Projects\hackshipt\docs\SYSTEM.md` completely**: it's the source of truth for stack, schema, contracts, ownership and conventions. Also read `D:\Projects\hackshipt\Claude.txt` (project notes: hackathon, demos first, generate your own data).

## Context from previous phases
None. You are first. The repo root `D:\Projects\hackshipt` contains only `docs/` and `Claude.txt`.

## Goal
When you finish, three agents can work in parallel with zero blocking on each other: Backend (API + domain + seed), Frontend (all screens), 3D Map (three.js scene).

## Tasks (in order)
1. **Scaffold** Next.js 14 App Router + TypeScript strict + Tailwind 3 in the repo root (not nested; keep `docs/`, `Claude.txt`). Install the deps in SYSTEM.md §3: `three`, `@types/three`, `@prisma/client@5`, `prisma@5` (dev), `zod`, `jose`, `swr`, `lucide-react`, `vitest`, `tsx`. Add the npm scripts from §12. Add `.gitignore` (node_modules, .next, .env, *.db), `.env.example`, `.env`. Run `git init`.
2. **Prisma:** `prisma/schema.prisma` verbatim from §5; `prisma db push`; `lib/server/db.ts` (hot-reload-safe singleton).
3. **Contracts:** `lib/contracts.ts` with every DTO from §7 verbatim, plus a zod schema per request body (login, patchMe, checkin, complete, redeem, donate, newQuest, quest filters), inferred types, `ApiError {code, message, status?}` and the `ErrorCode` union.
4. **Constants:** `lib/constants.ts`: `CATEGORY_META` (label, emoji, color), `CLASS_META`, `BIRMINGHAM` (center lat/lng `{33.5186, -86.8025}` plus `bounds`: lat 33.38–33.68, lng −87.0 to −86.65), `DISTRICTS` (§11), `DAILY_CREDIT_CAP = 200`, `CHECKIN_RADIUS_M = 250`.
5. **Server helpers:** `lib/server/http.ts` (`ok`, `fail`, `handle(fn)` that turns `ApiError`/zod errors into the envelope), `lib/server/session.ts` (`createSession`, `getSessionUser`, `requireUser`, `destroySession`; jose + `cookies()`).
6. **Domain stubs:** `lib/domain/index.ts` + `lib/domain/types.ts` exporting these signatures with `throw new Error('TODO P2')` bodies and JSDoc: `levelFromXp`, `xpForLevel`, `levelProgress`, `deriveClass`, `distanceMeters`, `computeReward`, `matchScore`, `matchReason`, `badgesEarned`, `revealedDistricts`. These signatures are frozen (Backend codes against them).
7. **Mock layer:** `lib/mock/data.ts` (typed fixtures: ~10 quests spread across Birmingham districts, 3 sponsors with offers, 3 causes, a `MeDTO`, 5 `MatchDTO`, 1 chain) and `lib/mock/store.ts` (in-memory state that genuinely implements accept/checkin/complete/abandon/redeem/donate with simplified §6 rules, so completing changes credits, xp, `myStatus`, and can return `levelUp`/`newBadges`).
8. **Client API:** `lib/client/api.ts` per §10: every hook and action, mock-aware via `NEXT_PUBLIC_USE_MOCKS`; the real branch unwraps the envelope and throws `ApiError`.
9. **Cross-boundary stubs:** `components/map/QuestMap.tsx` (`'use client'`, default export, props exactly as §8, renders a placeholder listing quest titles); `app/(app)/layout.tsx` with bottom-nav placeholder; `app/(app)/page.tsx` rendering `<QuestMap>` from `useQuests()`; a valid heading-only page for every route in §4 so links never 404; `app/login/page.tsx`; `app/dev/map/page.tsx`; `app/api/health/route.ts`.
10. **Tokens:** §9 CSS variables in `app/globals.css`, mapped in `tailwind.config.ts`; dark by default.
11. **Prove it:** `npm run typecheck` and `npm run build` green; `npm run dev` serves `/` and `/api/health`.

## Rules
- No real domain logic, API routes, map rendering or page UI; stubs only (except `lib/mock/store.ts`, which must really work).
- Every file other agents import must exist and typecheck. Contracts and domain types freeze when you finish, so double-check them against §5–§7.
- Time-box ~25 min. If over, ship what typechecks and list gaps.

## Definition of done
Typecheck + build green; `/` renders the stub from mock data; `git init` done (don't commit unless asked).

## Final output
End with `## HANDOFF 1` (format in SYSTEM.md §13) including the exact signatures from `lib/domain/index.ts`.
