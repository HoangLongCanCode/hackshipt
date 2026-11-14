# RPG Birmingham: Demo Guide

All data is generated for the demo. The four organizations are real names used as fictional listings (they have not endorsed this), and the other adventurers are fake.

## Demo accounts (email only, no password)
| Email | Who | Notes |
|---|---|---|
| `demo@rpgbirmingham.app` | "Alex the Wanderer" | 40 credits, level 1. Pre-filled with interests Gardening, Food, Community and taste Alabama Shakes / Hiking, so matching has something to show. |
| `giver@rpgbirmingham.app` | Quest giver for **Birmingham Promise** | Can use `/giver` (Profile -> Quest giver). Everyone else gets "Quest givers only". |

The login page's default values sign you in as Alex. Any other email creates a new adventurer.

## Run it
```bash
npm install
npm run dev     # http://localhost:8001
npm run smoke   # API-level check of the whole demo path
```
No database env vars = data lives **in memory** and resets when the server restarts. That is the offline/fallback mode and the safest option for a live demo on one laptop. A deployed Vercel site needs Supabase (see README), because every serverless instance has its own memory.

To reset the demo on a laptop: stop and restart `npm run dev`. To reset the hosted demo: delete the `rpgb_*` rows of the user you created (there is no reset button).

## Quests and verify codes
Codes are shown in the app once you are checked in (bottom-right "Demo code" card, and the Demo mode hint). `DEMO_MODE=false` hides them.

| Quest | Org | Category | Spots | Min | Code |
|---|---|---|---|---|---|
| Homework Help Hour | Birmingham Promise | education | 4 | 60 | 1111 |
| Résumé Rally | Birmingham Promise | education | 3 | 90 | 1212 |
| Campus Tour Guide Squad | Birmingham Promise | education | 5 | 45 | 1313 |
| Scholarship Night Setup | Birmingham Promise | community | 6 | 120 | 1414 |
| **Serve a Hot Meal** (wow quest, 3 NPCs already on it) | Firehouse Ministries | food | 5 | 90 | **2121** |
| Sort the Clothing Closet | Firehouse Ministries | community | 4 | 60 | 2222 |
| Pack Hygiene Kits | Firehouse Ministries | community | 6 | 45 | 2323 |
| Share a Meal, Share a Story | Firehouse Ministries | food | 8 | 60 | 2424 |
| Downtown Farm Workday | Jones Valley Teaching Farm | environment | 8 | 120 | 3131 |
| Harvest & Wash | Jones Valley Teaching Farm | environment | 6 | 60 | 3232 |
| Seed Starting Station (quick win) | Jones Valley Teaching Farm | environment | 4 | 30 | 3333 |
| Farm-to-Classroom Helper | Jones Valley Teaching Farm | education | 3 | 90 | 3434 |
| Clear the Beds (campaign 1/3) | Jones Valley Teaching Farm | environment | 4 | 60 | 5151 |
| Plant the Rows (campaign 2/3) | Jones Valley Teaching Farm | environment | 4 | 60 | 5252 |
| Paint the Garden Gate (campaign 3/3) | Jones Valley Teaching Farm | arts | 4 | 60 | 5353 |
| Device Refurb Day | Ed Farm | education | 6 | 120 | 4141 |
| Teach a Neighbor Smartphones | Ed Farm | seniors | 3 | 75 | 4242 |
| Code Club Mentor | Ed Farm | education | 4 | 90 | 4343 |
| Digital Skills Open Lab | Ed Farm | education | 4 | 60 | 4444 |

You can only hold one active quest at a time (accept -> check in -> complete, or abandon).

## Click path (SYSTEM.md section 14)
1. Open the app -> **Begin your adventure** (as Alex) -> map with hex quest pins, HUD shows level 1 and 40 credits.
2. Filter **Food**, tap **Serve a Hot Meal** -> the camera flies in. The sheet shows the reward, the party (Ellie, June, Rosa) and "You have things in common": Rosa shares your hobby (Hiking).
3. **Accept** (opens directions) -> **Check in** (any location in demo mode) -> enter `2121` -> **Complete**: credits and XP count up, level 2, badges *First Steps* and *Team Player*, class Wanderer -> Keeper.
4. **People** -> "Adventurers like you": Maya (Alabama Shakes + Hiking + shared interests) tops the list, each with reasons and "Quests you could team up on".
5. **Store** -> redeem *Free drip coffee* (20 credits) -> code `RPGB-XXXXX`. **Donate** (Profile -> Donate, or `/donate`) -> give 10 credits -> the cause bar moves, *Patron* badge.
6. (Stretch) **Campaign:** Quests tab -> "Revive the Teaching Garden" card. Finish *Clear the Beds* (5151), *Plant the Rows* (5252), *Paint the Garden Gate* (5353) -> +60 credit bonus on the last step and the *Chain Breaker* badge.
7. (Stretch) **Quest giver:** log in as `giver@rpgbirmingham.app` -> Profile -> Quest giver -> fill the form -> **Post quest**. You get a 4-digit code, and the new pin shows on the map immediately for everyone.

Quests tab -> **My activities** lists what you have signed up for and completed.

## Notes on what is real
- Real: the map data (OpenStreetMap roads and buildings, City of Birmingham neighborhoods), the rules engine, persistence (when Supabase is configured).
- Simulated: organizations' quests, the host verify codes, sponsors and offers, the other adventurers, check-in location (GPS is not checked).
- Not built: building photos (quest sheets show a banner plus Street View and Google Maps links), district fog-of-war (every district counts as discovered), a three.js map (the map is MapLibre).

## Taste matching
Favorite artist and hobby live on the Profile page (and the login form). Teammates on the same quest, and the People page, call out shared artists and hobbies.
