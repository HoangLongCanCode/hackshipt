# Phase 4 — 3D Map in three.js (1 agent, parallel with Phases 2 and 3, ~85 min)

---PROMPT START---

You are the **3D Map agent** for RPG Birmingham, a 4-hour personal hackathon project. Two other agents (Backend = Phase 2, Frontend = Phase 3) work at the same time in the same folder. You own the 3D city scene, rendered with **three.js**. Code fast; a gorgeous, smooth map matters more than extra features.

**Read `D:\Projects\hackshipt\docs\SYSTEM.md` completely first**, especially §8 (map spec and the frozen `QuestMapProps` contract), §2, §9, and `Claude.txt`.

## Context from previous phases
{{PHASE_1_HANDOFF}}

*(If still a literal placeholder, Phase 1 isn't merged: rely on SYSTEM.md and inspect the repo.)*

## Existing three.js map (the team already renders Birmingham in three.js)
{{EXISTING_THREEJS_MAP}}

*(Paste the file paths and/or code of the current three.js render here. If this is still a literal placeholder, ask the user for it once; if they have none, build the generated-city version from SYSTEM.md §8. **Adapt, don't rewrite**: keep the existing look, geometry and data where they work, and wrap them in the §8 contract.)*

## Owned paths (edit only these)
`components/map/**`, `lib/map/**`, `app/dev/map/**`. You may replace the Phase 1 stub `components/map/QuestMap.tsx`, but its default export and props **must stay exactly as in §8** because the Frontend agent imports it right now. Only add the `three` / `@types/three` dependencies if Phase 1 didn't (and, if the existing code uses it, `@react-three/fiber` + `@react-three/drei`; then keep that approach). Don't touch API, pages (other than `/dev/map`), tokens, contracts.

## Goal
A fast, beautiful three.js 3D Birmingham: instanced buildings, a quest beacon per quest, orbit camera with fly-to on selection, optional district fog-of-war. Works standalone in `/dev/map` with mock data, then drops into the home page unchanged.

## Tasks
1. **Projection** `lib/map/projection.ts`: `project(lat,lng) → {x,z}` meters around `BIRMINGHAM.center` (x east, z south, y up) and `unproject`. Add a tiny unit sanity check in a comment or dev log (Railroad Park ↔ Vulcan Park ≈ 3 km).
2. **City data** `lib/map/cityData.ts`: if there's no existing data, generate it deterministically (seeded RNG) per `DISTRICTS`: Downtown tall/dense, Five Points/Southside medium, Avondale/Woodlawn/Ensley low/sparse; a ground plane, simple road grid or district tint, a green strip for Railroad Park, a few landmark shapes (Vulcan Park statue, Sloss stacks). If existing data/footprints exist, load those instead. Render buildings with `InstancedMesh` (≈2–3k instances, per-instance color/height variation, warm "window glow" emissive tint).
3. **`QuestMap`** (client component, `dynamic` import friendly, SSR-safe): create renderer/scene/camera once; `OrbitControls` with damping, polar angle clamped above ground, distance ~150–3500 m, pan limited to city bounds; initial view ~1400 m away, ~55° tilt, −25° bearing; soft sky/fog, hemisphere + directional light, shadows only if cheap.
4. **Quest beacons:** per quest a 3D pin/beacon (cone or cylinder + category-colored glow + emoji billboard from a canvas texture), colored by `CATEGORY_META`, sized by `rewardCredits`, group quests get an extra ring. Diff by quest id when the `quests` prop changes (add/remove/update without rebuilding the scene). Raycast click → `onSelect(id)`; click empty → `onSelect(null)`; pointer cursor on hover.
5. **Selection:** when `selectedId` changes, tween (ease in-out, ~1.2 s) the controls target to the quest and the camera closer (~280 m); pulsing ring + light beam on the selected beacon; deselect eases back out. Also handle `selectedId` set from outside (carousel tap) identically to a click.
6. **Extras (in order, cut from the bottom):** `userLocation` blue marker · `sponsors` small shop markers · fog-of-war (dark translucent discs with "???" over unrevealed `DISTRICTS`, fade out when `revealedDistricts` gains a name) · subtle idle camera drift.
7. **`/dev/map` page:** full-screen `QuestMap` with `lib/mock/data.ts`, a floating panel showing the selection, and toggles for sponsors/fog/reveal-random-district. This is your test harness.
8. **Expose theme knobs** in `lib/map/theme.ts` (sky/ground/building/glow colors, fog distance, beacon scale) so Phase 6 can restyle without touching logic.
9. **Robustness/perf:** React strict-mode double-mount must leave exactly one canvas; on unmount cancel `requestAnimationFrame`, dispose geometries/materials/textures/renderer, remove listeners; `ResizeObserver` on the container; `setPixelRatio(min(dpr,2))`; works with empty/changing `quests`; touch gestures work (one-finger orbit, two-finger pan/zoom); 60 fps with ~40 beacons.

## Rules
- Props contract is frozen. If you need a new field on a DTO, derive it or report it.
- Prefer plain three.js. Don't add heavy libs (no deck.gl, no map tile libs, no physics).
- Generated data only; no network calls required at runtime.

## Verify
`npm run typecheck` green. In `/dev/map` at mobile and desktop widths: city renders in 3D, beacons are colored correctly, click and carousel-driven selection fly in smoothly, deselect works, no console errors, no memory growth after navigating away and back, 60 fps orbit.

## Final output
End with `## HANDOFF 4` (SYSTEM.md §13): list files, the theme knobs, how the existing three.js code was adapted (or what was generated), and known quirks for the integrator.
