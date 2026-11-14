'use client';

/**
 * Short full-screen loading-bar page. Drop it anywhere in a client tree:
 *
 *   <AvocadoSplash />                         ~1.6 s, shows once per browser session
 *   <AvocadoSplash ready={!!me} />            holds at 90% until `ready` flips true
 *   <AvocadoSplash once={false} duration={2500} onDone={() => ...} />   shows every mount
 *
 * It fades itself out and unmounts, so there is nothing to clean up.
 */
import { useEffect, useLayoutEffect, useState } from 'react';
import { AvocadoLoader } from './AvocadoLoader';

const SEEN_KEY = 'rpgb:splash-seen';
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 2.2);

export interface AvocadoSplashProps {
  /** Minimum time the bar takes to fill, ms. Default 1600. */
  duration?: number;
  /** Hold the bar at 90% until this is true (e.g. data loaded). Default true. */
  ready?: boolean;
  /** Only show once per browser session (sessionStorage). Default true. */
  once?: boolean;
  /** Safety valve: finish this many ms after `duration` even if `ready` never arrives. Default 4000. */
  maxWait?: number;
  label?: string;
  onDone?: () => void;
}

export function AvocadoSplash({ duration = 1600, ready = true, once = true, maxWait = 4000, label, onDone }: AvocadoSplashProps) {
  const [phase, setPhase] = useState<'show' | 'fade' | 'gone'>('show');
  const [pct, setPct] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  // Skip before first paint when already seen this session.
  useIsoLayoutEffect(() => {
    if (!once) return;
    try {
      if (sessionStorage.getItem(SEEN_KEY)) setPhase('gone');
    } catch {}
  }, [once]);

  useEffect(() => {
    if (phase !== 'show') return;
    const t = window.setTimeout(() => setTimedOut(true), duration + maxWait);
    return () => window.clearTimeout(t);
  }, [phase, duration, maxWait]);

  useEffect(() => {
    if (phase !== 'show') return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const open = ready || timedOut;
      const p = open ? easeOut(t) * 100 : Math.min(90, easeOut(t) * 100);
      setPct(p);
      if (open && t >= 1) {
        setPct(100);
        setPhase('fade');
        try {
          sessionStorage.setItem(SEEN_KEY, '1');
        } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, duration, ready, timedOut]);

  useEffect(() => {
    if (phase !== 'fade') return;
    const t = window.setTimeout(() => {
      setPhase('gone');
      onDone?.();
    }, 450);
    return () => window.clearTimeout(t);
  }, [phase, onDone]);

  if (phase === 'gone') return null;
  return <AvocadoLoader fullScreen fading={phase === 'fade'} progress={pct} label={label} />;
}

export default AvocadoSplash;
