# RPG Birmingham

Volunteer **side quests** on a Cyberpunk-style 3D map of Birmingham, AL. Four partner organizations (Birmingham Promise, Firehouse Ministries, Jones Valley Teaching Farm, Ed Farm) post quests. Adventurers accept a quest, show up, check in, finish with the host's code, and earn **credits + XP**. Credits climb a leaderboard and can be spent at (fictional) local sponsors or donated to causes.

> Demo app. The organizations, quests, sponsors and other adventurers are **fictional**; the orgs have not endorsed this. Sign-in is email-only (no passwords) on purpose.

## Run locally

```bash
npm install
npm run dev          # http://localhost:8001  (static site + the same /api the cloud runs)
npm run smoke        # end-to-end API test of the demo path
```

With no database configured the API keeps data **in memory** (resets on restart). That's fine locally but **not** on Vercel (every serverless instance gets its own memory); production needs Supabase.

## Stack

- Front end: plain JS + [MapLibre GL](https://maplibre.org/) in `public/` (no build step). Map data: OpenStreetMap roads/buildings (`public/data/`) and the City of Birmingham's 99 official neighborhoods.
- API: Vercel serverless function `api/[...path].js` -> `lib/game.js` (rules) -> `lib/db.js` (Supabase or in-memory).
- Database: Supabase Postgres (`supabase/schema.sql`). All tables are prefixed `rpgb_`. Seed data (`lib/seed.js`) is inserted automatically on the first API request.

## Demo script (about 3 minutes)

1. Open the site -> **Quick demo: sign in as Alex** (40 starter credits).
2. Tap a hex pin (or the Quests tab) -> read the quest -> **Accept** -> **Check in** -> enter the host code (shown in demo mode) -> **Complete**: credits, XP, level-up, badges, class change.
3. Hover districts: outline + "N quests here / M done".
4. **Ranks**: leaderboard with fake adventurers. **People**: matches by shared interests. **Store**: redeem a reward code; **donate** credits to a cause. **Me**: badges, interests, activity.
5. Click the green **Shipt** landmark to fly to the HQ building.

## Deploy (Vercel + Supabase)

1. `npx vercel link` (done: project `rpg-birmingham`).
2. Add Supabase: accept the marketplace terms in the browser, then `npx vercel integration add supabase --no-claim`. (Or create a Supabase project yourself and add `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as Vercel env vars.)
3. `npx vercel env pull .env.local --yes && npm run db:schema` (creates the tables).
4. Set `SESSION_SECRET` (already set in production) and optionally `DEMO_MODE=false` to hide the host code hint.
5. `npx vercel deploy --prod`.

## Data credits

Map data (c) OpenStreetMap contributors (ODbL). Neighborhood boundaries: City of Birmingham GIS. Shipt logo via Wikimedia Commons.
