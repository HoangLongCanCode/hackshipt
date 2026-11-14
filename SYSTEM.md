# RPG Birmingham — System Document (source of truth)

> Built by Knuckle Sandwich Robotics Inc. (KSR) for a 4-hour hackathon.
> **Every agent reads this file in full before touching code.** If a phase prompt and this file disagree, this file wins; report the conflict in your handoff instead of silently diverging.

---

## 1. Purpose and constraints

**Product:** a city-as-game web app for Birmingham, Alabama. Local nonprofits post *side quests* (volunteer tasks). Adventurers pick one on a 3D map, go do it, get verified, earn **credits + XP**, then spend credits at sponsor businesses or donate them to causes. The point is connection: group quests and "adventurers like you" matching.

**Hackathon constraints (these drive every decision):**
- 4 hours wall-clock, several AI agents working in parallel, humans merging.
- **Demo beats completeness.** Everything on the demo path (§14) must work flawlessly; everything else is cut or stubbed.
- No paid services, no API keys required. Must run with `npm run dev` on a laptop.
- Prefer boring, fast tools. No new dependencies beyond §3 without writing it in your handoff.
- Out of scope (do **not** build): real payments, real password auth, minors/age policy, moderation tooling, native apps, email/SMS, real-time websockets, i18n.

---

## 2. Scope: IN / STRETCH / CUT

| Area | IN (must) | STRETCH | CUT |
|---|---|---|---|
| 3D map | Birmingham 3D buildings, quest markers, fly-to, select | RPG skin, district fog-of-war, user location | Custom 3D models |
| Auth | Email-only demo login, cookie session | — | Passwords, OAuth |
| Quests | Browse/filter, accept, check-in, complete by code, abandon | Chains w/ bonus, group quests (capacity) | Recurring quests, scheduling |
| Credits | Append-only ledger, balance, earn | Daily cap | Cash value, transfers |
| Store | Sponsor offers, redeem → QR-style code | — | Real inventory sync |
| Donate | Give credits to a cause, progress bar | — | Real money |
| Profile | Interests, class, level/XP, badges, history | Edit bio | Public profile pages |
| Social | "Adventurers like you" list | Party view (teammates on a quest), leaderboard | Chat, DMs |
| Giver | Seeded codes | `/giver` page: post a quest + see verify code | Org approval workflow |

---

## 3. Tech stack (pinned — do not substitute)

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14 (App Router) + TypeScript strict** | One app: UI + API route handlers |
| Styling | **Tailwind CSS 3** + CSS variables (tokens in §9) | `lucide-react` for icons |
| Map | **maplibre-gl ^4** | Client-only (`dynamic(..., {ssr:false})`) |
| Map data | **OpenFreeMap** style `https://tiles.openfreemap.org/styles/liberty` (OSM vector tiles, includes 3D buildings, no key) | Fallback: add our own `fill-extrusion` layer on source `openmaptiles`, source-layer `building` |
| DB | **SQLite via Prisma ^5.22** (`file:./dev.db`) | Schema in §5 is frozen after Phase 1 |
| Validation | **zod** | One schema per request body, in `lib/contracts.ts` |
| Auth | Signed cookie `ksr_session` via **jose** (HS256), 7-day, email-only login | No passwords |
| Data fetching | **swr** on the client | All calls go through `lib/client/api.ts` |
| Tests | **vitest** (unit tests for `lib/domain` only) + one Playwright-free smoke script | Don't over-test |
| Package manager | **npm** | Node 20+ |

Env (`.env.example` committed, `.env` local):
```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="dev-only-change-me-32-chars-minimum!!"
DEMO_MODE="true"                 # check-in ignores GPS distance; no daily cap
NEXT_PUBLIC_USE_MOCKS="1"        # 1 = client uses lib/mock/*, 0 = real API
NEXT_PUBLIC_MAP_STYLE="https://tiles.openfreemap.org/styles/liberty"
```

---

## 4. Repo layout and file ownership

Agents may **only create/edit files in their owned paths** (§13 lists owners per phase). If you must touch anything else, make the smallest possible edit and list it under "Files touched outside ownership" in your handoff.

