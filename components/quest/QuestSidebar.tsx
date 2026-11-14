'use client';

import { X } from 'lucide-react';
import { Button, EmptyState, SkeletonCard } from '@/components/ui';
import { CATEGORIES, type Category, type QuestDTO } from '@/lib/contracts';
import { CATEGORY_META } from '@/lib/constants';
import type { DateFilter } from '@/lib/dates';
import CategoryChip from './CategoryChip';
import QuestCard from './QuestCard';

export interface QuestSidebarProps {
  open: boolean;
  onClose: () => void;
  quests: QuestDTO[] | undefined;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  category?: Category;
  dateFilter: DateFilter;
  onDate: (f: DateFilter) => void;
  onCategory: (c: Category | undefined) => void;
  area: string | null;
  onClearArea: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Left drawer: category filters + the quest list. Closed by default so the map stays clear. */
export default function QuestSidebar({ open, onClose, quests, loading, error, onRetry, category, dateFilter, onDate, onCategory, area, onClearArea, selectedId, onSelect }: QuestSidebarProps) {
  return (
    <aside
      aria-hidden={!open}
      className={`fixed bottom-[88px] left-0 top-0 z-40 flex w-[min(88vw,340px)] flex-col border-r-[1.5px] border-[var(--cz-outline)] bg-[var(--cz-paper)] shadow-[var(--cz-shadow-lg)] transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ transitionTimingFunction: 'var(--cz-ease)' }}
      data-testid="quest-sidebar"
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-[84px]">
        <h2 className="cz-display text-xl">Quests</h2>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close sidebar" icon={<X size={18} />} />
      </div>

      <div className="px-4 pb-3">
        <div className="cz-eyebrow mb-2">When</div>
        <div className="mb-3 flex flex-wrap items-center gap-2" data-testid="date-filters">
          {([['any', 'Any day'], ['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'Next 7 days']] as const).map(([k, label]) => (
            <button key={k} className="cz-chip" aria-pressed={dateFilter.kind === k} onClick={() => onDate({ kind: k })}>
              {label}
            </button>
          ))}
          <label className="cz-chip" aria-pressed={dateFilter.kind === 'date'}>
            <span className="sr-only">Pick a date</span>
            <input
              type="date"
              value={dateFilter.kind === 'date' ? dateFilter.date : ''}
              onChange={(e) => onDate(e.target.value ? { kind: 'date', date: e.target.value } : { kind: 'any' })}
              className="bg-transparent text-sm outline-none"
            />
          </label>
        </div>
        <div className="cz-eyebrow mb-2">Type</div>
        <div className="flex flex-wrap gap-2" data-testid="filters">
          {CATEGORIES.map((c) => {
            const m = CATEGORY_META[c];
            return <CategoryChip key={c} label={m.label} emoji={m.emoji} color={m.color} selected={category === c} onClick={() => onCategory(category === c ? undefined : c)} />;
          })}
        </div>
        {area && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-[var(--cz-paper-2)] px-3 py-2 text-sm">
            <span>
              Only <b>{area}</b>
            </span>
            <button className="font-bold text-[var(--cz-coral-deep)]" onClick={onClearArea}>
              Show all
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-6" data-testid="quest-list">
        {error ? (
          <EmptyState emoji="😵" title="Couldn't load quests" action={<Button onClick={onRetry}>Try again</Button>} />
        ) : loading || !quests ? (
          <SkeletonCard />
        ) : quests.length === 0 ? (
          <EmptyState title="No quests here" message={area ? 'Try another district or clear the filter.' : 'Try another day or category.'} />
        ) : (
          <>
            <div className="text-xs text-muted">{quests.length} quest{quests.length === 1 ? '' : 's'}</div>
            {quests.map((q) => (
              <QuestCard key={q.id} quest={q} selected={q.id === selectedId} onClick={() => onSelect(q.id)} />
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
