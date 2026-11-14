'use client';

import './cozy.css';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Check, Info, Sparkles } from 'lucide-react';
import { cx } from './cx';

export type ToastKind = 'success' | 'error' | 'info' | 'reward';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  leaving?: boolean;
}

export interface ToastApi {
  /** Generic. Prefer the typed helpers below. */
  toast: (message: string, kind?: ToastKind, durationMs?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  reward: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICON: Record<ToastKind, ReactNode> = {
  success: <Check size={16} strokeWidth={3.5} />,
  error: <AlertTriangle size={15} strokeWidth={3} />,
  info: <Info size={16} strokeWidth={3} />,
  reward: <Sparkles size={15} strokeWidth={3} />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 250);
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = 'success', durationMs = 3200) => {
      const id = nextId.current++;
      setItems((xs) => [...xs.slice(-2), { id, kind, message }]); // max 3 visible
      setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      success: (m) => toast(m, 'success'),
      error: (m) => toast(m, 'error', 4500),
      info: (m) => toast(m, 'info'),
      reward: (m) => toast(m, 'reward', 3800),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="cz-toast-region" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={cx('cz-toast', t.kind !== 'success' && `cz-toast--${t.kind}`, t.leaving && 'cz-toast--out')}
            onClick={() => dismiss(t.id)}
          >
            <span className="cz-toast__dot">{ICON[t.kind]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Must be used under <ToastProvider>. Returns no-op-safe helpers if it isn't (logs once). */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    if (process.env.NODE_ENV !== 'production') console.warn('useToast called outside <ToastProvider>');
    const noop = () => {};
    return { toast: noop, success: noop, error: noop, info: noop, reward: noop };
  }
  return ctx;
}

export default ToastProvider;
