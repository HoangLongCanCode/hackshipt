# Phase 6 — Polish, QA & Pitch (1 agent, ~35 min)

---PROMPT START---

You are the **Finisher agent** for RPG Birmingham, a 4-hour personal hackathon project. The code freeze is at 3:50. Your order of work: **(1) make the demo unbreakable, (2) make it feel like a game, (3) write the words.** Judges decide in the first 10 seconds, so the map home screen and the completion moment matter most.

**Read `D:\Projects\hackshipt\docs\SYSTEM.md` completely first** (§8, §9, §14) and `Claude.txt`.

## Context from previous phases
### Phase 2: Backend (demo data, verify codes)
{{PHASE_2_HANDOFF}}
### Phase 3: Frontend
{{PHASE_3_HANDOFF}}
### Phase 4: 3D Map (theme knobs)
{{PHASE_4_HANDOFF}}
### Phase 5: Integration (commands, giver login, known issues)
{{PHASE_5_HANDOFF}}

*(Literal `{{...}}` = missing handoff; inspect that slice's code directly.)*

## Ownership
You may edit any file, but with discipline: bug fixes = smallest diff; polish = visual only (styling, animation, markup for presentation) with **no changes to props, data flow, API calls or DTOs/schema**. You own `app/globals.css`, `tailwind.config.ts`, `components/rpg/**`, `README.md`, `docs/PITCH.md`, and may update `docs/DEMO.md`. No new dependencies (CSS animations only; one `next/font` Google font is OK).

## Step 1: Harden (~12 min)
1. **Clean-room run:** delete `.next` and `dev.db`; `npm install`; `npm run db:reset`; `npm run typecheck`; `npm test`; `npm run build`; `npm start`; `npm run smoke`. Record the exact command sequence that works.
2. **Demo path ×2** after `db:reset` each time, at 390 px and 1440 px (§14 steps 1–6): fix dead buttons, stale HUD after mutations, sheet stuck states, console errors/hydration warnings, overflow, unreadable text.
3. **Failure injection:** wrong verify code (friendly message), overspend, accepting a full/already-accepted quest, double-clicking every mutation button (verify via ledger there are no double charges), logged-out `/profile` redirect, API down (error state, not a white screen), geolocation denied, WebGL context lost or unsupported (fallback message, not a blank page).
4. **Reset and fallback:** `npm run db:reset` restores pristine state in <10 s; mock mode (`NEXT_PUBLIC_USE_MOCKS=1`) completes the demo path as the offline fallback. Triage anything unfixable: hide its entry point and add it to a "presenter: don't click" list.

## Step 2: Polish (~13 min; cut from the bottom)
1. **3D map skin** via `lib/map/theme.ts`: moody fantasy palette (deep navy ground, teal water/park, warm window glow, soft fog/sky), beacon styling (bigger for high rewards, party ring on group quests, completed ones dim). Must hold 60 fps.
2. **HUD/shell:** animated XP arc on the level ring, credits pill with count-up on change, polished bottom nav (active glow, safe-area padding), consistent card/sheet/modal elevation and gradients.
3. **`components/rpg/RewardCelebration.tsx`:** drop-in replacement for the completion modal visuals (same props as the existing component; check it first): credits/xp count-up, XP bar fill, CSS confetti/sparkle, level-up banner, badge pop-in with glow.
4. **Onboarding:** 3-card intro on first login (localStorage-gated, try/catch): Explore → Take quests → Earn & give back, with the "your class evolves from the quests you complete" teaser.
5. **Micro-interactions:** skeleton shimmer, button press states, toast and sheet easing, `prefers-reduced-motion` respected, "District revealed!" toast moment if fog-of-war exists. Keep text contrast AA.

## Step 3: Words (~10 min)
1. **`README.md`:** one-screen quick start (prereqs, install, env, `db:reset`, `dev`, demo logins incl. giver), tech stack table, feature list (real vs seeded/simulated, honestly labeled), layout, screenshot placeholders.
2. **`docs/DEMO.md`:** keep Phase 2's quest table; add the exact 3-minute click-by-click script mapped to §14 (quest, verify code, what to say per beat), a 60-second cut, the reset procedure, the offline fallback switch, and the "don't click" list.
3. **`docs/PITCH.md`:** one-sentence pitch + 3 tagline options; problem → solution → why Birmingham → why now (modest claims, **no invented statistics or testimonials**); 8–10 slide outline (title, key message, visual, speaker line); business-model sketch labeled as a hypothesis (sponsors fund rewards, nonprofits post free); a "what's real vs simulated" slide; roadmap (3 steps); five likely judge questions (safety, fraud, sponsor incentive, cold start, scaling) with honest answers that acknowledge the demo's limits; 30-second elevator version. Verify every command and quest code you cite exists in `package.json` / the repo.
4. Honesty over hype: seeded orgs and NPC adventurers are demo data; say so. Use they/them for unnamed people.

## Rules
- Stop at the time-box even if bugs remain: a ranked list beats a half-fix.
- Any change touching contracts/schema is a blocker: report, don't do.
- Performance: animations via transform/opacity only; first load of `/` under ~3 s locally.

## Verify
Clean-room sequence green; demo path passes twice in real mode and once in mock mode; no `console.error` in a full run; reduced-motion disables large animations.

## Final output
End with `## HANDOFF 6`: bug table (found/fixed/deferred with severity), the verified clean-room command sequence, the fallback switch, "don't click" list, visual knobs a human can tweak, files written, anything you couldn't verify, and a 5-line presenter cheat-sheet.
