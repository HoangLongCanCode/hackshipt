# How to run the agents

One agent per phase. Phases 2, 3 and 4 run in parallel. Details in `docs/SYSTEM.md` §13.

| Clock | Launch | Prompt file |
|---|---|---|
| 0:00 | 1 agent | `phase-1-foundation.md` |
| 0:25 | **3 agents at once**, same folder | `phase-2-backend.md`, `phase-3-frontend.md`, `phase-4-map.md` |
| 1:50 | Checkpoint (you) | merge handoffs, `npm run typecheck`, `npm run db:reset`, `git commit` |
| 2:00 | 1 agent | `phase-5-integration.md` |
| 3:05 | Checkpoint (you) | run the demo script (SYSTEM.md §14) once end to end |
| 3:15 | 1 agent | `phase-6-polish-qa-pitch.md` |
| 3:50 | **Code freeze** | rehearse |

## Launching an agent
1. Open the prompt file and copy everything below `---PROMPT START---`.
2. Replace each `{{PHASE_X_HANDOFF}}` with the real `## HANDOFF` text the earlier agent produced. For Phase 4, also paste your current three.js code or file paths into `{{EXISTING_THREEJS_MAP}}`.
3. Start a new Claude Code session in `D:\Projects\hackshipt` and paste.

## Rules of thumb
- Agents share one folder; safety comes from **file ownership**, not branches. Never run two agents with overlapping owned paths.
- Phase 1 runs `git init`; commit at each checkpoint so a bad merge can be rolled back.
- If an agent reports `Contracts changed`, resolve it before launching the next phase.
- Cut scope instead of running over. Order of cuts: leaderboard → fog-of-war → chains → giver page → matching polish.
