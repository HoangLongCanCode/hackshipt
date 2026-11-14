'use client';

import { useEffect, useRef, useState } from 'react';

export interface CountUpProps {
  value: number;
  /** Animation length in ms. Default 900. */
  durationMs?: number;
  /** Start from this instead of the previous value (e.g. 0 for a reward reveal). */
  from?: number;
  prefix?: string;
  className?: string;
}

/** Animates between numeric values (ease-out). Respects prefers-reduced-motion. */
export function CountUp({ value, durationMs = 900, from, prefix = '', className }: CountUpProps) {
  const [shown, setShown] = useState(from ?? value);
  const last = useRef(from ?? value);

  useEffect(() => {
    const start = last.current;
    if (start === value) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      last.current = value;
      setShown(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(start + (value - start) * eased);
      last.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return (
    <span className={className}>
      {prefix}
      {shown.toLocaleString()}
    </span>
  );
}

export default CountUp;
