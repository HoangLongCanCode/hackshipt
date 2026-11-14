# CONTEXT — running log

Newest entries at the bottom. Update after every meaningful change.

## Project summary

RPG Birmingham: 3D Birmingham map + volunteer side quests from 4 orgs (Birmingham Promise, Firehouse Ministries, Jones Valley Teaching Farm, Ed Farm). Credits → leaderboard → shop/donate. See [INSPO.md](INSPO.md) and [PLAN.md](PLAN.md).

## Key facts

- Working dir: `c:\Users\phucl\hackathon\shipt-hacks`
- Reference project: `C:\Users\phucl\hackathon\reserved` (FloodEye, UA campus).
- Run: `python -m http.server 8000` in this folder, open http://localhost:8000
- Google Map Tiles key lives in `config.js` (copied from the FloodEye config). Needs Map Tiles API enabled.

## Log

### 2026-11-14
- Located the earlier UA flood project (FloodEye) and ran it locally.
- Created INSPO.md, PLAN.md, CONTEXT.md from the team brainstorm.
- Step 1 started: built the Birmingham map (`index.html`, `main.js`, `config.js`) using FloodEye's approach — Cesium + Google Photorealistic 3D Tiles, free-fly camera, landmark fly-to buttons.
- Landmark coordinates are approximate and unverified against the map.
- Next: user confirms the map renders → Step 2 (data model + quest pins).

### 2026-11-14 (Step 1, iteration 2)
- User feedback: start from a coarse full-city map, split into 4 regions (one per org); click a region to zoom into the detailed view. Wants a lighter, simpler "GTA style" look because this may become a phone app.
- Implemented (index.html / main.js / config.js):
  - Overview camera over all of Birmingham with high tile `maximumScreenSpaceError` (64) for fast loading; region view drops it to 24.
  - 4 color-coded region overlays (draped on the tiles) with org labels; hover highlight, click -> fly into region, "All of Birmingham" button returns.
  - Perf: no atmosphere/sun/moon/skybox, MSAA off, FXAA off, resolutionScale 0.85, tile cache capped at 256 MB.
  - Style switcher (bottom bar): Photo / GTA / Noir. GTA = post-process shader (desaturate, posterize, contrast, warm-shadow/cool-light grade, vignette). Choice saved in localStorage.
- Region boundaries and org assignments are PLACEHOLDER quadrants split at (33.5186, -86.8104). Not yet verified in browser by me.
- Ideas if GTA look isn't enough: outline/edge-detect pass, flat-shaded building tint via 3D Tiles style, or swap to a vector/OSM-based stylized city (much lighter for phones).

### 2026-11-14 (revert quality)
- User: GTA/low-quality rendering looked too low quality. Restored original Step 1 quality: SSE 16, resolutionScale 1, MSAA 4, sky atmosphere on, no tile-cache cap, default style = Photo (style buttons kept as opt-in).
- Kept the overview -> 4 regions -> zoom flow.
- Answered: Google Photorealistic 3D Tiles are textured photogrammetry mesh chunks (LOD tiles), not per-building objects, so buildings can't be individually restyled. Per-building styling needs OSM building data (e.g. Cesium OSM Buildings) instead.

### 2026-11-14 (remove area blocks)
- User didn't like the colored district blocks. Removed region overlays, labels, borders, hover/click zoom and the "All of Birmingham" button (main.js, index.html, config.js regions).
- Map now just opens on a full-city view in Photo mode with free-fly controls; Photo/GTA/Noir buttons remain.
- Org territories are no longer on the map; revisit when designing quest pins (Step 2).

### 2026-11-14 (styles: GTA + Cyberpunk)
- Removed Photo and Noir. Styles now: GTA (kept as-is, full quality) and Cyberpunk (new, reference = Night City map: dark navy, cyan buildings, yellow glowing roads, neon edges, faint grid).
- Cyberpunk = depth-based post-process shader (reconstructs world pos -> surface normal + height above street level; heuristics: walls cyan, rooftops bright cyan, low gray flat surfaces yellow roads, depth-discontinuity outlines). Uses coarser tiles (cyberSSE 40) and 0.9 resolution scale for lower-poly buildings.
- Config: `groundHeight` (160 m ellipsoid, approx) drives the roof/road split; `quality` has gta + cyber values. Hills may read as cyan "rooftops" (heuristic); tune groundHeight / threshold 18 m if so.
- Not yet verified in browser by me; shader may need tweaks.
- Real "Night City" look (roads as glowing lines, extruded blocks) would need OSM vector data rather than a filter over photo tiles.