```
/
├─ docs/
│  ├─ SYSTEM.md                      (this file; Phase 1 may fix typos only)
│  └─ prompts/…                      (phase prompts)
├─ prisma/
│  ├─ schema.prisma                  FROZEN after Phase 1
│  └─ seed.ts                        Phase 2D
├─ app/
│  ├─ layout.tsx, globals.css        Phase 1 (shell) → Phase 3C (theme)
│  ├─ (app)/                         authenticated shell group
│  │  ├─ page.tsx                    MAP HOME (composed by 2C, uses 2A's <QuestMap/>)
│  │  ├─ quests/page.tsx             list view
│  │  ├─ quest/[id]/page.tsx         quest detail
│  │  ├─ profile/page.tsx
│  │  ├─ store/page.tsx
│  │  ├─ donate/page.tsx
│  │  ├─ people/page.tsx             "Adventurers like you"
│  │  └─ giver/page.tsx              (Phase 3B)
│  ├─ login/page.tsx
│  ├─ dev/map/page.tsx               standalone map playground (2A)
│  └─ api/**/route.ts                2B (3B adds matches/chains/giver)
├─ components/
│  ├─ map/                           2A (3C restyles)
│  ├─ shell/, ui/, quest/, profile/, store/   2C
│  └─ social/, rpg/                  3B / 3C
├─ lib/
│  ├─ contracts.ts                   Phase 1: all DTO types + zod schemas (FROZEN)
│  ├─ constants.ts                   Phase 1: categories, classes, colors, districts, Birmingham coords
│  ├─ domain/                        stubs in Phase 1, implemented by 2D (pure functions, unit-tested)
│  ├─ server/                        2B (db.ts, session.ts, http.ts written in Phase 1)
│  ├─ client/api.ts                  Phase 1 (mock-aware fetchers + SWR hooks)
│  └─ mock/                          Phase 1 (typed fixtures matching contracts)
├─ tests/                            2D (unit), 3A (smoke)
├─ .env.example, package.json, tsconfig.json, tailwind.config.ts
```

---

## 5. Data model (Prisma schema — write exactly this in Phase 1)

SQLite has no enums/arrays, so enumerations are `String` with the allowed values documented in comments and enforced by zod; lists are join tables or comma-separated strings where noted.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id             String   @id @default(cuid())
  email          String   @unique
  displayName    String
  avatarClass    String   @default("wanderer") // wanderer|builder|healer|scout|teacher|keeper|bard
  avatarEmoji    String   @default("🧭")
  bio            String   @default("")
  xp             Int      @default(0)
  credits        Int      @default(0)           // cached balance; ledger is truth; update in same $transaction
  isNpc          Boolean  @default(false)       // seeded fake adventurers for matching
  orgId          String?
  org            Org?     @relation(fields: [orgId], references: [id])
  createdAt      DateTime @default(now())
  interests      UserInterest[]
  participations Participation[]
  ledger         LedgerEntry[]
  redemptions    Redemption[]
  donations      Donation[]
  badges         UserBadge[]
}

model Interest {
  id    String @id @default(cuid())
  slug  String @unique
  label String
  emoji String
  users UserInterest[]
}

model UserInterest {
  userId     String
  interestId String
  user       User     @relation(fields: [userId], references: [id])
  interest   Interest @relation(fields: [interestId], references: [id])
  @@id([userId, interestId])
}

model Org {
  id           String  @id @default(cuid())
  name         String
  kind         String  // nonprofit|school|city|neighbor
  description  String
  emoji        String  @default("🏛️")
  lat          Float
  lng          Float
  neighborhood String
  verified     Boolean @default(true)
  quests       Quest[]
  members      User[]
  causes       Cause[]
}

model QuestChain {
  id           String  @id @default(cuid())
  title        String
  description  String
  bonusCredits Int
  quests       Quest[]
}

