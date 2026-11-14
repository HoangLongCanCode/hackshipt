'use client';

import { Check } from 'lucide-react';
import { Card, Pill, ProgressBar } from '@/components/ui';
import type { ChainDTO } from '@/lib/contracts';

export default function ChainProgress({ chain, onStepClick }: { chain: ChainDTO; onStepClick?: (questId: string) => void }) {
  const done = chain.steps.filter((s) => s.done).length;
  return (
    <Card className="min-w-[260px] max-w-[300px] shrink-0 space-y-2" data-testid="chain-progress">
      <div className="flex items-center justify-between gap-2">
        <div className="font-bold leading-tight">{chain.title}</div>
        <Pill tone="coral">+{chain.bonusCredits} bonus</Pill>
      </div>
      <ProgressBar value={chain.steps.length ? (done / chain.steps.length) * 100 : 0} tone="gold" size="sm" label={`${done} of ${chain.steps.length} steps`} />
      <ol className="space-y-1 text-sm">
        {chain.steps.map((s) => (
          <li key={s.questId}>
            <button type="button" className="flex w-full items-center gap-2 text-left" onClick={() => onStepClick?.(s.questId)}>
              <span className={`grid h-5 w-5 place-items-center rounded-full border text-[11px] ${s.done ? 'bg-xp text-white' : ''}`}>
                {s.done ? <Check size={12} /> : s.order}
              </span>
              <span className={s.done ? 'line-through opacity-60' : ''}>{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </Card>
  );
}
