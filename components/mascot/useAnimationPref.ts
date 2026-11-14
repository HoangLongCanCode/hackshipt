'use client';

/**
 * The "Ride animation" on/off preference, persisted in localStorage and shared across components/tabs.
 *
 *   const [on, setOn] = useAnimationPref();
 *
 * Default: ON, unless the OS asks for reduced motion. No provider needed.
 */
import { useSyncExternalStore } from 'react';

const KEY = 'rpgb:animations';
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    if (v !== null) return v === '1';
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return true;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function setAnimationPref(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {}
  listeners.forEach((l) => l());
}

export function useAnimationPref(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, read, () => true);
  return [on, setAnimationPref];
}