model Quest {
  id            String   @id @default(cuid())
  orgId         String
  org           Org      @relation(fields: [orgId], references: [id])
  title         String
  description   String
  category      String   // cleanup|food|education|seniors|animals|arts|environment|community
  interestSlugs String   @default("")  // comma-separated Interest.slug tags
  lat           Float
  lng           Float
  neighborhood  String
  address       String
  difficulty    Int      @default(1)   // 1..5
  durationMin   Int
  rewardCredits Int
  rewardXp      Int
  capacity      Int      @default(1)   // >1 = group quest ("needs N adventurers")
  verifyCode    String               // 4 digits; shown to the giver, typed by adventurer on completion
  status        String   @default("OPEN") // OPEN|CLOSED
  chainId       String?
  chainOrder    Int?
  chain         QuestChain? @relation(fields: [chainId], references: [id])
  createdAt     DateTime @default(now())
  participations Participation[]
}

model Participation {
  id          String   @id @default(cuid())
  questId     String
  userId      String
  quest       Quest    @relation(fields: [questId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  status      String   @default("ACCEPTED") // ACCEPTED|CHECKED_IN|COMPLETED|ABANDONED
  acceptedAt  DateTime @default(now())
  checkedInAt DateTime?
  completedAt DateTime?
  @@unique([questId, userId])
}

model LedgerEntry {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  delta     Int                       // +earn / -spend
  kind      String                    // EARN|BONUS|SPEND|DONATE
  refType   String?                   // quest|offer|cause|chain
  refId     String?
  note      String
  createdAt DateTime @default(now())
}

model Sponsor {
  id          String  @id @default(cuid())
  name        String
  emoji       String
  description String
  lat         Float
  lng         Float
  offers      Offer[]
}

model Offer {
  id          String  @id @default(cuid())
  sponsorId   String
  sponsor     Sponsor @relation(fields: [sponsorId], references: [id])
  title       String
  description String
  costCredits Int
  stock       Int     @default(50)
  redemptions Redemption[]
}

model Redemption {
  id        String   @id @default(cuid())
  userId    String
  offerId   String
  user      User     @relation(fields: [userId], references: [id])
  offer     Offer    @relation(fields: [offerId], references: [id])
  code      String   // e.g. "KSR-7F3K9"
  createdAt DateTime @default(now())
}

model Cause {
  id            String  @id @default(cuid())
  orgId         String
  org           Org     @relation(fields: [orgId], references: [id])
  title         String
  description   String
  goalCredits   Int
  raisedCredits Int     @default(0)
  donations     Donation[]
}

model Donation {
  id        String   @id @default(cuid())
  userId    String
  causeId   String
  user      User     @relation(fields: [userId], references: [id])
  cause     Cause    @relation(fields: [causeId], references: [id])
  amount    Int
  createdAt DateTime @default(now())
}

model Badge {
  id          String @id @default(cuid())
  slug        String @unique
  name        String
  icon        String
  description String
  users       UserBadge[]
}

model UserBadge {
  userId    String
  badgeId   String
  earnedAt  DateTime @default(now())
  user      User  @relation(fields: [userId], references: [id])
  badge     Badge @relation(fields: [badgeId], references: [id])
  @@id([userId, badgeId])
}
```

"Party" is **not** a table: a party = the other non-abandoned participants on the same quest.

---

## 6. Game rules (implemented in `lib/domain`, used by API)

- **Credits & XP:** each quest has seeded `rewardCredits` and `rewardXp`. Guideline for new quests: `credits ≈ (durationMin/15) * 5 * (0.8 + 0.2*difficulty)` rounded to nearest 5; `xp = credits * 2`.
- **Level:** `level = 1 + floor(sqrt(xp / 40))`. `xpForLevel(n) = 40 * (n-1)^2`. Provide `levelProgress(xp) → {level, xpIntoLevel, xpForNext, pct}`.
- **Class** (derived, never user-chosen): count COMPLETED quests by category → map: cleanup→builder, environment→scout, seniors→healer, food→keeper, animals→keeper, education→teacher, arts→bard, community→bard. Most frequent wins (ties → most recent). Zero completions → `wanderer`. Class emoji: wanderer 🧭 builder 🔨 healer 💚 scout 🌲 teacher 📚 keeper 🍞 bard 🎨.
- **Quest lifecycle per user:** `accept` (creates Participation ACCEPTED; fails if quest CLOSED, already active, or at capacity) → `checkin` (within 250 m of quest lat/lng, **skipped when `DEMO_MODE=true`**) → `complete` (must be CHECKED_IN and `code === quest.verifyCode`) → `abandon` (any time before complete).
- **On complete** (single `prisma.$transaction`): Participation→COMPLETED; LedgerEntry EARN `+rewardCredits`; `user.credits += rewardCredits`; `user.xp += rewardXp`; recompute class; award badges; if the quest is the last uncompleted step of a chain for this user → LedgerEntry BONUS `+chain.bonusCredits`.
- **Daily cap:** max 200 credits EARN from quests per rolling 24 h; disabled when `DEMO_MODE=true`.
- **Store:** `redeem` requires `credits >= cost` and `stock > 0`; creates Redemption with code `KSR-` + 5 uppercase alphanumerics; LedgerEntry SPEND `-cost`; decrement stock.
- **Donate:** `donate` requires `credits >= amount > 0`; Donation row; `cause.raisedCredits += amount`; LedgerEntry DONATE `-amount`.
- **Never** let credits go negative; all balance changes happen in a `$transaction` that also writes the ledger.
- **Badges (slug → rule):** `first-steps` 1 completed · `regular` 5 completed · `explorer` completed in 3 distinct neighborhoods · `patron` ≥1 donation · `team-player` completed a quest with capacity > 1 · `chain-breaker` completed a full chain.
- **Matching** (`matchScore(me, other)`): `3 × shared interests + 2 × (same class ? 1 : 0) + 2 × shared active/completed quests + 1 × shared neighborhoods completed`. Return top 10 with `reason` string ("Both into Animals & Parks · Both on 'Dog Day at the Shelter'"). Exclude self.
- **Districts (fog-of-war):** `lib/constants.ts` exports `DISTRICTS` (name, center, radiusM). A district is "revealed" for a user when they have ≥1 COMPLETED quest in that neighborhood.

---

## 7. API contract

All routes are Next.js route handlers under `app/api`. **Envelope:** success `{ ok: true, data: T }`, failure `{ ok: false, error: { code: string, message: string } }` with an appropriate HTTP status. Codes: `UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, INVALID_INPUT, CONFLICT, INSUFFICIENT_CREDITS, TOO_FAR, BAD_CODE, QUEST_FULL, DAILY_CAP`. Helpers `ok()`, `fail()`, `requireUser()` live in `lib/server/http.ts` / `session.ts` (Phase 1). Cookie auth; all routes except `/api/auth/login`, `/api/quests*` GETs, `/api/interests`, `/api/store` GET, `/api/causes` GET require a user.

| Method & path | Body / query | Returns |
|---|---|---|
| `POST /api/auth/login` | `{email, displayName?}` | `MeDTO` (creates user on first login; sets cookie) |
| `POST /api/auth/logout` | — | `{}` |
| `GET /api/me` | — | `MeDTO` |
| `PATCH /api/me` | `{displayName?, bio?, interestSlugs?: string[]}` | `MeDTO` |
| `GET /api/interests` | — | `InterestDTO[]` |
| `GET /api/quests` | `?category&q&neighborhood&maxMinutes&group=1&status` | `QuestDTO[]` (includes `myStatus` if logged in) |
| `GET /api/quests/[id]` | — | `QuestDetailDTO` |
| `POST /api/quests/[id]/accept` | — | `QuestDetailDTO` |
| `POST /api/quests/[id]/checkin` | `{lat, lng}` | `QuestDetailDTO` |
| `POST /api/quests/[id]/complete` | `{code}` | `CompleteResultDTO` |
| `POST /api/quests/[id]/abandon` | — | `QuestDetailDTO` |
| `GET /api/store` | — | `{sponsors: SponsorDTO[]}` (offers nested) |
| `POST /api/store/redeem` | `{offerId}` | `RedemptionDTO` |
| `GET /api/causes` | — | `CauseDTO[]` |
| `POST /api/donate` | `{causeId, amount}` | `{balance, cause: CauseDTO}` |
| `GET /api/ledger` | — | `LedgerEntryDTO[]` (newest first, max 50) |
| `GET /api/matches` | — | `MatchDTO[]` *(3B)* |
| `GET /api/chains` | — | `ChainDTO[]` with my progress *(3B)* |
| `POST /api/giver/quests` | `NewQuestInput` | `QuestDetailDTO` incl. `verifyCode` *(3B)* |
| `GET /api/leaderboard` | `?scope=neighborhood` | `LeaderboardRowDTO[]` *(3B, stretch)* |

### DTOs (live in `lib/contracts.ts`; exact shapes)

```ts
export type Category = 'cleanup'|'food'|'education'|'seniors'|'animals'|'arts'|'environment'|'community';
export type AvatarClass = 'wanderer'|'builder'|'healer'|'scout'|'teacher'|'keeper'|'bard';
export type MyStatus = 'ACCEPTED'|'CHECKED_IN'|'COMPLETED'|'ABANDONED';

export interface InterestDTO { slug: string; label: string; emoji: string }

export interface QuestDTO {
  id: string; title: string; description: string; category: Category;
  interestSlugs: string[]; lat: number; lng: number; neighborhood: string; address: string;
  difficulty: 1|2|3|4|5; durationMin: number; rewardCredits: number; rewardXp: number;
  capacity: number; participantCount: number; spotsLeft: number; status: 'OPEN'|'CLOSED';
  org: { id: string; name: string; emoji: string; verified: boolean };
  chain?: { id: string; title: string; order: number; total: number } | null;
  myStatus?: MyStatus | null;
}
export interface PartyMemberDTO { userId: string; displayName: string; avatarEmoji: string; avatarClass: AvatarClass; level: number }
export interface QuestDetailDTO extends QuestDTO { party: PartyMemberDTO[]; verifyCode?: string /* only for giver's own org */ }

export interface BadgeDTO { slug: string; name: string; icon: string; description: string; earnedAt?: string }
export interface MeDTO {
  id: string; email: string; displayName: string; bio: string;
  avatarClass: AvatarClass; avatarEmoji: string;
  xp: number; level: number; xpIntoLevel: number; xpForNext: number; credits: number;
  interests: InterestDTO[]; badges: BadgeDTO[];
  stats: { questsCompleted: number; creditsEarned: number; creditsDonated: number; neighborhoods: string[] };
  revealedDistricts: string[];
}
export interface CompleteResultDTO {
  me: MeDTO; earned: { credits: number; xp: number; chainBonus: number };
  levelUp: boolean; newBadges: BadgeDTO[]; quest: QuestDetailDTO;
}
export interface OfferDTO { id: string; title: string; description: string; costCredits: number; stock: number }
export interface SponsorDTO { id: string; name: string; emoji: string; description: string; lat: number; lng: number; offers: OfferDTO[] }
export interface RedemptionDTO { id: string; code: string; offer: OfferDTO; sponsorName: string; balance: number }
export interface CauseDTO { id: string; title: string; description: string; orgName: string; goalCredits: number; raisedCredits: number }
export interface LedgerEntryDTO { id: string; delta: number; kind: 'EARN'|'BONUS'|'SPEND'|'DONATE'; note: string; createdAt: string }
export interface MatchDTO { userId: string; displayName: string; avatarEmoji: string; avatarClass: AvatarClass; level: number; score: number; sharedInterests: InterestDTO[]; reason: string }
export interface ChainDTO { id: string; title: string; description: string; bonusCredits: number; steps: { questId: string; title: string; order: number; done: boolean }[] }
export interface NewQuestInput { title: string; description: string; category: Category; lat: number; lng: number; neighborhood: string; address: string; difficulty: 1|2|3|4|5; durationMin: number; capacity: number; interestSlugs: string[] }
export interface LeaderboardRowDTO { rank: number; displayName: string; avatarEmoji: string; xp: number; level: number }
```

---

## 8. Map specification

- **Component contract (2A implements, everyone else consumes):**
```ts
// components/map/QuestMap.tsx  — default export, client component
export interface QuestMapProps {
  quests: QuestDTO[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  revealedDistricts?: string[];           // names from DISTRICTS
  userLocation?: { lat: number; lng: number } | null;
  sponsors?: SponsorDTO[];                // optional secondary markers
  className?: string;
}
```
- **Initial camera:** center `[-86.8025, 33.5186]` (lng, lat), zoom `14.3`, pitch `60`, bearing `-25`; `maxBounds` roughly Birmingham metro `[[-87.0, 33.38],[-86.65, 33.68]]`. Selecting a quest calls `flyTo` (zoom ≥ 16.2, pitch 65).
- **3D buildings:** use the style's building layer; verify layer ids at runtime from `map.getStyle()` and fall back to a custom `fill-extrusion` layer if absent (source `openmaptiles`, source-layer `building`, height from `render_height`).
- **Quest markers:** one GeoJSON source `quests`; circle + emoji symbol layer colored by category (`CATEGORY_META` in `lib/constants.ts`); selected quest gets a pulsing halo (DOM marker or animated circle). Cluster at zoom < 13 only if trivial; otherwise skip.
- **Fog-of-war (stretch):** each `DISTRICTS` entry is a circle polygon (use a tiny helper, no turf dependency required); unrevealed districts get a translucent dark overlay + "???" label; revealed ones are clear.
- **Performance:** never re-create the map on prop change; update sources with `setData`. Must hold 60 fps on a laptop with ~40 markers.
- **Dev playground:** `/dev/map` renders `QuestMap` with `lib/mock` data and a selection readout; this is how 2A tests in isolation.

---

## 9. UI / design system

- **Mobile-first** (target 390 px wide, but fine at desktop). Home = full-screen map, bottom sheet for quest list/detail, floating HUD (level ring, credits, class emoji) top-left. Bottom nav: Map · Quests · People · Store · Profile.
- **Theme:** "cozy-dark RPG." Tokens as CSS variables in `globals.css` and mapped in `tailwind.config.ts`:
```
--bg:#0f1220  --surface:#171b2e  --surface-2:#1f2440  --border:#2c3358
--text:#eef0ff --muted:#9aa3c7
--gold:#ffc857 (credits) --xp:#7bdcb5 --accent:#8b7bff --danger:#ff6b81
category colors (CATEGORY_META): cleanup #f59e0b · food #f97316 · education #60a5fa · seniors #34d399 · animals #f472b6 · arts #c084fc · environment #4ade80 · community #fbbf24
```
- **Type:** system UI font stack; headings may use a single Google font if added in Phase 3C (optional).
- **Brand:** apply KSR branding guidelines. They are not in the repo; leave `BRAND_TODO` comments at the logo/wordmark/colour spots and list them in the handoff so a human can drop the assets in. Product wordmark for now: "RPG Birmingham".
- **Components (2C):** `Button, Card, Pill, Sheet, ProgressBar, Avatar, Modal, Toast, EmptyState, Skeleton` in `components/ui`; domain components `QuestCard, QuestSheet, CategoryChip, RewardBadge, LevelRing, CreditPill`.
- **States:** every data view needs loading (skeleton), empty, and error states. Every mutation shows a toast.
- **Juice (Phase 3C):** XP/credit count-up, level-up modal with confetti-ish CSS animation, badge pop-in.

---

## 10. Mock mode (how agents work in parallel before the API exists)

`lib/client/api.ts` exports typed fetchers + SWR hooks (`useMe`, `useQuests(filters)`, `useQuest(id)`, `useStore`, `useCauses`, `useLedger`, `useMatches`, `useChains` plus action functions `login, logout, acceptQuest, checkIn, completeQuest, abandonQuest, redeem, donate, updateProfile`). Each function branches on `process.env.NEXT_PUBLIC_USE_MOCKS === '1'` and serves from `lib/mock/*` (in-memory state so actions visibly work: accepting a quest changes `myStatus`, completing it bumps credits/xp). With `0` it calls the real API and unwraps the envelope, throwing `ApiError {code, message}`.

- 2A and 2C build **only** against mock mode.
- 2B builds real routes and curl-tests them independently.
- Phase 3A flips `NEXT_PUBLIC_USE_MOCKS=0` and fixes drift. **Any DTO change after Phase 1 requires a lead (human) OK**, and must update `contracts.ts`, `lib/mock`, `lib/client/api.ts` and the route in one commit.

---

## 11. Seed data (2D) — Birmingham, AL

Coordinates are approximate (±300 m); eyeball the marker placement in `/dev/map` and nudge if one lands in the wrong place.

**Neighborhoods / districts** (center lat,lng · radius m): Downtown 33.5186,-86.8104 · 900 | Five Points South 33.5010,-86.7950 · 700 | Avondale 33.5222,-86.7692 · 800 | Woodlawn 33.5504,-86.7634 · 800 | Southside 33.5050,-86.8000 · 600 | Lakeview 33.5130,-86.7900 · 600 *(Sloss/Lakeview)* | Highland Park 33.5043,-86.7840 · 700 | Ensley 33.5120,-86.8800 · 900.

**Orgs (8):** Railroad Park Foundation (Downtown), Birmingham Botanical Society (Highland Park — gardens ~33.4890,-86.7770), Kelly Ingram Park Friends (Downtown 33.5164,-86.8143), Sloss Furnaces Volunteers (Lakeview 33.5136,-86.7923), Avondale Community Garden (Avondale), Woodlawn Foundation (Woodlawn), Greater Birmingham Humane Society (Five Points South area/anywhere plausible), Magic City Meals (Southside food bank). Invent plausible descriptions; **do not claim real organizations endorse this**, mark seeded orgs `verified: true` but names in a way that reads as demo data (e.g. suffix none, but add "(demo)" in description).

**Quests (≈18, 2–3 per org):** mix of categories, durations 30–180 min, capacities 1–6, difficulty 1–4. Include:
- Chain **"Restore Avondale Park"** (3 steps: *Clear the Beds* → *Plant the Rows* → *Paint the Fence*; bonus 60 credits).
- At least 3 group quests (capacity ≥ 4) e.g. *Dog Day at the Shelter*, *Sloss Spring Cleanup*, *Meal Prep Brigade*.
- 2 quests under 45 min (quick wins for demo), 2 easy seniors quests.
- Every quest has a distinct 4-digit `verifyCode` (use a visible pattern for demo, e.g. 1111, 2222 …; list them in `docs/DEMO.md`).

**Other:** 12 interests (Animals, Parks, Food, Teaching, Art, History, Gardening, Seniors, Fitness, Music, Tech, Cleanups); 6 badges (§6); 5 sponsors (coffee shop, bookstore, taco spot, climbing gym, ice-cream) with 2 offers each costing 20–120 credits; 4 causes (goal 300–1000 credits); 12 NPC adventurers with varied interests/XP/classes and some Participations on seeded quests (so matching + party views have data); 1 demo user `demo@rpgbirmingham.app` ("Alex the Wanderer", 0 xp, 40 credits).
`npm run db:seed` must be **idempotent** (wipe + recreate).

---

## 12. Conventions

- TypeScript strict, no `any` except at JSON boundaries. Absolute imports via `@/*`.
- Server code only in `app/api/**` and `lib/server/**`; never import `lib/server` from a client component. `lib/domain` is pure (no I/O, no Prisma).
- All request bodies validated with zod schemas from `lib/contracts.ts`.
- API handlers: `try/catch` → `fail()`; never leak stack traces; always return the envelope.
- Naming: components `PascalCase.tsx`; hooks `useX`; DTO suffix `DTO`.
- Commits: after each phase checkpoint, human runs `git add -A && git commit -m "phase N"`. Agents don't commit unless the prompt says so.
- Scripts (`package.json`): `dev`, `build`, `start`, `typecheck` (`tsc --noEmit`), `lint`, `test` (vitest run), `db:push` (`prisma db push`), `db:seed` (`tsx prisma/seed.ts`), `db:reset` (`prisma db push --force-reset && npm run db:seed`), `smoke` (`tsx tests/smoke.ts`).
- Before handoff every agent runs `npm run typecheck` (and `npm test` if they own tests). A red typecheck is a failed handoff.
- Do not run `npm install` for new deps without listing them in the handoff. Never commit `.env`, `dev.db`.

---

## 13. Multi-agent protocol

### Timeline (240 min)
| Clock | Phase | Agents (parallel) | Output |
|---|---|---|---|
| 0:00–0:30 | **1 Foundation** | 1 agent (serial) | Scaffold, schema, contracts, stubs, mocks |
| 0:30–1:45 | **2 Build** | 2A Map · 2B API · 2C UI · 2D Domain+Seed | Four disjoint slices |
| 1:45–2:00 | *Checkpoint* | humans | Merge handoffs, `typecheck`, `db:reset`, commit |
| 2:00–3:10 | **3 Integrate + Extend** | 3A Integration · 3B Social/Giver · 3C RPG polish | Real API wired, extras, polish |
| 3:10–3:20 | *Checkpoint* | humans | Run demo script once end to end |
| 3:20–3:50 | **4 Harden + Pitch** | 4A QA/fixes · 4B Demo/pitch/README | Demo-ready build, script, slides outline |
| 3:50–4:00 | Buffer | everyone | Rehearse; freeze code at 3:50 |

### Ownership by phase
- **P1:** everything (scaffold).
- **2A:** `components/map/**`, `lib/map/**`, `app/dev/map/**`.
- **2B:** `app/api/**`, `lib/server/**` (except the three files P1 wrote may be *extended*, not rewritten).
- **2C:** `app/(app)/**`, `app/login/**`, `components/{ui,shell,quest,profile,store}/**`, `lib/client/**` (UI-side hooks only; contract frozen).
- **2D:** `lib/domain/**`, `prisma/seed.ts`, `tests/domain/**`, `docs/DEMO.md`.
- **3A:** wiring fixes anywhere (smallest edits), `tests/smoke.ts`.
- **3B:** `app/api/{matches,chains,giver,leaderboard}/**`, `app/(app)/{people,giver}/**`, `components/social/**`.
- **3C:** `app/globals.css`, `tailwind.config.ts`, `components/rpg/**`, visual-only edits in `components/map/**` and `components/ui/**`.
- **4A:** any file, bug fixes only. **4B:** `README.md`, `docs/PITCH.md`, `docs/DEMO.md`.

### Conflict rules
1. Disjoint paths = no merge pain, so all agents share the same working folder. No branches needed.
2. Never rename/move another owner's file. Never reformat files you don't own.
3. Contract (`lib/contracts.ts`, `prisma/schema.prisma`) is frozen. If blocked, **stub around it and report**; don't edit.
4. If another slice's piece you depend on isn't there yet, use the stub from Phase 1 and keep going.

### Handoff format (every agent ends with exactly this; humans paste it into the next prompt's placeholder)
```
## HANDOFF <phase-id>
Status: DONE | PARTIAL
Built: <bullets with file paths>
How to verify: <exact commands/URLs + expected result>
Contracts changed: none | <list + why>
Deviations from SYSTEM.md: none | <list>
Files touched outside ownership: none | <list>
Known issues / TODO for next phase: <bullets>
BRAND_TODOs: none | <list>
```

### Prompt placeholders
Each phase prompt begins with a `## Context from previous phases` block containing placeholders like `{{PHASE_1_HANDOFF}}`. Humans replace them with the actual handoff text before launching. If a placeholder is still literal text, treat that phase as "not yet merged" and rely on SYSTEM.md only.

---

## 14. Demo script = acceptance criteria (3 minutes)

1. **Open** the app → login as `demo@rpgbirmingham.app` → 3D Birmingham map flies in, quest markers glowing; HUD shows level 1, 40 credits.
2. **Filter** to "Animals," tap the *Dog Day at the Shelter* marker → camera flies in, sheet shows reward, party (NPC teammates), spots left.
3. **Accept** → **Check in** (demo mode) → **Complete** with code → toast, credit/XP count-up, badge *First Steps*, class changes from Wanderer → Keeper, district fog lifts.
4. **People** tab → "Adventurers like you" shows 3+ matches with shared-interest reasons.
5. **Store** → redeem a coffee offer → redemption code shown. **Donate** → give credits → cause progress bar moves.
6. **(Stretch)** `/giver` → post a new quest → it appears on the map instantly.

If a feature isn't on this path, it loses priority to making this path flawless.