### 2026-11-14 (limit to Birmingham)
- Map restricted to Birmingham: `config.bounds` (W -86.92, S 33.43, E -86.70, N 33.62) clips tiles outside via `tileset.clippingPolygons` (inverse), camera is clamped to the bounds each tick, max zoom-out `maxAltitude` 26 km, overview range cut to 24 km.
- Clipping only hides geometry; fewer tiles load mainly because the camera can't look far away. Bounds are rough, not the exact city limits - adjust in config.js.
- Not verified in browser by me (ClippingPolygonCollection needs WebGL2).

### 2026-11-14 (direction change: vector Cyberpunk map)
- Playwright (python, system Chromium via swiftshader) works for screenshots: scratchpad/shot.py. Findings: the photo-filter Cyberpunk shader was broken (depth/world reconstruction wrong -> flat slab). Old attempt kept as prototype_filter.js (unused).
- User decision: drop photo tiles for Cyberpunk; build a vector map of **just roads + buildings** (OpenStreetMap) for lighter rendering, plus faint outline of the **official city neighborhoods** on hover.
- Neighborhoods: City of Birmingham ArcGIS `Neighborhood/MapServer/0` (99 official neighborhoods) -> data/neighborhoods.json; communities (23) -> data/communities.json.
- OSM roads/buildings fetched via Overpass in 3x3 tiles by scratchpad/fetch_osm.py -> data/roads.json, data/buildings.json (buildings <120 m2 dropped).
- Prototype tab (prototype.html + prototype.js) renders: dark ground, yellow roads, cyan extruded buildings + thin roof outlines, hover outline + district label, request-render mode. Main tab (index.html) untouched.
- Saved Cyberpunk references to INSPO.md (+ assets/inspo/ for the one image that exists as a file; the two in-game screenshots are described in text only).

### 2026-11-14 (MapLibre prototype working)
- Switched the Cyberpunk map to MapLibre GL (lighter than Cesium). Cesium vector attempt kept as prototype_cesium.js; photo-filter attempt as prototype_filter.js.
- Fetched a downtown-only OSM extract (3,360 roads / 3,408 buildings) so the prototype runs now; the full 3x3-tile download (scratchpad/fetch_osm.py) will overwrite data/roads.json + data/buildings.json when it finishes (Overpass is slow/502s).
- Verified via Playwright screenshot: dark ground, glowing yellow roads, cyan extruded blocks, hover outline + "CENTRAL CITY" label all work. Test URL: prototype.html?z=14.3&pitch=60&b=-20.
- Known gaps: most buildings use default 8 m (OSM heights sparse), no roof-edge lines yet (deck.gl wireframe would add them), no quests/fog-of-war yet.

