# Design cheat sheet — "Cozy paper & wood"

Warm, light, fuzzy. Inspired by the *Food Words* cozy mobile game UI (Behance, M. Kałuziński), simplified: flat pastel fills, one thin outline, soft shadows, chunky rounded type. No cat.

> **Conflict with SYSTEM.md §9:** §9 says "cozy-dark RPG". This kit is a **warm light** theme. Token *names* are unchanged; only values moved. A lead should update §9 (SYSTEM.md wins on conflict).

Source of truth: [`components/ui/cozy.css`](../components/ui/cozy.css). Live gallery: `/dev/ui` (390 px).

## Everyone: how to adopt it
- Nothing to install. Every kit component imports `cozy.css`. It overrides the §9 tokens via `html:root`, so existing Tailwind classes mapped to `--bg --surface --surface-2 --border --text --muted --gold --xp --accent --danger` recolor on their own.
- Optional: paste `cozy.css` under the `/* P3 */` marker in `app/globals.css` and remove the imports. Same result.
- Need a colour in JS (canvas, three.js, MapLibre paint)? Read it once: `getComputedStyle(document.documentElement).getPropertyValue('--cz-coral').trim()`, or copy the hex below.

## Palette
| Token | Hex | Use |
|---|---|---|
| `--bg` / `--cz-cream` | `#FFF6E3` | page background |
| `--surface` / `--cz-paper` | `#FFFDF6` | cards, sheet, modal |
| `--surface-2` / `--cz-paper-2` | `#FBEBC8` | tinted rows, empty-state art |
| `--text` / `--cz-ink` | `#4A3328` | text (warm brown, never pure black) |
| `--muted` | `#8C7260` | secondary text |
| `--border` | `#E6C9A0` | hairlines |
| `--cz-outline` | `#D9A877` | hero surfaces (sheet, modal, tickets) |
| `--accent` / `--cz-coral` | `#F07C5A` (lip `#D8603F`) | primary CTA, active nav |
| `--gold` / `--cz-mustard` | `#F2B63D` (deep `#D99A1F`) | credits, coins |
| `--xp` / `--cz-leaf` | `#6BB653` (deep `#4F9A3B`) | XP, success, "go" |
| `--cz-sky` | `#7FB6E8` (deep `#5A97CF`) | info, close buttons |
| `--cz-peach` | `#FBC9B5` | modal header strip |
| `--danger` | `#D8443F` | errors |
| `--cz-plank` | `#7FA8A6` | teal wood backdrop (login, behind modals) |

Category colours (`CATEGORY_META`) are unchanged and still read well on cream.

## Shape, depth, type
- Radii: 12 / 18 / 24 / pill. Cards 24, buttons 18, chips pill.
- Borders: 1.5 px. Hero surfaces use `--cz-outline`, others `--border`.
- Shadows: soft + warm only (`--cz-shadow-sm | --cz-shadow | --cz-shadow-lg`). The single exception is the button "lip" (solid 4 px bottom edge), which is the game-y touch.
- Stitched dashed edge (`.cz-stitch`): hero surfaces only (sheet, modal, redeem ticket). Not on every card.
- Type: **Fredoka** (display, buttons, numbers) + **Nunito** (body), loaded by `@import` in `cozy.css`, with `ui-rounded` and system fallbacks. Override with `--font-display` / `--font-body` if a `next/font` is added.
- Icons: `lucide-react`, stroke 2.4. Avatars and decor are emoji.

## Motion
Spring pop-ins (0.4 s), button press squish, gentle float on empty states, count-up on credits and XP. All disabled under `prefers-reduced-motion`. Keep it to a few moments of delight; don't animate lists.

## For the map teammate
- The map sits under floating cream glass (`.cz-glass`) HUD and nav. Marker halo / selected ring: use `--cz-coral`. Fog-of-war overlay: warm, e.g. `rgba(74, 51, 40, 0.45)` with "???" labels in `--cz-cream`. The OpenFreeMap `liberty` style is already light and fits.
- Selected marker should read against both map and cream: white 3 px stroke + `--cz-ink` outer shadow.
- Safe areas: top-left HUD ≈ 64 px tall at 12 px inset. Bottom: nav ≈ 84 px, sheet peek 168 px above it. Don't put controls there.

## For the backend teammate
Nothing required. No DTO, contract or route changes come from this work.

## Do / don't
- Do use `Button`, `Card`, `Pill`, `Modal`, `Toast` from `@/components/ui` instead of hand-rolled styles.
- Do give async views a `Skeleton` with fixed height, an `EmptyState`, and an error state with a retry `Button`.
- Don't use pure black or pure white text/backgrounds, hard-edged dark shadows, or more than one dashed edge on a screen.
- Don't add dependencies for UI.

## Wiring cheat sheet (when Phase 1 lands)
```tsx
const { data: me } = useMe();
me && <Hud data={me} />                         // MeDTO satisfies HudData
const m = CATEGORY_META[q.category];
<CategoryChip label={m.label} emoji={m.emoji} color={m.color} />
<RewardBadge credits={q.rewardCredits} xp={q.rewardXp} />
<DifficultyStars value={q.difficulty} />
<AvatarStack items={party.map(p => ({ id: p.userId, emoji: p.avatarEmoji, name: p.displayName }))} />
<Sheet bottomOffset={88} snap={snap} onSnapChange={setSnap}>...</Sheet>
// Root layout: wrap the app once in <ToastProvider>, render <BottomNav /> in app/(app)/layout.tsx
```
