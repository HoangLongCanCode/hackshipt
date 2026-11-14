'use client';

import './cozy.css';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cx } from './cx';

export type SheetSnap = 'peek' | 'half' | 'full';

export interface SheetProps {
  /** Controlled snap. Omit to let the sheet manage itself (see defaultSnap). */
  snap?: SheetSnap;
  defaultSnap?: SheetSnap;
  onSnapChange?: (snap: SheetSnap) => void;
  /** Visible height in px when peeking (grabber + carousel row). Default 168. */
  peekHeight?: number;
  /** Lift the sheet above a bottom nav, in px. Default 0. */
  bottomOffset?: number;
  className?: string;
  children: ReactNode;
}

const HALF = 0.55;
const FULL = 0.9;

/**
 * Bottom sheet with peek / half / full snap points. Drag the grabber (pointer events,
 * works for mouse + touch). Body scrolls only at `full`. No dependencies.
 */
export function Sheet({
  snap,
  defaultSnap = 'peek',
  onSnapChange,
  peekHeight = 168,
  bottomOffset = 0,
  className,
  children,
}: SheetProps) {
  const [inner, setInner] = useState<SheetSnap>(defaultSnap);
  const current = snap ?? inner;
  const [vh, setVh] = useState(800);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const drag = useRef<{ startY: number; startOffset: number; lastY: number; lastT: number; v: number } | null>(null);

  useEffect(() => {
    const read = () => setVh(window.innerHeight);
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);

  const sheetH = Math.max(peekHeight + 40, Math.round((vh - bottomOffset) * FULL));
  const visible: Record<SheetSnap, number> = {
    peek: peekHeight,
    half: Math.max(peekHeight + 20, Math.round((vh - bottomOffset) * HALF)),
    full: sheetH,
  };
  const offsetOf = (s: SheetSnap) => sheetH - visible[s];
  const maxOffset = offsetOf('peek');

  const commit = useCallback(
    (s: SheetSnap) => {
      if (snap === undefined) setInner(s);
      onSnapChange?.(s);
    },
    [snap, onSnapChange],
  );

  function onDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const startOffset = offsetOf(current);
    drag.current = { startY: e.clientY, startOffset, lastY: e.clientY, lastT: performance.now(), v: 0 };
    setDragOffset(startOffset);
  }
  function onMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const now = performance.now();
    d.v = (e.clientY - d.lastY) / Math.max(1, now - d.lastT); // px/ms, + = downwards
    d.lastY = e.clientY;
    d.lastT = now;
    setDragOffset(Math.min(maxOffset, Math.max(0, d.startOffset + (e.clientY - d.startY))));
  }
  function onUp() {
    const d = drag.current;
    drag.current = null;
    if (!d || dragOffset === null) return;
    const projected = dragOffset + d.v * 180; // fling bias
    const snaps: SheetSnap[] = ['full', 'half', 'peek'];
    const best = snaps.reduce((a, b) => (Math.abs(offsetOf(b) - projected) < Math.abs(offsetOf(a) - projected) ? b : a));
    setDragOffset(null);
    commit(best);
  }

  // Tap on the grabber cycles peek -> half -> full -> peek (a11y + desktop).
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      commit(current === 'peek' ? 'half' : current === 'half' ? 'full' : 'peek');
    }
  }

  const translate = dragOffset ?? offsetOf(current);
  const style: CSSProperties = {
    height: sheetH,
    bottom: bottomOffset,
    transform: `translateY(${translate}px)`,
  };

  return (
    <section
      className={cx('cz-sheet', dragOffset === null && 'cz-sheet--animate', className)}
      style={style}
      data-snap={current}
    >
      <div
        className="cz-sheet__grab"
        role="button"
        tabIndex={0}
        aria-label={`Quest sheet, ${current}. Press to resize`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      />
      <div className="cz-sheet__body" style={{ overflowY: current === 'full' ? 'auto' : 'hidden' }}>
        {children}
      </div>
    </section>
  );
}

export default Sheet;