### 2026-11-14 (street dimming, district highlight, Shipt landmark)
- Roads dimmed (low opacity, thinner, almost no glow); added always-on faint district borders + strong hover highlight (bright outline, glow, fill) since quests per area are the focus.
- Shipt HQ landmark in prototype: John A. Hand Building, 17 N 20th St (address from CB Insights/Patch 2018 reporting - verify it's still HQ). Footprint polygon from OSM via Nominatim -> data/shipt.json; plain OSM building under it is removed; drawn as glowing green extrusion (78 m, approximate) with floating bobbing logo badge + pulse ring; click flies to it. Logo: assets/shipt-logo.svg from Wikimedia Commons (File:Shipt logo.svg).
- Test URL centered on Shipt: prototype.html?z=16.6&pitch=60&b=-20&c=-86.8052,33.5144
- Full OSM download finished: 13,503 roads / 14,307 buildings.

### 2026-11-14 (old Map tab removed)
- User loved the MapLibre prototype and asked to delete the Map tab. Deleted the Cesium/Google-tiles page (old index.html + main.js). The MapLibre prototype is now the main app: index.html + app.js (tab bar removed). URL: http://localhost:8001/
- Removed the Google API key and Cesium token from config.js (no longer needed; the key still lives in C:\Users\phucl\hackathon\reserved\config.js).
- Leftover experiments (unused): prototype_cesium.js, prototype_filter.js. config.js still has a few unused Cesium-era settings (overview.range, maxAltitude, groundHeight).

### 2026-11-14 (full demo app built + deployed to Vercel; Supabase pending)
- Built the demo on top of the MapLibre map (map/UI kept as-is). SYSTEM.md followed loosely: kept plain JS + MapLibre (not Next/three.js/Prisma), used the 4 real org names instead of its 8 invented orgs, Supabase instead of SQLite.
- Features: email-only fake login (signed token), 16 fictional quests across the 4 orgs as hex pins on the map (org-colored, org filter chips), accept -> check in -> complete with host code (shown in demo mode), credits + XP + level + class + badges, leaderboard (12 fake NPCs), store (fictional sponsors) + donate to causes, "Adventurers like you" matching, profile (interests, badges, activity), district hover shows "N quests here / M done", Shipt landmark kept.
- Layout: static site in public/ (index.html, app.js map, game.js UI, ui.css, config.js, data/, assets/); API in api/[...path].js -> lib/game.js (rules) -> lib/db.js (Supabase or in-memory) + lib/seed.js; supabase/schema.sql; scripts/apply-schema.js; dev-server.js; tests/smoke.js (passes). Old experiments moved to archive/.
- Local: `npm run dev` -> http://localhost:8001 (in-memory data).
- Vercel: project `rpg-birmingham` under team `gambler7`; production https://rpg-birmingham.vercel.app ; SESSION_SECRET set. NOT fully working in production yet: without a DB each serverless instance has its own memory, so state is lost between requests (confirmed with a Playwright run).
- BLOCKED on Supabase: `vercel integration add supabase` needs the user to accept Supabase marketplace terms in the browser (https://vercel.com/gambler7/~/integrations/accept-terms/supabase?source=cli). Then: `npx vercel integration add supabase --no-claim --non-interactive`, `npx vercel env pull .env.local --yes`, `npm run db:schema`, `npx vercel deploy --prod`. The Supabase adapter in lib/db.js is untested against a real Supabase until then.

### 2026-11-14 (Supabase: reuse existing project, option B)
- User's Vercel->Supabase install failed ("already a member of an organization named Gambler"); chose to reuse an existing Supabase project instead (option B: run supabase/schema.sql in the SQL editor, add SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY as Vercel env vars, then redeploy).
- Because the existing project may have other tables, all app tables are now prefixed `rpgb_` (supabase/schema.sql, lib/db.js, scripts/apply-schema.js). Memory backend/smoke test unaffected (passes). Not yet deployed with this change.

### 2026-11-14 (GitHub -> Vercel)
- Pushed to https://github.com/lnguyen258/shipt-hacks (main) and connected it to the Vercel project `rpg-birmingham` (team gambler7) via `vercel git connect`: pushes to main now auto-deploy to production (https://rpg-birmingham.vercel.app), other branches get previews.
- public/assets/inspo (game screenshot references) is git-ignored so it isn't published.
- Still pending: database. Without SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in Vercel env vars the live API uses per-instance memory (state can vanish between requests).

### 2026-11-14 (Supabase connected)
- Free-plan limit (2 projects) blocked creating a new Supabase project, so reused the existing `meetly` project (ref eqtfwndvlsltlzcxnrzr, org Gambler, us-east-1) with additive-only `rpgb_*` tables (meetly's own 7 tables untouched). Nothing deleted or paused.
- Supabase CLI login (by user) lets me run `npx supabase db query --remote=<ref> --yes -f ...`; schema applied that way; API keys fetched via `supabase projects api-keys`.
- Vercel prod env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (sensitive), SESSION_SECRET. Also in git-ignored .env.local for local runs against real Supabase (`set -a; . ./.env.local; set +a; node tests/smoke.js`).
- tests/smoke.js passes against real Supabase (seeded automatically). Smoke rows cleaned up after.
- Note: meetly is a live app marked "production"; our tables are namespaced. To remove this app later: drop the 9 rpgb_* tables.

### 2026-11-14 (production verified)
- Correction: the earlier "production state lost between requests" diagnosis was wrong. The real bug was a Vercel 404 on multi-segment routes (/api/quests/:id/:action), since `api/[...path].js` only matched single-segment paths. Fixed with api/quests/[id]/[action].js + shared lib/http.js.
- Verified on https://rpg-birmingham.vercel.app (backend: supabase): login, accept, check-in, wrong code rejected, complete (+credits/xp/level/class), leaderboard, full Playwright flow. Test accounts removed afterwards; DB holds only the seeded 12 NPCs + 15 seeded sign-ups.
- Deploys happen automatically on push to main (GitHub lnguyen258/shipt-hacks -> Vercel project rpg-birmingham, team gambler7).
