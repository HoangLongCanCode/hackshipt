# PLAN — RPG Birmingham

**One-liner:** A 3D, game-style map of Birmingham where local nonprofits post volunteer side quests; people complete them to meet each other, earn credits, and climb a leaderboard.

**Stack (initial):** no-build, plain ES modules + CesiumJS (CDN) + Google Photorealistic 3D Tiles. Serve with `python -m http.server 8000`. Backend/auth TBD in Step 2.

---

## Roles

- **Organizations (quest givers):** Birmingham Promise, Firehouse Ministries, Jones Valley Teaching Farm, Ed Farm.
- **Users (players):** sign up, pick quests, complete them, earn credits.

## Steps

Work step by step; don't start the next step until the previous one is signed off.

### Step 1 — 3D Birmingham map  (DONE: MapLibre vector Cyberpunk map)
- [x] Copy the FloodEye concept: Cesium + Google Photorealistic 3D Tiles.
- [x] Start camera over downtown Birmingham.
- [x] Free-fly controls (WASD/QE, mouse) and landmark fly-to buttons.
- [ ] Verify tiles load and performance is acceptable (user to confirm in browser).
- Done when: Birmingham renders in photorealistic 3D and you can fly around smoothly.

### Step 2 — Data model + quest pins
- Orgs, quests (title, description, org, location, time, credits, difficulty, capacity), users, completions.
- Quest pins on the map, color-coded per org; click for a quest card.
- Seed data: placeholder quests only, clearly labeled as such, until orgs confirm real ones.

### Step 3 — Accounts + quest flow
- Login / sign-up.
- Choose quest → sign up → show up → completion confirmed (org approval or check-in code) → credits awarded.

### Step 4 — Credits economy + leaderboard
- Leaderboard across all users.
- Spend credits on sponsored goods, or donate them.

### Step 5 — Profile + extensions (stretch)
- Profile with hobby/interest data; show people with shared interests.
- Group quests, streaks, badges.

## Cut list (if time is short)

Matching, badges, and the shop go first. Keep: map → quests → complete → credits → leaderboard.

## Risks & guardrails

| Risk | Mitigation |
|---|---|
| Unsafe locations | Org-hosted venues only, daytime slots, show org + address, group quests |
| Fake completions | Org-side confirmation or check-in code; no self-reporting alone |
| Fake users | Login required; org can approve/ban; (later) email/phone verification |
| Sensitive populations | App never screens or labels individuals; orgs decide who they serve |
| Privacy | Minimal profile data; interest matching opt-in |
| API key exposure | Restrict the Google key by HTTP referrer and to Map Tiles API; don't ship it to a public repo |
| Google Tiles attribution | Keep Google/Cesium credits visible |

## Open questions

- Which backend/auth (e.g., Supabase/Firebase vs. mock for demo)?
- Will the orgs give us real quest data, or do we demo with placeholders?
- Credit values and what sponsors we can realistically show.
- Verify the "8th most people living alone" stat and its source.

---
## Status (2026-11-14)
Steps 1-4 built as a demo (fake login, fake quests from the 4 orgs, quest flow, credits, leaderboard, store/donate, people matching, profile). Deployed to Vercel; waiting on the Supabase connection for persistent data. See CONTEXT.md and README.md.
