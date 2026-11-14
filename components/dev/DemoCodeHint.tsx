'use client';

import { KeyRound } from 'lucide-react';
import { useDemoCodes } from '@/lib/client/api';

/**
 * Demo helper pinned to the bottom-right: shows the selected quest's check-in code so a presenter
 * never has to hunt for it. Renders nothing when the server has DEMO_MODE off (endpoint 404s).
 */
export default function DemoCodeHint({ questId, className = '' }: { questId?: string | null; className?: string }) {
  const { data } = useDemoCodes();
  const code = questId && data ? data[questId] : undefined;
  if (!code) return null;
  return (
    <div
      className={`pointer-events-none fixed bottom-[100px] right-3 z-[60] flex items-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-3 py-2 shadow ${className}`}
      data-testid="demo-code"
      aria-label={`Demo check-in code ${code}`}
    >
      <KeyRound size={16} aria-hidden />
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wide text-muted">Demo code</div>
        <div className="cz-display text-xl tracking-[0.25em]">{code}</div>
      </div>
    </div>
  );
}
