# Phase 7: Supabase database + Vercel deploy (1 agent, ~20 min)

**When to run:** after Phase 5 is green (the app works locally on SQLite) and before Phase 6, so Phase 6 can QA the live URL. It can also run any time after Phase 2.

---PROMPT START---

You are the **Deploy agent** for RPG Birmingham, a 4-hour personal hackathon project. The app works locally on Next.js route handlers + Prisma + SQLite. Your job: **move the data to Supabase Postgres and deploy the app to Vercel**, changing as little as possible. Move fast, don't redesign anything.

**Read `D:\Projects\hackshipt\docs\SYSTEM.md` first** (§3 stack, §5 schema, §6 rules, §12 scripts) and the handoffs below.

## Context from previous phases
### Phase 2: Backend
{{PHASE_2_HANDOFF}}
### Phase 5: Integration
{{PHASE_5_HANDOFF}}

*(Literal `{{...}}` = missing handoff; inspect the repo directly.)*

## Decisions already made (don't revisit)
- **Keep** Prisma, the Next.js route handlers, the API contract (§7), and the email-only cookie login. **Do not** introduce Supabase Auth, `supabase-js`, PostgREST/RLS-based access, or Edge Functions. Supabase is used purely as hosted **Postgres**.
- The browser never talks to Supabase. Only the server (Vercel functions) connects, through Prisma.

## Rules about secrets and outward actions
- **Never** put database passwords or connection strings in chat, commits, docs or logs. The user places them in `.env` (local, git-ignored) and in Vercel's environment settings.
- If a Supabase project doesn't exist yet, **ask the user** to create one (or to confirm you may create one if the Supabase tooling is available, since that can cost money). Don't create paid resources unasked.
- **Ask for explicit confirmation before** `vercel --prod` / the first production deploy and before running anything that wipes the Supabase database (`db:reset`, seed). Pushing to git is also only on the user's say-so.

## Tasks

### A. Prisma → Postgres (Supabase)
1. `prisma/schema.prisma`: change **only** the datasource: `provider = "postgresql"`, `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`. Add `binaryTargets = ["native", "rhel-openssl-3.0.x"]` to the generator for Vercel. (This is the one allowed edit to the otherwise frozen schema; confirm all models/fields work on Postgres and nothing else needs changing.)
2. `.env.example` (committed, no real values) and `.env` (local, ignored):
   ```
   # Supabase → Project Settings → Database → Connection string
   DATABASE_URL="postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"   # pooled (transaction mode), used by the app on Vercel
   DIRECT_URL="postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres"                                    # session/direct, used for db push + seed
   SESSION_SECRET="<long random string>"
   DEMO_MODE="true"
   NEXT_PUBLIC_USE_MOCKS="0"
   ```
   Tell the user exactly where to copy each value from, then **wait** for them to fill `.env`. Remove the old SQLite `dev.db` references from scripts/docs.
3. Scripts: `postinstall: prisma generate`; `build: prisma generate && next build`; keep `db:push` (`prisma db push`) and `db:seed`. Make `db:reset` refuse to run unless `CONFIRM_RESET=1` is set (it now wipes a hosted database) and print which host it targets (host only, never the password).
4. Run `npx prisma db push` against Supabase (uses `DIRECT_URL`), then `npm run db:seed`. Fix any Postgres-only issues in the seed (FK delete order, sequential vs parallel inserts, Prisma `$transaction` limits). Confirm row counts match the SQLite run.
5. **Lock down the tables.** Supabase exposes the `public` schema through its REST API. Since Prisma-created tables start with RLS off, run once (SQL editor or `psql` on `DIRECT_URL`) `ALTER TABLE "<each table>" ENABLE ROW LEVEL SECURITY;` for every table, with **no policies**. Prisma connects as the table owner, so the app keeps working while the public anon key gets nothing. Save the statements to `prisma/enable-rls.sql` (no secrets) so it can be re-run after schema changes, and verify the app still reads/writes.

