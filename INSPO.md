# INSPO — RPG Birmingham

Reference material and the ideas we're borrowing from. Keep this short; add links as we find them.

## The problem (our story in 30 seconds)

- Birmingham, AL is reportedly among the cities with the highest share of people living alone (team claim: ~8th in the US — **verify the source and exact figure before putting it on a slide**).
- Living alone + few reasons to leave the house = isolation. Meanwhile local nonprofits need volunteers and struggle to get them.
- **Idea:** turn volunteering into a game. Nonprofits post *side quests*; people pick one up, show up, meet other people, earn credits, climb a leaderboard.

## Core loop

**Browse the map → Pick a quest → Show up → Finish → Earn credits → Spend or donate.**

## Partner organizations (quest givers)

| Org | What they do (our understanding — confirm with each) | Quest ideas |
|---|---|---|
| Birmingham Promise | Education / career pathways for Birmingham students | Mentoring hour, résumé workshop helper, campus-tour guide |
| Firehouse Ministries | Services for people experiencing homelessness | Meal service shift, supply drive sorting, clothing closet |
| Jones Valley Teaching Farm | Urban farms + food/education programs | Garden workday, harvest, farm-to-classroom helper |
| Ed Farm | Education + technology / digital skills | Device refurb, tech-tutoring session, event support |

> Quests below are *brainstorm placeholders*, not commitments from the orgs.

## Visual / technical inspiration

- **FloodEye** (`C:\Users\phucl\hackathon\reserved`) — our own earlier project: CesiumJS + Google Photorealistic 3D Tiles, no build step, WASD free-fly camera, real-city look that makes judges say "wait, what?". We're copying this concept for Birmingham.
- **Pokémon GO / Ingress** — real-world map as the game board; points of interest as destinations.
- **RPG quest boards** — quest cards with giver, reward, difficulty, time estimate.
- **Duolingo / Strava leaderboards** — lightweight social competition, streaks.
- **Habitica** — turning real-life tasks into RPG progress.

## Design direction

- Photorealistic 3D city as the "world map"; quests appear as glowing pins on it.
- Each org gets a color/icon so quest givers are recognizable at a glance.
- RPG flavor in copy (quests, guilds = orgs, XP/credits) without being childish — this is about real people and real need.

## Open risks (from brainstorm)

- **Safety:** quests in dangerous/sketchy areas → prefer org-hosted sites, daytime shifts, group quests.
- **Validating people:** how do we know a volunteer is real / actually showed up? → org confirms completion (check-in code or org-side approval).
- **Validity of recipients** (e.g., homelessness-related quests): the org, not the app, decides who they serve; we never ask users to judge or screen individuals.

## Extensions

- Match people with the same interests (profile/hobby data).
- Sponsored rewards: spend credits on goods from local businesses, or donate credits.

---

## Cyberpunk 2077 map references (added 2026-11-14)

Target look for the vector map (roads + buildings only). Three references from the user:

1. **Night City overview** — saved as [assets/inspo/cyberpunk-night-city-overview.png](assets/inspo/cyberpunk-night-city-overview.png)
   - Dark navy ground with a faint wireframe grid; low-poly extruded **cyan** buildings; **yellow glowing roads**; big **yellow label tags** (white text on yellow) with thin leader lines; small red numbered pins + a numbered district list in a yellow side panel.
2. **In-game map, red variant** (Heywood / Vista del Rey; screenshot pasted in chat, not saved as a file)
   - Buildings are **translucent red blocks** with soft glow, on a near-black ground; roads are **thin teal/cyan lines** that bend around the blocks; lots of hex-shaped icons (quest markers: yellow "!" circles = main/side jobs, "?" = undiscovered, blue pins = fast travel).
   - UI: left **FILTER** list (None / Fast Travel / Undiscovered / Side Job / Main Job ...), top bar (level, street cred, tabs), tracked-quest box top-right, bottom-right shows **time + current district name**, bottom controls hint (Move / Zoom / Legend / Close).
3. **In-game map, zoomed with quest tooltip** (Santo Domingo / Arroyo; screenshot pasted in chat, not saved as a file)
   - Same red-block + teal-road style, more detail. Selecting a marker opens a **dark tooltip card**: small caps ID line, quest title, then action rows with icons (TRACK JOB / JOURNAL / ZOOM IN). A **white route line** shows the tracked path.

### What to borrow for RPG Birmingham
- **Style:** flat dark ground, simple extruded buildings (translucent glow, thin edge lines), thin glowing roads. Detail low, lines fine. Colors are tunable per theme (cyan/yellow night-city vs red/teal in-game map).
- **District hover:** outline + name label of the area under the cursor; current district shown bottom-right/left like the game.
- **Quest markers:** hex/circle icons on the map. Color/shape per partner org; "!" for available quest, "?" for undiscovered; click opens a tooltip card (quest title, org, reward, Accept / Details / Zoom in).
- **Side panel filter:** filter quests by org/type (like FILTER: Side Job, Main Job...).
- **Route line:** white line to the tracked quest location.
- **HUD:** credits (the "eddies"), level/rank, tracked quest box top-right.
