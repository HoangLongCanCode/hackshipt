'use client';

import '../ui/cozy.css';
import type { CSSProperties } from 'react';
import { CountUp } from '../ui/CountUp';
import { cx } from '../ui/cx';

/**
 * Structural subset of MeDTO. Pass `useMe().data` straight in: extra fields are fine.
 * (Kept structural so the shell has no hard dependency on lib/contracts.)
 */
export interface HudData {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  credits: number;
  avatarEmoji: string;
}

export function LevelRing({
  level,
  xpIntoLevel,
  xpForNext,
  emoji,
  size = 52,
}: {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  emoji: string;
  size?: number;
}) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = xpForNext > 0 ? Math.max(0, Math.min(1, xpIntoLevel / xpForNext)) : 0;
  return (
    <div
      className="cz-ring"
      style={{ '--size': `${size}px` } as CSSProperties}
      role="img"
      aria-label={`Level ${level}, ${xpIntoLevel} of ${xpForNext} XP`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="cz-ring__track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className="cz-ring__bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className="cz-ring__face">{emoji}</span>
      <span className="cz-ring__lvl">{level}</span>
    </div>
  );
}

export function CreditPill({ credits, className }: { credits: number; className?: string }) {
  return (
    <span className={cx('cz-credits', className)} aria-label={`${credits} credits`}>
      <span className="cz-coin" aria-hidden>
        C
      </span>
      <CountUp value={credits} />
    </span>
  );
}

/** Floating top-left HUD: level ring (with class emoji) + credits. Position it yourself. */
export function Hud({ data, className }: { data: HudData; className?: string }) {
  return (
    <div className={cx('cz-hud cz-glass', className)}>
      <LevelRing
        level={data.level}
        xpIntoLevel={data.xpIntoLevel}
        xpForNext={data.xpForNext}
        emoji={data.avatarEmoji}
      />
      <CreditPill credits={data.credits} />
    </div>
  );
}

/** Same footprint as <Hud> while `useMe` is loading: no layout shift. */
export function HudSkeleton() {
  return <div className="cz-hud cz-glass" style={{ width: 150, height: 64 }} aria-busy />;
}

export default Hud;
