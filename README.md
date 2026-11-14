# RPG Birmingham

Volunteer **side quests** on a Cyberpunk-style 3D map of Birmingham, AL. Four partner organizations (Birmingham Promise, Firehouse Ministries, Jones Valley Teaching Farm, Ed Farm) post quests. Adventurers accept a quest, show up, check in, finish with the host's code, and earn **credits + XP**. Credits can be spent at (fictional) local sponsors or donated to causes, and the app matches you with adventurers who like the same things.

> Demo app. The organizations, quests, sponsors and other adventurers are **fictional**; the orgs have not endorsed this. Sign-in is email-only (no passwords) on purpose.

## Run locally

```bash
npm install
npm run dev          # http://localhost:8001
npm run typecheck
npm run build
npm run smoke        # end-to-end API test of the whole demo path
```

With no database configured the API keeps data **in memory** (resets on restart). That is fine locally, but **not** on Vercel (every serverless instance gets its own memory), so a deployed site needs Supabase.

Demo logins: `demo@rpgbirmingham.app` (the player) and `giver@rpgbirmingham.app` (can post quests). Full click-by-click script and every quest code: [docs/DEMO.md](docs/DEMO.md).

Run the smoke test against a running server or a deployed URL: `SMOKE_BASE_URL=https://... npm run smoke`.

## Stack

| Layer | What |
|---|---|
| UI | Next.js 14 (App Router), React 18, Tailwind, SWR; the "cozy" design kit in `components/ui`, `shell`, `quest`, `social` ([docs/DESIGN.md](docs/DESIGN.md)) |
| Map | MapLibre GL, OpenStreetMap roads and buildings (`public/data`), City of Birmingham neighborhoods, Shipt HQ landmark (`components/map/QuestMap.tsx`) |
| API | One catch-all route, `app/api/[...path]/route.ts` -> `lib/game.js` (rules) -> `lib/db.js` (Supabase or in-memory) + `lib/seed.js` |
| Client data layer | `lib/client/api.ts` adapts the small "bootstrap + actions" API to the DTOs in `lib/contracts.ts` |
| Database | Supabase Postgres, tables prefixed `rpgb_` (`supabase/schema.sql`) |
| Auth | Email-only, signed bearer token in `localStorage` |

More detail, including what differs from the original plan: [docs/SYSTEM.md](docs/SYSTEM.md) (see the "Shipped stack" note at the top).

## Features

- Map of quest pins by category, filter chips, fly-to on select, quest sheet with party and shared-interest callouts.
- Accept -> check in -> complete with the host's code; credits, XP, levels, classes, badges.
- Campaigns (multi-step quest chains with a bonus), quest-giver page that posts new quests live.
- People: matches by shared interests, favorite artist and hobby.
- Store (redeem codes), donate to causes, leaderboard, profile and activity.

Seeded or simulated (honestly): all organizations' quests, host codes, sponsors, other adventurers, check-in location. Not built: real payments, passwords, photos of the sites, fog-of-war.

## Deploy (Vercel + Supabase)

1. Link the Vercel project (`npx vercel link`) and give it `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET` for **Production and Preview** environments. Optionally `DEMO_MODE=false` to hide the host code hint.
2. Apply the schema: `npx vercel env pull .env.local --yes && npm run db:schema` (or paste `supabase/schema.sql` into the Supabase SQL editor). It is safe to re-run; it also adds the favorite artist and hobby columns used by taste matching. Until it runs, those two fields silently do not save.
3. Seed rows are inserted on the first API request. Newer seed quests (like the campaign) are added to an already-seeded database automatically.
4. `npx vercel deploy` for a preview, `--prod` for production. Then `SMOKE_BASE_URL=<url> npm run smoke` (the "post a quest" check is skipped against a real database unless `SMOKE_GIVER=1`).

## Data credits

Map data (c) OpenStreetMap contributors (ODbL). Neighborhood boundaries: City of Birmingham GIS. Shipt logo via Wikimedia Commons.
