'use client';

import { useEffect, useState } from 'react';

export interface XpGainProps {
  /** Level and position in the level before the quest. */
  fromLevel: number;
  fromInto: number;
  fromNeed: number;
  /** Same, after the quest. */
  toLevel: number;
  toInto: number;
  toNeed: number;
  gained: number;
}

type Phase = 'start' | 'fill' | 'levelup' | 'rest' | 'done';

/**
 * Duolingo-style XP moment: the bar fills with a springy ease while "+N XP" ticks up; if the quest crossed a
 * level the bar tops out, flashes "LEVEL UP!", resets and fills the remainder in the new level.
 */
export default function XpGain({ fromLevel, fromInto, fromNeed, toLevel, toInto, toNeed, gained }: XpGainProps) {
  const leveled = toLevel > fromLevel;
  const pct = (a: number, b: number) => (b > 0 ? Math.max(0, Math.min(100, (a / b) * 100)) : 0);
  const [phase, setPhase] = useState<Phase>('start');
  const [count, setCount] = useState(0);

  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setPhase('fill'), 450));
    if (leveled) {
      t.push(setTimeout(() => setPhase('levelup'), 450 + 1100));
      t.push(setTimeout(() => setPhase('rest'), 450 + 1100 + 1300));
      t.push(setTimeout(() => setPhase('done'), 450 + 1100 + 1300 + 350));
    } else {
      t.push(setTimeout(() => setPhase('done'), 450 + 1100));
    }
    return () => t.forEach(clearTimeout);
  }, [leveled]);

  // count the "+N XP" up alongside the first fill
  useEffect(() => {
    if (phase === 'start') return;
    const dur = 1000, t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setCount(Math.round(gained * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase === 'start', gained]); // eslint-disable-line react-hooks/exhaustive-deps

  // bar width + level label per phase
  let width = pct(fromInto, fromNeed);
  let level = fromLevel;
  let need = fromNeed;
  let into = fromInto;
  let spring = true;
  if (phase === 'fill') { width = leveled ? 100 : pct(toInto, toNeed); }
  if (phase === 'levelup') { width = 100; level = toLevel; }
  if (phase === 'rest') { width = 0; level = toLevel; need = toNeed; into = 0; spring = false; }
  if (phase === 'done') { width = pct(toInto, toNeed); level = toLevel; need = toNeed; into = toInto; }
  if (phase === 'fill' && !leveled) { into = toInto; need = toNeed; }

  const bursting = phase === 'levelup';
  return (
    <div className="space-y-2 text-left" data-testid="xp-gain" aria-live="polite">
      <div className="flex items-baseline justify-between">
        <span className="cz-display text-2xl text-[var(--cz-leaf-deep)]" style={{ transform: phase === 'start' ? 'scale(.6)' : 'scale(1)', transition: 'transform .5s var(--cz-spring)', display: 'inline-block' }}>
          +{count} XP
        </span>
        <span className="text-xs font-bold text-muted">{into} / {need}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="cz-display grid h-8 min-w-8 place-items-center rounded-full bg-[var(--cz-mustard)] px-2 text-sm" style={{ transform: bursting ? 'scale(1.35)' : 'scale(1)', transition: 'transform .35s var(--cz-spring)' }}>
          {level}
        </span>
        <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-[#f1e1c2]" style={{ boxShadow: bursting ? '0 0 0 3px rgba(107,182,83,.35)' : 'inset 0 2px 3px rgba(94,58,30,.15)', transition: 'box-shadow .3s' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${width}%`,
              background: 'var(--cz-leaf)',
              backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,.25) 0 8px, transparent 8px 16px)',
              boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.1), inset 0 2px 0 rgba(255,255,255,.35)',
              transition: phase === 'start' || phase === 'rest' || !spring ? 'none' : 'width 1.05s cubic-bezier(.34,1.3,.5,1)',
            }}
          />
        </div>
        <span className="text-xs font-bold text-muted">{level + 1}</span>
      </div>
      {bursting && (
        <div className="cz-display text-center text-xl text-[var(--cz-coral-deep)]" style={{ animation: 'cz-pop .45s var(--cz-spring) both' }}>
          LEVEL UP!
        </div>
      )}
    </div>
  );
}
