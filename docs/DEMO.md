# RPG Birmingham: Demo Guide

All data is generated for the demo. Orgs are marked "(demo)" and nothing here is endorsed by real organizations.

## Demo account
`demo@rpgbirmingham.app` · "Alex the Wanderer" · level 1 · 0 XP · 40 credits · interests: Animals, Gardening, Parks.

Best matches (via `matchScore`): Maya, Jordan (3 shared interests each), Rosa, Ava, Sam.

## Reset
```bash
npm run db:reset    # force-push schema + reseed (idempotent)
npm run db:seed     # reseed only
```
`.env` needs `DEMO_MODE="true"` (check-in ignores GPS, no daily cap) and `NEXT_PUBLIC_USE_MOCKS="0"` to hit the real API.

## Quests and verify codes

| # | Title | Neighborhood | Category | Cap | Min | Code |
|---|---|---|---|---|---|---|
| 1 | **Dog Day at the Shelter** (wow quest) | Five Points South | animals | 6 | 90 | **1111** |
| 2 | Kitten Socializing Hour (quick win) | Five Points South | animals | 1 | 40 | 2222 |
| 3 | Sloss Spring Cleanup | Lakeview | cleanup | 8 | 120 | 3333 |
| 4 | Furnace Tour Helper | Lakeview | education | 2 | 90 | 4444 |
| 5 | Meal Prep Brigade | Southside | food | 6 | 120 | 5555 |
| 6 | Pantry Shelf Stocking | Southside | food | 3 | 60 | 6666 |
| 7 | Railroad Park Litter Sweep (quick win) | Downtown | cleanup | 1 | 30 | 7777 |
| 8 | Lawn Games Setup | Downtown | community | 4 | 90 | 8888 |
| 9 | Kelly Ingram Garden Tidy | Downtown | environment | 3 | 60 | 9999 |
| 10 | Memorial Storytellers | Downtown | education | 2 | 60 | 1010 |
| 11 | Botanical Plant Labels | Highland Park | education | 2 | 60 | 1212 |
| 12 | Greenhouse Helper | Highland Park | environment | 3 | 90 | 1313 |
| 13 | Clear the Beds (chain 1/3) | Avondale | environment | 4 | 60 | 1414 |
| 14 | Plant the Rows (chain 2/3) | Avondale | environment | 4 | 60 | 1515 |
| 15 | Paint the Fence (chain 3/3) | Avondale | arts | 4 | 60 | 1616 |
| 16 | Porch Visit & Tea (easy seniors) | Avondale | seniors | 1 | 45 | 1717 |
| 17 | Senior Center Tech Help (easy seniors) | Woodlawn | seniors | 2 | 60 | 1818 |
| 18 | Woodlawn Mural Brigade | Woodlawn | arts | 5 | 120 | 1919 |
| 19 | Ensley Mural Touch-up | Ensley | arts | 4 | 90 | 2020 |

Chain **Restore Avondale Park** (#13 → #14 → #15) pays a 60 credit bonus on the last step.

## Click path (SYSTEM.md §14)
1. Login as the demo user → map, HUD: level 1, 40 credits.
2. Filter **Animals**, tap **Dog Day at the Shelter** → party shows Maya, Jordan, Sam, Ava (already on it).
3. **Accept** → **Check in** (any coordinates in demo mode) → **Complete** with `1111` → +30 credits, +60 XP, level up to 2, badges *First Steps* + *Team Player*, class Wanderer → Keeper, **Five Points South** reveals.
4. **People** → matches with shared-interest reasons.
5. **Store** → redeem *Free drip coffee* (20 credits) → code `RPGB-XXXXX`. **Donate** → give 10 credits to a cause → progress bar moves, *Patron* badge.
6. (Stretch) `/giver` → post a quest (see Giver login below).

Chain demo: complete #13, #14, #15 with 1414, 1515, 1616 → +60 bonus and *Chain Breaker* on the last.

## Giver login
Log in with email `giver@rpgbirmingham.app`. On first visit to `/giver` (or first POST) that user is attached to the first org (Railroad Park Foundation). Post a quest → big 4-digit code → **View on map**. Other users get 403 on `/api/giver/quests`.

## Smoke test
With the server running (`npm run dev` or `npm start`): `npm run smoke` (fresh user each run, re-runnable; needs `DEMO_MODE="true"`).
