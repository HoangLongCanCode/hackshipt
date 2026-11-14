# Phase 2 — Backend: API, Domain Logic, Seed (1 agent, parallel with Phases 3 and 4, ~85 min)

---PROMPT START---

You are the **Backend agent** for RPG Birmingham, a 4-hour personal hackathon project. Two other agents (Frontend = Phase 3, 3D Map = Phase 4) work at the same time in the same folder. You own everything server-side and all data. Code fast; demo-path correctness beats completeness.

**Read `D:\Projects\hackshipt\docs\SYSTEM.md` completely first** (§5 schema, §6 rules, §7 API, §11 seed, §14 demo script), and `Claude.txt`.

## Context from previous phases
{{PHASE_1_HANDOFF}}

*(If still a literal placeholder, Phase 1 isn't merged: rely on SYSTEM.md and inspect the repo.)*

## Owned paths (edit only these)
`app/api/**`, `lib/server/**` (extend the Phase 1 files; don't rewrite their exports), `lib/domain/**` (replace the `TODO P2` bodies; signatures frozen: if one is truly wrong, keep it and add a new export), `prisma/seed.ts`, `tests/domain/**`, `docs/DEMO.md`. **Don't edit** `prisma/schema.prisma` or `lib/contracts.ts` (frozen) or anything under `app/(app)`, `components/`, `lib/client`, `lib/map`.

## Goal
A real, tested backend: pure game logic, every non-stretch route from §7 enforcing §6 inside transactions, and a rich idempotent Birmingham seed that makes the demo feel alive.

## Part A — Domain (do first, ~20 min)
Implement all functions in `lib/domain` as pure, deterministic code per §6: `levelFromXp / xpForLevel / levelProgress` (`level = 1 + floor(sqrt(xp/40))`), `deriveClass` (category→class map, tie → most recent, none → `wanderer`), `distanceMeters` (haversine), `computeReward` (§6 guideline, rounded to 5), `matchScore` + `matchReason` (human, specific: "Both into Animals & Gardening · Both on 'Dog Day at the Shelter'"), `badgesEarned`, `revealedDistricts`. Vitest tests in `tests/domain` with edge cases (xp 0/39/40/159/160, class ties, zero completions, Railroad Park ↔ Vulcan Park ≈ 3 km, self-exclusion, badge thresholds). `npm test` green.

## Part B — Seed (~20 min)
`prisma/seed.ts` via `npm run db:seed`, **idempotent** (wipe in FK order, recreate). Follow §11: 12 interests, 6 badges, 8 demo orgs (descriptions marked "(demo)"), chain "Restore Avondale Park" (3 steps, bonus 60), ~18 quests (distinct visible 4-digit codes like 1111, 2222…; ≥3 group quests with capacity ≥4; 2 quick wins <45 min; 2 easy seniors quests; coords inside the districts), 5 sponsors × 2 offers (20–120 credits), 4 causes with some `raisedCredits`, 12 NPC adventurers with varied interests/xp/classes and consistent Participations + Ledger entries, and the demo user `demo@rpgbirmingham.app` ("Alex the Wanderer", 40 credits, 0 xp, interests chosen so ≥3 NPCs match strongly). *Dog Day at the Shelter*: `animals`, capacity ≥4, ≥2 NPC teammates already on it, shares interests with the demo user. Generate all data yourself; don't claim real organizations endorse anything. Run the seed twice to prove idempotency; print row counts.

## Part C — API (~40 min)
1. `lib/server/mappers.ts`: `toQuestDTO` (participantCount excludes ABANDONED, spotsLeft, myStatus, chain order/total), `toQuestDetailDTO` (+party; `verifyCode` only for users in the quest's org), `toMeDTO` (levelProgress, stats, revealedDistricts, badges, interests), sponsor/cause/ledger mappers.
2. Auth: `POST /api/auth/login` (upsert by lowercased email, default displayName from the email local part, set cookie), `POST /api/auth/logout`, `GET/PATCH /api/me` (PATCH replaces interests by slug), `GET /api/interests`.
3. Quests: `GET /api/quests` (filters `category, q, neighborhood, maxMinutes, group=1, status`), `GET /api/quests/[id]`, and `accept | checkin | complete | abandon`, enforcing §6 and the error codes in §7 (`QUEST_FULL`, `CONFLICT`, `TOO_FAR` unless `DEMO_MODE=true`, `BAD_CODE`, `DAILY_CAP` unless demo). Re-accepting after ABANDONED reuses the row.
4. **Completion transaction** exactly as §6: ledger EARN, credits/xp, class via `deriveClass`, badges via `badgesEarned`, chain bonus on the final step, `levelUp` flag, return `CompleteResultDTO`.
5. Store/donate/ledger: `GET /api/store`, `POST /api/store/redeem` (code `RPGB-XXXXX`), `GET /api/causes`, `POST /api/donate`, `GET /api/ledger`; never negative balance (`INSUFFICIENT_CREDITS`); all balance changes in a `$transaction` with the ledger write.
6. `lib/server/__dev__/curl-notes.md`: a replayable curl happy path (login → accept → checkin → complete → redeem → donate) with expected shapes. Run it against `npm run dev` for real.

Skip `matches`, `chains`, `giver`, `leaderboard` (Phase 5).

## Docs
`docs/DEMO.md`: table of all quests (title, neighborhood, category, capacity, **verify code**), demo account, the §14 click path with which quest to use at each step, and reset instructions (`npm run db:reset`).

## Verify
`npm test`, `npm run typecheck` green; `npm run db:reset` OK; curl happy path works; bad code → `BAD_CODE`; overspend → `INSUFFICIENT_CREDITS`; finishing the last chain step grants the bonus.

## Final output
End with `## HANDOFF 2` (SYSTEM.md §13): routes with the status codes they can return, seed counts, the demo user's best matches, the "wow" quest, and any domain signature surprises.
