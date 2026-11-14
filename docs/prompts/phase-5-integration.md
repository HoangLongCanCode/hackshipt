# Phase 5 — Integrate the real stack + Social, Chains, Giver (1 agent, ~65 min)

---PROMPT START---

You are the **Integration agent** for RPG Birmingham, a 4-hour personal hackathon project. Three parallel agents (Backend, Frontend, 3D Map) just finished. You make the real stack work end to end, then add the "connection" features that sell the idea. Code fast; demo path first.

**Read `D:\Projects\hackshipt\docs\SYSTEM.md` completely first** (§6, §7, §10, §14), `Claude.txt`, and all handoffs below.

## Context from previous phases
### Phase 1: Foundation
{{PHASE_1_HANDOFF}}
### Phase 2: Backend (API, domain, seed)
{{PHASE_2_HANDOFF}}
### Phase 3: Frontend
{{PHASE_3_HANDOFF}}
### Phase 4: 3D Map (three.js)
{{PHASE_4_HANDOFF}}

*(Any literal `{{...}}` placeholder = that handoff is missing; inspect that slice's code directly and treat it as suspect.)*

## Ownership
Smallest-possible edits anywhere to fix integration drift (prefer fixing the consumer over the producer; never rename files). You additionally own: `app/api/{matches,chains,giver,leaderboard}/**`, `app/(app)/{people,giver}/**`, `components/social/**`, `tests/smoke.ts`. Visual styling overhauls are Phase 6's job. List every out-of-lane edit in your handoff.

## Part A: Integrate (~30 min, do first, then commit-ready)
1. `npm install`, `npm run db:reset`, `npm run typecheck`, `npm test`. Fix anything red.
2. Set `NEXT_PUBLIC_USE_MOCKS=0` in `.env` and `.env.example`; `npm run dev`.
3. Walk the demo path (§14 steps 1–5) in a real browser at 390 px, no mocks: login → 3D map with real quests → filter → select (map ↔ sheet in sync) → accept → check in → complete (code from `docs/DEMO.md`) → completion modal → profile (class, badge, level) → people → store redeem → donate. Log and fix every failure.
4. Typical drift to hunt: DTO shape mismatches between `lib/mock` and real mappers, envelope unwrapping, cookie/session on route handlers, SWR cache invalidation after mutations (HUD credits, quest list, profile must all refresh), `myStatus` updates, `revealedDistricts` reaching the 3D map, SSR/hydration warnings around the three.js canvas, env vars on the client.
5. `tests/smoke.ts` (`npm run smoke`): Node script against the running server: login → accept → checkin → complete → redeem → donate, asserting statuses, envelope and balances; re-runnable after `db:reset`.
6. Keep mock mode working as an offline demo fallback; verify the demo path in both modes. Finish with `npm run build && npm start` + smoke.

## Part B: Extend (~35 min; cut from the bottom)
1. **`GET /api/matches`** using `matchScore`/`matchReason` over all users sharing ≥1 interest or quest (exclude self), top 10 `MatchDTO`. **People page** (`/people`): "Adventurers like you" cards (avatar, class, level, shared-interest chips, reason line, "Quests you could team up on" row) and a "Wave 👋" button that only toasts (comment that nothing persists). No chat.
2. **Party view:** `components/social/PartyStrip.tsx` ("3 of 6 spots filled", teammates' levels) and `TeamUpBanner.tsx`; a minimal edit to `components/quest/QuestSheet.tsx` to render them (list it).
3. **`GET /api/chains`** with the caller's per-step `done`; `components/social/ChainProgress.tsx`; a "Campaigns" row at the top of `/quests` (minimal edit).
4. **Quest Giver:** `POST /api/giver/quests`: for the demo, if the logged-in email is `giver@rpgbirmingham.app` attach them to the first org on first call; validate with `NewQuestInput`, reward via `computeReward`, random 4-digit `verifyCode`, return `QuestDetailDTO` including the code (never to non-givers). `/giver` page: compact form (district dropdown for location), success card with the code in huge type + "View on map", and a list of "my org's quests" with codes. New quest must appear on the 3D map without a full reload (SWR `mutate`).
5. **(Stretch)** `GET /api/leaderboard?scope=neighborhood` and a small card on `/people`.

## Rules
- Contract changes only if unavoidable: update `contracts.ts`, `lib/mock`, `lib/client/api.ts`, route and mapper together and flag it loudly.
- Respect the envelope/zod/`handle()` patterns; never leak verify codes to non-givers.
- No new deps; mock mode must keep working for pages you touch.

## Verify
`npm run typecheck`, `npm test`, `npm run build`, `npm run smoke` green; demo steps 1–5 pass in real and mock mode; `/people` shows ≥3 sensible matches for the demo user; `/giver` creates a quest that appears on the map; completing a chain step advances progress.

## Final output
End with `## HANDOFF 5`: bugs found/fixed table, endpoints + sample responses added, giver login instructions, remaining known issues ranked by demo risk, and the exact commands to reproduce the green state.