### B. Make the app Vercel-safe
1. Add `export const dynamic = 'force-dynamic'` to **every** route handler under `app/api/**` (otherwise GETs without cookies may be statically cached at build time, which would freeze the quest list).
2. `lib/server/db.ts`: keep the hot-reload-safe Prisma singleton (important for serverless connection counts). Confirm the pooled URL (`pgbouncer=true`) is what the app uses and `DIRECT_URL` is never used at runtime.
3. Session cookie: `secure: true` and `sameSite: 'lax'` in production, `httpOnly: true`; `SESSION_SECRET` required at runtime (fail loudly if missing).
4. Keep `DEMO_MODE=true` for the demo (GPS check skipped, no daily cap). Confirm nothing reads local files (SQLite, `public/data` written at runtime, etc.). The three.js map must have no runtime network dependencies other than static assets.
5. `vercel.json` (only if needed): set the function region to the one closest to the Supabase region (e.g., `iad1` for `us-east`), and `maxDuration` 10 s. No other config.
6. `npm run typecheck && npm run build` locally against Supabase must pass; run `npm run dev` and walk the demo path once on the Supabase-backed local app.

### C. Deploy to Vercel
1. Check for the Vercel CLI (`npx vercel --version`); if not logged in or not linked, ask the user to run `vercel login` and `vercel link` (or to import the GitHub repo in the Vercel dashboard, which gives auto-deploys on push, and is the easiest path: Framework preset Next.js, root `/`, default build command).
2. Set environment variables in Vercel for **Production and Preview**: `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET` (a fresh value, not the local one), `DEMO_MODE`, `NEXT_PUBLIC_USE_MOCKS=0`. The user sets secret values in the dashboard (or via `vercel env add`, which prompts interactively); never echo them.
3. After the user confirms, deploy (push to `main` if the repo is connected, else `vercel --prod`). Capture the production URL.
4. Make `tests/smoke.ts` accept `SMOKE_BASE_URL` (default `http://localhost:3000`), then run `SMOKE_BASE_URL=<prod url> npm run smoke` and walk the demo path (SYSTEM.md §14) in a real browser at 390 px on the **live URL**: login, 3D map loads, quests appear, accept → check in → complete with the code from `docs/DEMO.md`, store, donate. Check the Vercel function logs for errors (`vercel logs <url>` if the CLI is available).
5. Common failure checklist: `prepared statement already exists` / too many connections (missing `pgbouncer=true&connection_limit=1`), `P1001` can't reach DB (wrong pooler host/port, or project paused on the free tier), stale Prisma client (missing `postinstall`), 500 on login (missing `SESSION_SECRET`), empty quest list that never updates (missing `force-dynamic`), cookie not sticking (secure cookie over http in local).

### D. Docs
Update `docs/SYSTEM.md` §3 (DB row → Supabase Postgres via Prisma; Vercel as host), the env block, and §12 scripts; update `README.md` and `docs/DEMO.md` with: how to set up `.env`, how to reset the **demo** data safely (`CONFIRM_RESET=1 npm run db:reset`), the live URL, and a warning that the offline fallback (`NEXT_PUBLIC_USE_MOCKS=1`) still works if the network or DB fails on stage. Don't put any secrets or the database host in docs.

## Rules
- Smallest possible diffs; no refactors; no new dependencies except if strictly required (list any).
- Don't change DTOs, API behavior, or UI.
- If something in the demo path breaks only on Vercel, fix the root cause (don't hide it by switching to mocks).

## Verify
`npm run typecheck`, `npm run build` green; Supabase tables exist with RLS enabled and seeded rows; live URL passes `npm run smoke` and the demo path in a browser; two consecutive full demo runs after a reset behave the same.

## Final output
End with `## HANDOFF 7` (SYSTEM.md §13 format): live URL, env vars set (names only), the exact reset command, RLS status, any Postgres-specific fixes made, and issues left. Never include secrets.
