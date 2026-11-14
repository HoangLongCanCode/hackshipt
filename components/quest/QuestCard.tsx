'use client';

import { Card, Pill } from '@/components/ui';
import { CATEGORY_META } from '@/lib/constants';
import type { QuestDTO } from '@/lib/contracts';
import { fmtDay, fmtTime } from '@/lib/dates';
import CategoryChip from './CategoryChip';
import DifficultyStars from './DifficultyStars';
import RewardBadge from './RewardBadge';

export default function QuestCard({ quest, selected, onClick }: { quest: QuestDTO; selected?: boolean; onClick?: () => void }) {
  const m = CATEGORY_META[quest.category];
  return (
    <Card
      interactive
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={!!selected}
      data-testid="quest-card"
      className={`space-y-2 ${selected ? 'ring-2 ring-accent' : ''}`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-bold leading-tight">{quest.title}</div>
        {quest.myStatus && quest.myStatus !== 'ABANDONED' && <Pill tone="leaf">{quest.myStatus.replace('_', ' ').toLowerCase()}</Pill>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CategoryChip staticChip label={m.label} emoji={m.emoji} color={m.color} />
        <DifficultyStars value={quest.difficulty} />
        <span className="text-xs text-muted">
          {fmtDay(quest.date)} {fmtTime(quest.time)} · {quest.durationMin} min · {quest.neighborhood}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <RewardBadge credits={quest.rewardCredits} xp={quest.rewardXp} />
        {quest.capacity > 1 && <span className="text-xs text-muted">{quest.spotsLeft} spots left</span>}
      </div>
    </Card>
  );
}
