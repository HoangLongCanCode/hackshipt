# Avocado mascot kit

Everything lives in `components/mascot/`. Import from `@/components/mascot`.

| Want | Use |
|---|---|
| Looping loading bar | `<AvocadoLoader />` (or `<AvocadoLoader fullScreen />`) |
| Loading bar with real progress | `<AvocadoLoader progress={0..100} label="..." />` |
| Short splash page (once per session) | `<AvocadoSplash ready={dataLoaded} />` (already in `app/(app)/layout.tsx`) |
| Route loading UI | `app/loading.tsx` (already added) |
| Just the mascot / bag / car | `<Avocado walking />`, `<ShiptBag />`, `<AvocadoCar />` |
| On/off switch for the ride animation | `<AnimationToggle />`, read it with `const [on] = useAnimationPref()` |
| Drive the car on a MapLibre map | `QuestMap` prop `animate={on}`; low-level `startDrive()` in `driveCar.tsx` |

Playground: `/dev/mascot`.

The ride starts from an in-flight car, else `userLocation` (QuestMap prop), else the map centre, and ends at the selected quest.
While it drives, the quest sheet stays at peek (so the car stays on screen) and opens full when the car parks (`onDriveArrive`). With the toggle off, the sheet still opens full immediately.
The toggle is saved in localStorage (`rpgb:animations`), defaults to on, and defaults to off if the OS asks for reduced motion.
No new dependencies.
